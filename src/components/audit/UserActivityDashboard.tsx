/**
 * User Activity Dashboard
 * Comprehensive activity metrics and analytics for users
 */

import { useEffect, useState } from 'react';
import {
  Activity,
  Clock,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MapPin,
  Monitor,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { auditLogService } from '@/lib/audit';
import type { UserActivityMetrics } from '@/lib/audit';
import { EVENT_TYPE_LABELS, RESOURCE_TYPE_LABELS } from '@/lib/audit';

interface UserActivityDashboardProps {
  userId: string;
  dateFrom: string;
  dateTo: string;
}

export function UserActivityDashboard({
  userId,
  dateFrom,
  dateTo,
}: UserActivityDashboardProps) {
  const [metrics, setMetrics] = useState<UserActivityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, [userId, dateFrom, dateTo]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await auditLogService.getUserActivityMetrics(userId, dateFrom, dateTo);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load user activity metrics:', err);
      setError('Falha ao carregar métricas de atividade');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !metrics) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800">{error || 'Erro ao carregar métricas'}</p>
        </CardContent>
      </Card>
    );
  }

  const loginSuccessRate = metrics.totalLogins > 0
    ? (metrics.successfulLogins / metrics.totalLogins) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* User header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{metrics.userEmail}</h2>
          <p className="text-muted-foreground">
            Período: {new Date(dateFrom).toLocaleDateString('pt-BR')} -{' '}
            {new Date(dateTo).toLocaleDateString('pt-BR')}
          </p>
        </div>
        {metrics.suspiciousEvents > 0 && (
          <Badge variant="destructive" className="text-base px-4 py-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {metrics.suspiciousEvents} eventos suspeitos
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Sessões"
          value={metrics.totalSessions}
          icon={<Activity className="h-4 w-4" />}
          subtitle={`${formatDuration(metrics.avgSessionDuration)} em média`}
        />
        <MetricCard
          title="Ações Realizadas"
          value={metrics.totalActions}
          icon={<Clock className="h-4 w-4" />}
          subtitle={`${metrics.totalPageViews} visualizações de página`}
        />
        <MetricCard
          title="Taxa de Login"
          value={`${loginSuccessRate.toFixed(0)}%`}
          icon={<Shield className="h-4 w-4" />}
          subtitle={`${metrics.successfulLogins}/${metrics.totalLogins} bem-sucedidos`}
          variant={loginSuccessRate >= 90 ? 'success' : loginSuccessRate >= 70 ? 'warning' : 'error'}
        />
        <MetricCard
          title="Score de Risco"
          value={metrics.avgRiskScore.toFixed(0)}
          icon={<AlertTriangle className="h-4 w-4" />}
          subtitle={metrics.suspiciousEvents > 0 ? `${metrics.suspiciousEvents} eventos suspeitos` : 'Normal'}
          variant={metrics.avgRiskScore >= 70 ? 'error' : metrics.avgRiskScore >= 50 ? 'warning' : 'success'}
        />
      </div>

      {/* Details grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Login stats */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow
              label="Total de logins"
              value={metrics.totalLogins}
            />
            <StatRow
              label="Logins bem-sucedidos"
              value={metrics.successfulLogins}
              valueColor="text-green-600"
            />
            <StatRow
              label="Falhas de login"
              value={metrics.failedLogins}
              valueColor={metrics.failedLogins > 0 ? 'text-red-600' : undefined}
            />
            <StatRow
              label="Endereços IP únicos"
              value={metrics.uniqueIpAddresses}
              icon={<MapPin className="h-4 w-4" />}
            />
            <StatRow
              label="Dispositivos únicos"
              value={metrics.uniqueDevices}
              icon={<Monitor className="h-4 w-4" />}
            />
            <StatRow
              label="Uso de MFA"
              value={`${(metrics.mfaUsageRate * 100).toFixed(0)}%`}
              valueColor={metrics.mfaUsageRate >= 0.9 ? 'text-green-600' : 'text-orange-600'}
            />
          </CardContent>
        </Card>

        {/* Session stats */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas de Sessão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow
              label="Total de sessões"
              value={metrics.totalSessions}
            />
            <StatRow
              label="Duração total"
              value={formatDuration(metrics.totalDuration)}
            />
            <StatRow
              label="Duração média"
              value={formatDuration(metrics.avgSessionDuration)}
            />
            <StatRow
              label="Total de ações"
              value={metrics.totalActions}
            />
            <StatRow
              label="Páginas visualizadas"
              value={metrics.totalPageViews}
            />
            <StatRow
              label="Ações por sessão"
              value={(metrics.totalSessions > 0 ? metrics.totalActions / metrics.totalSessions : 0).toFixed(1)}
            />
          </CardContent>
        </Card>

        {/* Top event types */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Eventos Principais</CardTitle>
            <CardDescription>Atividades mais frequentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topEventTypes.slice(0, 5).map((item) => (
                <div key={item.eventType} className="flex items-center justify-between">
                  <span className="text-sm">
                    {EVENT_TYPE_LABELS[item.eventType] || item.eventType}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{
                          width: `${(item.count / metrics.topEventTypes[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top resource types */}
        <Card>
          <CardHeader>
            <CardTitle>Recursos Principais</CardTitle>
            <CardDescription>Recursos mais acessados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topResourceTypes.slice(0, 5).map((item) => (
                <div key={item.resourceType} className="flex items-center justify-between">
                  <span className="text-sm">
                    {RESOURCE_TYPE_LABELS[item.resourceType] || item.resourceType}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2"
                        style={{
                          width: `${(item.count / metrics.topResourceTypes[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity by hour */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Atividade por Horário</CardTitle>
            <CardDescription>Distribuição de atividades ao longo do dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-48 gap-1">
              {metrics.activityByHour.map((item) => {
                const maxCount = Math.max(...metrics.activityByHour.map((h) => h.count));
                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                return (
                  <div key={item.hour} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative group">
                      <div
                        className={`w-full bg-primary rounded-t transition-all ${item.count > 0 ? 'hover:bg-primary/80' : 'bg-gray-200'}`}
                        style={{ height: `${height}%` }}
                      />
                      {item.count > 0 && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {item.count} eventos
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.hour}h
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendência de Atividade</CardTitle>
            <CardDescription>Atividade diária no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-48 gap-1">
              {metrics.activityByDay.map((item, index) => {
                const maxCount = Math.max(...metrics.activityByDay.map((d) => d.count));
                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const prevCount = index > 0 ? metrics.activityByDay[index - 1].count : item.count;
                const trend = item.count > prevCount ? 'up' : item.count < prevCount ? 'down' : 'same';

                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative group">
                      <div
                        className={`w-full rounded-t transition-all ${
                          trend === 'up'
                            ? 'bg-green-500 hover:bg-green-600'
                            : trend === 'down'
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        <br />
                        {item.count} eventos
                      </div>
                    </div>
                    {index % Math.max(1, Math.floor(metrics.activityByDay.length / 7)) === 0 && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.date).getDate()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

function MetricCard({ title, value, icon, subtitle, variant = 'default' }: MetricCardProps) {
  const variantClasses = {
    default: 'border-gray-200',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    error: 'border-red-200 bg-red-50',
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface StatRowProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  valueColor?: string;
}

function StatRow({ label, value, icon, valueColor = 'text-foreground' }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={`font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-8 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
