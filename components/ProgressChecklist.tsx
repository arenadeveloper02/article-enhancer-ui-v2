import type { StageItem } from '@/lib/types';

interface ProgressChecklistProps {
  stages: StageItem[];
}

export default function ProgressChecklist({ stages }: ProgressChecklistProps) {
  return (
    <ul className="space-y-2.5" aria-label="Pipeline progress">
      {stages.map((stage) => (
        <li
          key={stage.key}
          className={`flex items-center gap-3 text-sm transition-colors ${
            stage.status === 'pending'
              ? 'text-slate-400'
              : stage.status === 'active'
                ? 'font-medium text-accent-deep'
                : 'text-ink'
          }`}
        >
          {stage.status === 'done' ? (
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.414l2.792 2.792 6.793-6.793a1 1 0 011.415 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          ) : stage.status === 'active' ? (
            <span className="spinner-accent" aria-hidden="true" />
          ) : (
            <span className="h-5 w-5 flex-none rounded-full border-2 border-slate-200" aria-hidden="true" />
          )}
          <span>{stage.label}</span>
        </li>
      ))}
    </ul>
  );
}
