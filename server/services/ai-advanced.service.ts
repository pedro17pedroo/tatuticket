interface TicketAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: number; // 0-100 scale
  category: string;
  suggestedActions: string[];
  duplicateTickets: string[];
  estimatedResolutionTime: number; // in hours
  requiredExpertise: string[];
}

interface SLAPrediction {
  ticketId: string;
  breachProbability: number; // 0-100
  timeToBreachHours: number;
  riskFactors: string[];
  recommendedActions: string[];
}

interface CustomerInsight {
  customerId: string;
  satisfactionScore: number; // 0-100
  churnRisk: number; // 0-100
  preferredChannels: string[];
  responseTimePreference: string;
  complexityPreference: string;
  historicalPatterns: {
    commonIssues: string[];
    averageResolutionTime: number;
    escalationRate: number;
  };
}

interface KnowledgeBaseSuggestion {
  articleId: string;
  title: string;
  relevanceScore: number; // 0-100
  section: string;
  summary: string;
}

import OpenAI from 'openai';

class AIAdvancedService {
  private openaiEnabled = false;

  constructor() {
    this.openaiEnabled = !!process.env.OPENAI_API_KEY;
    if (this.openaiEnabled) {
      console.log('🧠 Advanced AI service initialized with OpenAI');
    } else {
      console.warn('🧠 Advanced AI service running in mock mode - OpenAI API key not configured');
    }
  }

  async analyzeTicket(ticketId: string, content: string, context: any = {}): Promise<TicketAnalysis> {
    try {
      if (!this.openaiEnabled) {
        return this.mockTicketAnalysis(ticketId, content);
      }

      // Real OpenAI implementation
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const analysis = await this.performRealTicketAnalysis(openai, content, context);
      return analysis;
    } catch (error) {
      console.error('❌ AI ticket analysis failed:', error);
      return this.mockTicketAnalysis(ticketId, content);
    }
  }

  private mockSLAPrediction(ticketId: string, priority: string, complexity: string, teamLoad: number): SLAPrediction {
    // Mock SLA breach prediction algorithm
    let breachProbability = 20; // Base probability
    const riskFactors: string[] = [];
    const recommendedActions: string[] = [];

    // Adjust based on priority
    if (priority === 'critical') {
      breachProbability += 40;
      riskFactors.push('Critical priority ticket');
    } else if (priority === 'high') {
      breachProbability += 25;
      riskFactors.push('High priority ticket');
    }

    // Adjust based on complexity
    if (complexity === 'high') {
      breachProbability += 30;
      riskFactors.push('High complexity issue');
    } else if (complexity === 'medium') {
      breachProbability += 15;
    }

    // Adjust based on team load
    if (teamLoad > 80) {
      breachProbability += 25;
      riskFactors.push('Team overloaded');
    } else if (teamLoad > 60) {
      breachProbability += 15;
      riskFactors.push('High team utilization');
    }

    // Generate recommendations
    if (breachProbability > 70) {
      recommendedActions.push('Immediate escalation required');
      recommendedActions.push('Assign to senior agent');
    } else if (breachProbability > 40) {
      recommendedActions.push('Monitor closely');
      recommendedActions.push('Consider priority adjustment');
    } else {
      recommendedActions.push('Standard workflow');
    }

    return {
      ticketId,
      breachProbability: Math.min(100, breachProbability),
      timeToBreachHours: Math.max(1, 24 - (breachProbability / 100) * 20),
      riskFactors,
      recommendedActions
    };
  }

  private mockCustomerInsights(customerId: string): CustomerInsight {
    // Mock customer insights
    const satisfactionScore = Math.floor(Math.random() * 40) + 60; // 60-100
    const churnRisk = Math.floor(Math.random() * 30) + (satisfactionScore < 70 ? 30 : 10);
    
    return {
      customerId,
      satisfactionScore,
      churnRisk,
      preferredChannels: ['email', 'chat', 'phone'][Math.floor(Math.random() * 3)] === 'email' ? ['email'] : ['chat', 'phone'],
      responseTimePreference: ['immediate', 'within_hour', 'same_day'][Math.floor(Math.random() * 3)],
      complexityPreference: ['simple', 'detailed', 'technical'][Math.floor(Math.random() * 3)],
      historicalPatterns: {
        commonIssues: ['login_issues', 'billing_questions', 'feature_requests'],
        averageResolutionTime: Math.floor(Math.random() * 48) + 2,
        escalationRate: Math.floor(Math.random() * 20) + 5
      }
    };
  }

  private mockKnowledgeBaseSuggestions(ticketContent: string, category?: string): KnowledgeBaseSuggestion[] {
    // Mock knowledge base suggestions
    const mockArticles = [
      {
        articleId: 'kb-001',
        title: 'Como resolver problemas de login',
        relevanceScore: 85,
        section: 'Autenticação',
        summary: 'Passos para resolver problemas comuns de login e recuperação de senha'
      },
      {
        articleId: 'kb-002', 
        title: 'Configuração de integrações',
        relevanceScore: 72,
        section: 'Integrações',
        summary: 'Guia completo para configurar integrações com sistemas externos'
      },
      {
        articleId: 'kb-003',
        title: 'Troubleshooting de performance',
        relevanceScore: 68,
        section: 'Performance',
        summary: 'Como identificar e resolver problemas de performance no sistema'
      }
    ];

    // Filter by category if provided
    if (category) {
      return mockArticles.filter(article => 
        article.section.toLowerCase().includes(category.toLowerCase())
      ).slice(0, 2);
    }

    return mockArticles.slice(0, 3);
  }

  private mockTicketAnalysis(ticketId: string, content: string): TicketAnalysis {
    // Mock sentiment analysis based on keywords
    const negativeKeywords = ['angry', 'frustrated', 'terrible', 'awful', 'hate', 'urgent', 'emergency'];
    const positiveKeywords = ['great', 'excellent', 'love', 'amazing', 'perfect', 'thanks'];
    
    const lowerContent = content.toLowerCase();
    const negativeScore = negativeKeywords.filter(word => lowerContent.includes(word)).length;
    const positiveScore = positiveKeywords.filter(word => lowerContent.includes(word)).length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveScore > negativeScore) sentiment = 'positive';
    else if (negativeScore > positiveScore) sentiment = 'negative';

    const urgencyKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediately'];
    const urgency = Math.min(100, urgencyKeywords.filter(word => lowerContent.includes(word)).length * 30 + Math.random() * 20);

    // Mock category detection
    const categories = ['technical', 'billing', 'account', 'feature_request', 'bug_report'];
    const category = categories[Math.floor(Math.random() * categories.length)];

    return {
      sentiment,
      urgency,
      category,
      suggestedActions: [
        urgency > 70 ? 'Escalate to senior agent' : 'Assign to available agent',
        sentiment === 'negative' ? 'Follow up within 1 hour' : 'Standard response time',
        'Check knowledge base for similar issues'
      ],
      duplicateTickets: [
        `TICK-${Math.floor(Math.random() * 1000)}`,
        `TICK-${Math.floor(Math.random() * 1000)}`
      ].slice(0, Math.random() > 0.7 ? 2 : 0),
      estimatedResolutionTime: Math.floor(Math.random() * 48) + 1,
      requiredExpertise: category === 'technical' ? ['backend', 'api'] : ['customer_service']
    };
  }

  private async performRealTicketAnalysis(content: string, context: any): Promise<TicketAnalysis> {
    if (!process.env.OPENAI_API_KEY) {
      return this.mockTicketAnalysis('real', content);
    }

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that analyzes customer support tickets. Analyze the ticket content and provide a JSON response with the following structure:
            {
              "sentiment": "positive|neutral|negative",
              "urgency": 0-100,
              "category": "technical|billing|account|feature_request|bug_report",
              "suggestedActions": ["action1", "action2"],
              "duplicateTickets": ["TICK-123", "TICK-456"],
              "estimatedResolutionTime": 1-48,
              "requiredExpertise": ["expertise1", "expertise2"]
            }`
          },
          {
            role: "user",
            content: `Analyze this ticket: ${content}\n\nContext: ${JSON.stringify(context)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        try {
          return JSON.parse(response);
        } catch {
          // Fallback to mock if JSON parsing fails
          return this.mockTicketAnalysis('real', content);
        }
      }
      
      return this.mockTicketAnalysis('real', content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.mockTicketAnalysis('real', content);
    }
  }

  async predictSLABreachBulk(tickets: any[]): Promise<SLAPrediction[]> {
    try {
      return tickets.map(ticket => {
        const age = (Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60); // hours
        const slaHours = ticket.slaHours || 24;
        const remainingTime = slaHours - age;
        
        // Mock prediction algorithm
        let breachProbability = 0;
        const riskFactors: string[] = [];
        
        if (remainingTime < 2) {
          breachProbability = 95;
          riskFactors.push('Less than 2 hours remaining');
        } else if (remainingTime < 4) {
          breachProbability = 75;
          riskFactors.push('Less than 4 hours remaining');
        } else if (remainingTime < 8) {
          breachProbability = 45;
          riskFactors.push('Less than 8 hours remaining');
        } else {
          breachProbability = 15;
        }

        if (ticket.priority === 'high' || ticket.priority === 'critical') {
          breachProbability += 20;
          riskFactors.push('High priority ticket');
        }

        if (!ticket.assigneeId) {
          breachProbability += 15;
          riskFactors.push('Unassigned ticket');
        }

        if (ticket.customerTier === 'enterprise') {
          breachProbability += 10;
          riskFactors.push('Enterprise customer');
        }

        const recommendedActions: string[] = [];
        if (breachProbability > 70) {
          recommendedActions.push('Immediate escalation required');
          recommendedActions.push('Notify manager');
        } else if (breachProbability > 40) {
          recommendedActions.push('Assign to senior agent');
          recommendedActions.push('Increase priority');
        } else {
          recommendedActions.push('Monitor closely');
        }

        return {
          ticketId: ticket.id,
          breachProbability: Math.min(100, breachProbability),
          timeToBreachHours: Math.max(0, remainingTime),
          riskFactors,
          recommendedActions
        };
      });
    } catch (error) {
      console.error('❌ SLA prediction failed:', error);
      return [];
    }
  }

  async analyzeCustomerBehavior(customerId: string, tickets: any[]): Promise<CustomerInsight> {
    try {
      // Mock customer behavior analysis
      const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
      const avgResolutionTime = resolvedTickets.length > 0 
        ? resolvedTickets.reduce((sum, ticket) => {
            const resolutionTime = (new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);
            return sum + resolutionTime;
          }, 0) / resolvedTickets.length
        : 24;

      const escalatedTickets = tickets.filter(t => t.escalated);
      const escalationRate = tickets.length > 0 ? (escalatedTickets.length / tickets.length) * 100 : 0;

      // Analyze response patterns
      const responseTimePatterns = tickets.map(t => {
        const firstResponse = t.responses?.[0];
        if (firstResponse) {
          return (new Date(firstResponse.createdAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
        }
        return null;
      }).filter(t => t !== null);

      const avgResponseTime = responseTimePatterns.length > 0 
        ? responseTimePatterns.reduce((a, b) => a + b, 0) / responseTimePatterns.length 
        : 0;

      // Mock sentiment analysis on customer responses
      const satisfactionScore = Math.floor(Math.random() * 30) + 70; // 70-100 range
      const churnRisk = escalationRate > 20 ? Math.floor(Math.random() * 40) + 40 : Math.floor(Math.random() * 30) + 10;

      return {
        customerId,
        satisfactionScore,
        churnRisk,
        preferredChannels: ['email', 'chat'],
        responseTimePreference: avgResponseTime < 2 ? 'fast' : avgResponseTime < 8 ? 'standard' : 'flexible',
        complexityPreference: escalationRate < 10 ? 'simple' : 'detailed',
        historicalPatterns: {
          commonIssues: ['account_access', 'billing_inquiry', 'feature_question'],
          averageResolutionTime: avgResolutionTime,
          escalationRate: escalationRate
        }
      };
    } catch (error) {
      console.error('❌ Customer behavior analysis failed:', error);
      return {
        customerId,
        satisfactionScore: 75,
        churnRisk: 25,
        preferredChannels: ['email'],
        responseTimePreference: 'standard',
        complexityPreference: 'simple',
        historicalPatterns: {
          commonIssues: [],
          averageResolutionTime: 24,
          escalationRate: 0
        }
      };
    }
  }

  async suggestKnowledgeArticles(query: string, context: any = {}): Promise<KnowledgeBaseSuggestion[]> {
    try {
      // Mock knowledge base search with relevance scoring
      const mockArticles = [
        {
          id: 'kb001',
          title: 'How to Reset Your Password',
          content: 'Step-by-step guide for password reset...',
          category: 'account',
          tags: ['password', 'reset', 'login']
        },
        {
          id: 'kb002',
          title: 'Billing Cycle Explanation',
          content: 'Understanding your billing cycle...',
          category: 'billing',
          tags: ['billing', 'payment', 'cycle']
        },
        {
          id: 'kb003',
          title: 'API Rate Limits',
          content: 'Information about API rate limiting...',
          category: 'technical',
          tags: ['api', 'limits', 'technical']
        }
      ];

      const queryLower = query.toLowerCase();
      
      return mockArticles
        .map(article => {
          let relevanceScore = 0;
          
          // Title matching
          if (article.title.toLowerCase().includes(queryLower)) {
            relevanceScore += 40;
          }
          
          // Tag matching
          const matchingTags = article.tags.filter(tag => 
            queryLower.includes(tag) || tag.includes(queryLower)
          );
          relevanceScore += matchingTags.length * 20;
          
          // Content matching (simplified)
          if (article.content.toLowerCase().includes(queryLower)) {
            relevanceScore += 15;
          }
          
          // Context matching
          if (context.category && article.category === context.category) {
            relevanceScore += 25;
          }

          return {
            articleId: article.id,
            title: article.title,
            relevanceScore: Math.min(100, relevanceScore + Math.random() * 10),
            section: article.category,
            summary: article.content.substring(0, 150) + '...'
          };
        })
        .filter(suggestion => suggestion.relevanceScore > 20)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);
    } catch (error) {
      console.error('❌ Knowledge base suggestion failed:', error);
      return [];
    }
  }

  async detectSpamOrDuplicates(content: string, recentTickets: any[]): Promise<{
    isSpam: boolean;
    isDuplicate: boolean;
    duplicateTicketId?: string;
    confidence: number;
  }> {
    try {
      // Simple spam detection based on keywords and patterns
      const spamKeywords = ['win money', 'click here', 'free prize', 'congratulations'];
      const spamScore = spamKeywords.filter(keyword => 
        content.toLowerCase().includes(keyword)
      ).length;

      const isSpam = spamScore > 0 || content.length < 10;

      // Duplicate detection using simple similarity
      let isDuplicate = false;
      let duplicateTicketId = undefined;
      let maxSimilarity = 0;

      for (const ticket of recentTickets) {
        const similarity = this.calculateTextSimilarity(content, ticket.description);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          if (similarity > 0.8) {
            isDuplicate = true;
            duplicateTicketId = ticket.id;
          }
        }
      }

      return {
        isSpam,
        isDuplicate,
        duplicateTicketId,
        confidence: Math.max(spamScore * 25, maxSimilarity * 100)
      };
    } catch (error) {
      console.error('❌ Spam/duplicate detection failed:', error);
      return {
        isSpam: false,
        isDuplicate: false,
        confidence: 0
      };
    }
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity implementation
    const words1 = new Set(text1.toLowerCase().split(/\W+/));
    const words2 = new Set(text2.toLowerCase().split(/\W+/));
    
    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  async generateAutoResponse(ticketContent: string, customerHistory: any[]): Promise<{
    suggestedResponse: string;
    confidence: number;
    requiresHumanReview: boolean;
  }> {
    try {
      // Mock auto-response generation
      const commonResponses = [
        {
          trigger: ['password', 'login', 'access'],
          response: 'Thank you for contacting us. For password issues, please visit our self-service portal at [link] or follow the password reset instructions in our knowledge base.',
          confidence: 85
        },
        {
          trigger: ['billing', 'payment', 'invoice'],
          response: 'Thank you for your billing inquiry. I\'ll review your account and get back to you within 2 business hours with detailed information.',
          confidence: 75
        },
        {
          trigger: ['technical', 'error', 'bug'],
          response: 'Thank you for reporting this technical issue. Our engineering team will investigate and provide an update within 24 hours.',
          confidence: 70
        }
      ];

      const contentLower = ticketContent.toLowerCase();
      
      for (const template of commonResponses) {
        const matches = template.trigger.filter(trigger => contentLower.includes(trigger));
        if (matches.length > 0) {
          return {
            suggestedResponse: template.response,
            confidence: template.confidence,
            requiresHumanReview: template.confidence < 80
          };
        }
      }

      return {
        suggestedResponse: 'Thank you for contacting us. We\'ve received your request and will respond shortly.',
        confidence: 50,
        requiresHumanReview: true
      };
    } catch (error) {
      console.error('❌ Auto-response generation failed:', error);
      return {
        suggestedResponse: 'Thank you for contacting us. We\'ll get back to you soon.',
        confidence: 30,
        requiresHumanReview: true
      };
    }
  }

  private async performRealTicketAnalysis(openai: OpenAI, content: string, context: any): Promise<TicketAnalysis> {
    try {
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant specialized in analyzing customer support tickets. Analyze the sentiment, urgency, category, and provide actionable insights. Return JSON format only."
          },
          {
            role: "user",
            content: `Analyze this support ticket: ${content}\n\nContext: ${JSON.stringify(context)}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const aiResponse = JSON.parse(response.choices[0].message.content!);
      
      return {
        sentiment: aiResponse.sentiment || 'neutral',
        urgency: aiResponse.urgency || 50,
        category: aiResponse.category || 'general',
        suggestedActions: aiResponse.suggestedActions || ['Standard response'],
        duplicateTickets: aiResponse.duplicateTickets || [],
        estimatedResolutionTime: aiResponse.estimatedResolutionTime || 24,
        requiredExpertise: aiResponse.requiredExpertise || ['general']
      };
    } catch (error) {
      console.error('❌ OpenAI analysis failed:', error);
      throw error;
    }
  }

  isEnabled(): boolean {
    return this.openaiEnabled;
  }
}

export const aiAdvancedService = new AIAdvancedService();