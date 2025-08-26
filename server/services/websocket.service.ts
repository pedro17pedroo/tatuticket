import { Server, type IncomingMessage, type ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import url from 'url';
import { storage } from '../storage';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  tenantId?: string;
  isAuthenticated?: boolean;
}

interface NotificationMessage {
  type: string;
  id?: string;
  title: string;
  message: string;
  actionUrl?: string;
  showToast?: boolean;
  metadata?: Record<string, any>;
}

class WebSocketNotificationService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private tenantClients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/notifications',
      verifyClient: this.verifyClient.bind(this),
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('📡 WebSocket notification service initialized');
  }

  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): boolean {
    try {
      const query = url.parse(info.req.url || '', true).query;
      const token = query.token as string;

      if (!token) {
        return false;
      }

      const secret = process.env.JWT_SECRET || 'fallback-secret';
      jwt.verify(token, secret);
      return true;
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      return false;
    }
  }

  private async handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage): Promise<void> {
    try {
      const query = url.parse(request.url || '', true).query;
      const token = query.token as string;

      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }

      // Verify and decode token
      const secret = process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(token, secret) as any;
      
      ws.userId = decoded.id;
      ws.tenantId = decoded.tenantId;
      ws.isAuthenticated = true;

      // Store client reference
      this.addClient(ws);

      // Handle disconnection
      ws.on('close', () => {
        this.removeClient(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClient(ws);
      });

      // Send connection confirmation
      this.sendToClient(ws, {
        type: 'connection_established',
        title: 'Conectado',
        message: 'Conexão com notificações estabelecida',
        showToast: false,
      });

      console.log(`WebSocket client connected: User ${ws.userId}, Tenant ${ws.tenantId}`);
    } catch (error) {
      console.error('Failed to handle WebSocket connection:', error);
      ws.close(1011, 'Authentication failed');
    }
  }

  private addClient(ws: AuthenticatedWebSocket): void {
    if (!ws.userId || !ws.tenantId) return;

    // Add to user-specific clients
    if (!this.clients.has(ws.userId)) {
      this.clients.set(ws.userId, new Set());
    }
    this.clients.get(ws.userId)!.add(ws);

    // Add to tenant-specific clients
    if (!this.tenantClients.has(ws.tenantId)) {
      this.tenantClients.set(ws.tenantId, new Set());
    }
    this.tenantClients.get(ws.tenantId)!.add(ws);
  }

  private removeClient(ws: AuthenticatedWebSocket): void {
    if (!ws.userId || !ws.tenantId) return;

    // Remove from user-specific clients
    const userClients = this.clients.get(ws.userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        this.clients.delete(ws.userId);
      }
    }

    // Remove from tenant-specific clients
    const tenantClients = this.tenantClients.get(ws.tenantId);
    if (tenantClients) {
      tenantClients.delete(ws);
      if (tenantClients.size === 0) {
        this.tenantClients.delete(ws.tenantId);
      }
    }

    console.log(`WebSocket client disconnected: User ${ws.userId}, Tenant ${ws.tenantId}`);
  }

  private sendToClient(ws: AuthenticatedWebSocket, message: NotificationMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Send notification to specific user
  async notifyUser(userId: string, notification: NotificationMessage): Promise<void> {
    // Store notification in database first
    try {
      await storage.createNotification({
        userId,
        type: notification.type || 'info',
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        metadata: notification.metadata ? JSON.stringify(notification.metadata) : null,
        isRead: false,
      });
    } catch (error) {
      console.error('Failed to store notification:', error);
    }

    // Send to connected clients
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach(client => {
        this.sendToClient(client, {
          ...notification,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      });
    }
  }

  // Send notification to all users in a tenant
  async notifyTenant(tenantId: string, notification: NotificationMessage, excludeUserId?: string): Promise<void> {
    const tenantClients = this.tenantClients.get(tenantId);
    if (!tenantClients) return;

    const notificationWithId = {
      ...notification,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Send to all connected clients in tenant
    tenantClients.forEach(client => {
      if (excludeUserId && client.userId === excludeUserId) return;
      
      // Store notification for each user
      if (client.userId) {
        storage.createNotification({
          userId: client.userId,
          type: notification.type || 'info',
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
          metadata: notification.metadata ? JSON.stringify(notification.metadata) : null,
          isRead: false,
        }).catch(error => console.error('Failed to store notification:', error));
      }

      this.sendToClient(client, notificationWithId);
    });
  }

  // Broadcast system-wide notification (admin only)
  async broadcastSystemNotification(notification: NotificationMessage): Promise<void> {
    const notificationWithId = {
      ...notification,
      id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Send to all connected clients
    this.clients.forEach((clientSet) => {
      clientSet.forEach(client => {
        // Store notification for each user
        if (client.userId) {
          storage.createNotification({
            userId: client.userId,
            type: notification.type || 'info',
            title: notification.title,
            message: notification.message,
            actionUrl: notification.actionUrl,
            metadata: notification.metadata ? JSON.stringify(notification.metadata) : null,
            isRead: false,
          }).catch(error => console.error('Failed to store notification:', error));
        }

        this.sendToClient(client, notificationWithId);
      });
    });
  }

  // Get connection stats for monitoring
  getStats(): { totalClients: number; tenants: number; users: number } {
    return {
      totalClients: Array.from(this.clients.values()).reduce((sum, set) => sum + set.size, 0),
      tenants: this.tenantClients.size,
      users: this.clients.size,
    };
  }

  // Send heartbeat to check connection health
  sendHeartbeat(): void {
    this.clients.forEach((clientSet) => {
      clientSet.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.ping();
        } else {
          this.removeClient(client);
        }
      });
    });
  }
}

export const websocketService = new WebSocketNotificationService();