'use client'

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="page-container flex flex-col items-center justify-center py-24">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </span>
      <h2 className="mt-4 font-sans text-xl font-semibold text-slate-900">Terjadi Kesalahan</h2>
      <p className="mt-2 text-sm text-slate-600 text-center max-w-md">
        Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-amikom-purple px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amikom-purple/90 active:scale-[0.98]"
      >
        Coba Lagi
      </button>
      {error.digest && (
        <p className="mt-4 text-[10px] font-mono text-slate-400">Error ID: {error.digest}</p>
      )}
    </div>
  )
}
