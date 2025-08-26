import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";

interface RealTimeNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  showToast?: boolean;
}

export function useNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const user = authService.getCurrentUser();
  const tenantId = authService.getTenantId();

  // Fetch unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['/api/notifications/unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const response = await fetch(`/api/notifications/unread-count?userId=${user.id}`);
      if (!response.ok) return 0;
      const data = await response.json();
      return data.count || 0;
    },
    enabled: !!user,
    refetchInterval: 60000, // Check every minute
  });

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!user || !tenantId) return;

    const connectWebSocket = () => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/notifications?userId=${user.id}&tenantId=${tenantId}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connected to notification WebSocket');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const notification: RealTimeNotification = JSON.parse(event.data);
          
          // Invalidate queries to refresh notification data
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });

          // Show toast notification if requested
          if (notification.showToast !== false) {
            const toastVariant = notification.type === 'error' ? 'destructive' : 'default';
            
            toast({
              title: notification.title,
              description: notification.message,
              variant: toastVariant,
              action: notification.actionUrl ? (
                <button 
                  onClick={() => window.location.href = notification.actionUrl!}
                  className="text-sm underline"
                >
                  Ver detalhes
                </button>
              ) : undefined,
            });
          }

          // Show browser notification if permission granted and page not focused
          if (Notification.permission === 'granted' && document.hidden) {
            const browserNotification = new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              tag: notification.id,
              data: {
                url: notification.actionUrl || '/',
              },
            });

            browserNotification.onclick = () => {
              window.focus();
              if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
              }
              browserNotification.close();
            };

            // Auto-close after 5 seconds
            setTimeout(() => {
              browserNotification.close();
            }, 5000);
          }
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Notification WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, tenantId, queryClient, toast]);

  // Service Worker message handler for push notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'NOTIFICATION_CLICK') {
          // Handle notification click from service worker
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
          
          if (event.data.url) {
            window.location.href = event.data.url;
          }
        }
      });
    }
  }, [queryClient]);

  // Send notification function for other components
  const sendNotification = async (notification: Omit<RealTimeNotification, 'id'>) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...notification,
          userId: user?.id,
          tenantId,
        }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  return {
    unreadCount,
    sendNotification,
  };
}