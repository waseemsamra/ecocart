'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, limit, doc, documentId } from 'firebase/firestore';
import type { Product, Brand, BestSellingDesigners } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { slugify } from '@/lib/utils';
import { Button } from './ui/button';

function BestSellingDesignerCard({ brand, product }: { brand: Brand; product?: Product }) {
  const brandSlug = brand.slug || slugify(brand.name);
  const linkHref = `/brands/${brandSlug}`;
  
  const imageUrl = product?.images?.[0]?.imageUrl || 'https://placehold.co/600x800';
  const imageHint = product?.images?.[0]?.imageHint || '';
  const imageAlt = product?.images?.[0]?.description || brand.name;

  return (
    <Link href={linkHref} className="relative group block overflow-hidden aspect-[3/4] rounded-lg">
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        data-ai-hint={imageHint}
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white text-center">
        <h3 className="font-headline text-lg font-bold uppercase">{brand.name}</h3>
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
    const q = query(collection(db, 'products'), where('brandIds', 'array-contains-any', brandIds), limit(brandIds.length));
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
        <div className="container">
           <Skeleton className="h-96 w-full" />
        </div>
      </section>
    );
  }
  
  if (brandsWithProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-20">
      <div className="container text-center">
        <h2 className="font-headline text-3xl font-bold md:text-4xl">Best-Selling Designers</h2>
        <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
          Discover our top brands, celebrated for their exceptional quality and style.
        </p>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {brandsWithProducts.map(({brand, product}) => (
                <BestSellingDesignerCard key={brand.id} brand={brand} product={product} />
            ))}
        </div>
      </div>
    </section>
  );
}
