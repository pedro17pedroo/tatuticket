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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { 
  Coins, 
  Plus, 
  Edit, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  RefreshCw,
  Target,
  BarChart3
} from "lucide-react";

interface HourBank {
  id: string;
  customerId: string;
  customerName: string;
  totalHours: number;
  consumedHours: number;
  remainingHours: number;
  hourlyRate: number;
  totalValue: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "exhausted" | "suspended";
  alertThreshold: number; // percentage
  autoRenewal: boolean;
  description?: string;
  createdAt: string;
}

interface HourBankUsage {
  id: string;
  hourBankId: string;
  ticketId: string;
  ticketSubject: string;
  agentName: string;
  hoursUsed: number;
  description: string;
  usedAt: string;
}

interface HourBankStats {
  totalBanks: number;
  activeBanks: number;
  totalHours: number;
  consumedHours: number;
  totalValue: number;
  consumedValue: number;
  averageUtilization: number;
}

export function HourBankManagement() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<HourBank | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const { toast } = useToast();
  const tenantId = authService.getTenantId();

  const [formData, setFormData] = useState({
    customerId: "",
    totalHours: 20,
    hourlyRate: 85,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    alertThreshold: 80,
    autoRenewal: false,
    description: ""
  });

  // Mock data for demonstration
  const mockHourBanks: HourBank[] = [
    {
      id: "bank-1",
      customerId: "customer-1",
      customerName: "TechCorp Soluções",
      totalHours: 40,
      consumedHours: 32,
      remainingHours: 8,
      hourlyRate: 95,
      totalValue: 3800,
      startDate: "2024-01-01",
      endDate: "2024-03-31",
      status: "active",
      alertThreshold: 80,
      autoRenewal: true,
      description: "Suporte técnico mensal",
      createdAt: "2024-01-01T00:00:00"
    },
    {
      id: "bank-2", 
      customerId: "customer-2",
      customerName: "Inovação Digital Ltda",
      totalHours: 60,
      consumedHours: 15,
      remainingHours: 45,
      hourlyRate: 85,
      totalValue: 5100,
      startDate: "2024-01-15",
      endDate: "2024-04-15",
      status: "active",
      alertThreshold: 75,
      autoRenewal: false,
      description: "Desenvolvimento e suporte",
      createdAt: "2024-01-15T00:00:00"
    },
    {
      id: "bank-3",
      customerId: "customer-3", 
      customerName: "StartUp Acelera",
      totalHours: 25,
      consumedHours: 25,
      remainingHours: 0,
      hourlyRate: 75,
      totalValue: 1875,
      startDate: "2023-12-01",
      endDate: "2024-02-29",
      status: "exhausted",
      alertThreshold: 85,
      autoRenewal: false,
      description: "Consultoria estratégica",
      createdAt: "2023-12-01T00:00:00"
    }
  ];

  const mockUsages: HourBankUsage[] = [
    {
      id: "usage-1",
      hourBankId: "bank-1",
      ticketId: "TK-001",
      ticketSubject: "Configuração de API",
      agentName: "Maria Santos",
      hoursUsed: 2.5,
      description: "Integração com sistema terceiro",
      usedAt: "2024-01-16T14:30:00"
    },
    {
      id: "usage-2",
      hourBankId: "bank-1",
      ticketId: "TK-002", 
      ticketSubject: "Correção de Bug",
      agentName: "João Silva",
      hoursUsed: 1.5,
      description: "Fix no módulo de pagamentos",
      usedAt: "2024-01-16T16:15:00"
    }
  ];

  const mockStats: HourBankStats = {
    totalBanks: 3,
    activeBanks: 2,
    totalHours: 125,
    consumedHours: 72,
    totalValue: 10775,
    consumedValue: 6480,
    averageUtilization: 57.6
  };

  // Fetch hour banks
  const { data: hourBanks = mockHourBanks, isLoading: loadingBanks } = useQuery({
    queryKey: ['/api/hour-banks', tenantId],
    enabled: !!tenantId,
  });

  // Fetch hour bank usage
  const { data: usages = mockUsages, isLoading: loadingUsages } = useQuery({
    queryKey: ['/api/hour-bank-usage', tenantId, selectedBankId],
    enabled: !!tenantId && !!selectedBankId,
  });

  // Fetch stats
  const { data: stats = mockStats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/hour-bank-stats', tenantId],
    enabled: !!tenantId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getStatusBadge = (status: string, remainingHours: number, alertThreshold: number, totalHours: number) => {
    const utilization = ((totalHours - remainingHours) / totalHours) * 100;
    
    if (status === 'exhausted') {
      return <Badge variant="destructive">Esgotada</Badge>;
    }
    if (status === 'expired') {
      return <Badge variant="secondary">Expirada</Badge>;
    }
    if (status === 'suspended') {
      return <Badge variant="outline">Suspensa</Badge>;
    }
    if (utilization >= alertThreshold) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Alerta</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Ativa</Badge>;
  };

  const getUtilizationColor = (percentage: number, alertThreshold: number) => {
    if (percentage >= 100) return "text-red-600";
    if (percentage >= alertThreshold) return "text-orange-600";
    return "text-green-600";
  };

  const handleCreateBank = () => {
    setEditingBank(null);
    setFormData({
      customerId: "",
      totalHours: 20,
      hourlyRate: 85,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      alertThreshold: 80,
      autoRenewal: false,
      description: ""
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditBank = (bank: HourBank) => {
    setEditingBank(bank);
    setFormData({
      customerId: bank.customerId,
      totalHours: bank.totalHours,
      hourlyRate: bank.hourlyRate,
      startDate: bank.startDate,
      endDate: bank.endDate,
      alertThreshold: bank.alertThreshold,
      autoRenewal: bank.autoRenewal,
      description: bank.description || ""
    });
    setIsCreateDialogOpen(true);
  };

  const handleTopUp = (bankId: string) => {
    setSelectedBankId(bankId);
    setIsTopUpDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Coins className="h-6 w-6 mr-2 text-primary" />
            Gestão de Bolsa de Horas
          </h2>
          <p className="text-gray-600">Configure e monitore bolsas de horas por cliente</p>
        </div>
        <Button onClick={handleCreateBank} data-testid="button-create-hour-bank">
          <Plus className="w-4 h-4 mr-2" />
          Nova Bolsa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Bolsas Ativas</p>
                <p className="text-2xl font-bold">{stats.activeBanks}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalBanks} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Horas Disponíveis</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalHours - stats.consumedHours}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalHours} total
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
                <p className="text-sm font-medium">Valor Consumido</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(stats.consumedValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.totalValue)} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Utilização Média</p>
                <p className="text-2xl font-bold">
                  {stats.averageUtilization.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Todas as bolsas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-hour-banks-overview">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="usage" data-testid="tab-hour-banks-usage">
            Consumo
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-hour-banks-alerts">
            Alertas
          </TabsTrigger>
        </TabsList>

        {/* Hour Banks Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6">
            {hourBanks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Coins className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma bolsa de horas encontrada
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Crie bolsas de horas para oferecer modelos flexíveis aos seus clientes.
                  </p>
                  <Button onClick={handleCreateBank} data-testid="button-create-first-hour-bank">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Bolsa
                  </Button>
                </CardContent>
              </Card>
            ) : (
              hourBanks.map((bank) => {
                const utilization = ((bank.totalHours - bank.remainingHours) / bank.totalHours) * 100;
                const valueConsumed = (bank.totalHours - bank.remainingHours) * bank.hourlyRate;
                
                return (
                  <Card key={bank.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Coins className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle data-testid={`hour-bank-${bank.id}`}>
                              {bank.customerName}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {bank.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(bank.status, bank.remainingHours, bank.alertThreshold, bank.totalHours)}
                          {bank.autoRenewal && (
                            <Badge variant="outline" className="text-blue-600">
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Auto Renovação
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {bank.totalHours}h
                          </p>
                          <p className="text-sm text-muted-foreground">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">
                            {bank.consumedHours}h
                          </p>
                          <p className="text-sm text-muted-foreground">Consumidas</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${getUtilizationColor(utilization, bank.alertThreshold)}`}>
                            {bank.remainingHours}h
                          </p>
                          <p className="text-sm text-muted-foreground">Restantes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(bank.hourlyRate)}
                          </p>
                          <p className="text-sm text-muted-foreground">Taxa/Hora</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Utilização: {utilization.toFixed(1)}%</span>
                          <span className={getUtilizationColor(utilization, bank.alertThreshold)}>
                            {utilization >= bank.alertThreshold ? "⚠️ Limite de alerta atingido" : "✅ Dentro do limite"}
                          </span>
                        </div>
                        <Progress value={utilization} className="h-2" />
                        
                        <div className="flex justify-between text-sm">
                          <span>Valor: {formatCurrency(valueConsumed)} / {formatCurrency(bank.totalValue)}</span>
                          <span className="text-gray-500">
                            Válido até {new Date(bank.endDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex space-x-2 pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditBank(bank)}
                            data-testid={`button-edit-bank-${bank.id}`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleTopUp(bank.id)}
                            data-testid={`button-topup-bank-${bank.id}`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Recarregar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBankId(bank.id);
                              setSelectedTab("usage");
                            }}
                            data-testid={`button-view-usage-${bank.id}`}
                          >
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Ver Consumo
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Hour Bank Usage */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Consumo</CardTitle>
              {selectedBankId && (
                <p className="text-sm text-muted-foreground">
                  Bolsa: {hourBanks.find(b => b.id === selectedBankId)?.customerName}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {!selectedBankId ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Selecione uma bolsa de horas para ver o histórico de consumo.
                  </p>
                </div>
              ) : usages.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Nenhum registro de consumo para esta bolsa.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {usages.map((usage) => (
                    <div key={usage.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{usage.ticketSubject}</h4>
                            <Badge variant="outline">{usage.ticketId}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{usage.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {usage.agentName}
                            </span>
                            <span>
                              {new Date(usage.usedAt).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(usage.usedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-orange-600">
                            {usage.hoursUsed}h
                          </div>
                          <div className="text-sm text-gray-500">consumidas</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Bolsa de Horas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hourBanks
                  .filter((bank) => {
                    const utilization = ((bank.totalHours - bank.remainingHours) / bank.totalHours) * 100;
                    return utilization >= bank.alertThreshold || bank.status === 'exhausted' || bank.status === 'expired';
                  })
                  .map((bank) => {
                    const utilization = ((bank.totalHours - bank.remainingHours) / bank.totalHours) * 100;
                    
                    return (
                      <div key={bank.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {bank.status === 'exhausted' ? (
                              <AlertTriangle className="w-6 h-6 text-red-500" />
                            ) : bank.status === 'expired' ? (
                              <AlertTriangle className="w-6 h-6 text-gray-500" />
                            ) : (
                              <AlertTriangle className="w-6 h-6 text-orange-500" />
                            )}
                            <div>
                              <h4 className="font-medium">{bank.customerName}</h4>
                              <p className="text-sm text-gray-600">
                                {bank.status === 'exhausted' && "Bolsa de horas esgotada"}
                                {bank.status === 'expired' && "Bolsa de horas expirada"}
                                {bank.status === 'active' && utilization >= bank.alertThreshold && 
                                  `Limite de alerta atingido (${utilization.toFixed(1)}%)`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {bank.remainingHours}h restantes
                            </div>
                            {bank.status === 'active' && (
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => handleTopUp(bank.id)}
                              >
                                Recarregar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                
                {hourBanks.filter((bank) => {
                  const utilization = ((bank.totalHours - bank.remainingHours) / bank.totalHours) * 100;
                  return utilization >= bank.alertThreshold || bank.status === 'exhausted' || bank.status === 'expired';
                }).length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Tudo em ordem! 
                    </h3>
                    <p className="text-gray-500">
                      Não há alertas pendentes para as bolsas de horas.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Hour Bank Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBank ? 'Editar Bolsa de Horas' : 'Nova Bolsa de Horas'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Cliente</Label>
                <Select 
                  value={formData.customerId} 
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger data-testid="select-customer">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer-1">TechCorp Soluções</SelectItem>
                    <SelectItem value="customer-2">Inovação Digital Ltda</SelectItem>
                    <SelectItem value="customer-3">StartUp Acelera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="totalHours">Total de Horas</Label>
                <Input
                  id="totalHours"
                  type="number"
                  min="1"
                  value={formData.totalHours}
                  onChange={(e) => setFormData({ ...formData, totalHours: Number(e.target.value) })}
                  data-testid="input-total-hours"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourlyRate">Taxa Horária (R$)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="1"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                  data-testid="input-hourly-rate"
                />
              </div>
              
              <div>
                <Label htmlFor="alertThreshold">Limite de Alerta (%)</Label>
                <Input
                  id="alertThreshold"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: Number(e.target.value) })}
                  data-testid="input-alert-threshold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">Data de Expiração</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o propósito desta bolsa de horas..."
                data-testid="textarea-description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRenewal"
                checked={formData.autoRenewal}
                onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
                className="rounded"
                data-testid="checkbox-auto-renewal"
              />
              <Label htmlFor="autoRenewal">Ativar renovação automática</Label>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo:</h4>
              <div className="text-sm space-y-1">
                <p>Total de Horas: <strong>{formData.totalHours}h</strong></p>
                <p>Taxa Horária: <strong>{formatCurrency(formData.hourlyRate)}</strong></p>
                <p>Valor Total: <strong>{formatCurrency(formData.totalHours * formData.hourlyRate)}</strong></p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button data-testid="button-save-hour-bank">
                {editingBank ? 'Atualizar' : 'Criar'} Bolsa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Top Up Dialog */}
      <Dialog open={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recarregar Bolsa de Horas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="additionalHours">Horas Adicionais</Label>
              <Input
                id="additionalHours"
                type="number"
                min="1"
                defaultValue="10"
                data-testid="input-additional-hours"
              />
            </div>
            <div>
              <Label htmlFor="topUpRate">Taxa Horária (R$)</Label>
              <Input
                id="topUpRate"
                type="number"
                min="1"
                defaultValue="85"
                data-testid="input-topup-rate"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsTopUpDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  toast({
                    title: "Bolsa recarregada!",
                    description: "As horas adicionais foram creditadas com sucesso.",
                  });
                  setIsTopUpDialogOpen(false);
                }}
                data-testid="button-confirm-topup"
              >
                Confirmar Recarga
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}