import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, Bot, User, Paperclip, Star, ThumbsUp, ThumbsDown,
  Clock, CheckCircle, AlertCircle, Minimize2, Maximize2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'bot';
  timestamp: Date;
  type?: 'text' | 'file' | 'system';
  metadata?: {
    agentName?: string;
    confidence?: number;
    suggestedActions?: string[];
    attachments?: Array<{
      name: string;
      url: string;
      type: string;
    }>;
  };
}

interface ChatSession {
  id: string;
  ticketId?: string;
  status: 'waiting' | 'connected' | 'ended';
  agentId?: string;
  agentName?: string;
  queuePosition?: number;
  estimatedWaitTime?: number;
  satisfaction?: {
    rating: number;
    feedback?: string;
  };
}

export function InteractiveChat() {
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch current chat session
  const { data: chatSession, isLoading: isLoadingSession } = useQuery<ChatSession>({
    queryKey: ['/api/chat/session'],
    queryFn: async () => {
      const response = await fetch('/api/chat/session');
      if (!response.ok) throw new Error('Falha ao carregar sessão de chat');
      const result = await response.json();
      return result.data;
    }
  });

  // Fetch chat messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/messages', chatSession?.id],
    queryFn: async () => {
      if (!chatSession?.id) return [];
      const response = await fetch(`/api/chat/messages?sessionId=${chatSession.id}`);
      if (!response.ok) throw new Error('Falha ao carregar mensagens');
      const result = await response.json();
      return result.data;
    },
    enabled: !!chatSession?.id
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; type?: string; attachments?: File[] }) => {
      const formData = new FormData();
      formData.append('content', messageData.content);
      formData.append('sessionId', chatSession?.id || '');
      
      if (messageData.attachments) {
        messageData.attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }

      const response = await fetch('/api/chat/send', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Falha ao enviar mensagem');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      setMessage('');
      setIsTyping(true);
      
      // Simulate agent typing
      setTimeout(() => setIsTyping(false), 2000);
    }
  });

  // Start new chat session
  const startChatMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Falha ao iniciar chat');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/session'] });
    }
  });

  // Submit feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (feedbackData: { rating: number; feedback?: string }) => {
      const response = await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: chatSession?.id,
          ...feedbackData
        })
      });
      if (!response.ok) throw new Error('Falha ao enviar feedback');
      return response.json();
    },
    onSuccess: () => {
      setShowFeedback(false);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/session'] });
    }
  });

  // Mock data fallback
  const mockSession: ChatSession = {
    id: 'mock-session',
    status: 'connected',
    agentId: 'agent-1',
    agentName: 'Ana Silva',
    queuePosition: 0,
    estimatedWaitTime: 0
  };

  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      content: 'Olá! Bem-vindo ao suporte da TatuTicket. Como posso ajudá-lo hoje?',
      sender: 'agent',
      timestamp: new Date(Date.now() - 300000),
      metadata: { agentName: 'Ana Silva' }
    },
    {
      id: '2',
      content: 'Olá! Estou com dificuldades para configurar as notificações por email.',
      sender: 'user',
      timestamp: new Date(Date.now() - 240000)
    },
    {
      id: '3',
      content: 'Entendo! Vou te ajudar com as configurações de email. Primeiro, você pode me confirmar qual é o seu plano atual?',
      sender: 'agent',
      timestamp: new Date(Date.now() - 180000),
      metadata: { agentName: 'Ana Silva' }
    }
  ];

  const currentSession = chatSession || mockSession;
  const currentMessages = messages || mockMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isTyping]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({ content: message });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      sendMessageMutation.mutate({
        content: `Enviou ${files.length} arquivo(s)`,
        attachments: files
      });
    }
  };

  const renderMessage = (msg: ChatMessage) => (
    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start space-x-2 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            msg.sender === 'user' ? 'bg-blue-500' : msg.sender === 'bot' ? 'bg-purple-500' : 'bg-green-500'
          }`}>
            {msg.sender === 'user' ? (
              <User className="h-4 w-4 text-white" />
            ) : msg.sender === 'bot' ? (
              <Bot className="h-4 w-4 text-white" />
            ) : (
              <span className="text-xs font-bold text-white">A</span>
            )}
          </div>
          
          <div className={`rounded-lg px-3 py-2 ${
            msg.sender === 'user' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            <p className="text-sm">{msg.content}</p>
            {msg.metadata?.attachments && (
              <div className="mt-2 space-y-1">
                {msg.metadata.attachments.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <Paperclip className="h-3 w-3" />
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className={`flex items-center mt-1 text-xs text-gray-500 ${
          msg.sender === 'user' ? 'justify-end' : 'justify-start'
        }`}>
          {msg.metadata?.agentName && (
            <span className="mr-2">{msg.metadata.agentName}</span>
          )}
          <span>{msg.timestamp.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-12 h-12 shadow-lg"
          data-testid="button-maximize-chat"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-2xl z-50 flex flex-col" data-testid="interactive-chat">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <CardTitle className="text-lg">
              {currentSession.status === 'connected' ? 'Chat Ativo' : 'Aguardando...'}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              data-testid="button-minimize-chat"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {currentSession.status === 'connected' && currentSession.agentName && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Conectado com {currentSession.agentName}</span>
          </div>
        )}
        
        {currentSession.status === 'waiting' && (
          <div className="flex items-center space-x-2 text-sm text-orange-600">
            <Clock className="h-4 w-4" />
            <span>
              Posição na fila: {currentSession.queuePosition} 
              {currentSession.estimatedWaitTime && ` • ~${currentSession.estimatedWaitTime}min`}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {!currentSession.id ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="font-medium mb-2">Iniciar Chat</h3>
              <p className="text-sm text-gray-600 mb-4">
                Converse com nossa equipe de suporte em tempo real
              </p>
              <Button
                onClick={() => startChatMutation.mutate()}
                disabled={startChatMutation.isPending}
                data-testid="button-start-chat"
              >
                {startChatMutation.isPending ? 'Conectando...' : 'Iniciar Chat'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                currentMessages.map(renderMessage)
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
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

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={sendMessageMutation.isPending}
                  data-testid="input-chat-message"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-attach-file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  size="sm"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="absolute inset-0 bg-white rounded-lg p-6 flex flex-col">
          <h3 className="font-medium mb-4">Como foi sua experiência?</h3>
          <div className="flex space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant="ghost"
                size="sm"
                onClick={() => feedbackMutation.mutate({ rating })}
                data-testid={`button-rating-${rating}`}
              >
                <Star className="h-5 w-5" />
              </Button>
            ))}
          </div>
          <Textarea
            placeholder="Deixe um comentário (opcional)"
            className="mb-4"
            data-testid="textarea-feedback"
          />
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowFeedback(false)}>
              Pular
            </Button>
            <Button onClick={() => feedbackMutation.mutate({ rating: 5 })}>
              Enviar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}