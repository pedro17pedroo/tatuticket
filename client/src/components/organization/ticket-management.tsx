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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Ticket, Customer, Department, Team } from "@shared/schema";

interface TicketManagementProps {
  tenantId: string;
  userRole: string;
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
  customerId: string;
  departmentId: string;
  teamId?: string;
}

export function TicketManagement({ tenantId, userRole }: TicketManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<"list" | "kanban">("list");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newTicket, setNewTicket] = useState<NewTicketData>({
    subject: "",
    description: "",
    priority: "medium",
    category: "",
    customerId: "",
    departmentId: "",
    teamId: ""
  });

  // Fetch tickets
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets", tenantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets?tenantId=${tenantId}`);
      return response.json();
    }
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers", tenantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/customers?tenantId=${tenantId}`);
      return response.json();
    }
  });

  // Fetch departments
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments", tenantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/departments?tenantId=${tenantId}`);
      return response.json();
    }
  });

  // Fetch teams for selected department
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams", tenantId, newTicket.departmentId],
    queryFn: async () => {
      if (!newTicket.departmentId) return [];
      const response = await apiRequest("GET", `/api/teams?departmentId=${newTicket.departmentId}`);
      return response.json();
    },
    enabled: !!newTicket.departmentId
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: NewTicketData) => {
      const response = await apiRequest("POST", "/api/tickets/enhanced", {
        ...ticketData,
        tenantId,
        status: "open"
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Ticket criado com sucesso!",
        description: `Ticket #${data.ticket.ticketNumber} foi criado e atribuído automaticamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setIsCreateDialogOpen(false);
      setNewTicket({
        subject: "",
        description: "",
        priority: "medium",
        category: "",
        customerId: "",
        departmentId: "",
        teamId: ""
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

  // Update ticket status mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: Partial<Ticket> }) => {
      const response = await apiRequest("PUT", `/api/tickets/${ticketId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Ticket atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar ticket",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group tickets by status for kanban view
  const ticketsByStatus = {
    open: filteredTickets.filter(t => t.status === "open"),
    in_progress: filteredTickets.filter(t => t.status === "in_progress"),
    resolved: filteredTickets.filter(t => t.status === "resolved"),
    closed: filteredTickets.filter(t => t.status === "closed")
  };

  const handleCreateTicket = () => {
    createTicketMutation.mutate(newTicket);
  };

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    updateTicketMutation.mutate({
      ticketId,
      updates: { 
        status: newStatus,
        ...(newStatus === "resolved" && { resolvedAt: new Date() })
      }
    });
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Cliente não encontrado";
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    return department?.name || "N/A";
  };

  if (isLoadingTickets) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gestão de Tickets</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão de Tickets</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-ticket">
              <i className="fas fa-plus mr-2"></i>
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" data-testid="dialog-create-ticket">
            <DialogHeader>
              <DialogTitle>Criar Novo Ticket</DialogTitle>
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
                  <Input
                    id="category"
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                    placeholder="Ex: Suporte Técnico, Financeiro"
                    data-testid="input-ticket-category"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Descreva o problema em detalhes..."
                  rows={4}
                  data-testid="textarea-ticket-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket({...newTicket, priority: value})}>
                    <SelectTrigger data-testid="select-ticket-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer">Cliente *</Label>
                  <Select value={newTicket.customerId} onValueChange={(value) => setNewTicket({...newTicket, customerId: value})}>
                    <SelectTrigger data-testid="select-ticket-customer">
                      <SelectValue placeholder="Selecione o cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Departamento *</Label>
                  <Select value={newTicket.departmentId} onValueChange={(value) => setNewTicket({...newTicket, departmentId: value, teamId: ""})}>
                    <SelectTrigger data-testid="select-ticket-department">
                      <SelectValue placeholder="Selecione o departamento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="team">Equipe</Label>
                  <Select value={newTicket.teamId} onValueChange={(value) => setNewTicket({...newTicket, teamId: value})} disabled={!newTicket.departmentId}>
                    <SelectTrigger data-testid="select-ticket-team">
                      <SelectValue placeholder={newTicket.departmentId ? "Selecione a equipe..." : "Escolha um departamento primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-ticket"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateTicket}
                  disabled={!newTicket.subject || !newTicket.description || !newTicket.customerId || !newTicket.departmentId || createTicketMutation.isPending}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="fas fa-inbox text-blue-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Abertos</p>
                <p className="text-xl font-bold" data-testid="stat-open-tickets">{ticketsByStatus.open.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="fas fa-clock text-purple-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Em Andamento</p>
                <p className="text-xl font-bold" data-testid="stat-progress-tickets">{ticketsByStatus.in_progress.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-green-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Resolvidos</p>
                <p className="text-xl font-bold" data-testid="stat-resolved-tickets">{ticketsByStatus.resolved.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <i className="fas fa-archive text-gray-600 text-sm"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fechados</p>
                <p className="text-xl font-bold" data-testid="stat-closed-tickets">{ticketsByStatus.closed.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-4 flex-1">
          <Input
            placeholder="Buscar tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
            data-testid="input-search-tickets"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]" data-testid="select-filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
              <SelectItem value="closed">Fechados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[150px]" data-testid="select-filter-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Prioridades</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={selectedView === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("list")}
            data-testid="button-list-view"
          >
            <i className="fas fa-list mr-2"></i>
            Lista
          </Button>
          <Button
            variant={selectedView === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("kanban")}
            data-testid="button-kanban-view"
          >
            <i className="fas fa-columns mr-2"></i>
            Kanban
          </Button>
        </div>
      </div>

      {/* Tickets Display */}
      {selectedView === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Tickets ({filteredTickets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        <i className="fas fa-inbox text-3xl mb-2"></i>
                        <p>Nenhum ticket encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map(ticket => (
                      <TableRow key={ticket.id} data-testid={`ticket-row-${ticket.id}`}>
                        <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                        <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                        <TableCell>{getCustomerName(ticket.customerId || "")}</TableCell>
                        <TableCell>{getDepartmentName(ticket.departmentId || "")}</TableCell>
                        <TableCell>
                          <Select value={ticket.status} onValueChange={(value) => handleStatusChange(ticket.id, value)}>
                            <SelectTrigger className="w-[120px]" data-testid={`select-status-${ticket.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Aberto</SelectItem>
                              <SelectItem value="in_progress">Em Andamento</SelectItem>
                              <SelectItem value="resolved">Resolvido</SelectItem>
                              <SelectItem value="closed">Fechado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", priorityColors[ticket.priority as keyof typeof priorityColors])}>
                            {ticket.priority === "low" && "Baixa"}
                            {ticket.priority === "medium" && "Média"}
                            {ticket.priority === "high" && "Alta"}
                            {ticket.priority === "critical" && "Crítica"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(ticket.createdAt!).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-view-ticket-${ticket.id}`}
                          >
                            <i className="fas fa-eye mr-1"></i>
                            Ver
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
      ) : (
        // Kanban View
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" data-testid="kanban-board">
          {Object.entries(ticketsByStatus).map(([status, statusTickets]) => (
            <Card key={status} className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {status === "open" && "Abertos"}
                    {status === "in_progress" && "Em Andamento"}
                    {status === "resolved" && "Resolvidos"}
                    {status === "closed" && "Fechados"}
                  </CardTitle>
                  <Badge variant="outline" className="ml-2">
                    {statusTickets.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusTickets.map(ticket => (
                  <Card key={ticket.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer" data-testid={`kanban-card-${ticket.id}`}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm truncate flex-1">
                          {ticket.subject}
                        </h4>
                        <Badge className={cn("text-xs ml-2", priorityColors[ticket.priority as keyof typeof priorityColors])}>
                          {ticket.priority === "critical" && "!"}
                          {ticket.priority === "high" && "↑"}
                          {ticket.priority === "medium" && "→"}
                          {ticket.priority === "low" && "↓"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{ticket.ticketNumber}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{getCustomerName(ticket.customerId || "")}</span>
                        <span>{new Date(ticket.createdAt!).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </Card>
                ))}
                {statusTickets.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <i className="fas fa-inbox text-2xl mb-2"></i>
                    <p className="text-sm">Nenhum ticket</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}