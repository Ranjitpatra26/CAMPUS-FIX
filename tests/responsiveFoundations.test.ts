import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';

describe('Phase 1: Responsive Design Foundations & Utilities', () => {
  const tokensCssPath = path.resolve(__dirname, '../src/styles/tokens.css');
  const indexCssPath = path.resolve(__dirname, '../src/styles/index.css');

  const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');
  const indexCss = fs.readFileSync(indexCssPath, 'utf8');

  describe('Design Tokens (tokens.css)', () => {
    it('defines fluid spacing tokens with clamp() values', () => {
      expect(tokensCss).toContain('--space-xs: clamp(');
      expect(tokensCss).toContain('--space-sm: clamp(');
      expect(tokensCss).toContain('--space-md: clamp(');
      expect(tokensCss).toContain('--space-lg: clamp(');
      expect(tokensCss).toContain('--space-xl: clamp(');
    });

    it('defines responsive content padding tokens', () => {
      expect(tokensCss).toContain('--content-padding-x: clamp(');
      expect(tokensCss).toContain('--content-padding-y: clamp(');
      expect(tokensCss).toContain('--content-max-width: 1380px;');
    });

    it('defines safe minimum layout and touch target tokens', () => {
      expect(tokensCss).toContain('--min-touch-target: 44px;');
      expect(tokensCss).toContain('--grid-min-card: min(100%, 280px);');
      expect(tokensCss).toContain('--grid-min-kpi: min(100%, 190px);');
      expect(tokensCss).toContain('--drawer-width-mobile: min(280px, 85vw);');
    });
  });

  describe('Responsive Utilities & Visibility Engine (index.css)', () => {
    it('defines core display primitives', () => {
      expect(indexCss).toMatch(/\.hidden\s*\{\s*display:\s*none\s*!important;\s*\}/);
      expect(indexCss).toMatch(/\.flex\s*\{\s*display:\s*flex\s*!important;\s*\}/);
      expect(indexCss).toMatch(/\.block\s*\{\s*display:\s*block\s*!important;\s*\}/);
      expect(indexCss).toMatch(/\.inline-flex\s*\{\s*display:\s*inline-flex\s*!important;\s*\}/);
    });

    it('defines breakpoint visibility classes matching audit usage', () => {
      // Small breakpoint (640px)
      expect(indexCss).toContain('.sm\\:inline-flex');
      expect(indexCss).toContain('.sm\\:flex');

      // Medium breakpoint (768px)
      expect(indexCss).toContain('.md\\:block');
      expect(indexCss).toContain('.md\\:flex');

      // Large breakpoint (1025px desktop)
      expect(indexCss).toContain('.lg\\:flex');
      expect(indexCss).toContain('.lg\\:hidden');
    });

    it('defines width, fluid container, and touch target utility classes', () => {
      expect(indexCss).toContain('.w-full');
      expect(indexCss).toContain('.neo-btn-full');
      expect(indexCss).toContain('.container-fluid');
      expect(indexCss).toContain('.touch-target');
      expect(indexCss).toContain('--min-touch-target');
    });

    it('enforces 16px minimum font size on mobile viewports to prevent iOS Safari auto-zoom', () => {
      expect(indexCss).toContain('@media (max-width: 768px)');
      expect(indexCss).toMatch(/\.neo-input[^{]*\{[^}]*font-size:\s*16px\s*!important;/);
    });
  });

  describe('Shared Component Foundations', () => {
    describe('Button Component', () => {
      it('renders default button without fullWidth class', () => {
        const html = renderToStaticMarkup(
          React.createElement(Button, { variant: 'primary', size: 'md' }, 'Click Me')
        );
        expect(html).toContain('neo-btn');
        expect(html).toContain('neo-btn-primary');
        expect(html).not.toContain('neo-btn-full');
      });

      it('renders fullWidth button with neo-btn-full class for mobile stacking', () => {
        const html = renderToStaticMarkup(
          React.createElement(Button, { variant: 'primary', fullWidth: true }, 'Submit Ticket')
        );
        expect(html).toContain('neo-btn-full');
        expect(html).toContain('neo-btn-primary');
      });

      it('preserves button variants and disabled states', () => {
        const html = renderToStaticMarkup(
          React.createElement(Button, { variant: 'danger', size: 'sm', disabled: true }, 'Delete')
        );
        expect(html).toContain('neo-btn-danger');
        expect(html).toContain('neo-btn-sm');
        expect(html).toContain('disabled=""');
      });
    });

    describe('Input Component', () => {
      it('merges custom styles without overwriting icon padding', () => {
        const html = renderToStaticMarkup(
          React.createElement(Input, {
            label: 'Test Input',
            leftIcon: React.createElement('span', null, 'Icon'),
            style: { color: 'red' }
          })
        );
        expect(html).toContain('neo-input');
        expect(html).toContain('padding-left:2.5rem');
        expect(html).toContain('color:red');
      });

      it('renders required label indicator and helper text accessibly', () => {
        const html = renderToStaticMarkup(
          React.createElement(Input, {
            label: 'Campus Email',
            required: true,
            helperText: 'Must end with @campus.edu'
          })
        );
        expect(html).toContain('Campus Email');
        expect(html).toContain('*');
        expect(html).toContain('Must end with @campus.edu');
      });
    });
  });
});
