import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShieldAlert, Users, UserPlus, Settings } from 'lucide-react';

export default function AdminSidebar() {
  const menu = [
    { href: '/admin/reports', icon: ShieldAlert, label: 'Reports' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/invites', icon: UserPlus, label: 'Invites' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="space-y-2">
      {menu.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-2 p-2 rounded-xl hover:bg-primary/10 transition"
        >
          <item.icon className="h-5 w-5" />
          <span className="text-sm font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
