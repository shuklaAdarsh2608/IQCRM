"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "../../src/components/theme-toggle";

export function PublicHeader() {
  return (
    <div className="sticky top-0 z-30 bg-gradient-to-b from-[#ffe3d2]/90 via-[#ffeef0]/90 to-transparent pb-2 pt-2 backdrop-blur dark:from-slate-950/90 dark:via-slate-900/90 dark:to-transparent sm:pt-3">
      <header className="mx-auto flex max-w-[1600px] items-center justify-between rounded-xl bg-white/80 px-4 py-2.5 text-sm text-slate-700 shadow-sm backdrop-blur sm:px-6 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            {/* Keep header height the same; scale logo visually (no layout jump) */}
            <div className="relative flex h-10 shrink-0 items-center overflow-visible sm:h-11">
              <Image
                src="/ClassifyIQLogo.png"
                alt="IQLead"
                width={360}
                height={120}
                className="h-10 w-auto origin-left scale-[1.75] object-contain drop-shadow-[0_0_12px_rgba(15,23,42,0.75)] sm:h-11 sm:scale-[2.85] dark:brightness-0 dark:invert"
                priority
              />
            </div>
          </Link>
        </div>
        <nav className="hidden flex-1 items-center justify-center gap-5 text-[13px] font-semibold text-slate-600 dark:text-slate-200 sm:flex sm:gap-6">
          <Link
            href="/"
            className="rounded-full px-3 py-1 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            Home
          </Link>
          <Link
            href="/#features"
            className="rounded-full px-3 py-1 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            Features
          </Link>
          <Link
            href="/#about"
            className="rounded-full px-3 py-1 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            About
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex">
            <ThemeToggle />
          </div>
          <Link
            href="/login"
            className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Sign in
          </Link>
        </div>
      </header>
    </div>
  );
}


