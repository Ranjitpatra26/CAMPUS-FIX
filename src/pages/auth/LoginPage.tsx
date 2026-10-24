import React, { useState, useEffect } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Eye,
  CheckCircle2
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    user,
    isLoading: isAuthLoading,
    loginWithCognito,
    isCognitoConfigured,
    callbackError
  } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPending = isSubmitting || isAuthLoading;

  // Automatically redirect already-authenticated users to their dashboard without requiring another click
  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
    }
  }, [user, isAuthLoading, navigate]);

  const handleCognitoLogin = async () => {
    if (isPending) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await loginWithCognito();
    } catch (err: any) {
      setError(err?.message || 'Cognito sign-in could not be initiated.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-root">
      {/* Left Column: Authentication Action Panel */}
      <div className="login-auth-panel">
        {/* Navigation Return to Landing */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="neo-btn neo-btn-secondary neo-btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={14} />
            <span>Return to Public Landing</span>
          </button>
        </div>

        {/* Brand & Tagline */}
        <div style={{ marginBottom: '1.75rem' }}>
          <BrandLogo size="lg" showTagline />
        </div>

        {/* Main Heading & Concise Supporting Text */}
        <div style={{ marginBottom: '2rem' }}>
          <h1
            className="font-heading login-heading"
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              lineHeight: 1.15,
              color: 'var(--text-primary)',
              letterSpacing: '-0.04em'
            }}
          >
            Make Campus Better.
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              marginTop: '0.6rem',
              lineHeight: 1.55
            }}
          >
            Access CampusFix to submit complaints, track resolution progress, and stay informed about campus issues.
          </p>
        </div>

        {/* Cognito Callback Error Notification */}
        {callbackError && (
          <div
            className="neo-card"
            role="alert"
            style={{
              padding: '1.25rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '2.5px solid var(--accent-red)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}
          >
            <ShieldAlert size={22} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div
                className="font-heading"
                style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: 'var(--accent-red)',
                  marginBottom: '0.25rem'
                }}
              >
                Cognito Authentication Notice
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {callbackError}
              </div>
            </div>
          </div>
        )}

        {/* Local Error Alert */}
        {error && (
          <div
            className="neo-card"
            role="alert"
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '2.5px solid var(--accent-red)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <ShieldAlert size={20} color="var(--accent-red)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {error}
            </span>
          </div>
        )}

        {/* Single Primary Action: Sign In with CampusFix SSO */}
        <div style={{ marginBottom: '1.25rem' }}>
          <Button
            type="button"
            variant="blue"
            size="lg"
            onClick={handleCognitoLogin}
            style={{
              width: '100%',
              minHeight: '52px',
              fontSize: '1.05rem',
              letterSpacing: '-0.01em'
            }}
            leftIcon={<ShieldCheck size={20} />}
            disabled={isPending}
            isLoading={isPending}
            loadingText="Connecting to CampusFix SSO..."
          >
            Sign In with CampusFix SSO
          </Button>
          {!isCognitoConfigured && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
              Cognito Hosted UI mode ready. Set User Pool &amp; Client ID in <code>.env</code> to activate live cloud SSO.
            </div>
          )}
        </div>

        {/* Supporting Information: Security Indicator Badge */}
        <div className="login-security-badge">
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-lime)',
              border: '1.5px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '1.5px 1.5px 0px var(--border-color)'
            }}
          >
            <Lock size={18} color="var(--text-primary)" strokeWidth={2.5} />
          </div>
          <div>
            <div
              className="font-heading"
              style={{
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.04em',
                color: 'var(--text-primary)',
                textTransform: 'uppercase'
              }}
            >
              SECURE CAMPUS ACCESS
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>
              Sign in securely through your campus authentication system.
            </div>
          </div>
        </div>

        {/* Institutional Verification Notice */}
        <div
          style={{
            marginTop: '1.75rem',
            padding: '0.9rem 1.15rem',
            backgroundColor: 'var(--bg-surface-secondary)',
            border: '1.5px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }}
          >
            Authentication Protocol
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            CampusFix uses Amazon Cognito OAuth 2.0 / PKCE authentication. Students and administrators authenticate with verified institutional credentials.
          </div>
        </div>
      </div>

      {/* Right Column: Custom Campus Illustration & Benefits */}
      <div className="login-visual-panel">
        <div className="login-illustration-wrapper">
          <img
            src="/campusfix-login-illustration.svg"
            alt="CampusFix Issue Resolution and Transparent Campus Tracking"
            className="login-illustration-img"
          />
        </div>

        {/* Compact Benefits Cards */}
        <div className="login-benefits-grid">
          <div className="login-benefit-card">
            <div className="login-benefit-icon-wrapper">
              <Eye size={18} color="var(--text-primary)" strokeWidth={2.5} />
            </div>
            <div>
              <div className="login-benefit-title">TRANSPARENT TRACKING</div>
              <div className="login-benefit-desc">
                Follow complaint progress from submission to resolution.
              </div>
            </div>
          </div>

          <div className="login-benefit-card">
            <div className="login-benefit-icon-wrapper">
              <ShieldCheck size={18} color="var(--text-primary)" strokeWidth={2.5} />
            </div>
            <div>
              <div className="login-benefit-title">SECURE ACCESS</div>
              <div className="login-benefit-desc">
                Access the platform through its existing authentication system.
              </div>
            </div>
          </div>

          <div className="login-benefit-card">
            <div className="login-benefit-icon-wrapper">
              <CheckCircle2 size={18} color="var(--text-primary)" strokeWidth={2.5} />
            </div>
            <div>
              <div className="login-benefit-title">ACCOUNTABLE RESOLUTION</div>
              <div className="login-benefit-desc">
                Keep complaint progress visible to authorized users.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
