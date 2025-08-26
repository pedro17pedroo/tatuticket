import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
  };
  createdAt: Date;
  lastTriggered?: Date;
  stats: {
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
  };
}

interface Integration {
  id: string;
  name: string;
  type: 'slack' | 'teams' | 'jira' | 'zendesk' | 'custom';
  icon: string;
  description: string;
  isConfigured: boolean;
  config?: any;
}

const availableEvents = [
  { id: 'ticket.created', label: 'Ticket Criado', description: 'Quando um novo ticket é criado' },
  { id: 'ticket.updated', label: 'Ticket Atualizado', description: 'Quando um ticket é modificado' },
  { id: 'ticket.resolved', label: 'Ticket Resolvido', description: 'Quando um ticket é marcado como resolvido' },
  { id: 'ticket.closed', label: 'Ticket Fechado', description: 'Quando um ticket é fechado' },
  { id: 'ticket.assigned', label: 'Ticket Atribuído', description: 'Quando um ticket é atribuído a um agente' },
  { id: 'sla.warning', label: 'Alerta de SLA', description: 'Quando SLA está próximo do vencimento' },
  { id: 'sla.violation', label: 'Violação de SLA', description: 'Quando SLA é violado' },
  { id: 'customer.created', label: 'Cliente Criado', description: 'Quando um novo cliente é cadastrado' },
  { id: 'agent.login', label: 'Login do Agente', description: 'Quando um agente faz login' }
];

const integrationTypes: Integration[] = [
  {
    id: '1',
    name: 'Slack',
    type: 'slack',
    icon: 'fab fa-slack',
    description: 'Notificações em canais do Slack',
    isConfigured: false
  },
  {
    id: '2',
    name: 'Microsoft Teams',
    type: 'teams',
    icon: 'fab fa-microsoft',
    description: 'Mensagens em canais do Teams',
    isConfigured: false
  },
  {
    id: '3',
    name: 'Jira',
    type: 'jira',
    icon: 'fab fa-jira',
    description: 'Criar e atualizar issues no Jira',
    isConfigured: true,
    config: { projectKey: 'SUPP', issueType: 'Bug' }
  },
  {
    id: '4',
    name: 'Zendesk',
    type: 'zendesk',
    icon: 'fas fa-headset',
    description: 'Sincronizar tickets com Zendesk',
    isConfigured: false
  }
];

const mockWebhooks: Webhook[] = [
  {
    id: '1',
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    events: ['ticket.created', 'sla.warning'],
    isActive: true,
    retryPolicy: { maxRetries: 3, retryDelay: 5000 },
    createdAt: new Date('2024-01-15'),
    lastTriggered: new Date('2024-01-20'),
    stats: { totalCalls: 127, successCalls: 125, failedCalls: 2 }
  },
  {
    id: '2',
    name: 'Jira Integration',
    url: 'https://company.atlassian.net/rest/api/2/issue',
    events: ['ticket.created', 'ticket.resolved'],
    isActive: true,
    retryPolicy: { maxRetries: 5, retryDelay: 10000 },
    createdAt: new Date('2024-01-10'),
    lastTriggered: new Date('2024-01-19'),
    stats: { totalCalls: 89, successCalls: 87, failedCalls: 2 }
  }
];

export function WebhookManager() {
  const { toast } = useToast();
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    headers: '',
    maxRetries: 3,
    retryDelay: 5000
  });

  const handleCreateWebhook = async () => {
    if (!webhookForm.name || !webhookForm.url || webhookForm.events.length === 0) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha nome, URL e selecione pelo menos um evento.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Webhook Criado",
        description: `Webhook "${webhookForm.name}" foi criado com sucesso!`
      });

      // Reset form
      setWebhookForm({
        name: '',
        url: '',
        events: [],
        secret: '',
        headers: '',
        maxRetries: 3,
        retryDelay: 5000
      });
      setIsCreating(false);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar webhook. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const testWebhook = async (webhookId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Teste Enviado",
        description: "Payload de teste enviado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Falha no Teste",
        description: "Não foi possível enviar o payload de teste.",
        variant: "destructive"
      });
    }
  };

  const toggleWebhook = async (webhookId: string, active: boolean) => {
    toast({
      title: active ? "Webhook Ativado" : "Webhook Desativado",
      description: `Webhook ${active ? 'ativado' : 'desativado'} com sucesso!`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhooks e Integrações</h2>
          <p className="text-gray-600">Conecte o TatuTicket com suas ferramentas favoritas</p>
        </div>
        
        <Button onClick={() => setIsCreating(true)} data-testid="button-create-webhook">
          <i className="fas fa-plus mr-2"></i>
          Novo Webhook
        </Button>
      </div>

      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Lista de Webhooks */}
        <TabsContent value="webhooks">
          <div className="space-y-4">
            {mockWebhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{webhook.name}</h3>
                        <Badge variant={webhook.isActive ? "default" : "secondary"}>
                          {webhook.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{webhook.url}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {availableEvents.find(e => e.id === event)?.label || event}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Total:</span>
                          <div className="font-semibold">{webhook.stats.totalCalls}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Sucesso:</span>
                          <div className="font-semibold text-green-600">{webhook.stats.successCalls}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Falhas:</span>
                          <div className="font-semibold text-red-600">{webhook.stats.failedCalls}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        checked={webhook.isActive}
                        onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                        data-testid={`switch-webhook-${webhook.id}`}
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook(webhook.id)}
                        data-testid={`button-test-${webhook.id}`}
                      >
                        <i className="fas fa-play mr-1"></i>
                        Testar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedWebhook(webhook)}
                        data-testid={`button-edit-${webhook.id}`}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Integrações Pré-Configuradas */}
        <TabsContent value="integrations">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrationTypes.map((integration) => (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <i className={`${integration.icon} text-xl text-primary`}></i>
                      </div>
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>
                    
                    <Badge variant={integration.isConfigured ? "default" : "outline"}>
                      {integration.isConfigured ? 'Configurado' : 'Disponível'}
                    </Badge>
                  </div>
                  
                  {integration.isConfigured && integration.config && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <div className="text-xs text-gray-600">Configuração:</div>
                      <div className="text-sm font-mono">
                        {JSON.stringify(integration.config, null, 2)}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      variant={integration.isConfigured ? "outline" : "default"}
                      size="sm"
                      className="flex-1"
                      data-testid={`button-config-${integration.type}`}
                    >
                      {integration.isConfigured ? 'Reconfigurar' : 'Configurar'}
                    </Button>
                    
                    {integration.isConfigured && (
                      <Button variant="outline" size="sm" data-testid={`button-test-integration-${integration.id}`}>
                        <i className="fas fa-play"></i>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Logs de Webhooks */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Execução</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Mock log entries */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="default" className="bg-green-100 text-green-800">SUCCESS</Badge>
                    <div>
                      <div className="font-medium">ticket.created → Slack Notifications</div>
                      <div className="text-sm text-gray-600">Hoje, 14:30</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Ver Payload</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="destructive">FAILED</Badge>
                    <div>
                      <div className="font-medium">sla.warning → Jira Integration</div>
                      <div className="text-sm text-gray-600">Hoje, 13:45 • HTTP 500</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Ver Erro</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Criação de Webhook */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Criar Novo Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={webhookForm.name}
                    onChange={(e) => setWebhookForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Slack Notifications"
                    data-testid="input-webhook-name"
                  />
                </div>
                
                <div>
                  <Label>URL do Webhook *</Label>
                  <Input
                    value={webhookForm.url}
                    onChange={(e) => setWebhookForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://hooks.example.com/webhook"
                    data-testid="input-webhook-url"
                  />
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Eventos *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-3">
                  {availableEvents.map((event) => (
                    <label key={event.id} className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhookForm.events.includes(event.id)}
                        onChange={(e) => {
                          const events = e.target.checked
                            ? [...webhookForm.events, event.id]
                            : webhookForm.events.filter(ev => ev !== event.id);
                          setWebhookForm(prev => ({ ...prev, events }));
                        }}
                        className="mt-1"
                        data-testid={`checkbox-event-${event.id}`}
                      />
                      <div className="text-sm">
                        <div className="font-medium">{event.label}</div>
                        <div className="text-gray-600">{event.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Secret (opcional)</Label>
                <Input
                  value={webhookForm.secret}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, secret: e.target.value }))}
                  placeholder="Para validação de assinatura"
                  data-testid="input-webhook-secret"
                />
              </div>
              
              <div>
                <Label>Headers Personalizados (JSON)</Label>
                <Textarea
                  value={webhookForm.headers}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, headers: e.target.value }))}
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  data-testid="textarea-webhook-headers"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateWebhook} data-testid="button-save-webhook">
                  Criar Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}