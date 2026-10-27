import { useState, useEffect } from 'react'
import { Cookie, ChevronDown, ChevronUp, Lock, Shield } from 'lucide-react'

const CONSENT_VERSION = '2.0'

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [showPolicy, setShowPolicy] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('grc_privacy_consent')
    if (!raw) {
      const timer = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(timer)
    }
    try {
      const saved = JSON.parse(raw)
      if (saved.version !== CONSENT_VERSION) {
        const timer = setTimeout(() => setVisible(true), 600)
        return () => clearTimeout(timer)
      }
    } catch {
      localStorage.removeItem('grc_privacy_consent')
      const timer = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const handler = () => setVisible(true)
    window.addEventListener('open-cookie-settings', handler)
    return () => window.removeEventListener('open-cookie-settings', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [visible])

  const handleAccept = () => {
    localStorage.setItem('grc_privacy_consent', JSON.stringify({
      acceptedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
      essentialOnly: false,
      telemetryAllowed: true,
      status: 'ACCEPTED'
    }))
    setVisible(false)
    setShowPolicy(false)
  }

  const handleDecline = () => {
    localStorage.setItem('grc_privacy_consent', JSON.stringify({
      acceptedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
      essentialOnly: true,
      telemetryAllowed: false,
      status: 'DECLINED'
    }))
    setVisible(false)
    setShowPolicy(false)
  }

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes cookieFadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes policySlide {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 400px; }
        }
        .cookie-decline-btn:hover {
          background: var(--cream-100, #f5f0e8) !important;
          border-color: var(--charcoal-500, #6b7280) !important;
        }
        .cookie-accept-btn:hover {
          opacity: 0.88 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 8px 24px rgba(139, 26, 47, 0.45) !important;
        }
        .cookie-policy-toggle:hover {
          text-decoration: underline;
        }
      `}</style>

      {/* Overlay */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(8, 10, 24, 0.82)',
        backdropFilter: 'blur(7px)',
        WebkitBackdropFilter: 'blur(7px)',
        zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'overlayIn 0.28s ease-out',
      }}>

        {/* Card */}
        <div style={{
          background: 'var(--color-surface, #fff)',
          borderRadius: 18,
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          maxWidth: 500,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'cookieFadeIn 0.38s cubic-bezier(0.34, 1.4, 0.64, 1)',
        }}>

          {/* Dark header */}
          <div style={{
            background: 'linear-gradient(140deg, #3d0d18 0%, #6b1424 50%, #8B1A2F 100%)',
            padding: '30px 32px 26px',
            color: '#fff',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.14)', borderRadius: 100,
              padding: '5px 14px 5px 10px', marginBottom: 18,
            }}>
              <Cookie size={15} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Privacy Notice
              </span>
            </div>

            <h2 style={{
              fontFamily: 'var(--font-serif, Georgia, serif)',
              fontSize: '1.6rem', fontWeight: 700,
              margin: '0 0 14px 0', lineHeight: 1.2, color: '#fff',
            }}>
              We value your privacy
            </h2>

            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.72, color: 'rgba(255,255,255,0.78)' }}>
              By clicking <strong style={{ color: '#fff' }}>"Accept"</strong>, you agree to the storing
              of essential authentication tokens on your device to keep you securely signed in.
              We use <strong style={{ color: '#fff' }}>zero</strong> third-party tracking or advertising
              cookies. You may withdraw your consent at any time.
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '22px 32px 28px', background: 'var(--cream-50, #faf8f5)' }}>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
              {['DPDP Act 2023', 'GDPR Aligned', 'No 3rd-party tracking'].map(label => (
                <span key={label} style={{
                  fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.04em',
                  padding: '3px 11px', borderRadius: 100,
                  background: 'rgba(139, 26, 47, 0.07)',
                  color: 'var(--burgundy-700, #5a1120)',
                  border: '1px solid rgba(139, 26, 47, 0.16)',
                }}>
                  {label}
                </span>
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                id="cookie-decline-btn"
                className="cookie-decline-btn"
                type="button"
                onClick={handleDecline}
                style={{
                  flex: 1, padding: '14px 20px', borderRadius: 10,
                  border: '2px solid var(--color-border, #e2d4c0)',
                  background: 'transparent', color: 'var(--charcoal-800, #1f2937)',
                  fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', letterSpacing: '0.01em',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                Decline
              </button>

              <button
                id="cookie-accept-btn"
                className="cookie-accept-btn"
                type="button"
                onClick={handleAccept}
                style={{
                  flex: 1, padding: '14px 20px', borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #5a1120 0%, #8B1A2F 100%)',
                  color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  letterSpacing: '0.01em',
                  transition: 'opacity 0.15s, transform 0.15s, box-shadow 0.15s',
                  boxShadow: '0 4px 18px rgba(139, 26, 47, 0.38)',
                }}
              >
                Accept
              </button>
            </div>

            {/* Cookie Policy toggle */}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                type="button"
                className="cookie-policy-toggle"
                onClick={() => setShowPolicy(v => !v)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--burgundy-600, #8B1A2F)', fontWeight: 600,
                  fontSize: '0.72rem', fontFamily: 'var(--font-sans)',
                  padding: 0,
                }}
              >
                Cookie Policy
                {showPolicy ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {/* Expandable policy details */}
            {showPolicy && (
              <div style={{
                marginTop: 14,
                borderRadius: 10,
                border: '1px solid var(--color-border, #e2d4c0)',
                overflow: 'hidden',
                animation: 'policySlide 0.25s ease-out',
              }}>
                {/* Cookie 1 */}
                <div style={{ padding: '14px 16px', background: 'var(--color-surface, #fff)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Lock size={13} color="var(--color-low, #16a34a)" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--charcoal-900)' }}>
                        Authentication Tokens (JWT)
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: 100, background: 'rgba(22,163,74,0.1)',
                      color: 'var(--color-low, #16a34a)', letterSpacing: '0.04em',
                    }}>
                      ALWAYS ON
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--charcoal-500)', lineHeight: 1.55, paddingLeft: 21 }}>
                    Stored in <code style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.05)', padding: '1px 4px', borderRadius: 3 }}>localStorage</code>.
                    Required to keep you authenticated across page refreshes. Cannot be disabled.
                  </p>
                </div>

                <div style={{ height: 1, background: 'var(--color-border, #e2d4c0)' }} />

                {/* Cookie 2 */}
                <div style={{ padding: '14px 16px', background: 'var(--color-surface, #fff)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Shield size={13} color="var(--color-low, #16a34a)" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--charcoal-900)' }}>
                        Consent Preference
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: 100, background: 'rgba(22,163,74,0.1)',
                      color: 'var(--color-low, #16a34a)', letterSpacing: '0.04em',
                    }}>
                      ALWAYS ON
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--charcoal-500)', lineHeight: 1.55, paddingLeft: 21 }}>
                    Remembers your Decline/Accept choice so this notice does not appear on every visit.
                    Stored as <code style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.05)', padding: '1px 4px', borderRadius: 3 }}>grc_privacy_consent</code>.
                  </p>
                </div>

                <div style={{
                  padding: '10px 16px',
                  background: 'rgba(139, 26, 47, 0.04)',
                  borderTop: '1px solid var(--color-border, #e2d4c0)',
                  fontSize: '0.7rem', color: 'var(--charcoal-400)', lineHeight: 1.5,
                }}>
                  ✦ No advertising, analytics, or third-party cookies are used on this platform.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
