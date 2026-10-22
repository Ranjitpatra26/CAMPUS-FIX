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
  RotateCcw,
  Download
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { NavigationPage } from '../../components/layout/Sidebar';

interface AdminDashboardProps {
  onNavigate?: (page: NavigationPage) => void;
  onViewDetails?: (complaint: Complaint) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onViewDetails
}) => {
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeModalComplaint, setActiveModalComplaint] = useState<Complaint | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await complaintRepository.getAllComplaints();
      setComplaints(data);
    } catch (e) {
      console.error(e);
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

  const handleResetData = async () => {
    await complaintRepository.resetToDefaults();
    await loadData();
    addToast('info', 'Data Restored', 'Restored default 16 mock complaints with pristine histories.');
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
                fontSize: '2.1rem',
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

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetData}
              leftIcon={<RotateCcw size={15} />}
              title="Reset mock data to initial 16 tickets"
            >
              Reset Data
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => (onNavigate ? onNavigate('admin-analytics') : navigate('/admin/analytics'))}
              leftIcon={<Download size={15} />}
            >
              Analytics View
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (5 Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1.1rem'
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
