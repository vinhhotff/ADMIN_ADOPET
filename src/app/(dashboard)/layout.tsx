import { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ToastProvider } from '@/components/ui/Toast';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className={`app-shell ${geistSans.variable} ${geistMono.variable}`}>
        <Sidebar />
        <main className="page">
          {/* @ts-expect-error Async Server Component */}
          <TopBar />
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
