import { useEffect, useState } from 'react'
import { evidenceApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Archive, Plus, X, Lock } from 'lucide-react'

const EV_STATUSES = ['PENDING','UNDER_REVIEW','APPROVED','REJECTED']
const EV_TYPES = ['SCREENSHOT','LOG_EXPORT','POLICY_DOCUMENT','CONFIGURATION','REPORT','OTHER']

function EvidenceBadge({ s }) {
  const m = { PENDING:'badge-neutral', UNDER_REVIEW:'badge-medium', APPROVED:'badge-low', REJECTED:'badge-critical' }
  return <span className={`badge ${m[s]||'badge-neutral'}`}>{s}</span>
}

export default function EvidencePage() {
  const { user, can } = useAuth()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = () => {
    setLoading(true)
    evidenceApi.list({ page:1, page_size:50 })
      .then(r => { setItems(r.data.items); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleReview = async (id, status) => {
    await evidenceApi.review(id, status)
    load()
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-hero">
        <div className="page-hero-watermark">EVD</div>
        <div className="page-hero-eyebrow">Audit & Compliance</div>
        <h1 className="page-hero-title">Audit Evidence Register</h1>
        <p className="page-hero-sub">Link evidence to controls for audit readiness. Evidence is access-controlled by role.</p>
        <div className="page-hero-actions">
          {can('MANAGE_EVIDENCE') ? (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Add Evidence
            </button>
          ) : (
            <span className="badge badge-neutral" style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Lock size={13} /> Read-Only ({user?.role?.replace(/_/g, ' ') || 'VIEWER'})
            </span>
          )}
        </div>
      </div>

      <div className="panel">
        {loading ? <div className="loading-state"><div className="spinner" /></div> :
          items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Archive size={22} /></div>
              <div className="empty-state-title">No evidence records</div>
              {can('MANAGE_EVIDENCE') && (
                <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => setShowModal(true)}>
                  <Plus size={14} /> Add Evidence
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Evidence ID</th><th>Type</th><th>Description</th><th>Source</th>
                  <th>Date</th><th>Owner</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {items.map(e => (
                    <tr key={e.id}>
                      <td className="td-mono">{e.evidence_id}</td>
                      <td><span className="badge badge-info">{e.evidence_type}</span></td>
                      <td className="truncate" style={{ maxWidth:200 }}>{e.description}</td>
                      <td style={{ fontSize:'0.75rem' }}>{e.source||'—'}</td>
                      <td style={{ fontSize:'0.72rem' }}>{e.evidence_date||'—'}</td>
                      <td style={{ fontSize:'0.75rem' }}>{e.owner||'—'}</td>
                      <td><EvidenceBadge s={e.review_status} /></td>
                      <td>
                        {can('MANAGE_EVIDENCE') && e.review_status === 'PENDING' ? (
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => handleReview(e.evidence_id, 'APPROVED')}>
                            Approve
                          </button>
                        ) : (
                          <span style={{ color: 'var(--charcoal-400)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {showModal && <CreateEvidenceModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function CreateEvidenceModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    control_id:'00000000-0000-0000-0000-000000000000',
    evidence_type:'LOG_EXPORT', description:'', source:'', owner:'',
    evidence_date: new Date().toISOString().slice(0,10), notes:'',
  })
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await evidenceApi.create(form); onCreated() }
    catch {} finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Evidence</h2>
          <button className="modal-close btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Evidence Type *</label>
              <select className="form-control" value={form.evidence_type} onChange={e=>set('evidence_type',e.target.value)}>
                {EV_TYPES.map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Evidence Date</label>
              <input className="form-control" type="date" value={form.evidence_date} onChange={e=>set('evidence_date',e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-control" rows={2} required value={form.description} onChange={e=>set('description',e.target.value)} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Source</label>
              <input className="form-control" value={form.source} onChange={e=>set('source',e.target.value)} placeholder="e.g. SIEM, Log file" />
            </div>
            <div className="form-group">
              <label className="form-label">Owner</label>
              <input className="form-control" value={form.owner} onChange={e=>set('owner',e.target.value)} />
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Add Evidence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
