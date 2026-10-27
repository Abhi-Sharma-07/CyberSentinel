import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X } from 'lucide-react'

const PAGE_TITLES = {
  '/':           ['Dashboard',         'Security & GRC Overview'],
  '/events':     ['Security Events',   'Honeypot event stream · Privacy-processed'],
  '/threats':    ['Threat Detections', 'Deterministic rule-based detection engine'],
  '/incidents':  ['Incidents',         'Incident management & lifecycle tracking'],
  '/risks':      ['Risk Register',     'GRC risk identification & treatment'],
  '/controls':   ['Control Register',  'ISO 27001 · SOC 2 · GDPR · DPDP 2023'],
  '/compliance': ['Compliance Gaps',   'Framework gap assessment · Reference only'],
  '/evidence':   ['Audit Evidence',    'Evidence register & review tracking'],
  '/privacy':    ['Privacy Assessment','DPDP Act 2023 · GDPR principles · Educational'],
  '/inventory':  ['Data Inventory',    'Data minimization & processing register'],
  '/ai':         ['AI Analysis',       'Advisory AI layer — analyst review required'],
  '/reports':    ['Reports',           'CSV & PDF export'],
}

export default function Topbar({ onMenuToggle }) {
  const { user } = useAuth()
  const { pathname } = useLocation()

  const [title, subtitle] = PAGE_TITLES[pathname] || ['Platform', '']

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="topbar">
      <div className="d-flex align-center gap-12">
        {/* Mobile menu toggle */}
        <button className="btn btn-ghost btn-icon" onClick={onMenuToggle}
          style={{ display: 'none' }} aria-label="Toggle menu">
          <Menu size={18} />
        </button>
        <div className="topbar-left">
          <div className="topbar-page-title">{title}</div>
          {subtitle && <div className="topbar-breadcrumb">{subtitle}</div>}
        </div>
      </div>

      <div className="topbar-right">
        {/* Live indicator */}
        <div className="topbar-badge">
          <span className="dot" />
          Honeypot Active
        </div>

        {/* User chip */}
        <div className="topbar-user">
          <div className="topbar-avatar">{initials}</div>
          <div className="topbar-user-info">
            <span className="topbar-username">{user?.username}</span>
            <span className="topbar-role">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
