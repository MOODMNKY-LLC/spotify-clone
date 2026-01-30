'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const BANNER_DISMISSED_KEY = 'pwa-install-banner-dismissed';
const FALLBACK_DELAY_MS = 8000; // Show fallback banner after 8s if beforeinstallprompt never fired

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY);
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as { standalone?: boolean }).standalone === true;

    if (standalone || dismissed === '1') {
      setIsInstalled(true);
      return;
    }

    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isApple);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: show banner after delay so users see install option even if heuristics haven't fired
    const fallbackTimer = setTimeout(() => setShowBanner(true), FALLBACK_DELAY_MS);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowBanner(false);
      setDeferredPrompt(null);
    } else if (isIOS) {
      handleDismiss();
      // iOS: user must use Share → Add to Home Screen; we can't trigger it
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem(BANNER_DISMISSED_KEY, '1');
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-lg bg-neutral-800 p-4 shadow-lg ring-1 ring-neutral-700 md:left-6"
      role="dialog"
      aria-label="Install MNKY MUZIK app"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-700">
          <Image
            src="/images/mnky-muzik-app-icon.png"
            alt=""
            fill
            className="object-contain"
            sizes="56px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">Install MNKY MUZIK</p>
          <p className="text-sm text-neutral-400">
            {deferredPrompt
              ? 'Click Install to see the browser’s install prompt and add the app.'
              : 'Add to your home screen for a better experience.'}
          </p>
        </div>
      </div>
      {isIOS && (
        <p className="mt-2 text-xs text-neutral-500">
          Tap Share, then &quot;Add to Home Screen&quot;
        </p>
      )}
      {!deferredPrompt && !isIOS && (
        <p className="mt-2 text-xs text-neutral-500">
          Or use your browser menu (⋮) → &quot;Install MNKY MUZIK&quot; or &quot;Install app&quot;
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="flex-1 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400"
        >
          {deferredPrompt ? 'Install' : isIOS ? 'Got it' : 'Install'}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-600"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
