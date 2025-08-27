import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  PlayCircle,
  PlusCircle,
  Settings,
  Workflow,
  Zap,
  Bell,
  User,
  Tag,
  ArrowUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Mock data for workflows
const MOCK_WORKFLOWS = [
  {
    id: '1',
    name: 'Auto-assign New Tickets',
    description: 'Automatically assign new tickets to available agents',
    isActive: true,
    priority: 1,
    trigger: { type: 'ticket_created', conditions: [] },
    actions: [{ type: 'assign_agent', params: { strategy: 'round_robin' } }],
    createdAt: new Date().toISOString(),
    executions: 145
  },
  {
    id: '2',
    name: 'Escalate High Priority',
    description: 'Escalate high priority tickets after 2 hours',
    isActive: true,
    priority: 2,
    trigger: { 
      type: 'ticket_created', 
      conditions: [{ field: 'priority', operator: 'equals', value: 'high' }] 
    },
    actions: [
      { type: 'send_notification', params: { recipient: 'manager' } },
      { type: 'escalate', params: {} }
    ],
    createdAt: new Date().toISOString(),
    executions: 32
  },
  {
    id: '3',
    name: 'SLA Breach Alert',
    description: 'Send alert when SLA is about to be breached',
    isActive: false,
    priority: 3,
    trigger: { type: 'sla_breach', conditions: [] },
    actions: [
      { type: 'escalate', params: {} },
      { type: 'send_notification', params: { recipient: 'manager' } }
    ],
    createdAt: new Date().toISOString(),
    executions: 8
  }
];

const TRIGGER_TYPES = [
  { value: 'ticket_created', label: 'Ticket Criado' },
  { value: 'ticket_updated', label: 'Ticket Atualizado' },
  { value: 'ticket_assigned', label: 'Ticket Atribuído' },
  { value: 'sla_breach', label: 'Violação de SLA' },
];

const ACTION_TYPES = [
  { value: 'assign_agent', label: 'Atribuir Agente', icon: User },
  { value: 'send_notification', label: 'Enviar Notificação', icon: Bell },
  { value: 'update_priority', label: 'Atualizar Prioridade', icon: ArrowUp },
  { value: 'add_tag', label: 'Adicionar Tag', icon: Tag },
  { value: 'escalate', label: 'Escalar', icon: AlertCircle },
];

export function WorkflowAutomation() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflows = MOCK_WORKFLOWS, isLoading } = useQuery({
    queryKey: ['/api/workflows', 'tenant-1'], // Replace with actual tenant ID
    enabled: true,
  }) as { data: any[], isLoading: boolean };

  const { data: templates = [] } = useQuery({
    queryKey: ['/api/workflows/templates/list'],
    enabled: true,
  }) as { data: any[] };

  const createWorkflowMutation = useMutation({
    mutationFn: async (workflow: any) => {
      // Mock API call
      return Promise.resolve({ id: Date.now().toString(), ...workflow });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({ title: 'Workflow criado com sucesso!' });
      setIsCreateDialogOpen(false);
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // Mock API call
      return Promise.resolve({ id, isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({ title: 'Workflow atualizado!' });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="workflow-automation">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <Workflow className="w-8 h-8 mr-3 text-primary" />
            Automação de Workflows
          </h2>
          <p className="text-muted-foreground">
            Configure automações para otimizar seus processos de suporte
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-workflow">
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Workflow</DialogTitle>
              <DialogDescription>
                Configure um novo workflow de automação
              </DialogDescription>
            </DialogHeader>
            <WorkflowCreateForm 
              onSubmit={(data) => createWorkflowMutation.mutate(data)}
              templates={templates || []}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows" data-testid="tab-workflows">
            Workflows Ativos
          </TabsTrigger>
          <TabsTrigger value="executions" data-testid="tab-executions">
            Histórico de Execuções
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid gap-4">
            {workflows.map((workflow: any) => (
              <Card key={workflow.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        workflow.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <CardTitle className="text-lg" data-testid={`workflow-name-${workflow.id}`}>
                          {workflow.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {workflow.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {workflow.executions} execuções
                      </Badge>
                      <Switch
                        checked={workflow.isActive}
                        onCheckedChange={(checked) => 
                          toggleWorkflowMutation.mutate({ 
                            id: workflow.id, 
                            isActive: checked 
                          })
                        }
                        data-testid={`switch-workflow-${workflow.id}`}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedWorkflow(workflow)}
                        data-testid={`button-view-workflow-${workflow.id}`}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Trigger:</span>
                      <Badge variant="secondary">
                        {TRIGGER_TYPES.find(t => t.value === workflow.trigger.type)?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PlayCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Ações:</span>
                      <div className="flex flex-wrap gap-1">
                        {workflow.actions.map((action: any, index: number) => {
                          const ActionIcon = ACTION_TYPES.find(a => a.value === action.type)?.icon || Bell;
                          return (
                            <Badge key={index} variant="outline" className="flex items-center space-x-1">
                              <ActionIcon className="w-3 h-3" />
                              <span>
                                {ACTION_TYPES.find(a => a.value === action.type)?.label}
                              </span>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <WorkflowExecutions workflows={workflows || []} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <WorkflowTemplates 
            templates={[
              {
                name: 'Auto-assign New Tickets',
                description: 'Automatically assign new tickets to available agents',
                trigger: { type: 'ticket_created', conditions: [] },
                actions: [{ type: 'assign_agent', params: { strategy: 'round_robin' } }]
              },
              {
                name: 'Escalate High Priority',
                description: 'Escalate high priority tickets after 2 hours',
                trigger: { 
                  type: 'ticket_created', 
                  conditions: [{ field: 'priority', operator: 'equals', value: 'high' }] 
                },
                actions: [
                  { type: 'send_notification', params: { recipient: 'manager' } },
                  { type: 'escalate', params: {} }
                ]
              }
            ]}
            onUseTemplate={(template) => {
              setSelectedWorkflow(template);
              setIsCreateDialogOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Workflow Detail Dialog */}
      {selectedWorkflow && (
        <WorkflowDetailDialog 
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
        />
      )}
    </div>
  );
}

// Workflow Create Form Component
function WorkflowCreateForm({ onSubmit, templates }: { 
  onSubmit: (data: any) => void;
  templates: any[];
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: { type: '', conditions: [] },
    actions: [],
    isActive: true,
    priority: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Workflow</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Auto-assign tickets"
            required
            data-testid="input-workflow-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Input
            id="priority"
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            min={1}
            max={10}
            data-testid="input-workflow-priority"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva o que este workflow faz..."
          data-testid="textarea-workflow-description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trigger">Trigger</Label>
        <Select
          value={formData.trigger.type}
          onValueChange={(value) => 
            setFormData({ ...formData, trigger: { ...formData.trigger, type: value } })
          }
        >
          <SelectTrigger data-testid="select-workflow-trigger">
            <SelectValue placeholder="Selecione um trigger" />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_TYPES.map((trigger) => (
              <SelectItem key={trigger.value} value={trigger.value}>
                {trigger.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="submit" data-testid="button-save-workflow">
          Criar Workflow
        </Button>
      </DialogFooter>
    </form>
  );
}

// Workflow Executions Component
function WorkflowExecutions({ workflows }: { workflows: any[] }) {
  const mockExecutions = [
    {
      id: '1',
      workflowName: 'Auto-assign New Tickets',
      status: 'success',
      executedAt: new Date(Date.now() - 1000 * 60 * 5),
      resourceType: 'ticket',
      resourceId: 'TT-2024-001'
    },
    {
      id: '2',
      workflowName: 'Escalate High Priority',
      status: 'failed',
      executedAt: new Date(Date.now() - 1000 * 60 * 15),
      resourceType: 'ticket',
      resourceId: 'TT-2024-002',
      error: 'No available managers'
    },
    {
      id: '3',
      workflowName: 'Auto-assign New Tickets',
      status: 'success',
      executedAt: new Date(Date.now() - 1000 * 60 * 30),
      resourceType: 'ticket',
      resourceId: 'TT-2024-003'
    }
  ];

  return (
    <div className="space-y-4">
      {mockExecutions.map((execution) => (
        <Card key={execution.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {execution.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <h4 className="font-medium" data-testid={`execution-workflow-${execution.id}`}>
                    {execution.workflowName}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {execution.resourceType}: {execution.resourceId}
                  </p>
                  {execution.error && (
                    <p className="text-sm text-red-600">{execution.error}</p>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {execution.executedAt.toLocaleString('pt-BR')}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Workflow Templates Component
function WorkflowTemplates({ templates, onUseTemplate }: {
  templates: any[];
  onUseTemplate: (template: any) => void;
}) {
  return (
    <div className="grid gap-4">
      {templates.map((template, index) => (
        <Card key={index} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>
              <Button 
                onClick={() => onUseTemplate(template)}
                data-testid={`button-use-template-${index}`}
              >
                Usar Template
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

// Workflow Detail Dialog Component
function WorkflowDetailDialog({ workflow, onClose }: {
  workflow: any;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!workflow} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{workflow.name}</DialogTitle>
          <DialogDescription>{workflow.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Trigger:</h4>
            <Badge>{TRIGGER_TYPES.find(t => t.value === workflow.trigger.type)?.label}</Badge>
          </div>
          <div>
            <h4 className="font-medium mb-2">Actions:</h4>
            <div className="space-y-2">
              {workflow.actions.map((action: any, index: number) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                  <Badge variant="outline">
                    {ACTION_TYPES.find(a => a.value === action.type)?.label}
                  </Badge>
                  {action.params && (
                    <pre className="text-sm text-muted-foreground">
                      {JSON.stringify(action.params, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}