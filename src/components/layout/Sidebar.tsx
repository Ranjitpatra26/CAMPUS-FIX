import React from 'react';
import { BrandLogo } from '../brand/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  HelpCircle,
  Settings,
  Building2,
  BarChart3,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export type NavigationPage =
  | 'student-dashboard'
  | 'student-my-complaints'
  | 'student-submit'
  | 'admin-dashboard'
  | 'admin-all-complaints'
  | 'admin-departments'
  | 'admin-analytics'
  | 'common-settings'
  | 'common-help';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenNotifications?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  onOpenNotifications
}) => {
  const { user, role, logout } = useAuth();
  const { unreadCount } = useNotification();

  const handleNavClick = (page: NavigationPage) => {
    onNavigate(page);
    if (onCloseMobile) onCloseMobile();
  };

  const studentNav = [
    { id: 'student-dashboard' as NavigationPage, label: 'Overview', icon: <LayoutDashboard size={19} /> },
    { id: 'student-my-complaints' as NavigationPage, label: 'My Complaints', icon: <FileText size={19} /> },
    { id: 'student-submit' as NavigationPage, label: 'Submit Complaint', icon: <PlusCircle size={19} /> }
  ];

  const adminNav = [
    { id: 'admin-dashboard' as NavigationPage, label: 'Overview', icon: <LayoutDashboard size={19} /> },
    { id: 'admin-all-complaints' as NavigationPage, label: 'All Complaints', icon: <FileText size={19} /> },
    { id: 'admin-departments' as NavigationPage, label: 'Departments', icon: <Building2 size={19} /> },
    { id: 'admin-analytics' as NavigationPage, label: 'Analytics', icon: <BarChart3 size={19} /> }
  ];

  const commonNav = [
    { id: 'common-help' as NavigationPage, label: 'Help & Support', icon: <HelpCircle size={19} /> },
    { id: 'common-settings' as NavigationPage, label: 'Settings', icon: <Settings size={19} /> }
  ];

  const navItems = role === 'admin' ? adminNav : studentNav;
  const currentWidth = isCollapsed ? '76px' : '260px';

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 99,
            backdropFilter: 'blur(3px)',
            transition: 'opacity 0.2s ease'
          }}
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`sidebar-shell ${isMobileOpen ? 'mobile-open' : 'mobile-closed'}`}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: currentWidth,
          backgroundColor: 'var(--bg-surface)',
          borderRight: 'var(--border-width) solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          transition: 'width var(--transition-normal), transform var(--transition-normal)',
          overflowX: 'hidden'
        }}
      >
        <style>{`
          @media (max-width: 1024px) {
            .sidebar-shell.mobile-closed {
              transform: translateX(-100%);
            }
            .sidebar-shell.mobile-open {
              transform: translateX(0);
              width: 280px !important;
            }
          }
          @media (min-width: 1025px) {
            .sidebar-shell {
              transform: translateX(0) !important;
            }
          }
        `}</style>

        {/* Top Header & Branding */}
        <div
          style={{
            padding: isCollapsed ? '1rem 0.5rem' : '1.25rem 1rem',
            borderBottom: 'var(--border-width) solid var(--border-color)',
            backgroundColor: 'var(--bg-surface-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            position: 'relative'
          }}
        >
          {/* Brand Logo Row */}
          <div
            style={{
              display: 'flex',
              flexDirection: isCollapsed ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              gap: isCollapsed ? '0.65rem' : '0'
            }}
          >
            <div
              onClick={() => handleNavClick(role === 'admin' ? 'admin-dashboard' : 'student-dashboard')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="CampusFix Home"
            >
              {isCollapsed ? (
                <BrandLogo size="sm" iconOnly />
              ) : (
                <BrandLogo size="sm" showTagline />
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="neo-btn neo-btn-secondary neo-btn-sm flex lg:hidden"
              style={{ padding: '0.35rem', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>

            {/* Desktop Collapse / Expand Button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="neo-btn neo-btn-secondary neo-btn-sm hidden lg:flex"
                style={{
                  padding: isCollapsed ? '0.25rem 0.6rem' : '0.3rem',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)'
                }}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items Scroll Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isCollapsed ? '1rem 0.4rem' : '1.25rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          {!isCollapsed && (
            <div
              className="font-mono"
              style={{
                fontSize: '0.675rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '0.2rem 0.6rem 0.4rem 0.6rem'
              }}
            >
              {role === 'admin' ? 'Administrator' : 'Student'} Navigation
            </div>
          )}

          {navItems.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? 0 : '0.75rem',
                  padding: isCollapsed ? '0.65rem' : '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isActive ? '2px solid var(--border-color)' : '1.5px solid transparent',
                  backgroundColor: isActive
                    ? role === 'admin'
                      ? 'var(--accent-blue-surface)'
                      : 'var(--bg-surface-secondary)'
                    : 'transparent',
                  color: isActive
                    ? role === 'admin'
                      ? 'var(--accent-blue)'
                      : 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  boxShadow: isActive ? '2px 2px 0px var(--border-color)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? 'inherit' : 'var(--text-muted)'
                  }}
                >
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                    {isActive && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: role === 'admin' ? 'var(--accent-blue)' : 'var(--accent-lime)'
                        }}
                      />
                    )}
                  </>
                )}
              </button>
            );
          })}

          {/* Quick Notifications Button */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              title={isCollapsed ? `Notifications (${unreadCount} unread)` : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? 0 : '0.75rem',
                padding: isCollapsed ? '0.65rem' : '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid transparent',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9rem',
                position: 'relative'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={19} />
              </span>

              {!isCollapsed ? (
                <>
                  <span style={{ flex: 1 }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        backgroundColor: 'var(--accent-red)',
                        color: '#FFF',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '10px'
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </>
              ) : (
                unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '12px',
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'var(--accent-red)',
                      borderRadius: '50%'
                    }}
                  />
                )
              )}
            </button>
          )}

          {!isCollapsed && (
            <div
              className="font-mono"
              style={{
                fontSize: '0.675rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '0.85rem 0.6rem 0.35rem 0.6rem'
              }}
            >
              System & Help
            </div>
          )}

          {commonNav.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? 0 : '0.75rem',
                  padding: isCollapsed ? '0.65rem' : '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isActive ? '2px solid var(--border-color)' : '1.5px solid transparent',
                  backgroundColor: isActive ? 'var(--bg-surface-secondary)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  boxShadow: isActive ? '2px 2px 0px var(--border-color)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* User Profile at Bottom */}
        <div
          style={{
            padding: isCollapsed ? '0.85rem 0.4rem' : '1rem',
            borderTop: 'var(--border-width) solid var(--border-color)',
            backgroundColor: 'var(--bg-surface-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: isCollapsed ? 0 : '0.75rem'
          }}
        >
          {isCollapsed ? (
            <button
              onClick={() => logout()}
              title={`Logged in as ${user?.name || 'Guest'}. Click to sign out.`}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--border-color)',
                overflow: 'hidden',
                boxShadow: '1.5px 1.5px 0px var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{user?.name?.substring(0, 2).toUpperCase() || 'CP'}</span>
              )}
            </button>
          ) : (
            <>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--border-color)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '1.5px 1.5px 0px var(--border-color)'
                }}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'var(--accent-lime)',
                      color: '#171717',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}
                  >
                    {user?.name?.substring(0, 2).toUpperCase() || 'CP'}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {user?.name || 'CampusFix User'}
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: '0.725rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {user?.studentId || (role === 'admin' ? 'CHIEF ADMIN' : 'STUDENT')}
                </div>
              </div>

              <button
                onClick={() => logout()}
                title="Sign Out"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)'
                }}
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
