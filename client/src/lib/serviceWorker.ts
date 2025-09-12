// Service Worker Registration and Management

// Check if service workers are supported
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// Register the service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) {
    console.warn('Service Workers are not supported in this browser');
    return null;
  }

  try {
    console.log('Registering service worker...');
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully:', registration);

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        console.log('New service worker found, installing...');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New service worker is available
              console.log('New service worker installed, ready to take control');
              
              // Optionally show a notification to the user
              showUpdateAvailableNotification();
            } else {
              // Service worker is controlling the page for the first time
              console.log('Service worker is now controlling the page');
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Unregister the service worker (if needed for debugging)
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    }
    return false;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
};

// Check if the app is running as a PWA
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         // @ts-ignore
         window.navigator.standalone === true;
};

// Check if the app can be installed
export const canInstallPWA = (): boolean => {
  // This will be set by the beforeinstallprompt event
  return !!(window as any).deferredPrompt;
};

// Trigger PWA installation
export const installPWA = async (): Promise<boolean> => {
  const deferredPrompt = (window as any).deferredPrompt;
  
  if (!deferredPrompt) {
    console.log('PWA installation prompt not available');
    return false;
  }

  try {
    // Show the installation prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`PWA installation outcome: ${outcome}`);
    
    // Clear the deferred prompt
    (window as any).deferredPrompt = null;
    
    return outcome === 'accepted';
  } catch (error) {
    console.error('PWA installation failed:', error);
    return false;
  }
};

// Show update available notification
const showUpdateAvailableNotification = (): void => {
  // This could be integrated with your toast system
  console.log('App update available! Refresh to get the latest version.');
  
  // For now, we'll just log it. In a real app, you might show a toast notification
  // or a banner asking the user to refresh the page
};

// Listen for the beforeinstallprompt event
export const setupPWAInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (event) => {
    console.log('PWA install prompt available');
    
    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault();
    
    // Save the event so it can be triggered later
    (window as any).deferredPrompt = event;
    
    // Optionally show your own install button or banner
    console.log('PWA can be installed');
  });

  // Listen for successful PWA installation
  window.addEventListener('appinstalled', () => {
    console.log('PWA was successfully installed');
    (window as any).deferredPrompt = null;
  });
};

// Check network status and handle offline/online events
export const setupNetworkStatusHandling = (): void => {
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    console.log(`Network status: ${isOnline ? 'online' : 'offline'}`);
    
    // You could dispatch events or update global state here
    document.body.classList.toggle('offline', !isOnline);
  };

  // Check initial network status
  updateNetworkStatus();

  // Listen for network status changes
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
};

// Cache important assets for offline use
export const cacheImportantAssets = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration && registration.active) {
    // Send message to service worker to cache important assets
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      console.log('Asset caching result:', event.data);
    };

    registration.active.postMessage(
      {
        type: 'CACHE_URLS',
        payload: [
          '/',
          '/assets',
          '/manifest.json'
        ]
      },
      [messageChannel.port2]
    );
  }
};