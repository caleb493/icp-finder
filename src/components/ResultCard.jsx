export default function ResultCard({ profile }) {
  if (!profile) return null

  return (
    <div className="bg-bubble rounded-2xl p-6 mt-4 max-w-2xl mx-auto">
      <p className="text-yellow font-black text-lg leading-snug mb-6">
        {profile.positioning_statement}
      </p>

      <Section label="Ideal client" text={profile.ideal_client} />
      <Section label="Real problem" text={profile.real_problem} />
      <Section label="Your edge" text={profile.your_edge} />

      {profile.tension && (
        <div className="border-l-2 border-midgrey pl-4 mb-5">
          <p className="text-xs text-midgrey uppercase tracking-wider mb-1">Tension</p>
          <p className="text-sm text-offwhite leading-relaxed">{profile.tension}</p>
        </div>
      )}

      {profile.next_actions?.length > 0 && (
        <div>
          <p className="text-xs text-midgrey uppercase tracking-wider mb-3">Next actions</p>
          <ul className="space-y-2">
            {profile.next_actions.map((action, i) => (
              <li key={i} className="flex gap-3 text-sm text-offwhite leading-relaxed">
                <span className="text-yellow font-black shrink-0">
                  {i === 0 ? '7d' : i === 1 ? '30d' : '90d'}
                </span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Section({ label, text }) {
  return (
    <div className="mb-5">
      <p className="text-xs text-midgrey uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-offwhite leading-relaxed">{text}</p>
    </div>
  )
}
