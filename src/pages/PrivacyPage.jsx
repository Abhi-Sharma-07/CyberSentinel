import { useEffect, useState } from 'react'
import { privacyApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Lock, Plus, X } from 'lucide-react'

const GAP_STATUSES = ['NOT_ASSESSED','COMPLIANT','PARTIAL','NON_COMPLIANT']

function StatusBadge({ s }) {
  const m = { COMPLIANT:'badge-low', PARTIAL:'badge-medium', NON_COMPLIANT:'badge-critical', NOT_ASSESSED:'badge-neutral' }
  return <span className={`badge ${m[s]||'badge-neutral'}`}>{s?.replace('_',' ')}</span>
}

export default function PrivacyPage() {
  const { user, can } = useAuth()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = () => {
    setLoading(true)
    privacyApi.listAssessments({ page:1, page_size:50 })
      .then(r => { setItems(r.data.items); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="animate-fade-in-up">
      <div className="page-hero">
        <div className="page-hero-watermark">PRV</div>
        <div className="page-hero-eyebrow">DPDP Act 2023 · GDPR Principles</div>
        <h1 className="page-hero-title">Privacy Assessment</h1>
        <p className="page-hero-sub">
          Educational and assessment-oriented privacy governance based on DPDP Act 2023 concepts and GDPR principles.
          <strong> This is not legal advice.</strong> Consult a qualified privacy professional for compliance obligations.
        </p>
        <div className="page-hero-actions">
          {can('MANAGE_PRIVACY') ? (
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

      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <Lock size={16} style={{ flexShrink:0 }} />
        <span>Privacy sections reference DPDP Act 2023 and GDPR for educational purposes only. This platform does not provide legal compliance determinations or legal advice.</span>
      </div>

      <div className="panel">
        {loading ? <div className="loading-state"><div className="spinner" /></div> :
          items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Lock size={22} /></div>
              <div className="empty-state-title">No privacy assessments</div>
              <div className="empty-state-text">Document your privacy requirements and current state.</div>
              {can('MANAGE_PRIVACY') && (
                <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => setShowModal(true)}>
                  <Plus size={14} /> Add Assessment
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Requirement</th><th>Framework Ref</th><th>Current State</th>
                  <th>Gap</th><th>Risk</th><th>Recommendation</th><th>Owner</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.id}>
                      <td className="truncate" style={{ maxWidth:200 }}>{i.requirement}</td>
                      <td style={{ fontSize:'0.72rem' }}>{i.framework_ref||'—'}</td>
                      <td className="truncate" style={{ maxWidth:160 }}>{i.current_state}</td>
                      <td className="truncate" style={{ maxWidth:140 }}>{i.gap||'—'}</td>
                      <td>{i.risk ? <span className={`badge badge-${i.risk.toLowerCase()}`}>{i.risk}</span>:'—'}</td>
                      <td className="truncate" style={{ maxWidth:180 }}>{i.recommendation||'—'}</td>
                      <td style={{ fontSize:'0.75rem' }}>{i.owner||'—'}</td>
                      <td><StatusBadge s={i.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {showModal && <AddAssessmentModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function AddAssessmentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    requirement:'', framework_ref:'', current_state:'',
    gap:'', risk:'MEDIUM', recommendation:'', owner:'', status:'NOT_ASSESSED',
  })
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await privacyApi.createAssessment(form); onCreated() }
    catch {} finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Privacy Assessment</h2>
          <button className="modal-close btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Requirement *</label>
            <input className="form-control" required value={form.requirement} onChange={e=>set('requirement',e.target.value)} placeholder="e.g. Data minimization per DPDP Section 6" />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Framework Reference</label>
              <input className="form-control" value={form.framework_ref} onChange={e=>set('framework_ref',e.target.value)} placeholder="e.g. DPDP S.6 / GDPR Art.5" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e=>set('status',e.target.value)}>
                {GAP_STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Current State *</label>
            <textarea className="form-control" rows={2} required value={form.current_state} onChange={e=>set('current_state',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Gap</label>
            <textarea className="form-control" rows={2} value={form.gap} onChange={e=>set('gap',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Recommendation</label>
            <textarea className="form-control" rows={2} value={form.recommendation} onChange={e=>set('recommendation',e.target.value)} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Risk</label>
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
