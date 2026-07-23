"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-center text-sm text-slate-500">
        {error.message || 'An unexpected error occurred while rendering this page.'}
      </p>
      <button
        type="button"
        className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  )
}
