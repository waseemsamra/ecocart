'use client';

import * as React from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import type { Product, PackagingPartnerSettings } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ProductCard } from '@/components/product-card';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';

const defaultSettings: PackagingPartnerSettings = {
    id: 'packagingPartner',
    title: 'Packaging partner to world-leading brands',
    tabs: [
        { id: 'new-in', label: 'New In' },
        { id: 'most-popular', label: 'Most Popular' },
        { id: 'ready-to-ship', label: 'Ready to Ship' },
    ],
};


export function PackagingPartner() {
  const db = useFirestore();

  const settingsRef = React.useMemo(() => {
    if (!db) return null;
    const ref = doc(db, 'settings', 'packagingPartner');
    (ref as any).__memo = true;
    return ref;
  }, [db]);

  const { data: settingsData, isLoading: isLoadingSettings } = useDoc<PackagingPartnerSettings>(settingsRef);
  const settings = settingsData || defaultSettings;
  
  const [activeTabId, setActiveTabId] = React.useState(settings.tabs[0].id);

  React.useEffect(() => {
    if (settings && !settings.tabs.some(t => t.id === activeTabId)) {
        setActiveTabId(settings.tabs[0]?.id);
    }
  }, [settings, activeTabId]);


  const productsQuery = React.useMemo(() => {
    if (!db || !activeTabId) return null;
    const q = query(collection(db, 'products'), where('packagingPartnerTags', 'array-contains', activeTabId), limit(10));
    (q as any).__memo = true;
    return q;
  }, [db, activeTabId]);

  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
  const isLoading = isLoadingSettings || isLoadingProducts;

  if (isLoadingSettings) {
     return (
        <section className="py-12 md:py-20">
            <div className="container">
                <Skeleton className="h-96 w-full" />
            </div>
        </section>
     )
  }

  return (
    <section className="py-12 md:py-20">
      <div className="container">
            <h2 className="font-headline text-3xl font-bold md:text-4xl">
                {settings.title}
            </h2>
            <div className="flex items-center gap-2 mt-4 mb-8">
                {settings.tabs.map(tab => (
                    <Button
                        key={tab.id}
                        variant={activeTabId === tab.id ? 'default' : 'ghost'}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`rounded-full ${activeTabId === tab.id ? 'bg-accent text-accent-foreground' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        {tab.label}
                    </Button>
                ))}
            </div>
        {isLoadingProducts && (
             <div className="flex space-x-4">
                {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pl-4 -ml-4">
                         <Skeleton className="aspect-square rounded-xl" />
                         <Skeleton className="h-4 w-3/4 mt-4" />
                         <Skeleton className="h-4 w-1/2 mt-2" />
                    </div>
                ))}
            </div>
        )}
        {!isLoadingProducts && products && products.length > 0 && (
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
        {!isLoadingProducts && (!products || products.length === 0) && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <h3 className="font-headline text-xl font-bold">No Products Found</h3>
                <p className="text-muted-foreground mt-2">There are no products for this tab yet. Add some in the admin panel!</p>
            </div>
        )}
      </div>
    </section>
  );
}
