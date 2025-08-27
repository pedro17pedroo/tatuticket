import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  Send,
  ThumbsUp,
  ThumbsDown,
  User,
  MessageCircle,
  Loader2,
  Minimize2,
  Maximize2,
  X,
  Paperclip,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  articles?: Array<{
    id: string;
    title: string;
    snippet: string;
    url: string;
  }>;
  rating?: 'positive' | 'negative';
  confidence?: number;
}

interface ChatState {
  messages: Message[];
  isTyping: boolean;
  sessionId: string;
}

// Mock AI responses for demo
const MOCK_RESPONSES = {
  greeting: {
    content: "Olá! Sou o assistente virtual do TatuTicket. Como posso ajudá-lo hoje?",
    suggestions: [
      "Como criar um novo ticket?",
      "Verificar status do meu ticket",
      "Problemas de login",
      "Alterar minha senha"
    ]
  },
  ticket_create: {
    content: "Para criar um novo ticket, você pode clicar no botão 'Novo Ticket' no painel principal ou seguir estes passos:\n\n1. Vá até a seção 'Meus Tickets'\n2. Clique em 'Criar Ticket'\n3. Preencha o assunto e descrição\n4. Selecione a prioridade\n5. Clique em 'Enviar'\n\nPosso ajudá-lo a criar um ticket agora mesmo se desejar!",
    articles: [
      {
        id: '1',
        title: 'Como criar um ticket de suporte',
        snippet: 'Guia passo a passo para criar tickets...',
        url: '/knowledge/criar-ticket'
      }
    ]
  },
  ticket_status: {
    content: "Para verificar o status dos seus tickets, você pode:\n\n1. Acessar a seção 'Meus Tickets' no painel\n2. Usar a busca para encontrar um ticket específico\n3. Filtrar por status (aberto, em andamento, resolvido)\n\nVocê também receberá notificações automáticas quando houver atualizações. Gostaria que eu verifique algum ticket específico?",
    suggestions: ["Buscar ticket por número", "Ver tickets em aberto", "Histórico de tickets"]
  },
  login_help: {
    content: "Se você está tendo problemas para fazer login, aqui estão algumas soluções:\n\n1. **Senha esquecida**: Use o link 'Esqueci minha senha' na tela de login\n2. **Email incorreto**: Verifique se está usando o email correto\n3. **Conta bloqueada**: Entre em contato conosco se sua conta foi bloqueada\n4. **Problemas técnicos**: Tente limpar o cache do navegador\n\nPrecisa de ajuda específica com algum desses pontos?",
    articles: [
      {
        id: '2',
        title: 'Problemas de login - Soluções',
        snippet: 'Resolvendo problemas comuns de acesso...',
        url: '/knowledge/login-problemas'
      }
    ]
  }
};

export function AIChatbot({ 
  isMinimized = false, 
  onToggleMinimize,
  onClose 
}: { 
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
}) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    sessionId: `session_${Date.now()}`
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(!isMinimized);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize with greeting
  useEffect(() => {
    if (chatState.messages.length === 0) {
      const greetingMessage: Message = {
        id: '1',
        type: 'bot',
        content: MOCK_RESPONSES.greeting.content,
        timestamp: new Date(),
        suggestions: MOCK_RESPONSES.greeting.suggestions
      };
      setChatState(prev => ({
        ...prev,
        messages: [greetingMessage]
      }));
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      return generateAIResponse(message);
    },
    onSuccess: (response) => {
      const botMessage: Message = {
        id: `bot_${Date.now()}`,
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        articles: response.articles,
        confidence: response.confidence || 0.85
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isTyping: false
      }));
    },
    onError: () => {
      toast({
        title: 'Erro na comunicação',
        description: 'Não foi possível processar sua mensagem',
        variant: 'destructive'
      });
      setChatState(prev => ({ ...prev, isTyping: false }));
    }
  });

  const generateAIResponse = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('criar') && lowerMessage.includes('ticket')) {
      return MOCK_RESPONSES.ticket_create;
    } else if (lowerMessage.includes('status') && lowerMessage.includes('ticket')) {
      return MOCK_RESPONSES.ticket_status;
    } else if (lowerMessage.includes('login') || lowerMessage.includes('senha')) {
      return MOCK_RESPONSES.login_help;
    } else {
      return {
        content: "Entendi sua pergunta. Deixe-me pesquisar as melhores informações para ajudá-lo. Enquanto isso, você pode explorar nossa base de conhecimento ou criar um ticket para suporte personalizado.",
        suggestions: ["Falar com atendente humano", "Buscar na base de conhecimento", "Criar ticket"],
        confidence: 0.75
      };
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true
    }));

    sendMessageMutation.mutate(inputMessage);
    setInputMessage('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    handleSendMessage();
  };

  const handleRating = (messageId: string, rating: 'positive' | 'negative') => {
    setChatState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId ? { ...msg, rating } : msg
      )
    }));

    toast({
      title: rating === 'positive' ? 'Obrigado pelo feedback!' : 'Feedback recebido',
      description: rating === 'positive' 
        ? 'Fico feliz que pude ajudar!' 
        : 'Vamos melhorar nossa assistência'
    });
  };

  if (isMinimized) {
    return (
      <Button
        onClick={onToggleMinimize}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
        data-testid="button-open-chat"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] shadow-xl z-50 flex flex-col" data-testid="ai-chatbot">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/bot-avatar.png" />
            <AvatarFallback>
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-sm">Assistente IA</CardTitle>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleMinimize}
            data-testid="button-minimize-chat"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            data-testid="button-close-chat"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {chatState.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-2 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <Avatar className="w-6 h-6">
                    {message.type === 'user' ? (
                      <AvatarFallback><User className="w-3 h-3" /></AvatarFallback>
                    ) : (
                      <AvatarFallback><Bot className="w-3 h-3" /></AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="space-y-2">
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap" data-testid={`message-${message.id}`}>
                        {message.content}
                      </p>
                      
                      {message.confidence && message.type === 'bot' && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(message.confidence * 100)}% confiança
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Suggestions */}
                    {message.suggestions && (
                      <div className="space-y-1">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs h-auto py-1 px-2 w-full justify-start"
                            onClick={() => handleSuggestionClick(suggestion)}
                            data-testid={`suggestion-${index}`}
                          >
                            <Lightbulb className="w-3 h-3 mr-1" />
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Knowledge Articles */}
                    {message.articles && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Artigos relacionados:
                        </p>
                        {message.articles.map((article) => (
                          <div key={article.id} className="border rounded p-2 text-xs">
                            <h4 className="font-medium">{article.title}</h4>
                            <p className="text-muted-foreground">{article.snippet}</p>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Ler artigo
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rating */}
                    {message.type === 'bot' && !message.rating && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRating(message.id, 'positive')}
                          data-testid={`thumbs-up-${message.id}`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRating(message.id, 'negative')}
                          data-testid={`thumbs-down-${message.id}`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {message.rating && (
                      <Badge variant={message.rating === 'positive' ? 'default' : 'secondary'} className="text-xs">
                        {message.rating === 'positive' ? 'Útil' : 'Feedback recebido'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {chatState.isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback><Bot className="w-3 h-3" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Paperclip className="w-4 h-4" />
          </Button>
          <div className="flex-1 flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={chatState.isTyping}
              data-testid="input-chat-message"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || chatState.isTyping}
              size="sm"
              data-testid="button-send-message"
            >
              {chatState.isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-2 flex flex-wrap gap-1">
          <Button variant="outline" size="sm" className="text-xs h-6">
            Novo Ticket
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-6">
            Meus Tickets
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-6">
            Base de Conhecimento
          </Button>
        </div>
      </div>
    </Card>
  );
}