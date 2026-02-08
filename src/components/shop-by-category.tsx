'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

function CategoryItem({ category }: { category: Category }) {
  return (
    <Link href={`/categories/${category.slug || category.id}`} className="group flex flex-col items-center gap-2 text-center">
        <div className="relative h-36 w-36 overflow-hidden rounded-full border-2 border-transparent group-hover:border-primary transition-all">
            <Image
                src={category.imageUrl || 'https://picsum.photos/seed/1/128/128'}
                alt={category.name}
                fill
                className="object-cover"
                data-ai-hint={category.imageHint}
                unoptimized
            />
        </div>
        <p className="font-semibold text-sm group-hover:text-primary">{category.name}</p>
    </Link>
  );
}

export function ShopByCategory() {
  const db = useFirestore();

  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'categories'));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: allCategories, isLoading } = useCollection<Category>(categoriesQuery);

  const categories = useMemo(() => {
    if (!allCategories) {
      return [];
    }
    // Filter for top-level categories and sort by order
    return allCategories
      .filter(c => c.parentId === null || c.parentId === undefined)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [allCategories]);

  if (isLoading) {
    return (
        <section className="py-12 md:py-16">
            <div className="container">
                <h2 className="font-headline text-3xl font-bold text-center mb-8">Shop By Category</h2>
                <div className="flex justify-center flex-wrap gap-x-8 gap-y-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 w-36">
                            <Skeleton className="h-36 w-36 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
        <div className="container">
            <h2 className="font-headline text-3xl font-bold text-center mb-8">Shop By Category</h2>
            <Carousel
              opts={{
                align: 'start',
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {categories.map((category) => (
                  <CarouselItem key={category.id} className="pl-4 basis-[40%] md:basis-1/4 lg:basis-[12.5%]">
                      <CategoryItem category={category} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 hidden lg:flex" />
              <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 hidden lg:flex" />
            </Carousel>
        </div>
    </section>
  );
}
