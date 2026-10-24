import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import { LoginPage } from '../src/pages/auth/LoginPage';
import * as AuthContextModule from '../src/context/AuthContext';

describe('CampusFix Cognito-Only Login Redesign & Local Auth Removal', () => {
  const rootDir = path.resolve(__dirname, '..');
  const loginPagePath = path.resolve(rootDir, 'src/pages/auth/LoginPage.tsx');
  const indexCssPath = path.resolve(rootDir, 'src/styles/index.css');
  const appTsxPath = path.resolve(rootDir, 'src/App.tsx');
  const illustrationSvgPath = path.resolve(rootDir, 'public/campusfix-login-illustration.svg');

  const loginPageSource = fs.readFileSync(loginPagePath, 'utf8');
  const indexCssSource = fs.readFileSync(indexCssPath, 'utf8');
  const appTsxSource = fs.readFileSync(appTsxPath, 'utf8');

  // Helper to render LoginPage with mocked AuthContext
  const renderLoginPage = (authOverrides = {}) => {
    const mockAuthContext = {
      user: null,
      role: 'student' as const,
      isLoading: false,
      loginWithCognito: vi.fn(),
      isCognitoConfigured: true,
      callbackError: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      setDemoRole: vi.fn(),
      authMode: 'cognito' as const,
      ...authOverrides
    };

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(mockAuthContext);

    return {
      html: renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(LoginPage, null)
        )
      ),
      mockAuthContext
    };
  };

  describe('1. Complete Removal of Local Authentication UI', () => {
    it('does not contain local email or password inputs', () => {
      const { html } = renderLoginPage();

      // No email input
      expect(html).not.toContain('type="email"');
      expect(html).not.toContain('College Email Address');
      expect(html).not.toContain('student@campus.edu');

      // No password input
      expect(html).not.toContain('type="password"');
      expect(html).not.toContain('placeholder="••••••••••••"');

      // No password visibility toggle (Eye/EyeOff)
      expect(html).not.toContain('Show password');
      expect(html).not.toContain('Hide password');
    });

    it('does not contain remember-session checkbox', () => {
      const { html } = renderLoginPage();
      expect(html).not.toContain('Remember this session');
      expect(html).not.toContain('rememberMe');
    });

    it('does not contain local Sign In button', () => {
      const { html } = renderLoginPage();
      expect(html).not.toContain('Sign In to CampusFix');
    });

    it('does not contain local forgot-password or register-account links', () => {
      const { html } = renderLoginPage();
      expect(html).not.toContain('Forgot password?');
      expect(html).not.toContain('Create Student Account');
      expect(html).not.toContain('/forgot-password');
      expect(html).not.toContain('/register');
    });

    it('does not contain divider separating SSO from local credentials', () => {
      const { html } = renderLoginPage();
      expect(html).not.toContain('Or Sign In With College Credentials');
    });

    it('LoginPage source file has no references to removed local inputs or state', () => {
      expect(loginPageSource).not.toContain('setPassword');
      expect(loginPageSource).not.toContain('setShowPassword');
      expect(loginPageSource).not.toContain('setRememberMe');
      expect(loginPageSource).not.toContain('handleSubmit');
      expect(loginPageSource).not.toContain('Create Student Account');
    });
  });

  describe('2. Single Primary Action: Cognito SSO Button', () => {
    it('renders the prominent Sign In with CampusFix SSO button', () => {
      const { html } = renderLoginPage();
      expect(html).toContain('Sign In with CampusFix SSO');
      expect(html).toContain('neo-btn-blue');
    });

    it('displays connecting state when submitting', () => {
      const { html } = renderLoginPage({ isLoading: true });
      expect(html).toContain('Connecting to CampusFix SSO...');
    });
  });

  describe('3. Brand, Heading, Security Badge & Navigation', () => {
    it('prominently displays CampusFix BrandLogo and tagline', () => {
      const { html } = renderLoginPage();
      expect(html).toContain('CAMPUS');
      expect(html).toContain('FIX');
      expect(html).toContain('Your Campus. Your Voice. Your Fix.');
    });

    it('displays Return to Public Landing navigation link', () => {
      const { html } = renderLoginPage();
      expect(html).toContain('Return to Public Landing');
    });

    it('displays Make Campus Better heading and supporting text', () => {
      const { html } = renderLoginPage();
      expect(html).toContain('Make Campus Better.');
      expect(html).toContain(
        'Access CampusFix to submit complaints, track resolution progress, and stay informed about campus issues.'
      );
    });

    it('displays SECURE CAMPUS ACCESS security indicator badge', () => {
      const { html } = renderLoginPage();
      expect(html).toContain('SECURE CAMPUS ACCESS');
      expect(html).toContain(
        'Sign in securely through your campus authentication system.'
      );
    });
  });

  describe('4. Custom Campus Illustration & 3 Benefits', () => {
    it('illustration SVG file exists on disk with proper neo-brutalist campus elements', () => {
      expect(fs.existsSync(illustrationSvgPath)).toBe(true);
      const svgContent = fs.readFileSync(illustrationSvgPath, 'utf8');

      // Campus architecture
      expect(svgContent).toContain('Classroom Projector Issue');
      expect(svgContent).toContain('Infrastructure');
      expect(svgContent).toContain('IN PROGRESS');
      expect(svgContent).toContain('SUBMITTED');
      expect(svgContent).toContain('RESOLVED');
    });

    it('renders the illustration image tag referencing /campusfix-login-illustration.svg', () => {
      const { html } = renderLoginPage();
      expect(html).toContain('src="/campusfix-login-illustration.svg"');
      expect(html).toContain('alt="CampusFix Issue Resolution and Transparent Campus Tracking"');
    });

    it('renders the three required compact benefit items under the illustration', () => {
      const { html } = renderLoginPage();

      // Benefit 1: Transparent Tracking
      expect(html).toContain('TRANSPARENT TRACKING');
      expect(html).toContain(
        'Follow complaint progress from submission to resolution.'
      );

      // Benefit 2: Secure Access
      expect(html).toContain('SECURE ACCESS');
      expect(html).toContain(
        'Access the platform through its existing authentication system.'
      );

      // Benefit 3: Accountable Resolution
      expect(html).toContain('ACCOUNTABLE RESOLUTION');
      expect(html).toContain(
        'Keep complaint progress visible to authorized users.'
      );
    });
  });

  describe('5. Responsive Design, Layout & Accessibility', () => {
    it('defines responsive two-column desktop and vertical mobile stacking in index.css', () => {
      expect(indexCssSource).toContain('.login-page-root');
      expect(indexCssSource).toContain('.login-auth-panel');
      expect(indexCssSource).toContain('.login-visual-panel');
      expect(indexCssSource).toContain('.login-benefits-grid');
      expect(indexCssSource).toContain('@media (max-width: 1023px)');
      expect(indexCssSource).toContain('@media (max-width: 480px)');
    });

    it('provides reduced-motion preference overrides for accessibility', () => {
      expect(indexCssSource).toContain('@media (prefers-reduced-motion: reduce)');
      expect(indexCssSource).toContain('.login-page-root');
    });
  });

  describe('6. Route Definitions & Dead Route Cleanup in App.tsx', () => {
    it('safely redirects legacy /register and /forgot-password routes to /login', () => {
      expect(appTsxSource).toContain('<Route path="/register" element={<Navigate to="/login" replace />} />');
      expect(appTsxSource).toContain('<Route path="/forgot-password" element={<Navigate to="/login" replace />} />');
      expect(appTsxSource).not.toContain('import { RegisterPage }');
      expect(appTsxSource).not.toContain('import { ForgotPasswordPage }');
    });
  });
});
