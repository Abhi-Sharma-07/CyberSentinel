import { useEffect, useState } from 'react'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  Users, UserCheck, Shield, Mail, Calendar, Clock,
  Search, Filter, CheckCircle2, XCircle, AlertTriangle, RefreshCw
} from 'lucide-react'

const ROLES = [
  { value: 'ADMIN', label: 'Admin', desc: 'Full platform administrative control' },
  { value: 'SECURITY_ANALYST', label: 'Security Analyst', desc: 'Threat detection & honeypot events' },
  { value: 'GRC_ANALYST', label: 'GRC Analyst', desc: 'Risk register & compliance gap assessment' },
  { value: 'AUDITOR', label: 'Auditor', desc: 'Read-only audit evidence & verification' },
  { value: 'VIEWER', label: 'Viewer', desc: 'Executive dashboard view-only access' }
]

function RoleBadge({ role }) {
  const map = {
    ADMIN: 'badge-critical',
    SECURITY_ANALYST: 'badge-high',
    GRC_ANALYST: 'badge-medium',
    AUDITOR: 'badge-info',
    VIEWER: 'badge-neutral',
  }
  return (
    <span className={`badge ${map[role] || 'badge-neutral'}`} style={{ fontWeight: 600 }}>
      {role?.replace('_', ' ')}
    </span>
  )
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [updatingId, setUpdatingId] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)

  const loadUsers = () => {
    setLoading(true)
    setError(null)
    authApi.listUsers()
      .then(res => setUsers(res.data))
      .catch(err => {
        const msg = err.response?.data?.detail || 'Failed to load user directory'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId)
    try {
      const res = await authApi.updateUserRole(userId, newRole)
      setUsers(prev => prev.map(u => u.id === userId ? res.data : u))
      setActionMessage({ type: 'success', text: `Role updated for ${res.data.username}` })
      setTimeout(() => setActionMessage(null), 3500)
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update role' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleStatusToggle = async (userId, currentStatus, username) => {
    if (currentUser?.id === userId && currentStatus) {
      alert('You cannot deactivate your own administrative account.')
      return
    }
    const nextStatus = !currentStatus
    const confirmMsg = nextStatus
      ? `Re-activate access for user "${username}"?`
      : `Deactivate account for user "${username}"? They will not be able to log in.`
    
    if (!window.confirm(confirmMsg)) return

    setUpdatingId(userId)
    try {
      const res = await authApi.updateUserStatus(userId, nextStatus)
      setUsers(prev => prev.map(u => u.id === userId ? res.data : u))
      setActionMessage({
        type: 'success',
        text: `Account for ${username} is now ${nextStatus ? 'ACTIVE' : 'DEACTIVATED'}`
      })
      setTimeout(() => setActionMessage(null), 3500)
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update account status' })
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()))
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.is_active) ||
      (statusFilter === 'INACTIVE' && !u.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  // Summary Metrics
  const totalCount = users.length
  const activeCount = users.filter(u => u.is_active).length
  const verifiedCount = users.filter(u => u.email_verified).length
  const adminCount = users.filter(u => u.role === 'ADMIN').length

  const formatDate = (isoString) => {
    if (!isoString) return 'Never'
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="animate-fade-in-up">
      {/* Hero Header */}
      <div className="page-hero">
        <div className="page-hero-watermark">USR</div>
        <div className="page-hero-eyebrow">Access Governance & Identity Management</div>
        <h1 className="page-hero-title">User Directory</h1>
        <p className="page-hero-sub">
          Monitor all platform accounts, track registration dates, inspect OTP email verification status,
          and enforce Role-Based Access Control (RBAC) in compliance with <strong>ISO 27001 A.9</strong> and <strong>DPDP Act 2023</strong> principles.
        </p>
        <div className="page-hero-actions">
          <button className="btn btn-secondary" onClick={loadUsers} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`alert ${actionMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}
          style={{ marginBottom: 20 }}
        >
          {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="metric-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card">
          <div className="metric-card-eyebrow">Total Accounts</div>
          <div className="metric-card-value">{totalCount}</div>
          <div className="metric-card-label">Platform-wide registered users</div>
          <div className="metric-card-icon">
            <Users size={16} />
          </div>
        </div>

        <div className="metric-card low">
          <div className="metric-card-eyebrow">Active Accounts</div>
          <div className="metric-card-value" style={{ color: 'var(--color-low)' }}>{activeCount}</div>
          <div className="metric-card-label">Authorized to authenticate</div>
          <div className="metric-card-icon">
            <UserCheck size={16} color="var(--color-low)" />
          </div>
        </div>

        <div className="metric-card gold">
          <div className="metric-card-eyebrow">Email Verified</div>
          <div className="metric-card-value" style={{ color: 'var(--gold-500, #b45309)' }}>{verifiedCount}</div>
          <div className="metric-card-label">Completed Gmail OTP challenge</div>
          <div className="metric-card-icon">
            <Mail size={16} color="var(--gold-500, #b45309)" />
          </div>
        </div>

        <div className="metric-card critical">
          <div className="metric-card-eyebrow">Administrators</div>
          <div className="metric-card-value" style={{ color: 'var(--burgundy-600)' }}>{adminCount}</div>
          <div className="metric-card-label">Privileged Access Management (PAM)</div>
          <div className="metric-card-icon">
            <Shield size={16} color="var(--burgundy-600)" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--charcoal-400)' }} />
              <input
                type="text"
                placeholder="Search by username, full name, or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 36,
                  paddingRight: 12,
                  height: 38,
                  borderRadius: 8,
                  border: '1px solid var(--color-border, #e6d5b8)',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--charcoal-900)',
                  fontSize: '0.84rem'
                }}
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{
                height: 38,
                borderRadius: 8,
                border: '1px solid var(--color-border, #e6d5b8)',
                background: 'var(--color-surface, #ffffff)',
                color: 'var(--charcoal-900)',
                padding: '0 12px',
                fontSize: '0.84rem'
              }}
            >
              <option value="ALL">All Roles</option>
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                height: 38,
                borderRadius: 8,
                border: '1px solid var(--color-border, #e6d5b8)',
                background: 'var(--color-surface, #ffffff)',
                color: 'var(--charcoal-900)',
                padding: '0 12px',
                fontSize: '0.84rem'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Deactivated Only</option>
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--charcoal-500)' }}>
            Showing <strong>{filteredUsers.length}</strong> of <strong>{totalCount}</strong> users
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="panel">
        {loading ? (
          <div className="loading-state"><div className="spinner" /> Loading user directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={24} /></div>
            <div className="empty-state-title">No matching users found</div>
            <div className="empty-state-text">Try adjusting your search criteria or role filters.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th>OTP Verification</th>
                  <th>Joined Date</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const initials = u.username.slice(0, 2).toUpperCase()
                  const isCurrent = currentUser?.id === u.id
                  const isBusy = updatingId === u.id

                  return (
                    <tr key={u.id} style={{ opacity: isBusy ? 0.6 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: isCurrent ? 'var(--burgundy-600, #8b1a2f)' : 'var(--charcoal-800, #2a2825)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: 'var(--charcoal-900, #1c1a17)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}>
                              <span>{u.username}</span>
                              {isCurrent && (
                                <span className="badge badge-low" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--charcoal-500)', marginTop: 2 }}>
                              {u.full_name || (u.role === 'ADMIN' ? 'Platform Administrator' : 'Platform User')}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', color: 'var(--charcoal-700)' }}>
                          <Mail size={13} style={{ color: 'var(--charcoal-400)' }} />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td>
                        <select
                          value={u.role}
                          disabled={isBusy}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{
                            fontSize: '0.8rem',
                            padding: '5px 10px',
                            borderRadius: 6,
                            background: 'var(--cream-50, #fdfbf7)',
                            color: 'var(--charcoal-900)',
                            border: '1px solid var(--color-border, #e6d5b8)',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                          title="Change assigned RBAC permission role"
                        >
                          {ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`badge ${u.is_active ? 'badge-low' : 'badge-critical'}`}
                          style={{ cursor: isCurrent ? 'not-allowed' : 'pointer', border: 'none' }}
                          onClick={() => handleStatusToggle(u.id, u.is_active, u.username)}
                          disabled={isCurrent || isBusy}
                          title={isCurrent ? 'Cannot deactivate self' : 'Click to toggle active status'}
                        >
                          {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                        </button>
                      </td>

                      <td>
                        {u.email_verified ? (
                          <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <XCircle size={12} /> Pending OTP
                          </span>
                        )}
                      </td>

                      <td style={{ fontSize: '0.8rem', color: 'var(--charcoal-500)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={13} />
                          <span>{formatDate(u.created_at)}</span>
                        </div>
                      </td>

                      <td style={{ fontSize: '0.8rem', color: 'var(--charcoal-500)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={13} />
                          <span>{formatDate(u.last_login)}</span>
                        </div>
                      </td>

                      <td>
                        <button
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          onClick={() => handleStatusToggle(u.id, u.is_active, u.username)}
                          disabled={isCurrent || isBusy}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DPDP / Privacy Notice Card */}
      <div className="panel" style={{ marginTop: 24, padding: 22, background: 'var(--color-surface, #ffffff)', border: '1px solid var(--color-border, #e6d5b8)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <Shield size={22} style={{ color: 'var(--burgundy-600)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.94rem', fontWeight: 600, color: 'var(--charcoal-900)' }}>
              Data Protection & Privacy Notice (DPDP Act 2023 & GDPR Art. 5)
            </h4>
            <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--charcoal-600)', lineHeight: 1.6 }}>
              User emails and names are collected exclusively for authentication, OTP verification, and access audit trails under the lawful basis of contract execution and security compliance. Credentials are protected using one-way <strong>bcrypt password hashing</strong> with per-user cryptographic salts. No user data is transferred to third-party marketing services.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
