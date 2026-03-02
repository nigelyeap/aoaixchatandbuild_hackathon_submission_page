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
    <div className="min-h-[calc(100vh-3rem)] grid place-items-center py-10">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-black/35 shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur px-7 py-8">
          <div className="flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-white/5 ring-1 ring-white/10 grid place-items-center overflow-hidden">
              <img
                src="/assets/chatandbuild-logo.jpg"
                alt="ChatAndBuild logo"
                className="h-full w-full object-contain p-2"
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
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-rose-200 font-bold">
              {error}
            </div>
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
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-400/40 focus:ring-4 focus:ring-violet-500/15"
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
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-400/40 focus:ring-4 focus:ring-violet-500/15"
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
