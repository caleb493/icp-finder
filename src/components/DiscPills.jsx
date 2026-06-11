const DISCIPLINES = [
  'Sport Psychology',
  'Performance Coaching',
  'Strength & Conditioning',
  'Nutrition',
  'Leadership Coaching',
  'Mental Performance',
  'High Performance',
  'Other'
]

export default function DiscPills({ selected, onSelect }) {
  return (
    <div className="mb-6">
      <p className="text-midgrey text-xs uppercase tracking-wider mb-3">Your discipline</p>
      <div className="flex flex-wrap gap-2">
        {DISCIPLINES.map((disc) => (
          <button
            key={disc}
            onClick={() => onSelect(disc)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              selected === disc
                ? 'bg-yellow text-ink border-yellow font-black'
                : 'bg-transparent text-offwhite border-midgrey hover:border-offwhite'
            }`}
          >
            {disc}
          </button>
        ))}
      </div>
    </div>
  )
}
