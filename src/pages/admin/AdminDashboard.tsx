import React, { useEffect, useState } from 'react';
import { Complaint } from '../../types';
import { complaintRepository } from '../../services/complaints/localStorageRepository';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { ComplaintTable } from '../../components/complaints/ComplaintTable';
import { AnalyticsCharts } from '../../components/dashboard/Charts/AnalyticsCharts';
import { StatusUpdateModal } from '../../components/complaints/StatusUpdateModal';
import { AssignDepartmentModal } from '../../components/complaints/AssignDepartmentModal';
import { Button } from '../../components/ui/Button';
import {
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NavigationPage } from '../../components/layout/Sidebar';
import { getUserDisplayName } from '../../utils/userProfile';

interface AdminDashboardProps {
  onNavigate?: (page: NavigationPage) => void;
  onViewDetails?: (complaint: Complaint) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onViewDetails
}) => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { addToast } = useNotification();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeModalComplaint, setActiveModalComplaint] = useState<Complaint | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await complaintRepository.getAllComplaints();
      setComplaints(data);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load central complaints.';
      setError(msg);
      console.error('Error loading complaints in AdminDashboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatusTrigger = (c: Complaint) => {
    setActiveModalComplaint(c);
    setIsStatusModalOpen(true);
  };

  const handleAssignDeptTrigger = (c: Complaint) => {
    setActiveModalComplaint(c);
    setIsAssignModalOpen(true);
  };

  const handleComplaintUpdated = (updated: Complaint) => {
    setComplaints(prev => prev.map(item => (item.id === updated.id ? updated : item)));
  };

  // Derive real KPI stats
  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'Submitted' || c.status === 'Assigned').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const critical = complaints.filter(c => c.priority === 'Critical').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Admin Header Banner */}
      <div
        className="neo-card"
        style={{
          padding: 'clamp(1.25rem, 3vw, 2rem) clamp(1rem, 2.5vw, 1.75rem)',
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
                marginBottom: '0.35rem'
              }}
            >
              Welcome back, {getUserDisplayName(user, role)} (ADMINISTRATOR)
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-lime-text)',
                backgroundColor: 'var(--accent-lime)',
                padding: '0.15rem 0.5rem',
                border: '1.5px solid var(--border-color)',
                borderRadius: '3px',
                fontWeight: 800,
                display: 'inline-block',
                marginBottom: '0.4rem'
              }}
            >
              ADMINISTRATIVE CENTRAL CONSOLE
            </div>
            <h1
              className="font-heading"
              style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.1rem)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.035em',
                lineHeight: 1.15
              }}
            >
              Campus Operations.
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                marginTop: '0.35rem'
              }}
            >
              Review issues. Assign ownership. Drive resolution.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', width: '100%', maxWidth: 'max-content' }} className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              onClick={() => (onNavigate ? onNavigate('admin-analytics') : navigate('/admin/analytics'))}
              leftIcon={<Download size={15} />}
              className="w-full sm:w-auto"
            >
              Analytics View
            </Button>
          </div>
        </div>
      </div>

      {/* Permission / Error Alert Banner */}
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
                {error.includes('403') || error.toLowerCase().includes('forbidden') || error.toLowerCase().includes('administrative')
                  ? 'Access Denied: Administrator Privilege Required (403)'
                  : 'Unable to Load Central Repository'}
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

      {/* KPI Cards Row (5 Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
          gap: 'clamp(0.75rem, 1.5vw, 1.1rem)'
        }}
      >
        <KpiCard
          label="Total Incidents"
          value={total}
          indicatorText="Across all departments"
          icon={<FileText size={18} />}
          accentBar="blue"
        />

        <KpiCard
          label="Pending Review"
          value={pending}
          indicatorText="Awaiting department routing"
          icon={<Clock size={18} />}
          accentBar="orange"
        />

        <KpiCard
          label="In Progress"
          value={inProgress}
          indicatorText="Active engineer assignments"
          icon={<RefreshCw size={18} />}
          accentBar="lime"
        />

        <KpiCard
          label="Resolved"
          value={resolved}
          indicatorText={`${total > 0 ? Math.round((resolved / total) * 100) : 0}% total closure rate`}
          icon={<CheckCircle2 size={18} />}
          accentBar="lime"
        />

        <KpiCard
          label="Critical Priority"
          value={critical}
          indicatorText="High-urgency campus tickets"
          icon={<AlertTriangle size={18} />}
          accentBar="red"
        />
      </div>

      {/* Visual Analytics Charts Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h2
          className="font-heading"
          style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}
        >
          Operations Analytics & Diagnostics
        </h2>
        <AnalyticsCharts complaints={complaints} />
      </div>

      {/* Complete Complaint Management Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2
              className="font-heading"
              style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}
            >
              Master Incident Register
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Complete triage, department routing, and lifecycle transitions
            </p>
          </div>

          <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing <strong>{complaints.length}</strong> incidents
          </span>
        </div>

        <ComplaintTable
          complaints={complaints}
          isAdmin={true}
          onViewDetails={onViewDetails || ((comp) => navigate(`/admin/complaints/${comp.id}`))}
          onUpdateStatus={handleUpdateStatusTrigger}
          onAssignDept={handleAssignDeptTrigger}
        />
      </div>

      {/* Status & Assignment Modals */}
      <StatusUpdateModal
        complaint={activeModalComplaint}
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setActiveModalComplaint(null);
        }}
        onSuccess={handleComplaintUpdated}
      />

      <AssignDepartmentModal
        complaint={activeModalComplaint}
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setActiveModalComplaint(null);
        }}
        onSuccess={handleComplaintUpdated}
      />
    </div>
  );
};
