import { Link } from 'react-router-dom'
import { Shield, ShieldAlert, Cpu, Lock, FileText, CheckCircle2, Globe, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="global-platform-footer" style={{
      background: 'var(--charcoal-900, #131210)',
      color: 'var(--charcoal-300, #a8a49c)',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      marginTop: 'auto',
      padding: '48px 0 24px',
      fontSize: '0.85rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '36px',
          marginBottom: '36px'
        }}>
          {/* Col 1: Platform Brand & Telemetry */}
          <div style={{ maxWidth: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--burgundy-600, #8b1a2f)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Shield size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--cream-100, #f7f5f0)', letterSpacing: '0.02em' }}>
                  CYBER SENTINEL
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--charcoal-400, #736f68)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Cyber Defense Platform
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--charcoal-400, #736f68)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
              Integrated Deception Telemetry, AbuseIPDB Threat Intel, and Automated Enterprise Cyber Sentinel Risk Governance.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#10b981' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
              <span>Honeypot Sensors & Privacy Filter Online</span>
            </div>
          </div>

          {/* Col 2: Telemetry & Detection */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--cream-100, #f7f5f0)', marginBottom: '14px' }}>
              Security & Telemetry
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
              <li>
                <Link to="/dashboard" style={{ color: 'var(--charcoal-400, #736f68)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='var(--charcoal-400)'}>
                  Security Command Dashboard
                </Link>
              </li>
              <li>
                <Link to="/events" style={{ color: 'var(--charcoal-400, #736f68)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='var(--charcoal-400)'}>
                  Honeypot Raw Events
                </Link>
              </li>
              <li>
                <Link to="/threats" style={{ color: 'var(--charcoal-400, #736f68)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='var(--charcoal-400)'}>
                  Threat Intel & AbuseIPDB Hub
                </Link>
              </li>
              <li>
                <Link to="/incidents" style={{ color: 'var(--charcoal-400, #736f68)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='var(--charcoal-400)'}>
                  Incident Response Triage
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: GRC & Governance */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--cream-100, #f7f5f0)', marginBottom: '14px' }}>
              GRC & Compliance
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
              <li>
                <Link to="/risks" style={{ color: 'var(--charcoal-400, #736f68)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='var(--charcoal-400)'}>
                  Enterprise Risk Register
                </Link>
              </li>
              <li>
                <Link to="/controls" style={{ color: 'var(--charcoal-400, #736f68)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='var(--charcoal-400)'}>
                  Security Controls (NIST/ISO)
                </Link>
              </li>
              <li>
                <Link to="/compliance" style={{ color: 'var(--charcoal-400, #736f68)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='var(--charcoal-400)'}>
                  Compliance Assessments
                </Link>
              </li>
              <li>
                <Link to="/privacy" style={{ color: 'var(--charcoal-400, #736f68)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='var(--charcoal-400)'}>
                  DPDP Act 2023 & GDPR Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Intelligence & Analytics */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--cream-100, #f7f5f0)', marginBottom: '14px' }}>
              AI & Evidence
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
              <li>
                <Link to="/ai" style={{ color: 'var(--charcoal-400, #736f68)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='var(--charcoal-400)'}>
                  AI Threat Advisory (Gemini)
                </Link>
              </li>
              <li>
                <Link to="/evidence" style={{ color: 'var(--charcoal-400, #736f68)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='var(--charcoal-400)'}>
                  Evidence Vault & Audit Logs
                </Link>
              </li>
              <li>
                <Link to="/reports" style={{ color: 'var(--charcoal-400, #736f68)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='var(--charcoal-400)'}>
                  Executive CSV & Report Export
                </Link>
              </li>
              <li>
                <Link to="/inventory" style={{ color: 'var(--charcoal-400, #736f68)', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color='#fff'} onMouseLeave={e => e.target.style.color='var(--charcoal-400)'}>
                  Asset & Data Inventory
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '0.75rem',
          color: 'var(--charcoal-400, #736f68)'
        }}>
          <div>
            © {new Date().getFullYear()} Cyber Sentinel Security Platform. Defensive cybersecurity monitoring & governance.
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
              ISO 27001:2022
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
              NIST CSF 2.0
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
              SOC 2 Type II
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
              DPDP Act 2023
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
