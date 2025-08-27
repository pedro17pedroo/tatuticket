import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Plus, Settings, Play, Save, Download, Upload, Zap, Mail, Bell, Tag, Users, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  data: {
    label: string;
    config: Record<string, any>;
  };
  position: { x: number; y: number };
}

interface WorkflowConnection {
  id: string;
  sourceId: string;
  targetId: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  isActive: boolean;
}

const TRIGGER_TYPES = [
  { id: 'ticket_created', label: 'Ticket Criado', icon: Plus, color: 'bg-green-500' },
  { id: 'ticket_updated', label: 'Ticket Atualizado', icon: Settings, color: 'bg-blue-500' },
  { id: 'sla_breach', label: 'SLA Violado', icon: AlertCircle, color: 'bg-red-500' },
  { id: 'customer_response', label: 'Resposta Cliente', icon: Mail, color: 'bg-purple-500' },
];

const ACTION_TYPES = [
  { id: 'assign_agent', label: 'Atribuir Agente', icon: Users, color: 'bg-orange-500' },
  { id: 'send_notification', label: 'Enviar Notificação', icon: Bell, color: 'bg-yellow-500' },
  { id: 'update_priority', label: 'Atualizar Prioridade', icon: Zap, color: 'bg-indigo-500' },
  { id: 'add_tag', label: 'Adicionar Tag', icon: Tag, color: 'bg-pink-500' },
  { id: 'send_email', label: 'Enviar Email', icon: Mail, color: 'bg-cyan-500' },
  { id: 'escalate', label: 'Escalar', icon: AlertCircle, color: 'bg-red-600' },
];

export function VisualWorkflowEditor() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Auto-Escalação SLA',
      description: 'Escalação automática quando SLA é violado',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          data: { label: 'SLA Violado', config: { event: 'sla_breach' } },
          position: { x: 100, y: 100 }
        },
        {
          id: 'action-1',
          type: 'action',
          data: { label: 'Escalar Ticket', config: { action: 'escalate', priority: 'high' } },
          position: { x: 300, y: 100 }
        }
      ],
      connections: [{ id: 'conn-1', sourceId: 'trigger-1', targetId: 'action-1' }],
      isActive: true
    }
  ]);
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(workflows[0]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [showNewWorkflowDialog, setShowNewWorkflowDialog] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleNodeDrag = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (!selectedWorkflow) return;
    
    const updatedNodes = selectedWorkflow.nodes.map(node =>
      node.id === nodeId ? { ...node, position } : node
    );
    
    setSelectedWorkflow({ ...selectedWorkflow, nodes: updatedNodes });
  }, [selectedWorkflow]);

  const addNode = useCallback((type: 'trigger' | 'action', nodeType: string) => {
    if (!selectedWorkflow) return;
    
    const nodeConfig = type === 'trigger' 
      ? TRIGGER_TYPES.find(t => t.id === nodeType)
      : ACTION_TYPES.find(a => a.id === nodeType);
    
    if (!nodeConfig) return;
    
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      data: {
        label: nodeConfig.label,
        config: { [type === 'trigger' ? 'event' : 'action']: nodeType }
      },
      position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 }
    };
    
    setSelectedWorkflow({
      ...selectedWorkflow,
      nodes: [...selectedWorkflow.nodes, newNode]
    });
    
    toast({
      title: "Nó Adicionado",
      description: `${nodeConfig.label} foi adicionado ao workflow`,
    });
  }, [selectedWorkflow]);

  const connectNodes = useCallback((sourceId: string, targetId: string) => {
    if (!selectedWorkflow) return;
    
    const newConnection: WorkflowConnection = {
      id: `conn-${Date.now()}`,
      sourceId,
      targetId
    };
    
    setSelectedWorkflow({
      ...selectedWorkflow,
      connections: [...selectedWorkflow.connections, newConnection]
    });
  }, [selectedWorkflow]);

  const saveWorkflow = useCallback(async () => {
    if (!selectedWorkflow) return;
    
    try {
      // API call to save workflow would go here
      toast({
        title: "Workflow Salvo",
        description: "Workflow foi salvo com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar workflow",
        variant: "destructive",
      });
    }
  }, [selectedWorkflow]);

  const testWorkflow = useCallback(async () => {
    if (!selectedWorkflow) return;
    
    setIsPreviewMode(true);
    
    // Simulate workflow execution
    setTimeout(() => {
      setIsPreviewMode(false);
      toast({
        title: "Teste Concluído",
        description: "Workflow executado com sucesso no modo teste",
      });
    }, 2000);
  }, [selectedWorkflow]);

  const createNewWorkflow = useCallback(() => {
    if (!newWorkflowName.trim()) return;
    
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: newWorkflowName,
      description: '',
      nodes: [],
      connections: [],
      isActive: false
    };
    
    setWorkflows([...workflows, newWorkflow]);
    setSelectedWorkflow(newWorkflow);
    setNewWorkflowName('');
    setShowNewWorkflowDialog(false);
    
    toast({
      title: "Workflow Criado",
      description: `Novo workflow "${newWorkflowName}" criado`,
    });
  }, [newWorkflowName, workflows]);

  const NodeComponent = ({ node }: { node: WorkflowNode }) => {
    const nodeConfig = node.type === 'trigger' 
      ? TRIGGER_TYPES.find(t => t.id === node.data.config.event || node.data.config.action)
      : ACTION_TYPES.find(a => a.id === node.data.config.action || node.data.config.event);
    
    const Icon = nodeConfig?.icon || Settings;
    const colorClass = nodeConfig?.color || 'bg-gray-500';
    
    return (
      <Card 
        className={`w-48 cursor-move border-2 ${selectedNode?.id === node.id ? 'border-blue-500' : 'border-gray-200'} ${isPreviewMode ? 'animate-pulse' : ''}`}
        onClick={() => setSelectedNode(node)}
        data-testid={`workflow-node-${node.id}`}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${colorClass} text-white`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-medium text-sm">{node.data.label}</div>
              <Badge variant="outline" className="text-xs">
                {node.type}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50" data-testid="visual-workflow-editor">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Editor Visual de Workflows</h1>
            <Select 
              value={selectedWorkflow?.id || ''} 
              onValueChange={(value) => {
                const workflow = workflows.find(w => w.id === value);
                setSelectedWorkflow(workflow || null);
              }}
              data-testid="workflow-selector"
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar workflow" />
              </SelectTrigger>
              <SelectContent>
                {workflows.map(workflow => (
                  <SelectItem key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={showNewWorkflowDialog} onOpenChange={setShowNewWorkflowDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-new-workflow">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Workflow</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workflowName">Nome do Workflow</Label>
                    <Input
                      id="workflowName"
                      value={newWorkflowName}
                      onChange={(e) => setNewWorkflowName(e.target.value)}
                      placeholder="Digite o nome do workflow"
                      data-testid="input-workflow-name"
                    />
                  </div>
                  <Button onClick={createNewWorkflow} data-testid="button-create-workflow">
                    Criar Workflow
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button onClick={testWorkflow} variant="outline" disabled={isPreviewMode} data-testid="button-test-workflow">
              <Play className="w-4 h-4 mr-2" />
              {isPreviewMode ? 'Testando...' : 'Testar'}
            </Button>
            
            <Button onClick={saveWorkflow} data-testid="button-save-workflow">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar com componentes */}
        <div className="w-64 bg-white border-r p-4 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Triggers</h3>
              <div className="space-y-2">
                {TRIGGER_TYPES.map(trigger => {
                  const Icon = trigger.icon;
                  return (
                    <Button
                      key={trigger.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => addNode('trigger', trigger.id)}
                      data-testid={`button-trigger-${trigger.id}`}
                    >
                      <div className={`p-1 rounded-full ${trigger.color} text-white mr-2`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      {trigger.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-3">Ações</h3>
              <div className="space-y-2">
                {ACTION_TYPES.map(action => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => addNode('action', action.id)}
                      data-testid={`button-action-${action.id}`}
                    >
                      <div className={`p-1 rounded-full ${action.color} text-white mr-2`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas principal */}
        <div className="flex-1 relative overflow-auto">
          <div 
            ref={canvasRef}
            className="absolute inset-0 bg-gray-100 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
            data-testid="workflow-canvas"
          >
            {selectedWorkflow && (
              <div className="relative w-full h-full min-h-[600px]">
                {/* Render nodes */}
                {selectedWorkflow.nodes.map(node => (
                  <div
                    key={node.id}
                    style={{
                      position: 'absolute',
                      left: node.position.x,
                      top: node.position.y,
                    }}
                    draggable
                    onDragEnd={(e) => {
                      const rect = canvasRef.current?.getBoundingClientRect();
                      if (rect) {
                        handleNodeDrag(node.id, {
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top
                        });
                      }
                    }}
                  >
                    <NodeComponent node={node} />
                  </div>
                ))}
                
                {/* Render connections */}
                <svg className="absolute inset-0 pointer-events-none">
                  {selectedWorkflow.connections.map(connection => {
                    const sourceNode = selectedWorkflow.nodes.find(n => n.id === connection.sourceId);
                    const targetNode = selectedWorkflow.nodes.find(n => n.id === connection.targetId);
                    
                    if (!sourceNode || !targetNode) return null;
                    
                    return (
                      <line
                        key={connection.id}
                        x1={sourceNode.position.x + 96} // Half of node width
                        y1={sourceNode.position.y + 40} // Approximate node height
                        x2={targetNode.position.x + 96}
                        y2={targetNode.position.y + 40}
                        stroke="#3b82f6"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  })}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#3b82f6"
                      />
                    </marker>
                  </defs>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Properties panel */}
        {selectedNode && (
          <div className="w-72 bg-white border-l p-4 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="font-medium">Propriedades do Nó</h3>
              
              <div>
                <Label>Nome</Label>
                <Input 
                  value={selectedNode.data.label} 
                  onChange={(e) => {
                    const updatedNode = { ...selectedNode, data: { ...selectedNode.data, label: e.target.value } };
                    setSelectedNode(updatedNode);
                  }}
                  data-testid="input-node-label"
                />
              </div>
              
              <div>
                <Label>Tipo</Label>
                <Input value={selectedNode.type} disabled />
              </div>
              
              <div>
                <Label>Configuração</Label>
                <Textarea 
                  value={JSON.stringify(selectedNode.data.config, null, 2)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value);
                      const updatedNode = { ...selectedNode, data: { ...selectedNode.data, config } };
                      setSelectedNode(updatedNode);
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="font-mono text-sm"
                  rows={6}
                  data-testid="textarea-node-config"
                />
              </div>
              
              <Button 
                onClick={() => {
                  if (!selectedWorkflow) return;
                  const updatedNodes = selectedWorkflow.nodes.map(node =>
                    node.id === selectedNode.id ? selectedNode : node
                  );
                  setSelectedWorkflow({ ...selectedWorkflow, nodes: updatedNodes });
                  toast({
                    title: "Nó Atualizado",
                    description: "Propriedades do nó foram atualizadas",
                  });
                }}
                className="w-full"
                data-testid="button-update-node"
              >
                Atualizar Nó
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}