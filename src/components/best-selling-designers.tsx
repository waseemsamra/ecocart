'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, doc, documentId } from 'firebase/firestore';
import type { Product, Brand, BestSellingDesigners } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { slugify, cn } from '@/lib/utils';

function BestSellingDesignerCard({ brand, product, className }: { brand: Brand; product?: Product, className?: string }) {
  const brandSlug = brand.slug || slugify(brand.name);
  const linkHref = `/brands/${brandSlug}`;
  
  const imageUrl = product?.images?.[0]?.imageUrl || 'https://placehold.co/600x800';
  const imageHint = product?.images?.[0]?.imageHint || '';
  const imageAlt = product?.images?.[0]?.description || brand.name;

  return (
    <Link href={linkHref} className={cn("relative group block overflow-hidden rounded-lg h-full w-full", className)}>
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        data-ai-hint={imageHint}
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h3 className="font-headline text-lg font-bold uppercase">{brand.name}</h3>
        <p className="text-xs uppercase tracking-wider group-hover:underline">Shop Now</p>
      </div>
    </Link>
  );
}

export function BestSellingDesigners() {
  const db = useFirestore();

  const settingsRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'settings', 'bestSellingDesigners');
  }, [db]);

  const { data: settings, isLoading: isLoadingSettings } = useDoc<BestSellingDesigners>(settingsRef);
  
  const brandIds = useMemo(() => settings?.brandIds || [], [settings]);

  const brandsQuery = useMemo(() => {
    if (!db || brandIds.length === 0) return null;
    const q = query(collection(db, 'brands'), where(documentId(), 'in', brandIds));
    (q as any).__memo = true;
    return q;
  }, [db, brandIds]);

  const { data: brandsData, isLoading: isLoadingBrands } = useCollection<Brand>(brandsQuery);

  const productsQuery = useMemo(() => {
    if (!db || brandIds.length === 0) return null;
    // This fetches products that belong to ANY of the featured brands. We'll sort them out later.
    const q = query(collection(db, 'products'), where('brandIds', 'array-contains-any', brandIds));
    (q as any).__memo = true;
    return q;
  }, [db, brandIds]);
  
  const { data: productsData, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const brandsWithProducts = useMemo(() => {
    if (!brandsData || !productsData) return [];

    const productMap = new Map<string, Product>();
    for (const product of productsData) {
        const brandId = product.brandIds?.[0];
        if (brandId && !productMap.has(brandId)) {
            productMap.set(brandId, product);
        }
    }
    
    // Order brands according to the order in settings
    return brandIds
      .map(id => {
        const brand = brandsData.find(b => b.id === id);
        if (!brand) return null;
        return {
            brand,
            product: productMap.get(id)
        };
      })
      .filter((item): item is { brand: Brand; product?: Product } => !!item);

  }, [brandsData, productsData, brandIds]);

  const isLoading = isLoadingSettings || isLoadingBrands || isLoadingProducts;

  if (isLoading) {
    return (
      <section className="py-12 md:py-20">
        <div className="container"><Skeleton className="h-96 w-full" /></div>
      </section>
    );
  }
  
  if (brandsWithProducts.length < 5) {
    return null;
  }

  const [item1, item2, item3, item4, item5] = brandsWithProducts;

  return (
    <section className="py-12 md:py-20">
      <div className="container">
         <div className="flex justify-between items-baseline mb-8">
            <h2 className="font-headline text-2xl font-bold tracking-widest uppercase">Bestselling Designers</h2>
            <Link href="/brands" className="text-xs font-semibold text-muted-foreground hover:text-primary tracking-widest">
                VIEW ALL
            </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 md:auto-rows-[25rem]">
            {item1 && (
                <div className="md:col-span-2">
                    <BestSellingDesignerCard brand={item1.brand} product={item1.product} />
                </div>
            )}
            {item2 && (
                <div className="md:col-span-1">
                    <BestSellingDesignerCard brand={item2.brand} product={item2.product} />
                </div>
            )}
            {item3 && (
                <div className="md:col-span-1">
                    <BestSellingDesignerCard brand={item3.brand} product={item3.product} />
                </div>
            )}
            {item4 && (
                <div className="md:col-span-1">
                    <BestSellingDesignerCard brand={item4.brand} product={item4.product} />
                </div>
            )}
            {item5 && (
                <div className="md:col-span-1">
                    <BestSellingDesignerCard brand={item5.brand} product={item5.product} />
                </div>
            )}
        </div>
      </div>
    </section>
  );
}
