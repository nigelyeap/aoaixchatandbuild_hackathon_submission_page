import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    setError(null)

    const trimmedName = name.trim()
    const trimmedPassword = password
    if (!trimmedName || !trimmedPassword) {
      setError('Name and password are required.')
      return
    }

    // Supabase password auth requires an email; we treat "name" as the email address here.
    if (!trimmedName.includes('@')) {
      setError('Please enter your email address in the name field.')
      return
    }

    setBusy(true)
    void (async () => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedName,
          password: trimmedPassword,
        })
        if (error) throw error
        navigate('/home')
      } catch (err) {
        console.error(err)
        setError('Login failed. Check your credentials (and confirm your email if you just signed up).')
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <section className="card">
      <h2 className="cardTitle cardTitleHero">Log in</h2>
      <p className="cardHint">Log in with your email and password.</p>

      {!isSupabaseConfigured ? (
        <div className="empty">Supabase is not configured on this deployment.</div>
      ) : (
        <>
          {error && (
            <div className="callout" role="status">
              {error}
            </div>
          )}

          <form className="form" onSubmit={submit} noValidate>
            <div className="formGrid">
              <div className="field span2">
                <label htmlFor="loginName">
                  Name <span className="req">*</span>
                </label>
                <input
                  id="loginName"
                  name="loginName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={busy}
                />
              </div>

              <div className="field span2">
                <label htmlFor="loginPassword">
                  Password <span className="req">*</span>
                </label>
                <input
                  id="loginPassword"
                  name="loginPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  disabled={busy}
                />
              </div>
            </div>

            <div className="actions">
              <button className="btn" type="submit" disabled={busy}>
                {busy ? 'Logging in…' : 'Log in'}
              </button>
              <Link className="btn btnGhost" to="/signup">
                Create account
              </Link>
            </div>
          </form>
        </>
      )}
    </section>
  )
}

