"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

interface AppShellProps {
  userId: string;
  children: React.ReactNode;
}

const COLLAPSE_KEY = "mc:sidebar-collapsed";

export default function AppShell({ userId, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSE_KEY);
    if (stored === "1") setCollapsed(true);
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      <Sidebar
        userId={userId}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        collapsed={hydrated && collapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={
          "flex-1 flex flex-col min-w-0 transition-[margin] duration-200 " +
          (hydrated && collapsed ? "lg:ml-16" : "lg:ml-64")
        }
      >
        <header className="lg:hidden sticky top-0 z-10 h-14 bg-white border-b border-neutral-200 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
            aria-label="Open navigation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/logos/favicon.png"
              alt="MedBuddy"
              className="w-7 h-7 rounded-lg"
            />
            <span className="font-poppins font-bold text-sm text-neutral-900">
              Med<span className="text-primary">Buddy</span>
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
