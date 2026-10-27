import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, UserPlus, Check } from 'lucide-react'
import api from '../services/api'

const ROLES = [
  { value: 'VIEWER',           label: 'Viewer',           desc: 'Read-only access to all sections' },
  { value: 'SECURITY_ANALYST', label: 'Security Analyst', desc: 'Manage events, incidents, threats' },
  { value: 'GRC_ANALYST',      label: 'GRC Analyst',      desc: 'Manage risks, controls, compliance' },
  { value: 'AUDITOR',          label: 'Auditor',          desc: 'Read + export evidence and reports' },
]

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirm_password: '',
    role: 'VIEWER',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        full_name: form.full_name,
        password: form.password,
        role: form.role,
      })
      if (res.data?.email_verification_required === false || res.data?.auto_verified) {
        navigate('/login', {
          state: { verified: true, username: form.username }
        })
      } else {
        navigate('/verify-email', {
          state: { email: form.email, username: form.username }
        })
      }
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail
      if (!err.response) {
        // Network error — backend not running
        setError('Cannot connect to the server. Make sure the backend is running on port 8000.')
      } else if (status === 409) {
        setError(detail || 'An account with that username or email already exists.')
      } else {
        setError(detail || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLES.find(r => r.value === form.role)

  return (
    <div className="login-page">
      {/* Decorative arcs */}
      <div className="login-arc-1" />
      <div className="login-arc-2" />

      {/* Watermark */}
      <div style={{
        position: 'absolute', bottom: '8%', right: '6%',
        fontFamily: 'var(--font-serif)', fontSize: '10rem',
        fontWeight: 700, color: 'rgba(212,168,83,0.06)',
        lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
      }}>GS</div>

      <div className="login-card animate-fade-in-up" style={{ maxWidth: 480 }}>
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

        <div className="login-eyebrow">Create Account</div>
        <h1 className="login-title" style={{ fontSize: '1.6rem' }}>
          Request platform access.
        </h1>
        <p className="login-sub">
          Create your Cyber Sentinel account. In production environments, accounts are provisioned by an administrator.
        </p>

        {/* Error */}
        {error && (
          <div className="alert alert-critical" style={{ marginBottom: 20 }}>
            <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name + Username */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                className="form-control"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-username">Username *</label>
              <input
                id="signup-username"
                className="form-control"
                type="text"
                autoComplete="username"
                placeholder="janesmith"
                value={form.username}
                onChange={e => set('username', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email Address *</label>
            <input
              id="signup-email"
              className="form-control"
              type="email"
              autoComplete="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
            />
          </div>

          {/* Role selection */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Access Role *</label>
              <span style={{ fontSize: '0.72rem', color: 'var(--burgundy-600)', fontWeight: 600 }}>
                Selected: {selectedRole?.label}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ROLES.map(role => {
                const isSelected = form.role === role.value
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => set('role', role.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--burgundy-600, #8B1A2F)' : '1px solid var(--cream-300, #cbd5e1)',
                      background: isSelected ? 'rgba(139,26,47,0.08)' : 'var(--color-surface, #fff)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                      position: 'relative',
                      boxShadow: isSelected ? '0 0 0 1px rgba(139,26,47,0.2)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <div style={{
                        fontSize: '0.78rem', fontWeight: 700,
                        color: isSelected ? 'var(--burgundy-700, #8B1A2F)' : 'var(--charcoal-900, #0f172a)',
                      }}>
                        {role.label}
                      </div>
                      {isSelected && (
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%',
                          background: 'var(--burgundy-600, #8B1A2F)', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.67rem', color: isSelected ? 'var(--charcoal-700)' : 'var(--charcoal-500)', lineHeight: 1.3 }}>
                      {role.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-password"
                className="form-control"
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={e => set('password', e.target.value)}
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
            {/* Password strength indicator */}
            {form.password && (
              <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: form.password.length >= i * 3
                      ? (form.password.length >= 12 ? 'var(--color-low)' : form.password.length >= 8 ? 'var(--color-medium)' : 'var(--color-critical)')
                      : 'var(--cream-300)',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">Confirm Password *</label>
            <input
              id="confirm-password"
              className="form-control"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirm_password}
              onChange={e => set('confirm_password', e.target.value)}
              required
              style={{
                borderColor: form.confirm_password && form.confirm_password !== form.password
                  ? 'var(--color-critical)' : undefined
              }}
            />
            {form.confirm_password && form.confirm_password !== form.password && (
              <div style={{ fontSize: '0.72rem', color: 'var(--color-critical)', marginTop: 4 }}>
                Passwords do not match.
              </div>
            )}
          </div>

          <button
            type="submit"
            id="signup-submit"
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', marginTop: 4, padding: '12px 20px' }}
            disabled={loading || (form.confirm_password && form.confirm_password !== form.password)}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account…</>
            ) : (
              <><UserPlus size={15} /> Create Account</>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--cream-300)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--charcoal-500)' }}>Already have access?</span>
          <div style={{ flex: 1, height: 1, background: 'var(--cream-300)' }} />
        </div>

        <Link to="/login" className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}>
          <Shield size={14} /> Sign in instead
        </Link>

        <div className="login-legal" style={{ marginTop: 20 }}>
          This platform is for <strong>authorised, defensive security use only</strong>.<br />
          Admin role accounts cannot be self-registered and require existing admin approval.
        </div>
      </div>
    </div>
  )
}
