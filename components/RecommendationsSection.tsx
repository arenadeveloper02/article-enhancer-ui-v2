import { Lightbulb } from 'lucide-react'
import type { RecommendationItem, SectionStatus } from '@/lib/types'
import { decodeEscapes } from '@/lib/stream'
import SectionCard, { SkeletonLines } from '@/components/SectionCard'

interface RecommendationsSectionProps {
  items: RecommendationItem[] | null
  raw: string
  status: SectionStatus
}

function priorityRank(priority: string | null): number {
  if (!priority) return 3
  const value = priority.toLowerCase().trim()
  if (/high|critical/.test(value) || value === '1') return 0
  if (/med/.test(value) || value === '2') return 1
  if (/low/.test(value) || value === '3') return 2
  return 3
}

function priorityClass(priority: string): string {
  const value = priority.toLowerCase()
  if (/high|critical/.test(value)) return 'bg-rose-100 text-rose-700'
  if (/med/.test(value)) return 'bg-amber-100 text-amber-700'
  if (/low/.test(value)) return 'bg-emerald-100 text-emerald-700'
  return 'bg-indigo-100 text-indigo-700'
}

export default function RecommendationsSection({ items, raw, status }: RecommendationsSectionProps) {
  const sorted = items ? [...items].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority)) : null

  return (
    <SectionCard title="Recommendations" icon={<Lightbulb className="h-5 w-5 text-amber-500" />} status={status}>
      {sorted && sorted.length > 0 ? (
        <ol className="space-y-3">
          {sorted.map((item, index) => (
            <li
              key={index}
              className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-sm font-semibold text-ink">{item.title}</h3>
                    {item.priority && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${priorityClass(item.priority)}`}
                      >
                        {item.priority}
                      </span>
                    )}
                    {item.category && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {item.category}
                      </span>
                    )}
                  </div>
                  {item.detail && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.detail}</p>}
                </div>
              </div>
            </li>
          ))}
        </ol>
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
