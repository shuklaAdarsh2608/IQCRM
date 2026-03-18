"use client";

import {
  LayoutGrid,
  Users,
  MessageCircle,
  Calendar,
  Mail,
  BarChart3,
  Trophy,
  CheckCircle2,
  Settings as SettingsIcon,
  X
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const allNavItems = [
  { label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { label: "Leads", icon: Users, href: "/dashboard/leads" },
  { label: "My streak", icon: Trophy, href: "/dashboard/streaks", roles: ["MANAGER", "TEAM_LEADER", "USER"] },
  {
    label: "Approvals",
    icon: CheckCircle2,
    href: "/dashboard/streak-approvals",
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"]
  },
  {
    label: "Users",
    icon: Users,
    href: "/dashboard/users",
    roles: ["SUPER_ADMIN", "ADMIN"]
  },
  {
    label: "Targets",
    icon: BarChart3,
    href: "/dashboard/targets",
    roles: ["SUPER_ADMIN", "ADMIN"]
  },
  { label: "Team chat", icon: MessageCircle, href: "/dashboard/chats" },
  { label: "Calendar", icon: Calendar, href: "/calendar" },
  { label: "Mails", icon: Mail, href: "/mails" },
  { label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
  { label: "Settings", icon: SettingsIcon, href: "/dashboard/settings" }
];

function normalizeRole(role) {
  if (!role) return null;
  if (role === "Sales Executive" || role === "SALES_EXECUTIVE") return "USER";
  if (role === "Relationship Manager" || role === "RELATIONSHIP_MANAGER") return "USER";
  return role;
}

export function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setRole(normalizeRole(parsed.role));
      }
    } catch {
      // ignore
    }
  }, []);

  const navItems = allNavItems.filter((item) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });

  const content = (
    <>
      <div className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
            <div className="relative flex h-12 w-[160px] items-center">
              <Image
                src="/ClassifyIQLogo.png"
                alt="IQLead"
                width={260}
                height={72}
                className="h-10 w-full object-contain dark:brightness-0 dark:invert"
                priority
              />
            </div>
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto text-sm">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={clsx(
                "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs transition",
                active
                  ? "bg-orange-100 text-orange-600"
                  : "text-slate-600 hover:bg-orange-50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile backdrop: only on small screens */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className={clsx(
          "fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />
      {/* Sidebar: drawer on mobile only; hidden on md and up */}
      <aside
        className={clsx(
          "flex h-full flex-col rounded-r-2xl bg-white p-4 shadow-xl dark:bg-slate-900 dark:text-slate-100",
          "fixed left-0 top-0 z-40 h-full w-64 transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {content}
      </aside>
    </>
  );
}

