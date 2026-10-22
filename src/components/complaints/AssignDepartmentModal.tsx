import React, { useState, useEffect } from 'react';
import { Complaint, DepartmentName } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { INITIAL_DEPARTMENTS } from '../../services/mock-data/departments';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { complaintRepository } from '../../services/complaints/localStorageRepository';

interface AssignDepartmentModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Complaint) => void;
}

export const AssignDepartmentModal: React.FC<AssignDepartmentModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { addToast } = useNotification();

  const [selectedDept, setSelectedDept] = useState<DepartmentName>(
    complaint?.department || 'IT Services'
  );

  const currentDeptInfo = INITIAL_DEPARTMENTS.find(d => d.name === selectedDept);
  const [assignedStaff, setAssignedStaff] = useState<string>(
    complaint?.assignedTo || currentDeptInfo?.headName || ''
  );
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (complaint && isOpen) {
      const initialDept = complaint.department || 'IT Services';
      setSelectedDept(initialDept);
      const info = INITIAL_DEPARTMENTS.find(d => d.name === initialDept);
      setAssignedStaff(complaint.assignedTo || info?.headName || '');
      setNotes('');
      setError(null);
    }
  }, [complaint?.id, isOpen]);

  if (!complaint) return null;

  const handleDeptSelect = (deptName: DepartmentName) => {
    setSelectedDept(deptName);
    const info = INITIAL_DEPARTMENTS.find(d => d.name === deptName);
    if (info) {
      setAssignedStaff(info.headName);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!assignedStaff.trim()) {
      setError('Please specify the staff member or engineer in charge.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updated = await complaintRepository.assignComplaint(
        complaint.id,
        selectedDept,
        assignedStaff.trim(),
        user,
        notes
      );
      addToast(
        'success',
        'Department Assigned',
        `Ticket ${complaint.id} routed to ${selectedDept}.`
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign department');
    } finally {
      setIsLoading(false);
    }
  };

  const deptOptions = INITIAL_DEPARTMENTS.map(d => ({
    value: d.name,
    label: `${d.name} (SLA: ${d.slaHours}h)`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Department: ${complaint.id}`}
      subtitle={`Category: ${complaint.category} • Location: ${complaint.location}`}
      maxWidth="md"
    >
      <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Select
          label="Target Department"
          required
          options={deptOptions}
          value={selectedDept}
          onChange={e => handleDeptSelect(e.target.value as DepartmentName)}
        />

        <Input
          label="Assignee / Staff Officer"
          required
          value={assignedStaff}
          onChange={e => setAssignedStaff(e.target.value)}
          placeholder="e.g. Eng. Sarah Jenkins"
          helperText={currentDeptInfo ? `Primary contact: ${currentDeptInfo.email}` : undefined}
        />

        <Textarea
          label="Internal Assignment Instruction"
          placeholder="e.g. High priority safety inspection needed before Friday laboratory practicals."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          maxLength={300}
          currentLength={notes.length}
        />

        {error && <p className="neo-error-text">{error}</p>}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1.5px solid var(--border-subtle)'
          }}
        >
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="blue" isLoading={isLoading}>
            Confirm Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
