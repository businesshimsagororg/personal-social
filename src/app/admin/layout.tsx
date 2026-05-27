import React from 'react';
import AppLayout from '@/components/layout/app-layout';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'Admin Panel',
  description: 'Administration dashboard',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <div className="flex min-h-screen glass">
        <aside className="w-64 border-r border-border/30 p-4 hidden md:block">
          <AdminSidebar />
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </AppLayout>
  );
}
