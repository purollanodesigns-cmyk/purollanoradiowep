import { useState, useEffect } from "react";

/**
 * Interface representing the non-standard beforeinstallprompt event.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/**
 * Custom React Hook to manage PWA (Progressive Web App) installation.
 * Uses the Mediator/Observer pattern by listening to window-level events
 * and exposing reactive states to the UI.
 * 
 * @returns {Object} PWA installation state and trigger functions
 * @returns {boolean} isInstallable - True if the browser supports and is ready to trigger PWA installation
 * @returns {boolean} isInstalled - True if the app is currently running in standalone (installed) mode
 * @returns {boolean} isIOS - True if the device is iOS (iPhone/iPad/iPod)
 * @returns {boolean} isSafari - True if the browser is Safari (especially on iOS)
 * @returns {Function} install - Triggers the installation prompt
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Detect if already installed (standalone mode)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandaloneMedia || isIOSStandalone);
    };

    checkStandalone();

    // 2. Detect OS and Browser
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const safari = /^((?!chrome|android).)*safari/i.test(ua);

    setIsIOS(ios);
    setIsSafari(safari);

    // 3. Listen for the native beforeinstallprompt event (Chromium-based browsers)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later.
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      console.log("[PWA] 'beforeinstallprompt' event fired and saved.");
    };

    // 4. Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("[PWA] App was successfully installed.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Watch for display mode changes (e.g. user launches the app after installing)
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    
    // Compatibility for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      }
    };
  }, []);

  /**
   * Triggers the native browser installation prompt.
   * Resolves to a boolean indicating whether the user accepted the installation.
   */
  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn("[PWA] Installation prompt is not available yet.");
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      console.log(`[PWA] User response to the install prompt: ${choiceResult.outcome}`);

      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("[PWA] Error during installation prompt execution:", error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isSafari,
    install,
  };
}
