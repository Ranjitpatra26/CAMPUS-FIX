import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Vercel SPA Routing & Logout Navigation Verification', () => {
  const rootDir = path.resolve(__dirname, '..');
  const vercelJsonPath = path.resolve(rootDir, 'vercel.json');
  const viteConfigPath = path.resolve(rootDir, 'vite.config.ts');
  const authContextPath = path.resolve(rootDir, 'src/context/AuthContext.tsx');
  const navbarPath = path.resolve(rootDir, 'src/components/layout/Navbar.tsx');
  const sidebarPath = path.resolve(rootDir, 'src/components/layout/Sidebar.tsx');

  describe('1. Vercel SPA Fallback Configuration (vercel.json)', () => {
    it('exists and is valid JSON', () => {
      expect(fs.existsSync(vercelJsonPath)).toBe(true);
      const raw = fs.readFileSync(vercelJsonPath, 'utf8');
      const parsed = JSON.parse(raw);
      expect(parsed).toBeDefined();
    });

    it('contains a catch-all rewrite rule routing application paths to /index.html', () => {
      const raw = fs.readFileSync(vercelJsonPath, 'utf8');
      const parsed = JSON.parse(raw);
      expect(Array.isArray(parsed.rewrites)).toBe(true);
      expect(parsed.rewrites).toHaveLength(1);
      expect(parsed.rewrites[0].source).toBe('/(.*)');
      expect(parsed.rewrites[0].destination).toBe('/index.html');
    });
  });

  describe('2. Vite Production Build Configuration (vite.config.ts)', () => {
    it('defines rollupOptions with manualChunks function for vendor splitting', () => {
      const content = fs.readFileSync(viteConfigPath, 'utf8');
      expect(content).toContain('chunkSizeWarningLimit');
      expect(content).toContain('manualChunks');
      expect(content).toContain('vendor-charts');
      expect(content).toContain('vendor-icons');
    });
  });

  describe('3. Clean Logout Navigation & Concurrency Protection', () => {
    it('Navbar does not execute competing client-side navigate("/") on logout', () => {
      const content = fs.readFileSync(navbarPath, 'utf8');
      // Verify that within the logout button onClick, navigate('/') is not called
      expect(content).not.toMatch(/logout\(\);\s*navigate\('\/'\);/);
    });

    it('AuthContext guards against duplicate or concurrent logout executions', () => {
      const content = fs.readFileSync(authContextPath, 'utf8');
      expect(content).toContain('isLoggingOutRef');
      expect(content).toContain('if (isLoggingOutRef.current) return;');
    });

    it('AuthContext avoids client-side navigation when external Cognito redirect is initiated', () => {
      const content = fs.readFileSync(authContextPath, 'utf8');
      expect(content).toContain('if (!result?.redirected)');
    });
  });
});
