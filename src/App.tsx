import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'

type Submission = {
  id: string
  createdAt: string
  participantName: string
  appName: string
  appDescription: string
  problemDescription: string
  appLink: string
}

type FormState = Omit<Submission, 'id' | 'createdAt'>

const STORAGE_KEY = 'aoai.submissions.v1'
const SEED_NUMEROLOGY_LINK = 'https://numerology-app-with-1762069380857.chatand.build/'

const seedSubmissions: Submission[] = [
  {
    id: 'seed_numerology_reading_app',
    createdAt: '2026-02-27T00:00:00.000Z',
    participantName: 'Shely E',
    appName: 'Numerology reading app',
    appDescription:
      'A simple numerology experience that generates insights and readings based on your inputs.',
    problemDescription:
      'Makes numerology readings easy to access in a clean, guided flow without needing specialized tools or prior knowledge.',
    appLink: SEED_NUMEROLOGY_LINK,
  },
]

function screenshotUrl(targetUrl: string, opts?: { width?: number; height?: number }) {
  const w = opts?.width ?? 900
  const h = opts?.height ?? 600
  // WordPress mShots: https://s.wordpress.com/mshots/v1/<encoded-url>?w=<width>&h=<height>
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(targetUrl)}?w=${w}&h=${h}`
}

function wordCount(text: string) {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function normalizeUrl(value: string) {
  const raw = value.trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://${raw}`
}

function validate(state: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}

  if (!state.participantName.trim()) errors.participantName = 'Participant name is required.'
  if (!state.appName.trim()) errors.appName = 'App name is required.'

  const appDescWords = wordCount(state.appDescription)
  if (!state.appDescription.trim()) errors.appDescription = 'Brief app description is required.'
  else if (appDescWords > 100) errors.appDescription = `Keep this to 100 words or fewer (${appDescWords}/100).`

  const problemWords = wordCount(state.problemDescription)
  if (!state.problemDescription.trim()) errors.problemDescription = 'Problem description is required.'
  else if (problemWords > 200) errors.problemDescription = `Keep this to 200 words or fewer (${problemWords}/200).`

  const normalized = normalizeUrl(state.appLink)
  if (!normalized) errors.appLink = 'App link is required.'
  else {
    try {
      const u = new URL(normalized)
      if (!['http:', 'https:'].includes(u.protocol)) {
        errors.appLink = 'Please use an http(s) link.'
      }
    } catch {
      errors.appLink = 'Please enter a valid link (e.g. https://example.com).'
    }
  }

  return errors
}

function HeaderNav() {
  const location = useLocation()
  const onSubmitPage = location.pathname === '/submit'

  return (
    <header className="header">
      <div className="headerInner">
        <div className="brand">
          <div className="brandMark">
            <img className="brandLogo" src="/assets/aoai-logo.png" alt="AOAI logo" />
          </div>
          <div>
            <h1 className="title">
              <span className="titleLead">AOAI x ChatandBuild</span>{' '}
              <span className="titleMain">Hackathon Submission Portal</span>
            </h1>
            <p className="subtitle">Browse submissions or add a new one.</p>
          </div>
        </div>

        <div className="headerActions">
          {onSubmitPage ? (
            <Link className="btn btnGhost" to="/">
              View submissions
            </Link>
          ) : (
            <Link className="btn" to="/submit">
              New submission
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

function SubmissionsPage({ submissions }: { submissions: Submission[] }) {
  const featured = submissions.slice(0, 3)

  return (
    <>
      <section className="card">
        <div className="listHeader">
          <h2 className="cardTitle">Featured submissions</h2>
          <div className="pill" aria-label={`${featured.length} featured submissions`}>
            {featured.length}
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="empty">No submissions yet. Use “New submission” to add the first one.</div>
        ) : (
          <div className="list" role="list">
            {featured.map((s) => (
              <article className="submission" role="listitem" key={s.id}>
                <div className="submissionTop">
                  <div>
                    <a className="submissionTitleLink" href={s.appLink} target="_blank" rel="noopener noreferrer">
                      <div className="submissionTitle">{s.appName}</div>
                    </a>
                    <div className="submissionMeta">
                      <span className="metaItem">{s.participantName}</span>
                      <span className="metaDot" aria-hidden="true">
                        ·
                      </span>
                      <time className="metaItem" dateTime={s.createdAt}>
                        {new Date(s.createdAt).toLocaleString()}
                      </time>
                    </div>
                  </div>
                  <a className="link" href={s.appLink} target="_blank" rel="noopener noreferrer">
                    Open app
                  </a>
                </div>

                <a
                  className="preview"
                  href={s.appLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${s.appName} preview`}
                >
                  <div className="previewHeader" aria-hidden="true">
                    <span className="previewDots">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </span>
                    <span className="previewLabel">Live preview</span>
                  </div>
                  <div className="previewBody">
                    <iframe
                      className="previewIframe"
                      title={`${s.appName} preview`}
                      src={s.appLink}
                      loading="lazy"
                      sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                      referrerPolicy="no-referrer"
                      tabIndex={-1}
                    />
                  </div>
                </a>

                <div className="submissionBody">
                  <div className="block">
                    <div className="blockLabel">Brief description</div>
                    <div className="blockText">{s.appDescription}</div>
                  </div>
                  <div className="block">
                    <div className="blockLabel">Problem addressed</div>
                    <div className="blockText">{s.problemDescription}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="listHeader">
          <h2 className="cardTitle">All submissions</h2>
          <div className="pill" aria-label={`${submissions.length} total submissions`}>
            {submissions.length}
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="empty">Nothing here yet.</div>
        ) : (
          <div className="compactList" role="list">
            {submissions.map((s) => (
            <a
              className="compactCard"
              role="listitem"
              key={`compact_${s.id}`}
              href={s.appLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${s.appName} by ${s.participantName}`}
            >
              <div className="compactTop">
                <div className="compactMain">
                  <div className="compactTitle">{s.appName}</div>
                  <div className="compactMeta">
                    <span className="compactBy">by {s.participantName}</span>
                  </div>
                </div>
                <div className="compactAction" aria-hidden="true">
                  View
                </div>
              </div>

              <div className="thumb thumbCompact">
                <img
                  className="thumbImg"
                  src={screenshotUrl(s.appLink, { width: 1200, height: 800 })}
                  alt={`${s.appName} homepage screenshot`}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </div>
            </a>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function NewSubmissionPage({ onCreate }: { onCreate: (submission: Submission) => void }) {
  const [justSavedId, setJustSavedId] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({
    participantName: '',
    appName: '',
    appDescription: '',
    problemDescription: '',
    appLink: '',
  })

  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({})

  const errors = useMemo(() => validate(form), [form])
  const appDescWords = useMemo(() => wordCount(form.appDescription), [form.appDescription])
  const problemWords = useMemo(() => wordCount(form.problemDescription), [form.problemDescription])
  const hardBlocked = appDescWords > 100 || problemWords > 200

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onBlur<K extends keyof FormState>(key: K) {
    setTouched((prev) => ({ ...prev, [key]: true }))
  }

  function showError<K extends keyof FormState>(key: K) {
    return Boolean(touched[key] && errors[key])
  }

  function resetForm() {
    setForm({
      participantName: '',
      appName: '',
      appDescription: '',
      problemDescription: '',
      appLink: '',
    })
    setTouched({})
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const nextTouched: Partial<Record<keyof FormState, boolean>> = {
      participantName: true,
      appName: true,
      appDescription: true,
      problemDescription: true,
      appLink: true,
    }
    setTouched(nextTouched)

    const currentErrors = validate(form)
    if (Object.keys(currentErrors).length > 0) return

    const now = new Date()
    const submission: Submission = {
      id: makeId(),
      createdAt: now.toISOString(),
      participantName: form.participantName.trim(),
      appName: form.appName.trim(),
      appDescription: form.appDescription.trim(),
      problemDescription: form.problemDescription.trim(),
      appLink: normalizeUrl(form.appLink),
    }

    onCreate(submission)
    setJustSavedId(submission.id)
    resetForm()
    window.setTimeout(() => setJustSavedId((id) => (id === submission.id ? null : id)), 6000)
  }

  return (
    <section className="card">
      <h2 className="cardTitle">New submission</h2>
      <p className="cardHint">
        Required fields are marked <span aria-hidden="true">*</span>.
      </p>

      {justSavedId && (
        <div className="callout success" role="status">
          Submission saved.
        </div>
      )}

      <form className="form" onSubmit={submit} noValidate>
        <div className="grid">
          <div className="field">
            <label htmlFor="participantName">
              Name of participant <span className="req">*</span>
            </label>
            <input
              id="participantName"
              name="participantName"
              value={form.participantName}
              onChange={(e) => setField('participantName', e.target.value)}
              onBlur={() => onBlur('participantName')}
              aria-invalid={showError('participantName')}
              aria-describedby={showError('participantName') ? 'participantNameError' : undefined}
              placeholder="e.g. Nigel Smith"
              autoComplete="name"
            />
            {showError('participantName') && (
              <div className="error" id="participantNameError">
                {errors.participantName}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="appName">
              Name of app <span className="req">*</span>
            </label>
            <input
              id="appName"
              name="appName"
              value={form.appName}
              onChange={(e) => setField('appName', e.target.value)}
              onBlur={() => onBlur('appName')}
              aria-invalid={showError('appName')}
              aria-describedby={showError('appName') ? 'appNameError' : undefined}
              placeholder="e.g. Aurora Planner"
            />
            {showError('appName') && (
              <div className="error" id="appNameError">
                {errors.appName}
              </div>
            )}
          </div>

          <div className="field span2">
            <label htmlFor="appDescription">
              Brief description of app <span className="req">*</span>
            </label>
            <div className="helpRow">
              <span className="helpText">No more than 100 words.</span>
              <span className={appDescWords > 100 ? 'counter counterBad' : 'counter'}>{appDescWords}/100</span>
            </div>
            <textarea
              id="appDescription"
              name="appDescription"
              value={form.appDescription}
              onChange={(e) => setField('appDescription', e.target.value)}
              onBlur={() => onBlur('appDescription')}
              aria-invalid={showError('appDescription')}
              aria-describedby={showError('appDescription') ? 'appDescriptionError' : undefined}
              placeholder="What does your app do?"
              rows={4}
            />
            {showError('appDescription') && (
              <div className="error" id="appDescriptionError">
                {errors.appDescription}
              </div>
            )}
          </div>

          <div className="field span2">
            <label htmlFor="problemDescription">
              Brief description of the problem your app addresses <span className="req">*</span>
            </label>
            <div className="helpRow">
              <span className="helpText">No more than 200 words.</span>
              <span className={problemWords > 200 ? 'counter counterBad' : 'counter'}>{problemWords}/200</span>
            </div>
            <textarea
              id="problemDescription"
              name="problemDescription"
              value={form.problemDescription}
              onChange={(e) => setField('problemDescription', e.target.value)}
              onBlur={() => onBlur('problemDescription')}
              aria-invalid={showError('problemDescription')}
              aria-describedby={showError('problemDescription') ? 'problemDescriptionError' : undefined}
              placeholder="What user pain-point or gap does it solve?"
              rows={5}
            />
            {showError('problemDescription') && (
              <div className="error" id="problemDescriptionError">
                {errors.problemDescription}
              </div>
            )}
          </div>

          <div className="field span2">
            <label htmlFor="appLink">
              App link <span className="req">*</span>
            </label>
            <input
              id="appLink"
              name="appLink"
              value={form.appLink}
              onChange={(e) => setField('appLink', e.target.value)}
              onBlur={() => onBlur('appLink')}
              aria-invalid={showError('appLink')}
              aria-describedby={showError('appLink') ? 'appLinkError' : undefined}
              placeholder="https://yourapp.com"
              inputMode="url"
            />
            {showError('appLink') && (
              <div className="error" id="appLinkError">
                {errors.appLink}
              </div>
            )}
          </div>
        </div>

        <div className="actions">
          <button className="btn" type="submit" disabled={hardBlocked}>
            Submit
          </button>
          <button className="btn btnGhost" type="button" onClick={resetForm}>
            Clear
          </button>
        </div>
      </form>
    </section>
  )
}

function App() {
  const [submissions, setSubmissions] = useState<Submission[]>([])

  useEffect(() => {
    let stored: Submission[] = []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Submission[]
        if (Array.isArray(parsed)) stored = parsed
      }
    } catch {
      // ignore corrupted storage
    }

    const byLink = new Set(stored.map((s) => s.appLink))
    const seeded = seedSubmissions.filter((s) => !byLink.has(s.appLink))
    setSubmissions(seeded.length > 0 ? [...seeded, ...stored] : stored)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions))
    } catch {
      // ignore storage quota / disabled storage
    }
  }, [submissions])

  return (
    <div className="page">
      <HeaderNav />

      <main className="content">
        <Routes>
          <Route path="/" element={<SubmissionsPage submissions={submissions} />} />
          <Route
            path="/submit"
            element={<NewSubmissionPage onCreate={(s) => setSubmissions((prev) => [s, ...prev])} />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
