export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-amikom-purple border-t-transparent" />
        <p className="text-sm text-slate-500 font-mono">Memuat data...</p>
      </div>
    </div>
  )
}
