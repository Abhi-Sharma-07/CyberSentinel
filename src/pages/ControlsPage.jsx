import { useEffect, useState } from 'react'
import { controlsApi, aiApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { CheckSquare, Plus, X, Lock } from 'lucide-react'

const FRAMEWORKS = ['ISO_27001','SOC_2','GDPR','DPDP_2023']
const IMPL_STATUS = ['IMPLEMENTED','PARTIALLY_IMPLEMENTED','NOT_IMPLEMENTED','NOT_APPLICABLE']

const FRAMEWORK_LABELS = {
  ISO_27001: 'ISO 27001', SOC_2: 'SOC 2', GDPR: 'GDPR', DPDP_2023: 'DPDP 2023'
}

function StatusBadge({ s }) {
  const m = {
    IMPLEMENTED: 'badge-low',
    PARTIALLY_IMPLEMENTED: 'badge-medium',
    NOT_IMPLEMENTED: 'badge-high',
    NOT_APPLICABLE: 'badge-neutral',
  }
  const labels = {
    IMPLEMENTED: 'Implemented', PARTIALLY_IMPLEMENTED: 'Partial',
    NOT_IMPLEMENTED: 'Not Implemented', NOT_APPLICABLE: 'N/A'
  }
  return <span className={`badge ${m[s]||'badge-neutral'}`}>{labels[s]||s}</span>
}

export default function ControlsPage() {
  const { user, can } = useAuth()
  const [controls, setControls] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState({ framework: '', status: '' })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const PAGE_SIZE = 25

  const load = () => {
    setLoading(true)
    const p = { page, page_size: PAGE_SIZE }
    if (filter.framework) p.framework = filter.framework
    if (filter.status) p.status = filter.status
    controlsApi.list(p).then(r => { setControls(r.data.items); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filter])

  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="animate-fade-in-up">
      <div className="page-hero">
        <div className="page-hero-watermark">CTL</div>
        <div className="page-hero-eyebrow">Security Controls</div>
        <h1 className="page-hero-title">Control Register</h1>
        <p className="page-hero-sub">
          ISO 27001 · SOC 2 · GDPR · DPDP 2023 reference controls.
          These are <strong>reference / assessment mappings</strong> only — not certifications.
        </p>
        <div className="page-hero-actions">
          {can('MANAGE_CONTROLS') ? (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Add Control
            </button>
          ) : (
            <span className="badge badge-neutral" style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Lock size={13} /> Read-Only ({user?.role?.replace(/_/g, ' ') || 'VIEWER'})
            </span>
          )}
        </div>
      </div>

      {/* Framework tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['', ...FRAMEWORKS].map(f => (
          <button key={f} className={`btn btn-sm ${filter.framework === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(x => ({ ...x, framework: f }))}>
            {f ? FRAMEWORK_LABELS[f] : 'All Frameworks'}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="filter-bar">
          <select className="form-control" style={{ width: 'auto' }} value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            {IMPL_STATUS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <span className="ml-auto text-sm text-muted">{total} controls</span>
        </div>

        {loading ? <div className="loading-state"><div className="spinner" /></div> :
          controls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CheckSquare size={22} /></div>
              <div className="empty-state-title">No controls yet</div>
              {can('MANAGE_CONTROLS') && (
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                  <Plus size={14} /> Add Control
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Control ID</th><th>Name</th><th>Framework</th><th>Ref</th>
                    <th>Category</th><th>Status</th><th>Owner</th><th>Last Tested</th>
                  </tr></thead>
                  <tbody>
                    {controls.map(c => (
                      <tr key={c.id}>
                        <td className="td-mono">{c.control_id}</td>
                        <td style={{ fontWeight: 500, maxWidth: 220 }} className="truncate">{c.name}</td>
                        <td><span className="badge badge-info">{FRAMEWORK_LABELS[c.framework] || c.framework}</span></td>
                        <td className="td-mono" style={{ fontSize: '0.72rem' }}>{c.framework_reference || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{c.category || '—'}</td>
                        <td><StatusBadge s={c.implementation_status} /></td>
                        <td style={{ fontSize: '0.75rem' }}>{c.control_owner || '—'}</td>
                        <td style={{ fontSize: '0.72rem' }}>{c.last_tested || '—'}</td>
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

      {showModal && <CreateControlModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function CreateControlModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name:'', description:'', category:'', framework:'ISO_27001',
    framework_reference:'', implementation_status:'NOT_IMPLEMENTED',
    control_owner:'', testing_frequency:'ANNUAL', notes:'',
  })
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await controlsApi.create(form); onCreated() }
    catch {} finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Control</h2>
          <button className="modal-close btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Control Name *</label>
            <input className="form-control" required value={form.name} onChange={e=>set('name',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-control" rows={2} required value={form.description} onChange={e=>set('description',e.target.value)} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Framework *</label>
              <select className="form-control" value={form.framework} onChange={e=>set('framework',e.target.value)}>
                {FRAMEWORKS.map(f=><option key={f} value={f}>{FRAMEWORK_LABELS[f]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Framework Reference</label>
              <input className="form-control" value={form.framework_reference} onChange={e=>set('framework_reference',e.target.value)} placeholder="e.g. A.9.1.1" />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-control" value={form.category} onChange={e=>set('category',e.target.value)} placeholder="e.g. Access Control" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.implementation_status} onChange={e=>set('implementation_status',e.target.value)}>
                {IMPL_STATUS.map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Control Owner</label>
              <input className="form-control" value={form.control_owner} onChange={e=>set('control_owner',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Testing Frequency</label>
              <select className="form-control" value={form.testing_frequency} onChange={e=>set('testing_frequency',e.target.value)}>
                {['MONTHLY','QUARTERLY','SEMI_ANNUAL','ANNUAL'].map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Add Control'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
