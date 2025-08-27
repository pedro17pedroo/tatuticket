import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, Send, Bot, User, Clock, ThumbsUp, ThumbsDown,
  Search, BookOpen, Phone, Mail, Minimize2, Maximize2, X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: string;
  rating?: 'positive' | 'negative';
  suggestedActions?: string[];
  knowledgeArticles?: KnowledgeArticle[];
}

interface KnowledgeArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  relevanceScore: number;
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  status: 'active' | 'resolved' | 'escalated';
  startedAt: string;
  customerSatisfaction?: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export function AICustomerChatbot() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Mock chat session data
  const sessionData: ChatSession = {
    id: 'session_123',
    status: 'active',
    startedAt: '2025-01-27T14:30:00Z',
    messages: [
      {
        id: '1',
        content: 'Olá! Sou a assistente virtual da TatuTicket. Como posso ajudá-lo hoje?',
        isBot: true,
        timestamp: '2025-01-27T14:30:00Z',
        suggestedActions: [
          'Verificar status do ticket',
          'Reportar problema técnico',
          'Dúvidas sobre cobrança',
          'Atualizar informações'
        ]
      }
    ]
  };

  const { data: session = sessionData } = useQuery<ChatSession>({
    queryKey: ['/api/ai/chat-session'],
    enabled: isOpen
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      setIsTyping(true);
      // Simulate AI response delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock AI response based on message content
      const lowerMessage = message.toLowerCase();
      let response: ChatMessage;
      
      if (lowerMessage.includes('ticket') || lowerMessage.includes('problema')) {
        response = {
          id: Date.now().toString(),
          content: 'Entendo que você está com problemas relacionados a tickets. Posso ajudá-lo a verificar o status dos seus tickets ou criar um novo. Qual seria sua preferência?',
          isBot: true,
          timestamp: new Date().toISOString(),
          suggestedActions: [
            'Ver meus tickets',
            'Criar novo ticket',
            'Falar com agente'
          ],
          knowledgeArticles: [
            {
              id: '1',
              title: 'Como verificar o status do meu ticket?',
              excerpt: 'Aprenda a acompanhar o progresso dos seus tickets...',
              category: 'Ajuda',
              relevanceScore: 95
            }
          ]
        };
      } else if (lowerMessage.includes('cobrança') || lowerMessage.includes('pagamento')) {
        response = {
          id: Date.now().toString(),
          content: 'Posso ajudá-lo com questões de cobrança e pagamentos. Você gostaria de verificar faturas pendentes, atualizar método de pagamento ou esclarecer dúvidas sobre cobranças?',
          isBot: true,
          timestamp: new Date().toISOString(),
          suggestedActions: [
            'Ver faturas',
            'Atualizar pagamento',
            'Esclarecer cobrança'
          ]
        };
      } else {
        response = {
          id: Date.now().toString(),
          content: 'Compreendo sua solicitação. Deixe-me procurar as informações mais relevantes para ajudá-lo. Enquanto isso, você também pode consultar nossa base de conhecimento ou falar diretamente com um agente.',
          isBot: true,
          timestamp: new Date().toISOString(),
          suggestedActions: [
            'Buscar na base de conhecimento',
            'Falar com agente',
            'Reportar problema'
          ]
        };
      }
      
      return response;
    },
    onSuccess: (botResponse) => {
      setIsTyping(false);
      queryClient.setQueryData(['/api/ai/chat-session'], (old: ChatSession) => ({
        ...old,
        messages: [
          ...old.messages,
          {
            id: Date.now().toString() + '_user',
            content: currentMessage,
            isBot: false,
            timestamp: new Date().toISOString()
          },
          botResponse
        ]
      }));
      setCurrentMessage('');
    },
    onError: () => {
      setIsTyping(false);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    }
  });

  const rateMessageMutation = useMutation({
    mutationFn: async ({ messageId, rating }: { messageId: string; rating: 'positive' | 'negative' }) => {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 500));
      return { messageId, rating };
    },
    onSuccess: ({ messageId, rating }) => {
      queryClient.setQueryData(['/api/ai/chat-session'], (old: ChatSession) => ({
        ...old,
        messages: old.messages.map(msg => 
          msg.id === messageId ? { ...msg, rating } : msg
        )
      }));
      
      toast({
        title: "Feedback Enviado",
        description: "Obrigado pela sua avaliação!",
      });
    }
  });

  const quickActions: QuickAction[] = [
    {
      id: 'check-tickets',
      title: 'Meus Tickets',
      description: 'Ver status dos meus tickets',
      icon: Search,
      action: () => sendMessageMutation.mutate('Quero verificar o status dos meus tickets')
    },
    {
      id: 'new-ticket',
      title: 'Novo Ticket',
      description: 'Criar um novo ticket',
      icon: MessageCircle,
      action: () => sendMessageMutation.mutate('Quero criar um novo ticket')
    },
    {
      id: 'billing',
      title: 'Cobrança',
      description: 'Dúvidas sobre faturas',
      icon: BookOpen,
      action: () => sendMessageMutation.mutate('Tenho dúvidas sobre cobrança')
    },
    {
      id: 'contact',
      title: 'Falar com Agente',
      description: 'Conversar com humano',
      icon: Phone,
      action: () => sendMessageMutation.mutate('Quero falar com um agente humano')
    }
  ];

  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      sendMessageMutation.mutate(currentMessage);
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessageMutation.mutate(action);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, isTyping]);

  // Floating chat button
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700"
          data-testid="chat-open-button"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  // Chat window
  return (
    <div className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'bottom-4 right-4'} z-50`}>
      <Card className={`${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'} transition-all duration-300 shadow-2xl`} data-testid="ai-customer-chatbot">
        <CardHeader className="p-4 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-500 text-white">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm">TatuBot</CardTitle>
                <div className="flex items-center gap-1 text-xs opacity-90">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Online
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-blue-700 p-1"
                data-testid="chat-minimize-button"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-700 p-1"
                data-testid="chat-close-button"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[540px]">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-2 m-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="actions">Ações Rápidas</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col m-0">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {session.messages.map((message) => (
                      <div key={message.id} className={`flex gap-3 ${message.isBot ? '' : 'flex-row-reverse'}`} data-testid={`message-${message.id}`}>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={message.isBot ? 'bg-blue-100' : 'bg-gray-100'}>
                            {message.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`flex-1 max-w-xs ${message.isBot ? '' : 'text-right'}`}>
                          <div className={`rounded-lg p-3 ${
                            message.isBot 
                              ? 'bg-gray-100 text-gray-900' 
                              : 'bg-blue-600 text-white'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                              <Clock className="w-3 h-3" />
                              {new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>

                          {/* Suggested Actions */}
                          {message.suggestedActions && (
                            <div className="mt-2 space-y-1">
                              {message.suggestedActions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => handleQuickAction(action)}
                                  data-testid={`suggested-action-${index}`}
                                >
                                  {action}
                                </Button>
                              ))}
                            </div>
                          )}

                          {/* Knowledge Articles */}
                          {message.knowledgeArticles && (
                            <div className="mt-2 space-y-1">
                              {message.knowledgeArticles.map((article) => (
                                <div key={article.id} className="bg-blue-50 border border-blue-200 rounded p-2">
                                  <div className="text-xs font-medium text-blue-900">{article.title}</div>
                                  <div className="text-xs text-blue-700">{article.excerpt}</div>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {article.relevanceScore}% relevante
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Rating buttons for bot messages */}
                          {message.isBot && !message.rating && (
                            <div className="flex gap-1 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => rateMessageMutation.mutate({ messageId: message.id, rating: 'positive' })}
                                data-testid={`rate-positive-${message.id}`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => rateMessageMutation.mutate({ messageId: message.id, rating: 'negative' })}
                                data-testid={`rate-negative-${message.id}`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </Button>
                            </div>
                          )}

                          {/* Show rating if given */}
                          {message.rating && (
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {message.rating === 'positive' ? '👍 Útil' : '👎 Não útil'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-100">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={sendMessageMutation.isPending}
                      data-testid="chat-input"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || !currentMessage.trim()}
                      data-testid="chat-send-button"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="flex-1 p-4">
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="h-auto p-3 flex flex-col items-center gap-2"
                      onClick={action.action}
                      data-testid={`quick-action-${action.id}`}
                    >
                      <action.icon className="w-5 h-5" />
                      <div className="text-center">
                        <div className="text-xs font-medium">{action.title}</div>
                        <div className="text-xs text-gray-500">{action.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}