import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { authService } from '@/lib/auth';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: Array<{
    title: string;
    category: string;
    priority: string;
    estimatedTime: number;
    tags: string[];
  }>;
}

interface AIChatbotProps {
  onCreateTicket?: (subject: string, description: string) => void;
  className?: string;
}

export function AIChatbot({ onCreateTicket, className = '' }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou o assistente virtual do TatuTicket. Como posso ajudá-lo hoje?',
      timestamp: new Date()
    }
  ]);
  
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = authService.getCurrentUser();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Get AI suggestions for tickets
      const suggestions = await apiRequest('/api/ai/suggest-tickets', 'POST', {
        message: currentMessage
      });

      let response = 'Baseado na sua mensagem, identifiquei alguns possíveis problemas. Vou sugerir algumas opções:';

      if (suggestions && suggestions.length > 0) {
        response += '\n\nSugestões de tickets:';
        suggestions.forEach((suggestion: any, index: number) => {
          response += `\n${index + 1}. ${suggestion.title} (${suggestion.category}) - Tempo estimado: ${suggestion.estimatedTime}h`;
        });
        response += '\n\nGostaria que eu crie um ticket para algum destes problemas?';
      } else {
        response = 'Entendi sua solicitação. Para melhor atendê-lo, vou criar algumas opções de ticket baseadas na sua mensagem.';
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        suggestions: suggestions || []
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, houve um problema temporário. Posso ajudá-lo de outra forma? Você pode descrever seu problema e eu tentarei encontrar uma solução na nossa base de conhecimento.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCreateTicket = (suggestion: any) => {
    const subject = suggestion.title;
    const description = `Descrição: ${currentMessage}\n\nCategoria sugerida: ${suggestion.category}\nPrioridade: ${suggestion.priority}\nTags: ${suggestion.tags.join(', ')}`;
    
    if (onCreateTicket) {
      onCreateTicket(subject, description);
    }

    const confirmMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Perfeito! Criei um ticket para "${subject}". Você receberá atualizações por email e pode acompanhar o status no painel.`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, confirmMessage]);
  };

  const commonQuestions = [
    'Como resetar minha senha?',
    'Problemas no sistema de pagamento',
    'Erro ao gerar relatórios',
    'Solicitar nova funcionalidade',
    'Problemas de performance'
  ];

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-16 h-16 shadow-lg"
          data-testid="button-open-chatbot"
        >
          <i className="fas fa-comments text-xl"></i>
        </Button>
      </div>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-96 h-96 z-50 flex flex-col ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <i className="fas fa-robot mr-2 text-primary"></i>
            Assistente IA
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              data-testid="button-minimize-chatbot"
            >
              <i className="fas fa-minus"></i>
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600">Online</span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                
                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateTicket(suggestion)}
                        className="w-full text-left justify-start text-xs"
                        data-testid={`button-create-ticket-${index}`}
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Criar: {suggestion.title}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-2">Perguntas comuns:</p>
            <div className="space-y-1">
              {commonQuestions.slice(0, 3).map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMessage(question)}
                  className="w-full text-left justify-start text-xs h-auto p-2"
                  data-testid={`button-quick-question-${index}`}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex space-x-2">
          <Input
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button 
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isLoading}
            size="sm"
            data-testid="button-send-message"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}