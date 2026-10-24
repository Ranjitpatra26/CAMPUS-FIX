import React, { useState, useEffect } from 'react';
import { Complaint, ComplaintStatus } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { ALLOWED_TRANSITIONS } from '../../services/complaints/complaintRepository';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { complaintRepository } from '../../services/complaints/localStorageRepository';

interface StatusUpdateModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Complaint) => void;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('In Progress');
  const [remark, setRemark] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validTransitions = complaint ? ALLOWED_TRANSITIONS[complaint.status] || [] : [];

  useEffect(() => {
    if (complaint && isOpen) {
      const transitions = ALLOWED_TRANSITIONS[complaint.status] || [];
      if (transitions.length > 0) {
        setSelectedStatus(transitions[0]);
      }
      setRemark('');
      setError(null);
    }
  }, [complaint?.id, isOpen]);

  if (!complaint) return null;

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (selectedStatus === 'Rejected' && !remark.trim()) {
      setError('A detailed administrative remark is required when rejecting a complaint.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updated = await complaintRepository.updateComplaintStatus(
        complaint.id,
        selectedStatus,
        user,
        remark
      );
      addToast(
        'success',
        'Status Updated',
        `Ticket ${complaint.id} status changed to ${selectedStatus}.`
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update complaint status');
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = validTransitions.map(st => ({
    value: st,
    label: `${st} ${st === 'Rejected' ? '(Requires explanation)' : ''}`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Status: ${complaint.id}`}
      subtitle={`Current Status: ${complaint.status}`}
      maxWidth="md"
    >
      <form onSubmit={handleStatusChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {validTransitions.length === 0 ? (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--accent-orange-surface)',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem'
            }}
          >
            This ticket is in terminal state <strong>{complaint.status}</strong> and cannot transition further.
          </div>
        ) : (
          <>
            <Select
              label="Select Next Status"
              required
              options={statusOptions}
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value as ComplaintStatus);
                setError(null);
              }}
            />

            <Textarea
              label="Administrative Remark / Reason"
              required={selectedStatus === 'Rejected'}
              helperText={
                selectedStatus === 'Rejected'
                  ? 'Mandatory reason for rejection (visible to student)'
                  : 'Optional note documenting actions taken or equipment ordered'
              }
              placeholder="e.g. Electrician scheduled for inspection tomorrow morning, replacement components requisitioned."
              value={remark}
              onChange={e => {
                setRemark(e.target.value);
                if (error) setError(null);
              }}
              rows={4}
              maxLength={500}
              currentLength={remark.length}
            />

            {error && <p className="neo-error-text">{error}</p>}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.5rem',
                paddingTop: '1rem',
                borderTop: '1.5px solid var(--border-subtle)',
                flexWrap: 'wrap'
              }}
              className="flex-col-reverse sm:flex-row"
            >
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full sm:w-auto"
              >
                Apply Status Change
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};
