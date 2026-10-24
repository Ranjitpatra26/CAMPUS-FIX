import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, Settings } from 'lucide-react';

interface BottomNavProps {
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      path: '/student',
      icon: <LayoutDashboard size={20} strokeWidth={2.2} />,
      isActive: pathname === '/student' || pathname === '/student/'
    },
    {
      id: 'complaints',
      label: 'My Complaints',
      path: '/student/complaints',
      icon: <FileText size={20} strokeWidth={2.2} />,
      isActive: pathname.startsWith('/student/complaints') && !pathname.includes('/submit')
    },
    {
      id: 'submit',
      label: 'Submit',
      path: '/student/submit',
      icon: <PlusCircle size={22} strokeWidth={2.4} />,
      isActive: pathname.startsWith('/student/submit'),
      isPrimaryAction: true
    },
    {
      id: 'settings',
      label: 'Profile',
      path: '/settings',
      icon: <Settings size={20} strokeWidth={2.2} />,
      isActive: pathname.startsWith('/settings')
    }
  ];

  return (
    <nav
      aria-label="Student primary navigation"
      className="student-bottom-nav md:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 85,
        backgroundColor: 'var(--bg-surface)',
        borderTop: 'var(--border-width) solid var(--border-color)',
        boxShadow: '0 -3px 10px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-around',
        padding: '0.35rem 0.5rem calc(0.35rem + env(safe-area-inset-bottom, 0px)) 0.5rem',
        boxSizing: 'border-box'
      }}
    >
      {navItems.map(item => {
        const isCurrent = item.isActive;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.path)}
            aria-current={isCurrent ? 'page' : undefined}
            aria-label={item.label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              minHeight: '48px',
              padding: '0.35rem 0.25rem',
              backgroundColor: isCurrent ? 'var(--bg-surface-secondary)' : 'transparent',
              border: isCurrent ? '1.5px solid var(--border-color)' : '1.5px solid transparent',
              borderRadius: 'var(--radius-sm)',
              boxShadow: isCurrent ? '2px 2px 0px var(--border-color)' : 'none',
              color: isCurrent
                ? 'var(--accent-blue)'
                : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              touchAction: 'manipulation',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.isPrimaryAction
                  ? isCurrent ? 'var(--accent-lime-text)' : 'var(--text-primary)'
                  : isCurrent ? 'var(--accent-blue)' : 'var(--text-secondary)',
                backgroundColor: item.isPrimaryAction ? 'var(--accent-lime)' : 'transparent',
                padding: item.isPrimaryAction ? '0.2rem' : '0',
                borderRadius: item.isPrimaryAction ? '6px' : '0',
                border: item.isPrimaryAction ? '1.5px solid var(--border-color)' : 'none',
                boxShadow: item.isPrimaryAction && !isCurrent ? '1.5px 1.5px 0px var(--border-color)' : 'none'
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: isCurrent ? 800 : 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.1,
                fontFamily: 'Space Grotesk, sans-serif'
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
