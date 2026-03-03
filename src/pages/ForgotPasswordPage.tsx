import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

function getRedirectTo() {
  // Supabase will redirect back here after recovery link is verified
  return `${window.location.origin}/reset`
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    setError(null)
    setSuccess(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Email is required.')
      return
    }

    setBusy(true)
    void (async () => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
          redirectTo: getRedirectTo(),
        })
        if (error) throw error
        setSuccess('Password reset email sent. Check your inbox.')
      } catch (err) {
        console.error(err)
        setError('Could not send reset email. Please try again.')
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <section className="card">
      <h2 className="cardTitle cardTitleHero">Reset your password</h2>
      <p className="cardHint">Enter your email and we’ll send you a reset link.</p>

      {!isSupabaseConfigured ? (
        <div className="empty">Supabase is not configured on this deployment.</div>
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
                <label htmlFor="forgotEmail">
                  Email <span className="req">*</span>
                </label>
                <input
                  id="forgotEmail"
                  name="forgotEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  disabled={busy}
                />
              </div>
            </div>

            <div className="actions">
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Sending…' : 'Send reset link'}
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

