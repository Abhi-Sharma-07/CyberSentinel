import { useEffect, useState } from 'react'
import { privacyApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Database, Plus, X, Lock } from 'lucide-react'

export default function InventoryPage() {
  const { user, can } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = () => {
    setLoading(true)
    privacyApi.listInventory({ page:1, page_size:100 })
      .then(r => setItems(r.data.items))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="animate-fade-in-up">
      <div className="page-hero">
        <div className="page-hero-watermark">DIN</div>
        <div className="page-hero-eyebrow">Data Governance</div>
        <h1 className="page-hero-title">Data Inventory</h1>
        <p className="page-hero-sub">Document all data elements, purposes, retention periods, and protection methods for data minimization compliance.</p>
        <div className="page-hero-actions">
          {can('MANAGE_PRIVACY') ? (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Add Data Element
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
              <div className="empty-state-icon"><Database size={22} /></div>
              <div className="empty-state-title">No data inventory items</div>
              {can('MANAGE_PRIVACY') && (
                <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => setShowModal(true)}>
                  <Plus size={14} /> Add Data Element
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Data Element</th><th>Category</th><th>Purpose</th><th>PII</th>
                  <th>Retention</th><th>Access Role</th><th>Protection</th><th>Legal Basis</th>
                </tr></thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.id}>
                      <td style={{ fontWeight:500 }}>{i.data_element}</td>
                      <td><span className="badge badge-info">{i.data_category}</span></td>
                      <td className="truncate" style={{ maxWidth:180 }}>{i.purpose}</td>
                      <td>
                        <span className={`badge ${i.is_pii ? 'badge-critical':'badge-neutral'}`}>
                          {i.is_pii ? 'PII' : 'Non-PII'}
                        </span>
                      </td>
                      <td style={{ fontSize:'0.75rem' }}>{i.retention_period||'—'}</td>
                      <td style={{ fontSize:'0.75rem' }}>{i.access_role||'—'}</td>
                      <td className="truncate" style={{ maxWidth:140, fontSize:'0.75rem' }}>{i.protection_method||'—'}</td>
                      <td style={{ fontSize:'0.72rem' }}>{i.legal_basis||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {showModal && <AddInventoryModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function AddInventoryModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    data_element:'', data_category:'Technical', purpose:'',
    collection_source:'', retention_period:'', access_role:'',
    protection_method:'', deletion_method:'', is_pii:false,
    legal_basis:'', notes:'',
  })
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await privacyApi.createInventory(form); onCreated() }
    catch {} finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Data Element</h2>
          <button className="modal-close btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Data Element *</label>
              <input className="form-control" required value={form.data_element} onChange={e=>set('data_element',e.target.value)} placeholder="e.g. Source IP Pseudonym" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={form.data_category} onChange={e=>set('data_category',e.target.value)}>
                {['Technical','Personal','Sensitive','Operational'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Purpose *</label>
            <textarea className="form-control" rows={2} required value={form.purpose} onChange={e=>set('purpose',e.target.value)} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Retention Period</label>
              <input className="form-control" value={form.retention_period} onChange={e=>set('retention_period',e.target.value)} placeholder="e.g. 90 days" />
            </div>
            <div className="form-group">
              <label className="form-label">Access Role</label>
              <input className="form-control" value={form.access_role} onChange={e=>set('access_role',e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Protection Method</label>
            <input className="form-control" value={form.protection_method} onChange={e=>set('protection_method',e.target.value)} placeholder="e.g. HMAC-SHA256 pseudonymization" />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={form.is_pii} onChange={e=>set('is_pii',e.target.checked)} />
              Contains PII
            </label>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Add Element'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
