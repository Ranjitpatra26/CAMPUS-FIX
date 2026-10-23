import React, { useEffect, useState } from 'react';
import { Complaint } from '../../types';
import { complaintRepository } from '../../services/complaints/localStorageRepository';
import { useAuth } from '../../context/AuthContext';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { ComplaintTable } from '../../components/complaints/ComplaintTable';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import { NavigationPage } from '../../components/layout/Sidebar';
import { getUserDisplayName, isUuidString } from '../../utils/userProfile';

interface StudentDashboardProps {
  onNavigate?: (page: NavigationPage) => void;
  onViewDetails?: (complaint: Complaint) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onViewDetails
}) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await complaintRepository.getMyComplaints(user.id);
      setComplaints(data);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load complaints from backend.';
      setError(msg);
      console.error('Error loading student complaints:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleNavigateSubmit = () => {
    if (onNavigate) {
      onNavigate('student-submit');
    } else {
      navigate('/student/submit');
    }
  };

  const handleDetailsClick = (c: Complaint) => {
    if (onViewDetails) {
      onViewDetails(c);
    } else {
      navigate(`/student/complaints/${c.id}`);
    }
  };

  // Derived real figures
  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'Submitted' || c.status === 'Assigned').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Student Header */}
      <div
        className="neo-card"
        style={{
          padding: '2rem 1.75rem',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
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
              Welcome back, {getUserDisplayName(user, role)} ({user?.studentId && !isUuidString(user.studentId) ? user.studentId : 'STUDENT'})
            </div>
            <h1
              className="font-heading"
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1.15
              }}
            >
              Your Campus, Your Voice.
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                marginTop: '0.35rem'
              }}
            >
              Track your complaints. Follow every update. Make a difference.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleNavigateSubmit}
            leftIcon={<PlusCircle size={20} />}
          >
            Submit Complaint
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem'
        }}
      >
        <KpiCard
          label="Total Complaints"
          value={total}
          indicatorText={`${total} submitted tickets`}
          icon={<FileText size={18} />}
          accentBar="blue"
        />

        <KpiCard
          label="Pending Review"
          value={pending}
          indicatorText="Awaiting department triage"
          icon={<Clock size={18} />}
          accentBar="orange"
        />

        <KpiCard
          label="In Progress"
          value={inProgress}
          indicatorText="Under active investigation"
          icon={<RefreshCw size={18} />}
          accentBar="lime"
        />

        <KpiCard
          label="Resolved"
          value={resolved}
          indicatorText={`${total > 0 ? Math.round((resolved / total) * 100) : 0}% success rate`}
          icon={<CheckCircle2 size={18} />}
          accentBar="lime"
        />
      </div>

      {/* Error / Permission Banner */}
      {error && (
        <div
          className="neo-card"
          role="alert"
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--accent-red-subtle, rgba(239, 68, 68, 0.1))',
            borderLeft: '5px solid var(--accent-red, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            color: 'var(--text-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} style={{ color: 'var(--accent-red, #ef4444)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {error.includes('403') || error.toLowerCase().includes('forbidden')
                  ? 'Access Denied (403 Forbidden)'
                  : 'Unable to Load Complaints'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {error}
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={loadData}>
            Retry
          </Button>
        </div>
      )}

      {/* Complaints Table Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2
              className="font-heading"
              style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}
            >
              Your Recent Tickets
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              All tickets submitted under your student account
            </p>
          </div>

          <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Total: <strong>{complaints.length}</strong>
          </span>
        </div>

        <ComplaintTable
          complaints={complaints}
          isAdmin={false}
          onViewDetails={handleDetailsClick}
        />
      </div>
    </div>
  );
};
