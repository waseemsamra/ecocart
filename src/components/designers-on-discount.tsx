'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, limit } from 'firebase/firestore';
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

function DesignerOnDiscountCard({ product, brandsMap }: { product: Product; brandsMap: Map<string, Brand> }) {
  const brandId = product.brandIds?.[0];
  const brand = brandId ? brandsMap.get(brandId) : null;
  
  const brandSlug = brand ? (brand.slug || slugify(brand.name)) : null;
  const brandName = brand ? brand.name : null;
  const imageUrl = product.images?.[0]?.imageUrl || 'https://placehold.co/600x800';
  const imageHint = product.images?.[0]?.imageHint || '';
  const imageAlt = product.images?.[0]?.description || product.name;

  const linkHref = brandSlug ? `/brands/${brandSlug}` : `/products/${product.id}`;

  return (
    <Link href={linkHref} className="relative group block overflow-hidden aspect-[3/4]">
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        data-ai-hint={imageHint}
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white text-center">
        <h3 className="font-headline text-xl font-bold uppercase">{brandName || product.name}</h3>
        <p className="text-xs font-semibold tracking-widest group-hover:underline mt-1">SHOP NOW</p>
      </div>
    </Link>
  );
}


export function DesignersOnDiscount() {
  const db = useFirestore();

  const productsQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'products'), where('showInDesignersOnDiscount', '==', true), limit(8));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const { data: brands, isLoading: isLoadingBrands } = useCollection<Brand>(
    useMemo(() => {
      if (!db) return null;
      const q = query(collection(db, 'brands'));
      (q as any).__memo = true;
      return q;
    }, [db])
  );
  
  const brandsMap = useMemo(() => {
    if (!brands) return new Map();
    return new Map(brands.map(b => [b.id, b]));
  }, [brands]);

  const isLoading = isLoadingProducts || isLoadingBrands;

  if (isLoading) {
    return (
      <section className="py-12 md:py-20">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-headline text-2xl font-bold tracking-widest uppercase">Designers On Discount</h2>
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
            Designers On Discount
          </h2>
          <Link href="/products?showInDesignersOnDiscount=true" className="text-xs font-semibold text-muted-foreground hover:text-primary tracking-widest">
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
                <DesignerOnDiscountCard product={item} brandsMap={brandsMap} />
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
