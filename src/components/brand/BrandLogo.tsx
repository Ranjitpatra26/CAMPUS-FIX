import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
  iconOnly = false
}) => {
  const iconSizes = {
    sm: { box: 'w-7 h-7', text: 'text-xl', mark: 16 },
    md: { box: 'w-9 h-9', text: 'text-2xl', mark: 20 },
    lg: { box: 'w-12 h-12', text: 'text-3xl', mark: 26 }
  };

  const currentSize = iconSizes[size];

  if (iconOnly) {
    return (
      <div
        className={`brand-logo-icon ${className}`}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size === 'sm' ? '32px' : size === 'lg' ? '46px' : '38px',
          height: size === 'sm' ? '32px' : size === 'lg' ? '46px' : '38px',
          backgroundColor: 'var(--accent-lime)',
          border: 'var(--border-width) solid var(--border-color)',
          boxShadow: 'var(--shadow-offset-xs)',
          borderRadius: 'var(--radius-sm)',
          flexShrink: 0
        }}
        title="CampusFix"
      >
        <svg
          viewBox="0 0 24 24"
          width={currentSize.mark}
          height={currentSize.mark}
          fill="none"
          stroke="var(--text-primary)"
          strokeWidth="2.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="var(--text-primary)" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`brand-logo-container ${className}`} style={{ display: 'inline-flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        {/* Geometric Mark */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size === 'sm' ? '28px' : size === 'lg' ? '46px' : '36px',
            height: size === 'sm' ? '28px' : size === 'lg' ? '46px' : '36px',
            backgroundColor: 'var(--accent-lime)',
            border: 'var(--border-width) solid var(--border-color)',
            boxShadow: size === 'sm' ? '2px 2px 0px var(--border-color)' : '3px 3px 0px var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            flexShrink: 0
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={currentSize.mark}
            height={currentSize.mark}
            fill="none"
            stroke="var(--text-primary)"
            strokeWidth="2.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            {/* Lightning bolt / precision fix mark */}
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="var(--text-primary)" />
          </svg>
        </div>

        {/* Wordmark */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <div
            className="font-heading"
            style={{
              fontSize: size === 'sm' ? '1.25rem' : size === 'lg' ? '1.9rem' : '1.5rem',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span>CAMPUS</span>
            <span
              style={{
                backgroundColor: 'var(--accent-lime)',
                color: '#171717',
                padding: '0 4px',
                marginLeft: '2px',
                border: '1.5px solid var(--border-color)',
                borderRadius: '3px',
                boxShadow: '1.5px 1.5px 0px var(--border-color)'
              }}
            >
              FIX
            </span>
          </div>
        </div>
      </div>

      {showTagline && (
        <span
          className="font-mono"
          style={{
            fontSize: size === 'lg' ? '0.85rem' : '0.725rem',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            marginTop: '0.4rem',
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}
        >
          Your Campus. Your Voice. Your Fix.
        </span>
      )}
    </div>
  );
};
