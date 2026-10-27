import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { authApi, healthApi } from '../services/api'
import { Clock, RefreshCw } from 'lucide-react'

const AuthContext = createContext(null)

// Role → permissions map (mirrors backend ROLE_PERMISSIONS)
const ROLE_PERMISSIONS = {
  ADMIN: [
    'VIEW_EVENTS', 'MANAGE_EVENTS', 'VIEW_RISKS', 'MANAGE_RISKS',
    'VIEW_CONTROLS', 'MANAGE_CONTROLS', 'VIEW_INCIDENTS', 'MANAGE_INCIDENTS',
    'VIEW_PRIVACY', 'MANAGE_PRIVACY', 'VIEW_EVIDENCE', 'MANAGE_EVIDENCE',
    'EXPORT_REPORTS', 'MANAGE_USERS', 'VIEW_AUDIT_LOGS', 'MANAGE_ML',
  ],
  SECURITY_ANALYST: [
    'VIEW_EVENTS', 'MANAGE_EVENTS', 'VIEW_RISKS', 'MANAGE_RISKS',
    'VIEW_INCIDENTS', 'MANAGE_INCIDENTS', 'VIEW_CONTROLS',
    'VIEW_EVIDENCE', 'EXPORT_REPORTS', 'VIEW_PRIVACY',
  ],
  GRC_ANALYST: [
    'VIEW_EVENTS', 'VIEW_RISKS', 'MANAGE_RISKS',
    'VIEW_CONTROLS', 'MANAGE_CONTROLS', 'VIEW_INCIDENTS', 'MANAGE_INCIDENTS',
    'VIEW_PRIVACY', 'MANAGE_PRIVACY', 'VIEW_EVIDENCE', 'MANAGE_EVIDENCE',
    'EXPORT_REPORTS',
  ],
  AUDITOR: [
    'VIEW_EVENTS', 'VIEW_RISKS', 'VIEW_CONTROLS',
    'VIEW_INCIDENTS', 'VIEW_PRIVACY', 'VIEW_EVIDENCE', 'EXPORT_REPORTS',
  ],
  VIEWER: ['VIEW_EVENTS', 'VIEW_RISKS', 'VIEW_CONTROLS', 'VIEW_INCIDENTS'],
}

// ── Render keep-alive & Inactivity Configuration ─────────────
// Render free tier spins down after 15 minutes of inactivity.
// Pinging /health every 5 minutes keeps the backend active during active use.
const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
const WARNING_BEFORE_LOGOUT_MS = 60 * 1000   // Show warning 60s before timeout

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [idleWarning, setIdleWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)

  const keepAliveRef = useRef(null)
  const idleTimerRef = useRef(null)
  const warningTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  // Ping backend /health periodically to prevent Render spin-down
  const startKeepAlive = useCallback(() => {
    if (keepAliveRef.current) clearInterval(keepAliveRef.current)
    // Send an immediate keep-alive ping on login
    healthApi.check().catch(() => {})
    keepAliveRef.current = setInterval(async () => {
      try {
        await healthApi.check()
      } catch {
        // Silently ignore if network is momentarily interrupted
      }
    }, KEEP_ALIVE_INTERVAL_MS)
  }, [])

  const stopKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current)
      keepAliveRef.current = null
    }
  }, [])

  const logout = useCallback(async (isIdleTimeout = false) => {
    try {
      await authApi.logout()
    } catch {
      // Best-effort logout
    }
    stopKeepAlive()
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    setIdleWarning(false)

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)

    if (isIdleTimeout) {
      window.location.href = '/login?reason=idle_timeout'
    }
  }, [stopKeepAlive])

  // Reset inactivity timer on user interaction
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now()

    if (idleWarning) {
      setIdleWarning(false)
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }

    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)

    // Schedule warning 60 seconds before full timeout
    warningTimerRef.current = setTimeout(() => {
      setIdleWarning(true)
      setCountdown(60)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownIntervalRef.current)
            return 0
          }
          return c - 1
        })
      }, 1000)
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_LOGOUT_MS)

    // Schedule auto-logout at full timeout
    idleTimerRef.current = setTimeout(() => {
      logout(true)
    }, INACTIVITY_TIMEOUT_MS)
  }, [idleWarning, logout])

  // Setup user interaction event listeners for idle tracking
  useEffect(() => {
    if (!user) return

    resetInactivityTimer()

    let throttleTimeout = null
    const handleUserActivity = () => {
      if (throttleTimeout) return
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null
        resetInactivityTimer()
      }, 3000) // Throttle to run at most once every 3s
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }))

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity))
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [user, resetInactivityTimer])

  // Initial user fetch
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authApi.me()
        .then(r => {
          setUser(r.data)
          startKeepAlive()
        })
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => stopKeepAlive()
  }, [startKeepAlive, stopKeepAlive])

  const login = async (username, password) => {
    const r = await authApi.login(username, password)
    localStorage.setItem('access_token', r.data.access_token)
    localStorage.setItem('refresh_token', r.data.refresh_token)
    const me = await authApi.me()
    setUser(me.data)
    startKeepAlive()
    return me.data
  }

  /** Returns true if the current user has the given permission string. */
  const can = useCallback((permission) => {
    if (!user?.role) return false
    const perms = ROLE_PERMISSIONS[user.role] || []
    return perms.includes(permission)
  }, [user])

  const isAdmin = user?.role === 'ADMIN'
  const isAnalyst = ['ADMIN', 'SECURITY_ANALYST', 'GRC_ANALYST'].includes(user?.role)

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      can,
      isAdmin,
      isAnalyst,
      resetInactivityTimer,
    }}>
      {children}

      {/* Floating Inactivity Warning Modal */}
      {idleWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 15, 29, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{
            background: 'var(--charcoal-900, #141722)',
            border: '1px solid var(--crimson-700, #b91c1c)',
            borderRadius: 12,
            padding: '24px 28px',
            maxWidth: 440,
            width: '90%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            textAlign: 'center',
            color: '#fff',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(185, 28, 28, 0.15)',
              border: '1px solid rgba(185, 28, 28, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ef4444',
            }}>
              <Clock size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8, color: '#f3f4f6' }}>
              Session Expiring Soon
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', lineHeight: 1.5, marginBottom: 20 }}>
              You have been inactive for nearly 15 minutes. To comply with security policy and prevent unneeded Render resource usage, you will be automatically logged out in:
            </p>
            <div style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: countdown <= 15 ? '#ef4444' : '#f59e0b',
              marginBottom: 20,
            }}>
              {countdown}s
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 18px', fontSize: '0.875rem' }}
                onClick={() => logout(true)}
              >
                Log Out Now
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={resetInactivityTimer}
              >
                <RefreshCw size={14} />
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
