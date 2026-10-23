import React, { useEffect, useState } from 'react';
import { Complaint } from '../../types';
import { complaintRepository } from '../../services/complaints/localStorageRepository';
import { ComplaintTable } from '../../components/complaints/ComplaintTable';
import { StatusUpdateModal } from '../../components/complaints/StatusUpdateModal';
import { AssignDepartmentModal } from '../../components/complaints/AssignDepartmentModal';
import { Button } from '../../components/ui/Button';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

interface AllComplaintsPageProps {
  onViewDetails?: (complaint: Complaint) => void;
}

export const AllComplaintsPage: React.FC<AllComplaintsPageProps> = ({ onViewDetails }) => {
  const navigate = useNavigate();
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
      const list = await complaintRepository.getAllComplaints();
      setComplaints(list);
    } catch (err: any) {
      const msg = err?.message || 'Failed to retrieve central complaints.';
      setError(msg);
      console.error('Error loading complaints in AllComplaintsPage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = (c: Complaint) => {
    setActiveModalComplaint(c);
    setIsStatusModalOpen(true);
  };

  const handleAssignDept = (c: Complaint) => {
    setActiveModalComplaint(c);
    setIsAssignModalOpen(true);
  };

  const handleUpdated = (updated: Complaint) => {
    setComplaints(prev => prev.map(item => (item.id === updated.id ? updated : item)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        className="neo-card"
        style={{
          padding: '2rem 1.75rem',
          backgroundColor: 'var(--bg-surface)',
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
              marginBottom: '0.25rem'
            }}
          >
            CENTRAL REPOSITORY
          </div>
          <h1
            className="font-heading"
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em'
            }}
          >
            All Campus Complaints
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Full triage table with real-time status transitions, department routing, and audit logs.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await complaintRepository.resetToDefaults();
            await loadData();
            addToast('info', 'Reset Completed', 'Reset mock database to initial 16 tickets.');
          }}
          leftIcon={<RotateCcw size={15} />}
        >
          Reset Demo Data
        </Button>
      </div>

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
                  ? 'Access Denied: Administrator Access Required (403)'
                  : 'Unable to Retrieve Central Complaints'}
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

      <ComplaintTable
        complaints={complaints}
        isAdmin={true}
        onViewDetails={onViewDetails || ((comp) => navigate(`/admin/complaints/${comp.id}`))}
        onUpdateStatus={handleUpdateStatus}
        onAssignDept={handleAssignDept}
      />

      <StatusUpdateModal
        complaint={activeModalComplaint}
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setActiveModalComplaint(null);
        }}
        onSuccess={handleUpdated}
      />

      <AssignDepartmentModal
        complaint={activeModalComplaint}
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setActiveModalComplaint(null);
        }}
        onSuccess={handleUpdated}
      />
    </div>
  );
};
