'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait for authentication state to load
    }

    if (!user) {
      router.push('/admin/login'); // Redirect to admin login if not authenticated
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      router.push('/admin/login'); // Redirect to admin login if role doesn't match
    }
  }, [user, loading, router, requiredRole]);

  if (loading || !user || (requiredRole && user.role !== requiredRole)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
