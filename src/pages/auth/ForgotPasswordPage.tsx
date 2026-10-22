import React, { useState } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail, CheckCircle2, Cloud } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      addToast('error', 'Validation Error', 'Please enter a valid college email address.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      addToast('info', 'Cognito Simulation', 'Password reset dispatch simulated.');
    }, 400);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        backgroundColor: 'var(--bg-primary)'
      }}
    >
      <div
        className="neo-card animate-fade-up"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '2.5rem 2.25rem',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate('/login')}
            className="neo-btn neo-btn-secondary neo-btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <BrandLogo size="md" showTagline={false} />
          <h2
            className="font-heading"
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              marginTop: '1.25rem',
              marginBottom: '0.35rem',
              color: 'var(--text-primary)'
            }}
          >
            Reset Your Password
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Enter your registered college email to receive a secure recovery code.
          </p>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: 'var(--accent-lime)',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-offset)'
              }}
            >
              <CheckCircle2 size={32} color="#171717" />
            </div>

            <h3 className="font-heading" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              Reset Link Dispatched
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              If an account exists for <strong>{email}</strong>, recovery instructions have been sent.
            </p>

            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1.5px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                <Cloud size={14} color="var(--accent-blue)" />
                <span>AWS Cloud Notice:</span>
              </div>
              In Phase 2, this workflow calls Amazon Cognito <code>ForgotPassword</code> API and delivers a cryptographically signed code via Amazon SES.
            </div>

            <Button variant="primary" onClick={() => navigate('/login')} style={{ marginTop: '0.5rem' }}>
              Return to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="College Email Address"
              type="email"
              required
              placeholder="student@campus.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              leftIcon={<Mail size={16} />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight size={18} />}
            >
              Send Recovery Instructions
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
