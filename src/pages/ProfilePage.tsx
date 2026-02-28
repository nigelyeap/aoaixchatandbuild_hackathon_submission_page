import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

type ProfileRow = {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export default function ProfilePage({ user }: { user: User | null }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const suggestedName = useMemo(() => {
    const meta = user?.user_metadata as Record<string, unknown> | undefined
    const displayName = typeof meta?.display_name === 'string' ? meta.display_name : ''
    const fullName = typeof meta?.full_name === 'string' ? meta.full_name : ''
    const name = typeof meta?.name === 'string' ? meta.name : ''
    return displayName || fullName || name || ''
  }, [user])

  const suggestedAvatar = useMemo(() => {
    const meta = user?.user_metadata as Record<string, unknown> | undefined
    const avatar = typeof meta?.avatar_url === 'string' ? meta.avatar_url : ''
    const picture = typeof meta?.picture === 'string' ? meta.picture : ''
    return avatar || picture || ''
  }, [user])

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
          .select('id, email, display_name, avatar_url, created_at')
          .eq('id', user.id)
          .maybeSingle()
        if (error) throw error
        if (cancelled) return

        const row = (data as ProfileRow | null) ?? null
        setDisplayName(row?.display_name ?? suggestedName)
        setAvatarUrl(row?.avatar_url ?? suggestedAvatar)
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
  }, [user, suggestedName, suggestedAvatar])

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
      <p className="cardHint">This is stored in Supabase and linked to your account.</p>

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
            value={user.email ?? ''}
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

        <div className="field">
          <label htmlFor="avatarUrl">Avatar URL</label>
          <input
            id="avatarUrl"
            name="avatarUrl"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            disabled={loading || saving}
          />
        </div>
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
                  avatar_url: avatarUrl.trim() || null,
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
      </div>
    </section>
  )
}

