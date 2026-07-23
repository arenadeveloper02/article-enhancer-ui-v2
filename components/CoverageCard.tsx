import { parseCoverage } from '@/lib/stream';

interface CoverageCardProps {
  raw: string;
}

export default function CoverageCard({ raw }: CoverageCardProps) {
  const data = parseCoverage(raw);

  return (
    <article className="result-card">
      <h2 className="card-title">Coverage Verification</h2>
      {data ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {data.overall_score !== null && (
              <span className="inline-flex items-baseline gap-1.5 rounded-xl bg-accent-soft px-4 py-2">
                <span className="font-heading text-2xl font-bold text-accent-deep">
                  {Math.round(data.overall_score)}
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  score
                </span>
              </span>
            )}
            {data.passed !== null && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  data.passed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {data.passed ? 'Passed' : 'Needs work'}
              </span>
            )}
          </div>
          {data.summary && <p className="text-sm leading-relaxed text-slate-700">{data.summary}</p>}
          {data.criteria.length > 0 && (
            <ul className="space-y-2">
              {data.criteria.map((criterion, index) => (
                <li key={`${index}-${criterion.name}`} className="flex items-start gap-2 text-sm">
                  <span
                    className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full text-[10px] font-bold ${
                      criterion.passed === true
                        ? 'bg-emerald-100 text-emerald-600'
                        : criterion.passed === false
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                    aria-hidden="true"
                  >
                    {criterion.passed === true ? '✓' : criterion.passed === false ? '✕' : '•'}
                  </span>
                  <span>
                    <span className="font-medium text-ink">{criterion.name}</span>
                    {criterion.details && (
                      <span className="text-slate-500"> — {criterion.details}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <p className="mt-2 text-xs font-medium text-slate-400">Receiving verification…</p>
          <p className="raw-fallback">{raw}</p>
        </>
      )}
    </article>
  );
}
