export type StageKey = 'gap' | 'recommendations' | 'article' | 'coverage';

export type StageStatus = 'pending' | 'active' | 'done';

export type RunStatus = 'idle' | 'running' | 'done' | 'error';

export type BlockTarget = StageKey | 'theme' | 'research' | 'unknown';

export interface StageItem {
  key: StageKey;
  label: string;
  status: StageStatus;
}

export interface EnhanceInput {
  article_url: string;
  article_text: string;
  content_type: string;
}

export interface GapAnalysisData {
  competitor_strengths: string[];
  coverage_gaps: string[];
  underdeveloped_sections: string[];
}

export interface CoverageCriterion {
  name: string;
  passed: boolean | null;
  details: string;
}

export interface CoverageData {
  overall_score: number | null;
  passed: boolean | null;
  summary: string;
  criteria: CoverageCriterion[];
}
