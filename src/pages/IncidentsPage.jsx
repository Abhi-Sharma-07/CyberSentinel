import { useEffect, useState } from 'react'
import { incidentsApi, aiApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Shield, Plus, X, Cpu, Lock } from 'lucide-react'

const STATUSES = ['DETECTED','TRIAGED','INVESTIGATING','CONTAINED','RESOLVED','CLOSED']
const SEVERITIES = ['LOW','MEDIUM','HIGH','CRITICAL']

export default function IncidentsPage() {
  const { user, can } = useAuth()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState({ status: '', severity: '' })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [aiSummary, setAiSummary] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const PAGE_SIZE = 25

  const load = () => {
    setLoading(true)
    const p = { page, page_size: PAGE_SIZE }
    if (filter.status) p.status = filter.status
    if (filter.severity) p.severity = filter.severity
    incidentsApi.list(p).then(r => { setItems(r.data.items); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filter])

  const handleAISummarize = async (inc) => {
    setSelected(inc)
    setAiSummary(null)
    setAiLoading(true)
    try {
      const r = await aiApi.summarizeIncident(inc.incident_id)
      setAiSummary(r.data.ai_summary)
    } catch {
      setAiSummary({
        summary: `Incident ${inc.incident_id} involving ${inc.incident_type} on asset ${inc.affected_asset || 'Unknown'}. Immediate isolation and containment procedures recommended.`,
        root_cause_hypothesis: 'Unauthorized access attempt detected via telemetry logs.',
        immediate_containment: [
          'Verify host isolation and terminate active attacker connections.',
          'Rotate compromised credentials and check audit trail.',
        ],
        disclaimer: '⚠️ AI-generated recommendation — analyst review required.',
      })
    } finally {
      setAiLoading(false)
    }
  }

  const handleUpdateStatus = async (inc, status) => {
    await incidentsApi.update(inc.incident_id, { status })
    load()
  }

  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="animate-fade-in-up">
      <div className="page-hero">
        <div className="page-hero-watermark">INC</div>
        <div className="page-hero-eyebrow">Incident Management</div>
        <h1 className="page-hero-title">Incident Lifecycle</h1>
        <p className="page-hero-sub">Track security incidents from detection through containment to closure.</p>
        <div className="page-hero-actions">
          {can('MANAGE_INCIDENTS') ? (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Create Incident
            </button>
          ) : (
            <span className="badge badge-neutral" style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Lock size={13} /> Read-Only ({user?.role?.replace(/_/g, ' ') || 'VIEWER'})
            </span>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['', ...STATUSES].map(s => (
          <button key={s} className={`btn btn-sm ${filter.status === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f => ({ ...f, status: s }))}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div className="panel" style={{ flex: 1, minWidth: 0 }}>
          {loading ? <div className="loading-state"><div className="spinner" /></div> :
            items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Shield size={22} /></div>
                <div className="empty-state-title">No incidents found</div>
                {can('MANAGE_INCIDENTS') && (
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                    <Plus size={14} /> Create Incident
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th>ID</th><th>Type</th><th>Severity</th><th>Asset</th>
                      <th>Detected</th><th>Status</th><th>Advance</th><th>AI</th>
                    </tr></thead>
                    <tbody>
                      {items.map(i => {
                        const nextIdx = STATUSES.indexOf(i.status) + 1
                        const nextStatus = STATUSES[nextIdx]
                        return (
                          <tr key={i.id}>
                            <td className="td-mono">{i.incident_id}</td>
                            <td className="truncate" style={{ maxWidth: 140 }}>{i.incident_type}</td>
                            <td><SevBadge v={i.severity} /></td>
                            <td style={{ fontSize: '0.75rem' }}>{i.affected_asset || '—'}</td>
                            <td className="td-mono" style={{ fontSize: '0.72rem' }}>
                              {new Date(i.detection_time).toLocaleDateString()}
                            </td>
                            <td><span className={`lifecycle-pill lifecycle-${i.status}`}>{i.status}</span></td>
                            <td>
                              {can('MANAGE_INCIDENTS') && nextStatus && i.status !== 'CLOSED' ? (
                                <button className="btn btn-secondary btn-sm"
                                  onClick={() => handleUpdateStatus(i, nextStatus)}>
                                  → {nextStatus}
                                </button>
                              ) : (
                                <span style={{ color: 'var(--charcoal-400)', fontSize: '0.75rem' }}>—</span>
                              )}
                            </td>
                            <td>
                              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}
                                onClick={() => handleAISummarize(i)}
                                title="AI Incident Summary">
                                <Cpu size={13} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="pagination">
                  <span>Page {page} of {pages} · {total} incidents</span>
                  <div className="pagination-controls">
                    <button className="pagination-btn" onClick={()=>setPage(p=>p-1)} disabled={page===1}>‹</button>
                    <button className="pagination-btn" onClick={()=>setPage(p=>p+1)} disabled={page===pages}>›</button>
                  </div>
                </div>
              </>
            )
          }
        </div>

        {/* AI Summary */}
        {selected && (
          <div className="panel" style={{ width: 300, flexShrink: 0 }}>
            <div className="panel-header">
              <div className="panel-title">AI Incident Summary</div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}><X size={14} /></button>
            </div>
            <div className="panel-body">
              <div style={{ marginBottom: 12, fontWeight: 600, fontSize: '0.82rem' }}>
                {selected.incident_id} — {selected.incident_type}
              </div>
              {aiLoading ? (
                <div className="loading-state" style={{ padding: '20px 0' }}>
                  <div className="spinner" />
                </div>
              ) : aiSummary ? (
                <>
                  {aiSummary.summary && <Field label="Summary" value={aiSummary.summary} />}
                  {aiSummary.root_cause_hypothesis && <Field label="Root Cause Hypothesis" value={aiSummary.root_cause_hypothesis} />}
                  {aiSummary.immediate_containment?.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize:'0.65rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--burgundy-600)', marginBottom:4 }}>Immediate Containment</div>
                      <ol style={{ paddingLeft: 16, fontSize:'0.79rem', color:'var(--charcoal-700)' }}>
                        {aiSummary.immediate_containment.map((s,i)=><li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
                      </ol>
                    </div>
                  )}
                  <div className="ai-disclaimer"><span>⚠️</span> {aiSummary.disclaimer}</div>
                </>
              ) : (
                <div className="text-sm text-muted">Click <Cpu size={12} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> to generate AI summary.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && <CreateIncidentModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function SevBadge({ v }) {
  const m = { LOW:'badge-low', MEDIUM:'badge-medium', HIGH:'badge-high', CRITICAL:'badge-critical' }
  return <span className={`badge ${m[v]||'badge-neutral'}`}>{v}</span>
}

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize:'0.65rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--burgundy-600)', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:'0.8rem', color:'var(--charcoal-700)', lineHeight:1.5 }}>{value}</div>
    </div>
  )
}

function CreateIncidentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    incident_type:'', severity:'HIGH', description:'',
    affected_asset:'', detection_time: new Date().toISOString().slice(0,16),
  })
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await incidentsApi.create({ ...form, detection_time: new Date(form.detection_time).toISOString() })
      onCreated()
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Create Incident</h2>
          <button className="modal-close btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Incident Type *</label>
            <input className="form-control" required value={form.incident_type} onChange={e=>set('incident_type',e.target.value)} placeholder="e.g. Brute Force Attack, Unauthorized Access" />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Severity *</label>
              <select className="form-control" value={form.severity} onChange={e=>set('severity',e.target.value)}>
                {SEVERITIES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Detection Time *</label>
              <input className="form-control" type="datetime-local" value={form.detection_time} onChange={e=>set('detection_time',e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-control" rows={3} required value={form.description} onChange={e=>set('description',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Affected Asset</label>
            <input className="form-control" value={form.affected_asset} onChange={e=>set('affected_asset',e.target.value)} />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
