import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-gradient-to-br dark:from-background dark:to-slate-900/50">
      <Header />
      <main className="flex-1 relative pb-24 md:pb-0 scrollable">
        <div className="relative z-10 scrollable">
          {children}
        </div>
      </main>
      {/* Footer shown only on larger screens */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
