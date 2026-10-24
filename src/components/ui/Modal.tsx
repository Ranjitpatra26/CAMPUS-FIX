import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthStyles = {
    sm: '420px',
    md: '540px',
    lg: '720px',
    xl: '900px'
  }[maxWidth];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(0.5rem, 2vw, 1rem)',
            boxSizing: 'border-box'
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(3px)'
            }}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: maxWidthStyles,
              maxHeight: 'min(90dvh, 90vh)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-surface)',
              border: 'var(--border-width) solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-offset-lg)',
              zIndex: 10,
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: 'clamp(1rem, 2.5vw, 1.25rem) clamp(1rem, 2.5vw, 1.5rem)',
                borderBottom: 'var(--border-width) solid var(--border-color)',
                backgroundColor: 'var(--bg-surface-secondary)',
                gap: '0.75rem'
              }}
            >
              <div>
                <h3
                  className="font-heading"
                  style={{ fontSize: 'clamp(1.1rem, 3vw, 1.25rem)', color: 'var(--text-primary)', margin: 0 }}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {subtitle}
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                aria-label="Close modal"
                className="neo-btn neo-btn-secondary neo-btn-sm"
                style={{
                  padding: '0.4rem',
                  minWidth: '38px',
                  minHeight: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: 'clamp(1rem, 2.5vw, 1.5rem)',
                overflowY: 'auto',
                overscrollBehavior: 'contain'
              }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
