interface StatusChipProps {
  message: string
  elapsed: number
  running: boolean
}

export default function StatusChip({ message, elapsed, running }: StatusChipProps) {
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const time = `${minutes}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
      <span
        className={`h-2 w-2 flex-shrink-0 rounded-full ${running ? 'animate-pulse bg-indigo-500' : 'bg-emerald-500'}`}
        aria-hidden="true"
      />
      <span className="truncate">{message || (running ? 'Working\u2026' : 'Complete')}</span>
      <span className="flex-shrink-0 tabular-nums text-indigo-400">{time}</span>
    </div>
  )
}
