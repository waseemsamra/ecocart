'use client';

import * as React from 'react';
import { collection, query, where, documentId } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Product } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ProductCard } from '@/components/product-card';
import { Skeleton } from './ui/skeleton';

const RECENTLY_VIEWED_KEY = 'recentlyViewed';

export function LowMinimumMustHaves() { // Keeping function name to avoid changing parent
  const [productIds, setProductIds] = React.useState<string[]>([]);
  const [isLoadingIds, setIsLoadingIds] = React.useState(true);
  const db = useFirestore();

  React.useEffect(() => {
    // This effect runs only on the client
    const storedIds = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (storedIds) {
      try {
        const parsedIds = JSON.parse(storedIds);
        if (Array.isArray(parsedIds)) {
            setProductIds(parsedIds);
        }
      } catch (e) {
          console.error("Failed to parse recently viewed products from localStorage", e);
          localStorage.removeItem(RECENTLY_VIEWED_KEY);
      }
    }
    setIsLoadingIds(false);
  }, []);

  const productsQuery = React.useMemo(() => {
    if (!db || productIds.length === 0) return null;
    // Firestore 'in' queries are limited to 30 items. We already limit to 10.
    const q = query(collection(db, 'products'), where(documentId(), 'in', productIds));
    (q as any).__memo = true;
    return q;
  }, [db, productIds]);

  const { data: productsData, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const products = React.useMemo(() => {
    if (!productsData) return [];
    // The order from Firestore is not guaranteed, so we re-order based on our recently viewed list.
    const productMap = new Map(productsData.map(p => [p.id, p]));
    return productIds.map(id => productMap.get(id)).filter((p): p is Product => !!p);
  }, [productsData, productIds]);

  const isLoading = isLoadingIds || (productIds.length > 0 && isLoadingProducts);

  if (!isLoading && productIds.length === 0) {
    return null; // Don't render the section if there's nothing to show.
  }

  return (
    <section className="py-12 md:py-20">
      <div className="container">
        <div className="flex justify-between items-center mb-8">
            <h2 className="font-headline text-3xl font-bold md:text-4xl">
                Recently Viewed Products
            </h2>
        </div>
        {isLoading ? (
             <div className="flex space-x-4">
                {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pl-4 -ml-4">
                         <Skeleton className="aspect-square rounded-xl" />
                         <Skeleton className="h-4 w-3/4 mt-4" />
                         <Skeleton className="h-4 w-1/2 mt-2" />
                    </div>
                ))}
            </div>
        ) : (
            <Carousel
              opts={{
                align: 'start',
              }}
              className="w-full relative"
            >
              <CarouselContent className="-ml-4">
                {products.map((product) => (
                  <CarouselItem
                    key={product.id}
                    className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                  >
                    <ProductCard product={product} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 hidden lg:flex" />
              <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 hidden lg:flex" />
            </Carousel>
        )}
      </div>
    </section>
  );
}
