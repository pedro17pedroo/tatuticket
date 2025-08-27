import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Slack,
  MessageSquare,
  Globe,
  Webhook,
  Settings,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  BarChart3,
  Zap,
  Play,
  Pause,
  RefreshCw,
  Code,
  Key,
  Shield,
  ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  name: string;
  type: 'slack' | 'teams' | 'jira' | 'webhook' | 'api';
  config: Record<string, any>;
  active: boolean;
  events: string[];
  status: 'connected' | 'error' | 'pending';
  lastSync?: Date;
  errorMessage?: string;
  statistics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
  };
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  headers: Record<string, string>;
  secret?: string;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  lastTriggered?: Date;
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    retryDelay: number;
  };
}

const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: '1',
    name: 'Main Slack Workspace',
    type: 'slack',
    config: {
      webhook_url: 'https://hooks.slack.com/services/xxx',
      channel: '#support',
      botToken: 'xoxb-xxx'
    },
    active: true,
    events: ['ticket.created', 'ticket.updated', 'sla.breach'],
    status: 'connected',
    lastSync: new Date('2025-01-26'),
    statistics: {
      totalRequests: 1247,
      successfulRequests: 1198,
      failedRequests: 49,
      avgResponseTime: 245
    }
  },
  {
    id: '2',
    name: 'Development Team',
    type: 'teams',
    config: {
      webhook_url: 'https://outlook.office.com/webhook/xxx',
      channel: 'Development Alerts'
    },
    active: true,
    events: ['ticket.escalated', 'bug.reported'],
    status: 'connected',
    lastSync: new Date('2025-01-25'),
    statistics: {
      totalRequests: 456,
      successfulRequests: 441,
      failedRequests: 15,
      avgResponseTime: 320
    }
  },
  {
    id: '3',
    name: 'Project Management',
    type: 'jira',
    config: {
      server_url: 'https://company.atlassian.net',
      username: 'api@company.com',
      token: 'xxx',
      project: 'SUPPORT'
    },
    active: false,
    events: ['ticket.created', 'ticket.resolved'],
    status: 'error',
    errorMessage: 'Authentication failed. Please check credentials.',
    statistics: {
      totalRequests: 234,
      successfulRequests: 180,
      failedRequests: 54,
      avgResponseTime: 1200
    }
  }
];

const MOCK_WEBHOOKS: Webhook[] = [
  {
    id: '1',
    name: 'External CRM Sync',
    url: 'https://api.company.com/webhooks/tickets',
    events: ['ticket.created', 'ticket.updated', 'ticket.resolved'],
    active: true,
    headers: {
      'Authorization': 'Bearer xxx',
      'Content-Type': 'application/json'
    },
    secret: 'webhook_secret_key',
    successCount: 892,
    failureCount: 23,
    createdAt: new Date('2024-12-15'),
    lastTriggered: new Date('2025-01-26'),
    retryPolicy: {
      maxRetries: 3,
      backoffStrategy: 'exponential',
      retryDelay: 1000
    }
  },
  {
    id: '2',
    name: 'Analytics Dashboard',
    url: 'https://analytics.company.com/api/events',
    events: ['ticket.created', 'sla.breach'],
    active: true,
    headers: {
      'X-API-Key': 'analytics_key_xxx'
    },
    successCount: 1567,
    failureCount: 8,
    createdAt: new Date('2024-11-20'),
    lastTriggered: new Date('2025-01-25'),
    retryPolicy: {
      maxRetries: 5,
      backoffStrategy: 'linear',
      retryDelay: 2000
    }
  }
];

const AVAILABLE_EVENTS = [
  'ticket.created',
  'ticket.updated',
  'ticket.assigned',
  'ticket.resolved',
  'ticket.closed',
  'ticket.escalated',
  'sla.breach',
  'sla.warning',
  'customer.created',
  'user.login',
  'system.alert'
];

const INTEGRATION_TEMPLATES = {
  slack: {
    name: 'Slack Integration',
    description: 'Send notifications to Slack channels',
    configFields: [
      { name: 'webhook_url', label: 'Webhook URL', type: 'url', required: true },
      { name: 'channel', label: 'Default Channel', type: 'text', required: true },
      { name: 'botToken', label: 'Bot Token', type: 'password', required: false }
    ]
  },
  teams: {
    name: 'Microsoft Teams',
    description: 'Send notifications to Teams channels',
    configFields: [
      { name: 'webhook_url', label: 'Webhook URL', type: 'url', required: true },
      { name: 'channel', label: 'Channel Name', type: 'text', required: true }
    ]
  },
  jira: {
    name: 'Jira Integration',
    description: 'Create and sync issues with Jira',
    configFields: [
      { name: 'server_url', label: 'Jira Server URL', type: 'url', required: true },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'token', label: 'API Token', type: 'password', required: true },
      { name: 'project', label: 'Project Key', type: 'text', required: true }
    ]
  }
};

export function AdvancedIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(MOCK_INTEGRATIONS);
  const [webhooks, setWebhooks] = useState<Webhook[]>(MOCK_WEBHOOKS);
  const [editingIntegration, setEditingIntegration] = useState<Partial<Integration> | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<Partial<Webhook> | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Test integration mutation
  const testIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await fetch(`/api/integrations/${integrationId}/test`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Integration test failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Test Successful',
        description: 'Integration is working correctly',
      });
    },
    onError: () => {
      toast({
        title: 'Test Failed',
        description: 'There was an error testing the integration',
        variant: 'destructive',
      });
    },
  });

  // Save integration mutation
  const saveIntegrationMutation = useMutation({
    mutationFn: async (integration: Partial<Integration>) => {
      const method = integration.id ? 'PUT' : 'POST';
      const url = integration.id ? `/api/integrations/${integration.id}` : '/api/integrations';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integration),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save integration');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setShowCreateDialog(false);
      setEditingIntegration(null);
      toast({
        title: 'Success',
        description: 'Integration saved successfully',
      });
    },
  });

  // Save webhook mutation
  const saveWebhookMutation = useMutation({
    mutationFn: async (webhook: Partial<Webhook>) => {
      const method = webhook.id ? 'PUT' : 'POST';
      const url = webhook.id ? `/api/webhooks/${webhook.id}` : '/api/webhooks';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhook),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save webhook');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setShowWebhookDialog(false);
      setEditingWebhook(null);
      toast({
        title: 'Success',
        description: 'Webhook saved successfully',
      });
    },
  });

  const handleCreateIntegration = (type: string) => {
    const template = INTEGRATION_TEMPLATES[type as keyof typeof INTEGRATION_TEMPLATES];
    if (template) {
      setEditingIntegration({
        name: template.name,
        type: type as any,
        config: {},
        active: true,
        events: ['ticket.created'],
        status: 'pending'
      });
      setSelectedIntegrationType(type);
      setShowCreateDialog(true);
    }
  };

  const handleSaveIntegration = () => {
    if (!editingIntegration?.name || !editingIntegration?.type) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    saveIntegrationMutation.mutate(editingIntegration);
  };

  const handleSaveWebhook = () => {
    if (!editingWebhook?.name || !editingWebhook?.url) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    saveWebhookMutation.mutate({
      ...editingWebhook,
      retryPolicy: editingWebhook.retryPolicy || {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        retryDelay: 1000
      }
    });
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'slack': return <Slack className="h-5 w-5" />;
      case 'teams': return <MessageSquare className="h-5 w-5" />;
      case 'jira': return <Globe className="h-5 w-5" />;
      case 'webhook': return <Webhook className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Advanced Integrations</h2>
          <p className="text-muted-foreground">Connect TatuTicket with your favorite tools and services</p>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api">API Access</TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {/* Quick Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCreateIntegration('slack')}>
                  <CardContent className="p-6 text-center">
                    <Slack className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="font-semibold mb-2">Slack</h3>
                    <p className="text-sm text-muted-foreground">Send notifications to Slack channels</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCreateIntegration('teams')}>
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                    <h3 className="font-semibold mb-2">Microsoft Teams</h3>
                    <p className="text-sm text-muted-foreground">Connect with Teams channels</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCreateIntegration('jira')}>
                  <CardContent className="p-6 text-center">
                    <Globe className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                    <h3 className="font-semibold mb-2">Jira</h3>
                    <p className="text-sm text-muted-foreground">Sync issues with Jira projects</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Active Integrations */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Active Integrations</h3>
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-integration">
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {getIntegrationIcon(integration.type)}
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(integration.status)}
                            <span className="text-sm text-muted-foreground capitalize">{integration.status}</span>
                          </div>
                        </div>
                      </div>
                      <Switch checked={integration.active} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {integration.errorMessage && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">{integration.errorMessage}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Events:</span>
                          <p className="font-medium">{integration.events.length}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success Rate:</span>
                          <p className="font-medium">
                            {integration.statistics.totalRequests > 0
                              ? Math.round((integration.statistics.successfulRequests / integration.statistics.totalRequests) * 100)
                              : 0}%
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Response Time</span>
                          <span>{integration.statistics.avgResponseTime}ms</span>
                        </div>
                        <Progress 
                          value={Math.min(integration.statistics.avgResponseTime / 10, 100)} 
                          className="h-2"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testIntegrationMutation.mutate(integration.id)}
                          disabled={testIntegrationMutation.isPending}
                          data-testid={`button-test-integration-${integration.id}`}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingIntegration(integration);
                            setSelectedIntegrationType(integration.type);
                            setShowCreateDialog(true);
                          }}
                          data-testid={`button-edit-integration-${integration.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Webhooks</h3>
              <p className="text-sm text-muted-foreground">Send HTTP requests when events occur</p>
            </div>
            <Button onClick={() => setShowWebhookDialog(true)} data-testid="button-create-webhook">
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>

          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Webhook className="h-5 w-5" />
                        <h4 className="font-semibold">{webhook.name}</h4>
                        <Badge variant={webhook.active ? "default" : "secondary"}>
                          {webhook.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{webhook.url}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Events:</span>
                          <p className="font-medium">{webhook.events.length}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success:</span>
                          <p className="font-medium text-green-600">{webhook.successCount}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Failed:</span>
                          <p className="font-medium text-red-600">{webhook.failureCount}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Triggered:</span>
                          <p className="font-medium">
                            {webhook.lastTriggered 
                              ? webhook.lastTriggered.toLocaleDateString()
                              : 'Never'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingWebhook(webhook);
                          setShowWebhookDialog(true);
                        }}
                        data-testid={`button-edit-webhook-${webhook.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-test-webhook-${webhook.id}`}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* API Access Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                API Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Use our REST API to integrate TatuTicket with your applications.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Base URL</h4>
                    <code className="text-sm bg-gray-100 p-2 rounded block">
                      https://api.tatuticket.com/v1
                    </code>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Authentication</h4>
                    <code className="text-sm bg-gray-100 p-2 rounded block">
                      Authorization: Bearer YOUR_API_KEY
                    </code>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" data-testid="button-view-api-docs">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
                <Button variant="outline" data-testid="button-generate-api-key">
                  <Key className="h-4 w-4 mr-2" />
                  Generate API Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Integration Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration?.id ? 'Edit Integration' : 'Create Integration'}
            </DialogTitle>
          </DialogHeader>
          
          {editingIntegration && selectedIntegrationType && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="integration-name">Name</Label>
                <Input
                  id="integration-name"
                  value={editingIntegration.name || ''}
                  onChange={(e) => setEditingIntegration({
                    ...editingIntegration,
                    name: e.target.value
                  })}
                  placeholder="Enter integration name"
                  data-testid="input-integration-name"
                />
              </div>

              {INTEGRATION_TEMPLATES[selectedIntegrationType as keyof typeof INTEGRATION_TEMPLATES]?.configFields.map((field) => (
                <div key={field.name}>
                  <Label htmlFor={`config-${field.name}`}>{field.label}</Label>
                  <Input
                    id={`config-${field.name}`}
                    type={field.type}
                    value={editingIntegration.config?.[field.name] || ''}
                    onChange={(e) => setEditingIntegration({
                      ...editingIntegration,
                      config: {
                        ...editingIntegration.config,
                        [field.name]: e.target.value
                      }
                    })}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    data-testid={`input-config-${field.name}`}
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel-integration"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveIntegration}
                  disabled={saveIntegrationMutation.isPending}
                  data-testid="button-save-integration"
                >
                  {saveIntegrationMutation.isPending ? 'Saving...' : 'Save Integration'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Webhook Dialog */}
      <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook?.id ? 'Edit Webhook' : 'Create Webhook'}
            </DialogTitle>
          </DialogHeader>
          
          {editingWebhook && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook-name">Name</Label>
                <Input
                  id="webhook-name"
                  value={editingWebhook.name || ''}
                  onChange={(e) => setEditingWebhook({
                    ...editingWebhook,
                    name: e.target.value
                  })}
                  placeholder="Enter webhook name"
                  data-testid="input-webhook-name"
                />
              </div>

              <div>
                <Label htmlFor="webhook-url">URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  value={editingWebhook.url || ''}
                  onChange={(e) => setEditingWebhook({
                    ...editingWebhook,
                    url: e.target.value
                  })}
                  placeholder="https://api.example.com/webhook"
                  data-testid="input-webhook-url"
                />
              </div>

              <div>
                <Label>Events</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <label key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingWebhook.events?.includes(event) || false}
                        onChange={(e) => {
                          const currentEvents = editingWebhook.events || [];
                          const newEvents = e.target.checked
                            ? [...currentEvents, event]
                            : currentEvents.filter(ev => ev !== event);
                          
                          setEditingWebhook({
                            ...editingWebhook,
                            events: newEvents
                          });
                        }}
                        data-testid={`checkbox-event-${event}`}
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowWebhookDialog(false)}
                  data-testid="button-cancel-webhook"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveWebhook}
                  disabled={saveWebhookMutation.isPending}
                  data-testid="button-save-webhook"
                >
                  {saveWebhookMutation.isPending ? 'Saving...' : 'Save Webhook'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}