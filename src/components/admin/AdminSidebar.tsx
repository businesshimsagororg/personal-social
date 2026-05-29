"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FileText,
  LayoutDashboard,
  ShieldAlert,
  Users,
  UserPlus,
  Settings,
} from "lucide-react";

const menu = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview", exact: true },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/posts", icon: FileText, label: "Posts" },
  { href: "/admin/reports", icon: ShieldAlert, label: "Reports" },
  { href: "/admin/invites", icon: UserPlus, label: "Invites" },
  { href: "/admin/activity", icon: Activity, label: "Activity log" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground px-2 mb-3">
        Administration
      </p>
      {menu.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              active
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <Link
        href="/feed"
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 mt-4 border-t border-border/40 pt-4"
      >
        ← Back to app
      </Link>
    </nav>
  );
}
