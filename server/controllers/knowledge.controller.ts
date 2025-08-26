import { Router, Request, Response } from 'express';
import { knowledgeService } from '../services/knowledge.service';
import { validateBody, authenticateToken as requireAuth, requireTenant as requireTenantAccess } from '../middlewares';
import { 
  insertKnowledgeArticleSchema, 
  insertArticleVersionSchema,
  insertApprovalWorkflowSchema 
} from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Validation schemas
const updateArticleSchema = insertKnowledgeArticleSchema.partial().extend({
  changeNote: z.string().optional(),
});

const approvalActionSchema = z.object({
  comment: z.string().optional(),
});

// GET /api/knowledge-articles - Get articles by tenant
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const articles = await knowledgeService.getArticlesByTenant(tenantId);
    res.json(articles);
  } catch (error) {
    console.error('Failed to fetch knowledge articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/knowledge-articles/:id - Get single article
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const article = await knowledgeService.getArticleById(id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check tenant access
    if (article.tenantId !== req.user?.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment view count for published articles
    if (article.status === 'published') {
      await knowledgeService.incrementViews(id);
    }

    res.json(article);
  } catch (error) {
    console.error('Failed to fetch knowledge article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/knowledge-articles - Create new article
router.post(
  '/', 
  requireAuth, 
  validateBody(insertKnowledgeArticleSchema), 
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;
      
      if (!userId || !tenantId) {
        return res.status(400).json({ error: 'User ID and Tenant ID required' });
      }

      const articleData = {
        ...req.body,
        tenantId,
        authorId: userId,
      };

      const article = await knowledgeService.createArticle(articleData, userId);
      res.status(201).json(article);
    } catch (error) {
      console.error('Failed to create knowledge article:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/knowledge-articles/:id - Update article
router.put(
  '/:id',
  requireAuth,
  validateBody(updateArticleSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { changeNote, ...updates } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      // Verify article exists and user has access
      const existingArticle = await knowledgeService.getArticleById(id);
      if (!existingArticle) {
        return res.status(404).json({ error: 'Article not found' });
      }

      if (existingArticle.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const article = await knowledgeService.updateArticle(id, updates, userId, changeNote);
      
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      res.json(article);
    } catch (error) {
      console.error('Failed to update knowledge article:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/knowledge-articles/:id - Delete (archive) article
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Verify article exists and user has access
    const existingArticle = await knowledgeService.getArticleById(id);
    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (existingArticle.tenantId !== req.user?.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const success = await knowledgeService.deleteArticle(id, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete knowledge article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/knowledge-articles/:id/publish - Publish article
router.put('/:id/publish', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Verify article exists and user has access
    const existingArticle = await knowledgeService.getArticleById(id);
    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (existingArticle.tenantId !== req.user?.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const article = await knowledgeService.publishArticle(id, userId);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Failed to publish knowledge article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/knowledge-articles/:id/versions - Get article versions
router.get('/:id/versions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify article exists and user has access
    const existingArticle = await knowledgeService.getArticleById(id);
    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (existingArticle.tenantId !== req.user?.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const versions = await knowledgeService.getArticleVersions(id);
    res.json(versions);
  } catch (error) {
    console.error('Failed to fetch article versions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/knowledge-articles/:id/submit-for-approval - Submit article for approval
router.post('/:id/submit-for-approval', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      return res.status(400).json({ error: 'User ID and Tenant ID required' });
    }

    // Verify article exists and user has access
    const existingArticle = await knowledgeService.getArticleById(id);
    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (existingArticle.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const workflow = await knowledgeService.submitForApproval(id, userId, tenantId);
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Failed to submit article for approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/approval-workflows - Get approval workflows
router.get('/approval-workflows', requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { status } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const workflows = await knowledgeService.getApprovalWorkflows(
      tenantId,
      status as string
    );
    
    res.json(workflows);
  } catch (error) {
    console.error('Failed to fetch approval workflows:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/approval-workflows/:id/approve - Approve article
router.post(
  '/approval-workflows/:id/approve',
  requireAuth,
  validateBody(approvalActionSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const approverId = req.user?.id;

      if (!approverId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      // TODO: Add RBAC check for approval permissions
      const workflow = await knowledgeService.approveArticle(id, approverId, comment);
      
      if (!workflow) {
        return res.status(404).json({ error: 'Approval workflow not found or already processed' });
      }

      res.json(workflow);
    } catch (error) {
      console.error('Failed to approve article:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/approval-workflows/:id/reject - Reject article
router.post(
  '/approval-workflows/:id/reject',
  requireAuth,
  validateBody(approvalActionSchema.extend({ comment: z.string().min(1) })),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const approverId = req.user?.id;

      if (!approverId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      // TODO: Add RBAC check for approval permissions
      const workflow = await knowledgeService.rejectArticle(id, approverId, comment);
      
      if (!workflow) {
        return res.status(404).json({ error: 'Approval workflow not found or already processed' });
      }

      res.json(workflow);
    } catch (error) {
      console.error('Failed to reject article:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;