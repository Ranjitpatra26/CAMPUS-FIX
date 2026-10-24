import React, { useState } from 'react';
import { Complaint, ComplaintFilterOptions, ComplaintPriority, ComplaintStatus, DepartmentName } from '../../types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { EmptyState } from '../ui/EmptyState';
import { Search, Filter, Eye, ArrowUpDown, ChevronLeft, ChevronRight, SlidersHorizontal, UserCheck, RefreshCw } from 'lucide-react';
import { formatStudentDisplayName } from '../../utils/userProfile';

interface ComplaintTableProps {
  complaints: Complaint[];
  isAdmin?: boolean;
  onViewDetails: (complaint: Complaint) => void;
  onUpdateStatus?: (complaint: Complaint) => void;
  onAssignDept?: (complaint: Complaint) => void;
  onFilterChange?: (filters: ComplaintFilterOptions) => void;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  complaints,
  isAdmin = false,
  onViewDetails,
  onUpdateStatus,
  onAssignDept
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'status'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Filter list
  const filtered = complaints.filter(c => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.studentName.toLowerCase().includes(q) ||
        (c.department && c.department.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
    if (departmentFilter !== 'All' && c.department !== departmentFilter) return false;
    return true;
  });

  // Sort list
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'priority') {
      const weight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return weight[b.priority] - weight[a.priority];
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  // Paginated items
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Search and Filters Bar */}
      <div
        className="neo-card"
        style={{
          padding: '1rem',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            alignItems: 'center'
          }}
        >
          {/* Search Box */}
          <div style={{ gridColumn: 'span 1' }}>
            <Input
              placeholder="Search by ticket ID, title, student..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search size={16} />}
            />
          </div>

          {/* Status Filter */}
          <Select
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Submitted', label: 'Submitted' },
              { value: 'Assigned', label: 'Assigned' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Resolved', label: 'Resolved' },
              { value: 'Rejected', label: 'Rejected' }
            ]}
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          />

          {/* Priority Filter */}
          <Select
            options={[
              { value: 'All', label: 'All Priorities' },
              { value: 'Critical', label: 'Critical' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' }
            ]}
            value={priorityFilter}
            onChange={e => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
          />

          {/* Sort By */}
          <Select
            options={[
              { value: 'newest', label: 'Sort: Newest First' },
              { value: 'oldest', label: 'Sort: Oldest First' },
              { value: 'priority', label: 'Sort: Priority (High to Low)' },
              { value: 'status', label: 'Sort: Status' }
            ]}
            value={sortBy}
            onChange={e => {
              setSortBy(e.target.value as any);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Main Table View */}
      {paginated.length === 0 ? (
        <EmptyState
          title="No complaints found"
          description={
            searchTerm || statusFilter !== 'All' || priorityFilter !== 'All'
              ? 'No complaints matched your active search or filter criteria. Try clearing filters.'
              : 'You have not submitted any complaints yet. Use the submit button to log your first issue.'
          }
          actionLabel={
            searchTerm || statusFilter !== 'All' || priorityFilter !== 'All'
              ? 'Reset Filters'
              : undefined
          }
          onAction={() => {
            setSearchTerm('');
            setStatusFilter('All');
            setPriorityFilter('All');
            setDepartmentFilter('All');
          }}
        />
      ) : (
        <div className="neo-table-wrapper">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Issue Details</th>
                <th>Category</th>
                <th>Priority</th>
                {isAdmin && <th>Student</th>}
                <th>Department</th>
                <th>Status</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(complaint => (
                <tr key={complaint.id}>
                  {/* Ticket ID */}
                  <td>
                    <span
                      className="font-mono"
                      style={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-surface-secondary)',
                        padding: '0.2rem 0.45rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      {complaint.id}
                    </span>
                  </td>

                  {/* Title & Location */}
                  <td style={{ maxWidth: '280px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {complaint.title}
                    </div>
                    <div
                      style={{
                        fontSize: '0.775rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.2rem'
                      }}
                    >
                      📍 {complaint.location}
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '0.775rem',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--bg-primary)',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '3px'
                      }}
                    >
                      {complaint.category}
                    </span>
                  </td>

                  {/* Priority */}
                  <td>
                    <PriorityBadge priority={complaint.priority} size="sm" />
                  </td>

                  {/* Student (Admin view only) */}
                  {isAdmin && (
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {formatStudentDisplayName(complaint.studentName, complaint.studentEmail)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {complaint.studentDepartment}
                      </div>
                    </td>
                  )}

                  {/* Department */}
                  <td>
                    {complaint.department ? (
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {complaint.department}
                      </span>
                    ) : (
                      <span
                        className="font-mono"
                        style={{ fontSize: '0.775rem', color: 'var(--accent-orange)' }}
                      >
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td>
                    <StatusBadge status={complaint.status} size="sm" />
                  </td>

                  {/* Submitted Date */}
                  <td>
                    <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatDate(complaint.createdAt)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        justifyContent: 'flex-end'
                      }}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewDetails(complaint)}
                        title="View Full Details"
                      >
                        <Eye size={14} />
                        <span>Details</span>
                      </Button>

                      {isAdmin && onUpdateStatus && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onUpdateStatus(complaint)}
                          title="Update Status"
                        >
                          <RefreshCw size={13} />
                          <span>Status</span>
                        </Button>
                      )}

                      {isAdmin && onAssignDept && (
                        <Button
                          variant="blue"
                          size="sm"
                          onClick={() => onAssignDept(complaint)}
                          title="Assign Department"
                        >
                          <UserCheck size={13} />
                          <span>Route</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <span className="font-mono" style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sorted.length)} of {sorted.length} tickets
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </Button>

            <span
              className="font-mono"
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                border: '1.5px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)'
              }}
            >
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
