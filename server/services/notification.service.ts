import { storage } from '../storage';
import { websocketService } from './websocket.service';
import { 
  type Notification, 
  type InsertNotification, 
  type NotificationSettings, 
  type InsertNotificationSettings 
} from '@shared/schema';

export interface NotificationPayload {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  channels?: ('websocket' | 'email' | 'push')[];
  showToast?: boolean;
}

class NotificationService {
  // Create and send notification
  async createNotification(
    userId: string,
    tenantId: string,
    payload: NotificationPayload
  ): Promise<Notification> {
    // Store notification in database
    const notification = await storage.createNotification({
      userId,
      tenantId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      actionUrl: payload.actionUrl,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
      isRead: false,
    });

    // Get user notification settings
    const settings = await this.getUserSettings(userId);
    const channels = payload.channels || ['websocket'];

    // Send via WebSocket if enabled
    if (channels.includes('websocket') && settings.pushEnabled) {
      await websocketService.notifyUser(userId, {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        actionUrl: payload.actionUrl,
        showToast: payload.showToast !== false,
        metadata: payload.metadata,
      });
    }

    // TODO: Send via email if enabled
    if (channels.includes('email') && settings.emailEnabled) {
      // await emailService.sendNotification(userId, payload);
      console.log(`Email notification queued for user ${userId}`);
    }

    // TODO: Send push notification if enabled
    if (channels.includes('push') && settings.pushEnabled) {
      // await pushService.sendNotification(userId, payload);
      console.log(`Push notification queued for user ${userId}`);
    }

    return notification;
  }

  // Send notification to multiple users
  async notifyMultipleUsers(
    userIds: string[],
    tenantId: string,
    payload: NotificationPayload
  ): Promise<Notification[]> {
    const notifications = await Promise.all(
      userIds.map(userId => this.createNotification(userId, tenantId, payload))
    );
    return notifications;
  }

  // Send tenant-wide notification
  async notifyTenant(
    tenantId: string,
    payload: NotificationPayload,
    excludeUserId?: string
  ): Promise<void> {
    // Get all users in tenant
    const users = await storage.getUsersByTenant(tenantId);
    const userIds = users
      .filter(user => user.id !== excludeUserId)
      .map(user => user.id);

    // Send notifications to all users
    await this.notifyMultipleUsers(userIds, tenantId, payload);
  }

  // System-wide notification (admin only)
  async broadcastSystemNotification(payload: NotificationPayload): Promise<void> {
    await websocketService.broadcastSystemNotification({
      type: payload.type,
      title: payload.title,
      message: payload.message,
      actionUrl: payload.actionUrl,
      showToast: payload.showToast !== false,
      metadata: payload.metadata,
    });
  }

  // Get notifications for user
  async getUserNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ): Promise<Notification[]> {
    return await storage.getNotifications(userId, options);
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    return await storage.markNotificationAsRead(notificationId, userId);
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: string): Promise<number> {
    return await storage.markAllNotificationsAsRead(userId);
  }

  // Get unread count for user
  async getUnreadCount(userId: string): Promise<number> {
    return await storage.getUnreadNotificationCount(userId);
  }

  // Notification settings management
  async getUserSettings(userId: string): Promise<NotificationSettings> {
    const settings = await storage.getNotificationSettings(userId);
    
    // Return default settings if none exist
    if (!settings) {
      return {
        id: '',
        userId,
        pushEnabled: false,
        emailEnabled: true,
        ticketUpdates: true,
        systemAlerts: true,
        slaBreaches: true,
        approvalRequests: true,
        mentions: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return settings;
  }

  async updateUserSettings(
    userId: string,
    updates: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    const existingSettings = await storage.getNotificationSettings(userId);

    if (existingSettings) {
      return await storage.updateNotificationSettings(userId, updates);
    } else {
      // Create new settings
      return await storage.createNotificationSettings({
        userId,
        pushEnabled: false,
        emailEnabled: true,
        ticketUpdates: true,
        systemAlerts: true,
        slaBreaches: true,
        approvalRequests: true,
        mentions: true,
        ...updates,
      });
    }
  }

  // Contextual notifications for different events
  async notifyTicketUpdate(
    ticketId: string,
    tenantId: string,
    updateType: 'created' | 'updated' | 'assigned' | 'resolved',
    actorUserId: string,
    targetUserIds: string[],
    metadata: Record<string, any>
  ): Promise<void> {
    const titles = {
      created: 'Novo Ticket Criado',
      updated: 'Ticket Atualizado',
      assigned: 'Ticket Atribuído',
      resolved: 'Ticket Resolvido',
    };

    const payload: NotificationPayload = {
      type: updateType === 'resolved' ? 'success' : 'info',
      title: titles[updateType],
      message: `Ticket #${metadata.ticketNumber} foi ${updateType === 'created' ? 'criado' : 'atualizado'}`,
      actionUrl: `/tickets/${ticketId}`,
      metadata: { ticketId, updateType, ...metadata },
      channels: ['websocket', 'email'],
    };

    await this.notifyMultipleUsers(targetUserIds, tenantId, payload);
  }

  async notifyKnowledgeArticleAction(
    articleId: string,
    tenantId: string,
    action: 'published' | 'submitted_for_approval' | 'approved' | 'rejected',
    actorUserId: string,
    targetUserIds: string[],
    metadata: Record<string, any>
  ): Promise<void> {
    const titles = {
      published: 'Artigo Publicado',
      submitted_for_approval: 'Artigo Enviado para Aprovação',
      approved: 'Artigo Aprovado',
      rejected: 'Artigo Rejeitado',
    };

    const payload: NotificationPayload = {
      type: action === 'approved' || action === 'published' ? 'success' : 
            action === 'rejected' ? 'warning' : 'info',
      title: titles[action],
      message: `Artigo "${metadata.title}" foi ${action.replace('_', ' ')}`,
      actionUrl: `/knowledge/${articleId}`,
      metadata: { articleId, action, ...metadata },
      channels: ['websocket', 'email'],
    };

    await this.notifyMultipleUsers(targetUserIds, tenantId, payload);
  }

  async notifySLABreach(
    ticketId: string,
    tenantId: string,
    breachType: 'response_time' | 'resolution_time',
    assignedUserIds: string[],
    metadata: Record<string, any>
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'error',
      title: 'Quebra de SLA',
      message: `Ticket #${metadata.ticketNumber} quebrou o SLA de ${breachType === 'response_time' ? 'tempo de resposta' : 'tempo de resolução'}`,
      actionUrl: `/tickets/${ticketId}`,
      metadata: { ticketId, breachType, ...metadata },
      channels: ['websocket', 'email'],
      showToast: true,
    };

    await this.notifyMultipleUsers(assignedUserIds, tenantId, payload);
    
    // Trigger webhooks for SLA breach
    try {
      const { triggerWebhooks } = await import('../routes/webhook.routes');
      await triggerWebhooks('sla.breach', {
        ticketId,
        tenantId,
        breachType,
        ticketNumber: metadata.ticketNumber,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to trigger SLA breach webhooks:', error);
    }
  }

  async notifySystemMaintenance(
    title: string,
    message: string,
    scheduledTime: Date,
    duration: string
  ): Promise<void> {
    const payload: NotificationPayload = {
      type: 'warning',
      title,
      message,
      metadata: { scheduledTime, duration, type: 'system_maintenance' },
      channels: ['websocket', 'email'],
      showToast: true,
    };

    await this.broadcastSystemNotification(payload);
  }
}

export const notificationService = new NotificationService();