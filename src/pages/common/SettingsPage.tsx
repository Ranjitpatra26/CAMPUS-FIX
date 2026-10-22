import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { complaintRepository } from '../../services/complaints/localStorageRepository';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  Sun,
  Moon,
  RotateCcw,
  ShieldAlert,
  GraduationCap,
  Cloud,
  Database,
  Lock,
  Cpu
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, role, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useNotification();

  const handleReset = async () => {
    await complaintRepository.resetToDefaults();
    addToast('success', 'Reset Completed', 'Mock database re-seeded with 16 original tickets.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '880px', margin: '0 auto' }}>
      <div
        className="neo-card"
        style={{
          padding: '2rem 1.75rem',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <div
          className="font-mono"
          style={{
            fontSize: '0.8rem',
            color: 'var(--accent-blue)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.25rem'
          }}
        >
          PREFERENCES & SYSTEM READINESS
        </div>
        <h1
          className="font-heading"
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em'
          }}
        >
          System Settings
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Configure UI theme, switch demo actor profiles, reset local repository mock state, and inspect AWS cloud readiness.
        </p>
      </div>

      {/* Theme Settings */}
      <Card accentBar="lime">
        <h3 className="font-heading" style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
          Interface Theme
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Toggle between High-Contrast Warm Off-White (Light) and Deep Charcoal (Dark) Neo-Brutalist themes.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1.5px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '2px 2px 0px var(--border-color)'
              }}
            >
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Current: {theme === 'light' ? 'Warm Off-White (Light)' : 'Deep Charcoal (Dark)'}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Tokens persisted automatically in browser storage
              </div>
            </div>
          </div>

          <Button variant="secondary" onClick={toggleTheme}>
            Toggle Theme
          </Button>
        </div>
      </Card>

      {/* Demo Identity Switcher */}
      <Card accentBar="blue">
        <h3 className="font-heading" style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
          Active Demo Profile
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Instantly simulate distinct user roles and operational authorization scopes.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem'
          }}
        >
          <div
            onClick={() => switchRole('student')}
            className={`neo-card neo-card-interactive`}
            style={{
              padding: '1.25rem',
              border: role === 'student' ? '2.5px solid var(--accent-lime)' : '1.5px solid var(--border-color)',
              backgroundColor: role === 'student' ? 'var(--bg-surface)' : 'var(--bg-surface-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <GraduationCap size={20} color="var(--accent-lime-text)" />
              <span className="font-heading" style={{ fontWeight: 700 }}>
                Rohan Sharma (Student)
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              CS-2023-042 • Computer Science • Can submit tickets, track status history, and view personalized dashboard.
            </p>
          </div>

          <div
            onClick={() => switchRole('admin')}
            className={`neo-card neo-card-interactive`}
            style={{
              padding: '1.25rem',
              border: role === 'admin' ? '2.5px solid var(--accent-blue)' : '1.5px solid var(--border-color)',
              backgroundColor: role === 'admin' ? 'var(--bg-surface)' : 'var(--bg-surface-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <ShieldAlert size={20} color="var(--accent-blue)" />
              <span className="font-heading" style={{ fontWeight: 700 }}>
                Dr. Aris Thorne (Chief Admin)
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Campus Administration • Can route tickets to departments, enforce status transitions, and review analytics.
            </p>
          </div>
        </div>
      </Card>

      {/* Mock Data Management */}
      <Card accentBar="orange">
        <h3 className="font-heading" style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
          Mock Repository Storage
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          All mock complaints are stored in localStorage with zero cloud telemetry. You can reset to the original 16 tickets anytime.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Storage Key: <code>campusfix_mock_complaints_v1</code>
          </span>

          <Button
            variant="danger"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw size={15} />}
          >
            Reset All Mock Data
          </Button>
        </div>
      </Card>

      {/* AWS Cloud Integration Blueprint */}
      <Card accentBar="blue">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Cloud size={20} color="var(--accent-blue)" />
          <h3 className="font-heading" style={{ fontSize: '1.2rem', margin: 0 }}>
            Future AWS Integration Architecture
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Prepared clean decoupling abstractions ready to connect to AWS services:
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem'
          }}
        >
          <div
            style={{
              padding: '0.85rem',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.875rem' }}>
              <Lock size={15} color="var(--accent-blue)" />
              <span>Amazon Cognito</span>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.3rem', margin: 0 }}>
              User Pools, Hosted UI or SDK, JWT verification in Lambda authorizer.
            </p>
          </div>

          <div
            style={{
              padding: '0.85rem',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.875rem' }}>
              <Cpu size={15} color="var(--accent-lime-text)" />
              <span>AWS Lambda</span>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.3rem', margin: 0 }}>
              Serverless Node.js handlers for ticket creation, status progression, and remarks.
            </p>
          </div>

          <div
            style={{
              padding: '0.85rem',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.875rem' }}>
              <Database size={15} color="var(--accent-orange)" />
              <span>Amazon DynamoDB</span>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.3rem', margin: 0 }}>
              Single-table schema: PK <code>USER#id</code>, SK <code>CMP#id</code>, GSI1 on Status.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
