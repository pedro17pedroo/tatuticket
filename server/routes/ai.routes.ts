import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { aiService } from '../integrations/ai.integration';
import { catchAsync } from '../middlewares/error.middleware';
import { validateBody, validateQuery } from '../middlewares/validation.middleware';

const router = Router();

// Schema para análise de ticket
const analyzeTicketSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1)
});

// Schema para query de insights
const insightsQuerySchema = z.object({
  tenantId: z.string().uuid(),
  timeRange: z.enum(['1d', '7d', '30d', '90d']).default('7d')
});

// POST /api/ai/analyze-ticket - Analisar ticket com IA
router.post('/analyze-ticket', validateBody(analyzeTicketSchema), catchAsync(async (req: Request, res: Response) => {
  const { subject, description } = req.body;
  const analysis = await aiService.analyzeTicket(subject, description);
  res.json(analysis);
}));

// POST /api/ai/suggest-tickets - Sugerir tickets baseado em mensagem
router.post('/suggest-tickets', validateBody(z.object({
  message: z.string().min(1)
})), catchAsync(async (req: Request, res: Response) => {
  const { message } = req.body;
  const suggestions = await aiService.generateTicketSuggestions(message);
  res.json(suggestions);
}));

// POST /api/ai/auto-response - Gerar resposta automática
router.post('/auto-response', validateBody(analyzeTicketSchema), catchAsync(async (req: Request, res: Response) => {
  const { subject, description } = req.body;
  const response = await aiService.generateAutoResponse(subject, description);
  res.json({ response });
}));

// GET /api/ai/insights - Obter insights de IA
router.get('/insights', validateQuery(insightsQuerySchema), catchAsync(async (req: Request, res: Response) => {
  const { tenantId, timeRange } = req.query;
  
  // Mock insights para desenvolvimento - substituir por IA real quando disponível
  const insights = [
    {
      id: '1',
      type: 'prediction',
      title: 'Pico de Tickets Previsto',
      description: 'Baseado no histórico, esperamos um aumento de 35% nos tickets na próxima semana.',
      confidence: 0.85,
      priority: 'medium',
      category: 'volume_prediction',
      createdAt: new Date().toISOString(),
      actionable: true,
      relatedTickets: []
    },
    {
      id: '2',
      type: 'anomaly',
      title: 'Categoria "Bug" em Alta',
      description: 'Tickets de bug aumentaram 120% nas últimas 48h. Possível problema na última release.',
      confidence: 0.92,
      priority: 'high',
      category: 'category_anomaly',
      createdAt: new Date().toISOString(),
      actionable: true,
      relatedTickets: ['TT-2024-001', 'TT-2024-002']
    },
    {
      id: '3',
      type: 'recommendation',
      title: 'Expandir Equipe de Suporte',
      description: 'Com base na tendência atual, recomendamos adicionar 2 agentes para manter o SLA.',
      confidence: 0.78,
      priority: 'medium',
      category: 'resource_planning',
      createdAt: new Date().toISOString(),
      actionable: true,
      relatedTickets: []
    }
  ];
  
  res.json(insights);
}));

// GET /api/ai/predictive-analytics - Análises preditivas
router.get('/predictive-analytics', validateQuery(insightsQuerySchema), catchAsync(async (req: Request, res: Response) => {
  const { tenantId, timeRange } = req.query;
  
  // Mock data para desenvolvimento
  const analyticsData = {
    ticketVolumeNext7Days: {
      predicted: 145,
      current: 108,
      trend: 'increase',
      confidence: 0.83
    },
    slaRiskTickets: {
      count: 3,
      tickets: [
        {
          id: '1',
          number: 'TT-2024-015',
          subject: 'Sistema de pagamentos offline',
          riskLevel: 85,
          timeToDeadline: 180 // minutes
        },
        {
          id: '2', 
          number: 'TT-2024-018',
          subject: 'Erro ao exportar relatórios',
          riskLevel: 72,
          timeToDeadline: 420 // minutes
        }
      ]
    },
    categoryTrends: [
      {
        category: 'Technical Issues',
        trend: 'increasing',
        change: 15.5,
        ticketsCount: 42
      },
      {
        category: 'Billing Questions',
        trend: 'stable',
        change: -2.1,
        ticketsCount: 28
      },
      {
        category: 'Feature Requests', 
        trend: 'decreasing',
        change: -8.3,
        ticketsCount: 19
      }
    ],
    customerSatisfaction: {
      predicted: 0.89,
      current: 0.86,
      factorsInfluencing: ['Response Time', 'First Contact Resolution', 'Agent Knowledge']
    }
  };
  
  res.json(analyticsData);
}));

// GET /api/ai/sentiment-analysis - Análise de sentimento
router.get('/sentiment-analysis', validateQuery(insightsQuerySchema), catchAsync(async (req: Request, res: Response) => {
  const { tenantId, timeRange } = req.query;
  
  // Mock sentiment data
  const sentimentData = {
    overall: {
      score: 0.78,
      trend: 'stable'
    },
    positive: 65,
    neutral: 28,
    negative: 7
  };
  
  res.json(sentimentData);
}));

export default router;