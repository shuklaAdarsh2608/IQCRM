"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardShell({ children, title, subtitle }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("iqlead_token");
    if (!token) {
      router.replace("/login");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-2 py-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-4 sm:py-6">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="mx-auto w-full max-w-[1600px]">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-w-0 space-y-4">
          {title || subtitle ? (
            <div className="mb-3">
              {title && (
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 sm:text-lg">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">{subtitle}</p>
              )}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}


