'use client';

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Check, Sparkles, X } from 'lucide-react';

export default function PwaInstallHeader() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
        setIsInstalled(true);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* PWA Ready Status Indicator */}
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {isInstalled ? 'App Installed' : 'PWA Ready'}
        </span>

        {/* Download App Shortcut Button */}
        {!isInstalled ? (
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-md transition transform active:scale-95 flex items-center space-x-1.5 border border-orange-400"
            title="Download & Install Web App on Mobile or Desktop"
          >
            <Download className="w-3.5 h-3.5 animate-bounce" />
            <span>Install App</span>
          </button>
        ) : (
          <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 font-bold">
            <Check className="w-3.5 h-3.5 text-orange-600" />
            <span>Installed</span>
          </span>
        )}
      </div>

      {/* PWA INSTALL / DOWNLOAD GUIDE MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-amber-200/80 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Install Ganesh Puja App</h3>
                  <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Fast • Offline Ready • Native Feel</p>
                </div>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center space-x-3 text-amber-900">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="font-semibold text-[11px] leading-relaxed">
                  Install this Progressive Web App (PWA) directly to your home screen for 1-tap offline access without downloading from app stores!
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>📱 Android / Chrome Browser</span>
                  </p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Tap the <strong>3 dots (⋮)</strong> menu in top-right corner &rarr; Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>🍏 iPhone / Safari Browser</span>
                  </p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Tap the <strong>Share button (⎋)</strong> at bottom navigation &rarr; Scroll down and tap <strong>"Add to Home Screen (+)"</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>💻 Desktop Chrome / Edge</span>
                  </p>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Click the <strong>Install icon (⊕)</strong> on the right side of your browser URL bar.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-md transition transform active:scale-95"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
