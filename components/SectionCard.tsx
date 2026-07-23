import type { ReactNode } from 'react'
import type { SectionStatus } from '@/lib/types'

const STATUS_STYLES: Record<SectionStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-slate-100 text-slate-500' },
  streaming: { label: 'Streaming', className: 'bg-indigo-100 text-indigo-700' },
  done: { label: 'Done', className: 'bg-emerald-100 text-emerald-700' },
  empty: { label: 'No data', className: 'bg-slate-100 text-slate-500' },
}

interface SectionCardProps {
  title: string
  icon: ReactNode
  status: SectionStatus
  accent?: boolean
  children: ReactNode
}

export default function SectionCard({ title, icon, status, accent = false, children }: SectionCardProps) {
  const pill = STATUS_STYLES[status]
  return (
    <section
      className={`section-enter rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${
        accent ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'
      }`}
    >
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <h2 className={`truncate font-heading text-lg font-semibold ${accent ? 'text-indigo-700' : 'text-ink'}`}>
            {title}
          </h2>
        </div>
        <span
          className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${pill.className}`}
        >
          {status === 'streaming' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />}
          {pill.label}
        </span>
      </header>
      {children}
    </section>
  )
}

export function SkeletonLines({ lines }: { lines: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-4" style={{ width: `${Math.max(30, 92 - i * 11)}%` }} />
      ))}
    </div>
  )
}
