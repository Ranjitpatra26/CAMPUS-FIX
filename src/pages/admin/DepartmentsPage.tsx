import React from 'react';
import { INITIAL_DEPARTMENTS } from '../../services/mock-data/departments';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Building2, Clock, Mail, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        className="neo-card"
        style={{
          padding: '2rem 1.75rem',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
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
          Campus Divisions & SLA Matrix
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
          Campus Operational Departments
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Registered divisions responsible for resolution workflows, staffing, and facility maintenance SLAs.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {INITIAL_DEPARTMENTS.map(dept => (
          <Card key={dept.id} accentBar="blue" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 className="font-heading" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  {dept.name}
                </h3>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Head: <strong>{dept.headName}</strong>
                </div>
              </div>

              <span
                className="neo-badge"
                style={{
                  backgroundColor: 'var(--accent-lime)',
                  color: 'var(--accent-lime-text)',
                  fontSize: '0.75rem'
                }}
              >
                SLA: {dept.slaHours}h
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={15} color="var(--accent-blue)" />
                <span>{dept.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={15} color="var(--accent-orange)" />
                <span>{dept.location}</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.5rem',
                borderTop: '1.5px solid var(--border-subtle)',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertCircle size={15} color="var(--accent-orange)" />
                <span>
                  Open Tickets: <strong>{dept.openTickets}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle size={15} color="var(--status-resolved-text)" />
                <span>
                  Resolved: <strong>{dept.resolvedTickets}</strong>
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
