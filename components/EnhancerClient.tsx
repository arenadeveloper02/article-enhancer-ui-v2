"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, RotateCcw, Sparkles } from 'lucide-react'
import type {
  EnhanceInput,
  RunPhase,
  SectionBuffers,
  SectionStatus,
  StageKey,
  StageStatus,
} from '@/lib/types'
import {
  decodeEscapes,
  detectFallbackTarget,
  extractFallbackBuffers,
  isHeartbeatText,
  parseCoverage,
  parseGapAnalysis,
  parseRecommendations,
  resolveBlockTarget,
} from '@/lib/stream'
import ArticleForm from '@/components/ArticleForm'
import ProgressChecklist from '@/components/ProgressChecklist'
import StatusChip from '@/components/StatusChip'
import EnhancedArticleSection from '@/components/EnhancedArticleSection'
import GapAnalysisSection from '@/components/GapAnalysisSection'
import RecommendationsSection from '@/components/RecommendationsSection'
import CoverageSection from '@/components/CoverageSection'

const STAGE_KEYS: StageKey[] = ['gap', 'recs', 'article', 'coverage']

const STAGE_STATUS_TEXT: Record<StageKey, string> = {
  gap: 'Analyzing gaps\u2026',
  recs: 'Generating recommendations\u2026',
  article: 'Writing enhanced draft\u2026',
  coverage: 'Verifying coverage\u2026',
}

const EMPTY_BUFFERS: SectionBuffers = { gap: '', recs: '', article: '', coverage: '' }

const INITIAL_STAGES: Record<StageKey, StageStatus> = {
  gap: 'pending',
  recs: 'pending',
  article: 'pending',
  coverage: 'pending',
}

export default function EnhancerClient() {
  const [phase, setPhase] = useState<RunPhase>('idle')
  const [sections, setSections] = useState<SectionBuffers>(EMPTY_BUFFERS)
  const [stages, setStages] = useState<Record<StageKey, StageStatus>>(INITIAL_STAGES)
  const [statusMessage, setStatusMessage] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const buffersRef = useRef<SectionBuffers>({ ...EMPTY_BUFFERS })
  const unknownRef = useRef<Record<string, string>>({})
  const unknownMapRef = useRef<Record<string, StageKey>>({})
  const activeStageRef = useRef<StageKey | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastInputRef = useRef<EnhanceInput | null>(null)

  useEffect(() => {
    if (phase !== 'running') return
    const started = Date.now()
    setElapsed(0)
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const markStageActive = (stage: StageKey) => {
    if (activeStageRef.current === stage) return
    const previous = activeStageRef.current
    activeStageRef.current = stage
    setStages((prev) => {
      const next = { ...prev }
      if (previous && next[previous] === 'active') next[previous] = 'done'
      if (next[stage] === 'pending') next[stage] = 'active'
      return next
    })
  }

  const appendToSection = (target: StageKey, chunk: string) => {
    const next: SectionBuffers = { ...buffersRef.current }
    next[target] = next[target] + chunk
    buffersRef.current = next
    setSections(next)
    markStageActive(target)
  }

  const finishRun = () => {
    setStages((prev) => {
      const next = { ...prev }
      for (const key of STAGE_KEYS) {
        if (buffersRef.current[key].trim().length > 0 || next[key] === 'active') {
          next[key] = 'done'
        }
      }
      return next
    })
    setStatusMessage('Enhancement complete')
    setPhase('done')
  }

  const processLine = (line: string): boolean => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) return false
    const payload = trimmed.slice(5).trim()
    if (payload === '[DONE]') return true

    let parsed: unknown
    try {
      parsed = JSON.parse(payload)
    } catch {
      return false
    }
    if (typeof parsed !== 'object' || parsed === null) return false
    const record = parsed as Record<string, unknown>
    const blockId = typeof record.blockId === 'string' ? record.blockId : null
    const chunk = typeof record.chunk === 'string' ? record.chunk : null

    if (!blockId || chunk === null) {
      const candidates = [record.message, record.status, record.event]
      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
          setStatusMessage(decodeEscapes(candidate).trim())
          break
        }
      }
      return false
    }

    if (isHeartbeatText(chunk)) {
      setStatusMessage(decodeEscapes(chunk).trim())
      return false
    }

    const target = resolveBlockTarget(blockId)
    if (target === 'theme') {
      setStatusMessage('Extracting article themes\u2026')
      return false
    }
    if (target === 'research') {
      setStatusMessage('Researching competitors (Exa)\u2026')
      return false
    }
    if (target) {
      setStatusMessage(STAGE_STATUS_TEXT[target])
      appendToSection(target, chunk)
      return false
    }

    const mapped = unknownMapRef.current[blockId]
    if (mapped) {
      appendToSection(mapped, chunk)
      return false
    }
    unknownRef.current[blockId] = (unknownRef.current[blockId] ?? '') + chunk
    const detected = detectFallbackTarget(unknownRef.current[blockId])
    if (detected) {
      unknownMapRef.current[blockId] = detected
      appendToSection(detected, unknownRef.current[blockId])
      delete unknownRef.current[blockId]
    }
    return false
  }

  const runStream = async (input: EnhanceInput, controller: AbortController) => {
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_url: input.articleUrl,
          article_text: input.articleText,
          content_type: input.contentType,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        let message = text
        try {
          const parsedError = JSON.parse(text) as { error?: string }
          if (parsedError.error) message = parsedError.error
        } catch {
          /* keep raw text */
        }
        throw new Error(message || `Request failed (${res.status})`)
      }

      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const text = await res.text()
        const fallback = extractFallbackBuffers(text)
        const next: SectionBuffers = { ...buffersRef.current, ...fallback }
        buffersRef.current = next
        setSections(next)
        finishRun()
        return
      }

      if (!res.body) throw new Error('No response stream received')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let doneSeen = false

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let newlineIndex = buffer.indexOf('\n')
        while (newlineIndex >= 0) {
          const line = buffer.slice(0, newlineIndex)
          buffer = buffer.slice(newlineIndex + 1)
          if (processLine(line)) {
            doneSeen = true
            break
          }
          newlineIndex = buffer.indexOf('\n')
        }
        if (doneSeen) break
      }

      if (!doneSeen && buffer.trim()) processLine(buffer)
      finishRun()
    } catch (err) {
      if ((err instanceof DOMException || err instanceof Error) && err.name === 'AbortError') return
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong while streaming results.')
      setPhase('error')
    }
  }

  const startRun = (input: EnhanceInput) => {
    lastInputRef.current = input
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    buffersRef.current = { ...EMPTY_BUFFERS }
    unknownRef.current = {}
    unknownMapRef.current = {}
    activeStageRef.current = null
    setSections({ ...EMPTY_BUFFERS })
    setStages({ ...INITIAL_STAGES })
    setErrorMessage(null)
    setElapsed(0)
    setStatusMessage('Submitting article\u2026')
    setPhase('running')
    void runStream(input, controller)
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    abortRef.current = null
    activeStageRef.current = null
    buffersRef.current = { ...EMPTY_BUFFERS }
    setSections({ ...EMPTY_BUFFERS })
    setStages({ ...INITIAL_STAGES })
    setStatusMessage('')
    setErrorMessage(null)
    setElapsed(0)
    setPhase('idle')
  }

  const handleRetry = () => {
    if (lastInputRef.current) startRun(lastInputRef.current)
  }

  const gapData = useMemo(() => parseGapAnalysis(sections.gap), [sections.gap])
  const recommendationItems = useMemo(() => parseRecommendations(sections.recs), [sections.recs])
  const coverageData = useMemo(() => parseCoverage(sections.coverage), [sections.coverage])
  const articleContent = useMemo(() => decodeEscapes(sections.article), [sections.article])

  const sectionStatus = (key: StageKey): SectionStatus => {
    const hasData = sections[key].trim().length > 0
    if (phase === 'running') return hasData ? 'streaming' : 'pending'
    if (phase === 'done') return hasData ? 'done' : 'empty'
    if (phase === 'error') return hasData ? 'done' : 'empty'
    return 'pending'
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-12 sm:pt-16">
      <header className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" /> SEO enhancement pipeline
        </span>
        <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-ink">Article Enhancer</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
          Submit an article and watch the pipeline analyze gaps, generate recommendations, rewrite an enhanced
          draft, and verify coverage \u2014 live, token by token.
        </p>
      </header>

      <ArticleForm running={phase === 'running'} onSubmit={startRun} onCancel={handleCancel} />

      {phase !== 'idle' && (
        <section className="mt-8" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusChip message={statusMessage} elapsed={elapsed} running={phase === 'running'} />
          </div>

          {phase === 'running' && <div className="progress-line mt-4" aria-hidden="true" />}

          {phase === 'error' && (
            <div className="section-enter mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
                <div className="min-w-0">
                  <h2 className="font-heading text-sm font-semibold text-rose-800">Enhancement failed</h2>
                  <p className="mt-1 break-words text-sm text-rose-700">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                  >
                    <RotateCcw className="h-4 w-4" /> Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
            <ProgressChecklist stages={stages} />
            <div className="min-w-0 space-y-6">
              <EnhancedArticleSection content={articleContent} status={sectionStatus('article')} />
              <GapAnalysisSection data={gapData} raw={sections.gap} status={sectionStatus('gap')} />
              <RecommendationsSection items={recommendationItems} raw={sections.recs} status={sectionStatus('recs')} />
              <CoverageSection data={coverageData} raw={sections.coverage} status={sectionStatus('coverage')} />
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
