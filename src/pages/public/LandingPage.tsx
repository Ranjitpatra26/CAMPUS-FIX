import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/complaints/StatusBadge';
import { PriorityBadge } from '../../components/complaints/PriorityBadge';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  ShieldCheck,
  Building2,
  BarChart3,
  Users,
  FileText,
  Sun,
  Moon,
  Menu,
  X,
  GraduationCap,
  ShieldAlert,
  Inbox,
  Eye,
  Check,
  TrendingUp,
  UploadCloud,
  UserCheck,
  FileCheck
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'student' | 'admin'>('student');
  const [campusStats] = useState({
    total: 16,
    resolved: 5,
    inProgress: 6,
    critical: 4,
    departments: 8,
    avgSla: '4.2h'
  });

  const handlePortalNavigation = () => {
    if (user) {
      navigate(role === 'admin' ? '/admin' : '/student');
    } else {
      navigate('/login');
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* ==================================================
          PUBLIC NAVBAR
          ================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          backgroundColor: 'var(--bg-surface)',
          borderBottom: 'var(--border-width) solid var(--border-color)',
          height: 'var(--navbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(1rem, 3vw, 2rem)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <BrandLogo size="md" showTagline={false} />
          </div>

          <nav style={{ display: 'none', alignItems: 'center', gap: '1.5rem' }} className="lg:flex">
            <button
              onClick={() => scrollToSection('hero')}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('benefits')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Why CampusFix
            </button>
            <button
              onClick={() => scrollToSection('preview')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Preview
            </button>
            <button
              onClick={() => scrollToSection('metrics')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Metrics
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="neo-btn neo-btn-secondary neo-btn-sm"
            style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>

          {/* Authenticated / Guest Actions */}
          {user ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(role === 'admin' ? '/admin' : '/student')}
              rightIcon={<ArrowRight size={14} />}
            >
              <span>Dashboard ({role.toUpperCase()})</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Sign In with SSO
            </Button>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="neo-btn neo-btn-secondary neo-btn-sm flex lg:hidden"
            style={{ padding: '0.45rem', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="neo-card animate-fade-up lg:hidden"
          style={{
            position: 'fixed',
            top: 'calc(var(--navbar-height) + 8px)',
            left: '1rem',
            right: '1rem',
            zIndex: 100,
            padding: '1.25rem',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-offset-lg)'
          }}
        >
          <button
            onClick={() => scrollToSection('hero')}
            style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('features')}
            style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('benefits')}
            style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            Why CampusFix
          </button>
          <button
            onClick={() => scrollToSection('preview')}
            style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            Dashboard Preview
          </button>
          <button
            onClick={() => scrollToSection('metrics')}
            style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            Campus Metrics
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', paddingTop: '0.75rem', borderTop: '1.5px solid var(--border-subtle)' }}>
            <Button variant="secondary" size="sm" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" onClick={() => { setMobileMenuOpen(false); handlePortalNavigation(); }}>
              Open Portal
            </Button>
          </div>
        </div>
      )}

      {/* ==================================================
          SECTION 1: HERO SECTION
          ================================================== */}
      <section
        id="hero"
        style={{
          padding: 'clamp(2.5rem, 5vw, 4.5rem) clamp(1rem, 3.5vw, 2rem)',
          maxWidth: '1360px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div
          className="hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 'clamp(2rem, 4vw, 3.5rem)',
            alignItems: 'center'
          }}
        >
          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start' }}>
              <span
                className="font-mono"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  backgroundColor: 'var(--accent-lime)',
                  color: 'var(--accent-lime-text)',
                  padding: '0.25rem 0.65rem',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '2px 2px 0px var(--border-color)',
                  letterSpacing: '0.04em'
                }}
              >
                ⚡ MODERN CAMPUS COMPLAINT PLATFORM
              </span>
            </div>

            <h1
              className="font-heading"
              style={{
                fontSize: 'clamp(2.3rem, 5vw, 3.8rem)',
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
                margin: 0
              }}
            >
              YOUR CAMPUS.{' '}
              <span
                style={{
                  backgroundColor: 'var(--accent-lime)',
                  color: '#171717',
                  padding: '0 8px',
                  border: '3px solid var(--border-color)',
                  boxShadow: '4px 4px 0px var(--border-color)',
                  display: 'inline-block',
                  transform: 'rotate(-1deg)'
                }}
              >
                YOUR VOICE.
              </span>{' '}
              YOUR FIX.
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                maxWidth: '560px',
                margin: 0
              }}
            >
              The centralized, transparent platform where college students submit campus complaints, monitor real-time triage across 8 operational departments, and verify resolutions with immutable audit logs.
            </p>

            {/* Hero CTA Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginTop: '0.25rem' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={handlePortalNavigation}
                rightIcon={<ArrowRight size={18} />}
              >
                Student Portal
              </Button>

              <Button
                variant="blue"
                size="lg"
                onClick={() => navigate('/login')}
                leftIcon={<ShieldAlert size={18} />}
              >
                Admin Operations
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => scrollToSection('how-it-works')}
              >
                Explore Workflow
              </Button>
            </div>

            {/* Trust checkmarks & guarantees */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.25rem',
                marginTop: '1rem',
                paddingTop: '1.25rem',
                borderTop: '1.5px solid var(--border-subtle)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 600
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} color="var(--accent-blue)" />
                <span>100% Auditable Timeline</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} color="var(--accent-blue)" />
                <span>Department SLA Enforcement</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} color="var(--accent-blue)" />
                <span>Amazon Cognito Verified</span>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Visual: Polished CampusFix SaaS Product Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '620px',
              margin: '0 auto'
            }}
          >
            {/* Desktop / Tablet SaaS Window Mockup */}
            <div
              className="neo-card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: 'var(--border-width-lg) solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-offset-lg)',
                overflow: 'hidden'
              }}
            >
              {/* Window Chrome / Title Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 1rem',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  borderBottom: 'var(--border-width) solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: 'var(--accent-red)', border: '1px solid var(--border-color)' }} />
                  <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: 'var(--accent-orange)', border: '1px solid var(--border-color)' }} />
                  <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: 'var(--accent-lime)', border: '1px solid var(--border-color)' }} />
                  <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                    CampusFix Operations Console • Live
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-lime)',
                      border: '1px solid var(--border-color)'
                    }}
                  />
                  <span className="font-mono" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    CLOUD SYNCED
                  </span>
                </div>
              </div>

              {/* Mockup Body Content */}
              <div style={{ padding: 'clamp(1rem, 2.5vw, 1.4rem)', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
                {/* Micro KPI Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                  <div
                    style={{
                      padding: '0.55rem 0.65rem',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '1.5px 1.5px 0px var(--border-color)'
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>RESOLUTION RATE</div>
                    <div className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      94.8% <TrendingUp size={14} color="var(--accent-blue)" />
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '0.55rem 0.65rem',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '1.5px 1.5px 0px var(--border-color)'
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>AVG TRIAGE SLA</div>
                    <div className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-blue)' }}>2.1h</div>
                  </div>
                  <div
                    style={{
                      padding: '0.55rem 0.65rem',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '1.5px 1.5px 0px var(--border-color)'
                    }}
                  >
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>ACTIVE TICKETS</div>
                    <div className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>16</div>
                  </div>
                </div>

                {/* Spotlight Active Ticket Showcase */}
                <div
                  className="neo-card"
                  style={{
                    padding: '1rem 1.15rem',
                    backgroundColor: 'var(--bg-surface)',
                    borderLeft: '5px solid var(--accent-blue)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className="font-mono"
                        style={{
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          backgroundColor: 'var(--bg-surface-secondary)',
                          padding: '0.15rem 0.45rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '3px'
                        }}
                      >
                        CMP-1048
                      </span>
                      <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        IT Infrastructure
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <PriorityBadge priority="High" size="sm" />
                      <StatusBadge status="In Progress" size="sm" />
                    </div>
                  </div>

                  <div>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Central Library Wi-Fi Access Points Dropouts
                    </h2>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      📍 3rd Floor Quiet Study Zone • Assigned to Eng. David Vance
                    </div>
                  </div>

                  {/* 4-Step Visual Stepper Mockup */}
                  <div
                    style={{
                      padding: '0.6rem 0.75rem',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Check size={12} strokeWidth={3} /> 1. Submitted
                      </span>
                      <span style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Check size={12} strokeWidth={3} /> 2. Routed
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 800, backgroundColor: 'var(--accent-lime)', padding: '0.1rem 0.35rem', borderRadius: '3px', border: '1px solid var(--border-color)' }}>
                        3. In Progress
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        4. Resolved
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <div style={{ width: '75%', height: '100%', backgroundColor: 'var(--accent-blue)' }} />
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      💬 <em>"Replacement gigabit switch requisitioned; technician on-site."</em>
                    </div>
                  </div>
                </div>

                {/* Secondary Fast-Resolved Ticket Showcase */}
                <div
                  className="neo-card"
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-surface)',
                    borderLeft: '5px solid var(--accent-lime)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                      <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 800 }}>CMP-1045</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Classroom Support</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      Lecture Hall 4 Projector Calibration
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--status-resolved-bg)',
                        color: 'var(--status-resolved-text)',
                        padding: '0.2rem 0.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '3px'
                      }}
                    >
                      ✓ Resolved in 1h 40m
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating SaaS Trust Pill Top-Right */}
            <div
              className="neo-card hidden sm:inline-flex"
              style={{
                position: 'absolute',
                top: '-14px',
                right: '18px',
                padding: '0.4rem 0.75rem',
                backgroundColor: 'var(--accent-lime)',
                color: '#171717',
                fontSize: '0.75rem',
                fontWeight: 800,
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '2.5px 2.5px 0px var(--border-color)',
                zIndex: 5
              }}
            >
              <Zap size={14} color="#171717" />
              <span>Instant SES Email Notifications</span>
            </div>

            {/* Floating Security Pill Bottom-Left */}
            <div
              className="neo-card hidden sm:inline-flex"
              style={{
                position: 'absolute',
                bottom: '-12px',
                left: '20px',
                padding: '0.4rem 0.75rem',
                backgroundColor: 'var(--bg-surface)',
                fontSize: '0.75rem',
                fontWeight: 700,
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '2.5px 2.5px 0px var(--border-color)',
                zIndex: 5
              }}
            >
              <ShieldCheck size={15} color="var(--accent-blue)" />
              <span>Amazon Cognito OIDC / PKCE</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================================================
          SECTION 2: HOW IT WORKS
          ================================================== */}
      <section
        id="how-it-works"
        style={{
          padding: 'clamp(3.5rem, 6vw, 5.5rem) clamp(1rem, 3.5vw, 2rem)',
          backgroundColor: 'var(--bg-surface)',
          borderTop: 'var(--border-width) solid var(--border-color)',
          borderBottom: 'var(--border-width) solid var(--border-color)'
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span
              className="font-mono"
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: 'var(--accent-blue)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              THE THREE-STEP RESOLUTION CYCLE
            </span>
            <h2
              className="font-heading"
              style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)', fontWeight: 900, marginTop: '0.5rem', color: 'var(--text-primary)' }}
            >
              How CampusFix Resolves Issues
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0.5rem auto 0 auto' }}>
              From initial student submission to final departmental sign-off, every lifecycle transition is immutably logged and visible.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: '1.5rem'
            }}
          >
            {/* Step 1: Submit a Complaint */}
            <Card accentBar="lime" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '1.6rem',
                      fontWeight: 900,
                      color: 'var(--accent-lime-text)',
                      backgroundColor: 'var(--accent-lime)',
                      padding: '0.2rem 0.6rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '4px',
                      boxShadow: '2px 2px 0px var(--border-color)'
                    }}
                  >
                    01
                  </span>
                  <span className="neo-badge" style={{ backgroundColor: 'var(--bg-surface-secondary)' }}>
                    Student Action
                  </span>
                </div>

                <div>
                  <h3 className="font-heading" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Submit a Complaint
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginTop: '0.35rem' }}>
                    Students report issues in under 60 seconds. Specify building location, categorize the problem, set priority, and attach photo evidence.
                  </p>
                </div>
              </div>

              {/* Step 1 Visual Vignette */}
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.85rem',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  <FileText size={14} color="var(--accent-blue)" />
                  <span>Ticket Draft: Biology Lab Equipment</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span className="neo-badge" style={{ fontSize: '0.68rem', backgroundColor: 'var(--bg-surface)' }}>Equipment</span>
                  <span className="neo-badge" style={{ fontSize: '0.68rem', backgroundColor: 'var(--accent-orange-surface)', color: 'var(--accent-orange-text)' }}>High Priority</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <UploadCloud size={12} />
                  <span>photo_evidence.jpg (2.4 MB attached)</span>
                </div>
              </div>
            </Card>

            {/* Step 2: Review & Assign */}
            <Card accentBar="blue" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '1.6rem',
                      fontWeight: 900,
                      color: '#FFFFFF',
                      backgroundColor: 'var(--accent-blue)',
                      padding: '0.2rem 0.6rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '4px',
                      boxShadow: '2px 2px 0px var(--border-color)'
                    }}
                  >
                    02
                  </span>
                  <span className="neo-badge" style={{ backgroundColor: 'var(--accent-blue-surface)', color: 'var(--accent-blue)' }}>
                    Admin Triage
                  </span>
                </div>

                <div>
                  <h3 className="font-heading" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Review & Route Department
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginTop: '0.35rem' }}>
                    Administrators evaluate the central triage queue and route the complaint to 1 of 8 specialized operational divisions with targeted turnaround SLAs.
                  </p>
                </div>
              </div>

              {/* Step 2 Visual Vignette */}
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.85rem',
                  backgroundColor: 'var(--accent-blue-surface)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building2 size={13} color="var(--accent-blue)" />
                    <span>Dept: IT Infrastructure</span>
                  </span>
                  <span className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--accent-blue)' }}>SLA: 24h</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <UserCheck size={12} color="var(--text-secondary)" />
                  <span>Assigned Handler: Prof. Miller</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                  ✓ Automated SES Email Dispatched to Student
                </div>
              </div>
            </Card>

            {/* Step 3: Track & Get Resolution */}
            <Card accentBar="orange" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '1.6rem',
                      fontWeight: 900,
                      color: '#171717',
                      backgroundColor: 'var(--accent-orange)',
                      padding: '0.2rem 0.6rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '4px',
                      boxShadow: '2px 2px 0px var(--border-color)'
                    }}
                  >
                    03
                  </span>
                  <span className="neo-badge" style={{ backgroundColor: 'var(--accent-orange-surface)', color: 'var(--accent-orange)' }}>
                    Resolution
                  </span>
                </div>

                <div>
                  <h3 className="font-heading" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Track & Verify Fix
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginTop: '0.35rem' }}>
                    Students follow step-by-step progress along the timeline. Technicians enter remarks, verify repairs, and mark tickets as resolved.
                  </p>
                </div>
              </div>

              {/* Step 3 Visual Vignette */}
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.85rem',
                  backgroundColor: 'var(--status-resolved-bg)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-resolved-text)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FileCheck size={13} color="var(--status-resolved-text)" />
                    <span>Resolution Verified</span>
                  </span>
                  <span className="font-mono" style={{ fontSize: '0.68rem' }}>Resolved in 3.5h</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <em>"Replaced faulty wiring harness. Verified operational."</em>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--status-resolved-text)', fontWeight: 700 }}>
                  ✓ Immutable Audit Log Recorded
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 3: FEATURES GRID
          ================================================== */}
      <section id="features" style={{ padding: 'clamp(3.5rem, 6vw, 5.5rem) clamp(1rem, 3.5vw, 2rem)', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span
            className="font-mono"
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: 'var(--accent-lime-text)',
              backgroundColor: 'var(--accent-lime)',
              padding: '0.15rem 0.5rem',
              borderRadius: '2px',
              border: '1.5px solid var(--border-color)',
              display: 'inline-block'
            }}
          >
            ENGINEERED FOR SCALE
          </span>
          <h2
            className="font-heading"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)', fontWeight: 900, marginTop: '0.75rem', color: 'var(--text-primary)' }}
          >
            Core Platform Capabilities
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0.5rem auto 0 auto' }}>
            Built around a strict decoupled repository pattern and enterprise AWS cloud architecture.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '1.5rem'
          }}
        >
          {/* Feature 1 */}
          <Card accentBar="lime" interactive>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'var(--accent-lime)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '2px 2px 0px var(--border-color)' }}>
              <FileText size={22} color="#171717" />
            </div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Rapid Complaint Submission
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Multi-field student intake with live character counters, client-side validation, category classification, priority tagging, and simulated S3 photo evidence upload.
            </p>
            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="font-mono" style={{ fontWeight: 700 }}>CMP-1052</span>
              <span>• Title, Category, Priority, Attachment</span>
            </div>
          </Card>

          {/* Feature 2 */}
          <Card accentBar="blue" interactive>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'var(--accent-blue-surface)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '2px 2px 0px var(--border-color)' }}>
              <Clock size={22} color="var(--accent-blue)" />
            </div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Transparent Status Tracking
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Interactive 4-step visual stepper derived directly from immutable status audit logs. Never wonder where an issue stands or who is responsible for fixing it.
            </p>
            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>4-Phase Lifecycle:</span>
              <span>Submitted → Assigned → In Progress → Resolved</span>
            </div>
          </Card>

          {/* Feature 3 */}
          <Card accentBar="orange" interactive>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'var(--accent-orange-surface)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '2px 2px 0px var(--border-color)' }}>
              <Inbox size={22} color="var(--accent-orange)" />
            </div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Centralized Incident Triage
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Administrator master register featuring real-time fuzzy search, multi-criteria status and priority filters, sorting, and responsive pagination.
            </p>
            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="neo-badge" style={{ fontSize: '0.65rem' }}>Search</span>
              <span className="neo-badge" style={{ fontSize: '0.65rem' }}>Status Filter</span>
              <span className="neo-badge" style={{ fontSize: '0.65rem' }}>Priority Sort</span>
            </div>
          </Card>

          {/* Feature 4 */}
          <Card accentBar="blue" interactive>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'var(--accent-blue)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '2px 2px 0px var(--border-color)' }}>
              <Building2 size={22} color="#FFFFFF" />
            </div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Department SLA Assignment
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Route incidents across 8 specialized campus divisions (IT, Electrical, Estates, Safety) with individual SLA compliance tracking and staff officer contacts.
            </p>
            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>8 Divisions</span>
              <span>• Head of Department & Engineer Assignments</span>
            </div>
          </Card>

          {/* Feature 5 */}
          <Card accentBar="lime" interactive>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'var(--accent-lime)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '2px 2px 0px var(--border-color)' }}>
              <BarChart3 size={22} color="#171717" />
            </div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Executive Analytics & Exports
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Visual Recharts charts tracking turnaround velocity, department workload distributions, CSV summary exports, and executive print-to-PDF reports.
            </p>
            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="neo-badge" style={{ fontSize: '0.65rem' }}>Summary CSV</span>
              <span className="neo-badge" style={{ fontSize: '0.65rem' }}>Register CSV</span>
              <span className="neo-badge" style={{ fontSize: '0.65rem' }}>PDF Report</span>
            </div>
          </Card>

          {/* Feature 6 */}
          <Card accentBar="red" interactive>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'var(--accent-red-surface)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '2px 2px 0px var(--border-color)' }}>
              <Users size={22} color="var(--accent-red)" />
            </div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Role-Based Access & Security
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Strict separation between student complaint management and administrator resolution rights backed by Amazon Cognito OIDC tokens and DynamoDB access controls.
            </p>
            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="neo-badge" style={{ fontSize: '0.65rem', backgroundColor: 'var(--accent-lime)' }}>Student</span>
              <span className="neo-badge" style={{ fontSize: '0.65rem', backgroundColor: 'var(--accent-blue)', color: '#FFF' }}>Admin</span>
              <span>Strict Permission Boundaries</span>
            </div>
          </Card>
        </div>
      </section>

      {/* ==================================================
          SECTION 4: BENEFITS & TRUST SECTION
          ================================================== */}
      <section
        id="benefits"
        style={{
          padding: 'clamp(3.5rem, 6vw, 5.5rem) clamp(1rem, 3.5vw, 2rem)',
          backgroundColor: 'var(--bg-surface)',
          borderTop: 'var(--border-width) solid var(--border-color)',
          borderBottom: 'var(--border-width) solid var(--border-color)'
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span
              className="font-mono"
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: 'var(--accent-lime-text)',
                backgroundColor: 'var(--accent-lime)',
                padding: '0.15rem 0.5rem',
                borderRadius: '2px',
                border: '1.5px solid var(--border-color)',
                display: 'inline-block'
              }}
            >
              TRUST & ACCOUNTABILITY
            </span>
            <h2
              className="font-heading"
              style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)', fontWeight: 900, marginTop: '0.75rem', color: 'var(--text-primary)' }}
            >
              Why Campuses Rely on CampusFix
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0.5rem auto 0 auto' }}>
              Transforming college grievance handling from lost paper forms into transparent digital accountability.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: '1.5rem'
            }}
          >
            {/* Benefit 1 */}
            <div
              className="neo-card"
              style={{
                padding: '1.75rem',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderTop: '6px solid var(--accent-lime)'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-color)', boxShadow: '2px 2px 0px var(--border-color)' }}>
                <Eye size={24} color="#171717" />
              </div>
              <h3 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                100% Operational Transparency
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                No more wondering if a complaint was received or ignored. Every report receives an auditable ticket ID, an immutable status timeline, and public or student-accessible technician logs.
              </p>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="var(--accent-lime-text)" />
                  <span>Real-time lifecycle tracking</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="var(--accent-lime-text)" />
                  <span>Verified technician remarks</span>
                </div>
              </div>
            </div>

            {/* Benefit 2 */}
            <div
              className="neo-card"
              style={{
                padding: '1.75rem',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderTop: '6px solid var(--accent-blue)'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-color)', boxShadow: '2px 2px 0px var(--border-color)' }}>
                <Building2 size={24} color="#FFFFFF" />
              </div>
              <h3 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                Institutional Accountability
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Department heads and engineering staff have explicit turnaround targets. Executive analytics highlight bottlenecks, track resolution velocities, and verify institutional SLA compliance.
              </p>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="var(--accent-blue)" />
                  <span>Dedicated departmental SLA clocks</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="var(--accent-blue)" />
                  <span>Executive audit CSV & PDF exports</span>
                </div>
              </div>
            </div>

            {/* Benefit 3 */}
            <div
              className="neo-card"
              style={{
                padding: '1.75rem',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderTop: '6px solid var(--accent-orange)'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-color)', boxShadow: '2px 2px 0px var(--border-color)' }}>
                <Zap size={24} color="#171717" />
              </div>
              <h3 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                Frictionless Student Experience
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Responsive web application optimized for smartphones, tablets, and laptops. Students can submit complaints from any classroom with instant email notifications and status updates.
              </p>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="var(--accent-orange)" />
                  <span>Under 60 seconds to file a complaint</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="var(--accent-orange)" />
                  <span>Instant status push notifications</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 5: DASHBOARD PREVIEW
          ================================================== */}
      <section
        id="preview"
        style={{
          padding: 'clamp(3.5rem, 6vw, 5.5rem) clamp(1rem, 3.5vw, 2rem)',
          backgroundColor: 'var(--bg-primary)'
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span
              className="font-mono"
              style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.04em' }}
            >
              TAKE A CLOSER LOOK
            </span>
            <h2 className="font-heading" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)', fontWeight: 900, marginTop: '0.5rem' }}>
              Interactive Interface Preview
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0.5rem auto 1.5rem auto' }}>
              Explore how CampusFix appears to college students versus campus operations directors.
            </p>

            {/* View Switcher Tabs */}
            <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-surface-secondary)', padding: '4px', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxShadow: '2px 2px 0px var(--border-color)' }}>
              <button
                onClick={() => setPreviewTab('student')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1.25rem',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  backgroundColor: previewTab === 'student' ? 'var(--accent-lime)' : 'transparent',
                  color: previewTab === 'student' ? '#171717' : 'var(--text-secondary)'
                }}
              >
                <GraduationCap size={16} />
                <span>Student View</span>
              </button>

              <button
                onClick={() => setPreviewTab('admin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1.25rem',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  backgroundColor: previewTab === 'admin' ? 'var(--accent-blue)' : 'transparent',
                  color: previewTab === 'admin' ? '#FFFFFF' : 'var(--text-secondary)'
                }}
              >
                <ShieldAlert size={16} />
                <span>Administrator View</span>
              </button>
            </div>
          </div>

          {/* Simulated Preview Frame */}
          <div
            className="neo-card"
            style={{
              padding: 'clamp(1rem, 3vw, 1.75rem)',
              backgroundColor: 'var(--bg-surface)',
              border: '3px solid var(--border-color)',
              boxShadow: 'var(--shadow-offset-lg)'
            }}
          >
            {previewTab === 'student' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem', borderBottom: '2px dashed var(--border-color)' }}>
                  <div>
                    <h3 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                      Your Campus, Your Voice.
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Student ticket management and resolution tracking view
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={handlePortalNavigation}>
                    Open Student Portal
                  </Button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-blue)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL COMPLAINTS</div>
                    <div className="font-heading" style={{ fontSize: '1.85rem', fontWeight: 800 }}>6</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered issues</div>
                  </div>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-orange)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PENDING REVIEW</div>
                    <div className="font-heading" style={{ fontSize: '1.85rem', fontWeight: 800 }}>2</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting triage</div>
                  </div>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-lime)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>IN PROGRESS</div>
                    <div className="font-heading" style={{ fontSize: '1.85rem', fontWeight: 800 }}>2</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active repairs</div>
                  </div>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-lime)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>RESOLVED</div>
                    <div className="font-heading" style={{ fontSize: '1.85rem', fontWeight: 800 }}>1</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified safe</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem', borderBottom: '2px dashed var(--border-color)' }}>
                  <div>
                    <h3 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                      Campus Operations Console
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Central campus administrative operations and ticket triage
                    </p>
                  </div>
                  <Button variant="blue" size="sm" onClick={() => navigate('/login')}>
                    Open Admin Console
                  </Button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-blue)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL INCIDENTS</div>
                    <div className="font-heading" style={{ fontSize: '1.85rem', fontWeight: 800 }}>16</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Campus-wide</div>
                  </div>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-orange)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PENDING TRIAGE</div>
                    <div className="font-heading" style={{ fontSize: '1.85rem', fontWeight: 800 }}>4</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting routing</div>
                  </div>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-lime)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>IN PROGRESS</div>
                    <div className="font-heading" style={{ fontSize: '1.85rem', fontWeight: 800 }}>6</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dispatched</div>
                  </div>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-red)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>CRITICAL PRIORITY</div>
                    <div className="font-heading" style={{ fontSize: '1.85rem', fontWeight: 800 }}>4</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Safety hazard</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 6: CAMPUS METRICS
          ================================================== */}
      <section id="metrics" style={{ padding: 'clamp(3.5rem, 6vw, 5.5rem) clamp(1rem, 3.5vw, 2rem)', maxWidth: '1240px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span
            className="font-mono"
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--accent-lime-text)',
              backgroundColor: 'var(--accent-lime)',
              padding: '0.2rem 0.6rem',
              borderRadius: '2px',
              border: '1.5px solid var(--border-color)',
              display: 'inline-block'
            }}
          >
            CAMPUS METRICS — RESOLUTION BENCHMARKS
          </span>
          <h2 className="font-heading" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)', fontWeight: 900, marginTop: '0.75rem' }}>
            Auditable Campus Figures
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Operational metrics for ticket resolution, departmental response, and SLA compliance.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '1.25rem'
          }}
        >
          <div className="neo-card" style={{ padding: '1.75rem', textAlign: 'center', borderTop: '6px solid var(--accent-blue)' }}>
            <div className="font-heading" style={{ fontSize: '2.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {campusStats.total}
            </div>
            <div className="font-heading" style={{ fontSize: '1rem', fontWeight: 800, marginTop: '0.5rem' }}>
              Complaints Tracked
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Multi-category audit trail
            </div>
          </div>

          <div className="neo-card" style={{ padding: '1.75rem', textAlign: 'center', borderTop: '6px solid var(--accent-lime)' }}>
            <div className="font-heading" style={{ fontSize: '2.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {campusStats.resolved}
            </div>
            <div className="font-heading" style={{ fontSize: '1rem', fontWeight: 800, marginTop: '0.5rem' }}>
              Resolved Issues
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Complete audit timestamps
            </div>
          </div>

          <div className="neo-card" style={{ padding: '1.75rem', textAlign: 'center', borderTop: '6px solid var(--accent-orange)' }}>
            <div className="font-heading" style={{ fontSize: '2.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {campusStats.departments}
            </div>
            <div className="font-heading" style={{ fontSize: '1rem', fontWeight: 800, marginTop: '0.5rem' }}>
              Operational Units
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              With dedicated SLAs & heads
            </div>
          </div>

          <div className="neo-card" style={{ padding: '1.75rem', textAlign: 'center', borderTop: '6px solid var(--accent-red)' }}>
            <div className="font-heading" style={{ fontSize: '2.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              {campusStats.avgSla}
            </div>
            <div className="font-heading" style={{ fontSize: '1rem', fontWeight: 800, marginTop: '0.5rem' }}>
              Average Triage SLA
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Fast departmental assignment
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 7: CALL TO ACTION
          ================================================== */}
      <section
        style={{
          padding: 'clamp(3.5rem, 6vw, 5.5rem) clamp(1rem, 3.5vw, 2rem)',
          backgroundColor: 'var(--bg-surface-secondary)',
          borderTop: 'var(--border-width) solid var(--border-color)',
          borderBottom: 'var(--border-width) solid var(--border-color)',
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              backgroundColor: 'var(--accent-lime)',
              border: '3px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-offset)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Zap size={28} color="#171717" />
          </div>

          <h2
            className="font-heading"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 2.85rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}
          >
            Every campus issue deserves accountability.
          </h2>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '580px', lineHeight: 1.6, margin: 0 }}>
            The transparent platform to submit campus complaints, monitor real-time triage, and verify resolutions across your institution.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', justifyContent: 'center' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={handlePortalNavigation}
              leftIcon={<GraduationCap size={18} />}
            >
              Access Student Portal
            </Button>

            <Button
              variant="blue"
              size="lg"
              onClick={() => navigate('/login')}
              leftIcon={<ShieldAlert size={18} />}
            >
              Access Admin Operations
            </Button>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 8: FOOTER
          ================================================== */}
      <footer
        id="about"
        style={{
          padding: '3.5rem clamp(1rem, 3vw, 2rem) 2.5rem clamp(1rem, 3vw, 2rem)',
          backgroundColor: 'var(--bg-surface)',
          marginTop: 'auto'
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '2.5rem',
            paddingBottom: '2.5rem',
            borderBottom: '1.5px solid var(--border-subtle)'
          }}
        >
          {/* Brand info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <BrandLogo size="md" showTagline />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '0.5rem' }}>
              Centralized college complaint management built with Neo-Brutalist design tokens, tactile feedback, and auditable resolution lifecycles.
            </p>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <span className="font-heading" style={{ fontWeight: 800, fontSize: '0.95rem' }}>
              NAVIGATION
            </span>
            <button onClick={() => scrollToSection('hero')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
              Home
            </button>
            <button onClick={() => scrollToSection('how-it-works')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
              How It Works
            </button>
            <button onClick={() => scrollToSection('features')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
              Features
            </button>
            <button onClick={() => scrollToSection('benefits')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
              Why CampusFix
            </button>
            <button onClick={() => scrollToSection('preview')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
              Dashboard Preview
            </button>
            <button onClick={() => scrollToSection('metrics')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
              Campus Metrics
            </button>
          </div>

          {/* Portal Access Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <span className="font-heading" style={{ fontWeight: 800, fontSize: '0.95rem' }}>
              PORTAL ACCESS
            </span>
            <button onClick={handlePortalNavigation} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              Student Portal
            </button>
            <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              Admin Operations
            </button>
            <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
              Sign In (Campus SSO)
            </button>
          </div>

          {/* Architecture & Security Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <span className="font-heading" style={{ fontWeight: 800, fontSize: '0.95rem' }}>
              ARCHITECTURE
            </span>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Frontend: <strong>React 19, Vite, TypeScript</strong>
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Design System: <strong>Neo-Brutalist CSS Tokens</strong>
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Cloud: <strong>Cognito, Lambda, DynamoDB, SES</strong>
            </div>
            <div className="font-mono" style={{ fontSize: '0.725rem', color: 'var(--accent-lime-text)', backgroundColor: 'var(--accent-lime)', padding: '0.2rem 0.5rem', borderRadius: '3px', marginTop: '0.4rem', alignSelf: 'flex-start', border: '1px solid var(--border-color)' }}>
              ● AWS BACKEND ACTIVE
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1240px', margin: '1.5rem auto 0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>© 2026 CampusFix. All rights reserved.</span>
          <span>College Complaint Management SaaS Platform.</span>
        </div>
      </footer>
    </div>
  );
};
