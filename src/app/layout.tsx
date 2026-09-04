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
      <body className="bg-slate-950 text-slate-100 min-h-screen pb-20 antialiased selection:bg-orange-500 selection:text-white select-none">
        <NextAuthProvider>
          <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <img src="/icon-192.png" alt="GP2026" className="w-8 h-8 rounded-lg shadow-md border border-amber-500/30 object-cover" />
              <div>
                <h1 className="text-base font-bold tracking-tight leading-none text-slate-100">GP 2026 Finance</h1>
                <p className="text-[11px] text-slate-400 font-medium">gp2026.luhurachati.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                PWA Ready
              </span>
            </div>
          </header>

          <main className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto px-4 py-4 space-y-4">
            {children}
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}
