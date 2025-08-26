import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface CreateTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreateTicketForm {
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  customerId?: string;
  departmentId?: string;
}

export function CreateTicketDialog({ isOpen, onClose }: CreateTicketDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenantId = authService.getTenantId();

  const [formData, setFormData] = useState<CreateTicketForm>({
    subject: "",
    description: "",
    priority: "medium",
    category: "",
    customerId: "",
    departmentId: "",
  });

  // Fetch customers and departments for dropdowns
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers', tenantId],
    enabled: !!tenantId && isOpen,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments', tenantId],
    enabled: !!tenantId && isOpen,
  });

  const createTicketMutation = useMutation({
    mutationFn: (ticketData: any) => 
      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Ticket criado com sucesso!",
        description: "O ticket foi criado e está aguardando atribuição.",
      });
      
      // Invalidate and refetch tickets
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/ticket-stats'] });
      
      // Reset form and close
      setFormData({
        subject: "",
        description: "",
        priority: "medium",
        category: "",
        customerId: "",
        departmentId: "",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar ticket",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      toast({
        title: "Erro de validação",
        description: "O assunto do ticket é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const ticketData = {
      ...formData,
      tenantId,
      customerId: formData.customerId || undefined,
      departmentId: formData.departmentId || undefined,
    };

    createTicketMutation.mutate(ticketData);
  };

  const updateField = <K extends keyof CreateTicketForm>(
    field: K,
    value: CreateTicketForm[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800", 
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800"
  };

  const priorityLabels = {
    low: "Baixa",
    medium: "Média",
    high: "Alta", 
    critical: "Crítica"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject */}
          <div>
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => updateField('subject', e.target.value)}
              placeholder="Descreva brevemente o problema"
              required
              data-testid="input-ticket-subject"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Descreva detalhadamente o problema ou solicitação"
              rows={4}
              data-testid="textarea-ticket-description"
            />
          </div>

          {/* Priority and Category Row */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: any) => updateField('priority', value)}
              >
                <SelectTrigger data-testid="select-ticket-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${priorityColors[value as keyof typeof priorityColors]}`}></div>
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => updateField('category', value)}
              >
                <SelectTrigger data-testid="select-ticket-category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Técnico</SelectItem>
                  <SelectItem value="billing">Financeiro</SelectItem>
                  <SelectItem value="support">Suporte</SelectItem>
                  <SelectItem value="feature">Nova Funcionalidade</SelectItem>
                  <SelectItem value="bug">Bug/Erro</SelectItem>
                  <SelectItem value="training">Treinamento</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer and Department Row */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Cliente (Opcional)</Label>
              <Select 
                value={formData.customerId} 
                onValueChange={(value) => updateField('customerId', value)}
              >
                <SelectTrigger data-testid="select-ticket-customer">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="department">Departamento (Opcional)</Label>
              <Select 
                value={formData.departmentId} 
                onValueChange={(value) => updateField('departmentId', value)}
              >
                <SelectTrigger data-testid="select-ticket-department">
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((department: any) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority Preview */}
          {formData.priority && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Visualização da Prioridade:</h4>
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[formData.priority]}`}>
                  {priorityLabels[formData.priority]}
                </span>
                <span className="text-sm text-gray-600 ml-3">
                  {formData.priority === 'critical' && "Requer atenção imediata"}
                  {formData.priority === 'high' && "Deve ser resolvido rapidamente"}
                  {formData.priority === 'medium' && "Prioridade normal"}
                  {formData.priority === 'low' && "Pode aguardar na fila"}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={createTicketMutation.isPending}
              data-testid="button-cancel-ticket"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createTicketMutation.isPending || !formData.subject.trim()}
              data-testid="button-create-ticket"
            >
              {createTicketMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Criando...
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i>
                  Criar Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}