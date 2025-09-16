import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Phone,
  Video,
  Star,
  Users,
  Clock,
  CheckCheck,
  AlertCircle,
  Bot,
  User,
  FileText,
  Image as ImageIcon,
  Download,
  Plus,
  Minimize2,
  Maximize2,
  X
} from "lucide-react";

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderType: "customer" | "agent" | "system" | "ai";
  content: string;
  type: "text" | "file" | "image" | "system" | "escalation";
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
  isRead: boolean;
  reactions?: { emoji: string; count: number; users: string[] }[];
}

interface Conversation {
  id: string;
  customerId: string;
  channel: "support" | "technical" | "commercial" | "billing";
  subject?: string;
  status: "active" | "waiting" | "resolved" | "escalated";
  assignedAgentId?: string;
  assignedAgentName?: string;
  priority: "low" | "normal" | "high" | "urgent";
  startedAt: string;
  lastActivity: string;
  satisfaction?: {
    rating: number;
    comment?: string;
  };
}

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "busy" | "away" | "offline";
  department: string;
  rating: number;
  specialties: string[];
  currentConversations: number;
  maxConversations: number;
}

interface ChatSystemProps {
  isMinimized?: boolean;
  onToggleMinimized?: () => void;
  onClose?: () => void;
}

export function InteractiveChatSystem({ 
  isMinimized = false, 
  onToggleMinimized, 
  onClose 
}: ChatSystemProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<"support" | "technical" | "commercial" | "billing">("support");
  const [isStartChatDialogOpen, setIsStartChatDialogOpen] = useState(false);
  const [chatSubject, setChatSubject] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const customerId = authService.getUserId();

  // Mock data for demonstration
  const mockConversations: Conversation[] = [
    {
      id: "conv-1",
      customerId: "customer-1",
      channel: "support",
      subject: "Problema com login",
      status: "active",
      assignedAgentId: "agent-1",
      assignedAgentName: "Maria Santos",
      priority: "normal",
      startedAt: "2024-01-16T09:00:00",
      lastActivity: "2024-01-16T14:30:00"
    },
    {
      id: "conv-2",
      customerId: "customer-1", 
      channel: "technical",
      subject: "Integração com API",
      status: "waiting",
      assignedAgentId: "agent-2",
      assignedAgentName: "João Silva",
      priority: "high",
      startedAt: "2024-01-16T10:15:00",
      lastActivity: "2024-01-16T13:45:00"
    }
  ];

  const mockMessages: ChatMessage[] = [
    {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "customer-1",
      senderName: "Cliente",
      senderType: "customer",
      content: "Olá, estou com problema para fazer login no sistema",
      type: "text",
      timestamp: "2024-01-16T09:00:00",
      isRead: true
    },
    {
      id: "msg-2",
      conversationId: "conv-1",
      senderId: "agent-1",
      senderName: "Maria Santos",
      senderType: "agent",
      content: "Olá! Vou ajudar você com esse problema. Pode me dizer qual mensagem de erro está aparecendo?",
      type: "text",
      timestamp: "2024-01-16T09:02:00",
      isRead: true
    },
    {
      id: "msg-3",
      conversationId: "conv-1",
      senderId: "customer-1",
      senderName: "Cliente",
      senderType: "customer",
      content: "Aparece 'Credenciais inválidas' mesmo eu tendo certeza que a senha está correta.",
      type: "text",
      timestamp: "2024-01-16T09:03:00",
      isRead: true
    },
    {
      id: "msg-4",
      conversationId: "conv-1",
      senderId: "system",
      senderName: "Sistema",
      senderType: "system",
      content: "Conversa escalada para o departamento técnico devido à complexidade do problema.",
      type: "escalation",
      timestamp: "2024-01-16T14:30:00",
      isRead: false
    }
  ];

  const mockAgents: Agent[] = [
    {
      id: "agent-1",
      name: "Maria Santos",
      status: "online",
      department: "Suporte Geral",
      rating: 4.8,
      specialties: ["Login", "Configuração", "Primeiro Acesso"],
      currentConversations: 3,
      maxConversations: 5
    },
    {
      id: "agent-2", 
      name: "João Silva",
      status: "busy",
      department: "Técnico",
      rating: 4.9,
      specialties: ["API", "Integrações", "Desenvolvimento"],
      currentConversations: 4,
      maxConversations: 4
    },
    {
      id: "agent-3",
      name: "Ana Costa",
      status: "online",
      department: "Comercial",
      rating: 4.7,
      specialties: ["Vendas", "Planos", "Negociação"],
      currentConversations: 2,
      maxConversations: 6
    }
  ];

  // Fetch conversations
  const { data: conversations = mockConversations, isLoading: loadingConversations } = useQuery({
    queryKey: ['/api/chat/conversations', customerId],
    enabled: !!customerId,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/chat/messages', selectedConversationId],
    enabled: !!selectedConversationId,
  });

  // Fetch available agents
  const { data: agents = mockAgents } = useQuery({
    queryKey: ['/api/chat/agents'],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { 
      conversationId: string; 
      content: string; 
      type: "text" | "file" | "image" 
    }) => {
      return apiRequest('/api/chat/send-message', {
        method: 'POST',
        body: messageData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', customerId] });
      setNewMessage("");
    },
    onError: () => {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Start new conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async (data: { 
      channel: string; 
      subject: string; 
      priority: string 
    }) => {
      return apiRequest('/api/chat/start-conversation', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', customerId] });
      setSelectedConversationId(newConversation.id);
      setIsStartChatDialogOpen(false);
      setChatSubject("");
      toast({
        title: "Chat iniciado!",
        description: "Sua conversa foi iniciada. Em breve um agente irá atendê-lo."
      });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock filter messages for selected conversation
  const conversationMessages = selectedConversationId 
    ? mockMessages.filter(msg => msg.conversationId === selectedConversationId)
    : [];

  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    
    // For demo, just add message to mock data
    toast({
      title: "Mensagem enviada!",
      description: "Sua mensagem foi enviada com sucesso."
    });
    
    setNewMessage("");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversationId) return;

    setUploadingFile(true);
    // Simulate file upload
    setTimeout(() => {
      toast({
        title: "Arquivo enviado!",
        description: `${file.name} foi enviado com sucesso.`
      });
      setUploadingFile(false);
    }, 2000);
  };

  const handleStartNewChat = () => {
    setIsStartChatDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      online: "text-green-500",
      busy: "text-yellow-500", 
      away: "text-orange-500",
      offline: "text-gray-400"
    };
    return colors[status as keyof typeof colors] || "text-gray-400";
  };

  const getChannelLabel = (channel: string) => {
    const labels = {
      support: "Suporte Geral",
      technical: "Suporte Técnico", 
      commercial: "Comercial",
      billing: "Financeiro"
    };
    return labels[channel as keyof typeof labels] || channel;
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggleMinimized}
          className="rounded-full w-14 h-14 bg-primary hover:bg-blue-700 shadow-lg"
          data-testid="button-expand-chat"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-5 h-5" />
          <div>
            <h3 className="font-medium">Chat de Suporte</h3>
            {selectedConversation && (
              <p className="text-sm text-blue-100">
                {getChannelLabel(selectedConversation.channel)} - {selectedConversation.assignedAgentName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimized}
            className="text-white hover:bg-blue-600 p-2"
            data-testid="button-minimize-chat"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-blue-600 p-2"
            data-testid="button-close-chat"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {!selectedConversationId ? (
          <div className="flex-1 flex flex-col">
            {/* No conversation selected - Show conversation list */}
            <div className="p-4 border-b border-gray-200">
              <Button 
                onClick={handleStartNewChat} 
                className="w-full"
                data-testid="button-start-new-chat"
              >
                <Plus className="w-4 h-4 mr-2" />
                Iniciar Nova Conversa
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma conversa ativa
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Inicie uma conversa para receber suporte personalizado.
                  </p>
                  <Button onClick={handleStartNewChat} data-testid="button-start-first-chat">
                    Começar Agora
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer border transition-colors"
                      data-testid={`conversation-${conversation.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{conversation.subject}</h4>
                        <Badge 
                          variant={conversation.status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {conversation.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        {getChannelLabel(conversation.channel)} • {conversation.assignedAgentName}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(conversation.lastActivity).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(conversation.lastActivity).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available agents */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Agentes Disponíveis</h4>
              <div className="space-y-2">
                {agents.filter(agent => agent.status === "online").slice(0, 3).map((agent) => (
                  <div key={agent.id} className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                    <span className="flex-1">{agent.name}</span>
                    <span className="text-xs text-gray-500">{agent.department}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Selected conversation view */
          <>
            {/* Conversation info */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversationId(null)}
                    className="p-1"
                  >
                    ←
                  </Button>
                  <div>
                    <h4 className="font-medium text-sm">{selectedConversation?.subject}</h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{getChannelLabel(selectedConversation?.channel || "support")}</span>
                      <span>•</span>
                      <span>{selectedConversation?.assignedAgentName}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={selectedConversation?.status === "active" ? "default" : "secondary"}>
                  {selectedConversation?.status}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversationMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderType === "customer" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.senderType === "customer"
                        ? "bg-primary text-white"
                        : message.senderType === "system"
                        ? "bg-gray-100 text-gray-700 italic"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.senderType !== "customer" && message.senderType !== "system" && (
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {message.senderType === "ai" ? <Bot className="w-3 h-3" /> : message.senderName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{message.senderName}</span>
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <div className="text-xs opacity-70 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {message.senderType === "customer" && (
                        <CheckCheck className={`w-3 h-3 ml-1 inline ${message.isRead ? 'text-blue-200' : 'text-gray-400'}`} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">A</AvatarFallback>
                      </Avatar>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="p-2"
                  data-testid="button-attach-file"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="p-2"
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
            />
          </>
        )}
      </div>

      {/* Start Chat Dialog */}
      <Dialog open={isStartChatDialogOpen} onOpenChange={setIsStartChatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Nova Conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Canal de Atendimento</label>
              <Select value={selectedChannel} onValueChange={(value: any) => setSelectedChannel(value)}>
                <SelectTrigger data-testid="select-chat-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">Suporte Geral</SelectItem>
                  <SelectItem value="technical">Suporte Técnico</SelectItem>
                  <SelectItem value="commercial">Comercial</SelectItem>
                  <SelectItem value="billing">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Assunto</label>
              <Input
                value={chatSubject}
                onChange={(e) => setChatSubject(e.target.value)}
                placeholder="Descreva brevemente seu problema ou dúvida"
                data-testid="input-chat-subject"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Agentes Disponíveis</h4>
              <div className="space-y-2">
                {agents.filter(agent => 
                  agent.status === "online" && 
                  agent.currentConversations < agent.maxConversations
                ).map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>{agent.name}</span>
                      <span className="text-gray-500">• {agent.department}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>{agent.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsStartChatDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // Mock start conversation
                  toast({
                    title: "Chat iniciado!",
                    description: "Em breve você será conectado com um agente."
                  });
                  setIsStartChatDialogOpen(false);
                }}
                disabled={!chatSubject.trim() || startConversationMutation.isPending}
                data-testid="button-confirm-start-chat"
              >
                Iniciar Conversa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}