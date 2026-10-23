import React, { useEffect, useState } from 'react';
import { Complaint } from '../../types';
import { complaintRepository } from '../../services/complaints/localStorageRepository';
import { useAuth } from '../../context/AuthContext';
import { ComplaintTable } from '../../components/complaints/ComplaintTable';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { NavigationPage } from '../../components/layout/Sidebar';

interface MyComplaintsPageProps {
  onNavigate?: (page: NavigationPage) => void;
  onViewDetails?: (complaint: Complaint) => void;
}

export const MyComplaintsPage: React.FC<MyComplaintsPageProps> = ({
  onNavigate,
  onViewDetails
}) => {
  const { user } = useAuth();
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
    } catch (err: any) {
      const msg = err?.message || 'Failed to retrieve complaints.';
      setError(msg);
      console.error('Error fetching student complaints:', err);
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
              color: 'var(--accent-blue)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem'
            }}
          >
            STUDENT TICKET REPOSITORY
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
            My Complaints
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Review every campus issue you've reported, status updates, and remarks from administrators.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleNavigateSubmit}
          leftIcon={<PlusCircle size={18} />}
        >
          Submit New Complaint
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
                {error.includes('403') || error.toLowerCase().includes('forbidden')
                  ? 'Access Denied (403 Forbidden)'
                  : 'Unable to Retrieve Complaints'}
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
        isAdmin={false}
        onViewDetails={handleDetailsClick}
      />
    </div>
  );
};
