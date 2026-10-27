import { useEffect, useState } from 'react'
import { complianceApi, aiApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ClipboardList, Plus, X, Lock } from 'lucide-react'

const FRAMEWORKS = ['ISO_27001','SOC_2','GDPR','DPDP_2023']
const GAP_STATUSES = ['COMPLIANT','PARTIAL','NON_COMPLIANT','NOT_ASSESSED']
const FRAMEWORK_LABELS = { ISO_27001:'ISO 27001', SOC_2:'SOC 2', GDPR:'GDPR', DPDP_2023:'DPDP 2023' }

function GapBadge({ s }) {
  const m = { COMPLIANT:'badge-low', PARTIAL:'badge-medium', NON_COMPLIANT:'badge-critical', NOT_ASSESSED:'badge-neutral' }
  return <span className={`badge ${m[s]||'badge-neutral'}`}>{s?.replace('_',' ')}</span>
}

export default function CompliancePage() {
  const { user, can } = useAuth()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState({ framework:'', status:'' })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const PAGE_SIZE = 25

  const load = () => {
    setLoading(true)
    const p = { page, page_size:PAGE_SIZE }
    if (filter.framework) p.framework = filter.framework
    if (filter.status) p.status = filter.status
    complianceApi.list(p).then(r => { setItems(r.data.items); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filter])
  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="animate-fade-in-up">
      <div className="page-hero">
        <div className="page-hero-watermark">GAP</div>
        <div className="page-hero-eyebrow">Reference Assessment Only</div>
        <h1 className="page-hero-title">Compliance Gap Assessment</h1>
        <p className="page-hero-sub">
          Framework gap analysis across ISO 27001, SOC 2, GDPR and DPDP Act 2023.
          AI-suggested mappings are advisory only — <strong>this does not constitute legal compliance or certification.</strong>
        </p>
        <div className="page-hero-actions">
          {can('MANAGE_CONTROLS') ? (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Add Assessment
            </button>
          ) : (
            <span className="badge badge-neutral" style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Lock size={13} /> Read-Only ({user?.role?.replace(/_/g, ' ') || 'VIEWER'})
            </span>
          )}
        </div>
      </div>

      <div className="alert alert-warning" style={{ marginBottom: 20 }}>
        <ClipboardList size={16} style={{ flexShrink:0 }} />
        <span>These are <strong>reference / assessment mappings</strong>. They do NOT confirm legal compliance, ISO 27001 certification, SOC 2 certification, or any regulatory determination.</span>
      </div>

      {/* Framework tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {['', ...FRAMEWORKS].map(f => (
          <button key={f} className={`btn btn-sm ${filter.framework===f?'btn-primary':'btn-secondary'}`}
            onClick={() => setFilter(x=>({...x,framework:f}))}>
            {f ? FRAMEWORK_LABELS[f] : 'All Frameworks'}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="filter-bar">
          <select className="form-control" style={{ width:'auto' }} value={filter.status}
            onChange={e=>setFilter(f=>({...f,status:e.target.value}))}>
            <option value="">All Statuses</option>
            {GAP_STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <span className="ml-auto text-sm text-muted">{total} assessments</span>
        </div>

        {loading ? <div className="loading-state"><div className="spinner" /></div> :
          items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ClipboardList size={22} /></div>
              <div className="empty-state-title">No assessments yet</div>
              {can('MANAGE_CONTROLS') && (
                <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => setShowModal(true)}>
                  <Plus size={14} /> Add Assessment
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Framework</th><th>Requirement</th><th>Current State</th>
                    <th>Gap</th><th>Risk</th><th>Owner</th><th>Status</th><th>AI Mapping</th>
                  </tr></thead>
                  <tbody>
                    {items.map(i => (
                      <tr key={i.id}>
                        <td><span className="badge badge-info">{FRAMEWORK_LABELS[i.framework]||i.framework}</span></td>
                        <td className="truncate" style={{ maxWidth:180 }}>{i.requirement}</td>
                        <td className="truncate" style={{ maxWidth:160 }}>{i.current_state||'—'}</td>
                        <td className="truncate" style={{ maxWidth:160 }}>{i.gap||'—'}</td>
                        <td>{i.risk ? <span className={`badge badge-${i.risk.toLowerCase()}`}>{i.risk}</span> : '—'}</td>
                        <td style={{ fontSize:'0.75rem' }}>{i.owner||'—'}</td>
                        <td><GapBadge s={i.status} /></td>
                        <td>
                          {i.ai_mapping_suggestion ? (
                            <span className="badge badge-info" title="AI mapping available">AI ✓</span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <span>Page {page} of {pages}</span>
                <div className="pagination-controls">
                  <button className="pagination-btn" onClick={()=>setPage(p=>p-1)} disabled={page===1}>‹</button>
                  <button className="pagination-btn" onClick={()=>setPage(p=>p+1)} disabled={page===pages}>›</button>
                </div>
              </div>
            </>
          )
        }
      </div>

      {showModal && <CreateAssessmentModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function CreateAssessmentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    control_id:'00000000-0000-0000-0000-000000000000',
    framework:'ISO_27001', requirement:'', current_state:'',
    gap:'', risk:'MEDIUM', owner:'', status:'NOT_ASSESSED',
  })
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await complianceApi.create(form); onCreated() }
    catch {} finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Compliance Assessment</h2>
          <button className="modal-close btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="ai-disclaimer" style={{ marginBottom: 20 }}>
          <span>⚠️</span> These assessments are reference / educational mappings only. They do not constitute legal compliance or certification status.
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Framework *</label>
              <select className="form-control" value={form.framework} onChange={e=>set('framework',e.target.value)}>
                {FRAMEWORKS.map(f=><option key={f} value={f}>{FRAMEWORK_LABELS[f]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e=>set('status',e.target.value)}>
                {GAP_STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Requirement *</label>
            <textarea className="form-control" rows={2} required value={form.requirement} onChange={e=>set('requirement',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Current State</label>
            <textarea className="form-control" rows={2} value={form.current_state} onChange={e=>set('current_state',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Gap</label>
            <textarea className="form-control" rows={2} value={form.gap} onChange={e=>set('gap',e.target.value)} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Risk Level</label>
              <select className="form-control" value={form.risk} onChange={e=>set('risk',e.target.value)}>
                {['LOW','MEDIUM','HIGH','CRITICAL'].map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Owner</label>
              <input className="form-control" value={form.owner} onChange={e=>set('owner',e.target.value)} />
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Add Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
