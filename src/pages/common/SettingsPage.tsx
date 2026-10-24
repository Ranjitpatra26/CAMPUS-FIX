import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  Sun,
  Moon,
  ShieldAlert,
  GraduationCap,
  Cloud,
  Database,
  Lock,
  Cpu,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { getUserDisplayName, getUserEmail, isUuidString } from '../../utils/userProfile';

export const SettingsPage: React.FC = () => {
  const { user, role, updateProfileName } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const currentDisplayName = getUserDisplayName(user, role);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentDisplayName);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateProfileName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setNameInput(currentDisplayName);
    setIsEditingName(false);
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
          PREFERENCES & VERIFIED IDENTITY
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
          Manage your interface preferences and view your verified Amazon Cognito account profile.
        </p>
      </div>

      {/* Verified Account Profile */}
      <Card accentBar="blue">
        <h3 className="font-heading" style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
          Verified Account Profile
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Identity and role authorization claims verified by Amazon Cognito.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}
        >
          <div
            style={{
              padding: '1rem 1.25rem',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-secondary)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.2rem'
              }}
            >
              <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Account Name
              </div>
              {!isEditingName && (
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(currentDisplayName);
                    setIsEditingName(true);
                  }}
                  className="neo-btn neo-btn-secondary"
                  style={{
                    padding: '0.15rem 0.45rem',
                    fontSize: '0.7rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer'
                  }}
                  title="Customize display name"
                >
                  <Edit3 size={11} />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {isEditingName ? (
              <form onSubmit={handleSaveName} style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Enter your full name"
                  autoFocus
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="submit"
                    className="neo-btn neo-btn-primary"
                    style={{
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Check size={12} />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="neo-btn neo-btn-secondary"
                    style={{
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={12} />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                {currentDisplayName}
              </div>
            )}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {getUserEmail(user) || 'Authenticated User'}
            </div>
          </div>

          <div
            style={{
              padding: '1rem 1.25rem',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-secondary)'
            }}
          >
            <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Authorized Role
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              {role === 'admin' ? (
                <ShieldAlert size={20} color="var(--accent-blue)" />
              ) : (
                <GraduationCap size={20} color="var(--accent-lime-text)" />
              )}
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {role === 'admin' ? 'Administrator' : 'Student'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {role === 'admin'
                ? 'Authorized for central complaint triage & routing'
                : 'Authorized for personal complaint submission & tracking'}
            </div>
          </div>

          <div
            style={{
              padding: '1rem 1.25rem',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-secondary)'
            }}
          >
            <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Department / Affiliation
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
              {user?.department || (role === 'admin' ? 'Campus Administration' : 'General Campus')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {user?.studentId && !isUuidString(user.studentId) ? `ID: ${user.studentId}` : 'Institutional Identity'}
            </div>
          </div>
        </div>
      </Card>

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

      {/* Connected AWS Cloud Architecture */}
      <Card accentBar="blue">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Cloud size={20} color="var(--accent-blue)" />
          <h3 className="font-heading" style={{ fontSize: '1.2rem', margin: 0 }}>
            Connected Cloud Services
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Live enterprise backend infrastructure operating in AWS region ap-southeast-2:
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
              OIDC & PKCE authentication with group-based administrator authorization.
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
              Serverless Node.js Function URL API with claim-validated authorization.
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
              Single-table persistence: PK <code>USER#id</code>, SK <code>CMP#id</code>, GSI on status.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
