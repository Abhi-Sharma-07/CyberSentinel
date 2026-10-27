import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Shield, BarChart2, Activity, AlertTriangle, FileText,
  CheckSquare, ClipboardList, Archive, Lock, Database,
  Cpu, Eye, LogOut, ChevronDown, Menu, X, Home, Users, Cookie
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Security',
    icon: Shield,
    items: [
      { to: '/events',      icon: Activity,      label: 'Security Events',   desc: 'Live honeypot event telemetry' },
      { to: '/threats',     icon: AlertTriangle, label: 'Threat Detections', desc: 'Deterministic rule engine' },
      { to: '/incidents',   icon: Shield,        label: 'Incidents',         desc: 'Incident response lifecycle' },
    ]
  },
  {
    label: 'GRC & Risk',
    icon: FileText,
    items: [
      { to: '/risks',       icon: FileText,      label: 'Risk Register',     desc: 'Risk matrix & treatment' },
      { to: '/controls',    icon: CheckSquare,   label: 'Control Register',  desc: 'ISO 27001, SOC 2, NIST' },
      { to: '/compliance',  icon: ClipboardList, label: 'Compliance Gaps',   desc: 'Framework gap analysis' },
      { to: '/evidence',    icon: Archive,       label: 'Audit Evidence',    desc: 'Evidence collection repository' },
    ]
  },
  {
    label: 'Privacy',
    icon: Lock,
    items: [
      { to: '/privacy',     icon: Lock,          label: 'Privacy & DPDP',    desc: 'DPDP Act 2023 & GDPR readiness' },
      { to: '/inventory',   icon: Database,      label: 'Data Inventory',    desc: 'Data asset & processing logs' },
      { to: '/users',       icon: Users,         label: 'User Directory',    desc: 'Platform accounts & roles' },
    ]
  },
  {
    label: 'AI & Reports',
    icon: Cpu,
    items: [
      { to: '/ai',          icon: Cpu,           label: 'AI Analysis',       desc: 'Gemini security assistant' },
      { to: '/reports',     icon: Eye,           label: 'Audit Reports',     desc: 'PDF & CSV executive export' },
    ]
  }
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navRef = useRef(null)
  const leaveTimeoutRef = useRef(null)
  const userLeaveTimeoutRef = useRef(null)

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)
      if (userLeaveTimeoutRef.current) clearTimeout(userLeaveTimeoutRef.current)
    }
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null)
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdowns on route change
  useEffect(() => {
    setActiveDropdown(null)
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  const handleMouseEnter = (label) => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)
    setActiveDropdown(label)
  }

  const handleMouseLeave = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current)
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 200)
  }

  const handleUserMouseEnter = () => {
    if (userLeaveTimeoutRef.current) clearTimeout(userLeaveTimeoutRef.current)
    setUserMenuOpen(true)
  }

  const handleUserMouseLeave = () => {
    if (userLeaveTimeoutRef.current) clearTimeout(userLeaveTimeoutRef.current)
    userLeaveTimeoutRef.current = setTimeout(() => {
      setUserMenuOpen(false)
    }, 200)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isGroupActive = (group) => {
    return group.items.some(item => location.pathname === item.to)
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="site-header" ref={navRef}>
      <div className="header-container">
        {/* Brand / Logo */}
        <div className="header-brand-wrap">
          <NavLink to="/" className="header-logo">
            <div className="header-logo-icon">
              <Shield size={18} color="white" />
            </div>
            <div className="header-logo-text">
              <span className="header-logo-title">Cyber Sentinel</span>
              <span className="header-logo-sub">Security Platform</span>
            </div>
          </NavLink>
        </div>

        {/* Desktop Navigation */}
        <nav className="header-nav">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link-item ${isActive || location.pathname === '/landing' ? 'active' : ''}`}
            title="View Home Page"
          >
            <Home size={15} />
            <span>Home</span>
          </NavLink>

          {NAV_GROUPS.map((group) => {
            const GroupIcon = group.icon
            const isOpen = activeDropdown === group.label
            const isSelected = isGroupActive(group)

            return (
              <div
                key={group.label}
                className={`nav-dropdown-wrapper ${isOpen ? 'open' : ''} ${isSelected ? 'group-active' : ''}`}
                onMouseEnter={() => handleMouseEnter(group.label)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className={`nav-dropdown-trigger ${isSelected ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveDropdown(isOpen ? null : group.label)
                  }}
                  aria-expanded={isOpen}
                >
                  <GroupIcon size={15} />
                  <span>{group.label}</span>
                  <ChevronDown size={13} className={`dropdown-chevron ${isOpen ? 'rotate' : ''}`} />
                </button>

                {isOpen && (
                  <div
                    className="nav-dropdown-menu"
                    onMouseEnter={() => handleMouseEnter(group.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="dropdown-menu-header">
                      <span>{group.label} Modules</span>
                    </div>
                    <div className="dropdown-grid">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon
                        const isActive = location.pathname === item.to
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={`dropdown-item ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              setActiveDropdown(null)
                            }}
                          >
                            <div className="dropdown-item-icon">
                              <ItemIcon size={16} />
                            </div>
                            <div className="dropdown-item-content">
                              <div className="dropdown-item-title">{item.label}</div>
                              <div className="dropdown-item-desc">{item.desc}</div>
                            </div>
                          </NavLink>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-link-item ${isActive ? 'active' : ''}`
            }
          >
            <BarChart2 size={15} />
            <span>Dashboard</span>
          </NavLink>
        </nav>

        {/* Right Section: Status Badge + User Profile */}
        <div className="header-actions">
          <div className="header-status-badge" title="Honeypot Telemetry Engine is Active">
            <span className="live-dot" />
            <span className="status-text">Honeypot Active</span>
          </div>

          {user ? (
            <div
              className="user-dropdown-wrap"
              onMouseEnter={handleUserMouseEnter}
              onMouseLeave={handleUserMouseLeave}
            >
              <button
                type="button"
                className="user-profile-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setUserMenuOpen(!userMenuOpen)
                }}
                aria-expanded={userMenuOpen}
              >
                <div className="user-avatar">{initials}</div>
                <div className="user-details-box">
                  <span className="user-name">{user.username}</span>
                  <span className="user-role-badge">{user.role?.replace('_', ' ')}</span>
                </div>
                <ChevronDown size={13} className="user-chevron" />
              </button>

              {userMenuOpen && (
                <div
                  className="user-menu-dropdown"
                  onMouseEnter={handleUserMouseEnter}
                  onMouseLeave={handleUserMouseLeave}
                >
                  <div className="user-menu-header">
                    <div className="user-menu-avatar">{initials}</div>
                    <div>
                      <div className="user-menu-name">{user.username}</div>
                      <div className="user-menu-role">{user.role} ACCESS</div>
                    </div>
                  </div>
                  <div className="user-menu-divider" />
                  <NavLink
                    to="/landing"
                    className="user-menu-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Home size={15} />
                    Product Overview
                  </NavLink>
                  <NavLink
                    to="/dashboard"
                    className="user-menu-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <BarChart2 size={15} />
                    Platform Dashboard
                  </NavLink>
                  <NavLink
                    to="/users"
                    className="user-menu-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Users size={15} />
                    User Directory
                  </NavLink>
                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      window.dispatchEvent(new CustomEvent('open-cookie-settings'))
                    }}
                  >
                    <Cookie size={15} />
                    Cookie Settings
                  </button>
                  <div className="user-menu-divider" />
                  <button
                    type="button"
                    className="user-menu-item logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="header-auth-buttons">
              <NavLink to="/login" className="btn btn-ghost btn-sm">Sign In</NavLink>
              <NavLink to="/signup" className="btn btn-primary btn-sm">Get Started</NavLink>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer animate-fade-in-up">
          <div className="mobile-nav-links">
            <NavLink to="/" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
              <Home size={16} />
              Home
            </NavLink>
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mobile-nav-group">
                <div className="mobile-group-header">{group.label}</div>
                {group.items.map((item) => {
                  const ItemIcon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className="mobile-nav-item"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ItemIcon size={16} />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            ))}
            <NavLink to="/dashboard" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
              <BarChart2 size={16} />
              Dashboard
            </NavLink>
          </div>
          {user && (
            <div className="mobile-nav-footer">
              <div className="mobile-user-row">
                <div className="user-avatar">{initials}</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--cream-100)' }}>{user.username}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--charcoal-300)' }}>{user.role}</div>
                </div>
              </div>
              <button type="button" className="btn btn-secondary w-full" onClick={handleLogout} style={{ marginTop: 12 }}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
