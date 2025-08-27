import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  AlertTriangle,
  Download,
  Calendar,
  Target
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

// Mock data - in real app would come from API
const MOCK_FINANCIAL_DATA = {
  overview: {
    mrr: 125000,
    mrrGrowth: 12.5,
    arr: 1500000,
    churnRate: 3.2,
    ltv: 8500,
    totalRevenue: 1650000,
    activeSubscriptions: 245,
    newSubscriptions: 18,
    canceledSubscriptions: 8
  },
  monthlyRevenue: [
    { month: 'Jan', revenue: 98000, subscriptions: 210 },
    { month: 'Feb', revenue: 105000, subscriptions: 225 },
    { month: 'Mar', revenue: 112000, subscriptions: 235 },
    { month: 'Apr', revenue: 118000, subscriptions: 240 },
    { month: 'May', revenue: 125000, subscriptions: 245 },
    { month: 'Jun', revenue: 130000, subscriptions: 250 }
  ],
  planDistribution: [
    { name: 'Freemium', value: 120, revenue: 0, color: '#8884d8' },
    { name: 'Professional', value: 85, revenue: 84500, color: '#82ca9d' },
    { name: 'Enterprise', value: 40, revenue: 40500, color: '#ffc658' }
  ],
  topTenants: [
    { id: '1', name: 'TechCorp Solutions', plan: 'Enterprise', mrr: 2500, growth: 15.2 },
    { id: '2', name: 'Digital Dynamics', plan: 'Professional', mrr: 990, growth: 8.5 },
    { id: '3', name: 'Innovation Labs', plan: 'Enterprise', mrr: 2500, growth: -2.1 },
    { id: '4', name: 'StartupHub', plan: 'Professional', mrr: 990, growth: 22.3 },
    { id: '5', name: 'Global Systems', plan: 'Enterprise', mrr: 2500, growth: 6.8 }
  ],
  churnAnalysis: [
    { month: 'Jan', churn: 2.8, signups: 15, cancellations: 6 },
    { month: 'Feb', churn: 3.1, signups: 18, cancellations: 7 },
    { month: 'Mar', churn: 2.9, signups: 20, cancellations: 7 },
    { month: 'Apr', churn: 3.5, signups: 16, cancellations: 8 },
    { month: 'May', churn: 3.2, signups: 18, cancellations: 8 },
    { month: 'Jun', churn: 2.7, signups: 22, cancellations: 6 }
  ]
};

interface FinancialDashboardProps {
  tenantId?: string; // If provided, show single tenant view
}

export function FinancialDashboard({ tenantId }: FinancialDashboardProps) {
  const { data: financialData, isLoading } = useQuery({
    queryKey: tenantId ? ['/api/financial-metrics', tenantId] : ['/api/financial-metrics/global'],
    enabled: true,
  });

  // Use mock data for now
  const data = financialData || MOCK_FINANCIAL_DATA;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="financial-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {tenantId ? 'Financeiro da Organização' : 'Dashboard Financeiro Global'}
          </h2>
          <p className="text-muted-foreground">
            Visão completa das métricas financeiras e receita
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-export-financial">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Período
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-mrr">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-mrr-value">
              {formatCurrency(data.overview.mrr)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {data.overview.mrrGrowth > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
              )}
              {formatPercentage(data.overview.mrrGrowth)} vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-arr">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-arr-value">
              {formatCurrency(data.overview.arr)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita recorrente anual
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-churn">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-churn-value">
              {data.overview.churnRate}%
            </div>
            <Progress value={data.overview.churnRate} max={10} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Meta: < 5%
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-subs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-subs-value">
              {data.overview.activeSubscriptions}
            </div>
            <p className="text-xs text-muted-foreground">
              +{data.overview.newSubscriptions} novas, -{data.overview.canceledSubscriptions} canceladas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue" data-testid="tab-revenue">Receita</TabsTrigger>
          <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="churn" data-testid="tab-churn">Churn Analysis</TabsTrigger>
          <TabsTrigger value="tenants" data-testid="tab-tenants">Top Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução da Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$ ${value/1000}k`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.planDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    >
                      {data.planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Assinaturas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="subscriptions" 
                    fill="hsl(var(--primary))" 
                    name="Assinaturas"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="churn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Churn</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.churnAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="churn" orientation="left" />
                  <YAxis yAxisId="count" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="churn"
                    type="monotone" 
                    dataKey="churn" 
                    stroke="hsl(var(--destructive))" 
                    name="Taxa de Churn (%)"
                  />
                  <Bar 
                    yAxisId="count"
                    dataKey="signups" 
                    fill="hsl(var(--primary))" 
                    name="Novos Signups"
                  />
                  <Bar 
                    yAxisId="count"
                    dataKey="cancellations" 
                    fill="hsl(var(--destructive))" 
                    name="Cancelamentos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Clientes por Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topTenants.map((tenant, index) => (
                  <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium" data-testid={`tenant-name-${index}`}>{tenant.name}</h4>
                        <Badge variant="outline">{tenant.plan}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium" data-testid={`tenant-mrr-${index}`}>
                        {formatCurrency(tenant.mrr)}/mês
                      </div>
                      <div className={`text-sm ${tenant.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(tenant.growth)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}