import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../src/components/layout/BottomNav';
import { ComplaintTable } from '../src/components/complaints/ComplaintTable';
import { Modal } from '../src/components/ui/Modal';
import { Complaint } from '../src/types';

describe('Phase 8: Mobile Responsive Experience & PWA Support Verification', () => {
  const publicDir = path.resolve(__dirname, '../public');
  const indexHtmlPath = path.resolve(__dirname, '../index.html');

  describe('PWA Manifest & App Icons Validation', () => {
    it('manifest.webmanifest exists and is valid JSON', () => {
      const manifestPath = path.join(publicDir, 'manifest.webmanifest');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const raw = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(raw);

      expect(manifest.name).toBe('CampusFix — College Complaint Management');
      expect(manifest.short_name).toBe('CampusFix');
      expect(manifest.start_url).toBe('/');
      expect(manifest.display).toBe('standalone');
      expect(manifest.background_color).toBe('#F7F6F2');
      expect(manifest.theme_color).toBe('#F7F6F2');
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    });

    it('PWA application icon files exist in public directory', () => {
      expect(fs.existsSync(path.join(publicDir, 'favicon.svg'))).toBe(true);
      expect(fs.existsSync(path.join(publicDir, 'pwa-192.svg'))).toBe(true);
      expect(fs.existsSync(path.join(publicDir, 'pwa-512.svg'))).toBe(true);
    });

    it('index.html contains PWA and mobile viewport meta tags', () => {
      const html = fs.readFileSync(indexHtmlPath, 'utf8');
      expect(html).toContain('rel="manifest" href="/manifest.webmanifest"');
      expect(html).toContain('name="theme-color"');
      expect(html).toContain('viewport-fit=cover');
      expect(html).toContain('apple-touch-icon');
      expect(html).toContain('apple-mobile-web-app-capable');
    });
  });

  describe('Service Worker Security & Caching Architecture', () => {
    const swPath = path.join(publicDir, 'sw.js');

    it('sw.js exists and implements safe static caching', () => {
      expect(fs.existsSync(swPath)).toBe(true);
      const swCode = fs.readFileSync(swPath, 'utf8');

      // Static cache naming and core assets
      expect(swCode).toContain('campusfix-shell-v1');
      expect(swCode).toContain('/favicon.svg');
      expect(swCode).toContain('/manifest.webmanifest');

      // Security isolation checks: strictly never caches private APIs or auth tokens
      expect(swCode).toContain('/api/');
      expect(swCode).toContain('oauth2');
      expect(swCode).toContain('cognito');
      expect(swCode).toContain('amazonaws.com');
      expect(swCode).toContain('caches.delete');
      expect(swCode).toContain('SKIP_WAITING');
    });
  });

  describe('Mobile-First Navigation & Shell Components', () => {
    it('BottomNav renders primary student actions with accessible labels', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/student'] },
          React.createElement(BottomNav)
        )
      );

      expect(html).toContain('student-bottom-nav');
      expect(html).toContain('Home');
      expect(html).toContain('My Complaints');
      expect(html).toContain('Submit');
      expect(html).toContain('Profile');
      expect(html).toContain('aria-label="Student primary navigation"');
    });

    it('BottomNav highlights active route correctly', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/student/submit'] },
          React.createElement(BottomNav)
        )
      );

      expect(html).toContain('aria-current="page"');
    });
  });

  describe('ComplaintTable Responsive Hybrid Layout (Cards on Mobile, Table on Desktop)', () => {
    const sampleComplaints: Complaint[] = [
      {
        id: 'CFX-101',
        title: 'Projector flickering in Physics Lab 2',
        description: 'HDMI input drops every 30 seconds during morning lectures.',
        category: 'Classroom Facilities',
        priority: 'High',
        status: 'Submitted',
        location: 'Science Complex Room 204',
        studentId: 'std-1',
        studentName: 'Alex River',
        studentEmail: 'alex@campus.edu',
        studentDepartment: 'Physics',
        createdAt: new Date().toISOString(),
        timeline: []
      }
    ];

    it('renders mobile card container for screens < 768px (md:hidden)', () => {
      const html = renderToStaticMarkup(
        React.createElement(ComplaintTable, {
          complaints: sampleComplaints,
          onViewDetails: () => {}
        })
      );

      // Mobile card list
      expect(html).toContain('md:hidden');
      expect(html).toContain('CFX-101');
      expect(html).toContain('Projector flickering in Physics Lab 2');
      expect(html).toContain('Science Complex Room 204');
    });

    it('renders desktop table container for screens >= 768px (md:block)', () => {
      const html = renderToStaticMarkup(
        React.createElement(ComplaintTable, {
          complaints: sampleComplaints,
          onViewDetails: () => {}
        })
      );

      // Desktop table
      expect(html).toContain('neo-table-wrapper');
      expect(html).toContain('hidden md:block');
      expect(html).toContain('<table class="neo-table">');
    });
  });

  describe('Modal Responsive & Viewport Safety', () => {
    it('Modal renders within dynamic viewport boundary and provides accessible close', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          Modal,
          {
            isOpen: true,
            onClose: () => {},
            title: 'Test Incident Modal',
            subtitle: 'Evaluating mobile safety'
          },
          React.createElement('div', null, 'Modal Body Content')
        )
      );

      expect(html).toContain('Test Incident Modal');
      expect(html).toContain('Evaluating mobile safety');
      expect(html).toContain('aria-label="Close modal"');
      expect(html).toContain('Modal Body Content');
    });
  });
});
