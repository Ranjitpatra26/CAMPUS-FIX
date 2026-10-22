import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification, ToastType } from '../../context/NotificationContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="var(--accent-lime-text)" />;
      case 'error':
        return <AlertCircle size={18} color="var(--accent-red-text)" />;
      case 'warning':
        return <AlertTriangle size={18} color="var(--accent-orange-text)" />;
      case 'info':
        return <Info size={18} color="var(--accent-blue-text)" />;
    }
  };

  const getToastBg = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'var(--accent-lime)';
      case 'error':
        return 'var(--accent-red)';
      case 'warning':
        return 'var(--accent-orange)';
      case 'info':
        return 'var(--accent-blue)';
    }
  };

  const getToastTextColor = (type: ToastType) => {
    switch (type) {
      case 'success':
      case 'warning':
        return '#171717';
      case 'error':
      case 'info':
        return '#FFFFFF';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none'
      }}
    >
      <AnimatePresence>
        {toasts.map(toast => {
          const bg = getToastBg(toast.type);
          const textColor = getToastTextColor(toast.type);

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={{
                pointerEvents: 'auto',
                backgroundColor: 'var(--bg-surface)',
                border: 'var(--border-width) solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-offset)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.85rem',
                  backgroundColor: bg,
                  color: textColor,
                  borderBottom: '1.5px solid var(--border-color)',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                {getToastIcon(toast.type)}
                <span className="font-heading" style={{ flex: 1 }}>
                  {toast.title}
                </span>
                <button
                  onClick={() => removeToast(toast.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                  aria-label="Close notification"
                >
                  <X size={14} />
                </button>
              </div>

              {toast.message && (
                <div
                  style={{
                    padding: '0.75rem 0.85rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {toast.message}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
