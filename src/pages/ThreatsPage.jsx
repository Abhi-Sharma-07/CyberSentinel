import { useEffect, useState } from 'react'
import { eventsApi, threatIntelApi } from '../services/api'
import {
  AlertTriangle,
  Globe,
  ShieldAlert,
  Search,
  FileCode,
  BellRing,
  ExternalLink,
  CheckCircle,
  XCircle,
  Activity,
  Layers,
  Send,
  Zap,
} from 'lucide-react'

export default function ThreatsPage() {
  const [activeTab, setActiveTab] = useState('detections') // 'detections' | 'intel' | 'virustotal' | 'webhooks'
  const [threats, setThreats] = useState([])
  const [loading, setLoading] = useState(true)

  // Status of external integrations
  const [status, setStatus] = useState(null)

  // IP Lookup state
  const [ipQuery, setIpQuery] = useState('')
  const [ipResult, setIpResult] = useState(null)
  const [ipLoading, setIpLoading] = useState(false)
  const [ipError, setIpError] = useState(null)

  // Hash Lookup state
  const [hashQuery, setHashQuery] = useState('')
  const [hashResult, setHashResult] = useState(null)
  const [hashLoading, setHashLoading] = useState(false)
  const [hashError, setHashError] = useState(null)

  // Webhook Test state
  const [webhookTesting, setWebhookTesting] = useState(false)
  const [webhookResponse, setWebhookResponse] = useState(null)
  const [webhookMsg, setWebhookMsg] = useState('')

  // Quick Modal for inspecting IP directly from table
  const [selectedIp, setSelectedIp] = useState(null)

  useEffect(() => {
    // Fetch high/critical events
    eventsApi.list({ page: 1, page_size: 100, severity: 'HIGH' })
      .then(r => setThreats(r.data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    // Fetch integrations status
    threatIntelApi.getStatus()
      .then(r => setStatus(r.data))
      .catch(() => {})
  }, [])

  const handleIpSearch = async (ipToSearch) => {
    const target = (ipToSearch || ipQuery).trim()
    if (!target) return
    setIpLoading(true)
    setIpError(null)
    try {
      const res = await threatIntelApi.lookupIp(target)
      setIpResult(res.data)
      if (ipToSearch) {
        setSelectedIp(res.data)
      }
    } catch (err) {
      setIpError(err.response?.data?.detail || 'Failed to query threat intelligence')
    } finally {
      setIpLoading(false)
    }
  }

  const handleHashSearch = async () => {
    if (!hashQuery.trim()) return
    setHashLoading(true)
    setHashError(null)
    try {
      const res = await threatIntelApi.lookupHash(hashQuery.trim())
      setHashResult(res.data)
    } catch (err) {
      setHashError(err.response?.data?.detail || 'Failed to scan payload hash on VirusTotal')
    } finally {
      setHashLoading(false)
    }
  }

  const handleWebhookTest = async () => {
    setWebhookTesting(true)
    setWebhookResponse(null)
    try {
      const res = await threatIntelApi.testWebhook({
        custom_message: webhookMsg || undefined,
      })
      setWebhookResponse(res.data)
    } catch (err) {
      setWebhookResponse({ error: err.response?.data?.detail || 'Webhook test failed' })
    } finally {
      setWebhookTesting(false)
    }
  }

  return (
    <div className="animate-fade-in-up" style={{ paddingBottom: '3rem' }}>
      {/* Hero Header */}
      <div className="page-hero">
        <div className="page-hero-watermark">THR</div>
        <div className="page-hero-eyebrow">Threat Detection & Intelligence Subsystem</div>
        <h1 className="page-hero-title">Threat Intel & Integrations</h1>
        <p className="page-hero-sub">
          Deterministic threat detection engine augmented with AbuseIPDB IP reputation,
          IP-API Geolocation, VirusTotal payload intelligence, and real-time SOC alerting.
        </p>
      </div>

      {/* Integration Status Bar */}
      {status && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {Object.entries(status).map(([key, item]) => (
            <div
              key={key}
              className="panel"
              style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem', background: 'var(--color-surface, #1e293b)' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: item.configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                  color: item.configured ? '#10b981' : '#94a3b8',
                }}
              >
                {item.configured ? <CheckCircle size={18} /> : <Activity size={18} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text, #f8fafc)', textTransform: 'capitalize' }}>
                  {key.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '0.7rem', color: item.configured ? '#10b981' : '#94a3b8' }}>
                  {item.configured ? 'Active & Linked' : 'Simulated / Ready'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border, #334155)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('detections')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'detections' ? '2px solid var(--color-primary, #6366f1)' : '2px solid transparent',
            color: activeTab === 'detections' ? 'var(--color-primary, #6366f1)' : 'var(--color-text-muted, #94a3b8)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <ShieldAlert size={16} /> Detections & Alerts ({threats.length})
        </button>
        <button
          onClick={() => setActiveTab('intel')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'intel' ? '2px solid var(--color-primary, #6366f1)' : '2px solid transparent',
            color: activeTab === 'intel' ? 'var(--color-primary, #6366f1)' : 'var(--color-text-muted, #94a3b8)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Globe size={16} /> IP Intel & Geolocation (AbuseIPDB)
        </button>
        <button
          onClick={() => setActiveTab('virustotal')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'virustotal' ? '2px solid var(--color-primary, #6366f1)' : '2px solid transparent',
            color: activeTab === 'virustotal' ? 'var(--color-primary, #6366f1)' : 'var(--color-text-muted, #94a3b8)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <FileCode size={16} /> VirusTotal Hash Scanner
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'webhooks' ? '2px solid var(--color-primary, #6366f1)' : '2px solid transparent',
            color: activeTab === 'webhooks' ? 'var(--color-primary, #6366f1)' : 'var(--color-text-muted, #94a3b8)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <BellRing size={16} /> Webhook & SOC Alerts
        </button>
      </div>

      {/* TAB 1: DETECTIONS */}
      {activeTab === 'detections' && (
        <div>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Deterministic Engine Detections</div>
              <span className="badge badge-critical">{threats.length} High+ Events</span>
            </div>
            {loading ? (
              <div className="loading-state"><div className="spinner" /></div>
            ) : threats.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><AlertTriangle size={22} /></div>
                <div className="empty-state-title">No threat detections</div>
                <div className="empty-state-text">The honeypot has not generated any high-severity events yet.</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Event ID</th>
                      <th>Time</th>
                      <th>Source (Pseudonym)</th>
                      <th>Type</th>
                      <th>Protocol</th>
                      <th>Severity</th>
                      <th>Risk Score</th>
                      <th>Command</th>
                      <th>Intel Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {threats.map((t) => (
                      <tr key={t.id}>
                        <td className="td-mono" style={{ fontSize: '0.7rem' }}>{t.event_id}</td>
                        <td className="td-mono">{new Date(t.timestamp).toLocaleString()}</td>
                        <td className="td-mono">{t.source_ip_pseudonym}</td>
                        <td><span className="badge badge-high">{t.event_type}</span></td>
                        <td style={{ fontSize: '0.75rem' }}>{t.protocol}</td>
                        <td><span className="badge badge-critical">{t.severity}</span></td>
                        <td><strong style={{ color: 'var(--color-critical)' }}>{t.risk_score}</strong></td>
                        <td className="td-mono truncate" style={{ maxWidth: 180 }}>{t.command || '—'}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            onClick={() => {
                              handleIpSearch(t.source_ip_pseudonym)
                              setActiveTab('intel')
                              setIpQuery(t.source_ip_pseudonym)
                            }}
                          >
                            <Globe size={12} /> Lookup Intel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IP INTEL & GEOLOCATION */}
      {activeTab === 'intel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
              Live IP Reputation & Geolocation Check (AbuseIPDB & IP-API)
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Query any public IPv4/IPv6 address or honeypot attacker pseudonym to inspect abuse confidence scores,
              associated autonomous systems (ASN), ISP, and geographical origin.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleIpSearch()
              }}
              style={{ display: 'flex', gap: '0.75rem', maxWidth: '600px' }}
            >
              <input
                type="text"
                className="input"
                placeholder="e.g. 185.220.101.5 or pseudo_a9f82d1c"
                value={ipQuery}
                onChange={(e) => setIpQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={ipLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {ipLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Search size={16} />}
                Search Intel
              </button>
            </form>

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Sample Queries:</span>
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: '0.75rem', cursor: 'pointer', background: 'none', border: 'none', color: '#6366f1' }}
                onClick={() => {
                  setIpQuery('185.220.101.5')
                  handleIpSearch('185.220.101.5')
                }}
              >
                185.220.101.5 (Tor Exit)
              </button>
              •
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: '0.75rem', cursor: 'pointer', background: 'none', border: 'none', color: '#6366f1' }}
                onClick={() => {
                  setIpQuery('45.155.205.233')
                  handleIpSearch('45.155.205.233')
                }}
              >
                45.155.205.233 (Scanner)
              </button>
              •
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: '0.75rem', cursor: 'pointer', background: 'none', border: 'none', color: '#6366f1' }}
                onClick={() => {
                  setIpQuery('1.1.1.1')
                  handleIpSearch('1.1.1.1')
                }}
              >
                1.1.1.1 (Cloudflare DNS)
              </button>
            </div>

            {ipError && (
              <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
                <AlertTriangle size={16} /> {ipError}
              </div>
            )}
          </div>

          {/* Results Display */}
          {ipResult && (
            <div className="panel" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'monospace' }}>
                    {ipResult.ip}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {ipResult.is_simulated ? 'Generated threat correlation profile' : 'Real-time Live API verified intelligence'}
                    {ipResult.cached && ' • (Loaded from cache)'}
                  </span>
                </div>
                <span className={`badge badge-${ipResult.threat_level?.toLowerCase() || 'high'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                  {ipResult.threat_level} THREAT ({ipResult.abuse_score}% Abuse Score)
                </span>
              </div>

              {/* Progress bar for abuse score */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <span>Abuse Confidence Score</span>
                  <strong>{ipResult.abuse_score} / 100</strong>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${ipResult.abuse_score}%`,
                      height: '100%',
                      background: ipResult.abuse_score > 75 ? '#e11d48' : ipResult.abuse_score > 40 ? '#ea580c' : '#10b981',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Location / Origin</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>
                    {ipResult.city}, {ipResult.country} ({ipResult.country_code})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Lat: {ipResult.latitude}, Lon: {ipResult.longitude}
                  </div>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Autonomous System / ISP</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>
                    {ipResult.asn}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    {ipResult.isp}
                  </div>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Abuse Reports Count</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem', color: ipResult.total_reports > 0 ? '#ea580c' : '#10b981' }}>
                    {ipResult.total_reports} distinct reports
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Usage: {ipResult.usage_type}
                  </div>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Hostname / Domain</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.25rem', wordBreak: 'break-all' }}>
                    {ipResult.domain || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Last Reported: {ipResult.last_reported_at}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VIRUSTOTAL HASH SCANNER */}
      {activeTab === 'virustotal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
              VirusTotal Malware & File Hash Inspection
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Check binary artifacts, downloaded scripts, and exploit payloads captured in Cowrie honeypot sessions
              against 70+ antivirus engines.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleHashSearch()
              }}
              style={{ display: 'flex', gap: '0.75rem', maxWidth: '650px' }}
            >
              <input
                type="text"
                className="input"
                placeholder="Enter MD5, SHA-1, or SHA-256 hash (e.g. 44d88612fea8a8f36de82e1278abb02f)"
                value={hashQuery}
                onChange={(e) => setHashQuery(e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={hashLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {hashLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Zap size={16} />}
                Analyze Hash
              </button>
            </form>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Known Payload Hashes:</span>
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: '0.75rem', cursor: 'pointer', background: 'none', border: 'none', color: '#6366f1' }}
                onClick={() => {
                  setHashQuery('44d88612fea8a8f36de82e1278abb02f')
                  setHashLoading(true)
                  threatIntelApi.lookupHash('44d88612fea8a8f36de82e1278abb02f')
                    .then(r => setHashResult(r.data))
                    .finally(() => setHashLoading(false))
                }}
              >
                EICAR Test String (MD5)
              </button>
              •
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: '0.75rem', cursor: 'pointer', background: 'none', border: 'none', color: '#6366f1' }}
                onClick={() => {
                  setHashQuery('a3a290875b87c71fb2c6576b2c286d9a')
                  setHashLoading(true)
                  threatIntelApi.lookupHash('a3a290875b87c71fb2c6576b2c286d9a')
                    .then(r => setHashResult(r.data))
                    .finally(() => setHashLoading(false))
                }}
              >
                Mirai Dropper (MD5)
              </button>
            </div>

            {hashError && (
              <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
                <AlertTriangle size={16} /> {hashError}
              </div>
            )}
          </div>

          {hashResult && (
            <div className="panel" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'monospace' }}>
                    {hashResult.hash}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Threat Identification: {hashResult.threat_name}
                  </span>
                </div>
                <span
                  className={`badge badge-${hashResult.positives > 0 ? 'critical' : 'low'}`}
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                >
                  {hashResult.positives} / {hashResult.total_scanners || 72} Detections
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Malware Family / Name</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.25rem', color: hashResult.positives > 0 ? '#e11d48' : '#10b981' }}>
                    {hashResult.threat_name}
                  </div>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Category</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.25rem' }}>
                    {hashResult.threat_category}
                  </div>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Community Reputation</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.25rem' }}>
                    {hashResult.reputation || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WEBHOOK & SOC ALERTS */}
      {activeTab === 'webhooks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
              SOC Real-Time Alerting (Slack & Discord Webhooks)
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Dispatch honeypot intrusion triggers and high-risk GRC alerts directly to your Security Operations Center
              channels.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <BellRing size={18} color="#6366f1" />
                  <strong>Slack Channel Integration</strong>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                  Configure <code>SLACK_WEBHOOK_URL</code> in <code>.env</code> to receive rich cards with severity highlights and event IDs.
                </p>
                <span className={`badge badge-${status?.slack_webhook?.configured ? 'low' : 'medium'}`}>
                  {status?.slack_webhook?.configured ? 'Configured & Active' : 'Not configured in .env'}
                </span>
              </div>

              <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <BellRing size={18} color="#5865F2" />
                  <strong>Discord Channel Integration</strong>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                  Configure <code>DISCORD_WEBHOOK_URL</code> in <code>.env</code> to broadcast real-time honeypot traps to Discord servers.
                </p>
                <span className={`badge badge-${status?.discord_webhook?.configured ? 'low' : 'medium'}`}>
                  {status?.discord_webhook?.configured ? 'Configured & Active' : 'Not configured in .env'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>Test Dispatch Webhook Alert</h4>
              <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '600px' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Custom alert message (optional)..."
                  value={webhookMsg}
                  onChange={(e) => setWebhookMsg(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleWebhookTest}
                  disabled={webhookTesting}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {webhookTesting ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Send size={16} />}
                  Send Test Alert
                </button>
              </div>

              {webhookResponse && (
                <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#090d16', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: webhookResponse.error ? '#f43f5e' : (webhookResponse.status === 'dispatched' ? '#10b981' : '#f59e0b'),
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: webhookResponse.error ? '#f43f5e' : (webhookResponse.status === 'dispatched' ? '#10b981' : '#f59e0b')
                      }} />
                      {webhookResponse.error ? 'Dispatch Error' : (webhookResponse.status === 'dispatched' ? 'Alert Broadcast Sent' : 'Webhooks Not Configured')}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {webhookResponse.message}
                    </span>
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: '0.85rem',
                    background: '#020617',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: '#38bdf8',
                    fontFamily: 'Consolas, Monaco, monospace',
                    overflowX: 'auto',
                    border: '1px solid #1e293b',
                    lineHeight: 1.5,
                  }}>
                    {JSON.stringify(webhookResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
