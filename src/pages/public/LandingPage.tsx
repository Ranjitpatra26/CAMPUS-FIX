import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/complaints/StatusBadge';
import { PriorityBadge } from '../../components/complaints/PriorityBadge';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  Building2,
  BarChart3,
  Users,
  FileText,
  Lock,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X,
  ExternalLink,
  GraduationCap,
  ShieldAlert,
  Inbox,
  Activity,
  Layers
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

  const handlePortalNavigation = (targetRole: 'student' | 'admin') => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/student');
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
          padding: '0 2rem'
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
              onClick={() => scrollToSection('preview')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Dashboard Preview
            </button>
            <button
              onClick={() => scrollToSection('metrics')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Campus Metrics
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

          {/* If already logged in, show direct portal button */}
          {user ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(role === 'admin' ? '/admin' : '/student')}
              rightIcon={<ArrowRight size={14} />}
            >
              Open Dashboard ({role.toUpperCase()})
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/register')}
                className="hidden sm:inline-flex"
              >
                Register
              </Button>
            </>
          )}

          {/* Mobile hamburger */}
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
            top: 'var(--navbar-height)',
            left: '1rem',
            right: '1rem',
            zIndex: 100,
            padding: '1.25rem',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}
        >
          <button
            onClick={() => scrollToSection('hero')}
            style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('features')}
            style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('preview')}
            style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}
          >
            Dashboard Preview
          </button>
          <button
            onClick={() => scrollToSection('metrics')}
            style={{ padding: '0.5rem', textAlign: 'left', background: 'none', border: 'none', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}
          >
            Campus Metrics
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', paddingTop: '0.75rem', borderTop: '1.5px solid var(--border-subtle)' }}>
            <Button variant="secondary" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>
              Sign In
            </Button>
            <Button variant="primary" onClick={() => { setMobileMenuOpen(false); handlePortalNavigation('student'); }}>
              Student Portal
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
          padding: '4rem 2rem 5rem 2rem',
          maxWidth: '1320px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            alignItems: 'center'
          }}
        >
          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
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
                ⚡ CAMPUS OPERATIONS, SIMPLIFIED
              </span>
            </div>

            <h1
              className="font-heading"
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)'
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
                fontSize: '1.15rem',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                maxWidth: '560px'
              }}
            >
              A simpler way to report campus issues, track resolution progress in real time, and coordinate directly with administrators. Zero lost paperwork, complete transparency.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => handlePortalNavigation('student')}
                rightIcon={<ArrowRight size={18} />}
              >
                Student Portal
              </Button>

              <Button
                variant="blue"
                size="lg"
                onClick={() => handlePortalNavigation('admin')}
                leftIcon={<ShieldAlert size={18} />}
              >
                Admin Operations
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => scrollToSection('how-it-works')}
              >
                How It Works
              </Button>
            </div>

            {/* Trust checkmarks */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.25rem',
                marginTop: '1.25rem',
                paddingTop: '1.25rem',
                borderTop: '1.5px solid var(--border-subtle)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontWeight: 600
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={16} color="var(--accent-blue)" />
                <span>100% Auditable Timeline</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={16} color="var(--accent-blue)" />
                <span>Live SLA Tracking</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={16} color="var(--accent-blue)" />
                <span>Zero Hardcoded Stubs</span>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Illustration: Interactive Neo-Brutalist Ticket Stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              padding: '1.5rem',
              backgroundColor: 'var(--bg-surface-secondary)',
              border: 'var(--border-width-lg) solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-offset-lg)'
            }}
          >
            {/* Header pill of the illustration */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent-red)', border: '1px solid var(--border-color)' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent-orange)', border: '1px solid var(--border-color)' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent-lime)', border: '1px solid var(--border-color)' }} />
                <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, marginLeft: '0.4rem' }}>
                  CAMPUS INCIDENT RADAR
                </span>
              </div>
              <span
                className="neo-badge"
                style={{ backgroundColor: 'var(--accent-lime)', color: '#171717', fontSize: '0.7rem' }}
              >
                LIVE TICKETS
              </span>
            </div>

            {/* Ticket 1: Wi-Fi Connectivity - In Progress */}
            <motion.div
              whileHover={{ y: -3 }}
              className="neo-card"
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderLeft: '6px solid var(--accent-blue)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                  CMP-1024
                </span>
                <StatusBadge status="In Progress" size="sm" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Wi-Fi AP dropouts in Central Library 3rd Floor
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                <span>Dept: IT Infrastructure</span>
                <span>Assigned: Prof. Miller • SLA 24h</span>
              </div>
              {/* Mini progress bar */}
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '68%', height: '100%', backgroundColor: 'var(--accent-blue)' }} />
              </div>
            </motion.div>

            {/* Ticket 2: Lab Equipment - Resolved */}
            <motion.div
              whileHover={{ y: -3 }}
              className="neo-card"
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderLeft: '6px solid var(--accent-lime)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                  CMP-1025
                </span>
                <StatusBadge status="Resolved" size="sm" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Digital storage oscilloscope short circuit in Lab B
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                <span>Dept: Classroom Support</span>
                <span style={{ color: 'var(--status-resolved-text)', fontWeight: 700 }}>✓ Verified Safe</span>
              </div>
            </motion.div>

            {/* Ticket 3: Classroom Maintenance - Assigned */}
            <motion.div
              whileHover={{ y: -3 }}
              className="neo-card"
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderLeft: '6px solid var(--accent-orange)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                  CMP-1026
                </span>
                <StatusBadge status="Assigned" size="sm" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Water seepage above Lecture Hall 4 laser projector
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                <span>Dept: Campus Maintenance</span>
                <PriorityBadge priority="Critical" size="sm" />
              </div>
            </motion.div>

            {/* Bottom floating badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                padding: '0.5rem 0.85rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1.5px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                Active Student Identity Protection: <strong>ENFORCED</strong>
              </span>
              <ShieldCheck size={16} color="var(--accent-lime-text)" />
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
          padding: '5rem 2rem',
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
              style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '0.5rem', color: 'var(--text-primary)' }}
            >
              How CampusFix Resolves Issues
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0.5rem auto 0 auto' }}>
              From initial student submission to final verification, every lifecycle transition is immutably logged and visible.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {/* Step 1 */}
            <Card accentBar="lime" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '1.75rem',
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
                <h3 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Report an Issue
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.5, marginTop: '0.4rem' }}>
                  Students submit a complaint with title, category, location, priority level, and simulated photo evidence. The system immediately registers an auditable ticket ID (e.g. <code>CMP-1017</code>).
                </p>
              </div>
            </Card>

            {/* Step 2 */}
            <Card accentBar="blue" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '1.75rem',
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
                  Admin Operations
                </span>
              </div>

              <div>
                <h3 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Review & Assign
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.5, marginTop: '0.4rem' }}>
                  Administrators review the incoming triage queue and route the issue to one of 8 specialized departments (e.g. IT Services, Electrical Works, Estate Maintenance) with assigned engineers.
                </p>
              </div>
            </Card>

            {/* Step 3 */}
            <Card accentBar="orange" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '1.75rem',
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
                <h3 className="font-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Track Resolution
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.5, marginTop: '0.4rem' }}>
                  Students track real-time progression along a 4-step status timeline. Technicians enter remarks, verify fixes, and mark tickets as resolved, or provide mandatory explanations if rejected.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 3: FEATURES GRID
          ================================================== */}
      <section id="features" style={{ padding: '5rem 2rem', maxWidth: '1240px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
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
            style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '0.75rem', color: 'var(--text-primary)' }}
          >
            Core System Capabilities
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0.5rem auto 0 auto' }}>
            Built around a strict decoupled repository pattern and prepared for seamless AWS cloud integration.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {/* Feature 1 */}
          <Card accentBar="lime" interactive>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'var(--accent-lime)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '2px 2px 0px var(--border-color)' }}>
              <FileText size={22} color="#171717" />
            </div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Easy Complaint Submission
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Rapid multi-field input with character counters, client-side validation, category classification, priority tagging, and simulated S3 evidence upload.
            </p>
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
              Interactive 4-step visual stepper derived directly from immutable status audit logs. Never wonder where an issue stands.
            </p>
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
              Administrator master register featuring real-time fuzzy search, multi-criteria filters, priority sorting, and responsive pagination.
            </p>
          </Card>

          {/* Feature 4 */}
          <Card accentBar="blue" interactive>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'var(--accent-blue)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '2px 2px 0px var(--border-color)' }}>
              <Building2 size={22} color="#FFFFFF" />
            </div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Department Assignment
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Route incidents to 8 distinct campus divisions with customized SLA compliance tracking and staff officer contacts.
            </p>
          </Card>

          {/* Feature 5 */}
          <Card accentBar="lime" interactive>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'var(--accent-lime)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '2px 2px 0px var(--border-color)' }}>
              <BarChart3 size={22} color="#171717" />
            </div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Complaint Analytics
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Responsive Recharts visualizations showing workflow state distributions, categorical Pareto charts, and daily intake curves.
            </p>
          </Card>

          {/* Feature 6 */}
          <Card accentBar="red" interactive>
            <div style={{ width: '42px', height: '42px', backgroundColor: 'var(--accent-red-surface)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '2px 2px 0px var(--border-color)' }}>
              <Users size={22} color="var(--accent-red)" />
            </div>
            <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Role-Based Access
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Strict separation between student submission portals and administrator triage actions. Ready for Amazon Cognito token claims.
            </p>
          </Card>
        </div>
      </section>

      {/* ==================================================
          SECTION 4: DASHBOARD PREVIEW
          ================================================== */}
      <section
        id="preview"
        style={{
          padding: '5rem 2rem',
          backgroundColor: 'var(--bg-surface)',
          borderTop: 'var(--border-width) solid var(--border-color)',
          borderBottom: 'var(--border-width) solid var(--border-color)'
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
            <h2 className="font-heading" style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '0.5rem' }}>
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
              padding: '1.75rem',
              backgroundColor: 'var(--bg-surface)',
              border: '3px solid var(--border-color)',
              boxShadow: 'var(--shadow-offset-lg)'
            }}
          >
            {previewTab === 'student' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem', borderBottom: '2px dashed var(--border-color)' }}>
                  <div>
                    <h3 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      Your Campus, Your Voice.
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Student ticket management and resolution tracking view
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => handlePortalNavigation('student')}>
                    Open Student Portal
                  </Button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-blue)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL COMPLAINTS</div>
                    <div className="font-heading" style={{ fontSize: '2rem', fontWeight: 800 }}>6</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered issues</div>
                  </div>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-orange)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PENDING REVIEW</div>
                    <div className="font-heading" style={{ fontSize: '2rem', fontWeight: 800 }}>2</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting triage</div>
                  </div>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-lime)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>IN PROGRESS</div>
                    <div className="font-heading" style={{ fontSize: '2rem', fontWeight: 800 }}>2</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active repairs</div>
                  </div>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-lime)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>RESOLVED</div>
                    <div className="font-heading" style={{ fontSize: '2rem', fontWeight: 800 }}>1</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified safe</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1rem', borderBottom: '2px dashed var(--border-color)' }}>
                  <div>
                    <h3 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      Campus Operations Console
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Central campus administrative operations and ticket triage
                    </p>
                  </div>
                  <Button variant="blue" size="sm" onClick={() => handlePortalNavigation('admin')}>
                    Open Admin Console
                  </Button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-blue)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL INCIDENTS</div>
                    <div className="font-heading" style={{ fontSize: '2rem', fontWeight: 800 }}>16</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Campus-wide</div>
                  </div>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-orange)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PENDING TRIAGE</div>
                    <div className="font-heading" style={{ fontSize: '2rem', fontWeight: 800 }}>4</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting routing</div>
                  </div>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-lime)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>IN PROGRESS</div>
                    <div className="font-heading" style={{ fontSize: '2rem', fontWeight: 800 }}>6</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dispatched</div>
                  </div>
                  <div className="neo-card" style={{ padding: '1rem', borderTop: '5px solid var(--accent-red)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>CRITICAL PRIORITY</div>
                    <div className="font-heading" style={{ fontSize: '2rem', fontWeight: 800 }}>4</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Safety hazard</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 5: CAMPUS METRICS
          ================================================== */}
      <section id="metrics" style={{ padding: '5rem 2rem', maxWidth: '1240px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
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
          <h2 className="font-heading" style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '0.75rem' }}>
            Auditable Campus Figures
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Operational metrics for ticket resolution, departmental response, and SLA compliance.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem'
          }}
        >
          <div className="neo-card" style={{ padding: '1.75rem', textAlign: 'center', borderTop: '6px solid var(--accent-blue)' }}>
            <div className="font-heading" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
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
            <div className="font-heading" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
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
            <div className="font-heading" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
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
            <div className="font-heading" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
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
          SECTION 6: CALL TO ACTION
          ================================================== */}
      <section
        style={{
          padding: '5rem 2rem',
          backgroundColor: 'var(--bg-surface-secondary)',
          borderTop: 'var(--border-width) solid var(--border-color)',
          borderBottom: 'var(--border-width) solid var(--border-color)',
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'var(--accent-lime)',
              border: '3px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-offset)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Zap size={32} color="#171717" />
          </div>

          <h2
            className="font-heading"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15 }}
          >
            Every issue deserves attention.
          </h2>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '580px', lineHeight: 1.6 }}>
            A transparent, accountable platform to submit campus complaints, monitor real-time triage, and verify resolutions.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => handlePortalNavigation('student')}
              leftIcon={<GraduationCap size={20} />}
            >
              Access Student Portal
            </Button>

            <Button
              variant="blue"
              size="lg"
              onClick={() => handlePortalNavigation('admin')}
              leftIcon={<ShieldAlert size={20} />}
            >
              Access Admin Operations
            </Button>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 7: FOOTER
          ================================================== */}
      <footer
        id="about"
        style={{
          padding: '4rem 2rem 2.5rem 2rem',
          backgroundColor: 'var(--bg-surface)',
          marginTop: 'auto'
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            paddingBottom: '2.5rem',
            borderBottom: '1.5px solid var(--border-subtle)'
          }}
        >
          {/* Brand info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <BrandLogo size="md" showTagline />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '0.5rem' }}>
              Centralized college complaint management built with Neo-Brutalist design tokens, tactile animations, and clear resolution audit trails.
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
            <button onClick={() => scrollToSection('preview')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
              Dashboard Preview
            </button>
          </div>

          {/* Portal Access Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <span className="font-heading" style={{ fontWeight: 800, fontSize: '0.95rem' }}>
              PORTAL ACCESS
            </span>
            <button onClick={() => handlePortalNavigation('student')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              Student Portal
            </button>
            <button onClick={() => handlePortalNavigation('admin')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              Admin Operations
            </button>
            <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
              Login Screen
            </button>
            <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer' }}>
              Register Account
            </button>
          </div>

          {/* Technology & AWS Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <span className="font-heading" style={{ fontWeight: 800, fontSize: '0.95rem' }}>
              ARCHITECTURE
            </span>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Frontend: <strong>React 19, Vite, TypeScript</strong>
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Styling: <strong>Neo-Brutalist CSS Tokens</strong>
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Phase 2 Cloud: <strong>Cognito, Lambda, DynamoDB</strong>
            </div>
            <div className="font-mono" style={{ fontSize: '0.725rem', color: 'var(--accent-lime-text)', backgroundColor: 'var(--accent-lime)', padding: '0.2rem 0.5rem', borderRadius: '3px', marginTop: '0.4rem', alignSelf: 'flex-start', border: '1px solid var(--border-color)' }}>
              LOCAL MOCK REPOSITORY ACTIVE
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1240px', margin: '1.5rem auto 0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>© 2026 CampusFix. All rights reserved.</span>
          <span>Sample college complaint management prototype.</span>
        </div>
      </footer>
    </div>
  );
};
