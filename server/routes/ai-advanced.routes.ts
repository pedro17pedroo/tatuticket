import { Router, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validateBody, catchAsync } from '../middlewares';
import { z } from 'zod';
import { aiAdvancedService } from '../services/ai-advanced.service';

const router = Router();

// Schemas for validation
const analyzeTicketSchema = z.object({
  ticketId: z.string(),
  content: z.string(),
  context: z.object({
    priority: z.string().optional(),
    category: z.string().optional(),
    customerTier: z.string().optional()
  }).optional()
});

const predictSLASchema = z.object({
  tickets: z.array(z.object({
    id: z.string(),
    createdAt: z.string(),
    priority: z.string(),
    slaHours: z.number().optional(),
    assigneeId: z.string().optional(),
    customerTier: z.string().optional()
  }))
});

const customerAnalysisSchema = z.object({
  customerId: z.string(),
  tickets: z.array(z.object({
    id: z.string(),
    status: z.string(),
    createdAt: z.string(),
    resolvedAt: z.string().optional(),
    escalated: z.boolean().optional(),
    responses: z.array(z.object({
      createdAt: z.string()
    })).optional()
  }))
});

const knowledgeSuggestionSchema = z.object({
  query: z.string(),
  context: z.object({
    category: z.string().optional(),
    priority: z.string().optional(),
    ticketId: z.string().optional()
  }).optional()
});

const spamDetectionSchema = z.object({
  content: z.string(),
  recentTickets: z.array(z.object({
    id: z.string(),
    description: z.string(),
    createdAt: z.string()
  }))
});

const autoResponseSchema = z.object({
  ticketContent: z.string(),
  customerHistory: z.array(z.object({
    id: z.string(),
    content: z.string(),
    resolution: z.string().optional()
  }))
});

// POST /api/ai-advanced/analyze-ticket - Analyze ticket content
router.post('/analyze-ticket', 
  authenticateToken, 
  validateBody(analyzeTicketSchema), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const { ticketId, content, context } = req.body;
      
      const analysis = await aiAdvancedService.analyzeTicket(ticketId, content, context);
      
      res.json({
        success: true,
        analysis
      });
    } catch (error) {
      console.error('Error analyzing ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze ticket'
      });
    }
  })
);

// POST /api/ai-advanced/predict-sla-breach - Predict SLA breaches
router.post('/predict-sla-breach', 
  authenticateToken, 
  validateBody(predictSLASchema), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const { tickets } = req.body;
      
      const predictions = await aiAdvancedService.predictSLABreach(tickets);
      
      res.json({
        success: true,
        predictions
      });
    } catch (error) {
      console.error('Error predicting SLA breaches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to predict SLA breaches'
      });
    }
  })
);

// POST /api/ai-advanced/analyze-customer - Analyze customer behavior
router.post('/analyze-customer', 
  authenticateToken, 
  validateBody(customerAnalysisSchema), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const { customerId, tickets } = req.body;
      
      const insights = await aiAdvancedService.analyzeCustomerBehavior(customerId, tickets);
      
      res.json({
        success: true,
        insights
      });
    } catch (error) {
      console.error('Error analyzing customer behavior:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze customer behavior'
      });
    }
  })
);

// POST /api/ai-advanced/suggest-knowledge - Suggest knowledge base articles
router.post('/suggest-knowledge', 
  authenticateToken, 
  validateBody(knowledgeSuggestionSchema), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const { query, context } = req.body;
      
      const suggestions = await aiAdvancedService.suggestKnowledgeArticles(query, context);
      
      res.json({
        success: true,
        suggestions
      });
    } catch (error) {
      console.error('Error suggesting knowledge articles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suggest knowledge articles'
      });
    }
  })
);

// POST /api/ai-advanced/detect-spam - Detect spam or duplicate tickets
router.post('/detect-spam', 
  authenticateToken, 
  validateBody(spamDetectionSchema), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const { content, recentTickets } = req.body;
      
      const detection = await aiAdvancedService.detectSpamOrDuplicates(content, recentTickets);
      
      res.json({
        success: true,
        detection
      });
    } catch (error) {
      console.error('Error detecting spam/duplicates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to detect spam or duplicates'
      });
    }
  })
);

// POST /api/ai-advanced/auto-response - Generate automatic response
router.post('/auto-response', 
  authenticateToken, 
  validateBody(autoResponseSchema), 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const { ticketContent, customerHistory } = req.body;
      
      const response = await aiAdvancedService.generateAutoResponse(ticketContent, customerHistory);
      
      res.json({
        success: true,
        response
      });
    } catch (error) {
      console.error('Error generating auto-response:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate auto-response'
      });
    }
  })
);

// GET /api/ai-advanced/patterns - Get AI-detected patterns and insights
router.get('/patterns', 
  authenticateToken, 
  catchAsync(async (req: AuthRequest, res: Response) => {
    try {
      const { period = '30d' } = req.query;
      
      // Mock pattern detection results
      const patterns = {
        ticketVolumePatterns: {
          dailyAverage: 45,
          peakHours: ['10:00', '14:00', '16:00'],
          peakDays: ['Monday', 'Tuesday'],
          seasonalTrends: [
            { month: 'Jan', volume: 1200, trend: 'increasing' },
            { month: 'Feb', volume: 1350, trend: 'increasing' },
            { month: 'Mar', volume: 1280, trend: 'stable' }
          ]
        },
        categoryPatterns: {
          mostCommon: [
            { category: 'technical', percentage: 35, trend: 'increasing' },
            { category: 'billing', percentage: 28, trend: 'stable' },
            { category: 'account', percentage: 22, trend: 'decreasing' },
            { category: 'feature_request', percentage: 15, trend: 'stable' }
          ],
          emergingIssues: [
            { issue: 'API timeout errors', count: 23, growth: 145 },
            { issue: 'Mobile app crashes', count: 18, growth: 89 }
          ]
        },
        resolutionPatterns: {
          averageTime: {
            overall: 18.5,
            byCategory: [
              { category: 'technical', hours: 24.2 },
              { category: 'billing', hours: 12.8 },
              { category: 'account', hours: 6.5 }
            ]
          },
          escalationTriggers: [
            'No response after 24 hours',
            'Customer mentions cancellation',
            'Multiple failed resolution attempts'
          ]
        },
        customerBehaviorPatterns: {
          communicationPreferences: [
            { channel: 'email', percentage: 65 },
            { channel: 'chat', percentage: 25 },
            { channel: 'phone', percentage: 10 }
          ],
          satisfactionCorrelations: [
            { factor: 'First response time < 2h', impact: '+15% satisfaction' },
            { factor: 'Resolution in 1 business day', impact: '+25% satisfaction' },
            { factor: 'Agent knowledge rating > 4.5', impact: '+20% satisfaction' }
          ]
        },
        predictiveInsights: {
          riskAlerts: [
            {
              type: 'churn_risk',
              description: 'Customer #C123 showing high churn indicators',
              confidence: 87,
              recommended_action: 'Schedule proactive outreach call'
            },
            {
              type: 'sla_breach',
              description: '5 tickets likely to breach SLA in next 4 hours',
              confidence: 92,
              recommended_action: 'Redistribute workload to available agents'
            }
          ],
          opportunityAlerts: [
            {
              type: 'upsell_opportunity',
              description: 'Customer #C456 asking about enterprise features',
              confidence: 78,
              recommended_action: 'Connect with sales team'
            }
          ]
        }
      };
      
      res.json({
        success: true,
        patterns,
        period,
        generatedAt: new Date()
      });
    } catch (error) {
      console.error('Error getting AI patterns:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get AI patterns'
      });
    }
  })
);

export default router;