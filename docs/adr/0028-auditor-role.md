# ADR 0028: Auditor Role and Capabilities

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Security Team, Compliance Team

---

## Context

Auditores (internos e externos) precisam de acesso ao TrustLayer para:

1. **Investigação forense**: Rastrear ações de usuários
2. **Compliance**: Verificar controles e evidências
3. **Auditoria de logs**: Análise de change logs
4. **Relatórios**: Gerar relatórios de auditoria
5. **Read-only access**: Sem capacidade de modificar dados

Atualmente, não existe um role específico para auditores. Eles precisam usar `viewer` (muito limitado) ou `analyst` (pode editar dados).

## Decision

Criar um **role `auditor`** com permissões específicas para auditoria e investigação.

### 1. Role Definition

```typescript
// types/roles.ts
export type UserRole =
  | 'admin'
  | 'manager'
  | 'analyst'
  | 'auditor'  // NEW
  | 'viewer';

export const roleHierarchy = {
  admin: 5,
  manager: 4,
  analyst: 3,
  auditor: 2,  // Higher than viewer, lower than analyst
  viewer: 1,
};

export const rolePermissions: Record<UserRole, Permission[]> = {
  auditor: [
    // Read permissions (all data)
    'assessments.read',
    'answers.read',
    'evidences.read',
    'dashboards.view',
    'domains.read',
    'frameworks.read',

    // Audit-specific permissions
    'audit_logs.read',
    'audit_logs.export',
    'audit_logs.filter_all_users',  // Can see all users' actions
    'change_logs.read',
    'change_logs.export',

    // Reports
    'reports.generate',
    'reports.schedule',
    'reports.view_all',  // Can see all reports

    // User investigation
    'users.view_activity',
    'users.view_sessions',
    'users.view_login_history',

    // System logs
    'system_logs.read',
    'siem_metrics.read',

    // NO write permissions
    // NO delete permissions
  ],

  // ... other roles
};
```

### 2. Database Changes

```sql
-- Update role constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'manager', 'analyst', 'auditor', 'viewer', 'user'));

-- RLS policies for auditor
-- Auditor can read all assessments
CREATE POLICY "Auditors can read all assessments"
  ON assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'auditor'
    )
  );

-- Auditor can read all answers
CREATE POLICY "Auditors can read all answers"
  ON answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'auditor'
    )
  );

-- Auditor CANNOT write
-- (no INSERT/UPDATE/DELETE policies)

-- Auditor can read all change logs
CREATE POLICY "Auditors can read all change logs"
  ON change_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'auditor'
    )
  );

-- Auditor can read all user sessions
CREATE POLICY "Auditors can view all user sessions"
  ON user_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'auditor'
    )
  );
```

### 3. Audit-Specific Features

#### Audit Timeline

Visualização cronológica de todas as ações:

```typescript
// components/auditor/audit-timeline.tsx
export function AuditTimeline({ filters }: AuditTimelineProps) {
  const { data: logs } = useQuery({
    queryKey: ['audit-timeline', filters],
    queryFn: () => fetchAuditLogs(filters),
  });

  return (
    <Timeline>
      {logs.map(log => (
        <TimelineItem key={log.id}>
          <TimelineHeader>
            <UserAvatar user={log.user} />
            <div>
              <p className="font-medium">{log.user.display_name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(log.timestamp)}
              </p>
            </div>
          </TimelineHeader>

          <TimelineContent>
            <ActionBadge action={log.action} />
            <p>{log.description}</p>

            {log.changes && (
              <DiffViewer
                before={log.changes.before}
                after={log.changes.after}
              />
            )}
          </TimelineContent>

          <TimelineMetadata>
            <Badge>{log.entity_type}</Badge>
            <span>IP: {log.ip_address}</span>
            <span>Device: {log.user_agent}</span>
          </TimelineMetadata>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
```

#### User Activity Dashboard

```typescript
// components/auditor/user-activity-dashboard.tsx
export function UserActivityDashboard({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      {/* Login history */}
      <Card>
        <CardHeader>
          <CardTitle>Login History</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginHistoryTable userId={userId} />
        </CardContent>
      </Card>

      {/* Session timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionsTable userId={userId} />
        </CardContent>
      </Card>

      {/* Action heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap userId={userId} />
        </CardContent>
      </Card>

      {/* Recent actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Actions (Last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTimeline filters={{ userId, days: 30 }} />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Forensic Investigation Tools

```typescript
// components/auditor/forensic-investigation.tsx
export function ForensicInvestigation() {
  const [query, setQuery] = useState<ForensicQuery>({
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
    users: [],
    actions: [],
    entities: [],
    ipAddresses: [],
  });

  return (
    <div className="grid grid-cols-[300px_1fr] gap-4">
      {/* Filters sidebar */}
      <aside>
        <ForensicFilters query={query} onChange={setQuery} />
      </aside>

      {/* Results */}
      <main>
        <Tabs defaultValue="timeline">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="graph">Relationship Graph</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <AuditTimeline filters={query} />
          </TabsContent>

          <TabsContent value="table">
            <AuditLogsTable filters={query} />
          </TabsContent>

          <TabsContent value="graph">
            <RelationshipGraph filters={query} />
          </TabsContent>

          <TabsContent value="export">
            <ExportOptions filters={query} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
```

### 4. Advanced Audit Logging

Capture de eventos adicionais para auditores:

```typescript
// Database schema - enhanced audit logging
ALTER TABLE change_logs
ADD COLUMN session_id UUID REFERENCES user_sessions(id),
ADD COLUMN request_id TEXT, -- For correlation
ADD COLUMN source_ip TEXT, -- Already exists
ADD COLUMN geolocation JSONB, -- { country, city, lat, lon }
ADD COLUMN device_info JSONB, -- { type, os, browser }
ADD COLUMN before_state JSONB, -- Full state before change
ADD COLUMN after_state JSONB; -- Full state after change

-- Session tracking
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  -- Session info
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Device info
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  os TEXT,
  browser TEXT,

  -- Location
  geolocation JSONB,

  -- MFA
  mfa_verified BOOLEAN DEFAULT false,
  mfa_method TEXT, -- 'totp', 'webauthn', 'backup_code'

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(last_activity_at) WHERE ended_at IS NULL;
```

### 5. Compliance Reports

Templates específicos para auditores:

```typescript
// Report templates
const complianceAuditTemplate: ReportTemplate = {
  type: 'compliance_audit',
  sections: [
    {
      id: 'overview',
      title: 'Audit Overview',
      components: [
        { type: 'audit-scope', period: '90d' },
        { type: 'audited-entities', count: true },
      ],
    },
    {
      id: 'findings',
      title: 'Findings',
      components: [
        { type: 'non-compliance-items', severity: 'high' },
        { type: 'control-gaps', category: 'all' },
        { type: 'missing-evidence', critical: true },
      ],
    },
    {
      id: 'user-activity',
      title: 'User Activity Analysis',
      components: [
        { type: 'privileged-actions', roles: ['admin', 'manager'] },
        { type: 'anomalous-activity', threshold: 2.5 },
        { type: 'failed-login-attempts', threshold: 5 },
      ],
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      components: [
        { type: 'remediation-plan' },
      ],
    },
  ],
};
```

### 6. UI Navigation

```typescript
// Navigation specific for auditor role
const auditorNavigation = [
  {
    label: 'Audit Dashboard',
    path: '/auditor/dashboard',
    icon: 'Shield',
  },
  {
    label: 'Forensic Investigation',
    path: '/auditor/forensic',
    icon: 'Search',
  },
  {
    label: 'User Activity',
    path: '/auditor/users',
    icon: 'Users',
  },
  {
    label: 'Compliance Reports',
    path: '/auditor/reports',
    icon: 'FileText',
  },
  {
    label: 'System Logs',
    path: '/auditor/system-logs',
    icon: 'Terminal',
  },
];
```

## Consequences

### Positivo

✅ **Compliance**: Auditores têm ferramentas adequadas
✅ **Security**: Read-only access protege dados
✅ **Traceability**: Todas as ações são rastreáveis
✅ **Investigation**: Tools forenses para incidentes
✅ **Reporting**: Templates específicos para auditorias

### Negativo

❌ **Complexity**: Mais um role para gerenciar
❌ **Performance**: Queries de auditoria podem ser pesadas
❌ **Privacy**: Auditores veem todos os dados

### Mitigação

- **Performance**: Indexes otimizados em change_logs
- **Privacy**: Auditores devem assinar NDAs
- **Audit trail**: Ações de auditores também são logadas

## Implementation Plan

### Phase 1: Role Setup (Sprint 1) - COMPLETED

- [x] Add `auditor` role to database
- [x] Update RLS policies
- [x] Update role hierarchy

### Phase 2: Audit Features (Sprint 2-3) - COMPLETED

- [x] Audit timeline component (`src/components/audit/TimelineView.tsx`)
- [x] User activity dashboard (`src/components/audit/UserActivityDashboard.tsx`)
- [x] Forensic investigation tools (`src/components/audit/ForensicSearch.tsx`)
- [x] Enhanced audit logging (`src/lib/audit/audit-service.ts`)

### Phase 3: Reports (Sprint 4) - COMPLETED

- [x] Compliance audit templates (`supabase/functions/report-generator/`)
- [x] Export functionality (PDF, Excel, CSV, HTML)
- [x] Scheduled reports for auditors (`supabase/functions/report-scheduler/`)

### Phase 4: Advanced Features (Sprint 5) - PARTIALLY COMPLETED

- [ ] Relationship graph (TODO)
- [x] Anomaly detection (`src/lib/audit/anomaly-detection.ts`)
  - 13 detection algorithms implemented
  - User baseline learning
  - Risk scoring (0-100)
- [x] Device fingerprinting (`src/lib/audit/device-fingerprint.ts`)
  - Canvas, WebGL, Audio, Font fingerprinting
  - Similarity comparison
  - Privacy-preserving hashing
- [ ] Automated investigation workflows (TODO)

## Related ADRs

- ADR-0022: RBAC model
- ADR-0026: Reporting system (audit reports)

## References

- [NIST 800-53: Audit and Accountability](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- [ISO 27001: A.12.4 Logging and monitoring](https://www.iso.org/standard/27001)
