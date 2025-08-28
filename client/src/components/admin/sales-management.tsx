import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/ui/stats-card";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Search, Eye, Edit, Download, Phone, Mail, Building, Calendar, DollarSign, Clock, Filter, X } from "lucide-react";

interface SalesLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  companySize: string;
  industry: string;
  currentTicketVolume: string;
  budget: string;
  timeline: string;
  requirements?: string;
  challenges?: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  priority: "low" | "medium" | "high" | "enterprise";
  assignedTo?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

interface SalesStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  averageDealValue: number;
  monthlyRevenue: number;
}

export function SalesManagement() {
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [timelineFilter, setTimelineFilter] = useState<string>("all");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Mock data for now - replace with real API calls
  const { data: salesStats, isLoading: isLoadingStats } = useQuery<SalesStats>({
    queryKey: ['/api/sales-stats'],
    queryFn: () => Promise.resolve({
      totalLeads: 47,
      newLeads: 12,
      qualifiedLeads: 18,
      conversionRate: 24,
      averageDealValue: 85000,
      monthlyRevenue: 340000
    })
  });

  const { data: salesLeads, isLoading: isLoadingLeads } = useQuery<SalesLead[]>({
    queryKey: ['/api/sales-contacts'],
    queryFn: () => Promise.resolve([
      {
        id: "1",
        name: "Carlos Mendes",
        email: "carlos.mendes@techcorp.ao",
        phone: "+244 924 567 890",
        company: "TechCorp Solutions",
        jobTitle: "CTO",
        companySize: "201-500",
        industry: "Tecnologia",
        currentTicketVolume: "1001-5000",
        budget: "250k-500k",
        timeline: "1-3-months",
        requirements: "Integração com Salesforce, instalação on-premise, conformidade GDPR",
        challenges: "Alto volume de tickets, falta de automação, tempo de resposta lento",
        status: "qualified",
        priority: "enterprise",
        source: "pricing_page",
        createdAt: "2025-01-15T09:30:00Z",
        updatedAt: "2025-01-16T14:20:00Z",
        assignedTo: "João Silva",
        notes: "Cliente muito interessado, orçamento aprovado. Agendar demo técnica."
      },
      {
        id: "2",
        name: "Maria Santos",
        email: "maria.santos@retailmax.ao",
        phone: "+244 912 345 678",
        company: "RetailMax",
        jobTitle: "Diretora de TI",
        companySize: "51-200",
        industry: "Varejo",
        currentTicketVolume: "501-1000",
        budget: "100k-250k",
        timeline: "immediate",
        requirements: "Integração com e-commerce, suporte 24/7",
        challenges: "Picos de demanda em épocas sazonais",
        status: "contacted",
        priority: "high",
        source: "pricing_page",
        createdAt: "2025-01-14T16:45:00Z",
        updatedAt: "2025-01-15T10:30:00Z",
        assignedTo: "Ana Costa",
        notes: "Primeira reunião agendada para próxima segunda. Enviar material sobre integração e-commerce."
      },
      {
        id: "3",
        name: "Pedro Oliveira",
        email: "pedro.oliveira@globaltech.ao",
        phone: "+244 934 876 543",
        company: "GlobalTech",
        jobTitle: "Operations Director",
        companySize: "1000+",
        industry: "Telecomunicações",
        currentTicketVolume: "5000+",
        budget: "500k+",
        timeline: "3-6-months",
        requirements: "Solução enterprise completa, múltiplos data centers",
        challenges: "Compliance rigoroso, alta disponibilidade crítica",
        status: "proposal",
        priority: "enterprise",
        source: "pricing_page",
        createdAt: "2025-01-12T11:20:00Z",
        updatedAt: "2025-01-17T09:15:00Z",
        assignedTo: "Ricardo Pereira",
        notes: "Proposta técnica enviada. Aguardando feedback do comitê técnico."
      },
      {
        id: "4",
        name: "Julia Rodrigues",
        email: "julia.rodrigues@startup.ao",
        phone: "+244 923 456 789",
        company: "StartupX",
        jobTitle: "Head of Customer Success",
        companySize: "11-50",
        industry: "SaaS",
        currentTicketVolume: "101-500",
        budget: "50k-100k",
        timeline: "1-month",
        requirements: "Solução ágil, fácil implementação",
        challenges: "Equipe pequena, crescimento rápido",
        status: "new",
        priority: "medium",
        source: "pricing_page",
        createdAt: "2025-01-18T14:30:00Z",
        updatedAt: "2025-01-18T14:30:00Z",
        notes: ""
      }
    ])
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: string; updates: Partial<SalesLead> }) => {
      const response = await apiRequest("PATCH", `/api/sales-contacts/${leadId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-stats'] });
      toast({
        title: "Lead atualizado com sucesso!",
        description: "As informações foram salvas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar lead",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const filteredLeads = salesLeads?.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;
    const matchesTimeline = timelineFilter === "all" || lead.timeline === timelineFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesTimeline;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      new: { label: "Novo", variant: "outline" },
      contacted: { label: "Contactado", variant: "secondary" },
      qualified: { label: "Qualificado", variant: "default" },
      proposal: { label: "Proposta", variant: "default" },
      negotiation: { label: "Negociação", variant: "default" },
      closed_won: { label: "Fechado", variant: "default" },
      closed_lost: { label: "Perdido", variant: "destructive" },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; className: string }> = {
      low: { label: "Baixa", className: "bg-gray-100 text-gray-800" },
      medium: { label: "Média", className: "bg-yellow-100 text-yellow-800" },
      high: { label: "Alta", className: "bg-orange-100 text-orange-800" },
      enterprise: { label: "Enterprise", className: "bg-purple-100 text-purple-800" },
    };
    
    const priorityInfo = priorityMap[priority] || { label: priority, className: "bg-gray-100 text-gray-800" };
    return <Badge variant="outline" className={priorityInfo.className}>{priorityInfo.label}</Badge>;
  };

  const formatBudget = (budget: string) => {
    const budgetMap: Record<string, string> = {
      "under-50k": "< Kz 50K",
      "50k-100k": "Kz 50K - 100K",
      "100k-250k": "Kz 100K - 250K",
      "250k-500k": "Kz 250K - 500K",
      "500k+": "> Kz 500K",
      "to-discuss": "A discutir"
    };
    return budgetMap[budget] || budget;
  };

  const formatTimeline = (timeline: string) => {
    const timelineMap: Record<string, string> = {
      "immediate": "Imediato",
      "1-month": "1 mês",
      "1-3-months": "1-3 meses",
      "3-6-months": "3-6 meses",
      "6-12-months": "6-12 meses",
      "planning": "Planejamento"
    };
    return timelineMap[timeline] || timeline;
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<SalesLead>) => {
    setIsUpdating(true);
    try {
      await updateLeadMutation.mutateAsync({ leadId, updates });
      if (selectedLead) {
        setSelectedLead({ ...selectedLead, ...updates });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const exportLeads = () => {
    const csvContent = [
      "Nome,Email,Telefone,Empresa,Cargo,Status,Prioridade,Orçamento,Timeline,Criado em",
      ...filteredLeads.map(lead => 
        `"${lead.name}","${lead.email}","${lead.phone}","${lead.company}","${lead.jobTitle}","${lead.status}","${lead.priority}","${formatBudget(lead.budget)}","${formatTimeline(lead.timeline)}","${new Date(lead.createdAt).toLocaleDateString('pt-BR')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads-vendas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatsCard
          title="Total de Leads"
          value={isLoadingStats ? "..." : salesStats?.totalLeads || 0}
          icon="fa-users"
          iconColor="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Novos Leads"
          value={isLoadingStats ? "..." : salesStats?.newLeads || 0}
          icon="fa-user-plus"
          iconColor="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Qualificados"
          value={isLoadingStats ? "..." : salesStats?.qualifiedLeads || 0}
          icon="fa-check-circle"
          iconColor="bg-purple-100 text-purple-600"
        />
        <StatsCard
          title="Taxa Conversão"
          value={isLoadingStats ? "..." : `${salesStats?.conversionRate || 0}%`}
          icon="fa-percentage"
          iconColor="bg-yellow-100 text-yellow-600"
        />
        <StatsCard
          title="Ticket Médio"
          value={isLoadingStats ? "..." : `Kz ${salesStats?.averageDealValue?.toLocaleString() || 0}`}
          icon="fa-dollar-sign"
          iconColor="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Receita Mensal"
          value={isLoadingStats ? "..." : `Kz ${salesStats?.monthlyRevenue?.toLocaleString() || 0}`}
          icon="fa-chart-line"
          iconColor="bg-green-100 text-green-600"
        />
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl font-semibold">Gestão de Leads de Vendas</CardTitle>
            <Button onClick={exportLeads} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, empresa ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="contacted">Contactado</SelectItem>
                  <SelectItem value="qualified">Qualificado</SelectItem>
                  <SelectItem value="proposal">Proposta</SelectItem>
                  <SelectItem value="negotiation">Negociação</SelectItem>
                  <SelectItem value="closed_won">Fechado</SelectItem>
                  <SelectItem value="closed_lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timelineFilter} onValueChange={setTimelineFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="immediate">Imediato</SelectItem>
                  <SelectItem value="1-month">1 mês</SelectItem>
                  <SelectItem value="1-3-months">1-3 meses</SelectItem>
                  <SelectItem value="3-6-months">3-6 meses</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || timelineFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setTimelineFilter("all");
                  }}
                  className="flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {/* Leads Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orçamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingLeads ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="loading-skeleton h-4 w-full"></div>
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || timelineFilter !== "all" 
                        ? "Nenhum lead encontrado com os filtros aplicados." 
                        : "Nenhum lead de vendas encontrado."}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-sm">
                              {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                            <div className="text-sm text-gray-500">{lead.jobTitle}</div>
                            <div className="text-xs text-gray-400">{lead.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.company}</div>
                        <div className="text-sm text-gray-500">{lead.industry}</div>
                        <div className="text-xs text-gray-400">{lead.companySize} funcionários</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(lead.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatBudget(lead.budget)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimeline(lead.timeline)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsLeadDetailsOpen(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Ver
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

      {/* Lead Details Modal */}
      <Dialog open={isLeadDetailsOpen} onOpenChange={setIsLeadDetailsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Detalhes do Lead: {selectedLead?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6">
              {/* Lead Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Informações de Contacto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nome</Label>
                      <p className="text-sm font-medium">{selectedLead.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-sm">{selectedLead.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                      <p className="text-sm">{selectedLead.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Cargo</Label>
                      <p className="text-sm">{selectedLead.jobTitle}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Informações da Empresa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Empresa</Label>
                      <p className="text-sm font-medium">{selectedLead.company}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Setor</Label>
                      <p className="text-sm">{selectedLead.industry}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tamanho</Label>
                      <p className="text-sm">{selectedLead.companySize} funcionários</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Volume de Tickets</Label>
                      <p className="text-sm">{selectedLead.currentTicketVolume} tickets/mês</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Project Details */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Detalhes do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Orçamento</Label>
                    <p className="text-sm font-medium">{formatBudget(selectedLead.budget)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Timeline</Label>
                    <p className="text-sm">{formatTimeline(selectedLead.timeline)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Fonte</Label>
                    <p className="text-sm">{selectedLead.source}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements and Challenges */}
              {(selectedLead.requirements || selectedLead.challenges) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedLead.requirements && (
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Requisitos Específicos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">{selectedLead.requirements}</p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedLead.challenges && (
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Principais Desafios</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">{selectedLead.challenges}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Status Management */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Gestão do Lead</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={selectedLead.status}
                        onValueChange={(value) => handleUpdateLead(selectedLead.id, { status: value as any })}
                        disabled={isUpdating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Novo</SelectItem>
                          <SelectItem value="contacted">Contactado</SelectItem>
                          <SelectItem value="qualified">Qualificado</SelectItem>
                          <SelectItem value="proposal">Proposta</SelectItem>
                          <SelectItem value="negotiation">Negociação</SelectItem>
                          <SelectItem value="closed_won">Fechado (Ganho)</SelectItem>
                          <SelectItem value="closed_lost">Fechado (Perdido)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select
                        value={selectedLead.priority}
                        onValueChange={(value) => handleUpdateLead(selectedLead.id, { priority: value as any })}
                        disabled={isUpdating}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas Internas</Label>
                    <Textarea
                      id="notes"
                      value={selectedLead.notes || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                      placeholder="Adicione notas sobre este lead..."
                      rows={3}
                    />
                    <Button
                      onClick={() => handleUpdateLead(selectedLead.id, { notes: selectedLead.notes })}
                      className="mt-2"
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Salvando..." : "Salvar Notas"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      <div>Criado em: {new Date(selectedLead.createdAt).toLocaleString('pt-BR')}</div>
                      <div>Atualizado em: {new Date(selectedLead.updatedAt).toLocaleString('pt-BR')}</div>
                      {selectedLead.assignedTo && <div>Responsável: {selectedLead.assignedTo}</div>}
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(selectedLead.status)}
                      {getPriorityBadge(selectedLead.priority)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}