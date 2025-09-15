import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GlobalUserManagement } from "@/components/admin/global-user-management";
import { FinancialDashboard } from "@/components/admin/FinancialDashboard";
import { DemoManagement } from "@/components/admin/demo-management";
import { SalesManagement } from "@/components/admin/sales-management";
import { GlobalTenantManagement, RevenueAnalyticsDashboard } from "@/components/portal-completion";
import type { NavigationItem, GlobalStats } from "@/types/portal";
import type { Tenant, InsertTenant } from "@shared/schema";

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard Global', icon: 'fa-tachometer-alt', href: '#', active: true },
  { id: 'tenants', label: 'Tenants', icon: 'fa-building', href: '#' },
  { id: 'users', label: 'Usuários Globais', icon: 'fa-users', href: '#' },
  { id: 'sales', label: 'Gestão de Vendas', icon: 'fa-handshake', href: '#' },
  { id: 'demos', label: 'Gestão de Demos', icon: 'fa-calendar-alt', href: '#' },
  { id: 'portals', label: 'Portais', icon: 'fa-globe', href: '#' },
  { id: 'financial', label: 'Financeiro', icon: 'fa-dollar-sign', href: '#' },
  { id: 'analytics', label: 'Analytics', icon: 'fa-chart-line', href: '#' },
  { id: 'security', label: 'Segurança', icon: 'fa-shield-alt', href: '#' },
  { id: 'audit', label: 'Auditoria', icon: 'fa-clipboard-list', href: '#' },
  { id: 'settings', label: 'Configurações', icon: 'fa-cogs', href: '#' },
];

const systemStatus = [
  { service: "Portal SaaS", status: "operational", color: "text-green-600" },
  { service: "Portal Empresas", status: "operational", color: "text-green-600" },
  { service: "Portal Clientes", status: "maintenance", color: "text-yellow-600" },
  { service: "APIs", status: "operational", color: "text-green-600" },
];

export function AdminPortal() {
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const user = authService.getCurrentUser();

  const [newTenant, setNewTenant] = useState<InsertTenant>({
    name: "",
    slug: "",
    plan: "freemium",
    status: "active",
    settings: {}
  });

  const { data: globalStats, isLoading: isLoadingStats } = useQuery<GlobalStats>({
    queryKey: ['/api/analytics/global-stats'],
  });

  const { data: tenants, isLoading: isLoadingTenants } = useQuery<Tenant[]>({
    queryKey: ['/api/tenants'],
  });

  const { data: auditLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['/api/audit-logs', 'global'],
  });

  const createTenantMutation = useMutation({
    mutationFn: async (tenantData: InsertTenant) => {
      const response = await apiRequest("POST", "/api/tenants", tenantData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/global-stats'] });
      toast({
        title: "Tenant criado com sucesso!",
        description: "O novo tenant foi adicionado ao sistema.",
      });
      setIsCreateTenantOpen(false);
      setNewTenant({ name: "", slug: "", plan: "freemium", status: "active", settings: {} });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar tenant",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Generate slug from name if not provided
      const slug = newTenant.slug || newTenant.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      await createTenantMutation.mutateAsync({
        ...newTenant,
        slug
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    const planMap: Record<string, { label: string; className: string }> = {
      freemium: { label: "Freemium", className: "bg-gray-100 text-gray-800" },
      pro: { label: "Pro", className: "bg-purple-100 text-purple-800" },
      enterprise: { label: "Enterprise", className: "bg-blue-100 text-blue-800" },
    };
    
    const planInfo = planMap[plan] || { label: plan, className: "bg-gray-100 text-gray-800" };
    return <Badge variant="outline" className={planInfo.className}>{planInfo.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Ativo", variant: "default" },
      suspended: { label: "Suspenso", variant: "destructive" },
      trial: { label: "Trial", variant: "secondary" },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <CardContent>
            <p className="text-center text-gray-600">
              Acesso negado. Apenas super administradores podem acessar este portal.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header - Compact version to work with global navigation */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold text-gray-900">Painel de Administração Global</h1>
              <Badge variant="destructive" className="text-xs">SUPER ADMIN</Badge>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
                <i className="fas fa-shield-alt text-sm"></i>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar className="w-7 h-7">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=40&h=40" alt="Admin avatar" />
                  <AvatarFallback>SA</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">{user.username}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-screen bg-background">
        {/* Admin Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <nav className="mt-8 px-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveNavItem(item.id)}
                  className={cn(
                    "nav-item flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-left",
                    activeNavItem === item.id 
                      ? "nav-item admin-active bg-red-600 text-white" 
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  data-testid={`nav-admin-${item.id}`}
                >
                  <i className={`fas ${item.icon} mr-3`}></i>
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Admin Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Dashboard Tab */}
            {activeNavItem === 'dashboard' && (
              <>
                {/* Global Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                  <StatsCard
                    title="Total Tenants"
                    value={isLoadingStats ? "..." : globalStats?.totalTenants || 0}
                    icon="fa-building"
                    iconColor="bg-blue-100 text-blue-600"
                  />
                  <StatsCard
                    title="Usuários Ativos"
                    value={isLoadingStats ? "..." : globalStats?.totalUsers || 0}
                    icon="fa-users"
                    iconColor="bg-green-100 text-green-600"
                  />
                  <StatsCard
                    title="Tickets/Dia"
                    value={isLoadingStats ? "..." : globalStats?.totalTickets || 0}
                    icon="fa-ticket-alt"
                    iconColor="bg-yellow-100 text-yellow-600"
                  />
                  <StatsCard
                    title="Receita MRR"
                    value="R$ 180K"
                    icon="fa-dollar-sign"
                    iconColor="bg-green-100 text-green-600"
                  />
                  <StatsCard
                    title="Uptime"
                    value="99.9%"
                    icon="fa-server"
                    iconColor="bg-green-100 text-green-600"
                  />
                </div>
              </>
            )}

            {/* Users Management Tab */}
            {activeNavItem === 'users' && (
              <GlobalUserManagement />
            )}

            {/* Financial Dashboard Tab */}
            {activeNavItem === 'financial' && (
              <FinancialDashboard />
            )}

            {/* Sales Management Tab */}
            {activeNavItem === 'sales' && (
              <SalesManagement />
            )}

            {/* Demo Management Tab */}
            {activeNavItem === 'demos' && (
              <DemoManagement />
            )}

            {/* Tenants Tab */}
            {(activeNavItem === 'dashboard' || activeNavItem === 'tenants') && (
              <>
                {/* Tenant Management */}
                <Card className="mb-8">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                  <CardTitle>Gerenciamento de Tenants</CardTitle>
                  <Dialog open={isCreateTenantOpen} onOpenChange={setIsCreateTenantOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" data-testid="button-new-tenant">
                        <i className="fas fa-plus mr-2"></i>Novo Tenant
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Novo Tenant</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateTenant} className="space-y-4">
                        <div>
                          <Label htmlFor="tenant-name">Nome da Empresa</Label>
                          <Input
                            id="tenant-name"
                            value={newTenant.name}
                            onChange={(e) => setNewTenant(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: TechCorp Solutions"
                            required
                            data-testid="input-tenant-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tenant-slug">Slug (subdomínio)</Label>
                          <Input
                            id="tenant-slug"
                            value={newTenant.slug}
                            onChange={(e) => setNewTenant(prev => ({ ...prev, slug: e.target.value }))}
                            placeholder="techcorp (será techcorp.tatuticket.com)"
                            data-testid="input-tenant-slug"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tenant-plan">Plano</Label>
                          <Select 
                            value={newTenant.plan} 
                            onValueChange={(value) => setNewTenant(prev => ({ ...prev, plan: value }))}
                          >
                            <SelectTrigger data-testid="select-tenant-plan">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="freemium">Freemium</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={isLoading}
                          data-testid="button-create-tenant"
                        >
                          {isLoading ? "Criando..." : "Criar Tenant"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingTenants ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center">
                            <div className="loading-skeleton h-4 w-full"></div>
                          </td>
                        </tr>
                      ) : tenants?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            Nenhum tenant encontrado. Crie o primeiro tenant para começar.
                          </td>
                        </tr>
                      ) : (
                        tenants?.map((tenant) => (
                          <tr key={tenant.id} data-testid={`row-tenant-${tenant.id}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                                  <span className="text-white font-bold">
                                    {tenant.name.substring(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                                  <div className="text-sm text-gray-500">{tenant.slug}.tatuticket.com</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getPlanBadge(tenant.plan)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(tenant.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(tenant.createdAt!).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                              <Button 
                                variant="link" 
                                className="p-0 h-auto text-blue-600 hover:text-blue-900"
                                data-testid={`button-edit-tenant-${tenant.id}`}
                              >
                                Editar
                              </Button>
                              <Button 
                                variant="link" 
                                className="p-0 h-auto text-red-600 hover:text-red-900"
                                data-testid={`button-suspend-tenant-${tenant.id}`}
                              >
                                Suspender
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

                {/* System Status and Audit Logs */}
                <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Status do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemStatus.map((service, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{service.service}</span>
                        <span className={cn("flex items-center", service.color)}>
                          <i className="fas fa-circle text-xs mr-2"></i>
                          {service.status === "operational" ? "Operacional" : service.status === "maintenance" ? "Manutenção" : "Offline"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Logs de Auditoria Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {isLoadingLogs ? (
                      <div className="space-y-2">
                        <div className="loading-skeleton h-4 w-full"></div>
                        <div className="loading-skeleton h-4 w-3/4"></div>
                        <div className="loading-skeleton h-4 w-1/2"></div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm text-gray-900">Sistema iniciado com sucesso</p>
                            <p className="text-xs text-gray-500">Há 1 minuto</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm text-gray-900">Backup automático concluído</p>
                            <p className="text-xs text-gray-500">Há 1 hora</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm text-gray-900">Monitoramento de performance ativo</p>
                            <p className="text-xs text-gray-500">Há 2 horas</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
                </div>
              </>
            )}

            {/* Other navigation items - placeholder for future implementation */}
            {!['dashboard', 'users', 'tenants', 'sales', 'financial', 'demos'].includes(activeNavItem) && (
              <div className="flex flex-col items-center justify-center h-64">
                <i className="fas fa-tools text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{navigationItems.find(item => item.id === activeNavItem)?.label}</h3>
                <p className="text-gray-600">Esta funcionalidade será implementada em breve.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
