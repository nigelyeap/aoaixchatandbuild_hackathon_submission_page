import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

type ProfileRow = {
  id: string
  email: string | null
  display_name: string | null
  created_at: string
}

type ProfileSubmission = {
  id: string
  userId: string | null
  hackathonId: string
  appName: string
  participantName: string
  appLink: string
}

type ProfileHackathon = {
  id: string
  name: string
}

export default function ProfilePage({
  user,
  submissions,
  hackathons,
  votedSubmissionIds,
}: {
  user: User | null
  submissions: ProfileSubmission[]
  hackathons: ProfileHackathon[]
  votedSubmissionIds: ReadonlySet<string>
}) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')

  const suggestedName = useMemo(() => {
    const meta = user?.user_metadata as Record<string, unknown> | undefined
    const displayName = typeof meta?.display_name === 'string' ? meta.display_name : ''
    const fullName = typeof meta?.full_name === 'string' ? meta.full_name : ''
    const name = typeof meta?.name === 'string' ? meta.name : ''
    return displayName || fullName || name || ''
  }, [user])

  const userEmail = user?.email ?? ''
  const userSubmissions = useMemo(
    () => submissions.filter((submission) => submission.userId === user?.id),
    [submissions, user?.id],
  )
  const submissionsByHackathon = useMemo(() => {
    const nameById = new Map(hackathons.map((hackathon) => [hackathon.id, hackathon.name] as const))
    const counts = new Map<string, number>()
    for (const submission of userSubmissions) {
      counts.set(submission.hackathonId, (counts.get(submission.hackathonId) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([hackathonId, count]) => ({
        hackathonId,
        hackathonName: nameById.get(hackathonId) ?? 'Unknown hackathon',
        count,
      }))
      .sort((a, b) => b.count - a.count)
  }, [hackathons, userSubmissions])
  const votedSubmissions = useMemo(() => {
    const nameById = new Map(hackathons.map((hackathon) => [hackathon.id, hackathon.name] as const))
    return submissions
      .filter((submission) => votedSubmissionIds.has(submission.id))
      .map((submission) => ({
        ...submission,
        hackathonName: nameById.get(submission.hackathonId) ?? 'Unknown hackathon',
      }))
  }, [hackathons, submissions, votedSubmissionIds])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (!user) return
    if (!supabase) return

    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, display_name, created_at')
          .eq('id', user.id)
          .maybeSingle()
        if (error) throw error
        if (cancelled) return

        const row = (data as ProfileRow | null) ?? null
        setDisplayName(row?.display_name ?? suggestedName)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Could not load profile.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, suggestedName])

  if (!isSupabaseConfigured) {
    return (
      <section className="card">
        <h2 className="cardTitle cardTitleHero">Profile</h2>
        <div className="empty">Supabase is not configured on this deployment.</div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="card">
        <h2 className="cardTitle cardTitleHero">Profile</h2>
        <div className="empty">Please sign in first.</div>
      </section>
    )
  }

  return (
    <section className="card">
      <h2 className="cardTitle cardTitleHero">Your profile</h2>

      {error && (
        <div className="callout" role="status">
          {error}
        </div>
      )}

      <div className="formGrid">
        <div className="field span2">
          <label htmlFor="profileEmail">Email</label>
          <input
            id="profileEmail"
            name="profileEmail"
            value={userEmail}
            disabled
            placeholder="—"
          />
        </div>

        <div className="field">
          <label htmlFor="displayName">
            Display name <span className="req">*</span>
          </label>
          <input
            id="displayName"
            name="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Shely E"
            disabled={loading || saving}
          />
        </div>

      </div>

      <div className="card mt-4">
        <h3 className="cardTitle">Submission summary</h3>
        <p className="cardHint">Total submissions: {userSubmissions.length}</p>
        {submissionsByHackathon.length === 0 ? (
          <div className="empty">You have not submitted to any hackathons yet.</div>
        ) : (
          <div className="list mt-3">
            {submissionsByHackathon.map((item) => (
              <div key={item.hackathonId} className="submission">
                <div className="submissionTitle">{item.hackathonName}</div>
                <div className="submissionMeta">
                  <span>{item.count} submission(s)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mt-4">
        <h3 className="cardTitle">Votes you cast</h3>
        <p className="cardHint">Total votes cast: {votedSubmissions.length}</p>
        {votedSubmissions.length === 0 ? (
          <div className="empty">You have not voted for any submissions yet.</div>
        ) : (
          <div className="list mt-3">
            {votedSubmissions.map((item) => (
              <a
                key={`voted_${item.id}`}
                className="submission block"
                href={item.appLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${item.appName} by ${item.participantName}`}
              >
                <div className="submissionTitle">{item.appName}</div>
                <div className="submissionMeta">
                  <span>by {item.participantName}</span>
                  <span className="metaDot" aria-hidden="true">
                    ·
                  </span>
                  <span>{item.hackathonName}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="actions">
        <button
          className="btn"
          type="button"
          disabled={saving || loading || displayName.trim().length === 0}
          onClick={() => {
            if (!supabase) return
            setSaving(true)
            setError(null)
            void (async () => {
              try {
                const payload = {
                  id: user.id,
                  email: user.email ?? null,
                  display_name: displayName.trim(),
                }
                const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
                if (error) throw error
              } catch (err) {
                console.error(err)
                setError('Could not save profile.')
              } finally {
                setSaving(false)
              }
            })()
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <Link className="btn btnGhost" to="/forgot">
          Change password
        </Link>
      </div>
    </section>
  )
}

