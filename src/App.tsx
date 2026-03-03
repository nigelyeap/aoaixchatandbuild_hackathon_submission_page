import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminPage from './AdminPage'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient'
import * as db from './lib/db'
import type { User } from '@supabase/supabase-js'
import ProfilePage from './pages/ProfilePage'
import LandingPage from './pages/LandingPage'
import HackathonSelectPage from './pages/HackathonSelectPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'

export type Submission = {
  id: string
  createdAt: string
  participantName: string
  appName: string
  appDescription: string
  problemDescription: string
  appLink: string
  hackathonId: string
  votes: number
  userId: string | null
}

type FormState = Omit<Submission, 'id' | 'createdAt' | 'votes' | 'userId'>

export type Hackathon = {
  id: string
  name: string
  logoUrl?: string
  acceptingSubmissions: boolean
  startsAt: string
  endsAt: string
  createdAt: string
}

const STORAGE_KEY = 'aoai.submissions.v1'
const HACKATHON_STORAGE_KEY = 'aoai.hackathons.v1'
const SELECTED_HACKATHON_STORAGE_KEY = 'aoai.selectedHackathon.v1'
const ADMIN_AUTH_STORAGE_KEY = 'aoai.adminAuthenticated.v1'
const USER_VOTES_STORAGE_KEY = 'aoai.userVotes.v1'
const DEFAULT_HACKATHON_ID = 'aoai-chatandbuild-hackathon'
const SEED_NUMEROLOGY_LINK = 'https://numerology-app-with-1762069380857.chatand.build/'
const SEED_STUDY_BUDDY_LINK = 'https://study-buddy-ai.chatand.build/'
const SEED_FOOD_WASTE_LINK = 'https://smart-food-rescue.chatand.build/'
const SEED_TRAVEL_PLANNER_LINK = 'https://weekend-trip-planner.chatand.build/'
const SEED_MENTAL_WELLNESS_LINK = 'https://mood-check-in-assistant.chatand.build/'
const SEED_VOLUNTEER_MATCH_LINK = 'https://volunteer-match-assistant.chatand.build/'
const SEED_SKILLBRIDGE_LINK = 'https://skillbridge-mentor.chatand.build/'
const SEED_GREEN_ROUTE_LINK = 'https://greenroute-transit.chatand.build/'
const SEED_ALAMAK_BILL_LINK = 'https://alamak-bill-1762324529904.chatand.build/'
const SEED_SUCCESSION_PLAN_LINK = 'https://business-succession-planning-1762173000355.chatand.build/'

const seedSubmissions: Submission[] = [
  {
    id: 'seed_succession_plan_builder',
    createdAt: '2026-03-04T00:00:00.000Z',
    participantName: 'YYm',
    appName: 'Succession Plan Builder',
    appDescription: 'A guided builder that helps business owners create and document a succession plan.',
    problemDescription:
      'Succession planning is often delayed because it feels complex and unstructured. This app provides a clear step-by-step flow to capture decisions and produce a usable plan.',
    appLink: SEED_SUCCESSION_PLAN_LINK,
    hackathonId: DEFAULT_HACKATHON_ID,
    votes: 0,
    userId: null,
  },
  {
    id: 'seed_alamak_bill',
    createdAt: '2026-03-03T00:00:00.000Z',
    participantName: 'YYm',
    appName: 'Alamak Bill!',
    appDescription: 'A simple, guided way to split food receipts with tax/service charges and item assignments.',
    problemDescription:
      'Splitting group meal receipts is tedious and error-prone. This app helps people assign items, apply charges correctly, and share totals quickly.',
    appLink: SEED_ALAMAK_BILL_LINK,
    hackathonId: DEFAULT_HACKATHON_ID,
    votes: 0,
    userId: null,
  },
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
    hackathonId: DEFAULT_HACKATHON_ID,
    votes: 0,
    userId: null,
  },
  {
    id: 'seed_study_buddy',
    createdAt: '2026-02-26T18:30:00.000Z',
    participantName: 'Ari L',
    appName: 'Study Buddy AI',
    appDescription:
      'Generates personalized study plans, quick quizzes, and topic summaries from class notes to help students prepare faster.',
    problemDescription:
      'Many students struggle to turn messy notes into a structured revision plan. This app reduces prep time and keeps daily study goals clear.',
    appLink: SEED_STUDY_BUDDY_LINK,
    hackathonId: DEFAULT_HACKATHON_ID,
    votes: 0,
    userId: null,
  },
  {
    id: 'seed_smart_food_rescue',
    createdAt: '2026-02-26T15:10:00.000Z',
    participantName: 'Mina R',
    appName: 'Smart Food Rescue',
    appDescription:
      'Tracks pantry items, predicts expiry dates, and suggests recipes using ingredients you already have at home.',
    problemDescription:
      'Households waste food because they forget what they have and when it expires. The app nudges users early and gives practical meal ideas.',
    appLink: SEED_FOOD_WASTE_LINK,
    hackathonId: DEFAULT_HACKATHON_ID,
    votes: 0,
    userId: null,
  },
  {
    id: 'seed_weekend_trip_planner',
    createdAt: '2026-02-26T10:00:00.000Z',
    participantName: 'Noah T',
    appName: 'Weekend Trip Planner',
    appDescription:
      'Builds short travel itineraries based on budget, interests, and weather, with maps and local activity recommendations.',
    problemDescription:
      'People often skip short trips because planning feels time-consuming. This app creates a ready-to-use itinerary in minutes.',
    appLink: SEED_TRAVEL_PLANNER_LINK,
    hackathonId: DEFAULT_HACKATHON_ID,
    votes: 0,
    userId: null,
  },
  {
    id: 'seed_mood_check_in_assistant',
    createdAt: '2026-02-25T22:45:00.000Z',
    participantName: 'Jules K',
    appName: 'Mood Check-In Assistant',
    appDescription:
      'Offers daily mood tracking, reflection prompts, and lightweight coping exercises based on how users report feeling.',
    problemDescription:
      'Mental wellness support is often hard to access consistently. This app makes daily check-ins quick and encourages healthier habits over time.',
    appLink: SEED_MENTAL_WELLNESS_LINK,
    hackathonId: DEFAULT_HACKATHON_ID,
    votes: 0,
    userId: null,
  },
  {
    id: 'seed_volunteer_match_assistant',
    createdAt: '2026-02-25T18:20:00.000Z',
    participantName: 'Rina P',
    appName: 'Volunteer Match Assistant',
    appDescription:
      'Matches volunteers with nearby nonprofits based on interests, schedules, and required skills.',
    problemDescription:
      'Community organizations struggle to find reliable volunteers quickly. This app reduces outreach effort and helps volunteers discover impactful opportunities.',
    appLink: SEED_VOLUNTEER_MATCH_LINK,
    hackathonId: DEFAULT_HACKATHON_ID,
    votes: 0,
    userId: null,
  },
  {
    id: 'seed_skillbridge_mentor',
    createdAt: '2026-02-25T15:05:00.000Z',
    participantName: 'Dev N',
    appName: 'SkillBridge Mentor',
    appDescription:
      'Creates guided learning tracks and mini projects tailored to a learner’s goals and current skill level.',
    problemDescription:
      'Many early-career learners get stuck choosing what to learn next. The app provides a structured, personalized roadmap and practical milestones.',
    appLink: SEED_SKILLBRIDGE_LINK,
    hackathonId: DEFAULT_HACKATHON_ID,
    votes: 0,
    userId: null,
  },
  {
    id: 'seed_green_route_transit',
    createdAt: '2026-02-24T21:40:00.000Z',
    participantName: 'Kai W',
    appName: 'GreenRoute Transit',
    appDescription:
      'Recommends lower-emission commute routes by comparing public transit, walking, biking, and car options.',
    problemDescription:
      'People want to reduce daily emissions but lack easy visibility into route impact. This app surfaces practical low-carbon alternatives.',
    appLink: SEED_GREEN_ROUTE_LINK,
    hackathonId: DEFAULT_HACKATHON_ID,
    votes: 0,
    userId: null,
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

function normalizeHackathonLogoUrl(value: unknown) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function validate(state: FormState, acceptingHackathons: Hackathon[]) {
  const errors: Partial<Record<keyof FormState, string>> = {}

  if (!state.participantName.trim()) errors.participantName = 'Participant name is required.'
  if (!state.appName.trim()) errors.appName = 'App name is required.'
  if (acceptingHackathons.length === 0) {
    errors.hackathonId = 'No hackathons are currently accepting submissions.'
  } else if (!state.hackathonId) {
    errors.hackathonId = 'Hackathon is required.'
  } else if (!acceptingHackathons.some((hackathon) => hackathon.id === state.hackathonId)) {
    errors.hackathonId = 'Please choose a valid hackathon.'
  }

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

function legacyScheduleWindow(acceptingSubmissions: boolean, createdAt: string) {
  const createdMs = Date.parse(createdAt)
  const safeCreatedMs = Number.isFinite(createdMs) ? createdMs : Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000

  if (acceptingSubmissions) {
    return {
      startsAt: new Date(safeCreatedMs - oneDayMs).toISOString(),
      endsAt: new Date(safeCreatedMs + oneDayMs * 365).toISOString(),
    }
  }

  return {
    startsAt: new Date(safeCreatedMs - oneDayMs * 365).toISOString(),
    endsAt: new Date(safeCreatedMs - 60 * 1000).toISOString(),
  }
}

function normalizeStoredHackathon(value: unknown): Hackathon | null {
  if (!value || typeof value !== 'object') return null
  const hackathon = value as Partial<Hackathon>
  if (
    typeof hackathon.id !== 'string' ||
    typeof hackathon.name !== 'string' ||
    typeof hackathon.acceptingSubmissions !== 'boolean' ||
    typeof hackathon.createdAt !== 'string'
  ) {
    return null
  }

  const fallbackWindow = legacyScheduleWindow(hackathon.acceptingSubmissions, hackathon.createdAt)
  const startsAt =
    typeof hackathon.startsAt === 'string' && Number.isFinite(Date.parse(hackathon.startsAt))
      ? hackathon.startsAt
      : fallbackWindow.startsAt
  const endsAt =
    typeof hackathon.endsAt === 'string' && Number.isFinite(Date.parse(hackathon.endsAt))
      ? hackathon.endsAt
      : fallbackWindow.endsAt

  return {
    id: hackathon.id,
    name: hackathon.name,
    logoUrl: normalizeHackathonLogoUrl((hackathon as { logoUrl?: unknown }).logoUrl),
    acceptingSubmissions: hackathon.acceptingSubmissions,
    startsAt,
    endsAt,
    createdAt: hackathon.createdAt,
  }
}

function isHackathonOpen(hackathon: Hackathon, nowMs: number) {
  const startsMs = Date.parse(hackathon.startsAt)
  const endsMs = Date.parse(hackathon.endsAt)
  if (!Number.isFinite(startsMs) || !Number.isFinite(endsMs)) return hackathon.acceptingSubmissions
  return hackathon.acceptingSubmissions && nowMs >= startsMs && nowMs <= endsMs
}

function defaultHackathon(): Hackathon {
  return {
    id: DEFAULT_HACKATHON_ID,
    name: 'AOAI x ChatAndBuild Hackathon',
    logoUrl: '/assets/aoai-logo.png',
    acceptingSubmissions: true,
    startsAt: '2026-02-20T09:00:00.000Z',
    endsAt: '2026-03-20T23:59:59.000Z',
    createdAt: '2026-02-20T09:00:00.000Z',
  }
}

function seedHackathons(): Hackathon[] {
  return [defaultHackathon()]
}

function saveHackathons(hackathons: Hackathon[]) {
  try {
    localStorage.setItem(HACKATHON_STORAGE_KEY, JSON.stringify(hackathons))
  } catch {
    // ignore storage quota / disabled storage
  }
}

function getHackathons() {
  const seeded = seedHackathons()
  const seededById = new Map(seeded.map((hackathon) => [hackathon.id, hackathon] as const))

  try {
    const raw = localStorage.getItem(HACKATHON_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .map((hackathon) => normalizeStoredHackathon(hackathon))
          .filter((hackathon): hackathon is Hackathon => hackathon !== null)
        if (normalized.length === 0) throw new Error('No valid stored hackathons')

        const migrated = normalized.map((hackathon) => {
          const seededHackathon = seededById.get(hackathon.id)
          if (!seededHackathon) return hackathon

          const nextLogoUrl = hackathon.logoUrl ?? seededHackathon.logoUrl
          if (hackathon.name === seededHackathon.name && nextLogoUrl === hackathon.logoUrl) return hackathon

          return {
            ...hackathon,
            name: seededHackathon.name,
            logoUrl: nextLogoUrl,
          }
        })

        const existingIds = new Set(migrated.map((hackathon) => hackathon.id))
        const missingSeeded = seeded.filter((hackathon) => !existingIds.has(hackathon.id))
        const merged = [...migrated, ...missingSeeded]
        saveHackathons(merged)
        return merged
      }
    }
  } catch {
    // ignore corrupted storage
  }

  saveHackathons(seeded)
  return seeded
}

function getLocalUserVotesStore() {
  try {
    const raw = localStorage.getItem(USER_VOTES_STORAGE_KEY)
    if (!raw) return {} as Record<string, string[]>
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {} as Record<string, string[]>

    const normalized: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (!Array.isArray(value)) continue
      normalized[key] = value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    }
    return normalized
  } catch {
    return {} as Record<string, string[]>
  }
}

function getUserVotedSubmissionIds(userId: string | null) {
  if (!userId) return new Set<string>()
  const store = getLocalUserVotesStore()
  return new Set(store[userId] ?? [])
}

function saveUserVotedSubmissionIds(userId: string | null, votedSubmissionIds: Set<string>) {
  if (!userId) return
  try {
    const store = getLocalUserVotesStore()
    store[userId] = Array.from(votedSubmissionIds)
    localStorage.setItem(USER_VOTES_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore storage quota / disabled storage
  }
}

function normalizeStoredSubmission(value: unknown): Submission | null {
  if (!value || typeof value !== 'object') return null
  const submission = value as Partial<Submission>
  if (
    typeof submission.id !== 'string' ||
    typeof submission.createdAt !== 'string' ||
    typeof submission.participantName !== 'string' ||
    typeof submission.appName !== 'string' ||
    typeof submission.appDescription !== 'string' ||
    typeof submission.problemDescription !== 'string' ||
    typeof submission.appLink !== 'string'
  ) {
    return null
  }

  return {
    id: submission.id,
    createdAt: submission.createdAt,
    participantName: submission.participantName,
    appName: submission.appName,
    appDescription: submission.appDescription,
    problemDescription: submission.problemDescription,
    appLink: submission.appLink,
    hackathonId: DEFAULT_HACKATHON_ID,
    votes: typeof submission.votes === 'number' && Number.isFinite(submission.votes) ? submission.votes : 0,
    userId: typeof submission.userId === 'string' ? submission.userId : null,
  }
}

function hackathonChanged(a: Hackathon, b: Hackathon) {
  return (
    a.name !== b.name ||
    a.logoUrl !== b.logoUrl ||
    a.acceptingSubmissions !== b.acceptingSubmissions ||
    a.startsAt !== b.startsAt ||
    a.endsAt !== b.endsAt ||
    a.createdAt !== b.createdAt
  )
}

function submissionChanged(a: Submission, b: Submission) {
  return (
    a.createdAt !== b.createdAt ||
    a.participantName !== b.participantName ||
    a.appName !== b.appName ||
    a.appDescription !== b.appDescription ||
    a.problemDescription !== b.problemDescription ||
    a.appLink !== b.appLink ||
    a.hackathonId !== b.hackathonId ||
    a.votes !== b.votes
  )
}

function RequireAuth({ user, children }: { user: User | null; children: React.ReactNode }) {
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireAdminAuth({
  isAdminAuthenticated,
  children,
}: {
  isAdminAuthenticated: boolean
  children: React.ReactNode
}) {
  if (!isAdminAuthenticated) return <Navigate to="/admin-login" replace />
  return <>{children}</>
}

type HeaderVariant = 'full' | 'hackathon'

function HeaderNav({
  user,
  variant,
  hackathonLogoUrl,
  hackathonName,
}: {
  user: User | null
  variant: HeaderVariant
  hackathonLogoUrl?: string | null
  hackathonName?: string | null
}) {
  const location = useLocation()
  const onSubmitPage = location.pathname === '/submit'
  const onAdminPage = location.pathname === '/admin'
  const onHackathonsPage = location.pathname === '/hackathons'
  const showBack = Boolean(user && variant === 'full' && !onHackathonsPage && !onAdminPage)
  const normalizedHackathonLogoUrl = hackathonLogoUrl?.trim() ?? ''
  const showHackathonLogo = normalizedHackathonLogoUrl.length > 0

  return (
    <header className="header">
      {showBack && (
        <Link className="btn btnGhost headerBack" to="/hackathons" aria-label="Back to hackathons" title="Back to hackathons">
          <svg
            aria-hidden="true"
            className="headerBackIcon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20 12H5" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" />
            <path d="M11 6L5 12L11 18" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
      <div className="headerInner">
        <div className="brand">
          <div className="brandMarks">
            {showHackathonLogo && (
              <div className="brandMark">
                <img className="brandLogo" src={normalizedHackathonLogoUrl} alt={`${hackathonName ?? 'Hackathon'} logo`} />
              </div>
            )}
            <div className="brandMark">
              <img className="brandLogo brandLogoCnb" src="/assets/chatandbuild-logo.jpg" alt="ChatAndBuild logo" />
            </div>
          </div>
          <div>
            {onAdminPage ? (
              <h1 className="title">
                <span className="titleMain">Hackathon Admin Portal</span>
              </h1>
            ) : (
              <>
                {variant === 'full' && <div className="titleLead">{hackathonName ?? 'ChatAndBuild'}</div>}
                <h1 className="title">ChatAndBuild Hackathon Submission Portal</h1>
                <p className="subtitle">
                  {variant === 'hackathon' ? 'Choose a hackathon to continue.' : 'Browse submissions or add a new one.'}
                </p>
              </>
            )}
          </div>
        </div>

        {!onAdminPage && (
          <div className="headerActions">
            {user ? (
              <>
                <Link className="btn btnGhost" to="/profile">
                  Profile
                </Link>
                <button
                  className="btn btnGhost"
                  type="button"
                  onClick={() => {
                    if (!supabase) return
                    void supabase.auth.signOut()
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link className="btn btnGhost" to="/login">
                  Log in
                </Link>
                <Link className="btn" to="/signup">
                  Sign up
                </Link>
              </>
            )}
            {user &&
              variant === 'full' &&
              (onSubmitPage ? (
                <Link className="btn btnGhost" to="/home">
                  View submissions
                </Link>
              ) : (
                <Link className="btn" to="/submit">
                  New submission
                </Link>
              ))}
          </div>
        )}
      </div>
    </header>
  )
}

function SubmissionsPage({
  submissions,
  hackathons,
  selectedHackathonId,
  onSelectedHackathonChange,
  onVote,
  votingSubmissionIds,
  votedSubmissionIds,
}: {
  submissions: Submission[]
  hackathons: Hackathon[]
  selectedHackathonId: string
  onSelectedHackathonChange: (hackathonId: string) => void
  onVote: (submissionId: string) => void
  votingSubmissionIds: ReadonlySet<string>
  votedSubmissionIds: ReadonlySet<string>
}) {
  const sortedSubmissions = useMemo(() => {
    return [...submissions]
      .sort((a, b) => {
        const voteDelta = b.votes - a.votes
        if (voteDelta !== 0) return voteDelta
        const createdAtDelta = Date.parse(b.createdAt) - Date.parse(a.createdAt)
        if (Number.isFinite(createdAtDelta) && createdAtDelta !== 0) return createdAtDelta
        return a.id.localeCompare(b.id)
      })
  }, [submissions])
  const featured = useMemo(() => {
    return sortedSubmissions
      .slice(0, 3)
  }, [sortedSubmissions])
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [carouselNonce, setCarouselNonce] = useState(0)
  const selectedHackathonName = useMemo(() => {
    if (selectedHackathonId === 'all') return 'All hackathons'
    return hackathons.find((hackathon) => hackathon.id === selectedHackathonId)?.name ?? 'All hackathons'
  }, [hackathons, selectedHackathonId])
  const featuredSignature = useMemo(
    () => featured.map((submission) => `${submission.id}:${submission.votes}`).join('|'),
    [featured],
  )

  useEffect(() => {
    setFeaturedIndex(0)
  }, [featuredSignature])

  useEffect(() => {
    if (featured.length <= 1) return
    const id = window.setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % featured.length)
    }, 10_000)
    return () => window.clearInterval(id)
  }, [featured.length, carouselNonce])

  function goToFeatured(nextIndex: number) {
    setFeaturedIndex(nextIndex)
    setCarouselNonce((n) => n + 1)
  }

  return (
    <>
      <section className="card">
        <div className="listHeader">
          <h2 className="cardTitle cardTitleHero">Featured submissions</h2>
          <div className="helpRow">
            <label className="helpText" htmlFor="homeHackathonFilter">
              Hackathon
            </label>
            <select
              id="homeHackathonFilter"
              value={selectedHackathonId}
              onChange={(e) => onSelectedHackathonChange(e.target.value)}
              aria-label="Filter submissions by hackathon"
            >
              <option value="all">All hackathons</option>
              {hackathons.map((hackathon) => (
                <option key={hackathon.id} value={hackathon.id}>
                  {hackathon.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="cardHint">Showing: {selectedHackathonName}</p>

        {submissions.length === 0 ? (
          <div className="empty">No submissions yet. Use “New submission” to add the first one.</div>
        ) : featured.length === 0 ? (
          <div className="empty">No featured submissions yet.</div>
        ) : (
          <div className="featuredCarousel" aria-label="Featured submission carousel">
            <div className="featuredViewport">
              <div
                className="featuredTrack"
                style={{ transform: `translateX(-${featuredIndex * 100}%)` }}
              >
                {featured.map((s) => (
                  <div className="featuredSlide" key={s.id}>
                    <article className="submission submissionFeatured" role="article">
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
                            <span className="metaDot" aria-hidden="true">
                              ·
                            </span>
                            <span className="metaItem">{s.votes} votes</span>
                          </div>
                        </div>
                        <div className="submissionActions">
                          <button
                            className="btn btnGhost voteButton"
                            type="button"
                            onClick={() => onVote(s.id)}
                            disabled={votingSubmissionIds.has(s.id) || votedSubmissionIds.has(s.id)}
                          >
                            {votingSubmissionIds.has(s.id) ? 'Voting...' : votedSubmissionIds.has(s.id) ? 'Voted' : 'Vote'}
                          </button>
                          <a className="link" href={s.appLink} target="_blank" rel="noopener noreferrer">
                            Open app
                          </a>
                        </div>
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
                  </div>
                ))}
              </div>
            </div>

            {featured.length > 1 && (
              <div className="featuredDots" role="tablist" aria-label="Choose featured submission">
                {featured.map((_, i) => (
                  <button
                    key={`featured_dot_${i}`}
                    type="button"
                    className={i === featuredIndex ? 'featuredDot featuredDotActive' : 'featuredDot'}
                    onClick={() => goToFeatured(i)}
                    aria-label={`Show featured submission ${i + 1} of ${featured.length}`}
                    aria-current={i === featuredIndex}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="card">
        <div className="listHeader">
          <h2 className="cardTitle cardTitleHero">All submissions</h2>
          <div className="pill" aria-label={`${submissions.length} total submissions`}>
            {submissions.length}
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="empty">Nothing here yet.</div>
        ) : (
          <div className="compactList" role="list">
            {sortedSubmissions.map((s) => (
              <article className="compactCard" role="listitem" key={`compact_${s.id}`}>
                <div className="compactTop">
                  <div className="compactMain">
                    <div className="compactTitle">{s.appName}</div>
                    <div className="compactMeta">
                      <span className="compactBy">by {s.participantName}</span>
                    </div>
                  </div>
                  <a
                    className="compactAction"
                    href={s.appLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${s.appName} by ${s.participantName}`}
                  >
                    Open app
                  </a>
                </div>

                <a
                  className="thumb thumbCompact"
                  href={s.appLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${s.appName} preview`}
                >
                  <img
                    className="thumbImg"
                    src={screenshotUrl(s.appLink, { width: 1200, height: 800 })}
                    alt={`${s.appName} homepage screenshot`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </a>

                <div className="compactFooter">
                  <span className="compactVotes">{s.votes} votes</span>
                  <button
                    className="btn btnGhost compactVoteButton"
                    type="button"
                    onClick={() => onVote(s.id)}
                    disabled={votingSubmissionIds.has(s.id) || votedSubmissionIds.has(s.id)}
                  >
                    {votingSubmissionIds.has(s.id) ? 'Voting...' : votedSubmissionIds.has(s.id) ? 'Voted' : 'Vote'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function NewSubmissionPage({
  onCreate,
  hackathons,
  selectedHackathonId,
  currentUserId,
}: {
  onCreate: (submission: Submission) => void
  hackathons: Hackathon[]
  selectedHackathonId: string
  currentUserId: string | null
}) {
  const [justSavedId, setJustSavedId] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const [form, setForm] = useState<FormState>({
    participantName: '',
    appName: '',
    hackathonId: '',
    appDescription: '',
    problemDescription: '',
    appLink: '',
  })

  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({})

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const selectedHackathon = useMemo(
    () => hackathons.find((hackathon) => hackathon.id === selectedHackathonId) ?? null,
    [hackathons, selectedHackathonId],
  )
  const acceptingHackathons = useMemo(() => {
    if (!selectedHackathon) return []
    return isHackathonOpen(selectedHackathon, nowMs) ? [selectedHackathon] : []
  }, [selectedHackathon, nowMs])

  useEffect(() => {
    setForm((prev) => {
      if (prev.hackathonId === selectedHackathonId) return prev
      return { ...prev, hackathonId: selectedHackathonId }
    })
  }, [selectedHackathonId])

  const errors = useMemo(() => validate(form, acceptingHackathons), [form, acceptingHackathons])
  const appDescWords = useMemo(() => wordCount(form.appDescription), [form.appDescription])
  const problemWords = useMemo(() => wordCount(form.problemDescription), [form.problemDescription])
  const hardBlocked = appDescWords > 100 || problemWords > 200 || acceptingHackathons.length === 0

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
      hackathonId: '',
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
      hackathonId: true,
      appDescription: true,
      problemDescription: true,
      appLink: true,
    }
    setTouched(nextTouched)

    const currentErrors = validate(form, acceptingHackathons)
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
      hackathonId: form.hackathonId,
      votes: 0,
      userId: currentUserId,
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
        <div className="formGrid">
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
            <label>
              Hackathon <span className="req">*</span>
            </label>
            <div className="callout">
              <div className="font-extrabold text-slate-100">{selectedHackathon?.name ?? '—'}</div>
              {acceptingHackathons.length === 0 && (
                <div className="mt-1 text-sm text-rose-200 font-bold">
                  This hackathon is not currently accepting submissions.
                </div>
              )}
            </div>
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
  const location = useLocation()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(SELECTED_HACKATHON_STORAGE_KEY)
      return stored && stored.trim().length > 0 ? stored : 'all'
    } catch {
      return 'all'
    }
  })
  const [hasLoadedHackathons, setHasLoadedHackathons] = useState(false)
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [votingSubmissionIds, setVotingSubmissionIds] = useState<Set<string>>(new Set())
  const [votedSubmissionIds, setVotedSubmissionIds] = useState<Set<string>>(new Set())
  const prevSubmissionsRef = useRef<Map<string, Submission> | null>(null)
  const prevHackathonsRef = useRef<Map<string, Hackathon> | null>(null)
  const votingSubmissionIdsRef = useRef<Set<string>>(new Set())
  const votedSubmissionIdsRef = useRef<Set<string>>(new Set())
  const visibleSubmissions = useMemo(
    () =>
      selectedHackathonId === 'all'
        ? submissions
        : submissions.filter((submission) => submission.hackathonId === selectedHackathonId),
    [selectedHackathonId, submissions],
  )
  const headerHackathon = useMemo(() => {
    const hackathonIdForHeader =
      location.pathname === '/submit' && selectedHackathonId === 'all' ? DEFAULT_HACKATHON_ID : selectedHackathonId
    if (hackathonIdForHeader === 'all') return null
    return hackathons.find((hackathon) => hackathon.id === hackathonIdForHeader) ?? null
  }, [hackathons, location.pathname, selectedHackathonId])

  function setSubmissionVoting(submissionId: string, isVoting: boolean) {
    if (isVoting) votingSubmissionIdsRef.current.add(submissionId)
    else votingSubmissionIdsRef.current.delete(submissionId)
    setVotingSubmissionIds(new Set(votingSubmissionIdsRef.current))
  }

  function setLoadedVotedSubmissionIds(nextVotedSubmissionIds: Set<string>) {
    votedSubmissionIdsRef.current = nextVotedSubmissionIds
    setVotedSubmissionIds(nextVotedSubmissionIds)
  }

  function markSubmissionAsVoted(submissionId: string) {
    if (votedSubmissionIdsRef.current.has(submissionId)) return
    const next = new Set(votedSubmissionIdsRef.current)
    next.add(submissionId)
    setLoadedVotedSubmissionIds(next)
  }

  async function handleVote(submissionId: string) {
    if (votingSubmissionIdsRef.current.has(submissionId) || votedSubmissionIdsRef.current.has(submissionId)) return

    if (isSupabaseConfigured && hasLoadedFromDb && user?.id) {
      setSubmissionVoting(submissionId, true)
      try {
        const voteResult = await db.incrementSubmissionVotes(submissionId)
        setSubmissions((prev) =>
          prev.map((submission) =>
            submission.id === submissionId ? { ...submission, votes: voteResult.votes } : submission,
          ),
        )
        markSubmissionAsVoted(submissionId)
      } catch (err) {
        console.error(err)
      } finally {
        setSubmissionVoting(submissionId, false)
      }
      return
    }

    setSubmissions((prev) =>
      prev.map((submission) =>
        submission.id === submissionId ? { ...submission, votes: submission.votes + 1 } : submission,
      ),
    )
    markSubmissionAsVoted(submissionId)
  }

  useEffect(() => {
    if (!user?.id) {
      setLoadedVotedSubmissionIds(new Set())
      return
    }

    if (!isSupabaseConfigured) {
      setLoadedVotedSubmissionIds(getUserVotedSubmissionIds(user.id))
      return
    }

    if (!hasLoadedFromDb) return

    let cancelled = false
    void db
      .listCurrentUserVotedSubmissionIds()
      .then((votedSubmissionIdsList) => {
        if (cancelled) return
        setLoadedVotedSubmissionIds(new Set(votedSubmissionIdsList))
      })
      .catch((err) => {
        console.error(err)
        if (cancelled) return
        setLoadedVotedSubmissionIds(getUserVotedSubmissionIds(user.id))
      })

    return () => {
      cancelled = true
    }
  }, [hasLoadedFromDb, user?.id])

  useEffect(() => {
    if (!user?.id) return
    if (isSupabaseConfigured) return
    saveUserVotedSubmissionIds(user.id, votedSubmissionIds)
  }, [user?.id, votedSubmissionIds])

  useEffect(() => {
    if (!supabase) return

    let cancelled = false
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setUser(data.session?.user ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setUser(session?.user ?? null)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadFromSupabase(): Promise<boolean> {
      setDbError(null)
      try {
        // local cache (optional migration)
        let localStoredSubmissions: Submission[] = []
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
              localStoredSubmissions = parsed
                .map((item) => normalizeStoredSubmission(item))
                .filter((item): item is Submission => item !== null)
            }
          }
        } catch {
          // ignore local storage issues
        }

        const localHackathons = (() => {
          try {
            return getHackathons()
          } catch {
            return seedHackathons()
          }
        })()

        const [remoteHackathons, remoteSubmissions] = await Promise.all([db.listHackathons(), db.listSubmissions()])

        // Ensure seeded hackathons exist and migrate local hackathons into DB.
        const seededHackathons = seedHackathons()
        const hackathonById = new Map<string, Hackathon>()
        for (const h of remoteHackathons) hackathonById.set(h.id, h)
        for (const h of localHackathons) if (!hackathonById.has(h.id)) hackathonById.set(h.id, h)
        for (const h of seededHackathons) if (!hackathonById.has(h.id)) hackathonById.set(h.id, h)
        const mergedHackathons = Array.from(hackathonById.values()).sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
        )

        // Merge submissions (remote + local + seeds)
        const submissionById = new Map<string, Submission>()
        for (const s of remoteSubmissions) submissionById.set(s.id, s)
        for (const s of localStoredSubmissions) if (!submissionById.has(s.id)) submissionById.set(s.id, s)
        const mergedNoSeeds = Array.from(submissionById.values()).map((s) => ({ ...s, hackathonId: DEFAULT_HACKATHON_ID }))
        const byLink = new Set(mergedNoSeeds.map((s) => s.appLink))
        const missingSeeds = seedSubmissions.filter((s) => !byLink.has(s.appLink))
        const mergedSubmissions = [...missingSeeds, ...mergedNoSeeds].sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
        )

        // Persist merged state back to DB (idempotent)
        await db.upsertHackathons(mergedHackathons)
        await db.upsertSubmissions(mergedSubmissions)

        if (cancelled) return false
        setHackathons(mergedHackathons)
        setSubmissions(mergedSubmissions)
        setHasLoadedHackathons(true)
        setHasLoadedFromDb(true)
        return true
      } catch (err) {
        console.error(err)
        if (cancelled) return false
        setDbError('Supabase is configured but could not be reached. Falling back to local storage.')
        setHasLoadedFromDb(false)
        setHasLoadedHackathons(false)
        return false
      }
    }

    function loadFromLocalStorage() {
      let stored: Submission[] = []
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            stored = parsed
              .map((item) => normalizeStoredSubmission(item))
              .filter((item): item is Submission => item !== null)
          }
        }
      } catch {
        // ignore corrupted storage
      }

      const byLink = new Set(stored.map((s) => s.appLink))
      const seeded = seedSubmissions.filter((s) => !byLink.has(s.appLink))
      setSubmissions(seeded.length > 0 ? [...seeded, ...stored] : stored)

      setHackathons(getHackathons())
      setHasLoadedHackathons(true)
    }

    if (isSupabaseConfigured) {
      void loadFromSupabase().then((ok) => {
        if (!cancelled && !ok) loadFromLocalStorage()
      })
    } else {
      loadFromLocalStorage()
    }

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isSupabaseConfigured) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions))
    } catch {
      // ignore storage quota / disabled storage
    }
  }, [submissions])

  useEffect(() => {
    if (!hasLoadedHackathons) return
    if (isSupabaseConfigured) return
    saveHackathons(hackathons)
  }, [hackathons, hasLoadedHackathons])

  useEffect(() => {
    if (selectedHackathonId === 'all') return
    if (hackathons.some((hackathon) => hackathon.id === selectedHackathonId)) return
    setSelectedHackathonId('all')
  }, [hackathons, selectedHackathonId])

  useEffect(() => {
    try {
      localStorage.setItem(SELECTED_HACKATHON_STORAGE_KEY, selectedHackathonId)
    } catch {
      // ignore storage quota / disabled storage
    }
  }, [selectedHackathonId])

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, String(isAdminAuthenticated))
    } catch {
      // ignore storage quota / disabled storage
    }
  }, [isAdminAuthenticated])

  useEffect(() => {
    if (!isSupabaseConfigured || !hasLoadedFromDb) return

    const prev = prevSubmissionsRef.current ?? new Map<string, Submission>()
    const next = new Map<string, Submission>(submissions.map((s) => [s.id, s] as const))

    const deletedIds: string[] = []
    for (const id of prev.keys()) {
      if (!next.has(id)) deletedIds.push(id)
    }

    const changed: Submission[] = []
    for (const [id, row] of next.entries()) {
      const before = prev.get(id)
      if (!before || submissionChanged(before, row)) changed.push(row)
    }

    prevSubmissionsRef.current = next

    void (async () => {
      try {
        await db.upsertSubmissions(changed)
        await db.deleteSubmissions(deletedIds)
      } catch (err) {
        console.error(err)
      }
    })()
  }, [submissions, hasLoadedFromDb])

  useEffect(() => {
    if (!isSupabaseConfigured || !hasLoadedFromDb) return

    const prev = prevHackathonsRef.current ?? new Map<string, Hackathon>()
    const next = new Map<string, Hackathon>(hackathons.map((h) => [h.id, h] as const))

    const deletedIds: string[] = []
    for (const id of prev.keys()) {
      if (!next.has(id)) deletedIds.push(id)
    }

    const changed: Hackathon[] = []
    for (const [id, row] of next.entries()) {
      const before = prev.get(id)
      if (!before || hackathonChanged(before, row)) changed.push(row)
    }

    prevHackathonsRef.current = next

    void (async () => {
      try {
        await db.upsertHackathons(changed)
        await db.deleteHackathons(deletedIds)
      } catch (err) {
        console.error(err)
      }
    })()
  }, [hackathons, hasLoadedFromDb])

  return (
    <div className="page">
      {user ? (
        <HeaderNav
          user={user}
          variant={location.pathname === '/hackathons' ? 'hackathon' : 'full'}
          hackathonLogoUrl={headerHackathon?.logoUrl ?? null}
          hackathonName={headerHackathon?.name ?? null}
        />
      ) : null}

      <main className="content">
        {dbError && (
          <div className="callout" role="status">
            {dbError}
          </div>
        )}
        <Routes>
          <Route path="/" element={user ? <Navigate to="/hackathons" replace /> : <LandingPage />} />
          <Route
            path="/admin-login"
            element={
              isAdminAuthenticated ? (
                <Navigate to="/admin-dashboard" replace />
              ) : (
                <AdminLoginPage onAuthenticated={() => setIsAdminAuthenticated(true)} />
              )
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <RequireAdminAuth isAdminAuthenticated={isAdminAuthenticated}>
                <AdminDashboardPage onSignOut={() => setIsAdminAuthenticated(false)} />
              </RequireAdminAuth>
            }
          />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />
          <Route path="/reset" element={<ResetPasswordPage />} />
          <Route
            path="/hackathons"
            element={
              <RequireAuth user={user}>
                <HackathonSelectPage
                  hackathons={hackathons}
                  selectedHackathonId={selectedHackathonId}
                  onSelectHackathon={(id) => setSelectedHackathonId(id)}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/home"
            element={
              <RequireAuth user={user}>
                <SubmissionsPage
                  submissions={visibleSubmissions}
                  hackathons={hackathons}
                  selectedHackathonId={selectedHackathonId}
                  onSelectedHackathonChange={setSelectedHackathonId}
                  onVote={handleVote}
                  votingSubmissionIds={votingSubmissionIds}
                  votedSubmissionIds={votedSubmissionIds}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth user={user}>
                <ProfilePage user={user} />
              </RequireAuth>
            }
          />
          <Route
            path="/submit"
            element={
              <RequireAuth user={user}>
                <NewSubmissionPage
                  onCreate={(s) => setSubmissions((prev) => [s, ...prev])}
                  hackathons={hackathons}
                  selectedHackathonId={selectedHackathonId === 'all' ? DEFAULT_HACKATHON_ID : selectedHackathonId}
                  currentUserId={user?.id ?? null}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth user={user}>
                <AdminPage
                  submissions={submissions}
                  setSubmissions={setSubmissions}
                  hackathons={hackathons}
                  setHackathons={setHackathons}
                />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
