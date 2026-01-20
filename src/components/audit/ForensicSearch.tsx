/**
 * Forensic Search Component
 * Advanced search and investigation tools for audit logs
 */

import { useState } from 'react';
import { Search, Filter, AlertTriangle, TrendingUp, Link as LinkIcon, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { auditLogService } from '@/lib/audit';
import type { ForensicSearchQuery, ForensicSearchResult, EventType, ResourceType } from '@/lib/audit';
import { EVENT_TYPE_LABELS, RESOURCE_TYPE_LABELS } from '@/lib/audit';
import { TimelineView } from './TimelineView';

interface ForensicSearchProps {
  organizationId: string;
}

export function ForensicSearch({ organizationId }: ForensicSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ForensicSearchQuery['filters']>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
  });
  const [results, setResults] = useState<ForensicSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    try {
      setLoading(true);

      const searchQuery: ForensicSearchQuery = {
        organizationId,
        query,
        filters,
        sortBy: 'timestamp',
        limit: 100,
      };

      const data = await auditLogService.searchForensic(searchQuery);
      setResults(data);
    } catch (error) {
      console.error('Forensic search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!results) return;

    // Export to JSON
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `forensic-investigation-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <Card>
        <CardHeader>
          <CardTitle>Investigação Forense</CardTitle>
          <CardDescription>
            Pesquisa avançada e análise de eventos de auditoria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar eventos, usuários, IPs, recursos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Data Inicial
                  </label>
                  <Input
                    type="date"
                    value={filters.dateRange.start.split('T')[0]}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          start: new Date(e.target.value).toISOString(),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Data Final
                  </label>
                  <Input
                    type="date"
                    value={filters.dateRange.end.split('T')[0]}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          end: new Date(e.target.value).toISOString(),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Score de Risco Mínimo
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minRiskScore || 0}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      minRiskScore: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="onlySuspicious"
                  checked={filters.onlySuspicious || false}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      onlySuspicious: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <label htmlFor="onlySuspicious" className="text-sm font-medium">
                  Apenas eventos suspeitos
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <ResultsSkeleton />
      ) : results ? (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.totalResults}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sessões Relacionadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.sessions.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tentativas de Login
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.logins.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Eventos Correlacionados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.correlatedEvents.size}</div>
              </CardContent>
            </Card>
          </div>

          {/* Suspicious patterns */}
          {results.suspiciousPatterns.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Padrões Suspeitos Detectados
                  </CardTitle>
                  <Badge variant="destructive">
                    {results.suspiciousPatterns.length}
                  </Badge>
                </div>
                <CardDescription>
                  Comportamentos anômalos identificados automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.suspiciousPatterns.map((pattern, index) => (
                    <SuspiciousPatternCard key={index} pattern={pattern} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Correlated events */}
          {results.correlatedEvents.size > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Eventos Correlacionados
                </CardTitle>
                <CardDescription>
                  Grupos de eventos relacionados por ID de correlação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(results.correlatedEvents.entries()).map(
                    ([correlationId, events]) => (
                      <div
                        key={correlationId}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm text-muted-foreground">
                              {correlationId.substring(0, 8)}...
                            </span>
                          </div>
                          <Badge variant="outline">{events.length} eventos</Badge>
                        </div>
                        <div className="space-y-2">
                          {events.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="text-sm flex items-center justify-between"
                            >
                              <span>
                                {EVENT_TYPE_LABELS[event.eventType]} -{' '}
                                {RESOURCE_TYPE_LABELS[event.resourceType]}
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(event.createdAt).toLocaleTimeString('pt-BR')}
                              </span>
                            </div>
                          ))}
                          {events.length > 3 && (
                            <p className="text-sm text-muted-foreground">
                              +{events.length - 3} eventos adicionais
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Linha do Tempo</CardTitle>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Resultados
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TimelineView
                organizationId={organizationId}
                filters={{
                  ...filters,
                  dateFrom: filters.dateRange.start,
                  dateTo: filters.dateRange.end,
                  onlySuspicious: filters.onlySuspicious,
                }}
                limit={50}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-6 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Digite uma consulta e clique em "Buscar" para iniciar a investigação
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SuspiciousPatternCardProps {
  pattern: ForensicSearchResult['suspiciousPatterns'][0];
}

function SuspiciousPatternCard({ pattern }: SuspiciousPatternCardProps) {
  const patternTypeLabels: Record<string, string> = {
    multiple_failed_logins: 'Múltiplas falhas de login',
    ip_change: 'Mudanças de endereço IP',
    unusual_hours: 'Atividade em horário incomum',
    privilege_escalation: 'Escalação de privilégios',
  };

  const riskClass =
    pattern.riskScore >= 70
      ? 'bg-red-100 border-red-300 text-red-800'
      : pattern.riskScore >= 50
      ? 'bg-orange-100 border-orange-300 text-orange-800'
      : 'bg-yellow-100 border-yellow-300 text-yellow-800';

  return (
    <div className={`border rounded-lg p-4 ${riskClass}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <h4 className="font-medium">
            {patternTypeLabels[pattern.type] || pattern.type}
          </h4>
        </div>
        <Badge variant="outline" className="border-current">
          Risco: {pattern.riskScore}
        </Badge>
      </div>
      <p className="text-sm mb-3">{pattern.description}</p>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">
          {pattern.relatedEvents.length} eventos relacionados
        </span>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
