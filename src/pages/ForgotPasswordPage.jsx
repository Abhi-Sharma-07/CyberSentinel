import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Shield, KeyRound, CheckCircle, ArrowLeft, Eye, EyeOff, RefreshCw, Mail } from 'lucide-react'
import { authApi } from '../services/api'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const [step, setStep] = useState(1) // 1 = Enter Email, 2 = Enter OTP & New Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  const otpInputs = useRef([])

  // Pre-fill from URL if coming directly from email link
  useEffect(() => {
    const params = new URLSearchParams(search)
    const emailParam = params.get('email')
    const otpParam = (params.get('otp') || params.get('code') || '').replace(/\D/g, '').slice(0, 6)
    if (emailParam) setEmail(emailParam)
    if (otpParam.length === 6) {
      setOtp(otpParam.split(''))
      setStep(2)
      setTimeout(() => otpInputs.current[5]?.focus(), 150)
    }
  }, [search])

  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    } else if (countdown <= 0) {
      setCanResend(true)
    }
  }, [step, countdown])

  const handleSendCode = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!email) {
      setError('Please enter your registered email address.')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.forgotPassword(email)
      setInfo(res.data.message || 'If an account exists, a 6-digit reset code has been sent.')
      setStep(2)
      setCountdown(60)
      setCanResend(false)
      setTimeout(() => otpInputs.current[0]?.focus(), 150)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')
    if (value && index < 5) otpInputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) otpInputs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) otpInputs.current[index + 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    const newOtp = ['', '', '', '', '', '']
    text.split('').forEach((ch, i) => { if (i < 6) newOtp[i] = ch })
    setOtp(newOtp)
    const nextEmpty = newOtp.findIndex(d => !d)
    const focusIdx = nextEmpty === -1 ? 5 : nextEmpty
    otpInputs.current[focusIdx]?.focus()
  }

  const handleResendCode = async () => {
    if (!canResend) return
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setInfo('A new 6-digit reset code has been sent.')
      setCountdown(60)
      setCanResend(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend code.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    const code = otp.join('')
    if (code.length < 6) {
      setError('Please enter all 6 digits of the reset code.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(email, code, newPassword)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login', { state: { verified: true, username: email } })
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-arc-1" />
      <div className="login-arc-2" />

      <div className="login-card animate-fade-in-up">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-mark" style={{ background: 'var(--burgundy-600, #8B1A2F)' }}>
            <KeyRound size={22} color="white" />
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

        <div className="page-hero-eyebrow" style={{ color: 'var(--burgundy-600, #8B1A2F)', marginTop: 8 }}>
          Account Recovery
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 600, color: 'var(--charcoal-900)', margin: '4px 0 6px' }}>
          {step === 1 ? 'Forgot your password?' : 'Reset your password'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--charcoal-500)', margin: '0 0 20px', lineHeight: 1.5 }}>
          {step === 1
            ? 'Enter your registered email address and we will send you a 6-digit verification code to reset your password.'
            : `Enter the 6-digit code sent to ${email} and choose a new password.`}
        </p>

        {/* Alerts */}
        {error && (
          <div className="alert alert-critical" style={{ marginBottom: 18 }}>
            <Shield size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {info && !error && (
          <div className="alert alert-info" style={{ marginBottom: 18 }}>
            <Mail size={16} style={{ flexShrink: 0 }} />
            <span>{info}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: 18 }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>Password successfully reset! Redirecting to sign in…</span>
          </div>
        )}

        {/* STEP 1: Request OTP */}
        {step === 1 && !success && (
          <form onSubmit={handleSendCode}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Email Address</label>
              <input
                id="reset-email"
                className="form-control"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              id="send-reset-code-btn"
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', marginTop: 12, padding: '12px 20px' }}
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Sending Code…</>
              ) : (
                <><Mail size={15} /> Send Reset Code</>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP & New Password */}
        {step === 2 && !success && (
          <form onSubmit={handleResetPassword}>
            {/* 6-Digit OTP */}
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: 8 }}>6-Digit Verification Code</label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => (otpInputs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    style={{
                      width: 44,
                      height: 52,
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      borderRadius: 8,
                      border: '1px solid var(--border-color, #cbd5e1)',
                      background: 'var(--cream-100, #f8fafc)',
                      color: 'var(--charcoal-900, #0f172a)',
                      outline: 'none',
                    }}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label" htmlFor="new-password">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new-password"
                  className="form-control"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  style={{ paddingRight: 40 }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--charcoal-500)' }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                className="form-control"
                type={showPwd ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              id="reset-password-btn"
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', marginTop: 12, padding: '12px 20px' }}
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Resetting Password…</>
              ) : (
                <><KeyRound size={15} /> Set New Password</>
              )}
            </button>

            {/* Resend Code Link */}
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: 'var(--charcoal-500)' }}>
              Didn't receive the code?{' '}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendCode}
                  style={{ background: 'none', border: 'none', color: 'var(--burgundy-600)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  Resend Code
                </button>
              ) : (
                <span>Resend in {countdown}s</span>
              )}
            </div>
          </form>
        )}

        {/* Back to sign in */}
        <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--cream-300, #e2e8f0)', textAlign: 'center' }}>
          <Link
            to="/login"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--charcoal-700)', textDecoration: 'none', fontWeight: 500 }}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
