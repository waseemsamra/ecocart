'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import type { Product, Brand, FeaturedBrand } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { slugify } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from './ui/button';

function FeaturedBrandCard({ product }: { product: Product; }) {
  const imageUrl = product.images?.[0]?.imageUrl || 'https://placehold.co/600x800';
  const imageHint = product.images?.[0]?.imageHint || '';
  const imageAlt = product.images?.[0]?.description || product.name;
  const productSlug = product.slug || slugify(product.name);

  return (
    <Link href={`/products/${productSlug}`} className="block group">
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
      <div className="mt-4 text-center">
        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{product.name}</h3>
        <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}


export function FeaturedBrandSection() {
  const db = useFirestore();

  const settingsRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'settings', 'featuredBrand');
  }, [db]);

  const { data: featuredBrandSetting, isLoading: isLoadingSettings } = useDoc<FeaturedBrand>(settingsRef);
  
  const brandId = featuredBrandSetting?.brandId;

  const brandRef = useMemo(() => {
    if (!db || !brandId) return null;
    return doc(db, 'brands', brandId);
  }, [db, brandId]);

  const { data: brand, isLoading: isLoadingBrand } = useDoc<Brand>(brandRef);
  
  const productsQuery = useMemo(() => {
    if (!db || !brandId) return null;
    const q = query(collection(db, 'products'), where('brandIds', 'array-contains', brandId), limit(8));
    (q as any).__memo = true;
    return q;
  }, [db, brandId]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const isLoading = isLoadingSettings || isLoadingBrand || isLoadingProducts;

  if (isLoading) {
    return (
      <section className="py-12 md:py-20">
        <div className="container">
           <Skeleton className="h-96 w-full" />
        </div>
      </section>
    );
  }
  
  if (!brandId || !brand || !products || products.length === 0) {
    return null;
  }
  
  const brandSlug = brand.slug || slugify(brand.name);
  const linkHref = `/brands/${brandSlug}`;

  return (
    <section className="py-12 md:py-20">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-3 text-center flex flex-col items-center">
                <h2 className="font-headline text-5xl font-bold uppercase">{brand.name}</h2>
                <p className="text-muted-foreground mt-2">{brand.description || 'Where grace meets modernity'}</p>
                <Button asChild className="mt-6" variant="destructive">
                    <Link href={linkHref}>Explore All</Link>
                </Button>
            </div>
            <div className="md:col-span-9">
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
                        className="pl-4 basis-1/2 sm:basis-1/3"
                      >
                        <FeaturedBrandCard product={item} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 hidden lg:flex" />
                  <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 hidden lg:flex" />
                </Carousel>
            </div>
        </div>
      </div>
    </section>
  );
}
