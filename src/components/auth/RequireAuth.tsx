import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { UserRole } from '../../types';
import { getUserDisplayName } from '../../utils/userProfile';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, requiredRole }) => {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If still restoring session, display loading state
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)'
        }}
      >
        <div
          className="neo-card animate-fade-up"
          style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 700 }}>
            Verifying authentication session...
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated, redirect directly to the real Cognito login flow
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but role mismatch, show clean 403 Access Denied
  if (requiredRole && role !== requiredRole) {
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
            maxWidth: '540px',
            width: '100%',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: 'var(--accent-red, #ef4444)',
              border: '2.5px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-offset)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldAlert size={28} color="#FFFFFF" />
          </div>

          <div
            className="font-mono"
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              backgroundColor: 'var(--accent-red, #ef4444)',
              color: '#FFFFFF',
              padding: '0.15rem 0.5rem',
              borderRadius: '2px',
              border: '1.5px solid var(--border-color)'
            }}
          >
            ACCESS DENIED (403)
          </div>

          <h2 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Insufficient Permissions
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
            You are authenticated as <strong>{getUserDisplayName(user, role)}</strong> ({role.toUpperCase()}).
            This section requires verified <strong>{requiredRole.toUpperCase()}</strong> permissions in AWS Cognito.
          </p>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(role === 'admin' ? '/admin' : '/student')}
          >
            Return to My Authorized Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
