import { useState, useEffect } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  installPrompt: any;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
}

export function usePWA() {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: !navigator.onLine,
    installPrompt: null,
    serviceWorkerRegistration: null
  });

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInApp = (window.navigator as any).standalone === true;
    
    setPwaState(prev => ({
      ...prev,
      isInstalled: isStandalone || isInApp
    }));

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e
      }));
    };

    // Handle successful installation
    const handleAppInstalled = () => {
      setPwaState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null
      }));
    };

    // Handle online/offline status
    const handleOnline = () => {
      setPwaState(prev => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setPwaState(prev => ({ ...prev, isOffline: true }));
    };

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered');
          setPwaState(prev => ({
            ...prev,
            serviceWorkerRegistration: registration
          }));
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (pwaState.installPrompt) {
      pwaState.installPrompt.prompt();
      const { outcome } = await pwaState.installPrompt.userChoice;
      console.log('[PWA] Install result:', outcome);
      
      setPwaState(prev => ({
        ...prev,
        installPrompt: null,
        isInstallable: outcome === 'accepted'
      }));
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        ...options
      });
    }
  };

  return {
    ...pwaState,
    installApp,
    requestNotificationPermission,
    showNotification
  };
}