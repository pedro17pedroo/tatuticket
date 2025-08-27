import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'action';
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: 'knowledge' | 'ticket' | 'contact';
  relevance: number;
}

export function AIChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! Sou seu assistente virtual da TatuTicket. Como posso ajudá-lo hoje?',
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
    loadSuggestions();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSuggestions = async () => {
    try {
      const response = await apiRequest('GET', '/api/ai/suggestions');
      const data = await response.json();
      setSuggestions(data.suggestions || mockSuggestions);
    } catch (error) {
      setSuggestions(mockSuggestions);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await apiRequest('POST', '/api/ai/chat', {
        message: input,
        context: 'customer_support',
        history: messages.slice(-5) // Send last 5 messages for context
      });

      const data = await response.json();
      
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || getBotResponse(input),
          sender: 'bot',
          timestamp: new Date(),
          type: data.type || 'text',
          actions: data.actions
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1500);

    } catch (error) {
      // Fallback to simple bot responses
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: getBotResponse(input),
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('ticket') || input.includes('chamado')) {
      return 'Posso ajudá-lo com tickets! Você pode criar um novo ticket, consultar o status de tickets existentes ou ver seu histórico. O que você gostaria de fazer?';
    }
    
    if (input.includes('senha') || input.includes('password')) {
      return 'Para redefinir sua senha, acesse a página de login e clique em "Esqueci minha senha". Você receberá um link por email para criar uma nova senha.';
    }
    
    if (input.includes('sla') || input.includes('prazo')) {
      return 'Você pode consultar seus SLAs e bolsa de horas na aba "Dashboard SLA". Lá você verá o status de todos os seus acordos de nível de serviço e horas disponíveis.';
    }
    
    if (input.includes('contato') || input.includes('suporte')) {
      return 'Para entrar em contato conosco: Email: suporte@tatuticket.com | Telefone: (11) 9999-9999 | Ou abra um ticket aqui mesmo no sistema!';
    }
    
    if (input.includes('como') && (input.includes('criar') || input.includes('abrir'))) {
      return 'Para criar um ticket: 1) Clique no botão "Novo Ticket" 2) Escolha a categoria 3) Descreva seu problema 4) Anexe arquivos se necessário 5) Clique em "Enviar"';
    }
    
    return 'Entendi sua pergunta! Aqui estão algumas opções que podem ajudar: consultar tickets existentes, criar um novo ticket, ou falar com um agente. O que você prefere?';
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const message = `Tenho interesse em: ${suggestion.title}`;
    setInput(message);
  };

  const handleAction = (action: string, data?: any) => {
    switch (action) {
      case 'create_ticket':
        toast({
          title: "Redirecionando...",
          description: "Você será levado para a página de criação de tickets."
        });
        // Redirect to ticket creation
        break;
      case 'view_tickets':
        toast({
          title: "Redirecionando...",
          description: "Você será levado para a página de tickets."
        });
        // Redirect to tickets page
        break;
      case 'contact_agent':
        toast({
          title: "Conectando...",
          description: "Conectando você com um agente humano."
        });
        // Connect to live agent
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-lg"
          data-testid="button-open-chat"
        >
          <i className="fas fa-comments text-xl"></i>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-2xl border-primary/20">
        <CardHeader className="bg-primary text-white rounded-t-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fas fa-robot text-sm"></i>
              </div>
              <div>
                <CardTitle className="text-sm">Assistente IA</CardTitle>
                <p className="text-xs text-primary-foreground/80">Online • Respondendo agora</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              data-testid="button-minimize-chat"
            >
              <i className="fas fa-minus text-xs"></i>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.actions && (
                    <div className="mt-2 space-y-1">
                      {message.actions.map((action, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="outline"
                          className="text-xs mr-1"
                          onClick={() => handleAction(action.action, action.data)}
                          data-testid={`button-action-${action.action}`}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="border-t p-3">
              <p className="text-xs text-gray-600 mb-2">Sugestões para você:</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.slice(0, 3).map((suggestion) => (
                  <Badge
                    key={suggestion.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                    onClick={() => handleSuggestionClick(suggestion)}
                    data-testid={`suggestion-${suggestion.id}`}
                  >
                    {suggestion.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                size="sm"
                data-testid="button-send-message"
              >
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const mockSuggestions: Suggestion[] = [
  {
    id: '1',
    title: 'Como criar um ticket?',
    description: 'Aprenda a abrir um novo chamado',
    category: 'ticket',
    relevance: 95
  },
  {
    id: '2',
    title: 'Consultar SLA',
    description: 'Veja seus acordos de nível de serviço',
    category: 'knowledge',
    relevance: 85
  },
  {
    id: '3',
    title: 'Falar com agente',
    description: 'Conectar com atendimento humano',
    category: 'contact',
    relevance: 75
  },
  {
    id: '4',
    title: 'Redefinir senha',
    description: 'Como alterar sua senha de acesso',
    category: 'knowledge',
    relevance: 70
  },
  {
    id: '5',
    title: 'Status dos tickets',
    description: 'Acompanhe seus chamados em andamento',
    category: 'ticket',
    relevance: 80
  }
];