import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User, MessageCircle, ArrowLeft } from "lucide-react";
import { authService } from "@/lib/auth";
import type { Ticket } from "@shared/schema";

interface TicketDetailsViewProps {
  ticketId: string;
  onBack: () => void;
}

interface TicketMessage {
  id: string;
  content: string;
  isFromCustomer: boolean;
  authorName: string;
  createdAt: string;
}

export function TicketDetailsView({ ticketId, onBack }: TicketDetailsViewProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const user = authService.getCurrentUser();

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ['/api/tickets', ticketId],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (!response.ok) throw new Error('Ticket não encontrado');
      return response.json();
    },
  });

  // Mock messages for now - in real implementation, this would come from API
  const messages: TicketMessage[] = [
    {
      id: "1",
      content: ticket?.description || "Descrição do ticket",
      isFromCustomer: true,
      authorName: user?.username || "Você",
      createdAt: ticket?.createdAt ? (typeof ticket.createdAt === 'string' ? ticket.createdAt : new Date(ticket.createdAt).toISOString()) : new Date().toISOString()
    },
    {
      id: "2", 
      content: "Obrigado pelo contato. Estamos analisando sua solicitação e retornaremos em breve com uma solução.",
      isFromCustomer: false,
      authorName: "Maria Santos - Suporte",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      resolved: { label: "Resolvido", variant: "outline" },
      "in_progress": { label: "Em Andamento", variant: "default" },
      open: { label: "Aberto", variant: "destructive" },
      closed: { label: "Fechado", variant: "secondary" },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "default" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      critical: { label: "Crítica", variant: "destructive" },
      high: { label: "Alta", variant: "default" },
      medium: { label: "Média", variant: "secondary" },
      low: { label: "Baixa", variant: "outline" },
    };
    
    const priorityInfo = priorityMap[priority] || { label: priority, variant: "secondary" };
    return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>;
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSubmittingMessage(true);
    try {
      // In real implementation, this would post to messages API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setNewMessage("");
      // Reload ticket data to show new message
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Ticket não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} data-testid="button-back-to-tickets">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Tickets
        </Button>
      </div>

      {/* Ticket Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>{ticket.ticketNumber}</span>
              <span className="text-gray-500">-</span>
              <span>{ticket.subject}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Criado em:</span>
              <span className="font-medium">{new Date(ticket.createdAt!).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Categoria:</span>
              <span className="font-medium">{ticket.category || 'Geral'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Tempo gasto:</span>
              <span className="font-medium">{ticket.timeSpent || '0'}h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages/Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Histórico de Conversas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isFromCustomer ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl ${message.isFromCustomer ? 'order-2' : 'order-1'}`}>
                  <div className={`rounded-lg p-4 ${
                    message.isFromCustomer 
                      ? 'bg-primary text-primary-foreground ml-12' 
                      : 'bg-gray-100 text-gray-900 mr-12'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <div className={`flex items-center space-x-2 mt-2 text-xs text-gray-500 ${
                    message.isFromCustomer ? 'justify-end' : 'justify-start'
                  }`}>
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-xs">{message.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{message.authorName}</span>
                    <span>•</span>
                    <span>{new Date(message.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* New Message Form */}
          {ticket.status !== 'closed' && (
            <form onSubmit={handleSubmitMessage} className="space-y-4">
              <Textarea
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-20"
                data-testid="textarea-new-message"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Sua mensagem será enviada para a equipe de suporte
                </p>
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || isSubmittingMessage}
                  data-testid="button-send-message"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {isSubmittingMessage ? 'Enviando...' : 'Enviar Mensagem'}
                </Button>
              </div>
            </form>
          )}
          
          {ticket.status === 'closed' && (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-600">Este ticket foi fechado. Para novas questões, crie um novo ticket.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}