import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, TrendingUp, TrendingDown, Users, CreditCard, 
  AlertTriangle, CheckCircle, Calendar, Download, RefreshCw,
  Building, Percent, Target, Award
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurring: number;
  growth: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
}

interface TenantFinancial {
  id: string;
  name: string;
  plan: string;
  monthlyRevenue: number;
  totalRevenue: number;
  paymentStatus: 'current' | 'overdue' | 'failed';
  nextBilling: string;
  usage: {
    tickets: number;
    agents: number;
    storage: number;
  };
  limits: {
    tickets: number;
    agents: number;
    storage: number;
  };
}

export function FinancialDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Mock financial data
  const revenueMetrics: RevenueMetrics = {
    totalRevenue: 284500,
    monthlyRecurring: 45600,
    growth: 12.5,
    churnRate: 3.2,
    averageRevenuePerUser: 89.50,
    lifetimeValue: 2850
  };

  const tenantsData: TenantFinancial[] = [
    {
      id: '1',
      name: 'TechCorp Solutions',
      plan: 'Enterprise',
      monthlyRevenue: 2499,
      totalRevenue: 24990,
      paymentStatus: 'current',
      nextBilling: '2025-02-15',
      usage: { tickets: 850, agents: 15, storage: 4500 },
      limits: { tickets: 1000, agents: 20, storage: 5000 }
    },
    {
      id: '2',
      name: 'StartupXYZ',
      plan: 'Professional',
      monthlyRevenue: 149,
      totalRevenue: 1790,
      paymentStatus: 'overdue',
      nextBilling: '2025-01-20',
      usage: { tickets: 180, agents: 3, storage: 1200 },
      limits: { tickets: 200, agents: 5, storage: 2000 }
    },
    {
      id: '3',
      name: 'Global Services Inc',
      plan: 'Enterprise',
      monthlyRevenue: 2499,
      totalRevenue: 37485,
      paymentStatus: 'current',
      nextBilling: '2025-02-10',
      usage: { tickets: 1200, agents: 25, storage: 7800 },
      limits: { tickets: 1500, agents: 30, storage: 10000 }
    }
  ];

  const { data: revenue = revenueMetrics } = useQuery<RevenueMetrics>({
    queryKey: ['/api/admin/revenue-metrics', selectedPeriod],
    enabled: true
  });

  const { data: tenants = tenantsData } = useQuery<TenantFinancial[]>({
    queryKey: ['/api/admin/tenant-financials'],
    enabled: true
  });

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'current': return 'Em Dia';
      case 'overdue': return 'Vencido';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const totalCurrentRevenue = tenants
    .filter(t => t.paymentStatus === 'current')
    .reduce((sum, t) => sum + t.monthlyRevenue, 0);

  const overdueRevenue = tenants
    .filter(t => t.paymentStatus === 'overdue')
    .reduce((sum, t) => sum + t.monthlyRevenue, 0);

  return (
    <div className="space-y-6" data-testid="financial-dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod} data-testid="select-period">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Mês Atual</SelectItem>
              <SelectItem value="last_month">Mês Anterior</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-revenue">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-xl font-bold">R$ {revenue.totalRevenue.toLocaleString('pt-BR')}</p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">+{revenue.growth}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-mrr">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">MRR</p>
                <p className="text-xl font-bold">R$ {revenue.monthlyRecurring.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-gray-500">Receita Recorrente Mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-arpu">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ARPU</p>
                <p className="text-xl font-bold">R$ {revenue.averageRevenuePerUser.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Receita Média por Usuário</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-churn-rate">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Churn</p>
                <p className="text-xl font-bold">{revenue.churnRate}%</p>
                <p className="text-xs text-gray-500">Cancelamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tenants">Clientes</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="forecasting">Projeções</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          {/* Resumo de Status de Pagamentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-current-payments">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pagamentos em Dia</p>
                    <p className="text-xl font-bold">R$ {totalCurrentRevenue.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-gray-500">
                      {tenants.filter(t => t.paymentStatus === 'current').length} clientes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-overdue-payments">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pagamentos Vencidos</p>
                    <p className="text-xl font-bold text-red-600">R$ {overdueRevenue.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-gray-500">
                      {tenants.filter(t => t.paymentStatus === 'overdue').length} clientes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-ltv">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Award className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">LTV Médio</p>
                    <p className="text-xl font-bold">R$ {revenue.lifetimeValue.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-gray-500">Lifetime Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Clientes */}
          <Card data-testid="card-tenants-table">
            <CardHeader>
              <CardTitle>Visão Geral dos Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Receita Mensal</TableHead>
                    <TableHead>Status Pagamento</TableHead>
                    <TableHead>Próx. Cobrança</TableHead>
                    <TableHead>Uso Tickets</TableHead>
                    <TableHead>Uso Agentes</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id} data-testid={`row-tenant-${tenant.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-gray-500">ID: {tenant.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlanColor(tenant.plan)}>
                          {tenant.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {tenant.monthlyRevenue.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(tenant.paymentStatus)}>
                          {getPaymentStatusText(tenant.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(tenant.nextBilling).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{tenant.usage.tickets}</span>
                            <span>{tenant.limits.tickets}</span>
                          </div>
                          <Progress 
                            value={calculateUsagePercentage(tenant.usage.tickets, tenant.limits.tickets)}
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{tenant.usage.agents}</span>
                            <span>{tenant.limits.agents}</span>
                          </div>
                          <Progress 
                            value={calculateUsagePercentage(tenant.usage.agents, tenant.limits.agents)}
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" data-testid={`button-view-${tenant.id}`}>
                            Ver
                          </Button>
                          {tenant.paymentStatus === 'overdue' && (
                            <Button variant="outline" size="sm" className="text-red-600" data-testid={`button-collect-${tenant.id}`}>
                              Cobrar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card data-testid="card-payment-methods">
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium">Cartão de Crédito</p>
                    <p className="text-sm text-gray-600">85% dos pagamentos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Building className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium">Boleto Bancário</p>
                    <p className="text-sm text-gray-600">12% dos pagamentos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Target className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="font-medium">PIX</p>
                    <p className="text-sm text-gray-600">3% dos pagamentos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="card-revenue-trends">
              <CardHeader>
                <CardTitle>Tendências de Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Crescimento MoM</span>
                    <span className="font-bold text-green-600">+{revenue.growth}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Taxa de Retenção</span>
                    <span className="font-bold">{(100 - revenue.churnRate).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Receita por Cliente</span>
                    <span className="font-bold">R$ {revenue.averageRevenuePerUser.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-customer-metrics">
              <CardHeader>
                <CardTitle>Métricas de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total de Clientes</span>
                    <span className="font-bold">{tenants.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Clientes Ativos</span>
                    <span className="font-bold text-green-600">
                      {tenants.filter(t => t.paymentStatus === 'current').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Clientes em Atraso</span>
                    <span className="font-bold text-red-600">
                      {tenants.filter(t => t.paymentStatus === 'overdue').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="card-revenue-forecast">
              <CardHeader>
                <CardTitle>Projeção de Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Próximo Mês</span>
                    <span className="font-bold">R$ {Math.round(revenue.monthlyRecurring * 1.125).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Próximo Trimestre</span>
                    <span className="font-bold">R$ {Math.round(revenue.monthlyRecurring * 3.5).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Próximo Ano</span>
                    <span className="font-bold">R$ {Math.round(revenue.monthlyRecurring * 15).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-growth-targets">
              <CardHeader>
                <CardTitle>Metas de Crescimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Meta Mensal</span>
                      <span>R$ 50.000</span>
                    </div>
                    <Progress value={(revenue.monthlyRecurring / 50000) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Meta Anual</span>
                      <span>R$ 600.000</span>
                    </div>
                    <Progress value={(revenue.totalRevenue / 600000) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}