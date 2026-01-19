import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_LAYOUT_VERSION,
  DEFAULT_DASHBOARD_LAYOUTS,
  getDefaultDashboardLayout,
} from '@/lib/dashboardLayouts';

describe('dashboardLayouts', () => {
  it('returns a copy of the default layout', () => {
    const layout = getDefaultDashboardLayout('executive');

    expect(layout).toEqual(DEFAULT_DASHBOARD_LAYOUTS.executive);

    layout.widgets.push('custom.widget');

    expect(DEFAULT_DASHBOARD_LAYOUTS.executive.widgets).not.toContain('custom.widget');
  });

  it('uses the current layout version', () => {
    const layout = getDefaultDashboardLayout('grc');

    expect(layout.version).toBe(DASHBOARD_LAYOUT_VERSION);
  });
});
