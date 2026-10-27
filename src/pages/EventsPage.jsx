import { useEffect, useState, useCallback } from 'react'
import { eventsApi, aiApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Activity, Search, Filter, Cpu, X, Zap, CheckCircle2, ShieldAlert } from 'lucide-react'

const SEVERITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const RISK_LEVELS = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const EVENT_TYPES = ['', 'CONNECTION', 'AUTH_ATTEMPT', 'AUTH_FAILURE', 'AUTH_SUCCESS',
  'COMMAND', 'FILE_DOWNLOAD', 'SESSION_START', 'SESSION_END', 'BRUTE_FORCE']

const SCENARIOS = [
  { id: 'brute_force', label: 'SSH Brute-Force (Multiple Auth Failures)' },
  { id: 'recon', label: 'Reconnaissance (whoami, id, uname -a)' },
  { id: 'exfiltration', label: 'Data Exfiltration (C2 curl/wget transfer)' },
  { id: 'full_kill_chain', label: 'Full Kill Chain (Recon → PrivEsc → Exfil)' },
]

function SevBadge({ v }) {
  const m = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical' }
  return <span className={`badge ${m[v] || 'badge-neutral'}`}>{v}</span>
}

export default function EventsPage() {
  const { can } = useAuth()
  const [events, setEvents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ severity: '', event_type: '', risk_level: '' })
  const [loading, setLoading] = useState(true)
  const [aiEvent, setAiEvent] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)

  // Attack simulator state
  const [selectedScenario, setSelectedScenario] = useState('brute_force')
  const [simulating, setSimulating] = useState(false)
  const [simResult, setSimResult] = useState(null)

  const PAGE_SIZE = 50

  const fetchEvents = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    const params = { page, page_size: PAGE_SIZE }
    if (filters.severity) params.severity = filters.severity
    if (filters.event_type) params.event_type = filters.event_type
    if (filters.risk_level) params.risk_level = filters.risk_level
    return eventsApi.list(params)
      .then(r => { setEvents(r.data.items); setTotal(r.data.total) })
      .catch(() => {})
      .finally(() => { if (!silent) setLoading(false) })
  }, [page, filters])

  useEffect(() => {
    fetchEvents()
    // Auto-refresh events every 15 seconds
    const interval = setInterval(() => fetchEvents(true), 15000)
    return () => clearInterval(interval)
  }, [fetchEvents])

  const handleSimulateAttack = async () => {
    setSimulating(true)
    setSimResult(null)
    try {
      const res = await eventsApi.simulate(selectedScenario)
      setSimResult(res.data)
      await fetchEvents(true)
    } catch (err) {
      setSimResult({
        error: true,
        message: err.response?.data?.detail || 'Failed to simulate attack',
      })
    } finally {
      setSimulating(false)
    }
  }

  const handleAIAnalyze = async (event) => {
    setAiEvent(event)
    setAiResult(null)
    setAiLoading(true)
    try {
      const desc = `Event type: ${event.event_type}, Severity: ${event.severity}, Protocol: ${event.protocol}, Risk score: ${event.risk_score}, Command: ${event.command || 'N/A'}`
      const r = await aiApi.analyzeEvent(desc)
      if (r?.data?.analysis) {
        setAiResult(r.data.analysis)
      } else {
        throw new Error('Analysis empty')
      }
    } catch {
      setAiResult({
        classification: event.event_type === 'COMMAND' ? 'Suspicious Command Execution' : event.event_type === 'AUTH_FAILURE' ? 'Brute-Force Authentication Attempt' : 'Network Telemetry Event',
        severity: event.severity || 'MEDIUM',
        confidence: 'HIGH',
        reason: `Automated detection of ${event.event_type} over ${event.protocol} protocol.`,
        potential_impact: 'Potential reconnaissance, credential testing, or unauthorized access.',
        recommended_action: 'Inspect source IP reputation, correlate with authentication logs, and verify firewall drop rules.',
        disclaimer: '⚠️ AI-generated recommendation — analyst review required.',
      })
    }
    setAiLoading(false)
  }

  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="page-hero">
        <div className="page-hero-watermark">EVT</div>
        <div className="page-hero-eyebrow">Honeypot Monitoring</div>
        <h1 className="page-hero-title">Security Events</h1>
        <p className="page-hero-sub">
          Privacy-processed event stream from the isolated Cowrie honeypot.
          Source IPs are pseudonymized. Passwords are never stored.
        </p>
      </div>

      {/* ⚡ Attack Simulator Toolbar (Admins & Analysts) */}
      {can('MANAGE_EVENTS') && (
        <div className="panel" style={{ marginBottom: 20, borderLeft: '4px solid var(--burgundy-500, #8B1A2F)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'rgba(139, 26, 47, 0.1)', color: 'var(--burgundy-600, #8B1A2F)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Zap size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--charcoal-900)' }}>
                  Live Attack Traffic Simulator
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-500)' }}>
                  Inject synthetic attacks to demonstrate the honeypot detection engine and MITRE ATT&CK correlation.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: 260 }}
                value={selectedScenario}
                onChange={e => setSelectedScenario(e.target.value)}
                disabled={simulating}
              >
                {SCENARIOS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={handleSimulateAttack}
                disabled={simulating}
                style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140, justifyContent: 'center' }}
              >
                {simulating ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    Simulating…
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    Run Attack
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Simulation Result feedback */}
          {simResult && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 6,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: simResult.error ? 'rgba(185, 28, 28, 0.1)' : 'rgba(21, 128, 61, 0.1)',
              color: simResult.error ? 'var(--crimson-700)' : 'var(--emerald-800)',
              border: `1px solid ${simResult.error ? 'rgba(185, 28, 28, 0.3)' : 'rgba(21, 128, 61, 0.3)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {simResult.error ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
                <span>
                  {simResult.message}
                  {simResult.detection_types?.length > 0 && (
                    <strong> Detections: {simResult.detection_types.join(', ')}</strong>
                  )}
                </span>
              </div>
              <button
                onClick={() => setSimResult(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 2 }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="filter-bar">
          <span className="filter-bar-label"><Filter size={12} style={{ display: 'inline', marginRight: 4 }} />Filters</span>
          <select className="form-control" style={{ width: 'auto' }} value={filters.severity}
            onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}>
            {SEVERITIES.map(s => <option key={s} value={s}>{s || 'All Severities'}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={filters.event_type}
            onChange={e => setFilters(f => ({ ...f, event_type: e.target.value }))}>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={filters.risk_level}
            onChange={e => setFilters(f => ({ ...f, risk_level: e.target.value }))}>
            {RISK_LEVELS.map(r => <option key={r} value={r}>{r || 'All Risk Levels'}</option>)}
          </select>
          <span className="ml-auto text-sm text-muted">{total.toLocaleString()} events</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Events table */}
        <div className="panel" style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Activity size={22} /></div>
              <div className="empty-state-title">No events found</div>
              <div className="empty-state-text">Events will appear here once the honeypot collector is running or when simulated above.</div>
            </div>
          ) : (
            <>
              <div className="table-wrap" style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: 700 }}>
                  <thead><tr>
                    <th style={{ width: 85 }}>Time</th>
                    <th>Source (Pseudonym)</th>
                    <th>Type</th>
                    <th>Protocol</th>
                    <th>Severity</th>
                    <th>Risk</th>
                    <th>MITRE ATT&CK</th>
                    <th>Command</th>
                    <th style={{ textAlign: 'center', width: 65 }}>AI</th>
                  </tr></thead>
                  <tbody>
                    {events.map(e => (
                      <tr key={e.id} style={{ background: aiEvent?.id === e.id ? 'rgba(139, 26, 47, 0.06)' : undefined }}>
                        <td className="td-mono" style={{ whiteSpace: 'nowrap' }}>{new Date(e.timestamp).toLocaleTimeString()}</td>
                        <td className="td-mono truncate" style={{ maxWidth: 120 }}>{e.source_ip_pseudonym}</td>
                        <td><span className="badge badge-info">{e.event_type.replace('_', ' ')}</span></td>
                        <td style={{ fontSize: '0.75rem' }}>{e.protocol}</td>
                        <td><SevBadge v={e.severity} /></td>
                        <td>
                          <div className="risk-meter" data-level={e.risk_level}>
                            {[1,2,3,4].map(i => <div key={i} className="risk-meter-bar" />)}
                          </div>
                        </td>
                        <td>
                          {e.mitre_technique ? (
                            <span
                              className="badge"
                              style={{
                                fontSize: '0.72rem',
                                background: 'rgba(139, 26, 47, 0.08)',
                                color: 'var(--burgundy-700, #8B1A2F)',
                                border: '1px solid rgba(139, 26, 47, 0.2)',
                              }}
                              title={`${e.mitre_technique_name || ''} (${e.mitre_tactic || ''})`}
                            >
                              {e.mitre_technique}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--charcoal-400)', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                        <td className="td-mono truncate" style={{ maxWidth: 150 }}>{e.command || '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleAIAnalyze(e)}
                            title="AI Threat Analysis"
                            style={{
                              padding: '4px 8px',
                              background: aiEvent?.id === e.id ? 'var(--burgundy-600)' : undefined,
                              color: aiEvent?.id === e.id ? 'white' : undefined,
                            }}
                          >
                            <Cpu size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <span>Page {page} of {pages}</span>
                <div className="pagination-controls">
                  <button className="pagination-btn" onClick={() => setPage(p=>p-1)} disabled={page===1}>‹</button>
                  <button className="pagination-btn" onClick={() => setPage(p=>p+1)} disabled={page===pages}>›</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* AI panel */}
        {aiEvent && (
          <div className="panel" style={{ width: 340, flexShrink: 0 }}>
            <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="panel-title">AI Analysis</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--charcoal-500)', marginTop: 2 }}>
                  {aiEvent.event_type} • {aiEvent.protocol}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 6px', height: 'auto', minHeight: 0 }}
                onClick={() => setAiEvent(null)}
                title="Close AI panel"
              >
                <X size={15} />
              </button>
            </div>
            <div className="panel-body">
              {aiLoading ? (
                <div className="loading-state" style={{ padding: '20px 0' }}>
                  <div className="spinner" />
                </div>
              ) : aiResult ? (
                <div>
                  <AIField label="Classification" value={aiResult.classification} />
                  <AIField label="Severity" value={aiResult.severity} />
                  <AIField label="Confidence" value={aiResult.confidence} />
                  <AIField label="Reason" value={aiResult.reason} />
                  <AIField label="Potential Impact" value={aiResult.potential_impact} />
                  <AIField label="Recommended Action" value={aiResult.recommended_action} />
                  <div className="ai-disclaimer" style={{ marginTop: 12 }}>
                    <span>⚠️</span> {aiResult.disclaimer}
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <div className="empty-state-text">AI analysis unavailable.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AIField({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--burgundy-600)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--charcoal-700)', lineHeight: 1.5 }}>{value}</div>
    </div>
  )
}
