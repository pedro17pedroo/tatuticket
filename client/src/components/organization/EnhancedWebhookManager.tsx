import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Webhook, Plus, Settings, TestTube, AlertCircle, CheckCircle, 
  Globe, Zap, Activity, TrendingUp, Clock, RotateCcw 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  headers: Record<string, string>;
  secret: string;
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
  };
  createdAt: string;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
}

interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'success' | 'failed' | 'pending' | 'retrying';
  attempts: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  events: string[];
  headers: Record<string, string>;
  payloadTemplate: any;
}

const AVAILABLE_EVENTS = [
  'ticket.created',
  'ticket.updated', 
  'ticket.assigned',
  'ticket.resolved',
  'ticket.closed',
  'sla.breach',
  'sla.warning',
  'customer.created',
  'agent.assigned',
  'priority.changed'
];

const INTEGRATION_TEMPLATES: IntegrationTemplate[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Enviar notificações para canais do Slack',
    icon: Globe,
    events: ['ticket.created', 'sla.breach', 'ticket.resolved'],
    headers: { 'Content-Type': 'application/json' },
    payloadTemplate: {
      text: 'Novo ticket: {{ticket.title}}',
      channel: '#support',
      username: 'TatuTicket'
    }
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Notificações para Teams',
    icon: Zap,
    events: ['ticket.created', 'sla.breach'],
    headers: { 'Content-Type': 'application/json' },
    payloadTemplate: {
      '@type': 'MessageCard',
      summary: 'TatuTicket Notification',
      text: 'Ticket {{ticket.id}}: {{ticket.title}}'
    }
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Sincronização com Jira',
    icon: Activity,
    events: ['ticket.created', 'ticket.updated'],
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic {{auth}}' },
    payloadTemplate: {
      fields: {
        project: { key: 'SUPPORT' },
        summary: '{{ticket.title}}',
        description: '{{ticket.description}}',
        issuetype: { name: 'Task' }
      }
    }
  }
];

export function EnhancedWebhookManager() {
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IntegrationTemplate | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const queryClient = useQueryClient();

  // Mock data - In real app, this would come from API
  const webhooksData: WebhookConfig[] = [
    {
      id: '1',
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/...',
      events: ['ticket.created', 'sla.breach'],
      active: true,
      headers: { 'Content-Type': 'application/json' },
      secret: 'slack_secret_123',
      retryConfig: { maxRetries: 3, retryDelay: 5000 },
      createdAt: '2025-01-20T10:00:00Z',
      lastTriggered: '2025-01-27T14:30:00Z',
      successCount: 145,
      failureCount: 3
    },
    {
      id: '2',
      name: 'Jira Integration',
      url: 'https://company.atlassian.net/rest/api/2/issue',
      events: ['ticket.created'],
      active: false,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic abc123' },
      secret: 'jira_secret_456',
      retryConfig: { maxRetries: 2, retryDelay: 3000 },
      createdAt: '2025-01-15T09:00:00Z',
      successCount: 89,
      failureCount: 12
    }
  ];

  const eventsData: WebhookEvent[] = [
    {
      id: '1',
      webhookId: '1',
      event: 'ticket.created',
      payload: { ticketId: 'TICK-001', title: 'Login issue' },
      status: 'success',
      attempts: 1,
      createdAt: '2025-01-27T14:30:00Z',
      completedAt: '2025-01-27T14:30:02Z'
    },
    {
      id: '2', 
      webhookId: '2',
      event: 'ticket.created',
      payload: { ticketId: 'TICK-002', title: 'Payment error' },
      status: 'failed',
      attempts: 3,
      createdAt: '2025-01-27T12:15:00Z',
      errorMessage: 'Connection timeout'
    }
  ];

  const { data: webhooks = webhooksData } = useQuery<WebhookConfig[]>({
    queryKey: ['/api/webhooks'],
    enabled: true
  });

  const { data: events = eventsData } = useQuery<WebhookEvent[]>({
    queryKey: ['/api/webhooks/events'],
    enabled: true
  });

  const createWebhookMutation = useMutation({
    mutationFn: async (webhook: Partial<WebhookConfig>) => {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: Date.now().toString(), ...webhook };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
      setShowCreateDialog(false);
      setSelectedTemplate(null);
      toast({
        title: "Webhook Criado",
        description: "Webhook configurado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar webhook",
        variant: "destructive",
      });
    }
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      // API call to test webhook
      await new Promise(resolve => setTimeout(resolve, 2000));
      return Math.random() > 0.3 ? { success: true } : { success: false, error: 'Connection failed' };
    },
    onSuccess: (data) => {
      setTestResult({
        success: data.success,
        message: data.success ? 'Webhook testado com sucesso!' : data.error || 'Teste falhou'
      });
    }
  });

  const toggleWebhookMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
    }
  });

  const CreateWebhookForm = () => {
    const [formData, setFormData] = useState({
      name: selectedTemplate?.name || '',
      url: '',
      events: selectedTemplate?.events || [],
      headers: selectedTemplate?.headers || {},
      secret: '',
      maxRetries: 3,
      retryDelay: 5000
    });

    const handleSubmit = () => {
      createWebhookMutation.mutate({
        ...formData,
        active: true,
        retryConfig: {
          maxRetries: formData.maxRetries,
          retryDelay: formData.retryDelay
        },
        successCount: 0,
        failureCount: 0,
        createdAt: new Date().toISOString()
      });
    };

    return (
      <div className="space-y-4">
        {selectedTemplate && (
          <Alert className="bg-blue-50 border-blue-200">
            <selectedTemplate.icon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Configurando integração com {selectedTemplate.name}: {selectedTemplate.description}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="webhookName">Nome</Label>
            <Input
              id="webhookName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do webhook"
              data-testid="input-webhook-name"
            />
          </div>
          <div>
            <Label htmlFor="webhookUrl">URL</Label>
            <Input
              id="webhookUrl"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://exemplo.com/webhook"
              data-testid="input-webhook-url"
            />
          </div>
        </div>

        <div>
          <Label>Eventos</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {AVAILABLE_EVENTS.map(event => (
              <label key={event} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.events.includes(event)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, events: [...formData.events, event] });
                    } else {
                      setFormData({ ...formData, events: formData.events.filter(ev => ev !== event) });
                    }
                  }}
                  data-testid={`checkbox-event-${event}`}
                />
                <span className="text-sm">{event}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="webhookSecret">Secret (opcional)</Label>
          <Input
            id="webhookSecret"
            type="password"
            value={formData.secret}
            onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
            placeholder="Secret para validação"
            data-testid="input-webhook-secret"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxRetries">Máx. Tentativas</Label>
            <Input
              id="maxRetries"
              type="number"
              min="1"
              max="10"
              value={formData.maxRetries}
              onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) })}
              data-testid="input-max-retries"
            />
          </div>
          <div>
            <Label htmlFor="retryDelay">Delay (ms)</Label>
            <Input
              id="retryDelay"
              type="number"
              min="1000"
              step="1000"
              value={formData.retryDelay}
              onChange={(e) => setFormData({ ...formData, retryDelay: parseInt(e.target.value) })}
              data-testid="input-retry-delay"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => {
              setShowCreateDialog(false);
              setSelectedTemplate(null);
            }}
            className="flex-1"
            data-testid="button-cancel-webhook"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createWebhookMutation.isPending || !formData.name || !formData.url}
            className="flex-1"
            data-testid="button-create-webhook"
          >
            {createWebhookMutation.isPending ? 'Criando...' : 'Criar Webhook'}
          </Button>
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'retrying': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6" data-testid="enhanced-webhook-manager">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciamento Avançado de Webhooks</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-webhook">
              <Plus className="w-4 h-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Webhook</DialogTitle>
            </DialogHeader>
            <CreateWebhookForm />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="events">Histórico</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card data-testid="card-total-webhooks">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Webhook className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Webhooks</p>
                    <p className="text-xl font-bold">{webhooks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-active-webhooks">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ativos</p>
                    <p className="text-xl font-bold">{webhooks.filter(w => w.active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-success-rate">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Taxa Sucesso</p>
                    <p className="text-xl font-bold">
                      {webhooks.length > 0 
                        ? Math.round((webhooks.reduce((sum, w) => sum + w.successCount, 0) / 
                          webhooks.reduce((sum, w) => sum + w.successCount + w.failureCount, 0)) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-total-events">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Eventos Hoje</p>
                    <p className="text-xl font-bold">{events.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Webhooks */}
          <Card data-testid="card-webhooks-list">
            <CardHeader>
              <CardTitle>Webhooks Configurados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Eventos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sucesso/Falha</TableHead>
                    <TableHead>Última Execução</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id} data-testid={`row-webhook-${webhook.id}`}>
                      <TableCell className="font-medium">{webhook.name}</TableCell>
                      <TableCell className="font-mono text-sm truncate max-w-xs">
                        {webhook.url}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 2).map(event => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{webhook.events.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={webhook.active}
                            onCheckedChange={(active) => 
                              toggleWebhookMutation.mutate({ id: webhook.id, active })
                            }
                            data-testid={`switch-webhook-${webhook.id}`}
                          />
                          <span className={webhook.active ? 'text-green-600' : 'text-gray-500'}>
                            {webhook.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-green-600">{webhook.successCount}</span>
                          {' / '}
                          <span className="text-red-600">{webhook.failureCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {webhook.lastTriggered ? (
                          <div className="text-sm text-gray-600">
                            {new Date(webhook.lastTriggered).toLocaleString('pt-BR')}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testWebhookMutation.mutate(webhook.id)}
                            disabled={testWebhookMutation.isPending}
                            data-testid={`button-test-${webhook.id}`}
                          >
                            <TestTube className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWebhook(webhook)}
                            data-testid={`button-edit-${webhook.id}`}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Resultado do Teste */}
          {testResult && (
            <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {INTEGRATION_TEMPLATES.map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowCreateDialog(true);
                }}
                data-testid={`template-${template.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <template.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold">{template.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.events.map(event => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card data-testid="card-events-history">
            <CardHeader>
              <CardTitle>Histórico de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Concluído em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const webhook = webhooks.find(w => w.id === event.webhookId);
                    return (
                      <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                        <TableCell>{webhook?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.event}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{event.attempts}</TableCell>
                        <TableCell>
                          {new Date(event.createdAt).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {event.completedAt 
                            ? new Date(event.completedAt).toLocaleString('pt-BR')
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="card-performance-metrics">
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Taxa de Sucesso Geral</span>
                    <span className="font-bold text-green-600">96.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tempo Médio de Resposta</span>
                    <span className="font-bold">245ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Eventos Processados Hoje</span>
                    <span className="font-bold">{events.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Webhooks com Falha</span>
                    <span className="font-bold text-red-600">
                      {webhooks.filter(w => w.failureCount > 0).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-recent-activity">
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => {
                    const webhook = webhooks.find(w => w.id === event.webhookId);
                    return (
                      <div key={event.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className={`w-2 h-2 rounded-full ${
                          event.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{webhook?.name}</div>
                          <div className="text-xs text-gray-600">{event.event}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.createdAt).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}