export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#FAFBFC]">
      <div className="flex flex-col items-center gap-3">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amikom-purple border-t-transparent" />
        <p className="text-sm text-slate-500 font-mono">Memuat halaman...</p>
      </div>
    </div>
  )
}
