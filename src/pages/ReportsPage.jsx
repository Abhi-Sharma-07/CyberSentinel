import { useState } from 'react'
import { reportsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FileText, Download, AlertCircle, CheckCircle2, Lock } from 'lucide-react'

const REPORTS = [
  { id:'events', label:'Security Event Report', desc:'All honeypot security events (privacy-processed)', endpoint:'downloadEvents', color:'high' },
  { id:'risks', label:'Risk Register Report', desc:'Complete GRC risk register with scores and treatment', endpoint:'downloadRisks', color:'critical' },
  { id:'compliance', label:'Compliance Gap Report', desc:'Framework gap assessments (reference mappings only)', endpoint:'downloadCompliance', color:'medium' },
  { id:'incidents', label:'Incident Report', desc:'Incident lifecycle and resolution records', endpoint:'downloadIncidents', color:'high' },
  { id:'privacy', label:'Privacy Assessment Report', desc:'DPDP/GDPR gap assessment (educational reference)', endpoint:'downloadPrivacy', color:'gold' },
]

export default function ReportsPage() {
  const { user, can } = useAuth()
  const [downloading, setDownloading] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleDownload = async (report) => {
    try {
      setDownloading(report.id)
      setError(null)
      setSuccess(null)

      const response = await reportsApi[report.endpoint]()
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.id}_report_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setSuccess(`Downloaded ${report.label} successfully!`)
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      console.error('Download error:', err)
      const detail = err.response?.data?.detail || 'Please check your permissions or try again.'
      setError(`Failed to download ${report.label}: ${detail}`)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-hero">
        <div className="page-hero-watermark">RPT</div>
        <div className="page-hero-eyebrow">Data Export</div>
        <h1 className="page-hero-title">Reports & Exports</h1>
        <p className="page-hero-sub">
          Download security, risk, compliance, and privacy reports in CSV format.
          PDF generation requires WeasyPrint on the server.
          <strong> Export permission required.</strong>
        </p>
        <div className="page-hero-actions">
          {!can('EXPORT_REPORTS') && (
            <span className="badge badge-neutral" style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Lock size={13} /> Export Restricted ({user?.role?.replace(/_/g, ' ') || 'VIEWER'})
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:20, marginBottom:32 }}>
        {REPORTS.map(r => (
          <div key={r.id} className={`metric-card ${r.color}`}
            style={{ cursor:'default', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:'auto' }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'var(--cream-100)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <FileText size={18} style={{ color:'var(--burgundy-600)' }} />
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:'1rem', fontWeight:600, color:'var(--charcoal-900)', marginBottom:4 }}>{r.label}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--charcoal-500)', lineHeight:1.5 }}>{r.desc}</div>
              </div>
            </div>
            {can('EXPORT_REPORTS') ? (
              <button
                id={`download-${r.id}-btn`}
                className="btn btn-primary"
                style={{ marginTop:16, justifyContent:'center' }}
                disabled={downloading === r.id}
                onClick={() => handleDownload(r)}
              >
                {downloading === r.id ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    Downloading…
                  </>
                ) : (
                  <>
                    <Download size={14} /> Download CSV
                  </>
                )}
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                style={{ marginTop:16, justifyContent:'center', opacity: 0.6, cursor: 'not-allowed' }}
                disabled
                title="Export requires EXPORT_REPORTS permission"
              >
                <Lock size={13} /> Export Restricted
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Report Notes</div>
        </div>
        <div className="panel-body">
          <ul style={{ paddingLeft:20, display:'grid', gap:8 }}>
            <li style={{ fontSize:'0.82rem', color:'var(--charcoal-700)' }}>
              Security event reports contain <strong>pseudonymized</strong> source IPs only — no raw IP addresses.
            </li>
            <li style={{ fontSize:'0.82rem', color:'var(--charcoal-700)' }}>
              Compliance gap reports are <strong>reference assessments</strong> only — not legal compliance determinations.
            </li>
            <li style={{ fontSize:'0.82rem', color:'var(--charcoal-700)' }}>
              Privacy assessments are for <strong>educational/assessment purposes</strong> only — not legal advice.
            </li>
            <li style={{ fontSize:'0.82rem', color:'var(--charcoal-700)' }}>
              Exports are access-controlled. Only users with <strong>EXPORT_REPORTS</strong> permission can download.
            </li>
            <li style={{ fontSize:'0.82rem', color:'var(--charcoal-700)' }}>
              All exports are logged in the application audit log.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
