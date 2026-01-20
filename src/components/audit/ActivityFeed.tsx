/**
 * Activity Feed Component
 * Displays recent activity in a compact feed format
 */

import { useEffect, useState } from 'react';
import {
  FileText,
  Users,
  Shield,
  Settings,
  Download,
  Upload,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { auditLogService } from '@/lib/audit';
import type { ActivityFeedItem, EventType, ResourceType } from '@/lib/audit';

interface ActivityFeedProps {
  organizationId: string;
  userId?: string;
  limit?: number;
  showHeader?: boolean;
  onlySuspicious?: boolean;
}

export function ActivityFeed({
  organizationId,
  userId,
  limit = 20,
  showHeader = true,
  onlySuspicious = false,
}: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivityFeed();
  }, [organizationId, userId, limit, onlySuspicious]);

  const loadActivityFeed = async () => {
    try {
      setLoading(true);

      // Fetch change logs
      const logs = await auditLogService.getChangeLogs({
        organizationId,
        userId,
        isSuspicious: onlySuspicious || undefined,
      });

      // Convert to activity feed items
      const feedItems: ActivityFeedItem[] = logs.slice(0, limit).map((log) => ({
        id: log.id,
        timestamp: log.createdAt,
        icon: getEventIconName(log.eventType),
        title: getEventTitle(log.eventType, log.resourceType),
        description: log.description || '',
        user: log.userEmail
          ? {
              id: log.userId || '',
              email: log.userEmail,
              role: log.userRole || '',
            }
          : undefined,
        resource: log.resourceId
          ? {
              type: log.resourceType,
              id: log.resourceId,
              name: log.metadata?.resourceName || log.resourceId,
            }
          : undefined,
        severity: getSeverity(log.isSuspicious, log.riskScore),
        isSuspicious: log.isSuspicious,
      }));

      setItems(feedItems);
    } catch (error) {
      console.error('Failed to load activity feed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Atividade Recente</CardTitle>
            {onlySuspicious && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Apenas Suspeitas
              </Badge>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-1 p-0">
        {items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Nenhuma atividade recente
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <ActivityFeedItemComponent key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ActivityFeedItemComponentProps {
  item: ActivityFeedItem;
}

function ActivityFeedItemComponent({ item }: ActivityFeedItemComponentProps) {
  const Icon = getIconComponent(item.icon);
  const severityClass = getSeverityClass(item.severity);
  const timestamp = new Date(item.timestamp);

  return (
    <div className={`flex gap-3 p-4 hover:bg-gray-50 transition-colors ${item.isSuspicious ? 'bg-red-50' : ''}`}>
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${severityClass} flex items-center justify-center`}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-medium text-sm">
            {item.title}
            {item.isSuspicious && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Suspeito
              </Badge>
            )}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(timestamp)}
          </span>
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {item.user && <span>{item.user.email}</span>}
          {item.user && item.resource && <span>•</span>}
          {item.resource && (
            <span className="truncate">{item.resource.name}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function getEventIconName(eventType: EventType): string {
  const iconMap: Record<EventType, string> = {
    create: 'check-circle',
    update: 'file-text',
    delete: 'x-circle',
    login: 'shield',
    logout: 'shield',
    login_failed: 'alert-triangle',
    password_reset: 'lock',
    permission_change: 'settings',
    export: 'download',
    import: 'upload',
    access_denied: 'x-circle',
    suspicious_activity: 'alert-triangle',
  };
  return iconMap[eventType] || 'clock';
}

function getIconComponent(iconName: string) {
  const icons: Record<string, any> = {
    'check-circle': CheckCircle,
    'file-text': FileText,
    'x-circle': XCircle,
    shield: Shield,
    'alert-triangle': AlertTriangle,
    lock: Lock,
    settings: Settings,
    download: Download,
    upload: Upload,
    users: Users,
    clock: Clock,
  };
  return icons[iconName] || Clock;
}

function getEventTitle(eventType: EventType, resourceType: ResourceType): string {
  const actions: Record<EventType, string> = {
    create: 'Criou',
    update: 'Atualizou',
    delete: 'Excluiu',
    login: 'Fez login',
    logout: 'Fez logout',
    login_failed: 'Falha no login',
    password_reset: 'Redefiniu senha',
    permission_change: 'Alterou permissões',
    export: 'Exportou',
    import: 'Importou',
    access_denied: 'Acesso negado',
    suspicious_activity: 'Atividade suspeita',
  };

  const resources: Record<ResourceType, string> = {
    assessment: 'avaliação',
    framework: 'framework',
    control: 'controle',
    evidence: 'evidência',
    user: 'usuário',
    organization: 'organização',
    role: 'papel',
    setting: 'configuração',
    report: 'relatório',
    integration: 'integração',
  };

  return `${actions[eventType]} ${resources[resourceType]}`;
}

function getSeverity(
  isSuspicious: boolean,
  riskScore?: number
): 'low' | 'medium' | 'high' | 'critical' {
  if (isSuspicious || (riskScore && riskScore >= 90)) {
    return 'critical';
  }
  if (riskScore && riskScore >= 70) {
    return 'high';
  }
  if (riskScore && riskScore >= 50) {
    return 'medium';
  }
  return 'low';
}

function getSeverityClass(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  const classes = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };
  return classes[severity];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Agora';
  } else if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  }
}
