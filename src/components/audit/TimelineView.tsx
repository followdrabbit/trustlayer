/**
 * Timeline View Component
 * Displays audit events in chronological timeline format
 */

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle, Info, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { auditLogService } from '@/lib/audit';
import type { TimelineEvent, EventType, ResourceType } from '@/lib/audit';
import { EVENT_TYPE_LABELS, RESOURCE_TYPE_LABELS, RISK_THRESHOLDS } from '@/lib/audit';

interface TimelineViewProps {
  organizationId: string;
  filters?: {
    userId?: string;
    eventType?: EventType | EventType[];
    resourceType?: ResourceType | ResourceType[];
    dateFrom?: string;
    dateTo?: string;
    onlySuspicious?: boolean;
  };
  limit?: number;
}

export function TimelineView({ organizationId, filters = {}, limit = 50 }: TimelineViewProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, [organizationId, JSON.stringify(filters)]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError(null);

      const timeline = await auditLogService.getActivityTimeline(organizationId, {
        organizationId,
        ...filters,
      });

      // Apply limit
      setEvents(timeline.slice(0, limit));
    } catch (err) {
      console.error('Failed to load timeline:', err);
      setError('Falha ao carregar linha do tempo');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <TimelineSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-800">
            <XCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-gray-600">
            <Info className="h-5 w-5" />
            <p>Nenhum evento encontrado no período selecionado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Events */}
      <div className="space-y-6">
        {events.map((event, index) => (
          <TimelineEventCard
            key={event.id}
            event={event}
            isFirst={index === 0}
            isLast={index === events.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

interface TimelineEventCardProps {
  event: TimelineEvent;
  isFirst: boolean;
  isLast: boolean;
}

function TimelineEventCard({ event, isFirst, isLast }: TimelineEventCardProps) {
  const icon = getEventIcon(event);
  const severity = getEventSeverity(event);
  const timestamp = new Date(event.timestamp);

  return (
    <div className="relative flex gap-4 group">
      {/* Icon */}
      <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${severity.bgClass} ${severity.borderClass} border-2`}>
        {icon}
      </div>

      {/* Content card */}
      <Card className={`flex-1 transition-all ${event.isSuspicious ? 'border-red-300 bg-red-50' : 'hover:border-primary'}`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              {/* Event title */}
              <h4 className="font-medium text-base mb-1 flex items-center gap-2">
                {event.description}
                {event.isSuspicious && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Suspeito
                  </Badge>
                )}
                {event.riskScore && event.riskScore >= RISK_THRESHOLDS.HIGH && (
                  <Badge variant="outline" className="ml-2 border-orange-500 text-orange-700">
                    Risco: {event.riskScore}
                  </Badge>
                )}
              </h4>

              {/* Event metadata */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(timestamp)}
                </span>
                {event.userEmail && (
                  <span>{event.userEmail}</span>
                )}
                {event.userRole && (
                  <Badge variant="outline" className="text-xs">
                    {event.userRole}
                  </Badge>
                )}
              </div>
            </div>

            {/* Event type badge */}
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary">
                {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
              </Badge>
              <Badge variant="outline">
                {RESOURCE_TYPE_LABELS[event.resourceType] || event.resourceType}
              </Badge>
            </div>
          </div>

          {/* Additional metadata */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-gray-700">
                  Detalhes adicionais
                </summary>
                <div className="mt-2 space-y-1">
                  {Object.entries(event.metadata).map(([key, value]) => (
                    <div key={key} className="text-sm flex justify-between">
                      <span className="text-gray-600">{key}:</span>
                      <span className="text-gray-900 font-mono">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getEventIcon(event: TimelineEvent) {
  const iconClass = event.isSuspicious ? 'text-red-600' : 'text-gray-700';
  const size = 'h-7 w-7';

  switch (event.eventType) {
    case 'create':
      return <CheckCircle className={`${size} ${iconClass}`} />;
    case 'update':
      return <Info className={`${size} ${iconClass}`} />;
    case 'delete':
      return <XCircle className={`${size} ${iconClass}`} />;
    case 'login':
    case 'logout':
      return <Shield className={`${size} ${iconClass}`} />;
    case 'login_failed':
    case 'access_denied':
    case 'suspicious_activity':
      return <AlertTriangle className={`${size} text-red-600`} />;
    default:
      return <Clock className={`${size} ${iconClass}`} />;
  }
}

function getEventSeverity(event: TimelineEvent) {
  if (event.isSuspicious || event.riskScore && event.riskScore >= RISK_THRESHOLDS.CRITICAL) {
    return {
      bgClass: 'bg-red-100',
      borderClass: 'border-red-500',
      textClass: 'text-red-700',
    };
  }

  if (event.riskScore && event.riskScore >= RISK_THRESHOLDS.HIGH) {
    return {
      bgClass: 'bg-orange-100',
      borderClass: 'border-orange-500',
      textClass: 'text-orange-700',
    };
  }

  if (event.riskScore && event.riskScore >= RISK_THRESHOLDS.MEDIUM) {
    return {
      bgClass: 'bg-yellow-100',
      borderClass: 'border-yellow-500',
      textClass: 'text-yellow-700',
    };
  }

  return {
    bgClass: 'bg-blue-100',
    borderClass: 'border-blue-500',
    textClass: 'text-blue-700',
  };
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Agora mesmo';
  } else if (diffMins < 60) {
    return `${diffMins} min atrás`;
  } else if (diffHours < 24) {
    return `${diffHours}h atrás`;
  } else if (diffDays < 7) {
    return `${diffDays}d atrás`;
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
