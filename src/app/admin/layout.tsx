import React from 'react';
import AppLayout from '@/components/layout/app-layout';
import AdminSidebar from '@/components/admin/AdminSidebar';



export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout wide>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] gap-0">
        <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border/30 p-4 md:sticky md:top-0 md:self-start">
          <AdminSidebar />
        </aside>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto min-w-0">{children}</main>
      </div>
    </AppLayout>
  );
}
