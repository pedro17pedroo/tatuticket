import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Play,
  Save,
  Trash2,
  Settings,
  Zap,
  Users,
  Mail,
  AlertTriangle,
  Clock,
  Tag,
  ArrowUp,
  Webhook,
  GitBranch,
  Move
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Position {
  x: number;
  y: number;
}

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action';
  subtype: string;
  position: Position;
  params: Record<string, any>;
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

interface WorkflowConnection {
  from: string;
  to: string;
}

interface VisualWorkflow {
  id?: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  isActive: boolean;
  priority: number;
}

const TRIGGER_TYPES = [
  { value: 'ticket_created', label: 'Ticket Criado', icon: Plus, color: 'bg-green-100 border-green-300' },
  { value: 'ticket_updated', label: 'Ticket Atualizado', icon: Settings, color: 'bg-blue-100 border-blue-300' },
  { value: 'ticket_assigned', label: 'Ticket Atribuído', icon: Users, color: 'bg-purple-100 border-purple-300' },
  { value: 'sla_breach', label: 'Violação SLA', icon: AlertTriangle, color: 'bg-red-100 border-red-300' },
  { value: 'customer_response', label: 'Resposta Cliente', icon: Mail, color: 'bg-yellow-100 border-yellow-300' }
];

const ACTION_TYPES = [
  { value: 'assign_agent', label: 'Atribuir Agente', icon: Users, color: 'bg-indigo-100 border-indigo-300' },
  { value: 'send_notification', label: 'Enviar Notificação', icon: Mail, color: 'bg-orange-100 border-orange-300' },
  { value: 'update_priority', label: 'Atualizar Prioridade', icon: ArrowUp, color: 'bg-red-100 border-red-300' },
  { value: 'add_tag', label: 'Adicionar Tag', icon: Tag, color: 'bg-teal-100 border-teal-300' },
  { value: 'escalate', label: 'Escalar', icon: AlertTriangle, color: 'bg-pink-100 border-pink-300' },
  { value: 'send_email', label: 'Enviar Email', icon: Mail, color: 'bg-cyan-100 border-cyan-300' },
  { value: 'webhook_call', label: 'Chamar Webhook', icon: Webhook, color: 'bg-slate-100 border-slate-300' },
  { value: 'create_task', label: 'Criar Tarefa', icon: Plus, color: 'bg-emerald-100 border-emerald-300' }
];

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

interface VisualWorkflowEditorProps {
  workflow?: VisualWorkflow;
  onSave?: (workflow: VisualWorkflow) => void;
  onCancel?: () => void;
}

export function VisualWorkflowEditor({ workflow, onSave, onCancel }: VisualWorkflowEditorProps) {
  const [currentWorkflow, setCurrentWorkflow] = useState<VisualWorkflow>(
    workflow || {
      name: '',
      description: '',
      nodes: [],
      connections: [],
      isActive: true,
      priority: 5
    }
  );
  
  const [draggedItem, setDraggedItem] = useState<{ type: 'trigger' | 'action'; subtype: string } | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const getNodeIcon = (node: WorkflowNode) => {
    const allTypes = [...TRIGGER_TYPES, ...ACTION_TYPES];
    const typeInfo = allTypes.find(t => t.value === node.subtype);
    return typeInfo?.icon || Zap;
  };

  const getNodeColor = (node: WorkflowNode) => {
    const allTypes = [...TRIGGER_TYPES, ...ACTION_TYPES];
    const typeInfo = allTypes.find(t => t.value === node.subtype);
    return typeInfo?.color || 'bg-gray-100 border-gray-300';
  };

  const getNodeLabel = (node: WorkflowNode) => {
    const allTypes = [...TRIGGER_TYPES, ...ACTION_TYPES];
    const typeInfo = allTypes.find(t => t.value === node.subtype);
    return typeInfo?.label || node.subtype;
  };

  const handleDragStart = (e: React.DragEvent, type: 'trigger' | 'action', subtype: string) => {
    setDraggedItem({ type, subtype });
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedItem || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Verificar se já existe um trigger
    if (draggedItem.type === 'trigger' && currentWorkflow.nodes.some(n => n.type === 'trigger')) {
      toast({
        title: 'Erro',
        description: 'Só pode haver um trigger por workflow',
        variant: 'destructive'
      });
      return;
    }

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: draggedItem.type,
      subtype: draggedItem.subtype,
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      params: {},
      conditions: draggedItem.type === 'trigger' ? [] : undefined
    };

    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));

    setDraggedItem(null);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleNodeClick = (node: WorkflowNode) => {
    setSelectedNode(node);
    setShowNodeConfig(true);
  };

  const handleNodeDelete = (nodeId: string) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      connections: prev.connections.filter(c => c.from !== nodeId && c.to !== nodeId)
    }));
  };

  const handleNodeUpdate = (updatedNode: WorkflowNode) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
    }));
    setShowNodeConfig(false);
    setSelectedNode(null);
  };

  const connectNodes = (fromId: string, toId: string) => {
    const connectionExists = currentWorkflow.connections.some(
      c => c.from === fromId && c.to === toId
    );
    
    if (!connectionExists) {
      setCurrentWorkflow(prev => ({
        ...prev,
        connections: [...prev.connections, { from: fromId, to: toId }]
      }));
    }
  };

  const getSVGPath = (from: Position, to: Position) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const controlPoint1X = from.x + dx * 0.5;
    const controlPoint2X = to.x - dx * 0.5;
    
    return `M ${from.x} ${from.y} C ${controlPoint1X} ${from.y} ${controlPoint2X} ${to.y} ${to.x} ${to.y}`;
  };

  const renderConnections = () => {
    return currentWorkflow.connections.map((connection, index) => {
      const fromNode = currentWorkflow.nodes.find(n => n.id === connection.from);
      const toNode = currentWorkflow.nodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return null;

      const fromPos = {
        x: fromNode.position.x + NODE_WIDTH / 2,
        y: fromNode.position.y + NODE_HEIGHT
      };
      const toPos = {
        x: toNode.position.x + NODE_WIDTH / 2,
        y: toNode.position.y
      };

      return (
        <path
          key={index}
          d={getSVGPath(fromPos, toPos)}
          stroke="#6366f1"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
          className="cursor-pointer hover:stroke-indigo-700"
        />
      );
    });
  };

  const handleSave = () => {
    if (!currentWorkflow.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do workflow é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (currentWorkflow.nodes.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um trigger ao workflow',
        variant: 'destructive'
      });
      return;
    }

    const triggerNode = currentWorkflow.nodes.find(n => n.type === 'trigger');
    if (!triggerNode) {
      toast({
        title: 'Erro',
        description: 'O workflow deve ter um trigger',
        variant: 'destructive'
      });
      return;
    }

    onSave?.(currentWorkflow);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editor Visual de Workflows</h2>
            <p className="text-gray-600">Arraste e solte elementos para criar seu workflow</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-2" />
              Salvar Workflow
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Nome do Workflow</Label>
            <Input
              placeholder="Nome do workflow"
              value={currentWorkflow.name}
              onChange={(e) => setCurrentWorkflow(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input
              placeholder="Descrição do workflow"
              value={currentWorkflow.description}
              onChange={(e) => setCurrentWorkflow(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <Switch
              checked={currentWorkflow.isActive}
              onCheckedChange={(checked) => setCurrentWorkflow(prev => ({ ...prev, isActive: checked }))}
            />
            <Label>Workflow Ativo</Label>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar com elementos */}
        <div className="w-64 border-r bg-gray-50 p-4">
          <div className="space-y-6">
            {/* Triggers */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Triggers</h3>
              <div className="space-y-2">
                {TRIGGER_TYPES.map((trigger) => {
                  const Icon = trigger.icon;
                  return (
                    <div
                      key={trigger.value}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'trigger', trigger.value)}
                      className={`p-3 rounded-lg border cursor-move hover:shadow-md transition-shadow ${trigger.color}`}
                      data-testid={`trigger-${trigger.value}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{trigger.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Ações</h3>
              <div className="space-y-2">
                {ACTION_TYPES.map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.value}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'action', action.value)}
                      className={`p-3 rounded-lg border cursor-move hover:shadow-md transition-shadow ${action.color}`}
                      data-testid={`action-${action.value}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{action.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-auto bg-gray-100">
          <div
            ref={canvasRef}
            className="relative min-h-full"
            style={{ width: canvasSize.width, height: canvasSize.height }}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            data-testid="workflow-canvas"
          >
            {/* SVG para conexões */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={canvasSize.width}
              height={canvasSize.height}
            >
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
                    fill="#6366f1"
                  />
                </marker>
              </defs>
              {renderConnections()}
            </svg>

            {/* Nodes */}
            {currentWorkflow.nodes.map((node) => {
              const Icon = getNodeIcon(node);
              return (
                <div
                  key={node.id}
                  className={`absolute p-3 rounded-lg border cursor-pointer hover:shadow-lg transition-shadow ${getNodeColor(node)}`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT
                  }}
                  onClick={() => handleNodeClick(node)}
                  data-testid={`node-${node.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <Badge variant={node.type === 'trigger' ? 'default' : 'secondary'}>
                        {node.type === 'trigger' ? 'Trigger' : 'Ação'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNodeDelete(node.id);
                      }}
                      data-testid={`delete-node-${node.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-sm font-medium truncate">
                    {getNodeLabel(node)}
                  </div>
                </div>
              );
            })}

            {/* Placeholder quando vazio */}
            {currentWorkflow.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Canvas Vazio</p>
                  <p className="text-sm">Arraste elementos da barra lateral para começar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de configuração do node */}
      <NodeConfigDialog
        node={selectedNode}
        open={showNodeConfig}
        onOpenChange={setShowNodeConfig}
        onSave={handleNodeUpdate}
      />
    </div>
  );
}

// Componente para configurar nodes
interface NodeConfigDialogProps {
  node: WorkflowNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (node: WorkflowNode) => void;
}

function NodeConfigDialog({ node, open, onOpenChange, onSave }: NodeConfigDialogProps) {
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);

  useEffect(() => {
    if (node) {
      setEditingNode({ ...node });
    }
  }, [node]);

  if (!editingNode) return null;

  const handleSave = () => {
    onSave(editingNode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="node-config-dialog">
        <DialogHeader>
          <DialogTitle>
            Configurar {editingNode.type === 'trigger' ? 'Trigger' : 'Ação'}: {getNodeLabel(editingNode)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {editingNode.type === 'trigger' && (
            <div>
              <Label>Condições do Trigger</Label>
              <p className="text-sm text-gray-600 mb-3">
                Defina quando este trigger deve ser executado
              </p>
              {/* Aqui seria a interface para configurar condições */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600">
                  Interface de condições será implementada baseada no tipo: {editingNode.subtype}
                </p>
              </div>
            </div>
          )}

          {editingNode.type === 'action' && (
            <div>
              <Label>Parâmetros da Ação</Label>
              <p className="text-sm text-gray-600 mb-3">
                Configure os parâmetros para esta ação
              </p>
              {/* Aqui seria a interface para configurar parâmetros */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600">
                  Interface de parâmetros será implementada baseada no tipo: {editingNode.subtype}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} data-testid="save-node-config">
              Salvar Configuração
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getNodeLabel(node: WorkflowNode) {
  const allTypes = [...TRIGGER_TYPES, ...ACTION_TYPES];
  const typeInfo = allTypes.find(t => t.value === node.subtype);
  return typeInfo?.label || node.subtype;
}