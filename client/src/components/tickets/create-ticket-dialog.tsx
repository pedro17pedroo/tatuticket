import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import type { InsertTicket } from "@shared/schema";

interface CreateTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ticketCategories = [
  { value: "bug", label: "Bug/Problema" },
  { value: "feature", label: "Nova Funcionalidade" },
  { value: "support", label: "Suporte" },
  { value: "question", label: "Dúvida" },
  { value: "other", label: "Outro" }
];

const ticketPriorities = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Crítica" }
];

export function CreateTicketDialog({ isOpen, onClose }: CreateTicketDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const { toast } = useToast();
  
  const user = authService.getCurrentUser();
  const tenantId = authService.getTenantId();

  const [ticketForm, setTicketForm] = useState<Partial<InsertTicket>>({
    subject: "",
    description: "",
    priority: "medium",
    category: "",
    tenantId: tenantId || undefined,
    customerId: user?.id || undefined,
    status: "open"
  });

  // AI Analysis mutation
  const aiAnalysisMutation = useMutation({
    mutationFn: async (data: { subject: string; description: string }) => {
      const response = await apiRequest("POST", "/api/ai/analyze-ticket", data);
      return response.json();
    },
    onSuccess: (analysis) => {
      setAiSuggestions(analysis);
      // Apply AI suggestions
      setTicketForm(prev => ({
        ...prev,
        category: analysis.category || prev.category,
        priority: analysis.priority || prev.priority
      }));
      toast({
        title: "IA analisou seu ticket!",
        description: `Categoria sugerida: ${analysis.category}, Prioridade: ${analysis.priority}`,
      });
    },
    onError: () => {
      toast({
        title: "Análise IA não disponível",
        description: "Procedendo sem análise automática.",
        variant: "destructive"
      });
    }
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: Partial<InsertTicket>) => {
      const response = await apiRequest("POST", "/api/tickets/enhanced", ticketData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket criado com sucesso!",
        description: `Ticket ${data.ticket.ticketNumber} foi criado e será processado em breve.`,
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar ticket",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setTicketForm({
      subject: "",
      description: "",
      priority: "medium",
      category: "",
      tenantId: tenantId || undefined,
      customerId: user?.id || undefined,
      status: "open"
    });
    setAiSuggestions(null);
    onClose();
  };

  const handleAnalyzeWithAI = async () => {
    if (!ticketForm.subject || !ticketForm.description) {
      toast({
        title: "Informações incompletas",
        description: "Preencha o assunto e descrição para análise IA.",
        variant: "destructive"
      });
      return;
    }

    setAiAnalysisLoading(true);
    try {
      await aiAnalysisMutation.mutateAsync({
        subject: ticketForm.subject,
        description: ticketForm.description
      });
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketForm.subject || !ticketForm.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o assunto e descrição do ticket.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await createTicketMutation.mutateAsync(ticketForm);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <i className="fas fa-plus mr-2 text-primary"></i>
            Criar Novo Ticket
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject */}
          <div>
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              placeholder="Descreva brevemente o problema ou solicitação..."
              value={ticketForm.subject}
              onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
              required
              data-testid="input-ticket-subject"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Descrição Detalhada *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o problema em detalhes, incluindo passos para reproduzir, comportamento esperado, etc..."
              value={ticketForm.description}
              onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
              required
              data-testid="textarea-ticket-description"
            />
            <div className="flex justify-end mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAnalyzeWithAI}
                disabled={aiAnalysisLoading || !ticketForm.subject || !ticketForm.description}
                data-testid="button-ai-analyze"
              >
                {aiAnalysisLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Analisando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-robot mr-2"></i>
                    Analisar com IA
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* AI Suggestions */}
          {aiSuggestions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <i className="fas fa-lightbulb text-blue-600 mr-2"></i>
                <span className="font-semibold text-blue-800">Sugestões da IA:</span>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Categoria:</strong> {aiSuggestions.category}</p>
                <p><strong>Prioridade:</strong> {aiSuggestions.priority}</p>
                <p><strong>Departamento Recomendado:</strong> {aiSuggestions.recommended_department}</p>
                {aiSuggestions.summary && (
                  <p><strong>Resumo:</strong> {aiSuggestions.summary}</p>
                )}
              </div>
            </div>
          )}

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={ticketForm.category || ""} 
                onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger data-testid="select-ticket-category">
                  <SelectValue placeholder="Selecione a categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {ticketCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select 
                value={ticketForm.priority || "medium"} 
                onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger data-testid="select-ticket-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ticketPriorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Info Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="fas fa-user mr-2 text-gray-600"></i>
              <span className="font-medium text-gray-700">
                Criado por: {user?.username} ({user?.email})
              </span>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
              data-testid="button-cancel-ticket"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1"
              data-testid="button-submit-ticket"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Criando Ticket...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
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