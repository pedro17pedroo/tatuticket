import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/lib/auth";

const quickActions = [
  {
    icon: "fa-plus",
    title: "Novo Ticket",
    description: "Criar uma nova solicitação de suporte",
    color: "bg-primary hover:bg-blue-700",
    action: "new-ticket"
  },
  {
    icon: "fa-list",
    title: "Meus Tickets",
    description: "Acompanhar o status das suas solicitações",
    color: "bg-green-500 hover:bg-green-600",
    action: "my-tickets"
  },
  {
    icon: "fa-book",
    title: "Base de Conhecimento",
    description: "Encontrar respostas para dúvidas comuns",
    color: "bg-yellow-500 hover:bg-yellow-600",
    action: "knowledge-base"
  },
  {
    icon: "fa-chart-line",
    title: "Relatórios",
    description: "Ver estatísticas dos seus tickets",
    color: "bg-purple-500 hover:bg-purple-600",
    action: "reports"
  }
];

const mockTickets = [
  {
    id: "TT-2024-015",
    subject: "Problema no login",
    status: "resolved",
    createdAt: "15/01/2024",
    updatedAt: "16/01/2024"
  },
  {
    id: "TT-2024-018",
    subject: "Dúvida sobre relatórios",
    status: "in-progress",
    createdAt: "18/01/2024",
    updatedAt: "Hoje às 14:30"
  }
];

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    resolved: { label: "Resolvido", variant: "outline" },
    "in-progress": { label: "Em Andamento", variant: "default" },
    open: { label: "Aberto", variant: "destructive" },
    closed: { label: "Fechado", variant: "secondary" },
  };
  
  const statusInfo = statusMap[status] || { label: status, variant: "default" };
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
};

export function CustomerPortal() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const user = authService.getCurrentUser();
  const tenantId = authService.getTenantId();

  const { data: customerTickets, isLoading } = useQuery({
    queryKey: ['/api/tickets', { customerId: user?.id }],
    enabled: !!user?.id,
  });

  if (!user || !tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <CardContent>
            <p className="text-center text-gray-600">
              Você precisa estar logado como cliente para acessar este portal.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleQuickAction = (action: string) => {
    setSelectedAction(action);
    // Implementar ações específicas aqui
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Central de Suporte</h1>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Cliente: Acme Corp
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <i className="fas fa-bell"></i>
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=40&h=40" alt="Customer avatar" />
                  <AvatarFallback>AR</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">{user.username}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`${action.color} text-white p-6 h-auto flex-col items-start text-left transition-colors group`}
              onClick={() => handleQuickAction(action.action)}
              data-testid={`button-${action.action}`}
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-white bg-opacity-20">
                <i className={`fas ${action.icon} text-white text-xl`}></i>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
              <p className="text-white text-opacity-90 text-sm">{action.description}</p>
            </Button>
          ))}
        </div>

        {/* SLA Status and Hours Bank */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Status do SLA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Tickets Críticos</span>
                  <span className="text-sm text-green-600 font-medium" data-testid="text-critical-sla">4h restantes</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Tickets Normais</span>
                  <span className="text-sm text-yellow-600 font-medium" data-testid="text-normal-sla">12h restantes</span>
                </div>
                <Progress value={40} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bolsa de Horas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Horas Disponíveis</span>
                <span className="text-2xl font-bold text-primary" data-testid="text-available-hours">42.5h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Horas Utilizadas este Mês</span>
                <span className="text-lg font-semibold text-gray-900" data-testid="text-used-hours">7.5h</span>
              </div>
              <Progress value={18} className="h-3" />
              <Button className="w-full" data-testid="button-reload-hours">
                Recarregar Bolsa
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Tickets Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assunto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Atualização</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">
                        <div className="loading-skeleton h-4 w-full"></div>
                      </td>
                    </tr>
                  ) : (
                    mockTickets.map((ticket) => (
                      <tr key={ticket.id} data-testid={`row-ticket-${ticket.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ticket.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.createdAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.updatedAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-primary hover:text-blue-700"
                            data-testid={`button-view-ticket-${ticket.id}`}
                          >
                            {ticket.status === "resolved" ? "Ver Detalhes" : "Acompanhar"}
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
      </div>
    </div>
  );
}
