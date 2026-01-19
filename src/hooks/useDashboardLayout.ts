import { useEffect, useState } from 'react';
import {
  DashboardKey,
  DashboardLayoutConfig,
  getDefaultDashboardLayout,
  loadDashboardLayout,
} from '@/lib/dashboardLayouts';

export function useDashboardLayout(dashboardKey: DashboardKey) {
  const [layout, setLayout] = useState<DashboardLayoutConfig>(
    getDefaultDashboardLayout(dashboardKey)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const loaded = await loadDashboardLayout(dashboardKey);
        if (!isMounted) return;
        setLayout(loaded);
      } catch (error) {
        console.error('Failed to load dashboard layout', error);
        if (!isMounted) return;
        setLayout(getDefaultDashboardLayout(dashboardKey));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [dashboardKey]);

  return { layout, loading };
}
