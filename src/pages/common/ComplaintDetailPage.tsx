import React, { useState, useEffect } from 'react';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/complaints/StatusBadge';
import { PriorityBadge } from '../../components/complaints/PriorityBadge';
import { StatusTimeline } from '../../components/complaints/StatusTimeline';
import { Button } from '../../components/ui/Button';
import { StatusUpdateModal } from '../../components/complaints/StatusUpdateModal';
import { AssignDepartmentModal } from '../../components/complaints/AssignDepartmentModal';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../services/complaints/localStorageRepository';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Building,
  RefreshCw,
  UserCheck,
  FileText,
  AlertCircle
} from 'lucide-react';
import { formatStudentDisplayName } from '../../utils/userProfile';

interface ComplaintDetailPageProps {
  complaint?: Complaint;
  onBack?: () => void;
  onComplaintUpdated?: (updated: Complaint) => void;
}

export const ComplaintDetailPage: React.FC<ComplaintDetailPageProps> = ({
  complaint: initialComplaint,
  onBack,
  onComplaintUpdated
}) => {
  const { role, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<Complaint | null>(initialComplaint || null);
  const [isLoading, setIsLoading] = useState(!initialComplaint);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  useEffect(() => {
    if (initialComplaint) {
      setComplaint(initialComplaint);
      setIsLoading(false);
    } else if (id) {
      setIsLoading(true);
      complaintRepository.getComplaintById(id).then(data => {
        setComplaint(data);
        setIsLoading(false);
      });
    }
  }, [id, initialComplaint]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(role === 'admin' ? '/admin/complaints' : '/student/complaints');
    }
  };

  const handleUpdated = (updated: Complaint) => {
    setComplaint(updated);
    if (onComplaintUpdated) {
      onComplaintUpdated(updated);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading complaint record...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="neo-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h3 className="font-heading" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          Ticket Not Found
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          The requested ticket does not exist in the local repository.
        </p>
        <Button variant="secondary" onClick={handleBack} leftIcon={<ArrowLeft size={16} />}>
          Return to Incident Register
        </Button>
      </div>
    );
  }

  // Enforce student view isolation: Unauthenticated users or students viewing other students' tickets are blocked
  if (!user || (role === 'student' && complaint.studentId !== user.id)) {
    return (
      <div className="neo-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <h3 className="font-heading" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--accent-red)' }}>
          Access Restricted
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          This incident record was submitted by another student and is protected by campus identity privacy rules.
        </p>
        <Button variant="secondary" onClick={handleBack} leftIcon={<ArrowLeft size={16} />}>
          {role === 'student' ? 'Return to My Complaints' : 'Return to Incidents'}
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back button and quick actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBack}
          leftIcon={<ArrowLeft size={16} />}
        >
          Back to Complaints
        </Button>

        {role === 'admin' && (
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <Button
              variant="blue"
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              leftIcon={<UserCheck size={16} />}
            >
              Route Department
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsStatusModalOpen(true)}
              leftIcon={<RefreshCw size={16} />}
            >
              Update Status
            </Button>
          </div>
        )}
      </div>

      {/* Main Ticket Banner Card */}
      <div
        className="neo-card"
        style={{
          padding: '1.75rem',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              className="font-mono"
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                backgroundColor: 'var(--accent-lime)',
                color: '#171717',
                padding: '0.25rem 0.65rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '2px 2px 0px var(--border-color)'
              }}
            >
              {complaint.id}
            </span>

            <span
              className="font-mono"
              style={{
                fontSize: '0.85rem',
                backgroundColor: 'var(--bg-surface-secondary)',
                padding: '0.3rem 0.6rem',
                border: '1.5px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)'
              }}
            >
              {complaint.category}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <h2
          className="font-heading"
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.85rem',
            lineHeight: 1.25
          }}
        >
          {complaint.title}
        </h2>

        {/* Location & Metadata Pill Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            paddingTop: '0.75rem',
            borderTop: '1.5px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={16} color="var(--accent-blue)" />
            <span>{complaint.location}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <span>Submitted {formatDate(complaint.createdAt)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <User size={16} color="var(--text-muted)" />
            <span>
              {formatStudentDisplayName(complaint.studentName, complaint.studentEmail)} ({complaint.studentDepartment})
            </span>
          </div>

          {complaint.department && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building size={16} color="var(--accent-orange)" />
              <span>Dept: {complaint.department}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description & Admin Remarks Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Left Column: Detailed Description & Attachments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="neo-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
            <h3
              className="font-heading"
              style={{
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '1rem',
                color: 'var(--text-secondary)'
              }}
            >
              Detailed Problem Description
            </h3>

            <p
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }}
            >
              {complaint.description}
            </p>

            {complaint.attachment && (
              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1.5px solid var(--border-subtle)'
                }}
              >
                <div
                  className="font-mono"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem'
                  }}
                >
                  Attachment Evidence
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-secondary)'
                  }}
                >
                  <FileText size={20} color="var(--accent-blue)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {complaint.attachment.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {complaint.attachment.size} • Verified Mock Upload
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Administrator Remarks Panel */}
          {complaint.adminRemarks && (
            <div
              className="neo-card"
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-surface)',
                borderLeft: '6px solid var(--accent-blue)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}
              >
                <AlertCircle size={20} color="var(--accent-blue)" />
                <h3
                  className="font-heading"
                  style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}
                >
                  Administrator Remarks
                </h3>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: '1rem',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.925rem',
                  lineHeight: 1.5,
                  color: 'var(--text-primary)'
                }}
              >
                {complaint.adminRemarks}
              </div>

              {complaint.assignedTo && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.825rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Assigned Staff: <strong>{complaint.assignedTo}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Status Timeline & Audit Trail */}
        <div>
          <StatusTimeline complaint={complaint} />
        </div>
      </div>

      {/* Admin Modals */}
      <StatusUpdateModal
        complaint={complaint}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSuccess={handleUpdated}
      />

      <AssignDepartmentModal
        complaint={complaint}
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={handleUpdated}
      />
    </div>
  );
};
