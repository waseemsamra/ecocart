'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, limit, documentId } from 'firebase/firestore';
import type { Product, Brand } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { slugify } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

function ReadyToShipCard({ product, brand }: { product: Product; brand: Brand | null }) {
  const imageUrl = product.images?.[0]?.imageUrl || 'https://placehold.co/600x800';
  const imageHint = product.images?.[0]?.imageHint || '';
  const imageAlt = product.images?.[0]?.description || product.name;
  
  const linkHref = brand ? `/brands/${slugify(brand.name)}` : `/products/${product.id}`;

  const hasSale = product.originalPrice && product.originalPrice > product.price;
  const discount = hasSale ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;

  return (
    <Link href={linkHref} className="group block">
      <div className="relative group block overflow-hidden aspect-[3/4]">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={imageHint}
          unoptimized
        />
      </div>
      <div className="mt-4">
        {brand && <p className="text-sm font-bold uppercase">{brand.name}</p>}
        <h3 className="font-semibold text-sm mt-1 group-hover:text-primary transition-colors leading-tight">{product.name}</h3>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold">DH{product.price.toFixed(2)}</p>
            {hasSale && (
                <>
                    <p className="text-sm text-muted-foreground line-through">DH{product.originalPrice!.toFixed(2)}</p>
                    <p className="text-sm font-bold text-red-500">{discount}% OFF</p>
                </>
            )}
        </div>
      </div>
    </Link>
  );
}


export function ReadyToShipArticles() {
  const db = useFirestore();

  const productsQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'products'), where('packagingPartnerTags', 'array-contains', 'ready-to-ship'), limit(10));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const brandIds = useMemo(() => {
    if (!products) return [];
    const ids = new Set<string>();
    products.forEach(p => {
        if (p.brandIds) {
            p.brandIds.forEach(id => ids.add(id));
        }
    });
    return Array.from(ids);
  }, [products]);

  const brandsQuery = useMemo(() => {
    if (!db || brandIds.length === 0) return null;
    const q = query(collection(db, 'brands'), where(documentId(), 'in', brandIds));
    (q as any).__memo = true;
    return q;
  }, [db, brandIds]);

  const { data: brands, isLoading: isLoadingBrands } = useCollection<Brand>(brandsQuery);
  
  const brandsMap = useMemo(() => {
    if (!brands) return new Map();
    return new Map(brands.map(b => [b.id, b]));
  }, [brands]);

  const isLoading = isLoadingProducts || (brandIds.length > 0 && isLoadingBrands);

  if (isLoading) {
    return (
      <section className="py-12 md:py-20">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-headline text-2xl font-bold tracking-widest uppercase">READY TO SHIP STUNNERS</h2>
            <Link href="/products?tag=ready-to-ship" className="text-xs font-semibold text-muted-foreground hover:text-primary tracking-widest">VIEW ALL</Link>
          </div>
          <div className="flex space-x-4">
            {Array.from({length: 5}).map((_, i) => (
                <div key={i} className="min-w-0 shrink-0 grow-0 basis-full lg:basis-1/5 pl-4 -ml-4">
                      <Skeleton className="aspect-[3/4]" />
                      <Skeleton className="h-4 w-1/2 mt-4" />
                      <Skeleton className="h-4 w-3/4 mt-2" />
                      <Skeleton className="h-4 w-1/4 mt-2" />
                </div>
            ))}
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
            READY TO SHIP STUNNERS
          </h2>
          <Link href="/products?tag=ready-to-ship" className="text-xs font-semibold text-muted-foreground hover:text-primary tracking-widest">
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
            {products.map((item) => {
                const brand = item.brandIds ? brandsMap.get(item.brandIds[0]) : null;
                return (
                  <CarouselItem
                    key={item.id}
                    className="pl-4 basis-[40%] sm:basis-1/3 lg:basis-1/5"
                  >
                    <ReadyToShipCard product={item} brand={brand || null} />
                  </CarouselItem>
                )
            })}
          </CarouselContent>
          <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 hidden lg:flex" />
          <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 hidden lg:flex" />
        </Carousel>
      </div>
    </section>
  );
}
