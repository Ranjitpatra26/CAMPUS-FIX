import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  PlusCircle,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Home
} from 'lucide-react';
import { NavigationPage } from './Sidebar';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenMobileSidebar: () => void;
  onNavigate: (page: NavigationPage) => void;
  onOpenNotifications: () => void;
  title?: string;
  subtitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileSidebar,
  onNavigate,
  onOpenNotifications,
  title,
  subtitle
}) => {
  const { user, role, switchRole, logout, authSource, isMockAuthEnabled } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount, addToast } = useNotification();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleRoleSwitch = (targetRole: 'student' | 'admin') => {
    switchRole(targetRole);
    setIsProfileMenuOpen(false);
    addToast(
      'info',
      'Demo Role Changed',
      `Switched to ${targetRole === 'admin' ? 'Dr. Aris Thorne (Chief Admin)' : 'Rohan Sharma (Student)'}.`
    );
    navigate(targetRole === 'admin' ? '/admin' : '/student');
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 80,
        height: 'var(--navbar-height)',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: 'var(--border-width) solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        gap: '1rem',
        boxSizing: 'border-box'
      }}
    >
      {/* Left: Mobile Drawer Trigger + Title/Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileSidebar}
          className="neo-btn neo-btn-secondary neo-btn-sm flex lg:hidden"
          style={{ padding: '0.45rem', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1
            className="font-heading"
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              margin: 0
            }}
          >
            {title || 'CampusFix'}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                margin: 0,
                display: 'none'
              }}
              className="md:block"
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Demo Mode Pill */}
        <div
          className="font-mono sm:flex"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.725rem',
            fontWeight: 800,
            padding: '0.2rem 0.55rem',
            backgroundColor: role === 'admin' ? 'var(--accent-blue-surface)' : 'var(--accent-lime)',
            color: role === 'admin' ? 'var(--accent-blue)' : '#171717',
            border: '1.5px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '1.5px 1.5px 0px var(--border-color)'
          }}
        >
          <Sparkles size={12} />
          <span>DEMO: {role.toUpperCase()}</span>
        </div>

        {/* Quick Action Button for Student */}
        {role === 'student' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('student-submit')}
            leftIcon={<PlusCircle size={15} />}
          >
            <span>New Complaint</span>
          </Button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          className="neo-btn neo-btn-secondary neo-btn-sm"
          style={{
            padding: '0.45rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* Notifications Icon Button */}
        <button
          onClick={onOpenNotifications}
          aria-label="View notifications"
          className="neo-btn neo-btn-secondary neo-btn-sm"
          style={{
            position: 'relative',
            padding: '0.45rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                backgroundColor: 'var(--accent-red)',
                color: '#FFFFFF',
                borderRadius: '50%',
                fontSize: '0.65rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid var(--border-color)'
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* Profile Avatar & Dropdown Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsProfileMenuOpen(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 4px 2px 2px',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: '2px 2px 0px var(--border-color)',
              cursor: 'pointer'
            }}
            aria-expanded={isProfileMenuOpen}
            aria-label="User profile menu"
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '3px',
                overflow: 'hidden',
                backgroundColor: 'var(--accent-lime)'
              }}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    color: '#171717'
                  }}
                >
                  {user?.name?.substring(0, 2).toUpperCase() || 'CP'}
                </div>
              )}
            </div>
            <ChevronDown size={14} color="var(--text-secondary)" />
          </button>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <div
              className="neo-card animate-fade-up"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '260px',
                padding: '0.85rem',
                zIndex: 110,
                backgroundColor: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-offset-lg)'
              }}
            >
              <div
                style={{
                  paddingBottom: '0.65rem',
                  marginBottom: '0.65rem',
                  borderBottom: '1.5px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--accent-blue)',
                    fontWeight: 700,
                    marginTop: '0.25rem'
                  }}
                >
                  ACTIVE ROLE: {role.toUpperCase()} {authSource !== 'none' && `• ${authSource.toUpperCase()}`}
                </div>
              </div>

              {/* Role Switcher Shortcuts (Only when mock auth is enabled) */}
              {isMockAuthEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span
                    className="font-mono"
                    style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}
                  >
                    Switch Demo Account
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('student')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.8rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor:
                        role === 'student' ? 'var(--accent-lime)' : 'var(--bg-surface-secondary)',
                      color: role === 'student' ? '#171717' : 'var(--text-primary)',
                      fontWeight: role === 'student' ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    <GraduationCap size={14} />
                    <span>Rohan Sharma (Student)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('admin')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.8rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor:
                        role === 'admin' ? 'var(--accent-blue)' : 'var(--bg-surface-secondary)',
                      color: role === 'admin' ? '#FFFFFF' : 'var(--text-primary)',
                      fontWeight: role === 'admin' ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    <ShieldAlert size={14} />
                    <span>Dr. Aris Thorne (Admin)</span>
                  </button>
                </div>
              )}

              {/* Public Landing Link & Logout */}
              <div
                style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.65rem',
                  borderTop: '1.5px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}
              >
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.4rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <Home size={14} />
                  <span>Public Landing Page</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                    navigate('/');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.4rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--accent-red)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  Sign Out of CampusFix
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
