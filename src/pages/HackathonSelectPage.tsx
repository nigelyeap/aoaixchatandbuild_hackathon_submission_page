import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Hackathon } from '../App'

function formatDateRange(h: Hackathon) {
  const dateFormat: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  }
  const start = new Date(h.startsAt).toLocaleDateString(undefined, dateFormat)
  const end = new Date(h.endsAt).toLocaleDateString(undefined, dateFormat)
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
  getHackathonPath,
}: {
  hackathons: Hackathon[]
  selectedHackathonId: string | null
  onSelectHackathon: (id: string) => void
  getHackathonPath: (id: string) => string
}) {
  const navigate = useNavigate()
  const { openHackathons, pastHackathons } = useMemo(() => {
    const open = hackathons.filter((hackathon) => isOpen(hackathon))
    const past = hackathons.filter((hackathon) => !isOpen(hackathon))
    return { openHackathons: open, pastHackathons: past }
  }, [hackathons])

  function renderHackathonCard(hackathon: Hackathon, isPast: boolean) {
    return (
      <button
        key={hackathon.id}
        type="button"
        className={isPast ? 'hackathonHero hackathonHeroPast' : 'hackathonHero'}
        onClick={() => {
          onSelectHackathon(hackathon.id)
          navigate(getHackathonPath(hackathon.id))
        }}
      >
        <div className="hackathonHeroTop">
          <div>
            {hackathon.logoUrl && (
              <div className="hackathonHeroLogoWrap">
                <img className="hackathonHeroLogo" src={hackathon.logoUrl} alt={`${hackathon.name} logo`} />
              </div>
            )}
            <div className="hackathonHeroTitle">{hackathon.name}</div>
            <div className="hackathonHeroMeta">
              <span className={`statusTag ${isPast ? 'statusClosed' : 'statusOpen'}`}>{isPast ? 'Closed' : 'Open'}</span>
              <span className="metaDot" aria-hidden="true">
                ·
              </span>
              <span>{formatDateRange(hackathon)}</span>
              {selectedHackathonId === hackathon.id && (
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
    )
  }

  return (
    <section className="card">
      <div className="listHeader">
        <h2 className="cardTitle cardTitleHero">Ongoing hackathons</h2>
      </div>

      {hackathons.length === 0 ? (
        <div className="empty">No hackathons available.</div>
      ) : (
        <>
          {openHackathons.length === 0 ? (
            <div className="empty">No ongoing hackathons right now.</div>
          ) : (
            openHackathons.map((hackathon) => renderHackathonCard(hackathon, false))
          )}

          {pastHackathons.length > 0 && (
            <>
              <div className="listHeader mt-8">
                <h3 className="cardTitle cardTitleHero">Past hackathons</h3>
              </div>
              <p className="cardHint">
                You can still enter to view submissions and vote, but new submissions are closed.
              </p>
              {pastHackathons.map((hackathon) => renderHackathonCard(hackathon, true))}
            </>
          )}
        </>
      )}

    </section>
  )
}

