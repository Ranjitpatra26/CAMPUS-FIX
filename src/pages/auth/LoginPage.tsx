import React, { useState, useEffect } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  CheckCircle,
  Home
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    user,
    role,
    isLoading: isAuthLoading,
    login,
    loginWithCognito,
    isCognitoConfigured,
    callbackError
  } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    if (!email.trim()) {
      setError('College email is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const loggedInUser = await login(email, password);
      addToast('success', 'Welcome to CampusFix', 'Signed in successfully.');
      navigate(loggedInUser.role === 'admin' ? '/admin' : '/student', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: 'var(--bg-primary)'
      }}
    >
      {/* Left Column: Form & Brand */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '2.5rem 3rem',
          maxWidth: '620px',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Navigation Return to Landing */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate('/')}
            className="neo-btn neo-btn-secondary neo-btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={14} />
            <span>Return to Public Landing</span>
          </button>
        </div>

        <div style={{ marginBottom: '1.75rem' }}>
          <BrandLogo size="lg" showTagline />
        </div>

        <div style={{ marginBottom: '1.75rem' }}>
          <h1
            className="font-heading"
            style={{
              fontSize: '2.4rem',
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
              marginTop: '0.5rem',
              lineHeight: 1.5
            }}
          >
            A transparent college complaint platform. Submit issues, track real-time resolution progress, and coordinate directly with campus administration.
          </p>
        </div>



        {/* Cognito Callback Error Notification */}
        {callbackError && (
          <div
            className="neo-card"
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
              <div className="font-heading" style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-red)', marginBottom: '0.25rem' }}>
                Cognito Authentication Notice
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {callbackError}
              </div>
            </div>
          </div>
        )}

        {/* Amazon Cognito SSO Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Button
            type="button"
            variant="blue"
            size="lg"
            onClick={handleCognitoLogin}
            style={{ width: '100%' }}
            leftIcon={<ShieldAlert size={18} />}
            disabled={isPending}
            isLoading={isSubmitting}
          >
            {isSubmitting
              ? 'Connecting to CampusFix SSO...'
              : 'Sign In with CampusFix SSO (Amazon Cognito)'}
          </Button>
          {!isCognitoConfigured && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'center' }}>
              Cognito Hosted UI mode ready. Set User Pool & Client ID in <code>.env</code> to activate live cloud SSO.
            </div>
          )}
        </div>

        {/* Traditional Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div
            className="font-mono"
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>Or Sign In With College Credentials</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          </div>

          <Input
            label="College Email Address"
            type="email"
            required
            placeholder="student@campus.edu"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••••••"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{
                  accentColor: 'var(--accent-lime)',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              <span>Remember this session</span>
            </label>

            <Link
              to="/forgot-password"
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--accent-blue)',
                textDecoration: 'underline'
              }}
            >
              Forgot password?
            </Link>
          </div>

          {error && <p className="neo-error-text">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isPending}
            rightIcon={<ArrowRight size={18} />}
          >
            Sign In to CampusFix
          </Button>

          <div
            style={{
              textAlign: 'center',
              marginTop: '1rem',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)'
            }}
          >
            New to CampusFix?{' '}
            <Link
              to="/register"
              style={{
                color: 'var(--accent-blue)',
                fontWeight: 700,
                textDecoration: 'underline'
              }}
            >
              Create Student Account
            </Link>
          </div>
        </form>
      </div>

      {/* Right Column: Neo-Brutalist Geometric Composition (Desktop only) */}
      <div
        style={{
          flex: '1 1 50%',
          backgroundColor: 'var(--bg-surface-secondary)',
          borderLeft: 'var(--border-width) solid var(--border-color)',
          display: 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="lg:flex"
      >
        <div style={{ position: 'relative', width: '420px', height: '440px' }}>
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              width: '380px',
              height: '380px',
              backgroundColor: 'var(--accent-lime)',
              border: '3px solid var(--border-color)',
              boxShadow: '6px 6px 0px var(--border-color)',
              borderRadius: 'var(--radius-lg)'
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: '50px',
              left: '50px',
              width: '340px',
              backgroundColor: 'var(--bg-surface)',
              border: '3px solid var(--border-color)',
              boxShadow: '8px 8px 0px var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transform: 'rotate(-2deg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                className="font-mono"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  backgroundColor: 'var(--accent-lime)',
                  padding: '0.2rem 0.5rem',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '3px'
                }}
              >
                TICKET #CMP-1001
              </span>
              <span
                className="neo-badge"
                style={{ backgroundColor: 'var(--status-resolved-bg)', color: 'var(--status-resolved-text)' }}
              >
                Resolved
              </span>
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Wi-Fi AP restored in Central Library
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              "Cisco AP-302 hardware replaced. SLA achieved in 14.5 hours."
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '2px dashed var(--border-color)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}
            >
              <CheckCircle size={16} color="var(--status-resolved-text)" />
              <span>Verified by Student Affairs Office</span>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '15px',
              backgroundColor: 'var(--accent-blue)',
              color: '#FFFFFF',
              border: '2.5px solid var(--border-color)',
              boxShadow: '4px 4px 0px var(--border-color)',
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 800,
              fontFamily: 'Space Grotesk, sans-serif',
              transform: 'rotate(4deg)'
            }}
          >
            ⚡ 100% AUDITABLE RESOLUTIONS
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem', maxWidth: '380px' }}>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            Transparent. Fast. Accountable.
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Built with modern Neo-Brutalist design tokens and prepared for enterprise AWS cloud scaling.
          </p>
        </div>
      </div>
    </div>
  );
};
