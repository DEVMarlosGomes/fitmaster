import { createContext, useContext, useEffect, useMemo, useState } from "react";

const PwaInstallContext = createContext(null);

const isStandaloneDisplay = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true ||
      document.referrer.startsWith("android-app://"),
  );
};

const isIosDevice = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

export function PwaInstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(isStandaloneDisplay);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
    const updateStandalone = () => setIsStandalone(isStandaloneDisplay());

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery?.addEventListener?.("change", updateStandalone);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery?.removeEventListener?.("change", updateStandalone);
    };
  }, []);

  const value = useMemo(() => {
    const isIos = isIosDevice();
    const canInstall = Boolean(deferredPrompt) && !isStandalone;
    const canShowInstructions = isIos && !isStandalone;

    return {
      canInstall,
      canShowInstructions,
      isStandalone,
      async installApp() {
        if (!deferredPrompt) {
          return { outcome: canShowInstructions ? "instructions" : "unavailable" };
        }

        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        return choiceResult;
      },
    };
  }, [deferredPrompt, isStandalone]);

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);

  if (!context) {
    throw new Error("usePwaInstall must be used within a PwaInstallProvider");
  }

  return context;
}
