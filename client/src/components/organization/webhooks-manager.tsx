import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { authService } from '@/lib/auth';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  headers?: Record<string, string>;
  retryAttempts: number;
  timeoutMs: number;
  createdAt: Date;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
}

interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  responseCode?: number;
  responseBody?: string;
  createdAt: Date;
  processedAt?: Date;
}

const availableEvents = [
  { key: 'ticket.created', label: 'Ticket Criado', description: 'Disparado quando um novo ticket é criado' },
  { key: 'ticket.updated', label: 'Ticket Atualizado', description: 'Disparado quando um ticket é atualizado' },
  { key: 'ticket.resolved', label: 'Ticket Resolvido', description: 'Disparado quando um ticket é resolvido' },
  { key: 'ticket.closed', label: 'Ticket Fechado', description: 'Disparado quando um ticket é fechado' },
  { key: 'agent.assigned', label: 'Agente Atribuído', description: 'Disparado quando um agente é atribuído a um ticket' },
  { key: 'sla.breached', label: 'SLA Violado', description: 'Disparado quando um SLA é violado' },
  { key: 'customer.created', label: 'Cliente Criado', description: 'Disparado quando um novo cliente é criado' },
  { key: 'user.login', label: 'Login de Usuário', description: 'Disparado quando um usuário faz login' },
  { key: 'payment.received', label: 'Pagamento Recebido', description: 'Disparado quando um pagamento é processado' },
  { key: 'subscription.updated', label: 'Assinatura Atualizada', description: 'Disparado quando uma assinatura muda' }
];

export function WebhooksManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    active: true,
    secret: '',
    headers: '{}',
    retryAttempts: 3,
    timeoutMs: 30000
  });

  useEffect(() => {
    loadWebhooks();
    loadWebhookEvents();
  }, []);

  const loadWebhooks = async () => {
    try {
      const response = await apiRequest('GET', '/api/webhooks');
      const webhooksData = await response.json();
      setWebhooks(webhooksData);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      // Mock data for development
      setWebhooks([
        {
          id: '1',
          name: 'Slack Notifications',
          url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
          events: ['ticket.created', 'ticket.resolved', 'sla.breached'],
          active: true,
          retryAttempts: 3,
          timeoutMs: 30000,
          createdAt: new Date('2025-01-20'),
          lastTriggered: new Date('2025-01-26'),
          successCount: 145,
          failureCount: 2
        },
        {
          id: '2',
          name: 'CRM Integration',
          url: 'https://api.crm.example.com/webhooks/tatuticket',
          events: ['customer.created', 'ticket.created'],
          active: true,
          retryAttempts: 5,
          timeoutMs: 45000,
          createdAt: new Date('2025-01-15'),
          lastTriggered: new Date('2025-01-25'),
          successCount: 89,
          failureCount: 0
        },
        {
          id: '3',
          name: 'Analytics Tracker',
          url: 'https://analytics.internal.com/events',
          events: ['user.login', 'ticket.created', 'payment.received'],
          active: false,
          retryAttempts: 2,
          timeoutMs: 15000,
          createdAt: new Date('2025-01-10'),
          successCount: 0,
          failureCount: 0
        }
      ]);
    }
  };

  const loadWebhookEvents = async () => {
    try {
      const response = await apiRequest('GET', '/api/webhooks/events?limit=50');
      const eventsData = await response.json();
      setWebhookEvents(eventsData);
    } catch (error) {
      console.error('Error loading webhook events:', error);
      // Mock data for development
      setWebhookEvents([
        {
          id: '1',
          webhookId: '1',
          event: 'ticket.created',
          payload: { ticketId: 'TT-2025-001', subject: 'Login issues' },
          status: 'success',
          attempts: 1,
          responseCode: 200,
          createdAt: new Date('2025-01-26T09:15:00'),
          processedAt: new Date('2025-01-26T09:15:02')
        },
        {
          id: '2',
          webhookId: '2',
          event: 'customer.created',
          payload: { customerId: 'CUST-001', name: 'Acme Corp' },
          status: 'failed',
          attempts: 3,
          responseCode: 500,
          createdAt: new Date('2025-01-26T08:30:00'),
          processedAt: new Date('2025-01-26T08:30:15')
        },
        {
          id: '3',
          webhookId: '1',
          event: 'sla.breached',
          payload: { ticketId: 'TT-2025-002', slaName: 'Premium Support' },
          status: 'retrying',
          attempts: 2,
          createdAt: new Date('2025-01-26T07:45:00')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const createWebhook = async () => {
    try {
      let headers = {};
      if (newWebhook.headers.trim()) {
        headers = JSON.parse(newWebhook.headers);
      }

      const webhookData = {
        ...newWebhook,
        headers,
        events: newWebhook.events
      };

      const response = await apiRequest('POST', '/api/webhooks', webhookData);
      const webhook = await response.json();
      
      setWebhooks(prev => [...prev, webhook]);
      setIsCreatingWebhook(false);
      setNewWebhook({
        name: '',
        url: '',
        events: [],
        active: true,
        secret: '',
        headers: '{}',
        retryAttempts: 3,
        timeoutMs: 30000
      });
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Erro ao criar webhook. Verifique os dados e tente novamente.');
    }
  };

  const toggleWebhook = async (webhookId: string, active: boolean) => {
    try {
      await apiRequest('PATCH', `/api/webhooks/${webhookId}`, { active });
      setWebhooks(prev => prev.map(w => w.id === webhookId ? { ...w, active } : w));
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    if (!confirm('Tem certeza que deseja excluir este webhook? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/webhooks/${webhookId}`);
      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      setWebhookEvents(prev => prev.filter(e => e.webhookId !== webhookId));
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  const testWebhook = async (webhookId: string) => {
    try {
      await apiRequest('POST', `/api/webhooks/${webhookId}/test`);
      alert('Webhook testado com sucesso! Verifique o endpoint de destino.');
    } catch (error) {
      console.error('Error testing webhook:', error);
      alert('Falha no teste do webhook. Verifique a URL e configurações.');
    }
  };

  const retryEvent = async (eventId: string) => {
    try {
      await apiRequest('POST', `/api/webhooks/events/${eventId}/retry`);
      loadWebhookEvents(); // Reload to show updated status
    } catch (error) {
      console.error('Error retrying event:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      failed: 'destructive',
      pending: 'secondary',
      retrying: 'outline'
    };
    
    const icons = {
      success: 'fas fa-check',
      failed: 'fas fa-times',
      pending: 'fas fa-clock',
      retrying: 'fas fa-redo'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        <i className={`${icons[status as keyof typeof icons]} mr-1`}></i>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Webhooks</h2>
          <p className="text-gray-600">Configure integrações automáticas com sistemas externos</p>
        </div>
        
        <Dialog open={isCreatingWebhook} onOpenChange={setIsCreatingWebhook}>
          <DialogTrigger asChild>
            <Button>
              <i className="fas fa-plus mr-2"></i>
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Slack Notifications"
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL do Webhook</Label>
                  <Input
                    id="url"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/webhook"
                  />
                </div>
              </div>

              <div>
                <Label>Eventos para Monitorar</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableEvents.map((event) => (
                    <div key={event.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={event.key}
                        checked={newWebhook.events.includes(event.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhook(prev => ({ ...prev, events: [...prev.events, event.key] }));
                          } else {
                            setNewWebhook(prev => ({ ...prev, events: prev.events.filter(e => e !== event.key) }));
                          }
                        }}
                      />
                      <Label htmlFor={event.key} className="text-sm">{event.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="secret">Secret (Opcional)</Label>
                  <Input
                    id="secret"
                    type="password"
                    value={newWebhook.secret}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                    placeholder="Para verificação de assinatura"
                  />
                </div>
                <div>
                  <Label htmlFor="retryAttempts">Tentativas de Retry</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    min="1"
                    max="10"
                    value={newWebhook.retryAttempts}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="headers">Headers Personalizados (JSON)</Label>
                <Textarea
                  id="headers"
                  value={newWebhook.headers}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, headers: e.target.value }))}
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  className="font-mono text-sm"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newWebhook.active}
                  onCheckedChange={(checked) => setNewWebhook(prev => ({ ...prev, active: checked }))}
                />
                <Label>Ativar webhook imediatamente</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreatingWebhook(false)}>
                  Cancelar
                </Button>
                <Button onClick={createWebhook} disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}>
                  Criar Webhook
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks Ativos</TabsTrigger>
          <TabsTrigger value="events">Histórico de Eventos</TabsTrigger>
          <TabsTrigger value="docs">Documentação</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{webhook.name}</h3>
                      <Badge variant={webhook.active ? 'default' : 'secondary'}>
                        {webhook.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 font-mono">{webhook.url}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {availableEvents.find(e => e.key === event)?.label || event}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>✅ {webhook.successCount} sucessos</span>
                      <span>❌ {webhook.failureCount} falhas</span>
                      {webhook.lastTriggered && (
                        <span>🕒 Último disparo: {webhook.lastTriggered.toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={webhook.active}
                      onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(webhook.id)}
                    >
                      <i className="fas fa-flask mr-1"></i>
                      Testar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWebhook(webhook.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <i className="fas fa-trash mr-1"></i>
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {webhooks.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <i className="fas fa-plug text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-lg font-semibold mb-2">Nenhum webhook configurado</h3>
                <p className="text-gray-600 mb-4">Configure webhooks para integrar automaticamente com sistemas externos</p>
                <Button onClick={() => setIsCreatingWebhook(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  Criar Primeiro Webhook
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Eventos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {webhookEvents.map((event) => {
                  const webhook = webhooks.find(w => w.id === event.webhookId);
                  return (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <strong className="text-sm">{webhook?.name || 'Webhook Removido'}</strong>
                          <Badge variant="outline" className="text-xs">{event.event}</Badge>
                          {getStatusBadge(event.status)}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {event.createdAt.toLocaleString('pt-BR')}
                          {event.processedAt && ` • Processado em ${event.processedAt.toLocaleString('pt-BR')}`}
                        </p>
                        <div className="text-xs font-mono bg-gray-50 p-2 rounded">
                          {JSON.stringify(event.payload, null, 2)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <span className="text-xs text-gray-500">
                          {event.attempts} tentativa{event.attempts > 1 ? 's' : ''}
                        </span>
                        {event.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryEvent(event.id)}
                          >
                            <i className="fas fa-redo mr-1"></i>
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentação dos Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h3>Como Funciona</h3>
              <p>Os webhooks do TatuTicket permitem que você receba notificações em tempo real quando eventos específicos ocorrem no sistema.</p>
              
              <h3>Eventos Disponíveis</h3>
              <div className="grid grid-cols-1 gap-4 mt-4">
                {availableEvents.map((event) => (
                  <div key={event.key} className="border p-4 rounded-lg">
                    <h4 className="font-semibold">{event.label}</h4>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{event.key}</code>
                  </div>
                ))}
              </div>

              <h3>Formato do Payload</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "id": "evt_123456789",
  "event": "ticket.created", 
  "data": {
    "ticket": {
      "id": "TT-2025-001",
      "subject": "Login issues",
      "priority": "high",
      "status": "open",
      "customer": {
        "id": "cust_123",
        "name": "Acme Corp"
      }
    }
  },
  "created": "2025-01-26T10:30:00Z"
}`}
              </pre>

              <h3>Configuração de Segurança</h3>
              <p>Para verificar a autenticidade dos webhooks, você pode:</p>
              <ul>
                <li>Configurar um secret que será usado para assinar o payload</li>
                <li>Adicionar headers personalizados de autenticação</li>
                <li>Validar o IP de origem (somente IPs do TatuTicket)</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}