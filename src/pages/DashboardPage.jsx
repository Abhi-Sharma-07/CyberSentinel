import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { eventsApi, risksApi, incidentsApi, complianceApi, aiApi } from '../services/api'
import { Activity, AlertTriangle, Shield, CheckSquare, FileText, BarChart2, Lock, Archive, Cpu } from 'lucide-react'

// ── Custom tooltip ────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'white', border: '1px solid var(--cream-300)',
      borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow-md)',
      fontSize: '0.78rem', color: 'var(--charcoal-700)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--charcoal-900)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ── Palette ────────────────────────────────────────────────
const SEVERITY_COLORS = {
  LOW: '#15803d', MEDIUM: '#b45309', HIGH: '#c2410c', CRITICAL: '#b91c1c',
}

const PIE_COLORS = ['#b91c1c', '#c2410c', '#b45309', '#15803d']

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [risks, setRisks] = useState([])
  const [incidents, setIncidents] = useState([])
  const [executive, setExecutive] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchCore = () => {
    return Promise.all([
      eventsApi.stats().catch(() => null),
      risksApi.list({ page: 1, page_size: 5, status: 'OPEN' }).catch(() => null),
      incidentsApi.list({ page: 1, page_size: 5 }).catch(() => null),
    ]).then(([s, r, inc]) => {
      setStats(s?.data)
      setRisks(r?.data?.items || [])
      setIncidents(inc?.data?.items || [])
      setLastRefresh(new Date())
    })
  }

  useEffect(() => {
    // Initial load
    fetchCore().finally(() => setLoading(false))

    aiApi.executiveSummary()
      .then((exec) => setExecutive(exec?.data))
      .catch(() => null)
      .finally(() => setAiLoading(false))

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCore, 30_000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        Loading dashboard…
      </div>
    )
  }

  const normalizeLabel = (str = '') => {
    return String(str)
      .replace(/^(SeverityLevel\.|EventType\.|RiskLevel\.)/i, '')
      .replace(/_/g, ' ')
      .trim()
  }

  // ── Build chart data ─────────────────────────────────────
  const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  const severityData = stats?.by_severity
    ? Object.entries(stats.by_severity)
        .map(([name, value]) => {
          const clean = normalizeLabel(name).toUpperCase()
          return { name: clean, value }
        })
        .sort((a, b) => {
          const idxA = severityOrder.indexOf(a.name)
          const idxB = severityOrder.indexOf(b.name)
          return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB)
        })
    : []

  const eventTypeData = stats?.by_event_type
    ? Object.entries(stats.by_event_type).map(([name, value]) => ({
        name: normalizeLabel(name),
        value
      }))
    : []

  const riskDistData = stats?.by_risk_level
    ? Object.entries(stats.by_risk_level).map(([name, value]) => ({
        name: normalizeLabel(name).toUpperCase(),
        value
      }))
    : []

  // Mock time series (would come from real API with ?group_by=day)
  const timeSeriesData = [
    { day: 'Mon', events: 42, threats: 8 },
    { day: 'Tue', events: 68, threats: 14 },
    { day: 'Wed', events: 35, threats: 5 },
    { day: 'Thu', events: 91, threats: 22 },
    { day: 'Fri', events: 124, threats: 31 },
    { day: 'Sat', events: 57, threats: 9 },
    { day: 'Sun', events: stats?.total || 49, threats: 11 },
  ]

  const ai = executive?.ai_summary

  return (
    <div className="animate-fade-in-up">
      {/* ── Hero ── */}
      <div className="page-hero">
        <div className="page-hero-watermark">GRC</div>
        <div className="page-hero-eyebrow">Enterprise Security & GRC Command Center</div>
        <h1 className="page-hero-title">
          Unified Threat Intelligence &<br />
          Continuous Governance, Risk & Compliance
        </h1>
        <p className="page-hero-sub">
          Real-time honeypot sensor telemetry, deterministic threat detection,
          automated quantitative risk management, and continuous compliance posture across enterprise standards.
        </p>
        {ai?.headline && (
          <div style={{
            marginTop: 20, padding: '12px 16px',
            background: 'rgba(139,26,47,0.06)', borderRadius: 10,
            borderLeft: '3px solid var(--burgundy-600)',
            fontSize: '0.82rem', color: 'var(--charcoal-700)',
            maxWidth: 520, lineHeight: 1.5,
          }}>
            <span style={{ fontWeight: 600, color: 'var(--burgundy-600)' }}>AI Insight: </span>
            {ai.headline}
          </div>
        )}
      </div>

      {/* ── Metric cards ── */}
      <div className="metric-grid stagger-children">
        <MetricCard
          eyebrow="Total Events"
          value={stats?.total?.toLocaleString() || '—'}
          label="Security events captured"
          icon={<Activity size={16} />}
          accent=""
        />
        <MetricCard
          eyebrow="Events Today"
          value={stats?.today?.toLocaleString() || '—'}
          label="In the last 24 hours"
          icon={<BarChart2 size={16} />}
          accent="gold"
        />
        <MetricCard
          eyebrow="High-Risk Events"
          value={Object.values(stats?.by_risk_level || {})
            .slice(2).reduce((a,b)=>a+b,0) || '—'}
          label="HIGH + CRITICAL risk level"
          icon={<AlertTriangle size={16} />}
          accent="high"
        />
        <MetricCard
          eyebrow="Critical Events"
          value={stats?.by_severity?.CRITICAL || 0}
          label="Requires immediate attention"
          icon={<Shield size={16} />}
          accent="critical"
        />
        <MetricCard
          eyebrow="Open Risks"
          value={executive?.metrics?.open_risks ?? '—'}
          label="In the risk register"
          icon={<FileText size={16} />}
          accent="high"
        />
        <MetricCard
          eyebrow="Open Incidents"
          value={executive?.metrics?.open_incidents ?? '—'}
          label="Pending resolution"
          icon={<AlertTriangle size={16} />}
          accent="medium"
        />
        <MetricCard
          eyebrow="Compliance Gaps"
          value={executive?.metrics?.compliance_gaps ?? '—'}
          label="Non-compliant controls"
          icon={<CheckSquare size={16} />}
          accent="medium"
        />
        <MetricCard
          eyebrow="Controls for Review"
          value={executive?.metrics?.controls_requiring_review ?? '—'}
          label="Not yet implemented"
          icon={<Lock size={16} />}
          accent=""
        />
      </div>

      {/* ── Charts row 1 ── */}
      <div className="panel-grid-2">
        {/* Event timeline */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Security Events — 7-Day Trend</div>
              <div className="panel-subtitle">Events and threat detections over time</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="evtGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b1a2f" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#8b1a2f" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="thrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#c2410c" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#c2410c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cream-300)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--charcoal-500)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--charcoal-500)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Area type="monotone" dataKey="events" name="Events" stroke="#8b1a2f" fill="url(#evtGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="threats" name="Threats" stroke="#c2410c" fill="url(#thrGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Severity breakdown */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Events by Severity</div>
              <div className="panel-subtitle">Risk-level distribution</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cream-300)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--charcoal-500)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--charcoal-500)' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Events" radius={[0,4,4,0]}>
                    {severityData.map((entry, i) => (
                      <Cell key={i} fill={SEVERITY_COLORS[entry.name] || '#ccc'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="panel-grid-2">
        {/* Event type breakdown */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Events by Type</div>
              <div className="panel-subtitle">Attack pattern distribution</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cream-300)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--charcoal-500)' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--charcoal-500)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Events" fill="var(--burgundy-600)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Risk distribution donut */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Risk Distribution</div>
              <div className="panel-subtitle">Current risk-level spread</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="chart-container" style={{ display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie data={riskDistData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    dataKey="value" nameKey="name" paddingAngle={3}>
                    {riskDistData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {riskDistData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '0.78rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--charcoal-700)' }}>{d.name}</span>
                    <strong style={{ color: 'var(--charcoal-900)' }}>{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom panels ── */}
      <div className="panel-grid-2">
        {/* Recent open risks */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Open Risks</div>
            <a href="/risks" className="btn btn-ghost btn-sm">View all →</a>
          </div>
          <div className="table-wrap">
            {risks.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--charcoal-500)' }}>No open risks found.</div>
              </div>
            ) : (
              <table>
                <thead><tr>
                  <th>Risk ID</th><th>Asset</th><th>Score</th><th>Level</th>
                </tr></thead>
                <tbody>
                  {risks.map(r => (
                    <tr key={r.id}>
                      <td className="td-mono">{r.risk_id}</td>
                      <td className="truncate" style={{ maxWidth: 140 }}>{r.asset}</td>
                      <td><strong>{r.risk_score}</strong></td>
                      <td><RiskBadge level={r.risk_level} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent incidents */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Recent Incidents</div>
            <a href="/incidents" className="btn btn-ghost btn-sm">View all →</a>
          </div>
          <div className="table-wrap">
            {incidents.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--charcoal-500)' }}>No incidents found.</div>
              </div>
            ) : (
              <table>
                <thead><tr>
                  <th>ID</th><th>Type</th><th>Severity</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {incidents.map(i => (
                    <tr key={i.id}>
                      <td className="td-mono">{i.incident_id}</td>
                      <td className="truncate" style={{ maxWidth: 120 }}>{i.incident_type}</td>
                      <td><SeverityBadge sev={i.severity} /></td>
                      <td><span className={`lifecycle-pill lifecycle-${i.status}`}>{i.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── AI Executive Summary ── */}
      {ai && (
        <div className="panel">
          <div className="panel-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="panel-title">AI Executive Summary</div>
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {ai.ai_generated ? <><Cpu size={12} style={{ color: 'var(--burgundy-600)' }} /> Google Gemini AI</> : '⚡ Platform Analytics'}
                </span>
              </div>
              <div className="panel-subtitle">
                {ai.headline || 'Automated posture overview — analyst review required'}
              </div>
            </div>
            <PostureBadge posture={ai.security_posture || 'STABLE'} />
          </div>
          <div className="panel-body">
            {ai.summary_paragraphs?.length > 0 ? (
              ai.summary_paragraphs.map((p, i) => (
                <p key={i} style={{ fontSize: '0.85rem', color: 'var(--charcoal-700)', marginBottom: 10, lineHeight: 1.65 }}>{p}</p>
              ))
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--charcoal-600)', marginBottom: 10 }}>
                {ai.message || 'Telemetry and risk metrics are being continuously gathered for security evaluation.'}
              </p>
            )}

            {ai.top_priorities?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Top Strategic Priorities</div>
                <ol style={{ paddingLeft: 18, display: 'grid', gap: 6 }}>
                  {ai.top_priorities.map((p, i) => (
                    <li key={i} style={{ fontSize: '0.82rem', color: 'var(--charcoal-700)' }}>{p}</li>
                  ))}
                </ol>
              </div>
            )}
            <div className="ai-disclaimer" style={{ marginTop: 16 }}>
              <span className="ai-disclaimer-icon">⚠️</span>
              AI-generated summary — analyst review required. This output is advisory only and does not constitute a final security determination or compliance certification.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────

function MetricCard({ eyebrow, value, label, icon, accent }) {
  return (
    <div className={`metric-card ${accent}`}>
      <div className="metric-card-icon">{icon}</div>
      <div className="metric-card-eyebrow">{eyebrow}</div>
      <div className="metric-card-value">{value}</div>
      <div className="metric-card-label">{label}</div>
    </div>
  )
}

function SeverityBadge({ sev }) {
  const cls = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical' }
  return <span className={`badge ${cls[sev] || 'badge-neutral'}`}>{sev}</span>
}

function RiskBadge({ level }) {
  const cls = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical' }
  return <span className={`badge ${cls[level] || 'badge-neutral'}`}>{level}</span>
}

function PostureBadge({ posture }) {
  const map = {
    IMPROVING:    { cls: 'badge-low',      label: '↑ Improving' },
    STABLE:       { cls: 'badge-info',     label: '→ Stable' },
    DETERIORATING:{ cls: 'badge-high',     label: '↓ Deteriorating' },
    CRITICAL:     { cls: 'badge-critical', label: '! Critical' },
  }
  const b = map[posture] || { cls: 'badge-neutral', label: posture }
  return <span className={`badge ${b.cls}`}>{b.label}</span>
}
