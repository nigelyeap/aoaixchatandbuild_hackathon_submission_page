import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Hackathon } from '../App'

function formatDateRange(h: Hackathon) {
  const start = new Date(h.startsAt).toLocaleString()
  const end = new Date(h.endsAt).toLocaleString()
  return `${start} – ${end}`
}

function isOpen(h: Hackathon) {
  const now = Date.now()
  const starts = Date.parse(h.startsAt)
  const ends = Date.parse(h.endsAt)
  if (!Number.isFinite(starts) || !Number.isFinite(ends)) return h.acceptingSubmissions
  return h.acceptingSubmissions && now >= starts && now <= ends
}

export default function HackathonSelectPage({
  hackathons,
  selectedHackathonId,
  onSelectHackathon,
}: {
  hackathons: Hackathon[]
  selectedHackathonId: string | null
  onSelectHackathon: (id: string) => void
}) {
  const navigate = useNavigate()

  const single = useMemo(() => {
    const preferred =
      hackathons.find((h) => h.name.trim().toLowerCase() === 'aoai x chatandbuild hackathon'.toLowerCase()) ??
      hackathons[0] ??
      null
    return preferred
  }, [hackathons])

  return (
    <section className="card">
      <div className="listHeader">
        <h2 className="cardTitle cardTitleHero">Choose a hackathon</h2>
      </div>
      <p className="cardHint">Pick where you’re submitting. You can change this later.</p>

      {!single ? (
        <div className="empty">No hackathons available.</div>
      ) : (
        <button
          type="button"
          className="hackathonHero"
          onClick={() => {
            onSelectHackathon(single.id)
            navigate('/home')
          }}
        >
          <div className="hackathonHeroTop">
            <div>
              <div className="hackathonHeroTitle">AOAI x ChatAndBuild Hackathon</div>
              <div className="hackathonHeroMeta">
                <span className={`statusTag ${isOpen(single) ? 'statusOpen' : 'statusClosed'}`}>
                  {isOpen(single) ? 'Open' : 'Closed'}
                </span>
                <span className="metaDot" aria-hidden="true">
                  ·
                </span>
                <span>{formatDateRange(single)}</span>
                {selectedHackathonId === single.id && (
                  <>
                    <span className="metaDot" aria-hidden="true">
                      ·
                    </span>
                    <span className="pill">Selected</span>
                  </>
                )}
              </div>
            </div>
            <div className="hackathonHeroAction" aria-hidden="true">
              Enter
            </div>
          </div>
        </button>
      )}

    </section>
  )
}

