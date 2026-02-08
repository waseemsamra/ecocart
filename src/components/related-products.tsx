'use client';

import { useMemo } from 'react';
import { collection, query, limit } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Loader2 } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useAuth } from '@/context/auth-context';

export function RelatedProducts() {
  const { loading: authLoading } = useAuth();
  const db = useFirestore();
  
  const productsQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'products'), limit(8));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: products, isLoading: isLoadingData } = useCollection<Product>(productsQuery);
  const isLoading = authLoading || isLoadingData;

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin mx-auto" />;
  }
  
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="font-headline text-3xl font-bold mb-8">You may also like...</h2>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-4">
          {products.map((product) => (
            <CarouselItem key={product.id} className="pl-4 md:basis-1/2 lg:basis-1/4">
                <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 hidden lg:flex" />
        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 hidden lg:flex" />
      </Carousel>
    </div>
  );
}
