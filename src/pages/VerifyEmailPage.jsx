import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Shield, RefreshCw, CheckCircle, Mail } from 'lucide-react'
import api from '../services/api'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const { state, search } = useLocation()
  const searchParams = new URLSearchParams(search)
  const email = state?.email || searchParams.get('email') || ''
  const username = state?.username || searchParams.get('username') || ''
  const urlOtp = (searchParams.get('otp') || searchParams.get('code') || '').replace(/\D/g, '').slice(0, 6)

  const [otp, setOtp] = useState(() => {
    if (urlOtp.length === 6) return urlOtp.split('')
    return ['', '', '', '', '', '']
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(60)   // 60s before resend allowed
  const [canResend, setCanResend] = useState(false)

  const inputs = useRef([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // If no email in state or URL, redirect to signup
  useEffect(() => {
    if (!email) navigate('/signup')
  }, [email])

  // ── OTP input handling ────────────────────────────────────
  const handleOtpChange = (index, value) => {
    // Accept only digits
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)   // Only last char if paste
    setOtp(newOtp)
    setError('')
    // Auto-advance
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputs.current[index - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputs.current[index + 1]?.focus()
  }

  // Handle paste — e.g. pasting "123456" fills all boxes
  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      inputs.current[5]?.focus()
    }
  }

  // ── Submit OTP ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) {
      setError('Please enter all 6 digits.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/verify-email', { email, otp: code })
      setSuccess(true)
      setTimeout(() => navigate('/login', { state: { verified: true } }), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed. Check the code and try again.')
      // Clear on error
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true)
    setError('')
    setResent(false)
    try {
      await api.post('/auth/resend-otp', { email })
      setResent(true)
      setCountdown(60)
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend code. Try again.')
    } finally {
      setResending(false)
    }
  }

  // ── Success screen ────────────────────────────────────────
  if (success) {
    return (
      <div className="login-page">
        <div className="login-arc-1" />
        <div className="login-arc-2" />
        <div className="login-card animate-fade-in-up" style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#f0fdf4', border: '2px solid #86efac',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'pulse-dot 1s ease infinite',
          }}>
            <CheckCircle size={32} color="var(--color-low)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', marginBottom: 8 }}>
            Email Verified!
          </h2>
          <p style={{ color: 'var(--charcoal-500)', fontSize: '0.85rem', marginBottom: 20 }}>
            Your account is now active. Redirecting to sign in…
          </p>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-arc-1" />
      <div className="login-arc-2" />
      <div style={{
        position: 'absolute', bottom: '10%', right: '6%',
        fontFamily: 'var(--font-serif)', fontSize: '10rem',
        fontWeight: 700, color: 'rgba(212,168,83,0.06)',
        lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
      }}>OTP</div>

      <div className="login-card animate-fade-in-up" style={{ maxWidth: 440 }}>
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-mark"><Shield size={22} color="white" /></div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--charcoal-900)', lineHeight: 1 }}>Cyber Sentinel</div>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--charcoal-500)', marginTop: 3 }}>Security Platform</div>
          </div>
        </div>

        {/* Email icon + heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(139,26,47,0.07)',
            border: '1px solid rgba(139,26,47,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Mail size={22} color="var(--burgundy-600)" />
          </div>
          <div className="login-eyebrow">Email Verification</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.55rem', fontWeight: 600, color: 'var(--charcoal-900)', margin: '6px 0 8px' }}>
            Check your inbox.
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--charcoal-500)', lineHeight: 1.6 }}>
            We sent a 6-digit code to<br />
            <strong style={{ color: 'var(--charcoal-900)' }}>{email}</strong>
          </p>
        </div>

        {/* Resent success */}
        {resent && (
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            New code sent! Check your inbox (or backend console in dev mode).
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-critical" style={{ marginBottom: 16 }}>
            <Shield size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 6-box OTP input */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                style={{
                  width: 52, height: 60,
                  textAlign: 'center',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.8rem',
                  fontWeight: 600,
                  color: 'var(--charcoal-900)',
                  background: digit ? 'rgba(139,26,47,0.04)' : 'var(--color-surface)',
                  border: `2px solid ${digit ? 'var(--burgundy-600)' : 'var(--cream-300)'}`,
                  borderRadius: 10,
                  outline: 'none',
                  transition: 'all var(--transition)',
                  caretColor: 'var(--burgundy-600)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--burgundy-600)'}
                onBlur={e => e.target.style.borderColor = digit ? 'var(--burgundy-600)' : 'var(--cream-300)'}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
            {otp.map((d, i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: d ? 'var(--burgundy-600)' : 'var(--cream-300)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>

          <button
            type="submit"
            id="verify-otp-btn"
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', padding: '12px 20px' }}
            disabled={loading || otp.join('').length !== 6}
          >
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Verifying…</>
              : <><CheckCircle size={15} /> Verify Email</>
            }
          </button>
        </form>

        {/* Resend */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          {canResend ? (
            <button
              className="btn btn-ghost"
              onClick={handleResend}
              disabled={resending}
              style={{ fontSize: '0.82rem', color: 'var(--burgundy-600)' }}
            >
              {resending
                ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Sending…</>
                : <><RefreshCw size={13} /> Resend verification code</>
              }
            </button>
          ) : (
            <p style={{ fontSize: '0.78rem', color: 'var(--charcoal-500)' }}>
              Resend available in <strong style={{ color: 'var(--charcoal-700)' }}>{countdown}s</strong>
            </p>
          )}
        </div>

        <div className="divider" />

        {/* Delivery note */}
        <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.75rem', color: '#475569', lineHeight: 1.5, textAlign: 'center' }}>
          🔒 A 6-digit security verification code has been dispatched to your email address. Please check your inbox and spam folder.
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/signup" style={{ fontSize: '0.78rem', color: 'var(--charcoal-500)' }}>
            ← Back to sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
