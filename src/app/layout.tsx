import type { Metadata, Viewport } from 'next';
import './globals.css';
import NextAuthProvider from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Ganesh Puja 2026 - Finance Portal',
  description: 'Mobile-first transparent financial management app for Ganesh Puja 2026',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GP2026',
  },
};

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-amber-50/40 text-slate-900 min-h-screen pb-20 antialiased selection:bg-orange-500 selection:text-white select-none">
        <NextAuthProvider>
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/60 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <img src="/icon-192.png" alt="Ganesh Puja - LBC" className="w-9 h-9 rounded-xl shadow-sm border border-amber-300 object-cover" />
              <div>
                <h1 className="text-base font-extrabold tracking-tight leading-none text-slate-900">Ganesh Puja - LBC</h1>
                <p className="text-[10px] text-orange-600 font-semibold tracking-wide uppercase pt-0.5">Festive Portal 2026</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                PWA Ready
              </span>
            </div>
          </header>

          <main className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto px-4 py-4 space-y-4">
            {children}
          </main>

          <footer className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto px-4 py-6 border-t border-slate-900 text-center text-xs text-slate-500 space-y-2">
            <p>© 2026 Ganesh Puja Committee (gp2026.luhurachati.com). All rights reserved.</p>
            <div className="flex justify-center space-x-4 text-[11px] font-medium text-slate-400">
              <a href="/privacy" className="hover:text-orange-400 underline">Privacy Policy</a>
              <span>•</span>
              <a href="/terms" className="hover:text-orange-400 underline">Terms of Service & Financial Disclaimer</a>
              <span>•</span>
              <a href="mailto:luhurenbaiclub@gmail.com" className="hover:text-orange-400 underline">Support Contact</a>
            </div>
          </footer>
        </NextAuthProvider>
      </body>
    </html>
  );
}
