import type { GapAnalysisData } from '@/lib/types';
import { parseGapAnalysis } from '@/lib/stream';

interface GapAnalysisCardProps {
  raw: string;
}

interface ListSectionProps {
  title: string;
  items: string[];
  bulletClass: string;
}

function ListSection({ title, items, bulletClass }: ListSectionProps) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, index) => (
          <li key={`${index}-${item.slice(0, 24)}`} className="flex items-start gap-2 text-sm text-slate-700">
            <span className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${bulletClass}`} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function GapAnalysisCard({ raw }: GapAnalysisCardProps) {
  const data: GapAnalysisData | null = parseGapAnalysis(raw);

  return (
    <article className="result-card">
      <h2 className="card-title">Gap Analysis</h2>
      {data ? (
        <div className="mt-4 space-y-5">
          <ListSection
            title="Competitor strengths"
            items={data.competitor_strengths}
            bulletClass="bg-indigo-500"
          />
          <ListSection title="Coverage gaps" items={data.coverage_gaps} bulletClass="bg-rose-500" />
          <ListSection
            title="Underdeveloped sections"
            items={data.underdeveloped_sections}
            bulletClass="bg-amber-500"
          />
        </div>
      ) : (
        <>
          <p className="mt-2 text-xs font-medium text-slate-400">Receiving analysis…</p>
          <p className="raw-fallback">{raw}</p>
        </>
      )}
    </article>
  );
}
