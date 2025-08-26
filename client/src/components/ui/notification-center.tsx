import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, BellOff, Settings, Check, X, AlertCircle, 
  Info, CheckCircle, XCircle, Clock, User, Ticket 
} from 'lucide-react';
import { authService } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  ticketUpdates: boolean;
  systemAlerts: boolean;
  slaBreaches: boolean;
  approvalRequests: boolean;
  mentions: boolean;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const { toast } = useToast();
  const user = authService.getCurrentUser();
  const tenantId = authService.getTenantId();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch notification settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery<NotificationSettings>({
    queryKey: ['/api/notification-settings', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/notification-settings?userId=${user?.id}`);
      if (!response.ok) {
        // Return default settings if not found
        return {
          pushEnabled: false,
          emailEnabled: true,
          ticketUpdates: true,
          systemAlerts: true,
          slaBreaches: true,
          approvalRequests: true,
          mentions: true,
        };
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notifications/mark-all-read?userId=${user?.id}`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      const response = await fetch('/api/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          ...settings,
          ...newSettings,
        }),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-settings'] });
      toast({ title: "Configurações atualizadas com sucesso!" });
    },
  });

  // Subscribe to push notifications
  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
      });

      // Send subscription to server
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          subscription,
        }),
      });

      if (response.ok) {
        updateSettingsMutation.mutate({ pushEnabled: true });
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      toast({
        title: "Erro ao ativar notificações push",
        description: "Verifique se as notificações estão permitidas no navegador.",
        variant: "destructive",
      });
    }
  };

  // Request notification permission
  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      await subscribeToPush();
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="relative"
          data-testid="button-notifications"
        >
          {settings?.pushEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notification Panel */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Notificações</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                data-testid="button-notification-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {unreadCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  data-testid="button-mark-all-read"
                >
                  Marcar todas como lidas
                </Button>
              </div>
            )}

            <Separator />

            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        !notification.isRead ? 'ring-2 ring-blue-100' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notification.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações de Notificação</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Push Notifications */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notificações Push</h4>
              
              {notificationPermission === 'default' && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-blue-800 mb-3">
                      Ative as notificações push para receber alertas importantes mesmo quando não estiver usando o sistema.
                    </p>
                    <Button onClick={requestPermission} size="sm">
                      Permitir Notificações
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {notificationPermission === 'denied' && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-red-800">
                      As notificações foram bloqueadas. Para ativar, clique no ícone de cadeado na barra de endereços e permita notificações.
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {notificationPermission === 'granted' && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushEnabled">Notificações Push</Label>
                  <Switch
                    id="pushEnabled"
                    checked={settings?.pushEnabled || false}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ pushEnabled: checked })
                    }
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Email Notifications */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notificações por Email</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="emailEnabled">Receber por email</Label>
                <Switch
                  id="emailEnabled"
                  checked={settings?.emailEnabled || false}
                  onCheckedChange={(checked) => 
                    updateSettingsMutation.mutate({ emailEnabled: checked })
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Notification Types */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Tipos de Notificação</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ticketUpdates">Atualizações de tickets</Label>
                  <Switch
                    id="ticketUpdates"
                    checked={settings?.ticketUpdates || false}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ ticketUpdates: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="systemAlerts">Alertas do sistema</Label>
                  <Switch
                    id="systemAlerts"
                    checked={settings?.systemAlerts || false}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ systemAlerts: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="slaBreaches">Quebras de SLA</Label>
                  <Switch
                    id="slaBreaches"
                    checked={settings?.slaBreaches || false}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ slaBreaches: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="approvalRequests">Solicitações de aprovação</Label>
                  <Switch
                    id="approvalRequests"
                    checked={settings?.approvalRequests || false}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ approvalRequests: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="mentions">Menções e marcações</Label>
                  <Switch
                    id="mentions"
                    checked={settings?.mentions || false}
                    onCheckedChange={(checked) => 
                      updateSettingsMutation.mutate({ mentions: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setIsSettingsOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}