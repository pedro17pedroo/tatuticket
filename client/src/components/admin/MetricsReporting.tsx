import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Ticket, Clock,
  Download, Calendar, Filter, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function MetricsReporting() {
  const [selectedPeriod, setSelectedPeriod] = useState('last_30_days');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Fetch comprehensive metrics from API
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['/api/admin/comprehensive-metrics', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/admin/comprehensive-metrics?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const result = await response.json();
      return result.data || mockMetricsData;
    }
  });

  // Mock comprehensive metrics data
  const mockMetricsData = {
    summary: {
      totalRevenue: 125000,
      revenueGrowth: 15.2,
      totalTickets: 1850,
      ticketGrowth: 8.5,
      activeTenants: 45,
      tenantGrowth: 12.0,
      avgResolutionTime: 4.2,
      resolutionImprovement: -0.8,
      customerSatisfaction: 4.6,
      satisfactionChange: 0.3
    },
    revenueByPlan: [
      { name: 'Freemium', value: 0, count: 15 },
      { name: 'Pro', value: 45000, count: 25 },
      { name: 'Enterprise', value: 80000, count: 5 }
    ],
    ticketsByPriority: [
      { priority: 'Low', count: 620, resolved: 580, pending: 40 },
      { priority: 'Medium', count: 850, resolved: 790, pending: 60 },
      { priority: 'High', count: 280, resolved: 250, pending: 30 },
      { priority: 'Urgent', count: 100, resolved: 85, pending: 15 }
    ],
    monthlyTrends: [
      { month: 'Set', revenue: 95000, tickets: 1450, tenants: 38, satisfaction: 4.2 },
      { month: 'Out', revenue: 105000, tickets: 1620, tenants: 41, satisfaction: 4.4 },
      { month: 'Nov', revenue: 115000, tickets: 1780, tenants: 43, satisfaction: 4.5 },
      { month: 'Dez', revenue: 120000, tickets: 1820, tenants: 44, satisfaction: 4.6 },
      { month: 'Jan', revenue: 125000, tickets: 1850, tenants: 45, satisfaction: 4.6 }
    ],
    tenantPerformance: [
      { tenant: 'TechCorp', revenue: 35000, tickets: 450, satisfaction: 4.8, slaCompliance: 96 },
      { tenant: 'StartupXYZ', revenue: 15000, tickets: 220, satisfaction: 4.5, slaCompliance: 92 },
      { tenant: 'BigCorp', revenue: 45000, tickets: 580, satisfaction: 4.7, slaCompliance: 94 },
      { tenant: 'Acme Inc', revenue: 18000, tickets: 280, satisfaction: 4.4, slaCompliance: 89 },
      { tenant: 'DevCorp', revenue: 12000, tickets: 320, satisfaction: 4.6, slaCompliance: 95 }
    ],
    slaPerformance: {
      overall: 93.5,
      byTier: [
        { tier: 'Basic', compliance: 88, breaches: 25 },
        { tier: 'Standard', compliance: 94, breaches: 18 },
        { tier: 'Premium', compliance: 97, breaches: 8 }
      ]
    },
    agentPerformance: [
      { agent: 'João Silva', tickets: 145, avgTime: 3.2, satisfaction: 4.8 },
      { agent: 'Maria Santos', tickets: 132, avgTime: 3.8, satisfaction: 4.6 },
      { agent: 'Pedro Costa', tickets: 128, avgTime: 4.1, satisfaction: 4.5 },
      { agent: 'Ana Oliveira', tickets: 115, avgTime: 3.5, satisfaction: 4.7 }
    ]
  };

  const generateReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/admin/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: selectedPeriod,
          format,
          metrics: selectedMetric
        })
      });

      if (!response.ok) throw new Error('Failed to generate report');

      // Mock download
      const fileName = `metrics-report-${new Date().toISOString().split('T')[0]}.${format}`;
      console.log(`Generating ${format.toUpperCase()} report: ${fileName}`);
      
      // In a real implementation, this would trigger a file download
      alert(`Relatório ${format.toUpperCase()} gerado com sucesso!`);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erro ao gerar relatório');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const data = metricsData || mockMetricsData;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Métricas e Relatórios
        </h1>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
              <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
              <SelectItem value="last_90_days">Últimos 90 dias</SelectItem>
              <SelectItem value="current_year">Ano atual</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => generateReport('pdf')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={() => generateReport('excel')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {data.summary.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{data.summary.revenueGrowth}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalTickets}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{data.summary.ticketGrowth}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.activeTenants}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{data.summary.tenantGrowth}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avgResolutionTime}h</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              {data.summary.resolutionImprovement}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.customerSatisfaction}/5</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{data.summary.satisfactionChange}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendências Mensais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="tickets" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.revenueByPlan}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, value}) => `${name}: R$ ${value.toLocaleString()}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.revenueByPlan.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.tenantPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tenant" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tickets por Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.ticketsByPriority}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="resolved" fill="#82ca9d" name="Resolvidos" />
                    <Bar dataKey="pending" fill="#ffc658" name="Pendentes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Agentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.agentPerformance.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{agent.agent}</div>
                      <div className="text-sm text-muted-foreground">
                        {agent.tickets} tickets • {agent.avgTime}h média • {agent.satisfaction}/5 satisfação
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{agent.satisfaction}/5</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance SLA Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">{data.slaPerformance.overall}%</div>
                  <div className="text-muted-foreground">Taxa de compliance</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SLA por Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.slaPerformance.byTier.map((tier, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-medium">{tier.tier}</span>
                      <div className="text-right">
                        <div className="text-lg font-bold">{tier.compliance}%</div>
                        <div className="text-sm text-muted-foreground">{tier.breaches} violações</div>
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