"use client";

import { Bell, Menu, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "../../services/api";
import { ThemeToggle } from "../../src/components/theme-toggle";

const navItemsAll = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Leads", href: "/dashboard/leads" },
  { label: "Users", href: "/dashboard/users", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Targets", href: "/dashboard/targets", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Team chat", href: "/dashboard/chats" },
  { label: "Calendar", href: "/calendar" },
  { label: "Mails", href: "/mails" },
  { label: "Reports", href: "/dashboard/reports" },
  { label: "Activity log", href: "/dashboard/activity", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Settings", href: "/dashboard/settings" }
];

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  TEAM_LEADER: "Team Leader",
  USER: "Sales Executive"
};

export function Topbar({ onMenuClick }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        setRole(parsed.role);
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  // Close any open popups when route changes (e.g. user clicks sidebar navigation)
  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await api.get("/notifications");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setNotifications(res.data.data);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("iqlead_token");
      window.localStorage.removeItem("iqlead_user");
    }
    setMenuOpen(false);
    router.push("/login");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("") || "U";

  const navItems = navItemsAll.filter((item) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });

  return (
    <header className="sticky top-0 z-20 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-md sm:px-5 sm:py-2.5 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100">
      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex h-10 shrink-0 items-center sm:h-11">
            <Image
              src="/ClassifyIQLogo.png"
              alt="IQLead"
              width={140}
              height={40}
              className="h-8 w-auto object-contain drop-shadow-[0_0_12px_rgba(15,23,42,0.75)] sm:h-9 dark:brightness-0 dark:invert"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Nav tabs: hidden on mobile (use hamburger/sidebar); visible from md up */}
      <nav className="hidden min-w-0 flex-1 flex-wrap items-center justify-center gap-2 py-0.5 text-xs font-medium text-slate-600 lg:flex lg:justify-center dark:text-slate-200">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "shrink-0 rounded-full px-3 py-1.5 transition sm:px-3.5 " +
                (active
                  ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800")
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              const next = !notifOpen;
              setNotifOpen(next);
              if (next) {
                loadNotifications();
              }
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-800"
          >
            <Bell className="h-4 w-4 text-slate-500 dark:text-slate-200" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-40 mt-2 w-[min(18rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto rounded-2xl bg-white/95 p-3 text-xs text-slate-700 shadow-lg dark:bg-slate-900/95 dark:text-slate-100">
              <p className="mb-2 text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                Notifications
              </p>
              {notifLoading ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">No notifications.</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl bg-slate-50 px-3 py-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-50">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-300">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen(false);
              setMenuOpen((v) => !v);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <span>{initials}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-40 mt-2 w-40 min-w-[10rem] rounded-xl bg-white py-2 text-xs text-slate-700 shadow-lg dark:bg-slate-900 dark:text-slate-100">
              {user && (
                <div className="mb-2 border-b border-slate-100 px-3 pb-2 dark:border-slate-700">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-50">
                    {user.name}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <User className="mr-2 h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

