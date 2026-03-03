import { useEffect, useMemo, useState, type ChangeEvent, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import type { Hackathon, Submission } from './App'
import { isSupabaseConfigured } from './lib/supabaseClient'
import * as db from './lib/db'

const ADMIN_PASSWORD = 'admin123'
const DEFAULT_HACKATHON_WINDOW_DAYS = 7

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`
}

function formatScheduleDate(isoValue: string) {
  const parsed = Date.parse(isoValue)
  if (!Number.isFinite(parsed)) return 'Invalid date'
  return new Date(parsed).toLocaleString()
}

function isHackathonOpen(hackathon: Hackathon, nowMs: number) {
  const startsMs = Date.parse(hackathon.startsAt)
  const endsMs = Date.parse(hackathon.endsAt)
  if (!Number.isFinite(startsMs) || !Number.isFinite(endsMs)) return hackathon.acceptingSubmissions
  return hackathon.acceptingSubmissions && nowMs >= startsMs && nowMs <= endsMs
}

type AdminPageProps = {
  submissions: Submission[]
  setSubmissions: Dispatch<SetStateAction<Submission[]>>
  hackathons: Hackathon[]
  setHackathons: Dispatch<SetStateAction<Hackathon[]>>
}

function makeHackathonId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Date.now()
  return `${slug || 'hackathon'}-${suffix}`
}

function AdminPage({ submissions, setSubmissions, hackathons, setHackathons }: AdminPageProps) {
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedHackathonId, setSelectedHackathonId] = useState('')
  const [isHackathonMenuOpen, setIsHackathonMenuOpen] = useState(false)

  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [acceptingSubmissions, setAcceptingSubmissions] = useState(true)
  const [startDateTime, setStartDateTime] = useState(() => toDateTimeLocalValue(new Date()))
  const [endDateTime, setEndDateTime] = useState(() =>
    toDateTimeLocalValue(new Date(Date.now() + DEFAULT_HACKATHON_WINDOW_DAYS * 24 * 60 * 60 * 1000)),
  )
  const [createError, setCreateError] = useState('')
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [syncBusy, setSyncBusy] = useState(false)

  const groupedSubmissions = useMemo(() => {
    const byHackathon = new Map<string, Submission[]>()
    for (const hackathon of hackathons) {
      byHackathon.set(hackathon.id, [])
    }

    for (const submission of submissions) {
      const next = byHackathon.get(submission.hackathonId)
      if (!next) continue
      next.push(submission)
    }

    for (const entry of byHackathon.values()) {
      entry.sort((a, b) => b.votes - a.votes)
    }

    return byHackathon
  }, [hackathons, submissions])

  useEffect(() => {
    if (hackathons.length === 0) {
      setSelectedHackathonId('')
      return
    }

    const hasSelected = hackathons.some((hackathon) => hackathon.id === selectedHackathonId)
    if (!hasSelected) {
      setSelectedHackathonId(hackathons[0].id)
    }
  }, [hackathons, selectedHackathonId])

  const selectedHackathon = useMemo(
    () => hackathons.find((hackathon) => hackathon.id === selectedHackathonId) ?? null,
    [hackathons, selectedHackathonId],
  )
  const selectedHackathonIsOpen = useMemo(
    () => (selectedHackathon ? isHackathonOpen(selectedHackathon, nowMs) : false),
    [selectedHackathon, nowMs],
  )

  const selectedRows = useMemo(() => {
    if (!selectedHackathon) return []
    return groupedSubmissions.get(selectedHackathon.id) ?? []
  }, [groupedSubmissions, selectedHackathon])

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setPasswordError('')
      return
    }
    setPasswordError('Incorrect password.')
  }

  function handleCreateHackathon(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setCreateError('Hackathon name is required.')
      return
    }

    const duplicate = hackathons.some(
      (hackathon) => hackathon.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    )
    if (duplicate) {
      setCreateError('A hackathon with that name already exists.')
      return
    }

    const startsMs = Date.parse(startDateTime)
    const endsMs = Date.parse(endDateTime)
    if (!Number.isFinite(startsMs) || !Number.isFinite(endsMs)) {
      setCreateError('Start and end date/time are required.')
      return
    }
    if (endsMs <= startsMs) {
      setCreateError('End date/time must be after start date/time.')
      return
    }

    const newHackathon: Hackathon = {
      id: makeHackathonId(trimmedName),
      name: trimmedName,
      logoUrl: logoUrl.trim() || undefined,
      acceptingSubmissions,
      startsAt: new Date(startDateTime).toISOString(),
      endsAt: new Date(endDateTime).toISOString(),
      createdAt: new Date().toISOString(),
    }

    setHackathons((prev) => [newHackathon, ...prev])
    setSelectedHackathonId(newHackathon.id)
    setIsHackathonMenuOpen(false)
    setName('')
    setLogoUrl('')
    setAcceptingSubmissions(true)
    setStartDateTime(toDateTimeLocalValue(new Date()))
    setEndDateTime(toDateTimeLocalValue(new Date(Date.now() + DEFAULT_HACKATHON_WINDOW_DAYS * 24 * 60 * 60 * 1000)))
    setCreateError('')
  }

  function handleLogoFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setCreateError('Please upload a valid image file for the logo.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const nextValue = typeof reader.result === 'string' ? reader.result : ''
      if (!nextValue) {
        setCreateError('Could not read the selected logo image.')
        return
      }
      setLogoUrl(nextValue)
      setCreateError('')
    }
    reader.onerror = () => {
      setCreateError('Could not read the selected logo image.')
    }
    reader.readAsDataURL(file)
  }

  function toggleAccepting(hackathonId: string) {
    setHackathons((prev) =>
      prev.map((hackathon) =>
        hackathon.id === hackathonId
          ? { ...hackathon, acceptingSubmissions: !hackathon.acceptingSubmissions }
          : hackathon,
      ),
    )
  }

  function deleteSubmission(submissionId: string) {
    setSubmissions((prev) => prev.filter((submission) => submission.id !== submissionId))
  }

  function resetVotes(submissionId: string) {
    setSubmissions((prev) =>
      prev.map((submission) => (submission.id === submissionId ? { ...submission, votes: 0 } : submission)),
    )
  }

  if (!isAuthenticated) {
    return (
      <section className="card">
        <h2 className="cardTitle">Admin access</h2>
        <p className="cardHint">Enter password to access admin dashboard.</p>
        <form className="form" onSubmit={handlePasswordSubmit} noValidate>
          <div className="formGrid">
            <div className="field">
              <label htmlFor="adminPassword">
                Password <span className="req">*</span>
              </label>
              <input
                id="adminPassword"
                name="adminPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'adminPasswordError' : undefined}
                placeholder="Enter admin password"
              />
              {passwordError && (
                <div className="error" id="adminPasswordError">
                  {passwordError}
                </div>
              )}
            </div>
          </div>

          <div className="actions">
            <button className="btn" type="submit">
              Unlock admin
            </button>
          </div>
        </form>
      </section>
    )
  }

  return (
    <>
      <section className="card">
        <h2 className="cardTitle">Database sync</h2>
        <p className="cardHint">
          {isSupabaseConfigured
            ? 'Push the current hackathons and submissions into Supabase.'
            : 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env and restart.'}
        </p>

        {syncStatus && (
          <div className="callout success" role="status">
            {syncStatus}
          </div>
        )}

        <div className="actions">
          <button
            className="btn"
            type="button"
            disabled={!isSupabaseConfigured || syncBusy}
            onClick={() => {
              if (!isSupabaseConfigured) return
              setSyncBusy(true)
              setSyncStatus(null)
              void (async () => {
                try {
                  await db.upsertHackathons(hackathons)
                  await db.upsertSubmissions(submissions)
                  setSyncStatus(`Synced ${hackathons.length} hackathons and ${submissions.length} submissions to Supabase.`)
                } catch (err) {
                  console.error(err)
                  setSyncStatus('Sync failed. Check console for details.')
                } finally {
                  setSyncBusy(false)
                }
              })()
            }}
          >
            {syncBusy ? 'Syncing…' : 'Sync to Supabase'}
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="cardTitle">Create hackathon</h2>
        <form className="form" onSubmit={handleCreateHackathon} noValidate>
          <div className="formGrid">
            <div className="field">
              <label htmlFor="hackathonName">
                Name <span className="req">*</span>
              </label>
              <input
                id="hackathonName"
                name="hackathonName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Spring 2026"
                aria-invalid={Boolean(createError)}
                aria-describedby={createError ? 'hackathonNameError' : undefined}
              />
              {createError && (
                <div className="error" id="hackathonNameError">
                  {createError}
                </div>
              )}
            </div>

            <div className="field">
              <label htmlFor="hackathonLogoUrl">Logo URL / path (optional)</label>
              <input
                id="hackathonLogoUrl"
                name="hackathonLogoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="e.g. /assets/my-hackathon-logo.png or https://example.com/logo.png"
              />
            </div>

            <div className="field">
              <label htmlFor="hackathonLogoFile">Upload logo image (optional)</label>
              <input id="hackathonLogoFile" name="hackathonLogoFile" type="file" accept="image/*" onChange={handleLogoFileChange} />
              {logoUrl && (
                <div className="mt-2">
                  <img className="adminLogoPreview" src={logoUrl} alt="Hackathon logo preview" />
                </div>
              )}
            </div>

            <div className="field">
              <label htmlFor="hackathonAccepting">Accepting submissions</label>
              <div className="checkboxRow">
                <input
                  id="hackathonAccepting"
                  name="hackathonAccepting"
                  type="checkbox"
                  checked={acceptingSubmissions}
                  onChange={(e) => setAcceptingSubmissions(e.target.checked)}
                />
                <span>{acceptingSubmissions ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="hackathonStartAt">
                Start date/time <span className="req">*</span>
              </label>
              <input
                id="hackathonStartAt"
                name="hackathonStartAt"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="hackathonEndAt">
                End date/time <span className="req">*</span>
              </label>
              <input
                id="hackathonEndAt"
                name="hackathonEndAt"
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
              />
            </div>
          </div>

          <div className="actions">
            <button className="btn" type="submit">
              Create hackathon
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2 className="cardTitle">Hackathon list</h2>
        {hackathons.length === 0 ? (
          <div className="empty">No hackathons available yet.</div>
        ) : (
          <div className="hackathonDropdown">
            <button
              className="hackathonDropdownTrigger"
              type="button"
              onClick={() => setIsHackathonMenuOpen((prev) => !prev)}
              aria-expanded={isHackathonMenuOpen}
              aria-controls="hackathonMenu"
            >
              <span className="hackathonDropdownLabel">{selectedHackathon?.name ?? 'Select a hackathon'}</span>
              <span className="hackathonDropdownMeta">
                {selectedHackathon && (
                  <span className={`statusTag ${selectedHackathonIsOpen ? 'statusOpen' : 'statusClosed'}`}>
                    {selectedHackathonIsOpen ? 'Open' : 'Closed'}
                  </span>
                )}
                <span className={`hackathonDropdownArrow ${isHackathonMenuOpen ? 'isOpen' : ''}`} aria-hidden="true">
                  ▾
                </span>
              </span>
            </button>

            {isHackathonMenuOpen && (
              <div className="hackathonMenu" id="hackathonMenu" role="listbox" aria-label="Hackathon list">
                {hackathons.map((hackathon) => (
                  <button
                    key={hackathon.id}
                    className="hackathonMenuItem"
                    type="button"
                    role="option"
                    aria-selected={selectedHackathonId === hackathon.id}
                    onClick={() => {
                      setSelectedHackathonId(hackathon.id)
                      setIsHackathonMenuOpen(false)
                    }}
                  >
                    <span>{hackathon.name}</span>
                    <span className={`statusTag ${isHackathonOpen(hackathon, nowMs) ? 'statusOpen' : 'statusClosed'}`}>
                      {isHackathonOpen(hackathon, nowMs) ? 'Open' : 'Closed'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {selectedHackathon && (
        <section className="card" key={selectedHackathon.id}>
            <div className="adminHackathonHeader">
              <div>
                <h2 className="cardTitle">{selectedHackathon.name}</h2>
                <p className="cardHint">
                  Status:{' '}
                  <span className={`adminStatus statusTag ${selectedHackathonIsOpen ? 'statusOpen' : 'statusClosed'}`}>
                    {selectedHackathonIsOpen ? 'Accepting submissions' : 'Closed'}
                  </span>
                </p>
                <p className="cardHint">
                  Window: {formatScheduleDate(selectedHackathon.startsAt)} - {formatScheduleDate(selectedHackathon.endsAt)}
                </p>
              </div>
              <button
                className="btn btnGhost"
                type="button"
                onClick={() => toggleAccepting(selectedHackathon.id)}
              >
                {selectedHackathon.acceptingSubmissions ? 'Close submissions' : 'Open submissions'}
              </button>
            </div>

            {selectedRows.length === 0 ? (
              <div className="empty">No submissions for this hackathon yet.</div>
            ) : (
              <div className="tableWrap">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th>App Name</th>
                      <th>Participant</th>
                      <th>URL</th>
                      <th>Votes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRows.map((submission) => (
                      <tr key={submission.id}>
                        <td>{submission.appName}</td>
                        <td>{submission.participantName}</td>
                        <td>
                          <a className="link" href={submission.appLink} target="_blank" rel="noopener noreferrer">
                            Open app
                          </a>
                        </td>
                        <td>{submission.votes}</td>
                        <td>
                          <div className="adminActions">
                            <button className="btn btnGhost" type="button" onClick={() => resetVotes(submission.id)}>
                              Reset votes
                            </button>
                            <button className="btn btnGhost" type="button" onClick={() => deleteSubmission(submission.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      )}
    </>
  )
}

export default AdminPage
