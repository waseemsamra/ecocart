'use client';

import { useParams, notFound } from 'next/navigation';
import { useMemo } from 'react';
import type { Product } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const db = useFirestore();

  const productId = params.id;

  const productRef = useMemo(() => {
    if (!db || !productId) return null;
    const ref = doc(db, 'products', productId);
    // Although not strictly necessary by the hook's code, adding this for consistency
    // with other data-fetching calls in the project.
    (ref as any).__memo = true; 
    return ref;
  }, [productId, db]);
  
  const { data: product, isLoading, error } = useDoc<Product>(productRef);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading product...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[80vh] text-center p-4">
        <h2 className="text-2xl font-bold text-destructive">Error Loading Product</h2>
        <p className="text-muted-foreground mt-2">There was an error trying to fetch this product's details.</p>
        <pre className="mt-4 bg-muted p-4 rounded-md text-xs text-left whitespace-pre-wrap max-w-full overflow-x-auto">{error.message}</pre>
      </div>
    )
  }

  if (!product) {
    return notFound();
  }

  return (
    <div className="container py-12">
        <h1 className="text-4xl font-bold">{product.name}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{product.description}</p>
        <p className="mt-4 text-2xl font-bold">DH{product.price.toFixed(2)}</p>
        <p className="mt-4 text-sm text-muted-foreground">Product ID: {product.id}</p>
    </div>
  );
}
