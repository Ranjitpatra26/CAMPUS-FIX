import React from 'react';
import { ComplaintForm } from '../../components/forms/ComplaintForm';
import { Complaint } from '../../types';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface SubmitComplaintPageProps {
  onSuccess?: (complaint: Complaint) => void;
  onCancel?: () => void;
}

export const SubmitComplaintPage: React.FC<SubmitComplaintPageProps> = ({
  onSuccess,
  onCancel
}) => {
  const navigate = useNavigate();

  const handleSuccess = (complaint: Complaint) => {
    if (onSuccess) {
      onSuccess(complaint);
    } else {
      navigate(`/student/complaints/${complaint.id}`);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/student');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button variant="secondary" size="sm" onClick={handleCancel} leftIcon={<ArrowLeft size={16} />}>
          Cancel & Return
        </Button>

        <span
          className="font-mono"
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
        >
          <ShieldCheck size={14} color="var(--accent-lime)" />
          <span>Anonymous Student Identity Protection Active</span>
        </span>
      </div>

      <div
        className="neo-card"
        style={{
          padding: '1.75rem',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
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
            marginBottom: '0.35rem'
          }}
        >
          DIRECT CAMPUS ESCALATION
        </div>
        <h1
          className="font-heading"
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em'
          }}
        >
          Submit a Campus Complaint
        </h1>
        <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Notice a broken lab instrument, facility hazard, Wi-Fi outage, or administrative delay?
          Log the details below to notify campus staff.
        </p>
      </div>

      <ComplaintForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
};
