import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { state: navState } = useLocation()
  const [form, setForm] = useState({
    username: navState?.username || '',
    password: '',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const location = useLocation()
  const justVerified = navState?.verified === true
  const isIdleTimeout = new URLSearchParams(location.search).get('reason') === 'idle_timeout'


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Decorative arcs — PerfumeFinder style */}
      <div className="login-arc-1" />
      <div className="login-arc-2" />

      {/* Watermark monogram */}
      <div style={{
        position: 'absolute', bottom: '10%', right: '8%',
        fontFamily: 'var(--font-serif)', fontSize: '12rem',
        fontWeight: 700, color: 'rgba(212,168,83,0.06)',
        lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
      }}>GS</div>

      <div className="login-card animate-fade-in-up">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-mark">
            <Shield size={22} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--charcoal-900)', lineHeight: 1 }}>
              Cyber Sentinel
            </div>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--charcoal-500)', marginTop: 3 }}>
              Security Platform
            </div>
          </div>
        </div>

        {/* Eyebrow */}
        <div className="login-eyebrow">Secure Access Portal</div>
        <h1 className="login-title">Sign in to your<br />workspace.</h1>
        <p className="login-sub">
          Cyber Sentinel — AI-Powered Security Platform.<br />
          Authorised personnel only.
        </p>

        {/* ✅ Verified success banner */}
        {justVerified && !error && (
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            Email verified successfully! You can now sign in.
          </div>
        )}

        {/* ⏱ Inactivity timeout notice */}
        {isIdleTimeout && (
          <div className="alert alert-warning" style={{ marginBottom: 20 }}>
            <Shield size={16} style={{ flexShrink: 0 }} />
            <span>You were automatically logged out after 15 minutes of inactivity for security and resource protection.</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-critical" style={{ marginBottom: 20 }}>
            <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
            {error.includes('not verified') && (
              <Link to="/verify-email" style={{ marginLeft: 8, color: 'inherit', textDecoration: 'underline' }}>
                Verify now →
              </Link>
            )}
          </div>
        )}


        <form onSubmit={handleSubmit}>
          {/* Username or Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username or Email</label>
            <input
              id="username"
              className="form-control"
              type="text"
              autoComplete="username"
              placeholder="Enter your username or email"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
              <Link
                to="/forgot-password"
                id="link-forgot-password"
                style={{ fontSize: '0.78rem', color: 'var(--burgundy-600, #8B1A2F)', textDecoration: 'none', fontWeight: 500 }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                className="form-control"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--charcoal-500)', display: 'flex'
                }}
                aria-label="Toggle password visibility"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', marginTop: 8, padding: '12px 20px' }}
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Authenticating…</>
            ) : (
              <><Shield size={15} /> Sign in to Platform</>
            )}
          </button>
        </form>

        {/* Divider + Signup link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--cream-300)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--charcoal-500)', whiteSpace: 'nowrap' }}>New to the platform?</span>
          <div style={{ flex: 1, height: 1, background: 'var(--cream-300)' }} />
        </div>
        <Link to="/signup" id="goto-signup" className="btn btn-secondary w-full" style={{ justifyContent: 'center', marginBottom: 16 }}>
          Create an account
        </Link>

        <div className="login-legal">
          This platform is for <strong>authorised, defensive security use only</strong>.<br />
          The honeypot is isolated and must not be used against systems without explicit authorisation.<br />
          AI outputs are advisory. Compliance mappings are reference only.
        </div>
      </div>
    </div>
  )
}
