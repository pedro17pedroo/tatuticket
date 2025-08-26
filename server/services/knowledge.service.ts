import { storage } from '../storage';
import { storage } from '../storage';
import { 
  type KnowledgeArticle, 
  type InsertKnowledgeArticle, 
  type ArticleVersion, 
  type InsertArticleVersion,
  type ApprovalWorkflow,
  type InsertApprovalWorkflow 
} from '@shared/schema';
import DOMPurify from 'isomorphic-dompurify';

export class KnowledgeService {
  // Sanitize HTML content to prevent XSS
  private sanitizeContent(content: string): string {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 
        'tr', 'th', 'td', 'code', 'pre', 'div', 'span'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    });
  }

  // Generate URL-friendly slug from title
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  // Create new knowledge article
  async createArticle(articleData: InsertKnowledgeArticle, userId: string): Promise<KnowledgeArticle> {
    // Sanitize content
    const sanitizedContent = this.sanitizeContent(articleData.content);
    
    // Generate slug if not provided
    const slug = articleData.slug || this.generateSlug(articleData.title);

    const article = await storage.createKnowledgeArticle({
      ...articleData,
      content: sanitizedContent,
      slug,
      authorId: userId,
      version: 1,
    });

    // Create initial version entry
    await this.createVersion(article.id, {
      articleId: article.id,
      version: 1,
      title: article.title,
      content: sanitizedContent,
      authorId: userId,
      changeNote: 'Initial version',
    });

    // Audit log
    await storage.createAuditLog({
      tenantId: article.tenantId,
      userId,
      action: 'knowledge_article_created',
      resourceType: 'knowledge_article',
      resourceId: article.id,
      details: JSON.stringify({ title: article.title, slug: article.slug }),
    });

    return article;
  }

  // Update existing article with versioning
  async updateArticle(
    id: string, 
    updates: Partial<KnowledgeArticle>, 
    userId: string, 
    changeNote?: string
  ): Promise<KnowledgeArticle | null> {
    const existingArticle = await storage.getKnowledgeArticle(id);
    if (!existingArticle) {
      return null;
    }

    // Sanitize content if provided
    if (updates.content) {
      updates.content = this.sanitizeContent(updates.content);
    }

    // Generate new slug if title changed
    if (updates.title && updates.title !== existingArticle.title) {
      updates.slug = this.generateSlug(updates.title);
    }

    // Increment version for content changes
    const newVersion = existingArticle.version + 1;
    updates.version = newVersion;
    updates.updatedAt = new Date();

    // If status changes to pending_approval, reset approval fields
    if (updates.status === 'pending_approval') {
      updates.approvedBy = null;
      updates.approvedAt = null;
    }

    const updatedArticle = await storage.updateKnowledgeArticle(id, updates);
    if (!updatedArticle) {
      return null;
    }

    // Create version snapshot
    await this.createVersion(id, {
      articleId: id,
      version: newVersion,
      title: updatedArticle.title,
      content: updatedArticle.content,
      authorId: userId,
      changeNote: changeNote || `Updated to version ${newVersion}`,
    });

    // Audit log
    await storage.createAuditLog({
      tenantId: updatedArticle.tenantId,
      userId,
      action: 'knowledge_article_updated',
      resourceType: 'knowledge_article',
      resourceId: id,
      details: JSON.stringify({ 
        title: updatedArticle.title,
        version: newVersion,
        changeNote,
        statusChange: updates.status ? { from: existingArticle.status, to: updates.status } : undefined
      }),
    });

    return updatedArticle;
  }

  // Get articles by tenant
  async getArticlesByTenant(tenantId: string): Promise<KnowledgeArticle[]> {
    return await storage.getKnowledgeArticlesByTenant(tenantId);
  }

  // Get single article by ID
  async getArticleById(id: string): Promise<KnowledgeArticle | null> {
    return await storage.getKnowledgeArticle(id);
  }

  // Delete article (soft delete by archiving)
  async deleteArticle(id: string, userId: string): Promise<boolean> {
    const article = await storage.getKnowledgeArticle(id);
    if (!article) {
      return false;
    }

    // Soft delete by archiving
    const updated = await storage.updateKnowledgeArticle(id, { 
      status: 'archived',
      updatedAt: new Date()
    });

    if (updated) {
      // Audit log
      await storage.createAuditLog({
        tenantId: article.tenantId,
        userId,
        action: 'knowledge_article_deleted',
        resourceType: 'knowledge_article',
        resourceId: id,
        details: JSON.stringify({ title: article.title }),
      });
    }

    return !!updated;
  }

  // Publish article (change status to published)
  async publishArticle(id: string, userId: string): Promise<KnowledgeArticle | null> {
    const article = await storage.getKnowledgeArticle(id);
    if (!article) {
      return null;
    }

    const updated = await storage.updateKnowledgeArticle(id, {
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date()
    });

    if (updated) {
      await storage.createAuditLog({
        tenantId: article.tenantId,
        userId,
        action: 'knowledge_article_published',
        resourceType: 'knowledge_article',
        resourceId: id,
        details: JSON.stringify({ title: article.title }),
      });
    }

    return updated;
  }

  // Increment view count
  async incrementViews(id: string): Promise<void> {
    const article = await storage.getKnowledgeArticle(id);
    if (article) {
      await storage.updateKnowledgeArticle(id, {
        viewCount: (article.viewCount || 0) + 1
      });
    }
  }

  // Article versions management
  async createVersion(articleId: string, versionData: InsertArticleVersion): Promise<ArticleVersion> {
    return await storage.createArticleVersion(versionData);
  }

  async getArticleVersions(articleId: string): Promise<ArticleVersion[]> {
    return await storage.getArticleVersions(articleId);
  }

  // Approval workflow management
  async submitForApproval(articleId: string, requesterId: string, tenantId: string): Promise<ApprovalWorkflow> {
    // Update article status
    await storage.updateKnowledgeArticle(articleId, {
      status: 'pending_approval',
      updatedAt: new Date()
    });

    // Create approval workflow
    const workflow = await storage.createApprovalWorkflow({
      resourceType: 'knowledge_article',
      resourceId: articleId,
      tenantId,
      requesterId,
      status: 'pending',
    });

    // Audit log
    await auditService.log({
      tenantId,
      userId: requesterId,
      action: 'knowledge_article_submitted_for_approval',
      resourceType: 'knowledge_article',
      resourceId: articleId,
      details: { workflowId: workflow.id },
    });

    return workflow;
  }

  async approveArticle(
    workflowId: string, 
    approverId: string, 
    comment?: string
  ): Promise<ApprovalWorkflow | null> {
    const workflow = await storage.getApprovalWorkflows(workflowId);
    const workflowRecord = workflow[0];
    
    if (!workflowRecord || workflowRecord.status !== 'pending') {
      return null;
    }

    // Update workflow
    const updatedWorkflow = await storage.updateApprovalWorkflow(workflowId, {
      status: 'approved',
      approverId,
      comment,
    });

    if (updatedWorkflow) {
      // Update article status and approval info
      await storage.updateKnowledgeArticle(workflowRecord.resourceId, {
        status: 'published',
        approvedBy: approverId,
        approvedAt: new Date(),
        publishedAt: new Date(),
        updatedAt: new Date()
      });

      // Audit log
      await auditService.log({
        tenantId: updatedWorkflow.tenantId,
        userId: approverId,
        action: 'knowledge_article_approved',
        resourceType: 'knowledge_article',
        resourceId: workflowRecord.resourceId,
        details: { workflowId, comment },
      });
    }

    return updatedWorkflow;
  }

  async rejectArticle(
    workflowId: string, 
    approverId: string, 
    comment: string
  ): Promise<ApprovalWorkflow | null> {
    const workflow = await storage.getApprovalWorkflows(workflowId);
    const workflowRecord = workflow[0];
    
    if (!workflowRecord || workflowRecord.status !== 'pending') {
      return null;
    }

    // Update workflow
    const updatedWorkflow = await storage.updateApprovalWorkflow(workflowId, {
      status: 'rejected',
      approverId,
      comment,
    });

    if (updatedWorkflow) {
      // Update article status back to draft
      await storage.updateKnowledgeArticle(workflowRecord.resourceId, {
        status: 'draft',
        updatedAt: new Date()
      });

      // Audit log
      await auditService.log({
        tenantId: updatedWorkflow.tenantId,
        userId: approverId,
        action: 'knowledge_article_rejected',
        resourceType: 'knowledge_article',
        resourceId: workflowRecord.resourceId,
        details: { workflowId, comment },
      });
    }

    return updatedWorkflow;
  }

  // Get approval workflows by tenant
  async getApprovalWorkflows(tenantId: string, status?: string): Promise<ApprovalWorkflow[]> {
    return await storage.getApprovalWorkflows(tenantId, status);
  }
}

export const knowledgeService = new KnowledgeService();