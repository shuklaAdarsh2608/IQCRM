"use client";

import { Bell, Menu, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "../../services/api";
import { ThemeToggle } from "../../src/components/theme-toggle";

const navItemsAll = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Leads", href: "/dashboard/leads" },
  { label: "My streak", href: "/dashboard/streaks", roles: ["MANAGER", "TEAM_LEADER", "USER"] },
  { label: "Users", href: "/dashboard/users", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Targets", href: "/dashboard/targets", roles: ["SUPER_ADMIN", "ADMIN"] },
  { label: "Approvals", href: "/dashboard/streak-approvals", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
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
  USER: "Relationship Manager"
};

function normalizeRole(role) {
  if (!role) return null;
  if (role === "Sales Executive" || role === "SALES_EXECUTIVE") return "USER";
  if (role === "Relationship Manager" || role === "RELATIONSHIP_MANAGER") return "USER";
  return role;
}

export function Topbar({ onMenuClick, sidebarOpen = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [adminUsersOpen, setAdminUsersOpen] = useState(false);
  const [adminUsersPos, setAdminUsersPos] = useState({ left: 0, top: 0, width: 0 });
  const adminUsersAnchorRef = useRef(null);
  const adminUsersCloseTimerRef = useRef(null);

  const cancelAdminUsersClose = () => {
    if (adminUsersCloseTimerRef.current) {
      clearTimeout(adminUsersCloseTimerRef.current);
      adminUsersCloseTimerRef.current = null;
    }
  };

  const scheduleAdminUsersClose = (delayMs = 180) => {
    cancelAdminUsersClose();
    adminUsersCloseTimerRef.current = setTimeout(() => {
      setAdminUsersOpen(false);
      adminUsersCloseTimerRef.current = null;
    }, delayMs);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        setRole(normalizeRole(parsed.role));
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  // Close any open popups when route changes (e.g. user clicks sidebar navigation)
  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
    setAdminUsersOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!adminUsersOpen) return;
    const updatePos = () => {
      const el = adminUsersAnchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setAdminUsersPos({
        left: Math.round(rect.left),
        top: Math.round(rect.bottom + 8),
        width: Math.round(rect.width)
      });
    };
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [adminUsersOpen]);

  useEffect(() => {
    return () => cancelAdminUsersClose();
  }, []);

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

  const isAdminLike = role === "ADMIN" || role === "SUPER_ADMIN";
  const adminDropdownItems = [
    { label: "Targets", href: "/dashboard/targets" },
    { label: "Approvals", href: "/dashboard/streak-approvals" },
    { label: "Team chat", href: "/dashboard/chats" }
  ];

  const navItemsForRole = isAdminLike
    ? navItems.filter(
        (item) =>
          !["/dashboard/targets", "/dashboard/streak-approvals", "/dashboard/chats"].includes(
            item.href
          )
      )
    : navItems;

  return (
    <header className="sticky top-0 z-20 mb-3 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-md sm:px-4 sm:py-2.5 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100">
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}
        <Link
          href="/dashboard"
          className="flex items-center px-1 py-0.5"
          aria-label="Go to dashboard"
        >
          {/* Keep navbar height fixed; allow logo to overflow bigger */}
          <div className="relative flex h-10 shrink-0 items-center overflow-visible sm:h-11">
            <Image
              src="/ClassifyIQLogo.png"
              alt="IQLead"
              width={280}
              height={80}
              className="h-24 w-auto object-contain dark:brightness-0 dark:invert"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Nav tabs: single-line, scrolls instead of wrapping */}
      <nav
        className={
          "hidden min-w-0 flex-1 items-center justify-start py-0.5 text-[11px] font-medium text-slate-600 lg:flex lg:justify-center lg:text-xs dark:text-slate-200 " +
          (sidebarOpen ? "lg:hidden" : "")
        }
      >
        <div className="min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max flex-nowrap items-center gap-1.5 px-1 lg:mx-auto lg:gap-2">
            {navItemsForRole.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              if (isAdminLike && item.href === "/dashboard/users") {
                const dropdownActive =
                  active ||
                  adminDropdownItems.some(
                    (d) => pathname === d.href || pathname.startsWith(d.href)
                  );
                return (
                  <div
                    key={item.href}
                    className="relative shrink-0"
                    ref={adminUsersAnchorRef}
                    onMouseEnter={() => {
                      cancelAdminUsersClose();
                      setAdminUsersOpen(true);
                    }}
                    onMouseLeave={() => scheduleAdminUsersClose()}
                    onFocusCapture={() => {
                      cancelAdminUsersClose();
                      setAdminUsersOpen(true);
                    }}
                  >
                    <Link
                      href={item.href}
                      className={
                        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 transition sm:px-3.5 " +
                        (dropdownActive
                          ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800")
                      }
                    >
                      {item.label}
                      <span className={"text-[10px] opacity-70 " + (dropdownActive ? "text-white dark:text-slate-900" : "")}>
                        ▼
                      </span>
                    </Link>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 transition sm:px-3.5 " +
                    (active
                      ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {isAdminLike && adminUsersOpen && (
        <div
          className="fixed z-[100] pointer-events-none"
          style={{ left: adminUsersPos.left, top: adminUsersPos.top, minWidth: Math.max(176, adminUsersPos.width) }}
        >
          <div
            className="pointer-events-auto min-w-44 rounded-2xl border border-slate-200 bg-white/95 p-2 text-xs text-slate-700 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100"
            onMouseEnter={() => cancelAdminUsersClose()}
            onMouseLeave={() => scheduleAdminUsersClose()}
          >
            {adminDropdownItems.map((d) => {
              const dActive = pathname === d.href || pathname.startsWith(d.href);
              return (
                <Link
                  key={d.href}
                  href={d.href}
                  onClick={() => setAdminUsersOpen(false)}
                  className={
                    "block rounded-xl px-3 py-2 transition " +
                    (dActive
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800")
                  }
                >
                  {d.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

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

