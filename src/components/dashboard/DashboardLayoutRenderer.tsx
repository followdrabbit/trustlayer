import React from 'react';
import type { DashboardLayoutConfig } from '@/lib/dashboardLayouts';

interface DashboardLayoutRendererProps {
  layout: DashboardLayoutConfig;
  widgets: Record<string, React.ReactNode>;
}

export function DashboardLayoutRenderer({ layout, widgets }: DashboardLayoutRendererProps) {
  return (
    <>
      {layout.widgets.map((id) => (
        <React.Fragment key={id}>{widgets[id] ?? null}</React.Fragment>
      ))}
    </>
  );
}
