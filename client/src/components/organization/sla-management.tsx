import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { authService } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

interface SlaConfig {
  id: string;
  name: string;
  tenantId: string;
  priority: string;
  responseTime: number;
  resolutionTime: number;
  isActive: boolean;
  createdAt: string;
}

interface SlaFormData {
  name: string;
  priority: string;
  responseTime: number;
  resolutionTime: number;
}

interface HoursBankData {
  customerId: string;
  customerName: string;
  totalHours: number;
  usedHours: number;
  remainingHours: number;
  monthlyAllocation: number;
  lastUpdated: string;
}

export function SlaManagement() {
  const tenantId = authService.getTenantId();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSla, setEditingSla] = useState<SlaConfig | null>(null);
  const [activeTab, setActiveTab] = useState("configs");
  
  const [formData, setFormData] = useState<SlaFormData>({
    name: "",
    priority: "",
    responseTime: 0,
    resolutionTime: 0,
  });

  // Fetch SLA configs
  const { data: slaConfigs = [], isLoading: isLoadingConfigs } = useQuery<SlaConfig[]>({
    queryKey: ['/api/sla-configs', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/sla-configs?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch customers for hours bank
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/customers?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Create SLA config mutation
  const createSlaMutation = useMutation({
    mutationFn: async (data: SlaFormData & { tenantId: string }) => {
      return apiRequest('/api/sla-configs', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sla-configs', tenantId] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      priority: "",
      responseTime: 0,
      resolutionTime: 0,
    });
    setEditingSla(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    createSlaMutation.mutate({
      ...formData,
      tenantId,
    });
  };

  const handleEdit = (sla: SlaConfig) => {
    setFormData({
      name: sla.name,
      priority: sla.priority,
      responseTime: sla.responseTime,
      resolutionTime: sla.resolutionTime,
    });
    setEditingSla(sla);
    setIsCreateOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      critical: "Crítico",
      high: "Alto",
      medium: "Médio",
      low: "Baixo",
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  // Mock hours bank data - in real implementation, this would come from API
  const hoursBankData: HoursBankData[] = customers.map((customer: any) => ({
    customerId: customer.id,
    customerName: customer.name,
    totalHours: Math.floor(Math.random() * 100) + 50, // Mock data
    usedHours: Math.floor(Math.random() * 30) + 5,
    remainingHours: 0,
    monthlyAllocation: 40,
    lastUpdated: new Date().toISOString(),
  })).map((item: HoursBankData) => ({
    ...item,
    remainingHours: item.totalHours - item.usedHours,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de SLA</h2>
          <p className="text-gray-600">Configure SLAs e gerencie banco de horas dos clientes</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-sla">
              <i className="fas fa-plus mr-2"></i>Nova Configuração SLA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSla ? "Editar" : "Criar"} Configuração SLA
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Configuração</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: SLA Clientes Premium"
                  required
                  data-testid="input-sla-name"
                />
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger data-testid="select-sla-priority">
                    <SelectValue placeholder="Selecione a prioridade..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="low">Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responseTime">Tempo de Resposta (horas)</Label>
                  <Input
                    id="responseTime"
                    type="number"
                    min="1"
                    value={formData.responseTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, responseTime: Number(e.target.value) }))}
                    required
                    data-testid="input-response-time"
                  />
                </div>
                <div>
                  <Label htmlFor="resolutionTime">Tempo de Resolução (horas)</Label>
                  <Input
                    id="resolutionTime"
                    type="number"
                    min="1"
                    value={formData.resolutionTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, resolutionTime: Number(e.target.value) }))}
                    required
                    data-testid="input-resolution-time"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                  data-testid="button-cancel-sla"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createSlaMutation.isPending}
                  data-testid="button-save-sla"
                >
                  {createSlaMutation.isPending ? "Salvando..." : editingSla ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configs" data-testid="tab-sla-configs">
            <i className="fas fa-cog mr-2"></i>Configurações SLA
          </TabsTrigger>
          <TabsTrigger value="hours-bank" data-testid="tab-hours-bank">
            <i className="fas fa-clock mr-2"></i>Banco de Horas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          {isLoadingConfigs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : slaConfigs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slaConfigs.map((sla) => (
                <Card key={sla.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{sla.name}</CardTitle>
                        <Badge className={getPriorityColor(sla.priority)}>
                          {getPriorityLabel(sla.priority)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(sla)}
                        data-testid={`button-edit-sla-${sla.id}`}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Resposta:</span>
                          <p className="font-medium">{sla.responseTime}h</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Resolução:</span>
                          <p className="font-medium">{sla.resolutionTime}h</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant={sla.isActive ? "default" : "secondary"}>
                          {sla.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(sla.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <i className="fas fa-clock text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma configuração SLA</h3>
                <p className="text-gray-600 mb-4">Crie sua primeira configuração SLA para monitorar tempos de resposta.</p>
                <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-sla">
                  <i className="fas fa-plus mr-2"></i>Criar Primeira Configuração
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hours-bank" className="space-y-4">
          {isLoadingCustomers ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : hoursBankData.length > 0 ? (
            <div className="space-y-4">
              {hoursBankData.map((bank) => (
                <Card key={bank.customerId}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">{bank.customerName}</CardTitle>
                        <p className="text-sm text-gray-600">
                          Última atualização: {new Date(bank.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Alocação Mensal</p>
                        <p className="text-lg font-semibold">{bank.monthlyAllocation}h</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="text-xl font-bold text-blue-600">{bank.totalHours}h</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Usado</p>
                          <p className="text-xl font-bold text-orange-600">{bank.usedHours}h</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Restante</p>
                          <p className="text-xl font-bold text-green-600">{bank.remainingHours}h</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Utilização</span>
                          <span>{Math.round((bank.usedHours / bank.totalHours) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(bank.usedHours / bank.totalHours) * 100}
                          className="h-2"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" data-testid={`button-edit-hours-${bank.customerId}`}>
                          <i className="fas fa-edit mr-2"></i>Editar
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-add-hours-${bank.customerId}`}>
                          <i className="fas fa-plus mr-2"></i>Adicionar Horas
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente encontrado</h3>
                <p className="text-gray-600 mb-4">Cadastre clientes para gerenciar seus bancos de horas.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}