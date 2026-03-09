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
            <h1 className="mt-2 text-2xl font-black tracking-tight">Hackathon Submission Portal</h1>
            <p className="mt-2 text-sm text-slate-300 font-semibold">
              {tab === 'signup' ? 'Create an account to continue.' : 'Log in to continue.'}
            </p>
          </div>

          {!isSupabaseConfigured ? (
            <div className="authMessageInfo mt-6">
              Supabase is not configured on this deployment.
            </div>
          ) : (
            <>
              <div className="authTabs">
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className={tab === 'signup' ? 'authTab authTabActive' : 'authTab'}
                >
                  Sign up
                </button>
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className={tab === 'login' ? 'authTab authTabActive' : 'authTab'}
                >
                  Log in
                </button>
              </div>

              {error && (
                <div className="authMessageError">{error}</div>
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
                      className="authInput"
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
                      className="authInput"
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
                      className="authInput"
                    />
                  </div>

                  {signupMsg && (
                    <div className="authMessageInfo">
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
                      className="authInput"
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
                      className="authInput"
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

            </>
          )}
        </div>
      </div>
    </div>
  )
}

