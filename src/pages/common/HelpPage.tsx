import React from 'react';
import { Card } from '../../components/ui/Card';
import { HelpCircle, PhoneCall, ShieldAlert, Clock, ArrowRight } from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '880px', margin: '0 auto' }}>
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
          KNOWLEDGE BASE & SUPPORT
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
          Help & Campus Escalation
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Guidelines on how campus complaints are triaged, standard turnaround times, and critical emergency hotlines.
        </p>
      </div>

      {/* Emergency Hotlines Card */}
      <Card accentBar="red">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <ShieldAlert size={22} color="var(--accent-red)" />
          <h3 className="font-heading" style={{ fontSize: '1.2rem', margin: 0, color: 'var(--accent-red)' }}>
            Immediate Physical Safety / Emergency Contacts
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          For live electrical fires, gas leaks, water main bursts, or medical emergencies, call immediately:
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem'
          }}
        >
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-surface-secondary)',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Campus Security Control</div>
            <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-red)' }}>
              (555) 019-2000
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>24/7 Gatehouse Dispatch</div>
          </div>

          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-surface-secondary)',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Electrical Substation Emergency</div>
            <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-orange)' }}>
              (555) 019-2004
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>High Voltage Response Unit</div>
          </div>

          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-surface-secondary)',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Campus Health & Ambulance</div>
            <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
              (555) 019-2010
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Infirmary & First Aid</div>
          </div>
        </div>
      </Card>

      {/* SLA & FAQs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
          Frequently Asked Questions
        </h3>

        {[
          {
            q: 'How does the resolution lifecycle work?',
            a: 'Once you submit a complaint, it enters the queue as "Submitted". Operations Administration reviews the issue and assigns it to the designated department ("Assigned"). Technicians begin on-site inspection or procurement ("In Progress"), and when fixed and verified, the ticket is marked "Resolved" with an audit note.'
          },
          {
            q: 'Can a complaint be rejected?',
            a: 'Yes, if a request violates campus cybersecurity policies (e.g., custom firewall openings) or is not actionable. Administrators are required by system rules to enter a mandatory detailed explanation whenever rejecting a ticket.'
          },
          {
            q: 'What is the standard SLA for maintenance issues?',
            a: 'Critical safety issues have an SLA of under 12 hours. IT connectivity issues are targeted within 24 hours. General facility and classroom repairs are handled within 48 hours.'
          },
          {
            q: 'Will my identity be public to all students?',
            a: 'No. Other students cannot view your submitted complaints. Only authenticated campus administration and the assigned department heads have access to verify the incident location.'
          }
        ].map((faq, idx) => (
          <Card key={idx} accentBar="lime">
            <h4 className="font-heading" style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              {faq.q}
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {faq.a}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
