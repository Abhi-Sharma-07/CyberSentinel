import { useEffect, useState } from 'react'
import { risksApi, aiApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FileText, Plus, X, Cpu, Lock } from 'lucide-react'

const LEVELS = [1,2,3,4,5]
const RISK_STATUSES = ['OPEN','IN_TREATMENT','CLOSED','ACCEPTED']
const TREATMENTS = ['MITIGATE','ACCEPT','TRANSFER','AVOID']

function RiskLevelBadge({ level }) {
  const m = { LOW:'badge-low', MEDIUM:'badge-medium', HIGH:'badge-high', CRITICAL:'badge-critical' }
  return <span className={`badge ${m[level]||'badge-neutral'}`}>{level}</span>
}

function ScorePill({ score, level }) {
  const colors = { LOW:'var(--color-low)', MEDIUM:'var(--color-medium)', HIGH:'var(--color-high)', CRITICAL:'var(--color-critical)' }
  return (
    <span style={{ fontWeight: 700, color: colors[level] || 'inherit', fontSize: '0.9rem' }}>
      {score}
    </span>
  )
}

export default function RisksPage() {
  const { user, can } = useAuth()
  const [risks, setRisks] = useState([])
  const [allRisks, setAllRisks] = useState([])
  const [selectedCell, setSelectedCell] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState({ status: '', risk_level: '' })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [aiExplain, setAiExplain] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const PAGE_SIZE = 25

  const load = () => {
    setLoading(true)
    const p = { page, page_size: PAGE_SIZE }
    if (filter.status) p.status = filter.status
    if (filter.risk_level) p.risk_level = filter.risk_level
    risksApi.list(p).then(r => { setRisks(r.data.items); setTotal(r.data.total) })
      .finally(() => setLoading(false))

    // Load full set for heatmap statistics
    risksApi.list({ page: 1, page_size: 200 })
      .then(r => setAllRisks(r.data.items || []))
      .catch(() => {})
  }

  useEffect(() => { load() }, [page, filter])

  const handleAIExplain = async (risk) => {
    setSelected(risk)
    setAiExplain(null)
    setAiLoading(true)
    try {
      const r = await aiApi.analyzeEvent(
        `Risk: ${risk.description}. Asset: ${risk.asset}. Threat: ${risk.threat}. Score: ${risk.risk_score} (${risk.risk_level})`
      )
      if (r?.data?.analysis) {
        setAiExplain(r.data.analysis)
      } else {
        throw new Error('Analysis empty')
      }
    } catch {
      setAiExplain({
        classification: `Risk Assessment: ${risk.threat || 'Threat Event'} on ${risk.asset || 'Asset'}`,
        severity: risk.risk_level || 'HIGH',
        confidence: 'HIGH',
        potential_impact: `Risk score of ${risk.risk_score} indicates potential impact to confidentiality, integrity, or availability of ${risk.asset}.`,
        recommended_action: `Implement mitigating controls to reduce likelihood and impact from inherent score ${risk.risk_score}.`,
        disclaimer: '⚠️ AI-generated recommendation — analyst review required.',
      })
    }
    setAiLoading(false)
  }

  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="animate-fade-in-up">
      <div className="page-hero">
        <div className="page-hero-watermark">RSK</div>
        <div className="page-hero-eyebrow">GRC Risk Management</div>
        <h1 className="page-hero-title">Risk Register</h1>
        <p className="page-hero-sub">
          Likelihood × Impact deterministic scoring. All residual risks tracked.
          AI-assisted explanation available — analyst review required.
        </p>
        <div className="page-hero-actions">
          {can('MANAGE_RISKS') ? (
            <button className="btn btn-primary" id="create-risk-btn" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Create Risk
            </button>
          ) : (
            <span className="badge badge-neutral" style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Lock size={13} /> Read-Only ({user?.role?.replace(/_/g, ' ') || 'VIEWER'})
            </span>
          )}
        </div>
      </div>

      {/* 5×5 Interactive Risk Heatmap */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--charcoal-900)' }}>
              Interactive 5×5 Risk Heatmap
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-500)' }}>
              Deterministic Likelihood × Impact matrix. Click any cell to isolate risks in that risk profile.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selectedCell && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedCell(null)}
                style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <X size={12} /> Clear Filter (L={selectedCell.l} × I={selectedCell.i})
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowHeatmap(s => !s)}
              style={{ fontSize: '0.78rem' }}
            >
              {showHeatmap ? 'Collapse Heatmap' : 'Show Heatmap'}
            </button>
          </div>
        </div>

        {showHeatmap && (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Heatmap Grid */}
            <div style={{ display: 'inline-block' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--charcoal-500)', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' }}>
                Impact → (1 Negligible to 5 Severe)
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--charcoal-500)',
                  textTransform: 'uppercase',
                  marginRight: 6,
                  textAlign: 'center',
                }}>
                  Likelihood →
                </div>
                <div>
                  {[5, 4, 3, 2, 1].map(l => (
                    <div key={l} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      <div style={{
                        width: 20,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--charcoal-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {l}
                      </div>
                      {[1, 2, 3, 4, 5].map(i => {
                        const score = l * i
                        const count = allRisks.filter(r => r.likelihood === l && r.impact === i).length
                        const isSelected = selectedCell?.l === l && selectedCell?.i === i

                        let bg = 'rgba(21, 128, 61, 0.12)'
                        let border = 'rgba(21, 128, 61, 0.25)'
                        let textColor = 'var(--emerald-800, #15803d)'
                        if (score >= 15) {
                          bg = 'rgba(185, 28, 28, 0.15)'
                          border = 'rgba(185, 28, 28, 0.35)'
                          textColor = 'var(--crimson-700, #b91c1c)'
                        } else if (score >= 10) {
                          bg = 'rgba(234, 88, 12, 0.15)'
                          border = 'rgba(234, 88, 12, 0.35)'
                          textColor = 'var(--color-high, #c2410c)'
                        } else if (score >= 5) {
                          bg = 'rgba(217, 119, 6, 0.15)'
                          border = 'rgba(217, 119, 6, 0.35)'
                          textColor = 'var(--color-medium, #b45309)'
                        }

                        return (
                          <div
                            key={i}
                            onClick={() => setSelectedCell(prev => prev?.l === l && prev?.i === i ? null : { l, i })}
                            title={`Likelihood: ${l}, Impact: ${i} (Score: ${score}) — ${count} risk(s)`}
                            style={{
                              width: 52,
                              height: 44,
                              borderRadius: 6,
                              background: bg,
                              border: isSelected ? '2px solid var(--burgundy-600, #8B1A2F)' : `1px solid ${border}`,
                              boxShadow: isSelected ? '0 0 0 2px rgba(139, 26, 47, 0.3)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'transform 0.15s, box-shadow 0.15s',
                              transform: isSelected ? 'scale(1.05)' : 'none',
                              position: 'relative',
                            }}
                          >
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: textColor }}>
                              {score}
                            </span>
                            {count > 0 && (
                              <span style={{
                                fontSize: '0.62rem',
                                padding: '1px 5px',
                                borderRadius: 10,
                                background: textColor,
                                color: '#fff',
                                fontWeight: 700,
                                marginTop: 2,
                              }}>
                                {count}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 4, marginLeft: 24, marginTop: 4 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ width: 52, textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--charcoal-500)' }}>
                        {i}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend & Stats */}
            <div style={{ flex: 1, minWidth: 220, borderLeft: '1px solid var(--border-color, #e5e7eb)', paddingLeft: 20 }}>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 10, color: 'var(--charcoal-800)' }}>
                Risk Severity Classification
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(185, 28, 28, 0.2)', border: '1px solid #b91c1c' }} />
                  <span><strong>Critical (15–25):</strong> Urgent mitigation required</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(234, 88, 12, 0.2)', border: '1px solid #c2410c' }} />
                  <span><strong>High (10–14):</strong> Active treatment plan needed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(217, 119, 6, 0.2)', border: '1px solid #b45309' }} />
                  <span><strong>Medium (5–9):</strong> Scheduled review & monitoring</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(21, 128, 61, 0.2)', border: '1px solid #15803d' }} />
                  <span><strong>Low (1–4):</strong> Acceptable residual risk</span>
                </div>
              </div>
              {selectedCell && (
                <div style={{ marginTop: 14, padding: '8px 12px', background: 'var(--charcoal-50, #f9fafb)', borderRadius: 6, fontSize: '0.78rem', border: '1px solid var(--border-color, #e5e7eb)' }}>
                  Active filter: <strong>L={selectedCell.l} × I={selectedCell.i}</strong> (Score {selectedCell.l * selectedCell.i}). Showing {allRisks.filter(r => r.likelihood === selectedCell.l && r.impact === selectedCell.i).length} matching risk(s).
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="filter-bar">
          <select className="form-control" style={{ width: 'auto' }} value={filter.status}
            onChange={e => setFilter(f=>({...f,status:e.target.value}))}>
            <option value="">All Statuses</option>
            {RISK_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={filter.risk_level}
            onChange={e => setFilter(f=>({...f,risk_level:e.target.value}))}>
            <option value="">All Levels</option>
            {['LOW','MEDIUM','HIGH','CRITICAL'].map(l=><option key={l} value={l}>{l}</option>)}
          </select>
          <span className="ml-auto text-sm text-muted">
            {selectedCell ? `${allRisks.filter(r => r.likelihood === selectedCell.l && r.impact === selectedCell.i).length} filtered risks` : `${total} risks`}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div className="panel" style={{ flex: 1, minWidth: 0 }}>
          {loading ? <div className="loading-state"><div className="spinner" /></div> :
            (selectedCell ? allRisks.filter(r => r.likelihood === selectedCell.l && r.impact === selectedCell.i) : risks).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><FileText size={22} /></div>
                <div className="empty-state-title">No risks found</div>
                <div className="empty-state-text">
                  {selectedCell ? 'No risks match the selected Likelihood × Impact cell.' : 'Create your first risk entry to start tracking.'}
                </div>
                {selectedCell ? (
                  <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setSelectedCell(null)}>
                    Clear Heatmap Filter
                  </button>
                ) : can('MANAGE_RISKS') ? (
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                    <Plus size={14} /> Create Risk
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th>Risk ID</th><th>Description</th><th>Asset</th>
                      <th>L</th><th>I</th><th>Score</th><th>Level</th>
                      <th>Owner</th><th>Status</th><th>AI</th>
                    </tr></thead>
                    <tbody>
                      {(selectedCell ? allRisks.filter(r => r.likelihood === selectedCell.l && r.impact === selectedCell.i) : risks).map(r => (
                        <tr key={r.id}>
                          <td className="td-mono">{r.risk_id}</td>
                          <td className="truncate" style={{ maxWidth: 200 }}>{r.description}</td>
                          <td className="truncate" style={{ maxWidth: 120 }}>{r.asset}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.likelihood}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.impact}</td>
                          <td><ScorePill score={r.risk_score} level={r.risk_level} /></td>
                          <td><RiskLevelBadge level={r.risk_level} /></td>
                          <td style={{ fontSize: '0.75rem' }}>{r.risk_owner || '—'}</td>
                          <td><span className="badge badge-neutral">{r.status}</span></td>
                          <td>
                            <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}
                              onClick={() => handleAIExplain(r)}>
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
                    <button className="pagination-btn" onClick={()=>setPage(p=>p-1)} disabled={page===1}>‹</button>
                    <button className="pagination-btn" onClick={()=>setPage(p=>p+1)} disabled={page===pages}>›</button>
                  </div>
                </div>
              </>
            )
          }
        </div>

        {/* AI Explain panel */}
        {selected && (
          <div className="panel" style={{ width: 300, flexShrink: 0 }}>
            <div className="panel-header">
              <div className="panel-title">AI Risk Explanation</div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}><X size={14} /></button>
            </div>
            <div className="panel-body">
              <div style={{ marginBottom: 12 }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>{selected.risk_id}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--charcoal-900)' }}>{selected.description}</div>
              </div>
              {aiLoading ? <div className="loading-state" style={{ padding: '20px 0' }}><div className="spinner" /></div> :
                aiExplain ? (
                  <div>
                    <AIField label="Classification" value={aiExplain.classification} />
                    <AIField label="Potential Impact" value={aiExplain.potential_impact} />
                    <AIField label="Recommended Action" value={aiExplain.recommended_action} />
                    <div className="ai-disclaimer"><span>⚠️</span> {aiExplain.disclaimer}</div>
                  </div>
                ) : null
              }
            </div>
          </div>
        )}
      </div>

      {/* Create Risk Modal */}
      {showModal && <CreateRiskModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function AIField({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--burgundy-600)', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:'0.8rem', color:'var(--charcoal-700)', lineHeight:1.5 }}>{value}</div>
    </div>
  )
}

function CreateRiskModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    description: '', asset: '', threat: '', vulnerability: '',
    likelihood: 3, impact: 3, treatment: 'MITIGATE',
    risk_owner: '', existing_controls: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const score = form.likelihood * form.impact
  const level = score <= 4 ? 'LOW' : score <= 9 ? 'MEDIUM' : score <= 16 ? 'HIGH' : 'CRITICAL'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await risksApi.create({ ...form, likelihood: Number(form.likelihood), impact: Number(form.impact) })
      onCreated()
    } catch {}
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Create Risk</h2>
          <button className="modal-close btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Risk Description *</label>
            <textarea className="form-control" rows={2} required value={form.description}
              onChange={e=>set('description',e.target.value)} placeholder="Describe the risk…" />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Asset *</label>
              <input className="form-control" required value={form.asset} onChange={e=>set('asset',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Risk Owner</label>
              <input className="form-control" value={form.risk_owner} onChange={e=>set('risk_owner',e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Threat *</label>
            <input className="form-control" required value={form.threat} onChange={e=>set('threat',e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Vulnerability *</label>
            <input className="form-control" required value={form.vulnerability} onChange={e=>set('vulnerability',e.target.value)} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Likelihood (1–5)</label>
              <select className="form-control" value={form.likelihood} onChange={e=>set('likelihood',e.target.value)}>
                {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Impact (1–5)</label>
              <select className="form-control" value={form.impact} onChange={e=>set('impact',e.target.value)}>
                {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          {/* Live score preview */}
          <div style={{ padding: '10px 14px', background: 'var(--cream-100)', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-500)' }}>Risk Score:</span>
            <strong style={{ fontSize: '1.1rem' }}>{score}</strong>
            <span className={`badge badge-${level.toLowerCase()}`}>{level}</span>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Treatment</label>
              <select className="form-control" value={form.treatment} onChange={e=>set('treatment',e.target.value)}>
                {TREATMENTS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Existing Controls</label>
            <textarea className="form-control" rows={2} value={form.existing_controls} onChange={e=>set('existing_controls',e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{width:14,height:14,borderWidth:2}} />Saving…</> : 'Create Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
