export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#FAFBFC] p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
            </div>
            <div className="grid gap-2">
              <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
            </div>
            <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
          </div>
          <div className="mx-auto h-4 w-12 animate-pulse rounded bg-slate-200" />
          <div className="mx-auto h-4 w-48 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </div>
  )
}
