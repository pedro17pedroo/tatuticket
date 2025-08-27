import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, AlertTriangle, Shield, Clock, User, 
  Database, CheckCircle, XCircle, Eye, Edit, 
  Lock, Unlock, History, Search, Filter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Override {
  id: string;
  type: 'tenant_settings' | 'user_permissions' | 'system_config' | 'sla_rules' | 'billing_rules';
  tenantId?: string;
  tenantName?: string;
  userId?: string;
  userEmail?: string;
  configKey: string;
  originalValue: any;
  overrideValue: any;
  reason: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'revoked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

interface OverrideRequest {
  type: 'tenant_settings' | 'user_permissions' | 'system_config' | 'sla_rules' | 'billing_rules';
  tenantId?: string;
  userId?: string;
  configKey: string;
  newValue: any;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: Date;
}

interface SystemConfig {
  category: string;
  configs: Array<{
    key: string;
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    currentValue: any;
    defaultValue: any;
    overridable: boolean;
    requiresApproval: boolean;
  }>;
}

export function OverrideSystem() {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newOverride, setNewOverride] = useState<Partial<OverrideRequest>>({});
  const queryClient = useQueryClient();

  // Fetch current overrides
  const { data: overrides, isLoading: isLoadingOverrides } = useQuery<Override[]>({
    queryKey: ['/api/admin/overrides', selectedType, selectedStatus, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/admin/overrides?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar overrides');
      const result = await response.json();
      return result.data;
    }
  });

  // Fetch system configurations
  const { data: systemConfigs } = useQuery<SystemConfig[]>({
    queryKey: ['/api/admin/system-configs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system-configs');
      if (!response.ok) throw new Error('Falha ao carregar configurações do sistema');
      const result = await response.json();
      return result.data;
    }
  });

  // Create override mutation
  const createOverrideMutation = useMutation({
    mutationFn: async (overrideData: OverrideRequest) => {
      const response = await fetch('/api/admin/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideData)
      });
      if (!response.ok) throw new Error('Falha ao criar override');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/overrides'] });
      setShowCreateDialog(false);
      setNewOverride({});
    }
  });

  // Revoke override mutation
  const revokeOverrideMutation = useMutation({
    mutationFn: async (overrideId: string) => {
      const response = await fetch(`/api/admin/overrides/${overrideId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Falha ao revogar override');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/overrides'] });
    }
  });

  // Approve override mutation
  const approveOverrideMutation = useMutation({
    mutationFn: async (overrideId: string) => {
      const response = await fetch(`/api/admin/overrides/${overrideId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Falha ao aprovar override');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/overrides'] });
    }
  });

  // Mock data fallback
  const mockOverrides: Override[] = [
    {
      id: '1',
      type: 'tenant_settings',
      tenantId: 'tenant-1',
      tenantName: 'TechCorp Solutions',
      configKey: 'max_tickets_per_day',
      originalValue: 100,
      overrideValue: 500,
      reason: 'Temporary increase for peak season',
      createdBy: 'admin@tatuticket.com',
      createdAt: new Date('2025-01-27T10:00:00'),
      expiresAt: new Date('2025-02-28T23:59:59'),
      status: 'active',
      priority: 'high',
      requiresApproval: true,
      approvedBy: 'superadmin@tatuticket.com',
      approvedAt: new Date('2025-01-27T10:30:00')
    },
    {
      id: '2',
      type: 'user_permissions',
      tenantId: 'tenant-2',
      tenantName: 'StartupXYZ',
      userId: 'user-123',
      userEmail: 'manager@startup.com',
      configKey: 'can_delete_tickets',
      originalValue: false,
      overrideValue: true,
      reason: 'Emergency permission for data cleanup',
      createdBy: 'admin@tatuticket.com',
      createdAt: new Date('2025-01-26T15:30:00'),
      expiresAt: new Date('2025-01-28T15:30:00'),
      status: 'active',
      priority: 'critical',
      requiresApproval: true,
      approvedBy: 'superadmin@tatuticket.com',
      approvedAt: new Date('2025-01-26T16:00:00')
    },
    {
      id: '3',
      type: 'billing_rules',
      tenantId: 'tenant-1',
      tenantName: 'TechCorp Solutions',
      configKey: 'excess_ticket_charge',
      originalValue: 0.50,
      overrideValue: 0.25,
      reason: 'Promotional pricing for Q1',
      createdBy: 'admin@tatuticket.com',
      createdAt: new Date('2025-01-25T09:00:00'),
      expiresAt: new Date('2025-03-31T23:59:59'),
      status: 'active',
      priority: 'medium',
      requiresApproval: false
    }
  ];

  const mockSystemConfigs: SystemConfig[] = [
    {
      category: 'Tenant Limits',
      configs: [
        {
          key: 'max_tickets_per_day',
          name: 'Máximo de Tickets por Dia',
          description: 'Limite diário de criação de tickets por tenant',
          type: 'number',
          currentValue: 100,
          defaultValue: 100,
          overridable: true,
          requiresApproval: true
        },
        {
          key: 'max_agents',
          name: 'Máximo de Agentes',
          description: 'Limite de agentes por tenant',
          type: 'number',
          currentValue: 10,
          defaultValue: 10,
          overridable: true,
          requiresApproval: true
        }
      ]
    },
    {
      category: 'System Settings',
      configs: [
        {
          key: 'maintenance_mode',
          name: 'Modo de Manutenção',
          description: 'Ativa o modo de manutenção do sistema',
          type: 'boolean',
          currentValue: false,
          defaultValue: false,
          overridable: true,
          requiresApproval: true
        }
      ]
    }
  ];

  const overridesList = overrides || mockOverrides;
  const configsList = systemConfigs || mockSystemConfigs;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tenant_settings': return 'bg-blue-100 text-blue-800';
      case 'user_permissions': return 'bg-green-100 text-green-800';
      case 'system_config': return 'bg-purple-100 text-purple-800';
      case 'sla_rules': return 'bg-orange-100 text-orange-800';
      case 'billing_rules': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'revoked': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateOverride = () => {
    if (newOverride.type && newOverride.configKey && newOverride.reason) {
      createOverrideMutation.mutate(newOverride as OverrideRequest);
    }
  };

  const renderValue = (value: any, type: string) => {
    if (type === 'boolean') {
      return value ? 'Verdadeiro' : 'Falso';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="space-y-6" data-testid="override-system">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Override</h2>
          <p className="text-muted-foreground">Gerenciar sobrescritas de configurações do sistema</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-override">
              <Settings className="h-4 w-4 mr-2" />
              Novo Override
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Override</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={newOverride.type || ''} onValueChange={(value) => setNewOverride({...newOverride, type: value as any})}>
                    <SelectTrigger data-testid="select-override-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant_settings">Configurações de Tenant</SelectItem>
                      <SelectItem value="user_permissions">Permissões de Usuário</SelectItem>
                      <SelectItem value="system_config">Configuração do Sistema</SelectItem>
                      <SelectItem value="sla_rules">Regras de SLA</SelectItem>
                      <SelectItem value="billing_rules">Regras de Cobrança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={newOverride.priority || ''} onValueChange={(value) => setNewOverride({...newOverride, priority: value as any})}>
                    <SelectTrigger data-testid="select-override-priority">
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Chave de Configuração</Label>
                <Input
                  value={newOverride.configKey || ''}
                  onChange={(e) => setNewOverride({...newOverride, configKey: e.target.value})}
                  placeholder="Ex: max_tickets_per_day"
                  data-testid="input-config-key"
                />
              </div>

              <div>
                <Label>Novo Valor</Label>
                <Input
                  value={newOverride.newValue || ''}
                  onChange={(e) => setNewOverride({...newOverride, newValue: e.target.value})}
                  placeholder="Valor para override"
                  data-testid="input-new-value"
                />
              </div>

              <div>
                <Label>Justificativa</Label>
                <Textarea
                  value={newOverride.reason || ''}
                  onChange={(e) => setNewOverride({...newOverride, reason: e.target.value})}
                  placeholder="Explique o motivo do override..."
                  data-testid="textarea-reason"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateOverride}
                  disabled={createOverrideMutation.isPending}
                  data-testid="button-submit-override"
                >
                  {createOverrideMutation.isPending ? 'Criando...' : 'Criar Override'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar overrides..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-overrides"
                />
              </div>
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48" data-testid="select-filter-type">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="tenant_settings">Configurações de Tenant</SelectItem>
                <SelectItem value="user_permissions">Permissões de Usuário</SelectItem>
                <SelectItem value="system_config">Configuração do Sistema</SelectItem>
                <SelectItem value="sla_rules">Regras de SLA</SelectItem>
                <SelectItem value="billing_rules">Regras de Cobrança</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48" data-testid="select-filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="revoked">Revogado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overrides" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overrides" data-testid="tab-overrides">Overrides Ativos</TabsTrigger>
          <TabsTrigger value="configs" data-testid="tab-configs">Configurações do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="overrides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Overrides Configurados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOverrides ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Alvo</TableHead>
                      <TableHead>Configuração</TableHead>
                      <TableHead>Valor Original</TableHead>
                      <TableHead>Valor Override</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overridesList.map((override) => (
                      <TableRow key={override.id}>
                        <TableCell>
                          <Badge className={getTypeColor(override.type)}>
                            {override.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            {override.tenantName && (
                              <p className="font-medium">{override.tenantName}</p>
                            )}
                            {override.userEmail && (
                              <p className="text-sm text-muted-foreground">{override.userEmail}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {override.configKey}
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{renderValue(override.originalValue, 'string')}</code>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm font-bold">{renderValue(override.overrideValue, 'string')}</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(override.status)}
                            <span className="capitalize">{override.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(override.priority)}>
                            {override.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {override.expiresAt ? (
                            <span className="text-sm">
                              {new Date(override.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Permanente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" data-testid={`button-view-override-${override.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {override.status === 'active' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => revokeOverrideMutation.mutate(override.id)}
                                disabled={revokeOverrideMutation.isPending}
                                data-testid={`button-revoke-override-${override.id}`}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configs" className="space-y-4">
          {configsList.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle>{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.configs.map((config) => (
                    <div key={config.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{config.name}</h3>
                          {config.overridable ? (
                            <Unlock className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-red-500" />
                          )}
                          {config.requiresApproval && (
                            <Shield className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span>Valor atual: <code>{renderValue(config.currentValue, config.type)}</code></span>
                          <span>Padrão: <code>{renderValue(config.defaultValue, config.type)}</code></span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" data-testid={`button-history-${config.key}`}>
                          <History className="h-4 w-4" />
                        </Button>
                        {config.overridable && (
                          <Button size="sm" data-testid={`button-override-${config.key}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Override
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}