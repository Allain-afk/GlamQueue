import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setIsInstallable(false);
      return;
    }

    // Check if app was installed previously
    if (localStorage.getItem('pwa-installed') === 'true') {
      setIsInstalled(true);
      setIsInstallable(false);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if browser supports PWA installation
    // Some browsers don't fire beforeinstallprompt but still support installation
    if ('serviceWorker' in navigator) {
      // Check if manifest exists
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        // Browser might support installation even without beforeinstallprompt
        // We'll enable the button and handle it gracefully
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<{ success: boolean; message?: string }> => {
    // If we have a deferred prompt, use it
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          setDeferredPrompt(null);
          localStorage.setItem('pwa-installed', 'true');
          return { success: true };
        } else {
          return { success: false, message: 'Installation was cancelled' };
        }
      } catch (error) {
        console.error('Error during installation:', error);
        return { success: false, message: 'An error occurred during installation' };
      }
    }

    // Fallback: Show instructions for manual installation
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent);
    const isEdge = /edge/.test(userAgent);

    let instructions = '';

    if (isIOS) {
      instructions = 'To install:\n1. Tap the Share button\n2. Select "Add to Home Screen"\n3. Tap "Add"';
    } else if (isAndroid) {
      if (isChrome) {
        instructions = 'To install:\n1. Tap the menu (3 dots)\n2. Select "Install app" or "Add to Home screen"';
      } else {
        instructions = 'To install:\n1. Tap the menu\n2. Select "Add to Home screen" or "Install app"';
      }
    } else if (isEdge || isChrome) {
      instructions = 'To install:\n1. Look for the install icon in the address bar\n2. Click "Install" when prompted';
    } else {
      instructions = 'To install this app:\n1. Look for install options in your browser menu\n2. Follow the prompts to add to home screen';
    }

    // Show instructions with the same SweetAlert2 styling as the rest of the app.
    // Fire-and-forget: this hook still returns the message for callers that want to display it.
    void import('../lib/glamAlerts').then(({ glamInfoDialog }) =>
      glamInfoDialog({
        title: 'Install GlamQueue',
        text: instructions,
        confirmText: 'Got it',
      })
    );
    return { success: false, message: instructions };
  };

  return {
    install,
    isInstalled,
    isInstallable: isInstallable || deferredPrompt !== null,
    canInstall: deferredPrompt !== null
  };
}

