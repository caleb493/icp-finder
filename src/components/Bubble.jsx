export default function Bubble({ role, text, isChallenge }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-yellow text-ink rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%] text-sm leading-relaxed">
          {text}
        </div>
      </div>
    )
  }

  if (isChallenge) {
    return (
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center shrink-0 mt-1">
          <span className="text-ink text-xs font-black">A</span>
        </div>
        <div className="border-l-2 border-yellow pl-3 max-w-[75%]">
          <span className="text-yellow text-xs font-black uppercase tracking-wider block mb-1.5">
            Go deeper
          </span>
          <div className="bg-bubble rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-offwhite">
            {text}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center shrink-0 mt-1">
        <span className="text-ink text-xs font-black">A</span>
      </div>
      <div className="bg-bubble rounded-2xl rounded-tl-sm px-4 py-3 max-w-[75%] text-sm leading-relaxed text-offwhite">
        {text}
      </div>
    </div>
  )
}
