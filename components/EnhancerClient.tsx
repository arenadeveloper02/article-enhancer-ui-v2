"use client"

import { useEffect, useRef, useState } from 'react';
import type {
  EnhanceInput,
  RunStatus,
  StageItem,
  StageKey,
  StageStatus,
} from '@/lib/types';
import {
  decodeUnicodeEscapes,
  findValueByKey,
  isHeartbeatText,
  resolveBlockTarget,
} from '@/lib/stream';
import ArticleForm from '@/components/ArticleForm';
import ProgressChecklist from '@/components/ProgressChecklist';
import StatusChip from '@/components/StatusChip';
import GapAnalysisCard from '@/components/GapAnalysisCard';
import RecommendationsCard from '@/components/RecommendationsCard';
import EnhancedArticleCard from '@/components/EnhancedArticleCard';
import CoverageCard from '@/components/CoverageCard';
import ErrorCard from '@/components/ErrorCard';

const STAGE_ORDER: StageKey[] = ['gap', 'recommendations', 'article', 'coverage'];

const STAGE_LABELS: Record<StageKey, string> = {
  gap: 'Analyzing gaps',
  recommendations: 'Generating recommendations',
  article: 'Writing enhanced draft',
  coverage: 'Verifying coverage',
};

const STAGE_STATUS_MESSAGES: Record<StageKey, string> = {
  gap: 'Analyzing content gaps…',
  recommendations: 'Generating recommendations…',
  article: 'Writing the enhanced draft…',
  coverage: 'Verifying coverage…',
};

type PanelState = Record<StageKey, string>;

const EMPTY_PANELS: PanelState = { gap: '', recommendations: '', article: '', coverage: '' };

const PENDING_STAGES: Record<StageKey, StageStatus> = {
  gap: 'pending',
  recommendations: 'pending',
  article: 'pending',
  coverage: 'pending',
};

export default function EnhancerClient() {
  const [status, setStatus] = useState<RunStatus>('idle');
  const [stages, setStages] = useState<Record<StageKey, StageStatus>>(PENDING_STAGES);
  const [panels, setPanels] = useState<PanelState>(EMPTY_PANELS);
  const [statusMessage, setStatusMessage] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const accRef = useRef<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);
  const lastInputRef = useRef<EnhanceInput | null>(null);

  // Live elapsed-time counter that ticks every second while streaming.
  useEffect(() => {
    if (status !== 'running') return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [status]);

  // Abort any in-flight request when the component unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const markStageActive = (key: StageKey) => {
    setStages((prev) => {
      if (prev[key] !== 'pending') return prev;
      const next = { ...prev };
      const index = STAGE_ORDER.indexOf(key);
      STAGE_ORDER.forEach((stageKey, i) => {
        if (i < index && next[stageKey] === 'active') next[stageKey] = 'done';
      });
      next[key] = 'active';
      return next;
    });
  };

  const finalizeRun = () => {
    setStages((prev) => {
      const next = { ...prev };
      STAGE_ORDER.forEach((stageKey) => {
        if (next[stageKey] === 'active') next[stageKey] = 'done';
      });
      return next;
    });
    setStatus('done');
    setStatusMessage('Enhancement complete');
  };

  const handleChunk = (blockId: string, chunk: string) => {
    accRef.current[blockId] = (accRef.current[blockId] ?? '') + chunk;
    const accumulated = accRef.current[blockId];
    const target = resolveBlockTarget(blockId, accumulated);

    if (target === 'theme') {
      setStatusMessage('Extracting article themes…');
      return;
    }
    if (target === 'research') {
      setStatusMessage('Researching competitor coverage…');
      return;
    }
    if (target === 'unknown') {
      // Heartbeats and unclassified short blobs go to the status chip, never to content.
      const lines = accumulated.trim().split('\n');
      const lastLine = (lines.length > 0 ? lines[lines.length - 1] : '').trim();
      if (lastLine && isHeartbeatText(lastLine)) {
        setStatusMessage(decodeUnicodeEscapes(lastLine));
      }
      return;
    }

    markStageActive(target);
    setStatusMessage(STAGE_STATUS_MESSAGES[target]);
    const decoded = decodeUnicodeEscapes(accumulated);
    setPanels((prev) => ({ ...prev, [target]: decoded }));
  };

  // Returns true when the [DONE] sentinel is seen.
  const processLine = (rawLine: string): boolean => {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) return false;
    const payload = line.slice(5).trim();
    if (!payload) return false;
    if (payload === '[DONE]') return true;

    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      // Partial or non-JSON line — swallow and continue.
      return false;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;

    const event = parsed as Record<string, unknown>;
    const blockId = typeof event.blockId === 'string' ? event.blockId : null;
    const chunk = typeof event.chunk === 'string' ? event.chunk : null;

    if (blockId && chunk !== null) {
      handleChunk(blockId, chunk);
      return false;
    }

    // Heartbeat / progress / status events go to the status chip.
    const message =
      typeof event.message === 'string'
        ? event.message
        : typeof event.status === 'string'
          ? event.status
          : typeof event.event === 'string'
            ? event.event
            : null;
    if (message) setStatusMessage(decodeUnicodeEscapes(message));
    return false;
  };

  const handleJsonFallback = (text: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setPanels((prev) => ({ ...prev, article: decodeUnicodeEscapes(text) }));
      return;
    }

    const content = findValueByKey(parsed, (k) => k === 'content' || k.endsWith('.content'));

    let recommendations = findValueByKey(
      parsed,
      (k) => k === 'recommendations' || k.endsWith('.recommendations')
    );
    if (recommendations && typeof recommendations === 'object' && !Array.isArray(recommendations)) {
      const inner = (recommendations as Record<string, unknown>).recommendations;
      if (inner !== undefined) recommendations = inner;
    }

    const gapStrengths = findValueByKey(parsed, (k) => k.includes('competitor_strengths'));
    const gapGaps = findValueByKey(parsed, (k) => k.includes('coverage_gaps'));
    const gapSections = findValueByKey(parsed, (k) => k.includes('underdeveloped_sections'));

    const coverageScore = findValueByKey(parsed, (k) => k.includes('overall_score'));
    const coveragePassed = findValueByKey(parsed, (k) => k === 'passed' || k.endsWith('.passed'));
    const coverageSummary = findValueByKey(parsed, (k) => k === 'summary' || k.endsWith('.summary'));
    const coverageCriteria = findValueByKey(parsed, (k) => k === 'criteria' || k.endsWith('.criteria'));

    setPanels((prev) => ({
      gap:
        gapStrengths !== undefined || gapGaps !== undefined || gapSections !== undefined
          ? JSON.stringify({
              competitor_strengths: gapStrengths ?? [],
              coverage_gaps: gapGaps ?? [],
              underdeveloped_sections: gapSections ?? [],
            })
          : prev.gap,
      recommendations:
        recommendations !== undefined
          ? JSON.stringify({ recommendations })
          : prev.recommendations,
      article: typeof content === 'string' ? decodeUnicodeEscapes(content) : prev.article,
      coverage:
        coverageScore !== undefined || coverageSummary !== undefined || coverageCriteria !== undefined
          ? JSON.stringify({
              overall_score: coverageScore ?? null,
              passed: coveragePassed ?? null,
              summary: coverageSummary ?? '',
              criteria: coverageCriteria ?? [],
            })
          : prev.coverage,
    }));
    setStages({ gap: 'done', recommendations: 'done', article: 'done', coverage: 'done' });
  };

  const run = async (input: EnhanceInput) => {
    // Optimistic UI: reset everything and flip to running before the first byte.
    lastInputRef.current = input;
    accRef.current = {};
    setPanels(EMPTY_PANELS);
    setStages(PENDING_STAGES);
    setErrorMessage('');
    setElapsed(0);
    setStatusMessage('Submitting article to the pipeline…');
    setStatus('running');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text.slice(0, 500) || `Request failed with status ${response.status}.`);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const text = await response.text();
        handleJsonFallback(text);
        setStatus('done');
        setStatusMessage('Enhancement complete');
        return;
      }

      const body = response.body;
      if (!body) throw new Error('The server returned an empty response stream.');

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sawDone = false;
      let streamEnded = false;

      while (!streamEnded && !sawDone) {
        const { done, value } = await reader.read();
        if (done) {
          streamEnded = true;
          continue;
        }
        // Chunks arrive split mid-line: buffer bytes and only process complete lines.
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex = buffer.indexOf('\n');
        while (newlineIndex >= 0) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (processLine(line)) {
            sawDone = true;
            break;
          }
          newlineIndex = buffer.indexOf('\n');
        }
      }

      if (!sawDone && buffer.trim()) {
        processLine(buffer);
      }
      finalizeRun();
    } catch (error) {
      if (controller.signal.aborted) {
        // Cancelled by the user — restore idle state.
        setStatus('idle');
        setStatusMessage('');
        setStages(PENDING_STAGES);
        return;
      }
      setStatus('error');
      setStatusMessage('');
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : 'Something went wrong while streaming results.'
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  const retry = () => {
    const input = lastInputRef.current;
    if (input) void run(input);
  };

  const stageItems: StageItem[] = STAGE_ORDER.map((key) => ({
    key,
    label: STAGE_LABELS[key],
    status: stages[key],
  }));

  const running = status === 'running';
  const showResults = status !== 'idle';

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <header className="text-center">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-accent-deep">
          SEO Enhancement Pipeline
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Article Enhancer
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
          Submit an article and watch the pipeline analyze gaps, generate recommendations, write an
          enhanced draft, and verify coverage — live, as it happens.
        </p>
      </header>

      <ArticleForm running={running} onSubmit={(input) => void run(input)} onCancel={cancel} />

      {showResults && (
        <section className="mt-8 space-y-6" aria-live="polite">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            {running && <div className="progress-line mb-5" aria-hidden="true" />}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold text-ink">Pipeline progress</h2>
              <StatusChip message={statusMessage} elapsed={elapsed} running={running} />
            </div>
            <ProgressChecklist stages={stageItems} />
          </div>

          {status === 'error' && <ErrorCard message={errorMessage} onRetry={retry} />}

          {panels.gap && <GapAnalysisCard raw={panels.gap} />}
          {panels.recommendations && <RecommendationsCard raw={panels.recommendations} />}
          {panels.article && (
            <EnhancedArticleCard
              content={panels.article}
              streaming={running && stages.article === 'active'}
            />
          )}
          {panels.coverage && <CoverageCard raw={panels.coverage} />}
        </section>
      )}
    </div>
  );
}
