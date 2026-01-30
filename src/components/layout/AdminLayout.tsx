'use client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <SidebarTrigger className="md:hidden" />
                </div>
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
