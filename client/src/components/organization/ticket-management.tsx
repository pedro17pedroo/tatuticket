import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { authService } from "@/lib/auth";
import type { Ticket } from "@/types/portal";

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

export function TicketManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const tenantId = authService.getTenantId();

  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/tickets', tenantId],
    enabled: !!tenantId,
  });

  // Fetch ticket stats
  const { data: stats } = useQuery({
    queryKey: ['/api/analytics/ticket-stats', tenantId],
    enabled: !!tenantId,
  });

  // Filter tickets
  const filteredTickets = tickets.filter((ticket: Ticket) => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ticket.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
          <span className="ml-3 text-gray-600">Carregando tickets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Tickets</h1>
          <p className="text-gray-600">Gerencie e monitore todos os tickets da organização</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-ticket">
          <i className="fas fa-plus mr-2"></i>
          Novo Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Tickets"
            value={stats.totalTickets || 0}
            icon="fa-ticket-alt"
            iconColor="bg-blue-100 text-blue-600"
            change={{
              value: "+12%",
              type: "increase",
              label: "vs mês anterior"
            }}
          />
          <StatsCard
            title="Tickets Abertos"
            value={stats.openTickets || 0}
            icon="fa-exclamation-circle"
            iconColor="bg-orange-100 text-orange-600"
            change={{
              value: "-5%",
              type: "decrease",
              label: "vs semana anterior"
            }}
          />
          <StatsCard
            title="Tickets Resolvidos"
            value={stats.resolvedTickets || 0}
            icon="fa-check-circle"
            iconColor="bg-green-100 text-green-600"
            change={{
              value: "+18%",
              type: "increase",
              label: "vs mês anterior"
            }}
          />
          <StatsCard
            title="Críticos"
            value={stats.criticalTickets || 0}
            icon="fa-fire"
            iconColor="bg-red-100 text-red-600"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-filter mr-2"></i>
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Buscar tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-tickets"
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger data-testid="select-priority-filter">
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              <i className="fas fa-list mr-2"></i>
              Tickets ({filteredTickets.length})
            </span>
            <div className="text-sm text-gray-600">
              {searchTerm && `Filtrando por: "${searchTerm}"`}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
              <p className="text-lg font-medium text-gray-600 mb-2">
                Nenhum ticket encontrado
              </p>
              <p className="text-gray-500">
                {searchTerm ? "Tente usar outros termos de busca" : "Crie seu primeiro ticket"}
              </p>
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
                          {ticket.customer && (
                            <span>
                              <i className="fas fa-user mr-1"></i>
                              {ticket.customer.name}
                            </span>
                          )}
                          {ticket.assignee && (
                            <span>
                              <i className="fas fa-user-tie mr-1"></i>
                              {ticket.assignee.username}
                            </span>
                          )}
                          <span>
                            <i className="fas fa-clock mr-1"></i>
                            {formatDate(ticket.createdAt)}
                          </span>
                          <span>
                            <i className="fas fa-stopwatch mr-1"></i>
                            {ticket.timeSpent}h
                          </span>
                          <span>
                            <i className="fas fa-dollar-sign mr-1"></i>
                            {formatCurrency(ticket.cost)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex items-center space-x-2">
                        <Button variant="outline" size="sm" data-testid={`button-view-ticket-${ticket.ticketNumber}`}>
                          <i className="fas fa-eye mr-1"></i>
                          Ver
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-edit-ticket-${ticket.ticketNumber}`}>
                          <i className="fas fa-edit mr-1"></i>
                          Editar
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

      {/* Create Ticket Dialog */}
      <CreateTicketDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}