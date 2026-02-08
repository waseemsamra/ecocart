'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, limit } from 'firebase/firestore';
import type { Product, Brand } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ProductCard } from './product-card';

export function TrendingNow() {
  const db = useFirestore();

  const productsQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'products'), where('showInTrendingNow', '==', true), limit(8));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const isLoading = isLoadingProducts;

  if (isLoading) {
    return (
      <section className="py-12 md:py-20">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-headline text-2xl font-bold tracking-widest uppercase">Trending Now</h2>
            <Link href="#" className="text-xs font-semibold text-muted-foreground hover:text-primary tracking-widest">VIEW ALL</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Skeleton className="aspect-[3/4]" />
            <Skeleton className="aspect-[3/4]" />
            <Skeleton className="aspect-[3/4]" />
            <Skeleton className="aspect-[3/4]" />
          </div>
        </div>
      </section>
    );
  }
  
  if (!products || products.length === 0) {
    return null;
  }
  
  return (
    <section className="py-12 md:py-20">
      <div className="container">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-headline text-2xl font-bold tracking-widest uppercase">
            Trending Now
          </h2>
          <Link href="/products?showInTrendingNow=true" className="text-xs font-semibold text-muted-foreground hover:text-primary tracking-widest">
            VIEW ALL
          </Link>
        </div>
        <Carousel
          opts={{
            align: 'start',
          }}
          className="w-full relative"
        >
          <CarouselContent className="-ml-4">
            {products.map((item) => (
              <CarouselItem
                key={item.id}
                className="pl-4 basis-2/5 sm:basis-1/3 lg:basis-1/4"
              >
                <ProductCard product={item} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 hidden lg:flex" />
          <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 hidden lg:flex" />
        </Carousel>
      </div>
    </section>
  );
}

    