import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, GraduationCap, ArrowRight, Lock, Home } from 'lucide-react';
import { UserRole } from '../../types';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, requiredRole }) => {
  const { user, role, switchRole } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const handleQuickDemo = async (targetRole: UserRole) => {
    await switchRole(targetRole);
    addToast(
      'success',
      'Demo Profile Active',
      `Switched to ${targetRole === 'admin' ? 'Dr. Aris Thorne (Admin)' : 'Rohan Sharma (Student)'}.`
    );
    navigate(targetRole === 'admin' ? '/admin' : '/student');
  };

  // If unauthenticated
  if (!user) {
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
              backgroundColor: 'var(--accent-lime)',
              border: '2.5px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-offset)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Lock size={28} color="#171717" />
          </div>

          <div
            className="font-mono"
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              backgroundColor: 'var(--accent-lime)',
              color: '#171717',
              padding: '0.15rem 0.5rem',
              borderRadius: '2px',
              border: '1.5px solid var(--border-color)'
            }}
          >
            AUTHENTICATION REQUIRED
          </div>

          <h2 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Sign In Or Select Demo Profile
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
            You requested <code>{location.pathname}</code>. Choose an instant demo account or sign in with your college credentials.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleQuickDemo('student')}
              leftIcon={<GraduationCap size={16} />}
            >
              Demo Student
            </Button>

            <Button
              variant="blue"
              size="md"
              onClick={() => handleQuickDemo('admin')}
              leftIcon={<ShieldAlert size={16} />}
            >
              Demo Admin
            </Button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
              Sign In Page
            </Button>

            <Button variant="secondary" size="sm" onClick={() => navigate('/')} leftIcon={<Home size={14} />}>
              Landing Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated but role mismatch
  if (requiredRole && role !== requiredRole) {
    const isDemandingAdmin = requiredRole === 'admin';

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
              backgroundColor: 'var(--accent-orange)',
              border: '2.5px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-offset)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldAlert size={28} color="#171717" />
          </div>

          <div
            className="font-mono"
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              backgroundColor: 'var(--accent-orange)',
              color: '#171717',
              padding: '0.15rem 0.5rem',
              borderRadius: '2px',
              border: '1.5px solid var(--border-color)'
            }}
          >
            {requiredRole.toUpperCase()} PRIVILEGES REQUIRED
          </div>

          <h2 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Role Authorization Notice
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
            You are currently signed in as <strong>{user.name}</strong> ({role.toUpperCase()}).
            This section requires <strong>{requiredRole.toUpperCase()}</strong> permissions. In Demo Mode, you can switch accounts with 1 click:
          </p>

          <Button
            variant={isDemandingAdmin ? 'blue' : 'primary'}
            size="lg"
            onClick={() => handleQuickDemo(requiredRole)}
            rightIcon={<ArrowRight size={18} />}
            style={{ width: '100%' }}
          >
            Switch to {isDemandingAdmin ? 'Administrator Demo (Dr. Aris Thorne)' : 'Student Demo (Rohan Sharma)'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(role === 'admin' ? '/admin' : '/student')}
          >
            Return to My {role === 'admin' ? 'Operations' : 'Student'} Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
