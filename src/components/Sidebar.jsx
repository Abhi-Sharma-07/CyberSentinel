import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Shield, Activity, AlertTriangle, CheckSquare, FileText,
  Database, Lock, ClipboardList, Archive, LogOut, BarChart2,
  Cpu, Eye
} from 'lucide-react'

const NAV = [
  {
    section: 'Security',
    items: [
      { to: '/',         icon: BarChart2,     label: 'Dashboard' },
      { to: '/events',   icon: Activity,      label: 'Security Events' },
      { to: '/threats',  icon: AlertTriangle, label: 'Threat Detections' },
      { to: '/incidents',icon: Shield,        label: 'Incidents' },
    ]
  },
  {
    section: 'GRC & Risk',
    items: [
      { to: '/risks',      icon: FileText,     label: 'Risk Register' },
      { to: '/controls',   icon: CheckSquare,  label: 'Control Register' },
      { to: '/compliance', icon: ClipboardList, label: 'Compliance Gaps' },
      { to: '/evidence',   icon: Archive,      label: 'Audit Evidence' },
    ]
  },
  {
    section: 'Privacy',
    items: [
      { to: '/privacy',    icon: Lock,    label: 'Privacy & DPDP' },
      { to: '/inventory',  icon: Database, label: 'Data Inventory' },
    ]
  },
  {
    section: 'AI & Reports',
    items: [
      { to: '/ai',      icon: Cpu,      label: 'AI Analysis' },
      { to: '/reports', icon: Eye,      label: 'Reports' },
    ]
  },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav className={`sidebar ${open ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <Shield size={18} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">Cyber Sentinel</span>
          <span className="sidebar-logo-sub">Security Platform</span>
        </div>
      </div>

      {/* Nav sections */}
      {NAV.map(({ section, items }) => (
        <div className="sidebar-section" key={section}>
          <div className="sidebar-section-label">{section}</div>
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
              onClick={onClose}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>
      ))}

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ marginBottom: 12, lineHeight: 1.4 }}>
          <div style={{ color: 'var(--cream-200)', fontWeight: 500 }}>
            {user?.username || '—'}
          </div>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {user?.role}
          </div>
        </div>
        <button
          className="sidebar-nav-item"
          style={{ width: '100%', padding: '8px 0', color: 'var(--charcoal-300)' }}
          onClick={handleLogout}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </nav>
  )
}
