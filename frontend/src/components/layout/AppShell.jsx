import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import SideMenu from './SideMenu';

export default function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: '#F8F8F8' }}>
      <TopNav onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <SideMenu />
        </div>

        {/* Mobile Slide-over Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-50 w-64 h-full shadow-glass-lg flex flex-col animate-slideInLeft"
                 style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)' }}>
              <SideMenu isMobile onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full animate-fadeInUp">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
