import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { StatsCard } from "@/components/ui/stats-card";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";

interface SLAConfig {
  id: string;
  name: string;
  description?: string;
  priority: "low" | "medium" | "high" | "critical";
  responseTime: number; // hours
  resolutionTime: number; // hours
  businessHoursOnly: boolean;
  escalationRules: {
    level: number;
    timeToEscalate: number; // hours
    assignToRole: string;
    notifyEmails?: string[];
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function SLAManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSLA, setSelectedSLA] = useState<SLAConfig | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "medium",
    responseTime: 4,
    resolutionTime: 24,
    businessHoursOnly: true,
    escalationRules: [
      { level: 1, timeToEscalate: 2, assignToRole: "manager", notifyEmails: [] }
    ],
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenantId = authService.getTenantId();

  // Fetch SLA configurations
  const { data: slaConfigs = [], isLoading } = useQuery({
    queryKey: ['/api/sla-configs', tenantId],
    enabled: !!tenantId,
  });

  // Fetch SLA performance stats
  const { data: slaStats } = useQuery({
    queryKey: ['/api/analytics/sla-stats', tenantId],
    enabled: !!tenantId,
  });

  // Create/Update SLA mutation
  const slaConfigMutation = useMutation({
    mutationFn: (data: any) => 
      fetch(selectedSLA ? `/api/sla-configs/${selectedSLA.id}` : '/api/sla-configs', {
        method: selectedSLA ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tenantId }),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: selectedSLA ? "SLA atualizado!" : "SLA criado!",
        description: "As configurações de SLA foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sla-configs'] });
      setShowCreateDialog(false);
      setSelectedSLA(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar SLA",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      priority: "medium",
      responseTime: 4,
      resolutionTime: 24,
      businessHoursOnly: true,
      escalationRules: [
        { level: 1, timeToEscalate: 2, assignToRole: "manager", notifyEmails: [] }
      ],
      isActive: true
    });
  };

  const handleCreateSLA = () => {
    setSelectedSLA(null);
    resetForm();
    setShowCreateDialog(true);
  };

  const handleEditSLA = (sla: SLAConfig) => {
    setSelectedSLA(sla);
    setFormData({
      name: sla.name,
      description: sla.description || "",
      priority: sla.priority,
      responseTime: sla.responseTime,
      resolutionTime: sla.resolutionTime,
      businessHoursOnly: sla.businessHoursOnly,
      escalationRules: sla.escalationRules,
      isActive: sla.isActive
    });
    setShowCreateDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome do SLA é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    slaConfigMutation.mutate(formData);
  };

  const addEscalationRule = () => {
    const newLevel = formData.escalationRules.length + 1;
    setFormData({
      ...formData,
      escalationRules: [...formData.escalationRules, {
        level: newLevel,
        timeToEscalate: 4,
        assignToRole: "manager",
        notifyEmails: []
      }]
    });
  };

  const removeEscalationRule = (index: number) => {
    setFormData({
      ...formData,
      escalationRules: formData.escalationRules.filter((_, i) => i !== index)
    });
  };

  const updateEscalationRule = (index: number, field: string, value: any) => {
    const updatedRules = [...formData.escalationRules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    setFormData({ ...formData, escalationRules: updatedRules });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Crítica';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return `${hours * 60}min`;
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
          <span className="ml-3 text-gray-600">Carregando configurações de SLA...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de SLAs</h1>
          <p className="text-gray-600">Configure acordos de nível de serviço e tempos de resposta</p>
        </div>
        <Button onClick={handleCreateSLA} data-testid="button-create-sla">
          <i className="fas fa-plus mr-2"></i>
          Novo SLA
        </Button>
      </div>

      {/* Stats Cards */}
      {slaStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="SLAs Ativos"
            value={slaStats.activeSLAs || 0}
            icon="fa-clock"
            iconColor="bg-blue-100 text-blue-600"
          />
          <StatsCard
            title="Compliance Médio"
            value={`${slaStats.averageCompliance || 0}%`}
            icon="fa-check-circle"
            iconColor="bg-green-100 text-green-600"
            change={{
              value: "+5%",
              type: "increase",
              label: "vs mês anterior"
            }}
          />
          <StatsCard
            title="Tickets em Risco"
            value={slaStats.ticketsAtRisk || 0}
            icon="fa-exclamation-triangle"
            iconColor="bg-orange-100 text-orange-600"
          />
          <StatsCard
            title="Violações SLA"
            value={slaStats.slaViolations || 0}
            icon="fa-times-circle"
            iconColor="bg-red-100 text-red-600"
            change={{
              value: "-12%",
              type: "decrease",
              label: "vs semana anterior"
            }}
          />
        </div>
      )}

      {/* SLA Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            Sobre SLAs e Modelos de Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">SLA-Based</h4>
              <p className="text-sm text-blue-700">
                Custos fixos baseados em performance e tempo de resposta. 
                Ideal para serviços com demanda previsível.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Bolsa de Horas</h4>
              <p className="text-sm text-green-700">
                Pagamento por uso real de tempo. 
                Flexível para projetos pontuais e demanda variável.
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Modelo Híbrido</h4>
              <p className="text-sm text-purple-700">
                Combinação dos dois modelos. 
                Base fixa + consumo adicional para maior flexibilidade.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SLA Configurations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-list mr-2"></i>
            Configurações de SLA ({slaConfigs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slaConfigs.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-clock text-4xl text-gray-300 mb-4"></i>
              <p className="text-lg font-medium text-gray-600 mb-2">
                Nenhum SLA configurado
              </p>
              <p className="text-gray-500 mb-6">
                Crie sua primeira configuração de SLA para começar a monitorar tempos de resposta.
              </p>
              <Button onClick={handleCreateSLA} data-testid="button-create-first-sla">
                <i className="fas fa-plus mr-2"></i>
                Criar Primeiro SLA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {slaConfigs.map((sla: SLAConfig) => (
                <Card key={sla.id} className="hover:shadow-md transition-shadow" data-testid={`sla-${sla.name}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {sla.name}
                          </h3>
                          <Badge className={getPriorityColor(sla.priority)}>
                            {getPriorityLabel(sla.priority)}
                          </Badge>
                          <Badge className={sla.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {sla.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        
                        {sla.description && (
                          <p className="text-gray-600 mb-3">
                            {sla.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Tempo de Resposta:</span>
                            <div className="font-medium text-gray-900">
                              {formatTime(sla.responseTime)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Tempo de Resolução:</span>
                            <div className="font-medium text-gray-900">
                              {formatTime(sla.resolutionTime)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Horário Comercial:</span>
                            <div className="font-medium text-gray-900">
                              {sla.businessHoursOnly ? 'Sim' : 'Não'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Escalações:</span>
                            <div className="font-medium text-gray-900">
                              {sla.escalationRules.length} níveis
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditSLA(sla)}
                          data-testid={`button-edit-sla-${sla.name}`}
                        >
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

      {/* Create/Edit SLA Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSLA ? 'Editar SLA' : 'Criar Nova Configuração de SLA'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do SLA *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: SLA Crítico - Suporte Técnico"
                  required
                  data-testid="input-sla-name"
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger data-testid="select-sla-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Crítica</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva quando este SLA deve ser aplicado"
                rows={3}
                data-testid="textarea-sla-description"
              />
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="responseTime">Tempo de Resposta (horas)</Label>
                <Input
                  id="responseTime"
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={formData.responseTime}
                  onChange={(e) => setFormData({ ...formData, responseTime: parseFloat(e.target.value) })}
                  data-testid="input-response-time"
                />
              </div>
              
              <div>
                <Label htmlFor="resolutionTime">Tempo de Resolução (horas)</Label>
                <Input
                  id="resolutionTime"
                  type="number"
                  min="1"
                  step="0.5"
                  value={formData.resolutionTime}
                  onChange={(e) => setFormData({ ...formData, resolutionTime: parseFloat(e.target.value) })}
                  data-testid="input-resolution-time"
                />
              </div>
            </div>

            {/* Business Hours Toggle */}
            <div className="flex items-center space-x-3">
              <Switch
                checked={formData.businessHoursOnly}
                onCheckedChange={(checked) => setFormData({ ...formData, businessHoursOnly: checked })}
                data-testid="switch-business-hours"
              />
              <Label>Aplicar apenas em horário comercial</Label>
            </div>

            {/* Escalation Rules */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Regras de Escalação</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEscalationRule}
                  data-testid="button-add-escalation-rule"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Adicionar Nível
                </Button>
              </div>

              <div className="space-y-4">
                {formData.escalationRules.map((rule, index) => (
                  <Card key={index} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Nível {rule.level}</h4>
                        {formData.escalationRules.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeEscalationRule(index)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-remove-escalation-${index}`}
                          >
                            <i className="fas fa-trash mr-1"></i>
                            Remover
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Tempo para Escalação (horas)</Label>
                          <Input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={rule.timeToEscalate}
                            onChange={(e) => updateEscalationRule(index, 'timeToEscalate', parseFloat(e.target.value))}
                            data-testid={`input-escalation-time-${index}`}
                          />
                        </div>
                        
                        <div>
                          <Label>Atribuir para</Label>
                          <Select 
                            value={rule.assignToRole} 
                            onValueChange={(value) => updateEscalationRule(index, 'assignToRole', value)}
                          >
                            <SelectTrigger data-testid={`select-escalation-role-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="agent">Agente</SelectItem>
                              <SelectItem value="manager">Gerente</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center space-x-3">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-sla-active"
              />
              <Label>SLA ativo</Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                disabled={slaConfigMutation.isPending}
                data-testid="button-cancel-sla"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={slaConfigMutation.isPending || !formData.name.trim()}
                data-testid="button-save-sla"
              >
                {slaConfigMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Salvando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    {selectedSLA ? 'Atualizar SLA' : 'Criar SLA'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}