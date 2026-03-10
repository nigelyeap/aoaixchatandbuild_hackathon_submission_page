import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

function getRedirectTo() {
  return window.location.origin
}

function getSignupErrorMessage(err: unknown) {
  if (!err || typeof err !== 'object') return 'Sign up failed. Please check your details and try again.'
  const maybeMessage = (err as { message?: unknown }).message
  if (typeof maybeMessage !== 'string' || maybeMessage.trim().length === 0) {
    return 'Sign up failed. Please check your details and try again.'
  }
  const message = maybeMessage.trim()
  const lower = message.toLowerCase()

  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'This email is already registered. Try logging in or use Forgot password.'
  }
  if (lower.includes('invalid email')) return 'Please enter a valid email address.'
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a minute and try again.'
  }
  return message
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    setError(null)
    setSuccess(null)

    const nameTrimmed = fullName.trim()
    const emailTrimmed = email.trim()
    const passwordValue = password
    if (!nameTrimmed || !emailTrimmed || !passwordValue) {
      setError('Name, email, and password are required.')
      return
    }

    setBusy(true)
    void (async () => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: emailTrimmed,
          password: passwordValue,
          options: {
            emailRedirectTo: getRedirectTo(),
            data: { display_name: nameTrimmed },
          },
        })
        if (error) throw error

        // If email confirmations are enabled in Supabase, session will be null and user must confirm first.
        if (!data.session) {
          setSuccess('Check your inbox to confirm your email. After confirming, come back and log in.')
        } else {
          setSuccess('Account created. You are now signed in.')
          navigate('/home')
        }

        setFullName('')
        setEmail('')
        setPassword('')
      } catch (err) {
        console.error(err)
        setError(getSignupErrorMessage(err))
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <section className="card">
      <h2 className="cardTitle cardTitleHero">Sign up</h2>
      <p className="cardHint">Create an account. You may need to confirm your email before logging in.</p>

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
              <div className="field">
                <label htmlFor="signupName">
                  Name <span className="req">*</span>
                </label>
                <input
                  id="signupName"
                  name="signupName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Shely E"
                  autoComplete="name"
                  disabled={busy}
                />
              </div>

              <div className="field">
                <label htmlFor="signupEmail">
                  Email <span className="req">*</span>
                </label>
                <input
                  id="signupEmail"
                  name="signupEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  disabled={busy}
                />
              </div>

              <div className="field span2">
                <label htmlFor="signupPassword">
                  Password <span className="req">*</span>
                </label>
                <input
                  id="signupPassword"
                  name="signupPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  disabled={busy}
                />
              </div>
            </div>

            <div className="actions">
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Creating…' : 'Create account'}
              </button>
              <Link className="btn btnGhost" to="/login">
                Already have an account
              </Link>
            </div>
          </form>
        </>
      )}
    </section>
  )
}

