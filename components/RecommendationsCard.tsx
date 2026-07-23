import { parseRecommendations } from '@/lib/stream';

interface RecommendationsCardProps {
  raw: string;
}

export default function RecommendationsCard({ raw }: RecommendationsCardProps) {
  const items = parseRecommendations(raw);

  return (
    <article className="result-card">
      <h2 className="card-title">Recommendations</h2>
      {items ? (
        <ol className="mt-4 space-y-3">
          {items.map((item, index) => (
            <li
              key={`${index}-${item.slice(0, 24)}`}
              className="flex items-start gap-3 text-sm text-slate-700"
            >
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent-soft font-heading text-xs font-semibold text-accent-deep">
                {index + 1}
              </span>
              <span className="pt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <>
          <p className="mt-2 text-xs font-medium text-slate-400">Receiving recommendations…</p>
          <p className="raw-fallback">{raw}</p>
        </>
      )}
    </article>
  );
}
