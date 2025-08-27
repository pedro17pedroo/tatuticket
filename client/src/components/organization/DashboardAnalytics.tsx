import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Users, Clock, Target, 
  AlertTriangle, CheckCircle, Calendar, BarChart3, PieChart,
  Activity, Award, Zap, TrendingUp as Growth
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart
} from 'recharts';

interface AnalyticsData {
  ticketTrends: Array<{
    date: string;
    created: number;
    resolved: number;
    pending: number;
  }>;
  performanceMetrics: {
    averageResponseTime: number;
    averageResolutionTime: number;
    firstContactResolution: number;
    customerSatisfaction: number;
    slaCompliance: number;
  };
  agentPerformance: Array<{
    name: string;
    ticketsResolved: number;
    avgResponseTime: number;
    customerRating: number;
    efficiency: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  realTimeMetrics: {
    activeAgents: number;
    openTickets: number;
    pendingAssignment: number;
    slaBreaches: number;
    queueWaitTime: number;
  };
}

export function DashboardAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('tickets');

  // Fetch analytics data from API
  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics/dashboard', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/dashboard?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Falha ao carregar dados de analytics');
      const result = await response.json();
      return result.data;
    }
  });

  // Mock data fallback
  const mockAnalyticsData: AnalyticsData = {
    ticketTrends: [
      { date: '2025-01-20', created: 45, resolved: 38, pending: 7 },
      { date: '2025-01-21', created: 52, resolved: 48, pending: 4 },
      { date: '2025-01-22', created: 38, resolved: 42, pending: -4 },
      { date: '2025-01-23', created: 61, resolved: 55, pending: 6 },
      { date: '2025-01-24', created: 49, resolved: 51, pending: -2 },
      { date: '2025-01-25', created: 67, resolved: 59, pending: 8 },
      { date: '2025-01-26', created: 43, resolved: 46, pending: -3 },
      { date: '2025-01-27', created: 58, resolved: 54, pending: 4 }
    ],
    performanceMetrics: {
      averageResponseTime: 2.4,
      averageResolutionTime: 18.7,
      firstContactResolution: 67.8,
      customerSatisfaction: 4.2,
      slaCompliance: 94.6
    },
    agentPerformance: [
      { name: 'Carlos Silva', ticketsResolved: 89, avgResponseTime: 1.8, customerRating: 4.7, efficiency: 95 },
      { name: 'Ana Costa', ticketsResolved: 76, avgResponseTime: 2.1, customerRating: 4.5, efficiency: 92 },
      { name: 'Pedro Santos', ticketsResolved: 82, avgResponseTime: 2.5, customerRating: 4.3, efficiency: 88 },
      { name: 'Maria Oliveira', ticketsResolved: 71, avgResponseTime: 1.9, customerRating: 4.6, efficiency: 91 },
      { name: 'João Ferreira', ticketsResolved: 68, avgResponseTime: 2.8, customerRating: 4.1, efficiency: 85 }
    ],
    categoryBreakdown: [
      { category: 'Técnico', count: 156, percentage: 42, color: '#3B82F6' },
      { category: 'Billing', count: 89, percentage: 24, color: '#10B981' },
      { category: 'Suporte Geral', count: 67, percentage: 18, color: '#F59E0B' },
      { category: 'Bug Report', count: 34, percentage: 9, color: '#EF4444' },
      { category: 'Feature Request', count: 25, percentage: 7, color: '#8B5CF6' }
    ],
    realTimeMetrics: {
      activeAgents: 12,
      openTickets: 43,
      pendingAssignment: 8,
      slaBreaches: 2,
      queueWaitTime: 4.2
    }
  };

  const data = analyticsData || mockAnalyticsData;

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    return `${hours.toFixed(1)}h`;
  };

  const MetricCard = ({ title, value, icon: Icon, color, trend, subtitle }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`rounded-full p-3 ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-4 text-sm">
            {trend.direction === 'up' ? (
              <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
            )}
            <span className={trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}>
              {trend.value}
            </span>
            <span className="text-muted-foreground ml-1">{trend.period}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-analytics">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Analytics</h2>
          <p className="text-muted-foreground">Visão completa da performance organizacional</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export-analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Agentes Ativos"
          value={data.realTimeMetrics.activeAgents}
          icon={Users}
          color="bg-blue-100 text-blue-600"
          trend={{ direction: 'up', value: '+2', period: 'vs ontem' }}
        />
        <MetricCard
          title="Tickets Abertos"
          value={data.realTimeMetrics.openTickets}
          icon={AlertTriangle}
          color="bg-orange-100 text-orange-600"
          trend={{ direction: 'down', value: '-5', period: 'vs ontem' }}
        />
        <MetricCard
          title="Pendentes"
          value={data.realTimeMetrics.pendingAssignment}
          icon={Clock}
          color="bg-yellow-100 text-yellow-600"
        />
        <MetricCard
          title="SLA Breaches"
          value={data.realTimeMetrics.slaBreaches}
          icon={Target}
          color="bg-red-100 text-red-600"
          trend={{ direction: 'down', value: '-1', period: 'vs ontem' }}
        />
        <MetricCard
          title="Tempo na Fila"
          value={formatTime(data.realTimeMetrics.queueWaitTime)}
          icon={Activity}
          color="bg-purple-100 text-purple-600"
          subtitle="média atual"
        />
      </div>

      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tickets" data-testid="tab-tickets">Tickets</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
          <TabsTrigger value="agents" data-testid="tab-agents">Agentes</TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          {/* Ticket Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Tendências de Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.ticketTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="created" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="resolved" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tempo Médio de Resposta</p>
                    <p className="text-2xl font-bold">{formatTime(data.performanceMetrics.averageResponseTime)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
                <Progress value={75} className="mt-3" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolução Primeiro Contato</p>
                    <p className="text-2xl font-bold">{data.performanceMetrics.firstContactResolution}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <Progress value={data.performanceMetrics.firstContactResolution} className="mt-3" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conformidade SLA</p>
                    <p className="text-2xl font-bold">{data.performanceMetrics.slaCompliance}%</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
                <Progress value={data.performanceMetrics.slaCompliance} className="mt-3" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          {/* Agent Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Performance dos Agentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.agentPerformance.map((agent, index) => (
                  <div key={agent.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.ticketsResolved} tickets • {formatTime(agent.avgResponseTime)} tempo médio
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">⭐ {agent.customerRating}</Badge>
                      <div className="text-right">
                        <p className="text-sm font-medium">{agent.efficiency}%</p>
                        <p className="text-xs text-muted-foreground">eficiência</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Distribuição por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ category, percentage }) => `${category} ${percentage}%`}
                    >
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.categoryBreakdown.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{category.count}</p>
                        <p className="text-sm text-muted-foreground">{category.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}