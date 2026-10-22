import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { Complaint } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

interface AnalyticsChartsProps {
  complaints: Complaint[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ complaints }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartTheme = {
    textColor: isDark ? '#F5F5F0' : '#171717',
    mutedColor: isDark ? '#A0A5AE' : '#737373',
    gridColor: isDark ? '#2E3238' : '#E5E3DC',
    surfaceBg: isDark ? '#1B1D20' : '#FFFFFF',
    borderColor: isDark ? '#383D46' : '#171717'
  };

  // 1. Data by Status
  const statusCounts: Record<string, number> = {
    Submitted: 0,
    Assigned: 0,
    'In Progress': 0,
    Resolved: 0,
    Rejected: 0
  };
  complaints.forEach(c => {
    if (statusCounts[c.status] !== undefined) {
      statusCounts[c.status]++;
    }
  });

  const statusData = [
    { name: 'Submitted', value: statusCounts.Submitted, color: '#3155E7' },
    { name: 'Assigned', value: statusCounts.Assigned, color: '#FF9F43' },
    { name: 'In Progress', value: statusCounts['In Progress'], color: '#7C3AED' },
    { name: 'Resolved', value: statusCounts.Resolved, color: '#10B981' },
    { name: 'Rejected', value: statusCounts.Rejected, color: '#F25F5C' }
  ];

  // 2. Data by Category
  const categoryCounts: Record<string, number> = {};
  complaints.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const categoryData = Object.entries(categoryCounts)
    .map(([cat, count]) => ({
      category: cat.length > 14 ? cat.substring(0, 12) + '...' : cat,
      fullCategory: cat,
      count
    }))
    .sort((a, b) => b.count - a.count);

  // 3. Trends by Date (chronological)
  const dateMap: Record<string, number> = {};
  complaints.forEach(c => {
    const d = new Date(c.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    dateMap[d] = (dateMap[d] || 0) + 1;
  });

  const trendData = Object.entries(dateMap).map(([date, count]) => ({
    date,
    count
  }));

  // Custom Neo-Brutalist Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: chartTheme.surfaceBg,
            border: `2px solid ${chartTheme.borderColor}`,
            boxShadow: '3px 3px 0px var(--border-color)',
            borderRadius: '4px',
            padding: '0.5rem 0.8rem',
            fontFamily: 'Space Grotesk, sans-serif'
          }}
        >
          <p style={{ fontWeight: 700, color: chartTheme.textColor, fontSize: '0.85rem' }}>
            {label || payload[0].name}
          </p>
          <p style={{ color: payload[0].color || 'var(--accent-blue)', fontSize: '0.85rem' }}>
            Count: <strong>{payload[0].value}</strong> tickets
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}
    >
      {/* Chart 1: Status Distribution */}
      <div className="neo-card" style={{ padding: '1.25rem' }}>
        <h4
          className="font-heading"
          style={{
            fontSize: '1.05rem',
            marginBottom: '0.25rem',
            color: 'var(--text-primary)'
          }}
        >
          Complaints by Status
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Current workflow state distribution
        </p>
        <div style={{ width: '100%', height: '230px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                stroke="var(--border-color)"
                strokeWidth={2}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem'
          }}
        >
          {statusData.map(item => (
            <div
              key={item.name}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: item.color,
                  border: '1px solid var(--border-color)',
                  borderRadius: '2px'
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>
                {item.name} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: Category Breakdown */}
      <div className="neo-card" style={{ padding: '1.25rem' }}>
        <h4
          className="font-heading"
          style={{
            fontSize: '1.05rem',
            marginBottom: '0.25rem',
            color: 'var(--text-primary)'
          }}
        >
          Complaints by Category
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Incident volume across domains
        </p>
        <div style={{ width: '100%', height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fill: chartTheme.mutedColor, fontSize: 11 }}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                tick={{ fill: chartTheme.mutedColor, fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="var(--accent-lime)"
                stroke="var(--border-color)"
                strokeWidth={1.5}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Submission Trend */}
      <div className="neo-card" style={{ padding: '1.25rem' }}>
        <h4
          className="font-heading"
          style={{
            fontSize: '1.05rem',
            marginBottom: '0.25rem',
            color: 'var(--text-primary)'
          }}
        >
          Complaint Submission Trend
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Daily ticket intake cadence
        </p>
        <div style={{ width: '100%', height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: chartTheme.mutedColor, fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: chartTheme.mutedColor, fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--accent-blue)"
                strokeWidth={2.5}
                fill="var(--accent-blue-surface)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
