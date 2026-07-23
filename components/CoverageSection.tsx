import { CheckCircle2, MinusCircle, ShieldCheck, XCircle } from 'lucide-react'
import type { CoverageData, SectionStatus } from '@/lib/types'
import { decodeEscapes } from '@/lib/stream'
import SectionCard, { SkeletonLines } from '@/components/SectionCard'

interface CoverageSectionProps {
  data: CoverageData | null
  raw: string
  status: SectionStatus
}

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function CoverageSection({ data, raw, status }: CoverageSectionProps) {
  const score = data ? data.overallScore : null
  const pct = score === null ? 0 : Math.max(0, Math.min(100, score <= 10 ? score * 10 : score))
  const gaugeClass = pct < 50 ? 'text-rose-500' : pct < 75 ? 'text-amber-500' : 'text-emerald-500'
  const denominator = score !== null && score <= 10 ? '/10' : '/100'

  return (
    <SectionCard title="Coverage Verification" icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />} status={status}>
      {data ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="relative h-32 w-32 flex-shrink-0">
              <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
                <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  className={gaugeClass}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-3xl font-bold text-ink">
                  {score === null ? '\u2014' : Math.round(score * 10) / 10}
                </span>
                {score !== null && <span className="text-xs font-medium text-slate-400">{denominator}</span>}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              {data.passed !== null && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    data.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {data.passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {data.passed ? 'Pass' : 'Fail'}
                </span>
              )}
              {data.summary && <p className="mt-3 text-sm leading-relaxed text-slate-600">{data.summary}</p>}
            </div>
          </div>

          {data.criteria.length > 0 && (
            <div>
              <h3 className="font-heading text-sm font-semibold text-ink">Criteria checklist</h3>
              <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {data.criteria.map((criterion, index) => (
                  <li key={index} className="flex items-start gap-3 px-4 py-3">
                    {criterion.passed === true && (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    )}
                    {criterion.passed === false && <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />}
                    {criterion.passed === null && (
                      <MinusCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-300" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-ink">{criterion.name}</span>
                        {criterion.score && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {criterion.score}
                          </span>
                        )}
                      </div>
                      {criterion.notes && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{criterion.notes}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : status === 'pending' || status === 'streaming' ? (
        <SkeletonLines lines={4} />
      ) : raw.trim() ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{decodeEscapes(raw)}</p>
      ) : (
        <p className="text-sm text-slate-500">No data returned for this section.</p>
      )}
    </SectionCard>
  )
}
