import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/ui/stats-card";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { authService } from "@/lib/auth";
import type { Ticket } from "@/types/portal";

export function ComprehensivePortal() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const user = authService.getCurrentUser();
  const tenantId = authService.getTenantId();

  // Fetch customer tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/tickets/customer', user?.id],
    enabled: !!user?.id,
  });

  // Fetch customer stats
  const { data: customerStats } = useQuery({
    queryKey: ['/api/analytics/customer-stats', user?.id],
    enabled: !!user?.id,
  });

  // Fetch knowledge articles
  const { data: knowledgeArticles = [] } = useQuery({
    queryKey: ['/api/knowledge-articles', tenantId],
    enabled: !!tenantId,
  });

  // Filter tickets by search term
  const filteredTickets = tickets.filter((ticket: Ticket) =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter knowledge articles by search term
  const filteredArticles = knowledgeArticles.filter((article: any) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800", 
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800"
  };

  const statusColors = {
    open: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Portal do Cliente
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bem-vindo, {user?.username}
              </span>
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-ticket">
                <i className="fas fa-plus mr-2"></i>
                Novo Ticket
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Central de Atendimento
          </h2>
          <p className="text-gray-600 mb-6">
            Gerencie seus tickets, consulte nossa base de conhecimento e acompanhe o status do seus atendimentos.
          </p>

          {/* Stats Cards */}
          {customerStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Meus Tickets"
                value={customerStats.totalTickets || 0}
                icon="fa-ticket-alt"
                iconColor="bg-blue-100 text-blue-600"
              />
              <StatsCard
                title="Tickets Abertos"
                value={customerStats.openTickets || 0}
                icon="fa-exclamation-circle"
                iconColor="bg-orange-100 text-orange-600"
              />
              <StatsCard
                title="Tickets Resolvidos"
                value={customerStats.resolvedTickets || 0}
                icon="fa-check-circle"
                iconColor="bg-green-100 text-green-600"
              />
              <StatsCard
                title="Tempo Médio"
                value={`${customerStats.avgResolutionTime || 0}h`}
                icon="fa-clock"
                iconColor="bg-purple-100 text-purple-600"
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tickets" className="flex items-center" data-testid="tab-tickets">
              <i className="fas fa-ticket-alt mr-2"></i>
              Meus Tickets
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center" data-testid="tab-knowledge">
              <i className="fas fa-book mr-2"></i>
              Base de Conhecimento
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center" data-testid="tab-profile">
              <i className="fas fa-user mr-2"></i>
              Meu Perfil
            </TabsTrigger>
          </TabsList>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <i className="fas fa-list mr-2"></i>
                    Meus Tickets ({filteredTickets.length})
                  </CardTitle>
                  <div className="flex items-center space-x-4">
                    <Input
                      placeholder="Buscar tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                      data-testid="input-search-tickets"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                    <span className="ml-3 text-gray-600">Carregando tickets...</span>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
                    <p className="text-lg font-medium text-gray-600 mb-2">
                      Nenhum ticket encontrado
                    </p>
                    <p className="text-gray-500 mb-6">
                      {searchTerm ? "Tente usar outros termos de busca" : "Crie seu primeiro ticket de suporte"}
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-ticket">
                      <i className="fas fa-plus mr-2"></i>
                      Criar Primeiro Ticket
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTickets.map((ticket: Ticket) => (
                      <Card key={ticket.id} className="hover:shadow-md transition-shadow" data-testid={`ticket-${ticket.ticketNumber}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  #{ticket.ticketNumber}
                                </h3>
                                <Badge className={priorityColors[ticket.priority]}>
                                  {ticket.priority}
                                </Badge>
                                <Badge className={statusColors[ticket.status]}>
                                  {ticket.status}
                                </Badge>
                              </div>
                              
                              <h4 className="font-medium text-gray-800 mb-2">
                                {ticket.subject}
                              </h4>
                              
                              {ticket.description && (
                                <p className="text-gray-600 mb-3 line-clamp-2">
                                  {ticket.description}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-6 text-sm text-gray-500">
                                <span>
                                  <i className="fas fa-calendar mr-1"></i>
                                  Criado em {formatDate(ticket.createdAt)}
                                </span>
                                {ticket.assignee && (
                                  <span>
                                    <i className="fas fa-user-tie mr-1"></i>
                                    Atribuído para {ticket.assignee.username}
                                  </span>
                                )}
                                {ticket.slaDeadline && (
                                  <span>
                                    <i className="fas fa-alarm-clock mr-1"></i>
                                    SLA: {formatDate(ticket.slaDeadline)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="ml-4">
                              <Button variant="outline" size="sm" data-testid={`button-view-ticket-${ticket.ticketNumber}`}>
                                <i className="fas fa-eye mr-1"></i>
                                Ver Detalhes
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <i className="fas fa-book mr-2"></i>
                    Base de Conhecimento ({filteredArticles.length} artigos)
                  </CardTitle>
                  <Input
                    placeholder="Buscar artigos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                    data-testid="input-search-articles"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredArticles.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
                    <p className="text-lg font-medium text-gray-600 mb-2">
                      Nenhum artigo encontrado
                    </p>
                    <p className="text-gray-500">
                      {searchTerm ? "Tente usar outros termos de busca" : "A base de conhecimento está em desenvolvimento"}
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredArticles.map((article: any) => (
                      <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`article-${article.slug}`}>
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            {article.title}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {article.content.replace(/[#*]/g, '').substring(0, 150)}...
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-500">
                              <i className="fas fa-eye mr-1"></i>
                              {article.viewCount} visualizações
                            </div>
                            <Button variant="outline" size="sm" data-testid={`button-read-article-${article.slug}`}>
                              <i className="fas fa-arrow-right mr-1"></i>
                              Ler Mais
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-user mr-2"></i>
                    Informações do Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome de Usuário</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {user?.username}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nível de Acesso</label>
                    <div className="mt-1">
                      <Badge variant="outline">{user?.role}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" data-testid="button-edit-profile">
                    <i className="fas fa-edit mr-2"></i>
                    Editar Perfil
                  </Button>
                </CardContent>
              </Card>

              {/* Account Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-cog mr-2"></i>
                    Configurações da Conta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-change-password">
                      <i className="fas fa-key mr-3"></i>
                      Alterar Senha
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-notification-settings">
                      <i className="fas fa-bell mr-3"></i>
                      Configurações de Notificação
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-privacy-settings">
                      <i className="fas fa-shield-alt mr-3"></i>
                      Configurações de Privacidade
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" data-testid="button-delete-account">
                      <i className="fas fa-trash mr-3"></i>
                      Excluir Conta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Ticket Dialog */}
      <CreateTicketDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}