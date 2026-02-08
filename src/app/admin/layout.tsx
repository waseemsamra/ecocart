'use client';

import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/providers/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login page should not have the admin sidebar/layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // All other admin pages are protected
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminLayout>
        {children}
      </AdminLayout>
    </ProtectedRoute>
  );
}
