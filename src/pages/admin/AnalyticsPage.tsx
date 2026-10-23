import React, { useEffect, useMemo, useState } from 'react';
import { Complaint } from '../../types';
import { complaintRepository } from '../../services/complaints/localStorageRepository';
import { AnalyticsCharts } from '../../components/dashboard/Charts/AnalyticsCharts';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { Button } from '../../components/ui/Button';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  FileSpreadsheet,
  Download,
  Printer
} from 'lucide-react';
import {
  calculateAnalyticsSummary,
  formatHours,
  formatPercentage
} from '../../utils/analytics';
import {
  generateAnalyticsSummaryCsv,
  generateComplaintRegisterCsv,
  downloadCsvFile,
  triggerPrintReport
} from '../../utils/exportReport';

export const AnalyticsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await complaintRepository.getAnalyticsComplaints();
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

  // Compute verified pure statistics from real complaints
  const summary = useMemo(() => calculateAnalyticsSummary(complaints), [complaints]);

  const reportMetadata = useMemo(() => {
    const now = new Date();
    return {
      reportId: `CFX-ANL-${now.toISOString().slice(0, 10).replace(/-/g, '')}`,
      generatedAtStr: now.toUTCString()
    };
  }, [complaints]);

  const handleExportSummaryCsv = () => {
    const csv = generateAnalyticsSummaryCsv(summary);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCsvFile(csv, `campusfix-analytics-summary-${dateStr}.csv`);
  };

  const handleExportRegisterCsv = () => {
    const csv = generateComplaintRegisterCsv(complaints);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCsvFile(csv, `campusfix-complaint-register-${dateStr}.csv`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Official Executive Print Header (Visible strictly in Print / PDF mode) */}
      <div
        className="print-only"
        style={{
          borderBottom: '2.5px solid #171717',
          paddingBottom: '10pt',
          marginBottom: '16pt'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '9pt',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#3155E7',
                marginBottom: '2pt'
              }}
            >
              CAMPUSFIX CENTRAL SYSTEM · EXECUTIVE GOVERNANCE
            </div>
            <h1
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '18pt',
                fontWeight: 800,
                margin: 0,
                color: '#171717',
                lineHeight: 1.2
              }}
            >
              Executive Resolution & SLA Analytics Report
            </h1>
            <p style={{ fontSize: '9pt', color: '#4A4A4A', marginTop: '3pt', margin: 0 }}>
              Official administrative evaluation of operational turnaround, departmental workload, and service level agreements.
            </p>
          </div>
          <div
            style={{
              textAlign: 'right',
              fontFamily: 'monospace',
              fontSize: '8pt',
              lineHeight: 1.4,
              border: '1px solid #171717',
              padding: '4pt 8pt',
              backgroundColor: '#F7F6F2'
            }}
          >
            <div><strong>REPORT ID:</strong> {reportMetadata.reportId}</div>
            <div><strong>GENERATED:</strong> {reportMetadata.generatedAtStr}</div>
            <div><strong>ACCESS:</strong> CONFIDENTIAL — ADMIN ONLY</div>
          </div>
        </div>
      </div>

      {/* Screen Header Banner with Export Actions */}
      <div
        className="neo-card"
        style={{
          padding: '2rem 1.75rem',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}
        >
          <div>
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

          {/* Export Action Buttons (Consistent Neo-Brutalist styling, hidden in print) */}
          <div
            className="no-print"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.65rem',
              alignItems: 'center'
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportSummaryCsv}
              leftIcon={<FileSpreadsheet size={15} />}
              title="Download executive metrics, status distribution, and department SLA performance in CSV"
            >
              Summary CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportRegisterCsv}
              leftIcon={<Download size={15} />}
              title="Download sanitized complaint register without student personal information"
            >
              Register CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={triggerPrintReport}
              leftIcon={<Printer size={15} />}
              title="Open browser print dialogue to preview or save executive report as PDF"
            >
              Executive PDF
            </Button>
          </div>
        </div>
      </div>

      {isLoading && complaints.length === 0 && !error && (
        <div
          className="neo-card no-print"
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--text-secondary)'
          }}
        >
          <Clock size={18} style={{ color: 'var(--accent-blue)' }} />
          <span>Synchronizing real-time analytics data...</span>
        </div>
      )}

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

      {/* KPI Stats Derived from Real AWS Complaint Records */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}
      >
        <KpiCard
          label="Resolution Success"
          value={formatPercentage(summary.overallResolutionRate)}
          indicatorText={
            summary.totalComplaints > 0
              ? `${summary.statusCounts.Resolved} of ${summary.totalComplaints} resolved`
              : 'No incidents recorded'
          }
          icon={<CheckCircle size={18} />}
          accentBar="lime"
        />
        <KpiCard
          label="Average Triage SLA"
          value={formatHours(summary.averageTriageHours)}
          indicatorText={
            summary.averageTriageHours !== null
              ? 'Submission to assignment'
              : 'No assignment timestamps recorded'
          }
          icon={<Clock size={18} />}
          accentBar="blue"
        />
        <KpiCard
          label="Avg Resolution Velocity"
          value={formatHours(summary.averageResolutionHours)}
          indicatorText={
            summary.averageResolutionHours !== null
              ? (summary.medianResolutionHours !== null
                  ? `Median: ${formatHours(summary.medianResolutionHours)}`
                  : 'Calculated from valid timestamps')
              : 'No resolved tickets with timestamps'
          }
          icon={<TrendingUp size={18} />}
          accentBar="orange"
        />
        <KpiCard
          label="Critical Incidents"
          value={summary.criticalCount}
          indicatorText={
            summary.criticalCount > 0
              ? 'High-urgency campus tickets'
              : 'Zero critical incidents'
          }
          icon={<ShieldCheck size={18} />}
          accentBar="red"
        />
      </div>

      {/* Visual Analytics Charts */}
      <AnalyticsCharts complaints={complaints} />

      {/* Departmental SLA Health Index (Real Calculations from Configured SLAs) */}
      <div className="neo-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
        <h3 className="font-heading" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
          Departmental SLA Health Index
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Target compliance evaluated exclusively from resolved tickets with verified timestamps.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {summary.departmentSlaHealth.map(dept => {
            const hasData = dept.complianceRate !== null;
            const score = dept.complianceRate ?? 0;
            const barColor =
              score >= 80
                ? 'var(--accent-lime)'
                : score >= 50
                ? 'var(--accent-orange)'
                : 'var(--accent-red)';

            return (
              <div key={dept.department} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{dept.department}</span>
                  <span className="font-mono" style={{ color: hasData ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {hasData
                      ? `${score}% Compliance (${dept.targetSlaHours}h Target · ${dept.withinSlaCount}/${dept.resolvedCount} on time)`
                      : `Pending Data (${dept.targetSlaHours}h Target · 0 resolved)`}
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
                      width: hasData ? `${score}%` : '0%',
                      height: '100%',
                      backgroundColor: barColor,
                      transition: 'width 0.5s ease-out'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Workload & Performance Table */}
      <div className="neo-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Briefcase size={20} style={{ color: 'var(--accent-blue)' }} />
          <h3 className="font-heading" style={{ fontSize: '1.15rem' }}>
            Staff Workload & Turnaround Performance
          </h3>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Real-time incident allocation and velocity across technical handlers.
        </p>

        {summary.staffWorkload.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              fontSize: '0.9rem',
              color: 'var(--text-muted)'
            }}
          >
            No complaint assignments recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.85rem'
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface-secondary)'
                  }}
                >
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Handler / Staff</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Active Caseload</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Resolved</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Total Managed</th>
                  <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Avg Turnaround</th>
                </tr>
              </thead>
              <tbody>
                {summary.staffWorkload.map(staff => {
                  const isUnassigned = staff.staffName === 'Unassigned';
                  return (
                    <tr
                      key={staff.staffName}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isUnassigned ? 'var(--accent-orange-surface, rgba(255, 159, 67, 0.08))' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>
                        {isUnassigned ? (
                          <span style={{ color: 'var(--accent-orange-text, #92400e)', fontStyle: 'italic' }}>
                            ⚠ Unassigned / Pending Triage
                          </span>
                        ) : (
                          staff.staffName
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <span
                          className="font-mono"
                          style={{
                            fontWeight: 700,
                            color: staff.activeTickets > 0 ? 'var(--accent-blue)' : 'var(--text-muted)'
                          }}
                        >
                          {staff.activeTickets}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                          {staff.resolvedTickets}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <span className="font-mono" style={{ fontWeight: 600 }}>
                          {staff.totalTickets}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <span className="font-mono" style={{ color: staff.averageResolutionHours !== null ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {formatHours(staff.averageResolutionHours)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
