import React, { useEffect, useState } from 'react';
import { Complaint } from '../../types';
import { complaintRepository } from '../../services/complaints/localStorageRepository';
import { useAuth } from '../../context/AuthContext';
import { ComplaintTable } from '../../components/complaints/ComplaintTable';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
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

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    complaintRepository
      .getMyComplaints(user.id)
      .then(setComplaints)
      .finally(() => setIsLoading(false));
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

      <ComplaintTable
        complaints={complaints}
        isAdmin={false}
        onViewDetails={handleDetailsClick}
      />
    </div>
  );
};
