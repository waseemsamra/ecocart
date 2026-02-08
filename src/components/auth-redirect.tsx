'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * A client component that performs a redirect on mount.
 */
export function AuthRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.push(to);
  }, [router, to]);

  // Render nothing, or a loading spinner
  return null;
}
