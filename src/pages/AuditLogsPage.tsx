/**
 * Audit Logs Page
 * Comprehensive audit logging and forensic investigation interface
 */

import { useState } from 'react';
import { Shield, Search, Activity, Users, Clock, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TimelineView } from '@/components/audit/TimelineView';
import { ActivityFeed } from '@/components/audit/ActivityFeed';
import { UserActivityDashboard } from '@/components/audit/UserActivityDashboard';
import { ForensicSearch } from '@/components/audit/ForensicSearch';
import { useAuth } from '@/hooks/useAuth';

export function AuditLogsPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);

  // Check if user has auditor role
  const isAuditor = profile?.role === 'auditor' || profile?.role === 'admin';

  if (!isAuditor) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <p>Você não tem permissão para acessar os logs de auditoria.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Logs de Auditoria
          </h1>
          <p className="text-muted-foreground">
            Sistema abrangente de auditoria e investigação forense
          </p>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2">
          <Shield className="h-4 w-4 mr-2" />
          Auditor
        </Badge>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <QuickStatCard
          title="Eventos Hoje"
          value="1,247"
          change="+12%"
          trend="up"
          icon={<Activity className="h-4 w-4" />}
        />
        <QuickStatCard
          title="Usuários Ativos"
          value="38"
          change="+5"
          trend="up"
          icon={<Users className="h-4 w-4" />}
        />
        <QuickStatCard
          title="Sessões Ativas"
          value="52"
          change="-3"
          trend="down"
          icon={<Clock className="h-4 w-4" />}
        />
        <QuickStatCard
          title="Eventos Suspeitos"
          value="7"
          change="+2"
          trend="up"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="warning"
        />
      </div>

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-[700px]">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Atividade</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="forensic" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Forense</span>
          </TabsTrigger>
          <TabsTrigger value="suspicious" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Suspeitos</span>
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo de Eventos</CardTitle>
              <CardDescription>
                Visualização cronológica de todos os eventos de auditoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimelineView
                organizationId={profile?.organization_id || ''}
                limit={100}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Feed Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <ActivityFeed
              organizationId={profile?.organization_id || ''}
              limit={20}
              showHeader={true}
            />
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Atividades</CardTitle>
                <CardDescription>Estatísticas da organização</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivitySummary organizationId={profile?.organization_id || ''} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {selectedUserId ? (
            <div>
              <button
                onClick={() => setSelectedUserId(undefined)}
                className="mb-4 text-sm text-primary hover:underline"
              >
                ← Voltar para lista de usuários
              </button>
              <UserActivityDashboard
                userId={selectedUserId}
                dateFrom={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}
                dateTo={new Date().toISOString()}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Atividade por Usuário</CardTitle>
                <CardDescription>
                  Selecione um usuário para ver análise detalhada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsersList
                  organizationId={profile?.organization_id || ''}
                  onSelectUser={setSelectedUserId}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Forensic Tab */}
        <TabsContent value="forensic" className="space-y-4">
          <ForensicSearch organizationId={profile?.organization_id || ''} />
        </TabsContent>

        {/* Suspicious Events Tab */}
        <TabsContent value="suspicious" className="space-y-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Eventos Suspeitos
              </CardTitle>
              <CardDescription>
                Eventos marcados como suspeitos ou com alto score de risco
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimelineView
                organizationId={profile?.organization_id || ''}
                filters={{ onlySuspicious: true }}
                limit={50}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface QuickStatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  variant?: 'default' | 'warning';
}

function QuickStatCard({
  title,
  value,
  change,
  trend,
  icon,
  variant = 'default',
}: QuickStatCardProps) {
  const variantClasses = {
    default: 'border-gray-200',
    warning: 'border-yellow-200 bg-yellow-50',
  };

  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';

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
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          <span className={`text-sm ${trendColor}`}>{change}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivitySummaryProps {
  organizationId: string;
}

function ActivitySummary({ organizationId }: ActivitySummaryProps) {
  // TODO: Implement activity summary with real data
  const stats = [
    { label: 'Eventos totais (30 dias)', value: '24,573' },
    { label: 'Usuários únicos', value: '127' },
    { label: 'Sessões criadas', value: '1,842' },
    { label: 'Logins bem-sucedidos', value: '1,798' },
    { label: 'Falhas de login', value: '44' },
    { label: 'Taxa de sucesso', value: '97.6%' },
    { label: 'Eventos suspeitos', value: '23' },
    { label: 'Score de risco médio', value: '18/100' },
  ];

  return (
    <div className="space-y-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center justify-between py-2 border-b last:border-0"
        >
          <span className="text-sm text-muted-foreground">{stat.label}</span>
          <span className="font-medium">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}

interface UsersListProps {
  organizationId: string;
  onSelectUser: (userId: string) => void;
}

function UsersList({ organizationId, onSelectUser }: UsersListProps) {
  // TODO: Fetch real user data from profiles table
  const users = [
    {
      id: '1',
      email: '[email protected]',
      role: 'admin',
      lastActivity: new Date(),
      eventsCount: 1247,
      riskScore: 12,
    },
    {
      id: '2',
      email: '[email protected]',
      role: 'manager',
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      eventsCount: 843,
      riskScore: 8,
    },
    {
      id: '3',
      email: '[email protected]',
      role: 'analyst',
      lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000),
      eventsCount: 592,
      riskScore: 67,
      suspicious: true,
    },
  ];

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div
          key={user.id}
          onClick={() => onSelectUser(user.id)}
          className={`p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors ${
            user.suspicious ? 'border-red-300 bg-red-50' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div>
                <h4 className="font-medium">{user.email}</h4>
                <p className="text-sm text-muted-foreground">
                  Última atividade:{' '}
                  {user.lastActivity.toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{user.role}</Badge>
              {user.suspicious && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Suspeito
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{user.eventsCount} eventos</span>
            <span>•</span>
            <span>Score de risco: {user.riskScore}/100</span>
          </div>
        </div>
      ))}
    </div>
  );
}
