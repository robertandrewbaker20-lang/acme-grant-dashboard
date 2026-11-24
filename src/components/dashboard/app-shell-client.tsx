"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileBarChart2,
  HeartHandshake,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { ScanProvider } from "./scan-context";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/criteria", label: "Search criteria", icon: SlidersHorizontal },
  { href: "/federal", label: "Federal funding", icon: Landmark },
  { href: "/foundations", label: "Foundations", icon: HeartHandshake },
  { href: "/report", label: "Grant report", icon: FileBarChart2 },
] as const;

function SidebarNav({
  onNavigate,
  onLogout,
  pathname,
  authRequired,
}: {
  onNavigate?: () => void;
  onLogout: () => void;
  pathname: string;
  authRequired: boolean;
}) {
  return (
    <>
      <div className="border-b border-slate-800 px-5 py-5">
        <Wordmark light />
        <p className="mt-2 text-[11px] leading-snug text-slate-400">
          Grant pipeline demo
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-800/80 text-white ring-1 ring-slate-700/50"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${active ? "text-teal-400" : "text-slate-500"}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {authRequired && (
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </>
  );
}

export function AppShellClient({
  children,
  demo,
  authRequired,
  configMessage,
}: {
  children: React.ReactNode;
  demo: boolean;
  authRequired: boolean;
  configMessage: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <ScanProvider>
      <div className="flex min-h-screen bg-[var(--background)]">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-800/40 bg-slate-950 text-white lg:flex lg:w-60">
          <SidebarNav
            onLogout={handleLogout}
            pathname={pathname}
            authRequired={authRequired}
          />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-slate-950 text-white shadow-2xl">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarNav
                onNavigate={() => setMobileOpen(false)}
                onLogout={handleLogout}
                pathname={pathname}
                authRequired={authRequired}
              />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-slate-800/20 bg-slate-950 px-4 py-3 text-white lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Wordmark light compact />
          </div>

          {configMessage && (
            <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 sm:px-6">
              {configMessage}
            </div>
          )}
          {demo && (
            <div className="border-b border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950 sm:px-6">
              Showing fictional sample data for Acme Community Fund. People, organizations,
              and amounts on this site are made up. A reload resets any pipeline edits.
              Live scanning stays off until a database and API keys are configured outside
              of a preview deployment.
            </div>
          )}

          {children}
        </div>
      </div>
    </ScanProvider>
  );
}
