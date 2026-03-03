import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setHasSession(Boolean(data.session))
    })
    return () => {
      cancelled = true
    }
  }, [])

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    setError(null)
    setSuccess(null)

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    void (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session) {
          setError('Please open the reset link from your email again.')
          return
        }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setSuccess('Password updated. Redirecting…')
        window.setTimeout(() => navigate('/home'), 800)
      } catch (err) {
        console.error(err)
        setError('Could not update password. Please try again.')
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <section className="card">
      <h2 className="cardTitle cardTitleHero">Set a new password</h2>
      <p className="cardHint">Choose a new password for your account.</p>

      {!isSupabaseConfigured ? (
        <div className="empty">Supabase is not configured on this deployment.</div>
      ) : hasSession === false ? (
        <div className="empty">
          This page is only available from a valid reset link. Go back and request a new reset email.
          <div className="actions">
            <Link className="btn" to="/forgot">
              Forgot password
            </Link>
            <Link className="btn btnGhost" to="/">
              Back
            </Link>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="callout" role="status">
              {error}
            </div>
          )}
          {success && (
            <div className="callout success" role="status">
              {success}
            </div>
          )}

          <form className="form" onSubmit={submit} noValidate>
            <div className="formGrid">
              <div className="field span2">
                <label htmlFor="newPassword">
                  New password <span className="req">*</span>
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>

              <div className="field span2">
                <label htmlFor="confirmPassword">
                  Confirm password <span className="req">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>
            </div>

            <div className="actions">
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Update password'}
              </button>
              <Link className="btn btnGhost" to="/">
                Back
              </Link>
            </div>
          </form>
        </>
      )}
    </section>
  )
}

