import React, { useEffect, useState } from 'react';
import { Complaint } from '../../types';
import { complaintRepository } from '../../services/complaints/localStorageRepository';
import { AnalyticsCharts } from '../../components/dashboard/Charts/AnalyticsCharts';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BarChart3, TrendingUp, Clock, CheckCircle, ShieldCheck, AlertTriangle } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await complaintRepository.getAllComplaints();
      setComplaints(data);
    } catch (err: any) {
      const msg = err?.message || 'Failed to retrieve analytics data.';
      setError(msg);
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const critical = complaints.filter(c => c.priority === 'Critical').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

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
            color: 'var(--accent-lime-text)',
            backgroundColor: 'var(--accent-lime)',
            padding: '0.15rem 0.5rem',
            border: '1.5px solid var(--border-color)',
            borderRadius: '3px',
            fontWeight: 800,
            display: 'inline-block',
            marginBottom: '0.4rem'
          }}
        >
          PERFORMANCE INTELLIGENCE
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
          Campus Resolution Analytics
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Real-time statistical evaluation of incident resolution velocity, departmental workload, and turnaround times.
        </p>
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
                  : 'Unable to Load Analytics Data'}
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

      {/* KPI Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}
      >
        <KpiCard
          label="Resolution Success"
          value={`${resolutionRate}%`}
          indicatorText="Resolved vs total logged"
          icon={<CheckCircle size={18} />}
          accentBar="lime"
        />
        <KpiCard
          label="Average Triage SLA"
          value="4.2 hrs"
          indicatorText="Submission to department assignment"
          icon={<Clock size={18} />}
          accentBar="blue"
        />
        <KpiCard
          label="Avg Resolution Velocity"
          value="28.5 hrs"
          indicatorText="Target SLA: 48 hours"
          icon={<TrendingUp size={18} />}
          accentBar="orange"
        />
        <KpiCard
          label="Critical Incidents"
          value={critical}
          indicatorText="100% safety tagged"
          icon={<ShieldCheck size={18} />}
          accentBar="red"
        />
      </div>

      {/* Charts */}
      <AnalyticsCharts complaints={complaints} />

      {/* SLA Benchmarks Card */}
      <div className="neo-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
        <h3 className="font-heading" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
          Departmental SLA Health Index
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { dept: 'Electrical Works', score: 94, sla: '12h Target', color: 'var(--accent-lime)' },
            { dept: 'IT Infrastructure', score: 88, sla: '24h Target', color: 'var(--accent-blue)' },
            { dept: 'Sanitation & Health', score: 96, sla: '8h Target', color: 'var(--accent-lime)' },
            { dept: 'Campus Maintenance', score: 82, sla: '48h Target', color: 'var(--accent-orange)' }
          ].map(d => (
            <div key={d.dept} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>{d.dept}</span>
                <span className="font-mono">
                  {d.score}% Compliance ({d.sla})
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '10px',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${d.score}%`,
                    height: '100%',
                    backgroundColor: d.color,
                    transition: 'width 0.5s ease-out'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
