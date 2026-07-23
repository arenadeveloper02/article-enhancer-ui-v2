export interface EnhanceInput {
  articleUrl: string
  articleText: string
  contentType: string
}

export interface SectionBuffers {
  gap: string
  recs: string
  article: string
  coverage: string
}

export type StageKey = keyof SectionBuffers

export type BlockTarget = StageKey | 'theme' | 'research'

export type StageStatus = 'pending' | 'active' | 'done'

export type SectionStatus = 'pending' | 'streaming' | 'done' | 'empty'

export type RunPhase = 'idle' | 'running' | 'done' | 'error'

export interface GapAnalysisData {
  competitorStrengths: string[]
  coverageGaps: string[]
  underdevelopedSections: string[]
}

export interface RecommendationItem {
  title: string
  detail: string
  priority: string | null
  category: string | null
}

export interface CoverageCriterion {
  name: string
  passed: boolean | null
  score: string | null
  notes: string | null
}

export interface CoverageData {
  overallScore: number | null
  passed: boolean | null
  summary: string
  criteria: CoverageCriterion[]
}
