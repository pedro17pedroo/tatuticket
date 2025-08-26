import OpenAI from 'openai';
import { config } from '../config/app.config';

interface AIAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  suggestedResponse?: string;
  confidence: number;
}

interface TicketSuggestion {
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number; // in hours
  tags: string[];
}

class AIService {
  private client: OpenAI | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (!config.ai.enabled) {
      console.warn('🤖 AI service disabled - OpenAI API key missing');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: config.ai.openai.apiKey,
      });

      this.initialized = true;
      console.log('🤖 AI service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AI service:', error);
    }
  }

  async analyzeTicket(subject: string, description: string): Promise<AIAnalysisResult> {
    if (!this.initialized || !this.client) {
      console.warn('🤖 AI service not available - returning default analysis');
      return {
        sentiment: 'neutral',
        priority: 'medium',
        category: 'general',
        confidence: 0.1,
      };
    }

    try {
      const prompt = `
        Analise o seguinte ticket de suporte e forneça uma análise estruturada:
        
        Assunto: ${subject}
        Descrição: ${description}
        
        Por favor, retorne uma análise JSON com:
        - sentiment: 'positive', 'neutral', 'negative', ou 'urgent'
        - priority: 'low', 'medium', 'high', ou 'critical'
        - category: categoria do problema (ex: 'technical', 'billing', 'feature_request')
        - suggestedResponse: sugestão de resposta inicial (opcional)
        - confidence: nível de confiança da análise (0-1)
      `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI service');
      }

      try {
        const analysis = JSON.parse(content) as AIAnalysisResult;
        console.log('🤖 Ticket analysis completed');
        return analysis;
      } catch (parseError) {
        console.warn('🤖 Failed to parse AI response, returning default');
        return {
          sentiment: 'neutral',
          priority: 'medium',
          category: 'general',
          confidence: 0.3,
        };
      }
    } catch (error) {
      console.error('❌ Failed to analyze ticket:', error);
      return {
        sentiment: 'neutral',
        priority: 'medium',
        category: 'general',
        confidence: 0.1,
      };
    }
  }

  async generateTicketSuggestions(userMessage: string): Promise<TicketSuggestion[]> {
    if (!this.initialized || !this.client) {
      return [];
    }

    try {
      const prompt = `
        Com base na seguinte mensagem do usuário, sugira até 3 categorias de ticket possíveis:
        
        Mensagem: "${userMessage}"
        
        Retorne um array JSON de sugestões com:
        - title: título sugerido para o ticket
        - category: categoria
        - priority: prioridade estimada
        - estimatedTime: tempo estimado em horas
        - tags: array de tags relevantes
      `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.4,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      try {
        return JSON.parse(content) as TicketSuggestion[];
      } catch (parseError) {
        console.warn('🤖 Failed to parse suggestions response');
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to generate ticket suggestions:', error);
      return [];
    }
  }

  async generateAutoResponse(ticketSubject: string, ticketDescription: string): Promise<string | null> {
    if (!this.initialized || !this.client) {
      return null;
    }

    try {
      const prompt = `
        Gere uma resposta automática profissional e útil para o seguinte ticket de suporte:
        
        Assunto: ${ticketSubject}
        Descrição: ${ticketDescription}
        
        A resposta deve:
        - Ser empática e profissional
        - Reconhecer o problema do usuário
        - Fornecer próximos passos ou informações úteis
        - Ser concisa (máximo 200 palavras)
      `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.6,
      });

      const content = response.choices[0]?.message?.content;
      console.log('🤖 Auto-response generated');
      return content || null;
    } catch (error) {
      console.error('❌ Failed to generate auto-response:', error);
      return null;
    }
  }

  async summarizeTicketHistory(ticketHistory: Array<{ message: string; timestamp: Date }>): Promise<string> {
    if (!this.initialized || !this.client || ticketHistory.length === 0) {
      return 'Histórico não disponível.';
    }

    try {
      const historyText = ticketHistory
        .map(entry => `${entry.timestamp.toISOString()}: ${entry.message}`)
        .join('\n');

      const prompt = `
        Resuma o seguinte histórico de ticket de forma concisa e organizada:
        
        ${historyText}
        
        Forneça um resumo que destaque:
        - Problema principal
        - Ações tomadas
        - Status atual
        - Próximos passos (se aplicável)
      `;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content || 'Resumo não disponível.';
    } catch (error) {
      console.error('❌ Failed to summarize ticket history:', error);
      return 'Erro ao gerar resumo.';
    }
  }

  isEnabled(): boolean {
    return this.initialized;
  }
}

export const aiService = new AIService();