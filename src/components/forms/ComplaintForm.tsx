import React, { useState } from 'react';
import {
  ComplaintCategory,
  ComplaintPriority,
  CreateComplaintInput,
  DepartmentName,
  Complaint,
  AttachmentPlaceholder
} from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { complaintRepository } from '../../services/complaints/localStorageRepository';
import { INITIAL_DEPARTMENTS } from '../../services/mock-data/departments';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  FileCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface ComplaintFormProps {
  onSuccess: (complaint: Complaint) => void;
  onCancel?: () => void;
}

export const ComplaintForm: React.FC<ComplaintFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { addToast } = useNotification();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('IT and Wi-Fi');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [location, setLocation] = useState('');
  const [department, setDepartment] = useState<string>('auto');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<AttachmentPlaceholder | undefined>(undefined);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  const categories: ComplaintCategory[] = [
    'IT and Wi-Fi',
    'Laboratory Equipment',
    'Electrical Maintenance',
    'Classroom Facilities',
    'Sanitation',
    'Administration',
    'Fees and Accounts',
    'Other'
  ];

  const priorities: ComplaintPriority[] = ['Low', 'Medium', 'High', 'Critical'];

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = 'Complaint title is required.';
    } else if (title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters long.';
    } else if (title.trim().length > 120) {
      errs.title = 'Title must not exceed 120 characters.';
    }

    if (!location.trim()) {
      errs.location = 'Please specify the building, room, or campus area.';
    } else if (location.trim().length > 100) {
      errs.location = 'Location must not exceed 100 characters.';
    }

    if (!description.trim()) {
      errs.description = 'Please provide detailed context about the problem.';
    } else if (description.trim().length < 20) {
      errs.description = 'Description must be at least 20 characters for technicians to evaluate.';
    } else if (description.trim().length > 1500) {
      errs.description = 'Description must not exceed 1500 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSimulatedAttachment = () => {
    if (attachment) {
      setAttachment(undefined);
    } else {
      setAttachment({
        id: `att-${Date.now()}`,
        name: `campus_incident_evidence_${Math.floor(Math.random() * 900 + 100)}.png`,
        size: '2.4 MB',
        type: 'image/png'
      });
      addToast('info', 'File Attached', 'Mock image evidence attached to complaint ticket.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validate()) {
      addToast('error', 'Form Error', 'Please correct the highlighted fields before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Map department if manually selected or let admin assign
      const deptName: DepartmentName | undefined =
        department !== 'auto' ? (department as DepartmentName) : undefined;

      const input: CreateComplaintInput = {
        title,
        category,
        priority,
        location,
        department: deptName,
        description,
        attachment
      };

      const newComplaint = await complaintRepository.createComplaint(input, user);

      // Trigger celebratory confetti effect
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C8F169', '#3155E7', '#171717']
        });
      } catch {
        // Fallback if canvas-confetti environment restricts
      }

      setSubmittedComplaint(newComplaint);
      addToast(
        'success',
        'Complaint Submitted!',
        `Your ticket ${newComplaint.id} has been registered.`
      );
    } catch (err: any) {
      const msg = err?.message || 'Failed to submit complaint.';
      setErrors({ form: msg });
      addToast('error', 'Submission Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If submitted, show distinctive Neo-Brutalist confirmation card
  if (submittedComplaint) {
    return (
      <div
        className="neo-card animate-fade-up"
        style={{
          padding: '2.5rem 2rem',
          maxWidth: '680px',
          margin: '0 auto',
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            backgroundColor: 'var(--accent-lime)',
            border: 'var(--border-width-lg) solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-offset)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}
        >
          <CheckCircle2 size={40} color="#171717" strokeWidth={2.5} />
        </div>

        <span
          className="font-mono"
          style={{
            backgroundColor: 'var(--accent-lime)',
            color: '#171717',
            padding: '0.3rem 0.8rem',
            borderRadius: '4px',
            fontWeight: 800,
            fontSize: '1.1rem',
            border: '2px solid var(--border-color)',
            boxShadow: '2px 2px 0px var(--border-color)',
            display: 'inline-block',
            marginBottom: '1rem'
          }}
        >
          {submittedComplaint.id}
        </span>

        <h2
          className="font-heading"
          style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem' }}
        >
          Complaint Submitted!
        </h2>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            maxWidth: '480px',
            margin: '0 auto 1.75rem auto',
            lineHeight: 1.5
          }}
        >
          Your complaint <strong>"{submittedComplaint.title}"</strong> has been logged into the campus queue.
          The operations administration will review and route it to the appropriate maintenance department.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <Button
            variant="secondary"
            onClick={() => {
              setSubmittedComplaint(null);
              setTitle('');
              setDescription('');
              setLocation('');
              setAttachment(undefined);
            }}
          >
            Submit Another Complaint
          </Button>

          <Button
            variant="primary"
            onClick={() => onSuccess(submittedComplaint)}
            rightIcon={<ArrowRight size={16} />}
          >
            Track Complaint Status
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        className="neo-card"
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <h3
          className="font-heading"
          style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}
        >
          1. Issue Overview
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Complaint Title"
            required
            maxLength={120}
            placeholder="e.g. Broken microscope mechanical stage in Biology Lab 3"
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
            }}
            error={errors.title}
            helperText="Provide a concise, specific summary of the incident (max 120 chars)."
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
              gap: '1rem'
            }}
          >
            <Select
              label="Category"
              required
              options={categories.map(c => ({ value: c, label: c }))}
              value={category}
              onChange={e => setCategory(e.target.value as ComplaintCategory)}
            />

            <Select
              label="Priority Level"
              required
              options={priorities.map(p => ({
                value: p,
                label: `${p} ${p === 'Critical' ? '(Immediate Safety Risk)' : ''}`
              }))}
              value={priority}
              onChange={e => setPriority(e.target.value as ComplaintPriority)}
              helperText="Critical priority triggers urgent staff notifications."
            />
          </div>

          <Input
            label="Building / Location"
            required
            maxLength={100}
            placeholder="e.g. Tech Tower Block B, Room 204 or East Wing Stairs"
            value={location}
            onChange={e => {
              setLocation(e.target.value);
              if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
            }}
            error={errors.location}
          />

          <Select
            label="Direct Department Routing (Optional)"
            options={[
              { value: 'auto', label: 'Automatic Routing (Determined by Admin)' },
              ...INITIAL_DEPARTMENTS.map(d => ({ value: d.name, label: d.name }))
            ]}
            value={department}
            onChange={e => setDepartment(e.target.value)}
            helperText="Leave as Automatic unless you specifically know the handling division."
          />
        </div>
      </div>

      <div
        className="neo-card"
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <h3
          className="font-heading"
          style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}
        >
          2. Detailed Description & Evidence
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Textarea
            label="Detailed Description"
            required
            rows={5}
            maxLength={1000}
            currentLength={description.length}
            placeholder="Explain what happened, what equipment or area is affected, how long this issue has persisted, and any safety hazards..."
            value={description}
            onChange={e => {
              setDescription(e.target.value);
              if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
            }}
            error={errors.description}
          />

          {/* Attachment Box Placeholder */}
          <div>
            <label className="neo-label" style={{ marginBottom: '0.4rem' }}>
              Photo or Document Attachment (Optional)
            </label>

            <div
              onClick={handleSimulatedAttachment}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                backgroundColor: attachment
                  ? 'var(--status-resolved-bg)'
                  : 'var(--bg-surface-secondary)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {attachment ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                  <FileCheck size={24} color="var(--status-resolved-text)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {attachment.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {attachment.size} • Click to remove
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <UploadCloud size={28} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Click to attach mock photo / evidence file
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Simulates AWS S3 presigned attachment (PNG, JPG, PDF up to 10MB)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {errors.form && (
        <div
          style={{
            padding: '0.85rem',
            backgroundColor: 'var(--accent-red-surface)',
            color: 'var(--accent-red)',
            border: '2px solid var(--accent-red)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          {errors.form}
        </div>
      )}

      {/* Form Action Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '0.5rem',
          flexWrap: 'wrap'
        }}
        className="flex-col-reverse sm:flex-row"
      >
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight size={18} />}
          className="w-full sm:w-auto"
        >
          Submit Complaint
        </Button>
      </div>
    </form>
  );
};
