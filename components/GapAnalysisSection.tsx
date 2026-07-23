import type { ReactNode } from 'react'
import { AlertTriangle, Layers, PencilLine, TrendingUp } from 'lucide-react'
import type { GapAnalysisData, SectionStatus } from '@/lib/types'
import { decodeEscapes } from '@/lib/stream'
import SectionCard, { SkeletonLines } from '@/components/SectionCard'

interface GapAnalysisSectionProps {
  data: GapAnalysisData | null
  raw: string
  status: SectionStatus
}

interface SubGroupProps {
  title: string
  icon: ReactNode
  items: string[]
  dotClass: string
  badgeClass: string
}

function SubGroup({ title, icon, items, dotClass, badgeClass }: SubGroupProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-heading text-sm font-semibold text-ink">{title}</h3>
        <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nothing reported.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
              <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function GapAnalysisSection({ data, raw, status }: GapAnalysisSectionProps) {
  return (
    <SectionCard title="Gap Analysis" icon={<Layers className="h-5 w-5 text-sky-600" />} status={status}>
      {data ? (
        <div className="space-y-6">
          <SubGroup
            title="Competitor Strengths"
            icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
            items={data.competitorStrengths}
            dotClass="bg-emerald-500"
            badgeClass="bg-emerald-100 text-emerald-700"
          />
          <SubGroup
            title="Coverage Gaps"
            icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
            items={data.coverageGaps}
            dotClass="bg-amber-500"
            badgeClass="bg-amber-100 text-amber-700"
          />
          <SubGroup
            title="Underdeveloped Sections"
            icon={<PencilLine className="h-4 w-4 text-violet-600" />}
            items={data.underdevelopedSections}
            dotClass="bg-violet-500"
            badgeClass="bg-violet-100 text-violet-700"
          />
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
