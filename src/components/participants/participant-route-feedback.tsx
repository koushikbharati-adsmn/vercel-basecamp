export function ParticipantEntryLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#0d0c0d] text-white">
      <div className="text-center">
        <span className="live-pulse mx-auto block size-2 rounded-full bg-[#e74246]" />
        <p className="mt-5 text-xs font-bold tracking-[0.2em] text-white/55 uppercase">Opening workshop</p>
      </div>
    </main>
  )
}

export function ParticipantEntryError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#0d0c0d] px-6 text-white">
      <div className="max-w-md text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-[#e74246] uppercase">Unable to enter</p>
        <h1 className="orbital-display mt-4 text-4xl">We couldn’t open this workshop.</h1>
        <p className="mt-4 text-sm leading-6 text-white/55">Check the workshop code or your connection, then try again.</p>
        <button type="button" onClick={reset} className="mt-8 cursor-pointer border border-white/25 px-7 py-3 text-xs font-bold tracking-[0.16em] uppercase hover:bg-white/10">
          Try again
        </button>
      </div>
    </main>
  )
}
