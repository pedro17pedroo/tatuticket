import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  FileText,
  Target,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface TimeEntry {
  id: string;
  ticketId: string;
  ticketSubject: string;
  agentId: string;
  agentName: string;
  departmentId: string;
  departmentName: string;
  startTime: string;
  endTime?: string;
  duration: number; // minutes
  description: string;
  billable: boolean;
  hourlyRate: number;
  status: "active" | "paused" | "completed";
  createdAt: string;
}

interface CostAnalysis {
  totalTime: number;
  billableTime: number;
  nonBillableTime: number;
  totalCost: number;
  revenue: number;
  profit: number;
  profitMargin: number;
}

interface AgentProductivity {
  agentId: string;
  agentName: string;
  totalHours: number;
  billableHours: number;
  productivity: number; // percentage
  avgHourlyRate: number;
  totalRevenue: number;
  ticketsCompleted: number;
}

export function TimeCostTracking() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const { toast } = useToast();
  const tenantId = authService.getTenantId();
  const currentUser = authService.getCurrentUser();

  // Mock data for demonstration
  const mockTimeEntries: TimeEntry[] = [
    {
      id: "1",
      ticketId: "TK-001",
      ticketSubject: "Problema de Login - Cliente ABC",
      agentId: "agent-1",
      agentName: "Maria Santos",
      departmentId: "dept-1",
      departmentName: "Suporte Técnico",
      startTime: "2024-01-15T09:00:00",
      endTime: "2024-01-15T10:30:00",
      duration: 90,
      description: "Investigação e resolução de problema de autenticação",
      billable: true,
      hourlyRate: 85,
      status: "completed",
      createdAt: "2024-01-15T09:00:00"
    },
    {
      id: "2",
      ticketId: "TK-002",
      ticketSubject: "Configuração de API",
      agentId: "agent-2",
      agentName: "João Silva",
      departmentId: "dept-1",
      departmentName: "Suporte Técnico",
      startTime: "2024-01-15T14:00:00",
      duration: 45,
      description: "Desenvolvimento em andamento",
      billable: true,
      hourlyRate: 90,
      status: "active",
      createdAt: "2024-01-15T14:00:00"
    }
  ];

  const mockCostAnalysis: CostAnalysis = {
    totalTime: 2520, // minutes
    billableTime: 2100, // minutes
    nonBillableTime: 420, // minutes
    totalCost: 3675, // R$
    revenue: 4200, // R$
    profit: 525, // R$
    profitMargin: 12.5 // %
  };

  const mockAgentProductivity: AgentProductivity[] = [
    {
      agentId: "agent-1",
      agentName: "Maria Santos",
      totalHours: 32,
      billableHours: 28,
      productivity: 87.5,
      avgHourlyRate: 85,
      totalRevenue: 2380,
      ticketsCompleted: 15
    },
    {
      agentId: "agent-2", 
      agentName: "João Silva",
      totalHours: 35,
      billableHours: 30,
      productivity: 85.7,
      avgHourlyRate: 90,
      totalRevenue: 2700,
      ticketsCompleted: 12
    }
  ];

  // Fetch time entries
  const { data: timeEntries = mockTimeEntries, isLoading: loadingEntries } = useQuery({
    queryKey: ['/api/time-entries', tenantId, selectedPeriod],
    enabled: !!tenantId,
  });

  // Fetch cost analysis
  const { data: costAnalysis = mockCostAnalysis, isLoading: loadingAnalysis } = useQuery({
    queryKey: ['/api/cost-analysis', tenantId, selectedPeriod],
    enabled: !!tenantId,
  });

  // Fetch agent productivity
  const { data: agentProductivity = mockAgentProductivity, isLoading: loadingProductivity } = useQuery({
    queryKey: ['/api/agent-productivity', tenantId, selectedPeriod],
    enabled: !!tenantId,
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Ativo", variant: "default" as const, icon: Play },
      paused: { label: "Pausado", variant: "secondary" as const, icon: Pause },
      completed: { label: "Finalizado", variant: "outline" as const, icon: CheckCircle }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.completed;
    const StatusIcon = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <StatusIcon className="w-3 h-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const startTimer = (ticketId: string, ticketSubject: string) => {
    // Implementation for starting timer
    setActiveTimer({
      id: `timer-${Date.now()}`,
      ticketId,
      ticketSubject,
      agentId: currentUser?.id || "current-agent",
      agentName: currentUser?.username || "Agente Atual",
      departmentId: "dept-1",
      departmentName: "Departamento",
      startTime: new Date().toISOString(),
      duration: 0,
      description: "",
      billable: true,
      hourlyRate: 85,
      status: "active",
      createdAt: new Date().toISOString()
    });
    
    toast({
      title: "Timer iniciado",
      description: `Cronômetro iniciado para ticket ${ticketId}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Clock className="h-6 w-6 mr-2 text-primary" />
            Rastreamento de Tempo e Custos
          </h2>
          <p className="text-gray-600">Monitore produtividade, custos e lucratividade da equipe</p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsTimerDialogOpen(true)} data-testid="button-start-timer">
            <Play className="w-4 h-4 mr-2" />
            Iniciar Timer
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Tempo Total</p>
                <p className="text-2xl font-bold">{formatTime(costAnalysis.totalTime)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(costAnalysis.billableTime)} faturável
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Receita</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(costAnalysis.revenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Custo: {formatCurrency(costAnalysis.totalCost)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Lucro</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(costAnalysis.profit)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Margem: {costAnalysis.profitMargin}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Produtividade</p>
                <p className="text-2xl font-bold">
                  {Math.round(costAnalysis.billableTime / costAnalysis.totalTime * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Tempo faturável</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entries" data-testid="tab-time-entries">
            Registros de Tempo
          </TabsTrigger>
          <TabsTrigger value="productivity" data-testid="tab-productivity">
            Produtividade
          </TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-cost-analysis">
            Análise de Custos
          </TabsTrigger>
        </TabsList>

        {/* Time Entries */}
        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Tempo Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum registro de tempo
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Inicie um timer para começar a rastrear tempo gasto em tickets.
                    </p>
                    <Button onClick={() => setIsTimerDialogOpen(true)}>
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar Primeiro Timer
                    </Button>
                  </div>
                ) : (
                  timeEntries.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{entry.ticketSubject}</h4>
                            {getStatusBadge(entry.status)}
                            {entry.billable && (
                              <Badge variant="outline" className="text-green-600">
                                <DollarSign className="w-3 h-3 mr-1" />
                                Faturável
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {entry.agentName}
                            </span>
                            <span>{entry.departmentName}</span>
                            <span>
                              {new Date(entry.startTime).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold">
                            {formatTime(entry.duration)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(entry.hourlyRate)} /h
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency((entry.duration / 60) * entry.hourlyRate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Productivity */}
        <TabsContent value="productivity" className="space-y-4">
          <div className="grid gap-6">
            {agentProductivity.map((agent) => (
              <Card key={agent.agentId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle data-testid={`agent-productivity-${agent.agentId}`}>
                          {agent.agentName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {agent.ticketsCompleted} tickets finalizados
                        </p>
                      </div>
                    </div>
                    <Badge variant={agent.productivity >= 85 ? 'default' : 'secondary'}>
                      {agent.productivity.toFixed(1)}% produtividade
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {agent.totalHours}h
                      </p>
                      <p className="text-sm text-muted-foreground">Tempo Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {agent.billableHours}h
                      </p>
                      <p className="text-sm text-muted-foreground">Horas Faturáveis</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(agent.avgHourlyRate)}
                      </p>
                      <p className="text-sm text-muted-foreground">Taxa Média</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(agent.totalRevenue)}
                      </p>
                      <p className="text-sm text-muted-foreground">Receita Gerada</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Produtividade</span>
                      <span>{agent.productivity.toFixed(1)}%</span>
                    </div>
                    <Progress value={agent.productivity} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cost Analysis */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Custos por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tempo Total Trabalhado</span>
                    <span className="font-bold">{formatTime(costAnalysis.totalTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tempo Faturável</span>
                    <span className="font-bold text-green-600">
                      {formatTime(costAnalysis.billableTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tempo Não Faturável</span>
                    <span className="font-bold text-orange-600">
                      {formatTime(costAnalysis.nonBillableTime)}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Custo Total</span>
                      <span className="font-bold">{formatCurrency(costAnalysis.totalCost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Receita Gerada</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(costAnalysis.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Lucro Líquido</span>
                      <span className={`font-bold ${costAnalysis.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(costAnalysis.profit)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Taxa de Utilização</span>
                      <span>{Math.round(costAnalysis.billableTime / costAnalysis.totalTime * 100)}%</span>
                    </div>
                    <Progress 
                      value={costAnalysis.billableTime / costAnalysis.totalTime * 100} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Margem de Lucro</span>
                      <span className={costAnalysis.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {costAnalysis.profitMargin}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.max(0, costAnalysis.profitMargin)} 
                      className="h-2" 
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Recomendações:</h4>
                    <div className="space-y-2">
                      {costAnalysis.profitMargin < 10 && (
                        <div className="flex items-center text-sm text-orange-600">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Margem de lucro baixa - considere otimizar processos
                        </div>
                      )}
                      {costAnalysis.billableTime / costAnalysis.totalTime < 0.8 && (
                        <div className="flex items-center text-sm text-blue-600">
                          <Target className="w-4 h-4 mr-2" />
                          Melhorar taxa de utilização com automações
                        </div>
                      )}
                      {costAnalysis.profitMargin >= 15 && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Excelente performance financeira!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Start Timer Dialog */}
      <Dialog open={isTimerDialogOpen} onOpenChange={setIsTimerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Timer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ticket-id">ID do Ticket</Label>
              <Input
                id="ticket-id"
                placeholder="Ex: TK-001"
                data-testid="input-ticket-id"
              />
            </div>
            <div>
              <Label htmlFor="ticket-subject">Assunto do Ticket</Label>
              <Input
                id="ticket-subject"
                placeholder="Descreva brevemente o ticket"
                data-testid="input-ticket-subject"
              />
            </div>
            <div>
              <Label htmlFor="hourly-rate">Taxa Horária (R$)</Label>
              <Input
                id="hourly-rate"
                type="number"
                defaultValue="85"
                data-testid="input-hourly-rate"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsTimerDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  startTimer("TK-NEW", "Novo Ticket");
                  setIsTimerDialogOpen(false);
                }}
                data-testid="button-confirm-start-timer"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Timer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}