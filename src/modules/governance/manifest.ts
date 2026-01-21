import { lazy } from 'react';
import type { ModuleManifest } from '@/core/modules/types'; // Assuming types are in core/modules

/**
 * Manifest for the Security Governance Module.
 * This module encapsulates all features related to GRC, assessments,
 * and security posture dashboards.
 */
export const GovernanceModule: ModuleManifest = {
  // 1. Metadata
  id: 'governance',
  name: 'Security Governance',
  version: '1.0.0',
  description: 'Core module for GRC, security assessments, and compliance management.',

  // 2. Permissions
  // Defines the permissions this module requires or introduces.
  permissions: [
    'assessments.create',
    'assessments.read',
    'assessments.update',
    'assessments.delete',
    'dashboards.view.executive',
    'dashboards.view.grc',
    'dashboards.view.specialist',
    'reports.generate',
  ],

  // 3. Routes
  // All pages provided by this module.
  routes: [
    {
      path: '/assessment',
      component: lazy(() => import('./pages/Assessment')), // Path relative to module
      meta: { requiresAuth: true, title: 'Security Assessment' },
    },
    {
      path: '/dashboard',
      component: lazy(() => import('./pages/Dashboard')),
      meta: { requiresAuth: true, title: 'Dashboard' },
    },
    {
      path: '/dashboard/executive',
      component: lazy(() => import('./pages/DashboardExecutive')),
      meta: { requiresAuth: true, title: 'Executive Dashboard' },
    },
    {
      path: '/dashboard/grc',
      component: lazy(() => import('./pages/DashboardGRC')),
      meta: { requiresAuth: true, title: 'GRC Dashboard' },
    },
    {
      path: '/dashboard/specialist',
      component: lazy(() => import('./pages/DashboardSpecialist')),
      meta: { requiresAuth: true, title: 'Specialist Dashboard' },
    },
  ],

  // 4. Navigation
  // Items to be added to the main navigation sidebar.
  navigation: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', order: 10 },
    { label: 'Assessments', path: '/assessment', icon: 'ClipboardCheck', order: 20 },
  ],

  // 5. Lifecycle Hooks
  onActivate: async () => {
    console.log('Governance Module Activated.');
    // Potential logic: pre-fetch assessment data, initialize state stores
  },
  onDeactivate: async () => {
    console.log('Governance Module Deactivated.');
    // Potential logic: clean up state, cancel subscriptions
  },
};

export default GovernanceModule;