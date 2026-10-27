import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Shield, BarChart2, Activity, AlertTriangle, FileText,
  CheckSquare, ClipboardList, Archive, Lock, Database,
  Cpu, Eye, ArrowRight, CheckCircle2, Server, Zap, Globe,
  Terminal, ShieldCheck, ChevronRight, Sparkles
} from 'lucide-react'

export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('threats')

  const stats = [
    { value: '100%', label: 'Deterministic Detection', sub: 'Zero AI hallucinations in core alerts' },
    { value: '4+',   label: 'GRC Frameworks', sub: 'ISO 27001 · SOC 2 · GDPR · DPDP 2023' },
    { value: '<5ms', label: 'Telemetry Processing', sub: 'Real-time honeypot ingestion' },
    { value: '24/7', label: 'Decoy Monitoring', sub: 'Automated threat categorization' },
  ]

  const pillars = [
    {
      icon: Activity,
      tag: 'Decoy Defense',
      title: 'Honeypot Threat Telemetry',
      desc: 'Deploy low-interaction decoy services across SSH, HTTP, and API endpoints. Capture adversary techniques, payload signatures, and reconnaissance attempts in real-time.',
      link: '/events',
      features: ['Automated IP Geolocation', 'Payload Capture & Privacy Sanitization', 'High-Fidelity Signal without Noise']
    },
    {
      icon: AlertTriangle,
      tag: 'Detection Engine',
      title: 'Deterministic Threat Rules',
      desc: 'Correlate attacker behavior with strict signature and behavioral rules. Trigger automated incident lifecycles without relying on black-box probabilistic models.',
      link: '/threats',
      features: ['Brute-force detection', 'Command Injection parsing', 'Zero-trust incident triage']
    },
    {
      icon: CheckSquare,
      tag: 'Governance & Risk',
      title: 'Unified GRC Register',
      desc: 'Map live security signals directly to compliance controls. Maintain risk registers, audit evidence vaults, and framework gap assessments in one single pane of glass.',
      link: '/controls',
      features: ['ISO 27001:2022 & SOC 2 mapping', 'DPDP Act 2023 & GDPR compliance', 'Continuous audit readiness']
    },
    {
      icon: Cpu,
      tag: 'AI Advisory',
      title: 'Gemini Security Copilot',
      desc: 'Leverage Google Gemini for assistive analyst support. Summarize complex threat vectors, draft remediation playbooks, and accelerate compliance reviews.',
      link: '/ai',
      features: ['Advisory-only safety guardrails', 'Context-aware threat summaries', 'Automated evidence review']
    }
  ]

  const frameworks = [
    { name: 'ISO/IEC 27001:2022', desc: 'Information Security Management System', badge: 'ISMS Standard', link: '/controls' },
    { name: 'SOC 2 Type II', desc: 'Trust Services Criteria for Security & Privacy', badge: 'AICPA Standard', link: '/controls' },
    { name: 'DPDP Act 2023', desc: 'Digital Personal Data Protection Act (India)', badge: 'Privacy Regulation', link: '/privacy' },
    { name: 'GDPR (EU 2016/679)', desc: 'General Data Protection Regulation', badge: 'Global Privacy', link: '/privacy' },
  ]

  return (
    <div className="landing-page-wrapper">
      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-container">
          <div className="landing-hero-banner animate-fade-in-up">
            <div className="landing-hero-watermark">GRC</div>
            
            <div className="landing-hero-content">
              <div className="landing-badge-pill">
                <span className="live-dot" />
                <span>Enterprise Threat Intelligence & GRC Platform</span>
              </div>

              <h1 className="landing-hero-title">
                Continuous Governance & Risk <br />
                <span className="text-gradient">Meets Real-Time Threat Deception</span>
              </h1>

              <p className="landing-hero-subtitle">
                Cyber Sentinel delivers an all-in-one security and compliance command center. 
                Trap adversary attacks with decoy honeypot sensors, calculate quantitative risk scores, and automate continuous audit evidence across ISO 27001, SOC 2, and DPDP 2023.
              </p>

              <div className="landing-cta-group">
                {user ? (
                  <NavLink to="/dashboard" className="btn btn-primary btn-lg">
                    <BarChart2 size={18} />
                    <span>Go to GRC Dashboard</span>
                    <ArrowRight size={16} />
                  </NavLink>
                ) : (
                  <>
                    <NavLink to="/signup" className="btn btn-primary btn-lg">
                      <Shield size={18} />
                      <span>Start Free Security Access</span>
                      <ArrowRight size={16} />
                    </NavLink>
                    <NavLink to="/login" className="btn btn-secondary btn-lg">
                      <span>Sign In</span>
                    </NavLink>
                  </>
                )}
                <NavLink to="/events" className="btn btn-ghost btn-lg">
                  <Activity size={18} />
                  <span>Explore Live Telemetry</span>
                </NavLink>
              </div>
            </div>
          </div>

          {/* Interactive Platform Mockup / Hero Showcase */}
          <div className="landing-showcase-card animate-fade-in-up">
            <div className="showcase-window-bar">
              <div className="window-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="window-address">
                <Shield size={12} style={{ color: 'var(--burgundy-600)' }} />
                <span>cyber-sentinel.enterprise.internal / security-console</span>
              </div>
              <div className="window-status">
                <span className="live-dot" /> Honeypot Nodes Active
              </div>
            </div>

            <div className="showcase-content-grid">
              {/* Left Column: Live Detection Feed */}
              <div className="showcase-panel">
                <div className="showcase-panel-header">
                  <span className="showcase-title"><Activity size={14} /> Live Honeypot Threat Stream</span>
                  <span className="badge badge-low">STREAMING</span>
                </div>
                <div className="showcase-event-list">
                  <div className="showcase-event-row critical">
                    <span className="event-pill crit">CRITICAL</span>
                    <div className="event-info">
                      <div className="event-name">SSH Brute-Force Authentication Attempt</div>
                      <div className="event-meta">IP: 198.51.100.42 · Port: 22 · Decoy Node: SSH-Trap-01</div>
                    </div>
                    <span className="event-time">2s ago</span>
                  </div>

                  <div className="showcase-event-row high">
                    <span className="event-pill high">HIGH</span>
                    <div className="event-info">
                      <div className="event-name">Web Application SQL Injection Probe</div>
                      <div className="event-meta">Payload: UNION SELECT · Target: /api/v1/auth · Decoy-Web</div>
                    </div>
                    <span className="event-time">14s ago</span>
                  </div>

                  <div className="showcase-event-row med">
                    <span className="event-pill med">MEDIUM</span>
                    <div className="event-info">
                      <div className="event-name">TCP Port Reconnaissance Scan</div>
                      <div className="event-meta">Ports scanned: 21, 22, 80, 443, 8080, 3306</div>
                    </div>
                    <span className="event-time">48s ago</span>
                  </div>
                </div>
              </div>

              {/* Right Column: GRC Compliance Mapping */}
              <div className="showcase-panel">
                <div className="showcase-panel-header">
                  <span className="showcase-title"><CheckSquare size={14} /> Automated Control Compliance</span>
                  <span className="badge badge-gold">ISO 27001 & SOC 2</span>
                </div>
                <div className="showcase-control-list">
                  <div className="showcase-control-item">
                    <div className="control-header-row">
                      <span className="control-id">A.12.4.1</span>
                      <span className="control-name">Event Logging & Telemetry Retention</span>
                      <CheckCircle2 size={16} className="text-low" />
                    </div>
                    <div className="compliance-bar"><div className="compliance-bar-fill compliant" style={{ width: '100%' }} /></div>
                  </div>

                  <div className="showcase-control-item">
                    <div className="control-header-row">
                      <span className="control-id">CC7.2</span>
                      <span className="control-name">Security Anomaly & Intrusion Detection</span>
                      <CheckCircle2 size={16} className="text-low" />
                    </div>
                    <div className="compliance-bar"><div className="compliance-bar-fill compliant" style={{ width: '92%' }} /></div>
                  </div>

                  <div className="showcase-control-item">
                    <div className="control-header-row">
                      <span className="control-id">DPDP-S8</span>
                      <span className="control-name">Data Breach Prevention & Notice Mandate</span>
                      <CheckCircle2 size={16} className="text-low" />
                    </div>
                    <div className="compliance-bar"><div className="compliance-bar-fill compliant" style={{ width: '96%' }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="landing-stats-section">
        <div className="landing-container">
          <div className="landing-stats-grid">
            {stats.map((st, i) => (
              <div key={i} className="stat-card">
                <div className="stat-card-value">{st.value}</div>
                <div className="stat-card-label">{st.label}</div>
                <div className="stat-card-sub">{st.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Platform Modules / Pillars */}
      <section className="landing-pillars-section">
        <div className="landing-container">
          <div className="section-header-center">
            <span className="eyebrow">Enterprise Architecture</span>
            <h2 className="section-title">Four Pillars of Proactive Cyber Defense</h2>
            <p className="section-subtitle">
              From the decoy perimeter down to board-ready compliance reports, Cyber Sentinel automates the complete security lifecycle.
            </p>
          </div>

          <div className="pillars-grid">
            {pillars.map((p, idx) => {
              const PIcon = p.icon
              return (
                <div key={idx} className="pillar-card">
                  <div className="pillar-header">
                    <div className="pillar-icon-box">
                      <PIcon size={22} />
                    </div>
                    <span className="pillar-tag">{p.tag}</span>
                  </div>
                  <h3 className="pillar-title">{p.title}</h3>
                  <p className="pillar-desc">{p.desc}</p>
                  <ul className="pillar-feature-list">
                    {p.features.map((feat, fidx) => (
                      <li key={fidx}>
                        <CheckCircle2 size={14} className="text-accent" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <NavLink to={p.link} className="pillar-link">
                    <span>Explore Module</span>
                    <ChevronRight size={14} />
                  </NavLink>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Compliance Frameworks Section */}
      <section className="landing-frameworks-section">
        <div className="landing-container">
          <div className="section-header-center">
            <span className="eyebrow">Governance & Compliance</span>
            <h2 className="section-title">Pre-Mapped to Global & Regional Standards</h2>
            <p className="section-subtitle">
              Continuous control assessment and evidence gathering tailored for major certification audits.
            </p>
          </div>

          <div className="frameworks-grid">
            {frameworks.map((fw, idx) => (
              <NavLink key={idx} to={fw.link} className="framework-card">
                <div className="framework-badge">{fw.badge}</div>
                <h4 className="framework-title">{fw.name}</h4>
                <p className="framework-desc">{fw.desc}</p>
                <div className="framework-footer">
                  <div className="framework-status">
                    <ShieldCheck size={16} className="text-low" />
                    <span>Audit-ready control mappings</span>
                  </div>
                  <ChevronRight size={15} className="framework-arrow" />
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      {/* AI Advisory Banner */}
      <section className="landing-ai-section">
        <div className="landing-container">
          <div className="ai-feature-card">
            <div className="ai-card-content">
              <div className="ai-badge">
                <Sparkles size={14} />
                <span>Google Gemini AI Integration</span>
              </div>
              <h2 className="ai-card-title">Intelligent Security Advisory, Grounded in Deterministic Truth.</h2>
              <p className="ai-card-desc">
                AI in Cyber Sentinel acts as an advisor to your SOC analysts and GRC officers. It assists in incident root-cause analysis, drafting compliance mitigation plans, and control recommendations without taking automated unverified actions.
              </p>
              <div className="ai-card-actions">
                <NavLink to="/ai" className="btn btn-primary">
                  <Cpu size={16} />
                  <span>Test AI Analysis Copilot</span>
                </NavLink>
                <NavLink to="/evidence" className="btn btn-secondary">
                  <Archive size={16} />
                  <span>View Audit Vault</span>
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="landing-cta-section">
        <div className="landing-container">
          <div className="cta-box">
            <h2 className="cta-title">Ready to Fortify Your Cyber Defense & Governance?</h2>
            <p className="cta-subtitle">
              Deploy honeypot telemetry, automate compliance control audits, and gain unmatched visibility in minutes.
            </p>
            <div className="cta-actions">
              <NavLink to="/signup" className="btn btn-primary btn-lg">
                <span>Create Free Account</span>
                <ArrowRight size={16} />
              </NavLink>
              <NavLink to="/dashboard" className="btn btn-secondary btn-lg">
                <span>Enter Platform</span>
              </NavLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
