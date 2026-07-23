import type {
  BlockTarget,
  CoverageCriterion,
  CoverageData,
  GapAnalysisData,
  RecommendationItem,
  SectionBuffers,
  StageKey,
} from './types'

const BLOCK_PREFIXES: { prefix: string; target: BlockTarget }[] = [
  { prefix: '65f7256c', target: 'theme' },
  { prefix: '648b01f8', target: 'research' },
  { prefix: '0f239b6f', target: 'gap' },
  { prefix: '5ae6657d', target: 'recs' },
  { prefix: '88db1a98', target: 'article' },
  { prefix: 'c4bd5114', target: 'coverage' },
]

export function resolveBlockTarget(blockId: string): BlockTarget | null {
  for (const entry of BLOCK_PREFIXES) {
    if (blockId.startsWith(entry.prefix)) return entry.target
  }
  return null
}

export function decodeEscapes(input: string): string {
  return input
    .replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
}

export function isHeartbeatText(text: string): boolean {
  return /(usually takes[\s\S]{0,80}elapsed)|heartbeat|keep-?alive/i.test(text)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

export function tryParseJson(text: string): unknown {
  const trimmed = text.trim()
  if (!trimmed) return null
  const attempts: string[] = [trimmed]
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) attempts.push(trimmed.slice(firstBrace, lastBrace + 1))
  const firstBracket = trimmed.indexOf('[')
  const lastBracket = trimmed.lastIndexOf(']')
  if (firstBracket >= 0 && lastBracket > firstBracket) attempts.push(trimmed.slice(firstBracket, lastBracket + 1))
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt)
    } catch {
      /* try next candidate */
    }
  }
  return null
}

function firstString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

function findArray(obj: Record<string, unknown>, key: string): unknown[] {
  const direct = obj[key]
  if (Array.isArray(direct)) return direct
  for (const value of Object.values(obj)) {
    const nested = asRecord(value)
    if (nested) {
      const inner = nested[key]
      if (Array.isArray(inner)) return inner
    }
  }
  return []
}

export function itemToText(item: unknown): string {
  if (typeof item === 'string') return decodeEscapes(item).trim()
  if (typeof item === 'number' || typeof item === 'boolean') return String(item)
  const record = asRecord(item)
  if (record) {
    const parts: string[] = []
    const preferredKeys = ['title', 'name', 'section', 'strength', 'gap', 'topic', 'description', 'detail', 'summary', 'text', 'reason']
    for (const key of preferredKeys) {
      const value = record[key]
      if (typeof value === 'string' && value.trim()) parts.push(decodeEscapes(value).trim())
      if (parts.length === 2) break
    }
    if (parts.length > 0) return parts.join(' \u2014 ')
    return decodeEscapes(JSON.stringify(record))
  }
  return String(item)
}

export function parseGapAnalysis(raw: string): GapAnalysisData | null {
  const parsed = tryParseJson(raw) ?? tryParseJson(decodeEscapes(raw))
  const obj = asRecord(parsed)
  if (!obj) return null
  const competitorStrengths = findArray(obj, 'competitor_strengths').map(itemToText)
  const coverageGaps = findArray(obj, 'coverage_gaps').map(itemToText)
  const underdevelopedSections = findArray(obj, 'underdeveloped_sections').map(itemToText)
  if (competitorStrengths.length === 0 && coverageGaps.length === 0 && underdevelopedSections.length === 0) {
    return null
  }
  return { competitorStrengths, coverageGaps, underdevelopedSections }
}

function toRecommendation(item: unknown, index: number): RecommendationItem {
  if (typeof item === 'string') {
    const text = decodeEscapes(item).trim()
    const separator = text.indexOf(': ')
    if (separator > 0 && separator < 80) {
      return { title: text.slice(0, separator), detail: text.slice(separator + 2), priority: null, category: null }
    }
    return { title: `Recommendation ${index + 1}`, detail: text, priority: null, category: null }
  }
  const record = asRecord(item)
  if (record) {
    const title = firstString(record, ['title', 'headline', 'recommendation', 'name', 'action']) ?? `Recommendation ${index + 1}`
    const detail = firstString(record, ['detail', 'details', 'description', 'body', 'rationale', 'explanation', 'why']) ?? ''
    const priority = firstString(record, ['priority', 'importance', 'severity'])
    const category = firstString(record, ['category', 'type', 'area'])
    return { title: decodeEscapes(title).trim(), detail: decodeEscapes(detail).trim(), priority, category }
  }
  return { title: `Recommendation ${index + 1}`, detail: String(item), priority: null, category: null }
}

export function parseRecommendations(raw: string): RecommendationItem[] | null {
  const parsed = tryParseJson(raw) ?? tryParseJson(decodeEscapes(raw))
  if (parsed === null) return null
  let list: unknown[] = []
  if (Array.isArray(parsed)) {
    list = parsed
  } else {
    const obj = asRecord(parsed)
    if (obj) list = findArray(obj, 'recommendations')
  }
  if (list.length === 0) return null
  return list.map(toRecommendation)
}

function toCriterion(item: unknown, index: number): CoverageCriterion {
  if (typeof item === 'string') {
    return { name: decodeEscapes(item).trim(), passed: null, score: null, notes: null }
  }
  const record = asRecord(item)
  if (!record) return { name: `Criterion ${index + 1}`, passed: null, score: null, notes: null }
  const name = firstString(record, ['criterion', 'name', 'title', 'label']) ?? `Criterion ${index + 1}`
  const passedValue = record['passed'] ?? record['met'] ?? record['pass']
  let passed: boolean | null = null
  if (typeof passedValue === 'boolean') {
    passed = passedValue
  } else if (typeof passedValue === 'string') {
    passed = /^(true|pass|passed|yes|met)$/i.test(passedValue.trim())
  }
  const scoreValue = record['score'] ?? record['rating']
  const score = typeof scoreValue === 'number' ? String(scoreValue) : typeof scoreValue === 'string' && scoreValue.trim() ? scoreValue : null
  const notes = firstString(record, ['notes', 'note', 'detail', 'details', 'explanation', 'reason', 'comment'])
  return {
    name: decodeEscapes(name).trim(),
    passed,
    score,
    notes: notes ? decodeEscapes(notes).trim() : null,
  }
}

function pickCoverageSource(obj: Record<string, unknown>): Record<string, unknown> {
  if ('overall_score' in obj || 'criteria' in obj || 'passed' in obj || 'summary' in obj) return obj
  for (const value of Object.values(obj)) {
    const nested = asRecord(value)
    if (nested && ('overall_score' in nested || 'criteria' in nested || 'passed' in nested)) return nested
  }
  return obj
}

export function parseCoverage(raw: string): CoverageData | null {
  const parsed = tryParseJson(raw) ?? tryParseJson(decodeEscapes(raw))
  const obj = asRecord(parsed)
  if (!obj) return null
  const source = pickCoverageSource(obj)
  const scoreValue = source['overall_score']
  let overallScore: number | null = null
  if (typeof scoreValue === 'number' && Number.isFinite(scoreValue)) {
    overallScore = scoreValue
  } else if (typeof scoreValue === 'string' && scoreValue.trim() !== '' && !Number.isNaN(Number(scoreValue))) {
    overallScore = Number(scoreValue)
  }
  const passedValue = source['passed']
  let passed: boolean | null = null
  if (typeof passedValue === 'boolean') {
    passed = passedValue
  } else if (typeof passedValue === 'string') {
    passed = /^(true|pass|passed|yes)$/i.test(passedValue.trim())
  }
  const summaryValue = source['summary']
  const summary = typeof summaryValue === 'string' ? decodeEscapes(summaryValue).trim() : ''
  const criteriaValue = source['criteria']
  const criteria: CoverageCriterion[] = Array.isArray(criteriaValue) ? criteriaValue.map(toCriterion) : []
  if (overallScore === null && passed === null && !summary && criteria.length === 0) return null
  return { overallScore, passed, summary, criteria }
}

export function detectFallbackTarget(accumulated: string): StageKey | null {
  const trimmed = accumulated.trim()
  if (!trimmed) return null
  const jsonish = trimmed.startsWith('{') || trimmed.startsWith('[')
  if (jsonish) {
    if (
      trimmed.includes('competitor_strengths') ||
      trimmed.includes('coverage_gaps') ||
      trimmed.includes('underdeveloped_sections')
    ) {
      return 'gap'
    }
    if (trimmed.includes('overall_score') || trimmed.includes('"criteria"')) return 'coverage'
    if (trimmed.includes('recommendations')) return 'recs'
    return null
  }
  if (trimmed.length > 280) return 'article'
  return null
}

export function extractFallbackBuffers(text: string): Partial<SectionBuffers> {
  const root = tryParseJson(text)
  const result: Partial<SectionBuffers> = {}
  const gapObj: Record<string, unknown> = {}
  const coverageObj: Record<string, unknown> = {}
  let recsValue: unknown = null

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const entry of value) visit(entry)
      return
    }
    const record = asRecord(value)
    if (!record) return
    for (const [key, val] of Object.entries(record)) {
      const lower = key.toLowerCase()
      if ((lower.includes('enhancedarticlewriter') || lower === 'content') && typeof val === 'string') {
        if (val.length > (result.article?.length ?? 0)) result.article = val
      }
      if (lower.includes('recommendations') && recsValue === null) recsValue = val
      if (lower === 'competitor_strengths' || lower === 'coverage_gaps' || lower === 'underdeveloped_sections') {
        gapObj[lower] = val
      }
      if (lower === 'overall_score' || lower === 'passed' || lower === 'summary' || lower === 'criteria') {
        coverageObj[lower] = val
      }
      visit(val)
    }
  }

  visit(root)

  if (Object.keys(gapObj).length > 0) result.gap = JSON.stringify(gapObj)
  if (Object.keys(coverageObj).length > 0) result.coverage = JSON.stringify(coverageObj)
  if (recsValue !== null) {
    result.recs = typeof recsValue === 'string' ? recsValue : JSON.stringify({ recommendations: recsValue })
  }
  return result
}
