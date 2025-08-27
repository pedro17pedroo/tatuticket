import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { KnowledgeBaseSearch } from "@/components/customer/KnowledgeBaseSearch";
import { TicketDetailsView } from "@/components/customer/ticket-details-view";
import { SLAHoursDashboard } from "@/components/customer/sla-hours-dashboard";
import { AIChatbot } from "@/components/customer/ai-chatbot";
import { authService } from "@/lib/auth";
import type { Ticket } from "@shared/schema";

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
    "in_progress": { label: "Em Andamento", variant: "default" },
    open: { label: "Aberto", variant: "destructive" },
    closed: { label: "Fechado", variant: "secondary" },
  };
  
  const statusInfo = statusMap[status] || { label: status, variant: "default" };
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
};

export function CustomerPortal() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const user = authService.getCurrentUser();
  const tenantId = authService.getTenantId();

  const { data: customerTickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/tickets?customerId=${user?.id}`);
      return response.json();
    },
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
    
    switch (action) {
      case 'new-ticket':
        setIsCreateTicketOpen(true);
        break;
      case 'my-tickets':
        setSelectedAction('my-tickets');
        break;
      case 'knowledge-base':
        setSelectedAction('knowledge-base');
        break;
      case 'reports':
        setSelectedAction('reports');
        break;
    }
  };

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setSelectedAction('ticket-details');
  };

  const handleBackToPortal = () => {
    setSelectedAction(null);
    setSelectedTicketId(null);
  };

  // Conditional rendering based on selected action
  if (selectedAction === 'ticket-details' && selectedTicketId) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">Central de Suporte</h1>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Detalhes do Ticket
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{user.username?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">{user.username}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TicketDetailsView ticketId={selectedTicketId} onBack={handleBackToPortal} />
        </div>
      </div>
    );
  }

  if (selectedAction === 'knowledge-base') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">Central de Suporte</h1>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Base de Conhecimento
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{user.username?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">{user.username}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <KnowledgeBaseSearch onClose={handleBackToPortal} />
        </div>
      </div>
    );
  }

  if (selectedAction === 'reports') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">Central de Suporte</h1>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  SLA e Horas
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{user.username?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">{user.username}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SLAHoursDashboard />
          <div className="mt-6 text-center">
            <Button onClick={handleBackToPortal} data-testid="button-back-to-portal">
              Voltar ao Portal
            </Button>
          </div>
        </div>
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
                  <AvatarFallback>{user.username?.charAt(0)}</AvatarFallback>
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
        <div className="mb-8">
          <SLAHoursDashboard />
        </div>

        {/* Recent Tickets */}
        <Card id="tickets-section">
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
                  ) : customerTickets && customerTickets.length > 0 ? (
                    customerTickets.map((ticket) => (
                      <tr key={ticket.id} data-testid={`row-ticket-${ticket.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ticket.ticketNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-primary hover:text-blue-700"
                            onClick={() => handleViewTicket(ticket.id)}
                            data-testid={`button-view-ticket-${ticket.id}`}
                          >
                            {ticket.status === "resolved" ? "Ver Detalhes" : "Acompanhar"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        <div className="flex flex-col items-center py-8">
                          <i className="fas fa-ticket-alt text-4xl text-gray-300 mb-4"></i>
                          <p className="text-lg font-medium mb-2">Nenhum ticket encontrado</p>
                          <p className="text-sm mb-4">Você ainda não criou nenhum ticket de suporte.</p>
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
      </div>

      {/* Create Ticket Dialog */}
      <CreateTicketDialog
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
      />

      {/* AI Chatbot - always visible */}
      <AIChatbot 
        onCreateTicket={(subject, description) => {
          console.log('Creating ticket from AI:', { subject, description });
          // Here you could automatically create the ticket or open the dialog pre-filled
          setSelectedTicket(null);
          setActiveView('my-tickets');
        }}
      />
    </div>
  );
}
