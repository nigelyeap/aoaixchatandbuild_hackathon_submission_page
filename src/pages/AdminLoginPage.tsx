import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const ADMIN_EMAIL = 'admin@aoai.local'
const ADMIN_PASSWORD = 'admin123'

type AdminLoginPageProps = {
  onAuthenticated: () => void
}

export default function AdminLoginPage({ onAuthenticated }: AdminLoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()
    const trimmedPassword = password
    if (!trimmedEmail || !trimmedPassword) {
      setError('Email and password are required.')
      return
    }

    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setBusy(true)
    void (async () => {
      try {
        await Promise.resolve()
        if (trimmedEmail !== ADMIN_EMAIL || trimmedPassword !== ADMIN_PASSWORD) {
          throw new Error('Invalid admin credentials')
        }

        onAuthenticated()
        navigate('/admin-dashboard')
      } catch (err) {
        console.error(err)
        setError('Admin login failed. Check your credentials.')
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <div className="authShell">
      <div className="w-full max-w-md">
        <div className="authPanel">
          <div className="flex items-center justify-center">
            <div className="grid place-items-center overflow-visible">
              <img
                src="/assets/chatandbuild-logo-horizontal.svg"
                alt="ChatAndBuild logo"
                className="h-24 sm:h-28 w-auto object-contain"
              />
            </div>
          </div>

          <div className="mt-5 text-center">
            <div className="text-xs font-black tracking-[0.18em] uppercase text-violet-200/80">
              AOAI x ChatAndBuild
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight">Admin Login</h1>
            <p className="mt-2 text-sm text-slate-300 font-semibold">Log in with your admin credentials.</p>
          </div>

          {error && (
            <div className="authMessageError">{error}</div>
          )}

          <form className="mt-5 grid gap-3" onSubmit={submit} noValidate>
            <div>
              <label className="block text-sm font-extrabold text-slate-200 mb-2" htmlFor="adminEmail">
                Email
              </label>
              <input
                id="adminEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aoai.local"
                autoComplete="email"
                disabled={busy}
                className="authInput"
              />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-slate-200 mb-2" htmlFor="adminPassword">
                Password
              </label>
              <input
                id="adminPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
                disabled={busy}
                className="authInput"
              />
            </div>

            <button className="btn w-full mt-1" type="submit" disabled={busy}>
              {busy ? 'Logging in…' : 'Log in'}
            </button>

            <Link to="/" className="text-center text-xs font-bold text-slate-400 hover:text-slate-200">
              Back to user login
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}
