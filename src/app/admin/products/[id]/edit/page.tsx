'use client';

import { ProductForm } from '@/components/admin/ProductForm';
import { useFirestore } from '@/firebase/provider';
import type { Product } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const { loading: authLoading } = useAuth();
  const db = useFirestore();
  
  const productRef = useMemo(() => {
    if (!db || !params.id) return null;
    const ref = doc(db, 'products', params.id);
    (ref as any).__memo = true;
    return ref;
  }, [params.id, db]);

  const { data: product, isLoading: isLoadingData, error } = useDoc<Product>(productRef);
  const isLoading = authLoading || isLoadingData;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return notFound();
  }

  return <ProductForm product={product} />;
}
