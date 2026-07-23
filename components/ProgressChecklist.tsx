import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import type { StageKey, StageStatus } from '@/lib/types'

const STAGES: { key: StageKey; label: string }[] = [
  { key: 'gap', label: 'Analyzing gaps' },
  { key: 'recs', label: 'Generating recommendations' },
  { key: 'article', label: 'Writing enhanced draft' },
  { key: 'coverage', label: 'Verifying coverage' },
]

interface ProgressChecklistProps {
  stages: Record<StageKey, StageStatus>
}

export default function ProgressChecklist({ stages }: ProgressChecklistProps) {
  return (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-heading text-sm font-semibold text-ink">Pipeline progress</h2>
      <ol className="mt-3 space-y-3">
        {STAGES.map(({ key, label }) => {
          const status = stages[key]
          return (
            <li
              key={key}
              className={`flex items-center gap-2.5 text-sm ${
                status === 'pending'
                  ? 'text-slate-400'
                  : status === 'active'
                    ? 'font-medium text-indigo-700'
                    : 'text-emerald-700'
              }`}
            >
              {status === 'pending' && <Circle className="h-4 w-4 flex-shrink-0" />}
              {status === 'active' && <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />}
              {status === 'done' && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
              <span>{label}</span>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
