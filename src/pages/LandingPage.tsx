import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

export default function LandingPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'signup' | 'login'>('signup')

  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupBusy, setSignupBusy] = useState(false)
  const [signupMsg, setSignupMsg] = useState<string | null>(null)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)

  const [error, setError] = useState<string | null>(null)

  function getRedirectTo() {
    return window.location.origin
  }

  function submitSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    setError(null)
    setSignupMsg(null)

    const name = signupName.trim()
    const email = signupEmail.trim()
    const password = signupPassword
    if (!name || !email || !password) {
      setError('Name, email, and password are required.')
      return
    }

    setSignupBusy(true)
    void (async () => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getRedirectTo(),
            data: { display_name: name },
          },
        })
        if (error) throw error

        if (!data.session) {
          setSignupMsg('Check your inbox to confirm your email. After confirming, come back and log in.')
          setTab('login')
        } else {
          navigate('/hackathons')
        }

        setSignupName('')
        setSignupEmail('')
        setSignupPassword('')
      } catch (err) {
        console.error(err)
        setError('Sign up failed. Please try a different email or a stronger password.')
      } finally {
        setSignupBusy(false)
      }
    })()
  }

  function submitLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!supabase) return
    setError(null)

    const email = loginEmail.trim()
    const password = loginPassword
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    setLoginBusy(true)
    void (async () => {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/hackathons')
      } catch (err) {
        console.error(err)
        setError('Login failed. Check your credentials (and confirm your email if you just signed up).')
      } finally {
        setLoginBusy(false)
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
            <h1 className="mt-2 text-2xl font-black tracking-tight">Hackathon Submission Portal</h1>
            <p className="mt-2 text-sm text-slate-300 font-semibold">
              {tab === 'signup' ? 'Create an account to continue.' : 'Log in to continue.'}
            </p>
          </div>

          {!isSupabaseConfigured ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-slate-300">
              Supabase is not configured on this deployment.
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className={
                    tab === 'signup'
                      ? 'rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-sm font-extrabold'
                      : 'rounded-xl px-3 py-2 text-sm font-extrabold text-slate-200/80 hover:bg-white/5'
                  }
                >
                  Sign up
                </button>
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className={
                    tab === 'login'
                      ? 'rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-sm font-extrabold'
                      : 'rounded-xl px-3 py-2 text-sm font-extrabold text-slate-200/80 hover:bg-white/5'
                  }
                >
                  Log in
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-rose-200 font-bold">
                  {error}
                </div>
              )}

              {tab === 'signup' ? (
                <form className="mt-5 grid gap-3" onSubmit={submitSignup} noValidate>
                  <div>
                    <label className="block text-sm font-extrabold text-slate-200 mb-2" htmlFor="signupName">
                      Name
                    </label>
                    <input
                      id="signupName"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Shely E"
                      autoComplete="name"
                      disabled={signupBusy}
                      className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-400/40 focus:ring-4 focus:ring-violet-500/15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-slate-200 mb-2" htmlFor="signupEmail">
                      Email
                    </label>
                    <input
                      id="signupEmail"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      inputMode="email"
                      disabled={signupBusy}
                      className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-400/40 focus:ring-4 focus:ring-violet-500/15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-slate-200 mb-2" htmlFor="signupPassword">
                      Password
                    </label>
                    <input
                      id="signupPassword"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Create a password"
                      autoComplete="new-password"
                      disabled={signupBusy}
                      className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-400/40 focus:ring-4 focus:ring-violet-500/15"
                    />
                  </div>

                  {signupMsg && (
                    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-slate-200 font-semibold">
                      {signupMsg}
                    </div>
                  )}

                  <button className="btn w-full mt-1" type="submit" disabled={signupBusy}>
                    {signupBusy ? 'Creating…' : 'Create account'}
                  </button>

                  <p className="text-xs text-slate-400 text-center mt-1">
                    By continuing, you agree to the hackathon submission rules.
                  </p>
                </form>
              ) : (
                <form className="mt-5 grid gap-3" onSubmit={submitLogin} noValidate>
                  <div>
                    <label className="block text-sm font-extrabold text-slate-200 mb-2" htmlFor="loginEmail">
                      Email
                    </label>
                    <input
                      id="loginEmail"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={loginBusy}
                      className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-400/40 focus:ring-4 focus:ring-violet-500/15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-slate-200 mb-2" htmlFor="loginPassword">
                      Password
                    </label>
                    <input
                      id="loginPassword"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                      disabled={loginBusy}
                      className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-400/40 focus:ring-4 focus:ring-violet-500/15"
                    />
                  </div>

                  <button className="btn w-full mt-1" type="submit" disabled={loginBusy}>
                    {loginBusy ? 'Logging in…' : 'Log in'}
                  </button>

                  <div className="text-center text-xs text-slate-400">
                    Need an account?{' '}
                    <button type="button" className="font-extrabold text-violet-200 hover:underline" onClick={() => setTab('signup')}>
                      Sign up
                    </button>
                  </div>

                  <div className="text-center text-xs text-slate-400">
                    <Link className="font-extrabold text-violet-200 hover:underline" to="/forgot">
                      Forgot password?
                    </Link>
                  </div>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link className="text-xs font-bold text-slate-400 hover:text-slate-200" to="#">
                  Privacy
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

