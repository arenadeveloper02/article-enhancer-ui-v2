"use client"

interface ErrorCardProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <article className="animate-fade-slide-in rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-rose-800">Enhancement failed</h2>
      <p className="mt-2 break-words text-sm leading-relaxed text-rose-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
      >
        Retry
      </button>
    </article>
  );
}
