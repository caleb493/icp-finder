export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center shrink-0 mt-1">
        <span className="text-ink text-xs font-black">A</span>
      </div>
      <div className="bg-bubble rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
        <span className="typing-dot w-2 h-2 rounded-full bg-midgrey inline-block" />
        <span className="typing-dot w-2 h-2 rounded-full bg-midgrey inline-block" />
        <span className="typing-dot w-2 h-2 rounded-full bg-midgrey inline-block" />
      </div>
    </div>
  )
}
