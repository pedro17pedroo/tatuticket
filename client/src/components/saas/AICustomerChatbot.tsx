import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AICustomerChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function AICustomerChatbot({ isOpen, onToggle, className }: AICustomerChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Olá! Sou o assistente inteligente da TatuTicket. Como posso ajudar você hoje?',
      timestamp: new Date(),
      suggestions: [
        'Como criar um ticket?',
        'Verificar status do meu ticket',
        'Informações sobre planos',
        'Suporte técnico'
      ]
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = generateBotResponse(content.trim());
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userInput: string): ChatMessage => {
    const lowerInput = userInput.toLowerCase();
    
    let response = '';
    let suggestions: string[] = [];

    if (lowerInput.includes('ticket') || lowerInput.includes('criar')) {
      response = 'Para criar um novo ticket, você pode:\n\n1. Acessar o Portal do Cliente\n2. Clicar em "Novo Ticket"\n3. Preencher os detalhes do problema\n4. Anexar arquivos se necessário\n\nPosso ajudar com mais alguma coisa?';
      suggestions = ['Ver meus tickets', 'Status do ticket', 'Cancelar ticket'];
    } else if (lowerInput.includes('status') || lowerInput.includes('acompanhar')) {
      response = 'Para verificar o status dos seus tickets:\n\n1. Entre no Portal do Cliente\n2. Acesse "Meus Tickets"\n3. Veja o status em tempo real\n\nTambém enviamos notificações por email sobre atualizações!';
      suggestions = ['Criar novo ticket', 'Alterar prioridade', 'Adicionar comentário'];
    } else if (lowerInput.includes('plano') || lowerInput.includes('preço')) {
      response = 'Nossos planos incluem:\n\n🟦 **Starter** - R$ 29/mês\n• 100 tickets/mês\n• 2 agentes\n• Suporte básico\n\n🟣 **Professional** - R$ 99/mês\n• 500 tickets/mês\n• 10 agentes\n• Automação básica\n\n🟠 **Enterprise** - R$ 249/mês\n• Tickets ilimitados\n• Agentes ilimitados\n• IA avançada';
      suggestions = ['Falar com vendas', 'Comparar planos', 'Upgrade'];
    } else if (lowerInput.includes('suporte') || lowerInput.includes('ajuda')) {
      response = 'Estou aqui para ajudar! Posso auxiliar com:\n\n• Criação e gestão de tickets\n• Informações sobre planos\n• Dúvidas técnicas\n• Status de pagamentos\n\nO que você gostaria de saber?';
      suggestions = ['Problemas técnicos', 'Billing', 'Configurações', 'Integração'];
    } else {
      response = 'Entendi sua pergunta! Para uma resposta mais específica, posso conectar você com nossa equipe de suporte. Eles poderão ajudar com detalhes técnicos.\n\nEnquanto isso, posso ajudar com informações gerais sobre nossos serviços.';
      suggestions = ['Falar com suporte humano', 'Ver FAQ', 'Documentação'];
    }

    return {
      id: Date.now().toString(),
      type: 'bot',
      content: response,
      timestamp: new Date(),
      suggestions
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
        data-testid="chatbot-toggle"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col",
      isMinimized && "h-16",
      className
    )} data-testid="ai-chatbot">
      <CardHeader className="p-4 border-b bg-blue-600 text-white rounded-t-lg flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <CardTitle className="text-sm">Assistente IA TatuTicket</CardTitle>
          <Badge variant="secondary" className="bg-green-500 text-white text-xs">
            Online
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0 text-white hover:bg-blue-700"
            data-testid="minimize-chatbot"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 text-white hover:bg-blue-700"
            data-testid="close-chatbot"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}
                    data-testid={`message-${message.type}-${message.id}`}
                  >
                    {message.type === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "max-w-[280px] rounded-lg p-3 break-words",
                      message.type === 'user' 
                        ? "bg-blue-600 text-white ml-8" 
                        : "bg-gray-100 text-gray-900"
                    )}>
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      <div className={cn(
                        "text-xs mt-1 opacity-70",
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      )}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>

                    {message.type === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Suggestions */}
                {messages.length > 0 && messages[messages.length - 1].type === 'bot' && messages[messages.length - 1].suggestions && (
                  <div className="flex flex-wrap gap-2 ml-11" data-testid="chatbot-suggestions">
                    {messages[messages.length - 1].suggestions!.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => handleSuggestionClick(suggestion)}
                        data-testid={`suggestion-${index}`}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}

                {isTyping && (
                  <div className="flex gap-3 justify-start" data-testid="typing-indicator">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputMessage);
                  }
                }}
                disabled={isTyping}
                data-testid="chatbot-input"
              />
              <Button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isTyping}
                size="sm"
                className="px-3"
                data-testid="send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              Powered by TatuTicket AI • Disponível 24/7
            </div>
          </div>
        </>
      )}
    </Card>
  );
}