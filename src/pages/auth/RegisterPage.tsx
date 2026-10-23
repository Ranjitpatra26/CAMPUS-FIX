import React, { useState } from 'react';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Info, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const departments = [
    'Computer Science & Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Biotechnology',
    'Civil Engineering',
    'Chemical Engineering',
    'Business & Management',
    'Applied Sciences'
  ];

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = 'Full name is required.';
    if (!email.trim()) {
      errs.email = 'College email is required.';
    } else if (!email.includes('@')) {
      errs.email = 'Please provide a valid college email address.';
    }

    if (!studentId.trim()) errs.studentId = 'Student ID is required.';
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      await register({
        name,
        email,
        studentId,
        department,
        password
      });
      addToast('success', 'Account Registered!', 'Welcome to CampusFix. Your student profile is active.');
      navigate('/student');
    } catch (err: any) {
      setErrors({ form: err?.message || 'Registration failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        backgroundColor: 'var(--bg-primary)'
      }}
    >
      <div
        className="neo-card animate-fade-up"
        style={{
          width: '100%',
          maxWidth: '580px',
          padding: '2.5rem 2.25rem',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate('/')}
            className="neo-btn neo-btn-secondary neo-btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={14} />
            <span>Return to Public Landing</span>
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <BrandLogo size="md" showTagline />
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
            Create Student Account
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Register your student credentials to log complaints and receive resolution notifications.
          </p>
        </div>

        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--bg-surface-secondary)',
            border: '1.5px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.45,
            marginBottom: '1.25rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start'
          }}
        >
          <Info size={16} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Registrations create verified <strong>Student accounts</strong>. Administrator privileges are granted through institutional authorization groups.
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Full Name"
            required
            placeholder="e.g. Maya Lin"
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
            }}
            error={errors.name}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem'
            }}
          >
            <Input
              label="College Email"
              type="email"
              required
              placeholder="maya.lin@campus.edu"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              error={errors.email}
            />

            <Input
              label="Student ID"
              required
              placeholder="e.g. CS-2024-089"
              value={studentId}
              onChange={e => {
                setStudentId(e.target.value);
                if (errors.studentId) setErrors(prev => ({ ...prev, studentId: '' }));
              }}
              error={errors.studentId}
            />
          </div>

          <Select
            label="Enrolled Department"
            required
            options={departments.map(d => ({ value: d, label: d }))}
            value={department}
            onChange={e => setDepartment(e.target.value)}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem'
            }}
          >
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••••••"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
              error={errors.password}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }}
              error={errors.confirmPassword}
            />
          </div>

          {errors.form && <p className="neo-error-text">{errors.form}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight size={18} />}
            style={{ marginTop: '0.5rem' }}
          >
            Register Student Profile
          </Button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              marginTop: '1rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}
          >
            <span>Already registered?</span>
            <Link
              to="/login"
              style={{
                color: 'var(--accent-blue)',
                fontWeight: 700,
                textDecoration: 'underline'
              }}
            >
              Sign In Here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
