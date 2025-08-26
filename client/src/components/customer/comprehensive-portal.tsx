import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { KnowledgeBaseSearch } from "@/components/customer/knowledge-base-search";
import { SlaHoursDashboard } from "@/components/customer/sla-hours-dashboard";
import { TicketDetailsView } from "@/components/customer/ticket-details-view";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Ticket, Customer, KnowledgeArticle } from "@shared/schema";

interface CustomerPortalProps {
  customerId: string;
  customerData: Customer;
}

const priorityColors = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200"
};

const statusColors = {
  open: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-purple-100 text-purple-800 border-purple-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200"
};

interface NewTicketData {
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  attachments?: File[];
}

export function CustomerPortalComprehensive({ customerId, customerData }: CustomerPortalProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newTicket, setNewTicket] = useState<NewTicketData>({
    subject: "",
    description: "",
    priority: "medium",
    category: "",
    attachments: []
  });

  // Fetch customer tickets
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets/customer", customerId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets?customerId=${customerId}`);
      return response.json();
    }
  });

  // Fetch knowledge articles
  const { data: knowledgeArticles = [], isLoading: isLoadingKnowledge } = useQuery<KnowledgeArticle[]>({
    queryKey: ["/api/knowledge-base", customerData.tenantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/knowledge-base?tenantId=${customerData.tenantId}`);
      return response.json();
    }
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: NewTicketData) => {
      const response = await apiRequest("POST", "/api/tickets/customer", {
        ...ticketData,
        customerId,
        tenantId: customerData.tenantId
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Ticket criado com sucesso!",
        description: `Ticket #${data.ticket.ticketNumber} foi criado. Você receberá atualizações por email.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/customer"] });
      setIsTicketDialogOpen(false);
      setNewTicket({
        subject: "",
        description: "",
        priority: "medium",
        category: "",
        attachments: []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar ticket",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Filter tickets based on search
  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate ticket stats
  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    closed: tickets.filter(t => t.status === "closed").length,
    avgResolutionTime: tickets.length > 0 ? 
      Math.round(tickets.filter(t => t.resolvedAt).reduce((acc, ticket) => {
        const created = new Date(ticket.createdAt!).getTime();
        const resolved = new Date(ticket.resolvedAt!).getTime();
        return acc + (resolved - created) / (1000 * 60 * 60); // hours
      }, 0) / tickets.filter(t => t.resolvedAt).length) : 0
  };

  const handleCreateTicket = () => {
    createTicketMutation.mutate(newTicket);
  };

  const getCategoryIcon = (category: string) => {
    const categoryIcons: Record<string, string> = {
      "Suporte Técnico": "fa-wrench",
      "Financeiro": "fa-dollar-sign",
      "Comercial": "fa-briefcase",
      "Produto": "fa-box",
      "Outro": "fa-question-circle"
    };
    return categoryIcons[category] || "fa-ticket-alt";
  };

  if (isLoadingTickets) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seu portal...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">Portal do Cliente</h1>
              <Badge className="bg-primary text-white">{customerData.name}</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative"
                data-testid="notifications-bell"
              >
                <i className="fas fa-bell"></i>
                {ticketStats.open > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {ticketStats.open}
                  </span>
                )}
              </Button>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{customerData.name}</span>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {customerData.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <i className="fas fa-tachometer-alt mr-2"></i>
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tickets" data-testid="tab-tickets">
              <i className="fas fa-ticket-alt mr-2"></i>
              Meus Tickets
            </TabsTrigger>
            <TabsTrigger value="knowledge" data-testid="tab-knowledge">
              <i className="fas fa-book mr-2"></i>
              Base de Conhecimento
            </TabsTrigger>
            <TabsTrigger value="sla" data-testid="tab-sla">
              <i className="fas fa-clock mr-2"></i>
              SLA & Status
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">
              <i className="fas fa-user mr-2"></i>
              Perfil
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Bem-vindo, {customerData.name.split(' ')[0]}!
                </h2>
                <p className="text-gray-600">Aqui está um resumo da sua conta</p>
              </div>
              <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-ticket">
                    <i className="fas fa-plus mr-2"></i>
                    Novo Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" data-testid="dialog-create-ticket">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Ticket de Suporte</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subject">Assunto *</Label>
                        <Input
                          id="subject"
                          value={newTicket.subject}
                          onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                          placeholder="Descreva brevemente o problema"
                          data-testid="input-ticket-subject"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Categoria</Label>
                        <Select value={newTicket.category} onValueChange={(value) => setNewTicket({...newTicket, category: value})}>
                          <SelectTrigger data-testid="select-ticket-category">
                            <SelectValue placeholder="Selecione uma categoria..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                            <SelectItem value="Financeiro">Financeiro</SelectItem>
                            <SelectItem value="Comercial">Comercial</SelectItem>
                            <SelectItem value="Produto">Produto</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição Detalhada *</Label>
                      <Textarea
                        id="description"
                        value={newTicket.description}
                        onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                        placeholder="Descreva o problema em detalhes, incluindo passos para reproduzir, mensagens de erro, etc."
                        rows={4}
                        data-testid="textarea-ticket-description"
                      />
                    </div>

                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket({...newTicket, priority: value})}>
                        <SelectTrigger data-testid="select-ticket-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                              Baixa - Dúvidas gerais
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                              Média - Problemas que afetam o trabalho
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                              Alta - Problemas críticos
                            </div>
                          </SelectItem>
                          <SelectItem value="critical">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                              Crítica - Sistema inoperante
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsTicketDialogOpen(false)}
                        data-testid="button-cancel-ticket"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleCreateTicket}
                        disabled={!newTicket.subject || !newTicket.description || createTicketMutation.isPending}
                        data-testid="button-save-ticket"
                      >
                        {createTicketMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Criando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check mr-2"></i>
                            Criar Ticket
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Tickets</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-tickets">{ticketStats.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-ticket-alt text-blue-600"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tickets Abertos</p>
                      <p className="text-2xl font-bold text-orange-600" data-testid="stat-open-tickets">{ticketStats.open}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-clock text-orange-600"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Resolvidos</p>
                      <p className="text-2xl font-bold text-green-600" data-testid="stat-resolved-tickets">{ticketStats.resolved}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-check-circle text-green-600"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="stat-avg-resolution">
                        {ticketStats.avgResolutionTime}h
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-hourglass-half text-purple-600"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Tickets Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTickets.slice(0, 5).length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-ticket-alt text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ticket ainda</h3>
                    <p className="text-gray-600 mb-4">Crie seu primeiro ticket de suporte para começar.</p>
                    <Button onClick={() => setIsTicketDialogOpen(true)} data-testid="button-create-first-ticket">
                      <i className="fas fa-plus mr-2"></i>
                      Criar Primeiro Ticket
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTickets.slice(0, 5).map(ticket => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedTicketId(ticket.id)}
                        data-testid={`ticket-summary-${ticket.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <i className={`fas ${getCategoryIcon(ticket.category || "")} text-gray-600`}></i>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                            <p className="text-sm text-gray-600">#{ticket.ticketNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={cn("text-xs", statusColors[ticket.status as keyof typeof statusColors])}>
                            {ticket.status === "open" && "Aberto"}
                            {ticket.status === "in_progress" && "Em Andamento"}
                            {ticket.status === "resolved" && "Resolvido"}
                            {ticket.status === "closed" && "Fechado"}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(ticket.createdAt!).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Meus Tickets</h2>
                <p className="text-gray-600">Acompanhe o status de todos os seus tickets</p>
              </div>
              <div className="flex gap-4">
                <Input
                  placeholder="Buscar tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                  data-testid="input-search-tickets"
                />
                <Button onClick={() => setIsTicketDialogOpen(true)} data-testid="button-new-ticket">
                  <i className="fas fa-plus mr-2"></i>
                  Novo Ticket
                </Button>
              </div>
            </div>

            <Card>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Última Atualização</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex flex-col items-center">
                              <i className="fas fa-search text-3xl text-gray-300 mb-2"></i>
                              <p className="text-gray-500">
                                {searchQuery ? "Nenhum ticket encontrado para sua busca" : "Você ainda não tem tickets"}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTickets.map(ticket => (
                          <TableRow key={ticket.id} data-testid={`ticket-row-${ticket.id}`}>
                            <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={ticket.subject}>
                                {ticket.subject}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <i className={`fas ${getCategoryIcon(ticket.category || "")} text-gray-400`}></i>
                                <span>{ticket.category || "Sem categoria"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("text-xs", statusColors[ticket.status as keyof typeof statusColors])}>
                                {ticket.status === "open" && "Aberto"}
                                {ticket.status === "in_progress" && "Em Andamento"}
                                {ticket.status === "resolved" && "Resolvido"}
                                {ticket.status === "closed" && "Fechado"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("text-xs", priorityColors[ticket.priority as keyof typeof priorityColors])}>
                                {ticket.priority === "low" && "Baixa"}
                                {ticket.priority === "medium" && "Média"}
                                {ticket.priority === "high" && "Alta"}
                                {ticket.priority === "critical" && "Crítica"}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(ticket.createdAt!).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{new Date(ticket.updatedAt!).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTicketId(ticket.id)}
                                data-testid={`button-view-ticket-${ticket.id}`}
                              >
                                <i className="fas fa-eye mr-1"></i>
                                Ver Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge">
            <KnowledgeBaseSearch 
              tenantId={customerData.tenantId} 
              articles={knowledgeArticles}
              isLoading={isLoadingKnowledge}
            />
          </TabsContent>

          {/* SLA Tab */}
          <TabsContent value="sla">
            <SlaHoursDashboard 
              customerId={customerId}
              tickets={tickets}
              tenantId={customerData.tenantId}
            />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfil do Cliente</h2>
              <p className="text-gray-600">Informações da sua conta</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input value={customerData.name} disabled />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={customerData.email || ""} disabled />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Telefone</Label>
                    <Input value={customerData.phone || ""} disabled />
                  </div>
                  <div>
                    <Label>Status da Conta</Label>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas da Conta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">{ticketStats.total}</p>
                    <p className="text-sm text-gray-600">Total de Tickets</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{ticketStats.resolved}</p>
                    <p className="text-sm text-gray-600">Tickets Resolvidos</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{ticketStats.avgResolutionTime}h</p>
                    <p className="text-sm text-gray-600">Tempo Médio de Resolução</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Details Modal */}
        {selectedTicketId && (
          <TicketDetailsView
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
          />
        )}
      </div>
    </div>
  );
}