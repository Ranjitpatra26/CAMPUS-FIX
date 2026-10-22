import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { Sidebar, NavigationPage } from './Sidebar';
import { Navbar } from './Navbar';
import { NotificationsDrawer } from './NotificationsDrawer';
import { useNavigate, useLocation } from 'react-router-dom';
import { complaintRepository } from '../../services/complaints/localStorageRepository';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const COLLAPSED_STORAGE_KEY = 'campusfix_sidebar_collapsed';

export const AppShell: React.FC<AppShellProps> = ({ children, title, subtitle }) => {
  const { user, role, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Desktop sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Mobile sidebar drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Sync collapse state with localStorage
  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch (e) {
        console.warn('Failed to persist sidebar collapsed state', e);
      }
      return next;
    });
  };

  // Close mobile drawer on route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll on mobile drawer open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  // Keyboard Escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileOpen) setIsMobileOpen(false);
        if (isNotificationsOpen) setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, isNotificationsOpen]);

  // Determine active page identifier from pathname
  const getCurrentPage = (): NavigationPage => {
    const p = location.pathname;
    if (p === '/student' || p === '/student/') return 'student-dashboard';
    if (p.startsWith('/student/complaints')) return 'student-my-complaints';
    if (p.startsWith('/student/submit')) return 'student-submit';
    if (p === '/admin' || p === '/admin/') return 'admin-dashboard';
    if (p.startsWith('/admin/complaints')) return 'admin-all-complaints';
    if (p.startsWith('/admin/departments')) return 'admin-departments';
    if (p.startsWith('/admin/analytics')) return 'admin-analytics';
    if (p.startsWith('/settings')) return 'common-settings';
    if (p.startsWith('/help')) return 'common-help';
    return role === 'admin' ? 'admin-dashboard' : 'student-dashboard';
  };

  const handleNavigate = (page: NavigationPage) => {
    setIsMobileOpen(false);
    switch (page) {
      case 'student-dashboard':
        navigate('/student');
        break;
      case 'student-my-complaints':
        navigate('/student/complaints');
        break;
      case 'student-submit':
        navigate('/student/submit');
        break;
      case 'admin-dashboard':
        navigate('/admin');
        break;
      case 'admin-all-complaints':
        navigate('/admin/complaints');
        break;
      case 'admin-departments':
        navigate('/admin/departments');
        break;
      case 'admin-analytics':
        navigate('/admin/analytics');
        break;
      case 'common-settings':
        navigate('/settings');
        break;
      case 'common-help':
        navigate('/help');
        break;
    }
  };

  const handleNotificationSelectTicket = async (ticketId: string) => {
    setIsNotificationsOpen(false);
    if (role === 'admin') {
      navigate(`/admin/complaints/${ticketId}`);
    } else {
      navigate(`/student/complaints/${ticketId}`);
    }
  };

  // Derive responsive sidebar width
  const sidebarWidth = isCollapsed ? '76px' : '260px';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar Component */}
      <Sidebar
        currentPage={getCurrentPage()}
        onNavigate={handleNavigate}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Layout Container (Offset dynamically to account for sidebar) */}
      <div
        className="app-main-layout"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: '100vh',
          transition: 'margin-left var(--transition-normal), width var(--transition-normal)'
        }}
      >
        <style>{`
          @media (min-width: 1025px) {
            .app-main-layout {
              margin-left: ${sidebarWidth} !important;
              width: calc(100% - ${sidebarWidth}) !important;
            }
          }
          @media (max-width: 1024px) {
            .app-main-layout {
              margin-left: 0 !important;
              width: 100% !important;
            }
          }
        `}</style>

        {/* Top Navbar */}
        <Navbar
          title={title}
          subtitle={subtitle}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          onNavigate={handleNavigate}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        {/* Main Content Viewport */}
        <main
          style={{
            flex: 1,
            padding: '2rem 1.75rem',
            maxWidth: '1380px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
        >
          {children}
        </main>
      </div>

      {/* Global Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectTicket={handleNotificationSelectTicket}
      />
    </div>
  );
};
