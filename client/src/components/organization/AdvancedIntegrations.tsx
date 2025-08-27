import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Slack,
  MessageSquare,
  Webhook,
  Settings,
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  TestTube,
  Activity
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Mock data for integrations
const MOCK_INTEGRATIONS = [
  {
    id: '1',
    name: 'Slack - Equipe de Suporte',
    type: 'slack',
    isActive: true,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 30),
    config: {
      webhook_url: 'https://hooks.slack.com/services/xxx',
      channel: '#suporte',
      notifications: ['ticket_created', 'sla_breach']
    },
    status: 'connected'
  },
  {
    id: '2',
    name: 'Microsoft Teams',
    type: 'teams',
    isActive: true,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 60),
    config: {
      webhook_url: 'https://outlook.office.com/webhook/xxx',
      channel: 'Suporte TI',
      notifications: ['ticket_assigned', 'escalation']
    },
    status: 'connected'
  },
  {
    id: '3',
    name: 'Jira - Gestão de Projetos',
    type: 'jira',
    isActive: false,
    lastSyncAt: null,
    config: {
      base_url: 'https://company.atlassian.net',
      username: 'admin@company.com',
      project_key: 'SUP'
    },
    status: 'disconnected'
  },
  {
    id: '4',
    name: 'Webhook Personalizado',
    type: 'webhook',
    isActive: true,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 10),
    config: {
      url: 'https://api.company.com/tickets/webhook',
      method: 'POST',
      headers: { 'Authorization': 'Bearer xxx' },
      events: ['ticket_created', 'ticket_resolved']
    },
    status: 'connected'
  }
];

const INTEGRATION_TYPES = [
  {
    type: 'slack',
    name: 'Slack',
    icon: Slack,
    description: 'Envie notificações para canais do Slack',
    color: 'bg-purple-500'
  },
  {
    type: 'teams',
    name: 'Microsoft Teams',
    icon: MessageSquare,
    description: 'Integre com Microsoft Teams',
    color: 'bg-blue-500'
  },
  {
    type: 'jira',
    name: 'Jira',
    icon: ExternalLink,
    description: 'Sincronize tickets com Jira',
    color: 'bg-blue-600'
  },
  {
    type: 'webhook',
    name: 'Webhook',
    icon: Webhook,
    description: 'Webhook personalizado para integração',
    color: 'bg-gray-500'
  }
];

const EVENT_TYPES = [
  { value: 'ticket_created', label: 'Ticket Criado' },
  { value: 'ticket_updated', label: 'Ticket Atualizado' },
  { value: 'ticket_assigned', label: 'Ticket Atribuído' },
  { value: 'ticket_resolved', label: 'Ticket Resolvido' },
  { value: 'sla_breach', label: 'Violação de SLA' },
  { value: 'escalation', label: 'Escalação' },
];

export function AdvancedIntegrations() {
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integrations = MOCK_INTEGRATIONS, isLoading } = useQuery({
    queryKey: ['/api/integrations', 'tenant-1'], // Replace with actual tenant ID
    enabled: true,
  });

  const createIntegrationMutation = useMutation({
    mutationFn: async (integration: any) => {
      // Mock API call
      return Promise.resolve({ id: Date.now().toString(), ...integration });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({ title: 'Integração criada com sucesso!' });
      setIsCreateDialogOpen(false);
    },
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // Mock API call
      return Promise.resolve({ id, isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({ title: 'Integração atualizada!' });
    },
  });

  const testIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      // Mock test
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, message: 'Teste realizado com sucesso!' };
    },
    onSuccess: (result, integrationId) => {
      setTestResults(prev => ({ ...prev, [integrationId]: result }));
      toast({ title: 'Teste concluído!', description: result.message });
    },
    onError: (error, integrationId) => {
      setTestResults(prev => ({ 
        ...prev, 
        [integrationId]: { success: false, message: 'Falha no teste' } 
      }));
      toast({ 
        title: 'Erro no teste', 
        description: 'Verifique a configuração', 
        variant: 'destructive' 
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getIntegrationType = (type: string) => {
    return INTEGRATION_TYPES.find(t => t.type === type);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="advanced-integrations">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <Webhook className="w-8 h-8 mr-3 text-primary" />
            Integrações Avançadas
          </h2>
          <p className="text-muted-foreground">
            Conecte o TatuTicket com suas ferramentas favoritas
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-integration">
              <PlusCircle className="w-4 h-4 mr-2" />
              Nova Integração
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Integração</DialogTitle>
              <DialogDescription>
                Configure uma nova integração com serviços externos
              </DialogDescription>
            </DialogHeader>
            <IntegrationCreateForm 
              onSubmit={(data) => createIntegrationMutation.mutate(data)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active-integrations">
            Integrações Ativas
          </TabsTrigger>
          <TabsTrigger value="available" data-testid="tab-available-integrations">
            Disponíveis
          </TabsTrigger>
          <TabsTrigger value="webhooks" data-testid="tab-webhook-logs">
            Logs de Webhook
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {integrations.map((integration: any) => {
              const integrationType = getIntegrationType(integration.type);
              const testResult = testResults[integration.id];
              
              return (
                <Card key={integration.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg ${integrationType?.color} flex items-center justify-center text-white`}>
                          {integrationType?.icon && <integrationType.icon className="w-5 h-5" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg" data-testid={`integration-name-${integration.id}`}>
                            {integration.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center">
                            {getStatusIcon(integration.status)}
                            <span className="ml-1">
                              {integration.status === 'connected' ? 'Conectado' : 'Desconectado'}
                            </span>
                            {integration.lastSyncAt && (
                              <span className="ml-2">
                                • Último sync: {integration.lastSyncAt.toLocaleString('pt-BR')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {testResult && (
                          <Badge variant={testResult.success ? 'default' : 'destructive'}>
                            {testResult.success ? 'Teste OK' : 'Teste Falhou'}
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testIntegrationMutation.mutate(integration.id)}
                          disabled={testIntegrationMutation.isPending}
                          data-testid={`button-test-${integration.id}`}
                        >
                          <TestTube className="w-4 h-4 mr-1" />
                          {testIntegrationMutation.isPending ? 'Testando...' : 'Testar'}
                        </Button>
                        <Switch
                          checked={integration.isActive}
                          onCheckedChange={(checked) => 
                            toggleIntegrationMutation.mutate({ 
                              id: integration.id, 
                              isActive: checked 
                            })
                          }
                          data-testid={`switch-integration-${integration.id}`}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedIntegration(integration)}
                          data-testid={`button-config-${integration.id}`}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {integration.type === 'slack' && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Canal:</span>
                          <Badge variant="outline">{integration.config.channel}</Badge>
                        </div>
                      )}
                      {integration.type === 'webhook' && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">URL:</span>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {integration.config.url}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(integration.config.url)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Eventos:</span>
                        <div className="flex flex-wrap gap-1">
                          {(integration.config.notifications || integration.config.events || []).map((event: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {EVENT_TYPES.find(e => e.value === event)?.label || event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTEGRATION_TYPES.map((type) => (
              <Card key={type.type} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center text-white`}>
                      <type.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{type.name}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedIntegration({ type: type.type });
                        setIsCreateDialogOpen(true);
                      }}
                      data-testid={`button-add-${type.type}`}
                    >
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <WebhookLogs />
        </TabsContent>
      </Tabs>

      {/* Integration Detail Dialog */}
      {selectedIntegration && !isCreateDialogOpen && (
        <IntegrationDetailDialog 
          integration={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
        />
      )}
    </div>
  );
}

// Integration Create Form Component
function IntegrationCreateForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    config: {},
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="integration-type">Tipo de Integração</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger data-testid="select-integration-type">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {INTEGRATION_TYPES.map((type) => (
              <SelectItem key={type.type} value={type.type}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome da Integração</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Slack - Equipe Suporte"
          required
          data-testid="input-integration-name"
        />
      </div>

      {formData.type === 'slack' && (
        <SlackConfigForm 
          config={formData.config}
          onChange={(config) => setFormData({ ...formData, config })}
        />
      )}

      {formData.type === 'webhook' && (
        <WebhookConfigForm 
          config={formData.config}
          onChange={(config) => setFormData({ ...formData, config })}
        />
      )}

      <DialogFooter>
        <Button type="submit" data-testid="button-save-integration">
          Criar Integração
        </Button>
      </DialogFooter>
    </form>
  );
}

// Slack Config Form
function SlackConfigForm({ config, onChange }: { 
  config: any; 
  onChange: (config: any) => void; 
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webhook-url">Webhook URL</Label>
        <Input
          id="webhook-url"
          value={config.webhook_url || ''}
          onChange={(e) => onChange({ ...config, webhook_url: e.target.value })}
          placeholder="https://hooks.slack.com/services/..."
          data-testid="input-slack-webhook"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="channel">Canal</Label>
        <Input
          id="channel"
          value={config.channel || ''}
          onChange={(e) => onChange({ ...config, channel: e.target.value })}
          placeholder="#suporte"
          data-testid="input-slack-channel"
        />
      </div>
    </div>
  );
}

// Webhook Config Form
function WebhookConfigForm({ config, onChange }: { 
  config: any; 
  onChange: (config: any) => void; 
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webhook-url">URL do Webhook</Label>
        <Input
          id="webhook-url"
          value={config.url || ''}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://api.exemplo.com/webhook"
          data-testid="input-webhook-url"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="method">Método HTTP</Label>
        <Select
          value={config.method || 'POST'}
          onValueChange={(value) => onChange({ ...config, method: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Webhook Logs Component
function WebhookLogs() {
  const mockLogs = [
    {
      id: '1',
      integrationName: 'Slack - Suporte',
      event: 'ticket_created',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      responseTime: 150
    },
    {
      id: '2',
      integrationName: 'Webhook Personalizado',
      event: 'ticket_resolved',
      status: 'failed',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      error: '404 Not Found',
      responseTime: 5000
    },
    {
      id: '3',
      integrationName: 'Microsoft Teams',
      event: 'sla_breach',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      responseTime: 320
    }
  ];

  return (
    <div className="space-y-4">
      {mockLogs.map((log) => (
        <Card key={log.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {log.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <h4 className="font-medium" data-testid={`log-integration-${log.id}`}>
                    {log.integrationName}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {EVENT_TYPES.find(e => e.value === log.event)?.label}
                  </p>
                  {log.error && (
                    <p className="text-sm text-red-600">{log.error}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {log.timestamp.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {log.responseTime}ms
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Integration Detail Dialog Component
function IntegrationDetailDialog({ integration, onClose }: {
  integration: any;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!integration} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{integration.name}</DialogTitle>
          <DialogDescription>Configurações da integração</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Configuração:</h4>
            <pre className="text-sm bg-muted p-3 rounded overflow-auto">
              {JSON.stringify(integration.config, null, 2)}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}