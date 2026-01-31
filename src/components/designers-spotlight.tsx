'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import type { Product, Brand, SpotlightSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { slugify } from '@/lib/utils';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

function ModernMustHaveCard({ product, brandsMap }: { product: Product; brandsMap: Map<string, Brand> }) {
  const brandId = product.brandIds?.[0];
  const brand = brandId ? brandsMap.get(brandId) : null;
  
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
      <div className="mt-2 text-center">
        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{brand?.name || product.name}</h3>
      </div>
    </Link>
  );
}

export function DesignersSpotlight() {
  const db = useFirestore();

  // Fetch Spotlight Settings
  const settingsRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'settings', 'spotlight');
  }, [db]);
  const { data: spotlightSetting, isLoading: isLoadingSettings } = useDoc<SpotlightSettings>(settingsRef);
  
  const brandId = spotlightSetting?.brandId;

  // Fetch Featured Brand
  const brandRef = useMemo(() => {
    if (!db || !brandId) return null;
    return doc(db, 'brands', brandId);
  }, [db, brandId]);
  const { data: brand, isLoading: isLoadingBrand } = useDoc<Brand>(brandRef);
  
  // Fetch "Modern Must-Haves" products
  const productsQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'products'), where('showInModernMustHaves', '==', true), limit(6));
    (q as any).__memo = true;
    return q;
  }, [db]);
  const { data: mustHaveProducts, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  // Fetch all brands for the must-have cards
  const { data: allBrands, isLoading: isLoadingAllBrands } = useCollection<Brand>(
    useMemo(() => {
      if (!db) return null;
      const q = query(collection(db, 'brands'));
      (q as any).__memo = true;
      return q;
    }, [db])
  );
  
  const brandsMap = useMemo(() => {
    if (!allBrands) return new Map();
    return new Map(allBrands.map(b => [b.id, b]));
  }, [allBrands]);

  const isLoading = isLoadingSettings || isLoadingBrand || isLoadingProducts || isLoadingAllBrands;

  if (isLoading) {
    return (
      <section className="py-12 md:py-20">
        <div className="container">
           <Skeleton className="h-[60vh] w-full" />
        </div>
      </section>
    );
  }
  
  if (!spotlightSetting || !brand || !mustHaveProducts) {
    return null; // Don't render if essential data is missing
  }
  
  const brandSlug = brand.slug || slugify(brand.name);
  const linkHref = `/brands/${brandSlug}`;

  return (
    <section className="py-12 md:py-20">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          <h2 className="font-headline text-2xl font-bold tracking-widest uppercase">Designers in the Spotlight</h2>
          <h2 className="font-headline text-2xl font-bold tracking-widest uppercase">Modern Must-Haves</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <div className="relative group overflow-hidden bg-muted">
                <Image
                    src={spotlightSetting.imageUrl}
                    alt={brand.name}
                    fill
                    className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={spotlightSetting.imageHint}
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <h3 className="font-headline text-3xl font-bold">{brand.name}</h3>
                    <Button asChild variant="link" className="text-white p-0 h-auto mt-2">
                        <Link href={linkHref}>
                            SHOP NOW <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                {mustHaveProducts.map(product => (
                    <ModernMustHaveCard key={product.id} product={product} brandsMap={brandsMap} />
                ))}
            </div>
        </div>
      </div>
    </section>
  );
}
