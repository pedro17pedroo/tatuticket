import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  GitBranch,
  Clock,
  Users,
  Mail,
  AlertTriangle,
  CheckCircle,
  Settings,
  Save,
  Copy,
  Download,
  Zap
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface WorkflowTrigger {
  type: 'ticket_created' | 'ticket_updated' | 'ticket_assigned' | 'sla_breach' | 'customer_response';
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'not_equals';
    value: any;
  }>;
}

interface WorkflowAction {
  id: string;
  type: 'assign_agent' | 'send_notification' | 'update_priority' | 'add_tag' | 'escalate' | 'send_email' | 'create_task';
  params: Record<string, any>;
  delay?: number; // in minutes
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  isActive: boolean;
  priority: number;
  createdAt: Date;
  executionCount: number;
  successRate: number;
  lastExecuted?: Date;
}

const WORKFLOW_TEMPLATES = [
  {
    id: 'auto-assign',
    name: 'Auto-assign New Tickets',
    description: 'Automatically assign new tickets to available agents using round-robin',
    trigger: {
      type: 'ticket_created',
      conditions: []
    },
    actions: [
      {
        id: '1',
        type: 'assign_agent',
        params: { strategy: 'round_robin', department: 'support' }
      }
    ]
  },
  {
    id: 'escalate-high-priority',
    name: 'Escalate High Priority Tickets',
    description: 'Escalate high priority tickets after 2 hours without response',
    trigger: {
      type: 'ticket_created',
      conditions: [
        { field: 'priority', operator: 'equals', value: 'high' }
      ]
    },
    actions: [
      {
        id: '1',
        type: 'send_notification',
        params: { recipient: 'manager', message: 'High priority ticket needs attention' },
        delay: 120
      },
      {
        id: '2',
        type: 'escalate',
        params: {},
        delay: 120
      }
    ]
  },
  {
    id: 'sla-breach-alert',
    name: 'SLA Breach Prevention',
    description: 'Send alerts when tickets are approaching SLA deadline',
    trigger: {
      type: 'sla_breach',
      conditions: []
    },
    actions: [
      {
        id: '1',
        type: 'send_notification',
        params: { recipient: 'assignee', message: 'SLA deadline approaching' }
      },
      {
        id: '2',
        type: 'send_notification',
        params: { recipient: 'manager', message: 'SLA breach detected' }
      }
    ]
  },
  {
    id: 'customer-satisfaction',
    name: 'Customer Satisfaction Survey',
    description: 'Send satisfaction survey after ticket resolution',
    trigger: {
      type: 'ticket_updated',
      conditions: [
        { field: 'status', operator: 'equals', value: 'resolved' }
      ]
    },
    actions: [
      {
        id: '1',
        type: 'send_email',
        params: { 
          template: 'satisfaction_survey',
          delay: 60
        },
        delay: 60
      }
    ]
  }
];

export function WorkflowEditor() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<Partial<Workflow> | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load workflows
  const { data: workflowsData, isLoading } = useQuery({
    queryKey: ['/api/workflows'],
    queryFn: async () => {
      const response = await fetch('/api/workflows');
      return response.json();
    },
  });

  // Create/Update workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (workflow: Partial<Workflow>) => {
      const method = workflow.id ? 'PUT' : 'POST';
      const url = workflow.id ? `/api/workflows/${workflow.id}` : '/api/workflows';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      setShowEditor(false);
      setEditingWorkflow(null);
      toast({
        title: 'Success',
        description: 'Workflow saved successfully',
      });
    },
  });

  // Execute workflow mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: async ({ workflowId, resourceType, resourceId }: {
      workflowId: string;
      resourceType: string;
      resourceId: string;
    }) => {
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, resourceType, resourceId, input: {} }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute workflow');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Workflow executed successfully',
      });
    },
  });

  // Toggle workflow status
  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/workflows/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle workflow');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    },
  });

  const handleCreateFromTemplate = (template: any) => {
    setEditingWorkflow({
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      actions: template.actions,
      isActive: true,
      priority: 1,
    });
    setShowTemplates(false);
    setShowEditor(true);
  };

  const handleSaveWorkflow = () => {
    if (!editingWorkflow?.name || !editingWorkflow?.trigger) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    saveWorkflowMutation.mutate(editingWorkflow as Workflow);
  };

  const handleAddAction = () => {
    if (!editingWorkflow) return;

    const newAction: WorkflowAction = {
      id: Date.now().toString(),
      type: 'assign_agent',
      params: {},
    };

    setEditingWorkflow({
      ...editingWorkflow,
      actions: [...(editingWorkflow.actions || []), newAction],
    });
  };

  const handleUpdateAction = (actionId: string, updates: Partial<WorkflowAction>) => {
    if (!editingWorkflow?.actions) return;

    setEditingWorkflow({
      ...editingWorkflow,
      actions: editingWorkflow.actions.map(action =>
        action.id === actionId ? { ...action, ...updates } : action
      ),
    });
  };

  const handleRemoveAction = (actionId: string) => {
    if (!editingWorkflow?.actions) return;

    setEditingWorkflow({
      ...editingWorkflow,
      actions: editingWorkflow.actions.filter(action => action.id !== actionId),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Workflow Automation</h2>
          <p className="text-muted-foreground">Automate your support processes with intelligent workflows</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-workflow-templates">
                <Copy className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Workflow Templates</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WORKFLOW_TEMPLATES.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          <span className="text-sm">Trigger: {template.trigger.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span className="text-sm">{template.actions.length} action(s)</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-4" 
                        onClick={() => handleCreateFromTemplate(template)}
                        data-testid={`button-use-template-${template.id}`}
                      >
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={() => setShowEditor(true)} data-testid="button-create-workflow">
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Workflows List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflowsData?.workflows?.map((workflow: Workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{workflow.description}</p>
                </div>
                <Badge variant={workflow.isActive ? "default" : "secondary"}>
                  {workflow.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Executions:</span>
                    <p className="font-medium">{workflow.executionCount || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Success Rate:</span>
                    <p className="font-medium">{workflow.successRate || 100}%</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4" />
                  <span>Trigger: {workflow.trigger.type.replace('_', ' ')}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4" />
                  <span>{workflow.actions.length} action(s)</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingWorkflow(workflow);
                      setShowEditor(true);
                    }}
                    data-testid={`button-edit-workflow-${workflow.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleWorkflowMutation.mutate({
                      id: workflow.id,
                      isActive: !workflow.isActive
                    })}
                    data-testid={`button-toggle-workflow-${workflow.id}`}
                  >
                    {workflow.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => executeWorkflowMutation.mutate({
                      workflowId: workflow.id,
                      resourceType: 'ticket',
                      resourceId: 'test'
                    })}
                    data-testid={`button-test-workflow-${workflow.id}`}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkflow?.id ? 'Edit Workflow' : 'Create New Workflow'}
            </DialogTitle>
          </DialogHeader>
          
          {editingWorkflow && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workflow-name">Name</Label>
                  <Input
                    id="workflow-name"
                    value={editingWorkflow.name || ''}
                    onChange={(e) => setEditingWorkflow({
                      ...editingWorkflow,
                      name: e.target.value
                    })}
                    placeholder="Enter workflow name"
                    data-testid="input-workflow-name"
                  />
                </div>
                <div>
                  <Label htmlFor="workflow-priority">Priority</Label>
                  <Input
                    id="workflow-priority"
                    type="number"
                    value={editingWorkflow.priority || 1}
                    onChange={(e) => setEditingWorkflow({
                      ...editingWorkflow,
                      priority: parseInt(e.target.value)
                    })}
                    data-testid="input-workflow-priority"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea
                  id="workflow-description"
                  value={editingWorkflow.description || ''}
                  onChange={(e) => setEditingWorkflow({
                    ...editingWorkflow,
                    description: e.target.value
                  })}
                  placeholder="Describe what this workflow does"
                  data-testid="textarea-workflow-description"
                />
              </div>

              {/* Trigger Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Trigger</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Trigger Type</Label>
                      <Select
                        value={editingWorkflow.trigger?.type || ''}
                        onValueChange={(value) => setEditingWorkflow({
                          ...editingWorkflow,
                          trigger: {
                            type: value as any,
                            conditions: editingWorkflow.trigger?.conditions || []
                          }
                        })}
                      >
                        <SelectTrigger data-testid="select-trigger-type">
                          <SelectValue placeholder="Select trigger type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ticket_created">Ticket Created</SelectItem>
                          <SelectItem value="ticket_updated">Ticket Updated</SelectItem>
                          <SelectItem value="ticket_assigned">Ticket Assigned</SelectItem>
                          <SelectItem value="sla_breach">SLA Breach</SelectItem>
                          <SelectItem value="customer_response">Customer Response</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Actions</CardTitle>
                    <Button size="sm" onClick={handleAddAction} data-testid="button-add-action">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Action
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {editingWorkflow.actions?.map((action, index) => (
                      <Card key={action.id} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Action {index + 1}</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveAction(action.id)}
                            data-testid={`button-remove-action-${action.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Action Type</Label>
                            <Select
                              value={action.type}
                              onValueChange={(value) => handleUpdateAction(action.id, { type: value as any })}
                            >
                              <SelectTrigger data-testid={`select-action-type-${action.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="assign_agent">Assign Agent</SelectItem>
                                <SelectItem value="send_notification">Send Notification</SelectItem>
                                <SelectItem value="update_priority">Update Priority</SelectItem>
                                <SelectItem value="add_tag">Add Tag</SelectItem>
                                <SelectItem value="escalate">Escalate</SelectItem>
                                <SelectItem value="send_email">Send Email</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Delay (minutes)</Label>
                            <Input
                              type="number"
                              value={action.delay || 0}
                              onChange={(e) => handleUpdateAction(action.id, { 
                                delay: parseInt(e.target.value) || 0 
                              })}
                              placeholder="0"
                              data-testid={`input-action-delay-${action.id}`}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditor(false)}
                  data-testid="button-cancel-workflow"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveWorkflow}
                  disabled={saveWorkflowMutation.isPending}
                  data-testid="button-save-workflow"
                >
                  {saveWorkflowMutation.isPending ? 'Saving...' : 'Save Workflow'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}