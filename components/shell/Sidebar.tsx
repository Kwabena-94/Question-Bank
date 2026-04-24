"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Question Bank",
    href: "/question-bank",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    label: "Flashcards",
    href: "/flashcards",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
  {
    label: "Mocks",
    href: "/mocks",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "Progress",
    href: "/progress",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "Study Plan",
    href: "/study-plan",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

const BOTTOM_ITEMS = [
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="10" r="3" />
        <path d="M6.5 19a6 6 0 0 1 11 0" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    label: "Help",
    href: "/help",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

const SIGN_OUT_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const CHEVRON_RIGHT = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

interface SidebarProps {
  userId: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full bg-white border-r border-neutral-200 z-30 flex flex-col transition-[width,transform] duration-200",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "w-64 lg:w-16" : "w-64"
      )}
    >
      {/* Desktop collapse/expand handle, docked to the right edge of the rail */}
      <button
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden lg:flex absolute top-[60px] -right-3 z-10 items-center justify-center w-6 h-6 rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:text-neutral-900 hover:border-neutral-300 transition-colors"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("transition-transform", collapsed && "rotate-180")}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Header */}
      <div
        className={cn(
          "h-16 flex items-center border-b border-neutral-100",
          collapsed ? "lg:px-0 lg:justify-center px-5" : "px-5"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Image
            src="/logos/favicon.png"
            alt="MedBuddy"
            width={36}
            height={36}
            priority
            className="w-9 h-9 rounded-lg flex-shrink-0"
          />
          <span
            className={cn(
              "font-poppins font-bold text-base text-neutral-900 truncate",
              collapsed && "lg:hidden"
            )}
          >
            Med<span className="text-primary">Buddy</span>
          </span>
        </div>

        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="ml-auto lg:hidden p-1.5 rounded-md text-neutral-400 hover:text-neutral-700"
          aria-label="Close navigation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav
        className={cn(
          "flex-1 py-4 space-y-1 overflow-y-auto",
          collapsed ? "lg:px-2 px-3" : "px-3"
        )}
      >
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-md text-sm font-medium transition-colors",
                collapsed
                  ? "lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5"
                  : "px-3 py-2.5",
                active
                  ? "bg-primary/8 text-primary"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              )}
            >
              {/* Burgundy accent bar on the left edge for the selected item */}
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary"
                />
              )}
              <span className={active ? "text-primary" : "text-neutral-400"}>
                {item.icon}
              </span>
              <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div
        className={cn(
          "py-3 border-t border-neutral-100 space-y-0.5",
          collapsed ? "lg:px-2 px-3" : "px-3"
        )}
      >
        {BOTTOM_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-md text-sm font-medium transition-colors",
                collapsed
                  ? "lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5"
                  : "px-3 py-2.5",
                active
                  ? "bg-primary/8 text-primary"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary"
                />
              )}
              <span className={active ? "text-primary" : "text-neutral-400"}>
                {item.icon}
              </span>
              <span className={cn("flex-1", collapsed && "lg:hidden")}>
                {item.label}
              </span>
              <span
                className={cn(
                  "text-neutral-300",
                  collapsed && "lg:hidden"
                )}
              >
                {CHEVRON_RIGHT}
              </span>
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "w-full flex items-center gap-3 rounded-md text-sm font-medium text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors",
            collapsed
              ? "lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5"
              : "px-3 py-2.5"
          )}
        >
          <span className="text-neutral-400">{SIGN_OUT_ICON}</span>
          <span className={cn(collapsed && "lg:hidden")}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
