import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepartmentManagement } from "@/components/organization/department-management";
import { TeamManagement } from "@/components/organization/team-management";
import { SlaManagement } from "@/components/organization/sla-management";
import { CustomerManagement } from "@/components/organization/customer-management";
import { AgentManagement } from "@/components/organization/agent-management";
import { AdvancedAnalytics } from "@/components/organization/advanced-analytics";
import { KnowledgeManagement } from "@/components/organization/knowledge-management";
import { AIInsights } from "@/components/organization/ai-insights";
import { TicketManagement } from "@/components/organization/ticket-management";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import type { NavigationItem, TicketStats } from "@/types/portal";

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', href: '#', active: true },
  { id: 'tickets', label: 'Tickets', icon: 'fa-ticket-alt', href: '#' },
  { id: 'structure', label: 'Estrutura', icon: 'fa-sitemap', href: '#' },
  { id: 'customers', label: 'Clientes', icon: 'fa-users', href: '#' },
  { id: 'agents', label: 'Agentes', icon: 'fa-user-tie', href: '#' },
  { id: 'slas', label: 'SLAs', icon: 'fa-clock', href: '#' },
  { id: 'reports', label: 'Relatórios', icon: 'fa-chart-bar', href: '#' },
  { id: 'knowledge', label: 'Base de Conhecimento', icon: 'fa-book', href: '#' },
  { id: 'ai-insights', label: 'Insights de IA', icon: 'fa-brain', href: '#' },
  { id: 'settings', label: 'Configurações', icon: 'fa-cog', href: '#' },
];


const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    critical: { label: "Crítico", variant: "destructive" },
    "in-progress": { label: "Em Andamento", variant: "default" },
    waiting: { label: "Aguardando", variant: "secondary" },
    resolved: { label: "Resolvido", variant: "outline" },
  };
  
  const statusInfo = statusMap[status] || { label: status, variant: "default" };
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
};

const getPriorityBadge = (priority: string) => {
  const priorityMap: Record<string, { label: string; className: string }> = {
    high: { label: "Alta", className: "ticket-priority-high" },
    medium: { label: "Média", className: "ticket-priority-medium" },
    low: { label: "Baixa", className: "ticket-priority-low" },
    critical: { label: "Crítica", className: "ticket-priority-critical" },
  };
  
  const priorityInfo = priorityMap[priority] || { label: priority, className: "ticket-priority-medium" };
  return <Badge variant="outline" className={priorityInfo.className}>{priorityInfo.label}</Badge>;
};

export function OrganizationPortal() {
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const user = authService.getCurrentUser();
  const tenantId = authService.getTenantId();

  const { data: ticketStats, isLoading: isLoadingStats } = useQuery<TicketStats>({
    queryKey: ['/api/analytics/ticket-stats', tenantId],
    enabled: !!tenantId,
  });

  const { data: tickets, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['/api/tickets', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/tickets?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId,
  });

  if (!user || !tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <CardContent>
            <p className="text-center text-gray-600">
              Você precisa estar logado em uma organização para acessar este portal.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard Organizacional</h1>
              <Badge className="bg-primary text-white">TechCorp Solutions</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <i className="fas fa-bell"></i>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=40&h=40" alt="User avatar" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">{user.username}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-screen bg-background">
        {/* Sidebar */}
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
                      ? "bg-primary text-white" 
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  data-testid={`nav-${item.id}`}
                >
                  <i className={`fas ${item.icon} mr-3`}></i>
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {activeNavItem === 'dashboard' && (
            <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Tickets Abertos"
                value={isLoadingStats ? "..." : (ticketStats as any)?.openTickets || 0}
                icon="fa-exclamation-triangle"
                iconColor="bg-red-100 text-red-600"
                change={{ value: (ticketStats as any)?.openTickets ? `${(ticketStats as any).openTickets} abertos` : "Nenhum", type: (ticketStats as any)?.openTickets ? "increase" : "decrease", label: "aguardando atendimento" }}
              />
              <StatsCard
                title="Resolvidos Hoje"
                value={isLoadingStats ? "..." : (ticketStats as any)?.resolvedTickets || 0}
                icon="fa-check-circle"
                iconColor="bg-green-100 text-green-600"
                change={{ value: (ticketStats as any)?.resolvedTickets ? `${(ticketStats as any).resolvedTickets} resolvidos` : "Nenhum", type: (ticketStats as any)?.resolvedTickets ? "increase" : "decrease", label: "hoje" }}
              />
              <StatsCard
                title="Críticos"
                value={isLoadingStats ? "..." : (ticketStats as any)?.criticalTickets || 0}
                icon="fa-exclamation"
                iconColor="bg-orange-100 text-orange-600"
                change={{ value: (ticketStats as any)?.criticalTickets ? `${(ticketStats as any).criticalTickets} críticos` : "Nenhum", type: (ticketStats as any)?.criticalTickets === 0 ? "decrease" : "increase", label: "prioridade máxima" }}
              />
              <StatsCard
                title="Total de Tickets"
                value={isLoadingStats ? "..." : (ticketStats as any)?.totalTickets || 0}
                icon="fa-ticket-alt"
                iconColor="bg-blue-100 text-blue-600"
                change={{ value: (ticketStats as any)?.totalTickets ? `${(ticketStats as any).totalTickets} total` : "Nenhum", type: (ticketStats as any)?.totalTickets ? "increase" : "decrease", label: "na plataforma" }}
              />
            </div>

            {/* Recent Tickets Table */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Tickets Recentes</CardTitle>
                  <Button onClick={() => setIsCreateTicketOpen(true)} data-testid="button-new-ticket">
                    <i className="fas fa-plus mr-2"></i>Novo Ticket
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assunto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingTickets ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center">
                            <div className="loading-skeleton h-4 w-full"></div>
                          </td>
                        </tr>
                      ) : tickets && tickets.length > 0 ? (
                        tickets.map((ticket: any) => (
                          <tr key={ticket.id} data-testid={`row-ticket-${ticket.id}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {ticket.ticketNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ticket.subject}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ticket.customer?.name || 'Cliente não informado'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(ticket.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getPriorityBadge(ticket.priority)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ticket.assignee?.username || 'Não atribuído'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={cn(
                                "font-medium",
                                ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date() 
                                  ? "text-red-600" : "text-green-600"
                              )}>
                                {ticket.slaDeadline 
                                  ? `${Math.ceil((new Date(ticket.slaDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60))}h restantes`
                                  : 'SLA não definido'
                                }
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                            <div className="flex flex-col items-center py-8">
                              <i className="fas fa-ticket-alt text-4xl text-gray-300 mb-4"></i>
                              <p className="text-lg font-medium mb-2">Nenhum ticket encontrado</p>
                              <p className="text-sm mb-4">Crie o primeiro ticket para começar o atendimento.</p>
                              <Button onClick={() => setIsCreateTicketOpen(true)} data-testid="button-create-first-ticket">
                                <i className="fas fa-plus mr-2"></i>Criar Primeiro Ticket
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Tickets por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <i className="fas fa-chart-pie text-4xl text-gray-400 mb-4"></i>
                      <p className="text-gray-600">Gráfico de Pizza - Tickets por Categoria</p>
                      <p className="text-sm text-gray-500 mt-2">Implementação futura</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance da Equipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <i className="fas fa-chart-bar text-4xl text-gray-400 mb-4"></i>
                      <p className="text-gray-600">Gráfico de Barras - Performance dos Agentes</p>
                      <p className="text-sm text-gray-500 mt-2">Implementação futura</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </>
            )}

            {activeNavItem === 'tickets' && (
              <TicketManagement tenantId={tenantId} userRole={user.role} />
            )}
            
            {/* Structure Management */}
            {activeNavItem === 'structure' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestão de Estrutura</h1>
                  <p className="text-gray-600">Organize departamentos e equipes da sua organização</p>
                </div>
                
                <Tabs defaultValue="departments" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="departments" data-testid="tab-departments">
                      <i className="fas fa-building mr-2"></i>
                      Departamentos
                    </TabsTrigger>
                    <TabsTrigger value="teams" data-testid="tab-teams">
                      <i className="fas fa-users mr-2"></i>
                      Equipes
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="departments">
                    <DepartmentManagement />
                  </TabsContent>
                  
                  <TabsContent value="teams">
                    <TeamManagement />
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            {/* Customer Management */}
            {activeNavItem === 'customers' && (
              <CustomerManagement />
            )}
            
            {/* Agent Management */}
            {activeNavItem === 'agents' && (
              <AgentManagement />
            )}
            
            {/* SLA Management */}
            {activeNavItem === 'slas' && (
              <SlaManagement />
            )}
            
            {/* Advanced Analytics */}
            {activeNavItem === 'reports' && (
              <AdvancedAnalytics />
            )}
            
            {/* Knowledge Management */}
            {activeNavItem === 'knowledge' && (
              <KnowledgeManagement />
            )}
            
            {/* AI Insights */}
            {activeNavItem === 'ai-insights' && (
              <AIInsights />
            )}
            
            {/* Other navigation items - placeholder for future implementation */}
            {!['dashboard', 'structure', 'customers', 'agents', 'slas', 'reports', 'knowledge', 'ai-insights'].includes(activeNavItem) && (
              <div className="flex flex-col items-center justify-center h-64">
                <i className="fas fa-tools text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{navigationItems.find(item => item.id === activeNavItem)?.label}</h3>
                <p className="text-gray-600">Esta funcionalidade será implementada em breve.</p>
              </div>
            )}
          </div>
          
          {/* Create Ticket Dialog */}
          <CreateTicketDialog
            isOpen={isCreateTicketOpen}
            onClose={() => {
              setIsCreateTicketOpen(false);
              // Recarregar dados dos tickets e estatísticas após criação
              queryClient.invalidateQueries({ queryKey: ['/api/tickets', tenantId] });
              queryClient.invalidateQueries({ queryKey: ['/api/analytics/ticket-stats', tenantId] });
            }}
          />
        </div>
      </div>
    </div>
  );
}
