import { Request, Response } from 'express';
import { catchAsync } from '../middlewares';
import { aiService } from '../integrations/ai.integration';

export class AIController {
  static analyzeTicket = catchAsync(async (req: Request, res: Response) => {
    const { content, subject, category } = req.body;
    
    try {
      const analysis = await aiService.analyzeTicket(subject, content);
      res.json({
        success: true,
        analysis: {
          sentiment: analysis.sentiment || 'neutral',
          priority: analysis.priority || 'medium',
          category: analysis.category || category,
          suggestedResponse: analysis.suggestedResponse,
          confidence: analysis.confidence || 0.8,
          keywords: analysis.keywords || [],
          escalationRecommended: analysis.escalationRecommended || false
        }
      });
    } catch (error) {
      console.warn('AI service not available, using fallback analysis');
      res.json({
        success: true,
        analysis: {
          sentiment: determineSentiment(content),
          priority: determinePriority(content, subject),
          category: category || 'general',
          suggestedResponse: generateResponse(content),
          confidence: 0.6,
          keywords: extractKeywords(content),
          escalationRecommended: shouldEscalate(content)
        },
        fallback: true
      });
    }
  });

  static chatWithBot = catchAsync(async (req: Request, res: Response) => {
    const { message, context, history } = req.body;
    
    try {
      const response = await aiService.generateChatResponse(message, context, history);
      res.json({
        success: true,
        response: response.text,
        type: response.type || 'text',
        actions: response.actions || [],
        confidence: response.confidence || 0.8
      });
    } catch (error) {
      console.warn('AI chat not available, using fallback responses');
      res.json({
        success: true,
        response: generateChatResponse(message),
        type: 'text',
        actions: generateActions(message),
        confidence: 0.6,
        fallback: true
      });
    }
  });

  static getSuggestions = catchAsync(async (req: Request, res: Response) => {
    const { context, userProfile } = req.query;
    
    try {
      const suggestions = await aiService.generateSuggestions(
        context as string, 
        userProfile as string
      );
      res.json({
        success: true,
        suggestions: suggestions
      });
    } catch (error) {
      res.json({
        success: true,
        suggestions: getDefaultSuggestions(),
        fallback: true
      });
    }
  });

  static getInsights = catchAsync(async (req: Request, res: Response) => {
    const { timeframe, tenantId } = req.query;
    
    try {
      const insights = await aiService.generateInsights(
        timeframe as string,
        tenantId as string
      );
      res.json({
        success: true,
        insights: insights
      });
    } catch (error) {
      res.json({
        success: true,
        insights: getMockInsights(),
        fallback: true
      });
    }
  });

  static categorizeTicket = catchAsync(async (req: Request, res: Response) => {
    const { subject, content } = req.body;
    
    try {
      const category = await aiService.categorizeTicket(subject, content);
      res.json({
        success: true,
        category: category.name,
        confidence: category.confidence,
        subcategory: category.subcategory
      });
    } catch (error) {
      const fallbackCategory = determineCategoryFallback(subject, content);
      res.json({
        success: true,
        category: fallbackCategory,
        confidence: 0.7,
        fallback: true
      });
    }
  });
}

// Fallback functions for when AI service is not available
function determineSentiment(content: string): 'positive' | 'neutral' | 'negative' {
  const negativeWords = ['problema', 'erro', 'bug', 'falha', 'ruim', 'péssimo', 'horrível'];
  const positiveWords = ['obrigado', 'ótimo', 'excelente', 'perfeito', 'bom', 'gostei'];
  
  const contentLower = content.toLowerCase();
  const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;
  const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
  
  if (negativeCount > positiveCount) return 'negative';
  if (positiveCount > negativeCount) return 'positive';
  return 'neutral';
}

function determinePriority(content: string, subject: string): 'low' | 'medium' | 'high' | 'urgent' {
  const urgentWords = ['urgente', 'crítico', 'parou', 'não funciona', 'down', 'emergência'];
  const highWords = ['importante', 'problema grave', 'erro crítico', 'falha'];
  
  const text = (content + ' ' + subject).toLowerCase();
  
  if (urgentWords.some(word => text.includes(word))) return 'urgent';
  if (highWords.some(word => text.includes(word))) return 'high';
  
  return 'medium';
}

function extractKeywords(content: string): string[] {
  const commonWords = ['o', 'a', 'e', 'de', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'não', 'que', 'se', 'por'];
  const words = content.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 5);
  
  return Array.from(new Set(words));
}

function shouldEscalate(content: string): boolean {
  const escalationWords = ['gerente', 'supervisor', 'urgente', 'crítico', 'insatisfeito', 'cancelar'];
  return escalationWords.some(word => content.toLowerCase().includes(word));
}

function generateResponse(content: string): string {
  if (content.toLowerCase().includes('senha')) {
    return 'Para redefinir sua senha, acesse a página de login e clique em "Esqueci minha senha".';
  }
  
  if (content.toLowerCase().includes('ticket')) {
    return 'Estou analisando seu ticket. Nossa equipe responderá em breve conforme seu SLA.';
  }
  
  return 'Obrigado por entrar em contato. Nossa equipe está analisando sua solicitação.';
}

function generateChatResponse(message: string): string {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('ticket') || messageLower.includes('chamado')) {
    return 'Posso ajudá-lo com tickets! Você pode criar um novo ticket, consultar o status de tickets existentes ou ver seu histórico. O que você gostaria de fazer?';
  }
  
  if (messageLower.includes('senha') || messageLower.includes('password')) {
    return 'Para redefinir sua senha, acesse a página de login e clique em "Esqueci minha senha". Você receberá um link por email para criar uma nova senha.';
  }
  
  if (messageLower.includes('sla') || messageLower.includes('prazo')) {
    return 'Você pode consultar seus SLAs e bolsa de horas na aba "Dashboard SLA". Lá você verá o status de todos os seus acordos de nível de serviço e horas disponíveis.';
  }
  
  return 'Entendi sua pergunta! Como posso ajudá-lo hoje? Posso auxiliar com tickets, consultas de SLA, ou conectá-lo com um agente.';
}

function generateActions(message: string): Array<{ label: string; action: string; data?: any }> {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('ticket') || messageLower.includes('chamado')) {
    return [
      { label: 'Criar Ticket', action: 'create_ticket' },
      { label: 'Ver Tickets', action: 'view_tickets' },
      { label: 'Falar com Agente', action: 'contact_agent' }
    ];
  }
  
  return [
    { label: 'Criar Ticket', action: 'create_ticket' },
    { label: 'Falar com Agente', action: 'contact_agent' }
  ];
}

function getDefaultSuggestions() {
  return [
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
    }
  ];
}

function getMockInsights() {
  return {
    ticketTrends: {
      totalTickets: 1247,
      trend: '+12%',
      mostCommonCategory: 'Suporte Técnico',
      avgResolutionTime: '2.3 horas'
    },
    sentimentAnalysis: {
      positive: 68,
      neutral: 25,
      negative: 7,
      overallSentiment: 'positive'
    },
    predictions: [
      {
        metric: 'Volume de Tickets',
        prediction: 'Aumento de 15% na próxima semana',
        confidence: 0.85,
        recommendation: 'Considere alocar mais agentes para o período'
      }
    ]
  };
}

function determineCategoryFallback(subject: string, content: string): string {
  const text = (subject + ' ' + content).toLowerCase();
  
  if (text.includes('senha') || text.includes('login') || text.includes('acesso')) {
    return 'Acesso e Autenticação';
  }
  
  if (text.includes('bug') || text.includes('erro') || text.includes('falha')) {
    return 'Suporte Técnico';
  }
  
  if (text.includes('fatura') || text.includes('pagamento') || text.includes('cobrança')) {
    return 'Financeiro';
  }
  
  if (text.includes('novo') || text.includes('criar') || text.includes('adicionar')) {
    return 'Solicitação de Serviço';
  }
  
  return 'Geral';
}