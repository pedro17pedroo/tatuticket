import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  Eye,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Clock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie, Cell } from 'recharts';

interface FinancialMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  revenueGrowth: number;
  activeTenants: number;
  totalTenants: number;
  tenantGrowth: number;
  averageRevenuePerTenant: number;
  churnRate: number;
  lifetimeValue: number;
}

interface TenantFinancialData {
  tenantId: string;
  tenantName: string;
  plan: string;
  monthlyRevenue: number;
  annualRevenue: number;
  usageMetrics: {
    tickets: number;
    users: number;
    storage: number;
    apiCalls: number;
  };
  billingStatus: 'active' | 'overdue' | 'suspended';
  nextBillingDate: Date;
  lastPayment: Date;
  paymentMethod: string;
}

interface RevenueData {
  month: string;
  revenue: number;
  growth: number;
  tenants: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface BillingIssue {
  tenantId: string;
  tenantName: string;
  type: 'overdue' | 'failed_payment' | 'chargeback';
  amount: number;
  daysPastDue: number;
  lastAttempt: Date;
  attempts: number;
}

interface PlanAnalytics {
  plan: string;
  tenants: number;
  revenue: number;
  growth: number;
}

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount / 100);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    ...options
  });
  
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  
  return response.json();
};

const MOCK_TENANT_DATA: TenantFinancialData[] = [
  {
    tenantId: '1',
    tenantName: 'TechCorp Solutions',
    plan: 'Enterprise',
    monthlyRevenue: 2500,
    annualRevenue: 30000,
    usageMetrics: {
      tickets: 1250,
      users: 45,
      storage: 15.5,
      apiCalls: 8500
    },
    billingStatus: 'active',
    nextBillingDate: new Date('2025-02-15'),
    lastPayment: new Date('2025-01-15'),
    paymentMethod: 'Credit Card (**** 4532)'
  },
  {
    tenantId: '2',
    tenantName: 'StartupXYZ',
    plan: 'Professional',
    monthlyRevenue: 99,
    annualRevenue: 1188,
    usageMetrics: {
      tickets: 240,
      users: 12,
      storage: 2.8,
      apiCalls: 1200
    },
    billingStatus: 'active',
    nextBillingDate: new Date('2025-02-08'),
    lastPayment: new Date('2025-01-08'),
    paymentMethod: 'Credit Card (**** 1234)'
  },
  {
    tenantId: '3',
    tenantName: 'BigCorp Inc',
    plan: 'Enterprise Plus',
    monthlyRevenue: 5000,
    annualRevenue: 60000,
    usageMetrics: {
      tickets: 3500,
      users: 120,
      storage: 45.2,
      apiCalls: 25000
    },
    billingStatus: 'overdue',
    nextBillingDate: new Date('2025-01-25'),
    lastPayment: new Date('2024-12-25'),
    paymentMethod: 'Bank Transfer'
  }
];

const MOCK_REVENUE_DATA: RevenueData[] = [
  { month: 'Jul 24', revenue: 35000, growth: 5.2, tenants: 98 },
  { month: 'Aug 24', revenue: 38500, growth: 10.0, tenants: 105 },
  { month: 'Sep 24', revenue: 41000, growth: 6.5, tenants: 112 },
  { month: 'Oct 24', revenue: 39800, growth: -2.9, tenants: 118 },
  { month: 'Nov 24', revenue: 42200, growth: 6.0, tenants: 125 },
  { month: 'Dec 24', revenue: 44500, growth: 5.4, tenants: 132 },
  { month: 'Jan 25', revenue: 42500, growth: -4.5, tenants: 127 }
];

export function FinancialDashboard() {
  const [timeFilter, setTimeFilter] = useState('last-6-months');
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: financialMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['/api/admin/financial-metrics', timeFilter],
    queryFn: async () => {
      // Mock API call
      return MOCK_FINANCIAL_METRICS;
    },
  });

  const { data: tenantsData, isLoading: isLoadingTenants } = useQuery({
    queryKey: ['/api/admin/tenants-financial'],
    queryFn: async () => {
      // Mock API call
      return MOCK_TENANT_DATA;
    },
  });

  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['/api/admin/revenue-data', timeFilter],
    queryFn: async () => {
      // Mock API call
      return MOCK_REVENUE_DATA;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Em Atraso</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspenso</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    } else if (growth < 0) {
      return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Financial Dashboard</h2>
          <p className="text-muted-foreground">Monitor revenue, billing, and tenant financial metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-48" data-testid="select-time-filter">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-12-months">Last 12 Months</SelectItem>
              <SelectItem value="year-to-date">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export-financial">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold" data-testid="metric-total-revenue">
                  {formatCurrency(financialMetrics?.totalRevenue || 0)}
                </p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(financialMetrics?.revenueGrowth || 0)}
                  <span className={`text-sm ${financialMetrics?.revenueGrowth! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {financialMetrics?.revenueGrowth?.toFixed(1)}% vs last period
                  </span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold" data-testid="metric-monthly-revenue">
                  {formatCurrency(financialMetrics?.monthlyRevenue || 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Current month</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tenants</p>
                <p className="text-2xl font-bold" data-testid="metric-active-tenants">
                  {financialMetrics?.activeTenants || 0}
                </p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(financialMetrics?.tenantGrowth || 0)}
                  <span className={`text-sm ${financialMetrics?.tenantGrowth! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {financialMetrics?.tenantGrowth?.toFixed(1)}% growth
                  </span>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Revenue per Tenant</p>
                <p className="text-2xl font-bold" data-testid="metric-arpt">
                  {formatCurrency(financialMetrics?.averageRevenuePerTenant || 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Per month</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenant Management</TabsTrigger>
          <TabsTrigger value="billing">Billing & Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueData?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-16">{item.month}</span>
                        <div className="flex-1">
                          <Progress value={(item.revenue / 50000) * 100} className="h-2" />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(item.revenue)}</p>
                        <div className="flex items-center gap-1">
                          {getGrowthIcon(item.growth)}
                          <span className={`text-xs ${item.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.growth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Churn Rate</span>
                    <div className="text-right">
                      <span className="text-lg font-bold">{financialMetrics?.churnRate}%</span>
                      <Progress value={financialMetrics?.churnRate || 0} className="h-2 w-20 mt-1" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Customer LTV</span>
                    <span className="text-lg font-bold">{formatCurrency(financialMetrics?.lifetimeValue || 0)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Tenants</span>
                    <span className="text-lg font-bold">{financialMetrics?.totalTenants}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Annual Revenue</span>
                    <span className="text-lg font-bold">{formatCurrency(financialMetrics?.annualRevenue || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tenant Management Tab */}
        <TabsContent value="tenants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Financial Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Tenant</th>
                      <th className="text-left p-4">Plan</th>
                      <th className="text-left p-4">Monthly Revenue</th>
                      <th className="text-left p-4">Annual Revenue</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Next Billing</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantsData?.map((tenant) => (
                      <tr key={tenant.tenantId} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded">
                              <Building className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{tenant.tenantName}</p>
                              <p className="text-sm text-muted-foreground">{tenant.tenantId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{tenant.plan}</Badge>
                        </td>
                        <td className="p-4 font-medium">
                          {formatCurrency(tenant.monthlyRevenue)}
                        </td>
                        <td className="p-4 font-medium">
                          {formatCurrency(tenant.annualRevenue)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(tenant.billingStatus)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {tenant.nextBillingDate.toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedTenant(tenant.tenantId)}
                              data-testid={`button-view-tenant-${tenant.tenantId}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`button-manage-tenant-${tenant.tenantId}`}
                            >
                              Manage
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing & Payments Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Payments</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-bold">124</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Overdue Payments</span>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-bold">3</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Failed Payments</span>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-bold">1</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">TechCorp Solutions</p>
                      <p className="text-sm text-muted-foreground">Enterprise Plan</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(2500)}</p>
                      <p className="text-sm text-green-600">Paid</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">StartupXYZ</p>
                      <p className="text-sm text-muted-foreground">Professional Plan</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(99)}</p>
                      <p className="text-sm text-green-600">Paid</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <div>
                      <p className="font-medium">BigCorp Inc</p>
                      <p className="text-sm text-muted-foreground">Enterprise Plus</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(5000)}</p>
                      <p className="text-sm text-red-600">Overdue</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Enterprise Plus</span>
                    <div className="flex items-center gap-2">
                      <Progress value={60} className="h-2 w-20" />
                      <span className="font-medium">60%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Enterprise</span>
                    <div className="flex items-center gap-2">
                      <Progress value={25} className="h-2 w-20" />
                      <span className="font-medium">25%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Professional</span>
                    <div className="flex items-center gap-2">
                      <Progress value={15} className="h-2 w-20" />
                      <span className="font-medium">15%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Next Month</span>
                    <span className="font-bold text-green-600">+8.5%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Next Quarter</span>
                    <span className="font-bold text-green-600">+22.3%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Next Year</span>
                    <span className="font-bold text-green-600">+45.7%</span>
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