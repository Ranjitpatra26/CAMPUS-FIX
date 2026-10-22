import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: 'var(--bg-primary)'
      }}
    >
      <div
        className="neo-card animate-fade-up"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '3rem 2rem',
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
            width: '68px',
            height: '68px',
            backgroundColor: 'var(--accent-orange)',
            border: '3px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-offset)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <AlertTriangle size={36} color="#171717" />
        </div>

        <span
          className="font-mono"
          style={{
            fontSize: '0.85rem',
            fontWeight: 800,
            backgroundColor: 'var(--accent-red)',
            color: '#FFFFFF',
            padding: '0.2rem 0.6rem',
            borderRadius: '3px',
            border: '1.5px solid var(--border-color)'
          }}
        >
          ERROR 404
        </span>

        <h1 className="font-heading" style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.15 }}>
          Page Or Incident Not Found
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5, maxWidth: '440px' }}>
          The URL or ticket path you navigated to does not exist or has been moved. Check the link or return to a valid campus dashboard.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}>
          <Button variant="secondary" onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />}>
            Go Back
          </Button>

          <Button variant="primary" onClick={() => navigate('/')} leftIcon={<Home size={16} />}>
            Public Landing Page
          </Button>

          {user && (
            <Button
              variant="blue"
              onClick={() => navigate(role === 'admin' ? '/admin' : '/student')}
            >
              My Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
