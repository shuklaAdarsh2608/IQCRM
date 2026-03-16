"use client";

import "../globals.css";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-slate-900 dark:text-slate-100">
      {children}
    </div>
  );
}


