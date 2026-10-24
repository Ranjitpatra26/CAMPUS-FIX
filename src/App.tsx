import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { AppShell } from './components/layout/AppShell';
import { RequireAuth } from './components/auth/RequireAuth';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { NotFoundPage } from './pages/common/NotFoundPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { MyComplaintsPage } from './pages/student/MyComplaintsPage';
import { SubmitComplaintPage } from './pages/student/SubmitComplaintPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AllComplaintsPage } from './pages/admin/AllComplaintsPage';
import { DepartmentsPage } from './pages/admin/DepartmentsPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';

// Common Pages
import { ComplaintDetailPage } from './pages/common/ComplaintDetailPage';
import { SettingsPage } from './pages/common/SettingsPage';
import { HelpPage } from './pages/common/HelpPage';

export const App: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    const isHandlingCallback =
      typeof window !== 'undefined' &&
      (new URLSearchParams(window.location.search).has('code') ||
        new URLSearchParams(window.location.search).has('error'));

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)'
        }}
      >
        <div
          className="font-heading"
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            padding: '1.5rem 2.5rem',
            backgroundColor: 'var(--accent-lime)',
            color: '#171717',
            border: '3px solid #171717',
            boxShadow: '6px 6px 0px #171717',
            borderRadius: '6px'
          }}
        >
          {isHandlingCallback
            ? 'VERIFYING COGNITO IDENTITY & PKCE TOKENS...'
            : 'CAMPUSFIX INITIALIZING...'}
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/login" replace />} />

        {/* Student Protected Routes */}
        <Route
          path="/student"
          element={
            <RequireAuth requiredRole="student">
              <AppShell
                title="Student Overview"
                subtitle="Your Campus. Your Voice. Your Fix."
              >
                <StudentDashboard />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/student/complaints"
          element={
            <RequireAuth requiredRole="student">
              <AppShell
                title="My Complaints"
                subtitle="Track and manage your submitted campus issues."
              >
                <MyComplaintsPage />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/student/submit"
          element={
            <RequireAuth requiredRole="student">
              <AppShell
                title="New Complaint"
                subtitle="Submit an issue for campus department resolution."
              >
                <SubmitComplaintPage />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/student/complaints/:id"
          element={
            <RequireAuth requiredRole="student">
              <AppShell
                title="Complaint Details"
                subtitle="Detailed audit log and status progression."
              >
                <ComplaintDetailPage />
              </AppShell>
            </RequireAuth>
          }
        />

        {/* Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            <RequireAuth requiredRole="admin">
              <AppShell
                title="Campus Operations Dashboard"
                subtitle="Incident triage, SLA monitoring, and resolution analytics."
              >
                <AdminDashboard />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/complaints"
          element={
            <RequireAuth requiredRole="admin">
              <AppShell
                title="All Complaints Triage"
                subtitle="Master incident register and department routing."
              >
                <AllComplaintsPage />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/complaints/:id"
          element={
            <RequireAuth requiredRole="admin">
              <AppShell
                title="Complaint Details"
                subtitle="Administrator review, remarks, and status transitions."
              >
                <ComplaintDetailPage />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <RequireAuth requiredRole="admin">
              <AppShell
                title="Departments & SLAs"
                subtitle="Campus divisions, dispatch targets, and response commitments."
              >
                <DepartmentsPage />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <RequireAuth requiredRole="admin">
              <AppShell
                title="Resolution Analytics"
                subtitle="Quantitative metrics, category breakdown, and performance trends."
              >
                <AnalyticsPage />
              </AppShell>
            </RequireAuth>
          }
        />

        {/* Common Authenticated Routes */}
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <AppShell
                title="Account & Preferences"
                subtitle="Customization, theme, and profile settings."
              >
                <SettingsPage />
              </AppShell>
            </RequireAuth>
          }
        />
        <Route
          path="/help"
          element={
            <RequireAuth>
              <AppShell
                title="Help & Campus Support"
                subtitle="Emergency contacts, escalation directory, and FAQ."
              >
                <HelpPage />
              </AppShell>
            </RequireAuth>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global Toast Notifications Container */}
      <ToastContainer />
    </>
  );
};
