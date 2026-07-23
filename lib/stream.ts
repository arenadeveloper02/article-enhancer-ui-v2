import type { BlockTarget, CoverageCriterion, CoverageData, GapAnalysisData } from '@/lib/types';

const PREFIX_MAP: { prefix: string; target: BlockTarget }[] = [
  { prefix: '65f7256c', target: 'theme' },
  { prefix: '648b01f8', target: 'research' },
  { prefix: '0f239b6f', target: 'gap' },
  { prefix: '5ae6657d', target: 'recommendations' },
  { prefix: '88db1a98', target: 'article' },
  { prefix: 'c4bd5114', target: 'coverage' },
];

const HEARTBEAT_PATTERN = /heartbeat|keepalive|keep-alive|usually takes|elapsed|still working|processing your request|in progress/i;

export function decodeUnicodeEscapes(input: string): string {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

export function isHeartbeatText(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return HEARTBEAT_PATTERN.test(t) && t.length < 280;
}

export function resolveBlockTarget(blockId: string, accumulated: string): BlockTarget {
  const mapped = PREFIX_MAP.find((entry) => blockId.startsWith(entry.prefix));
  if (mapped) return mapped.target;

  const trimmed = accumulated.trim();
  if (HEARTBEAT_PATTERN.test(trimmed)) return 'unknown';

  const jsonish = trimmed.startsWith('{') || trimmed.startsWith('[');
  if (jsonish) {
    if (/overall_score|"passed"|criteria/.test(trimmed)) return 'coverage';
    if (/recommendations/.test(trimmed)) return 'recommendations';
    if (/competitor_strengths|coverage_gaps|underdeveloped_sections/.test(trimmed)) return 'gap';
    return 'unknown';
  }
  if (trimmed.length > 160) return 'article';
  return 'unknown';
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function parseLooseJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;
  let parsed = tryParseJson(trimmed);
  if (typeof parsed === 'string') {
    const inner = tryParseJson(parsed);
    if (inner !== null) parsed = inner;
  }
  if (parsed === null) {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      parsed = tryParseJson(trimmed.slice(start, end + 1));
    }
  }
  return parsed;
}

function toStringItem(value: unknown): string {
  if (typeof value === 'string') return decodeUnicodeEscapes(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const candidate =
      obj.text ?? obj.recommendation ?? obj.title ?? obj.name ?? obj.description ?? obj.section;
    if (typeof candidate === 'string') {
      const detail = typeof obj.details === 'string' ? ` — ${obj.details}` : '';
      return decodeUnicodeEscapes(candidate + detail);
    }
    return JSON.stringify(value);
  }
  return '';
}

export function extractStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(toStringItem).filter((item) => item.length > 0);
}

export function parseGapAnalysis(text: string): GapAnalysisData | null {
  const parsed = parseLooseJson(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  const strengths = extractStringArray(obj.competitor_strengths);
  const gaps = extractStringArray(obj.coverage_gaps);
  const sections = extractStringArray(obj.underdeveloped_sections);
  if (strengths.length === 0 && gaps.length === 0 && sections.length === 0) return null;
  return {
    competitor_strengths: strengths,
    coverage_gaps: gaps,
    underdeveloped_sections: sections,
  };
}

export function parseRecommendations(text: string): string[] | null {
  const parsed = parseLooseJson(text);
  if (Array.isArray(parsed)) {
    const items = extractStringArray(parsed);
    return items.length > 0 ? items : null;
  }
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const items = extractStringArray(obj.recommendations);
    return items.length > 0 ? items : null;
  }
  return null;
}

function normalizeCriterion(value: unknown): CoverageCriterion {
  if (typeof value === 'string') {
    return { name: decodeUnicodeEscapes(value), passed: null, details: '' };
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const name =
      typeof obj.name === 'string'
        ? obj.name
        : typeof obj.criterion === 'string'
          ? obj.criterion
          : typeof obj.title === 'string'
            ? obj.title
            : 'Criterion';
    const passed =
      typeof obj.passed === 'boolean' ? obj.passed : typeof obj.met === 'boolean' ? obj.met : null;
    const details =
      typeof obj.details === 'string'
        ? obj.details
        : typeof obj.reason === 'string'
          ? obj.reason
          : typeof obj.explanation === 'string'
            ? obj.explanation
            : '';
    return { name: decodeUnicodeEscapes(name), passed, details: decodeUnicodeEscapes(details) };
  }
  return { name: 'Criterion', passed: null, details: '' };
}

export function parseCoverage(text: string): CoverageData | null {
  const parsed = parseLooseJson(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  const hasAny =
    'overall_score' in obj || 'passed' in obj || 'summary' in obj || 'criteria' in obj;
  if (!hasAny) return null;

  let score: number | null = null;
  if (typeof obj.overall_score === 'number') {
    score = obj.overall_score;
  } else if (typeof obj.overall_score === 'string') {
    const numeric = Number.parseFloat(obj.overall_score);
    if (Number.isFinite(numeric)) score = numeric;
  }

  const passed = typeof obj.passed === 'boolean' ? obj.passed : null;
  const summary = typeof obj.summary === 'string' ? decodeUnicodeEscapes(obj.summary) : '';
  const criteria: CoverageCriterion[] = Array.isArray(obj.criteria)
    ? obj.criteria.map(normalizeCriterion)
    : [];

  return { overall_score: score, passed, summary, criteria };
}

export function findValueByKey(
  value: unknown,
  matcher: (key: string) => boolean
): unknown {
  if (!value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findValueByKey(item, matcher);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  const obj = value as Record<string, unknown>;
  for (const [key, nested] of Object.entries(obj)) {
    if (matcher(key)) return nested;
    const found = findValueByKey(nested, matcher);
    if (found !== undefined) return found;
  }
  return undefined;
}
