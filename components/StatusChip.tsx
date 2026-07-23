interface StatusChipProps {
  message: string;
  elapsed: number;
  running: boolean;
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder.toString().padStart(2, '0')}s` : `${remainder}s`;
}

export default function StatusChip({ message, elapsed, running }: StatusChipProps) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-deep">
      <span
        className={`h-2 w-2 flex-none rounded-full ${running ? 'animate-pulse bg-accent' : 'bg-emerald-500'}`}
        aria-hidden="true"
      />
      <span className="truncate">{message || (running ? 'Working…' : 'Ready')}</span>
      {running && (
        <span className="flex-none tabular-nums text-slate-500">· {formatElapsed(elapsed)} elapsed</span>
      )}
    </div>
  );
}
