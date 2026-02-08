'use client';

import { useParams, notFound } from 'next/navigation';
import { useMemo } from 'react';
import Link from 'next/link';
import { collection, query, where, doc, limit } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Product, Category } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

function ProductCarousel({ products }: { products: Product[] }) {
    if (!products || products.length === 0) return null;

    return (
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
    );
}

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const { loading: authLoading } = useAuth();
  const db = useFirestore();

  const categorySlug = params.slug;

  const categoryQuery = useMemo(() => {
    if (!db || !categorySlug) return null;
    const q = query(collection(db, 'categories'), where('slug', '==', categorySlug), limit(1));
    (q as any).__memo = true;
    return q;
  }, [categorySlug, db]);

  const { data: categories, isLoading: isLoadingCategory } = useCollection<Category>(categoryQuery);
  const category = useMemo(() => categories?.[0], [categories]);
  const categoryId = category?.id;

  const subCategoriesQuery = useMemo(() => {
    if (!db || !categoryId) return null;
    const q = query(collection(db, 'categories'), where('parentId', '==', categoryId));
    (q as any).__memo = true;
    return q;
  }, [categoryId, db]);
  const { data: subCategories, isLoading: isLoadingSubCategories } = useCollection<Category>(subCategoriesQuery);

  const productsQuery = useMemo(() => {
    if (!db || !categoryId) return null;
    let q = query(collection(db, 'products'), where('categoryIds', 'array-contains', categoryId));
    (q as any).__memo = true;
    return q;
  }, [categoryId, db]);

  const { data: products, isLoading: isLoadingProducts, error } = useCollection<Product>(productsQuery);

  const isLoading = authLoading || isLoadingCategory || isLoadingProducts || isLoadingSubCategories;

  const displayedProductIds = useMemo(() => new Set<string>(), []);

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoadingCategory && !category) {
      return notFound();
  }
  
  return (
    <>
      {category && (
        <section className="relative h-96 flex items-center justify-center text-center text-white bg-secondary">
          {category.imageUrl && (
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              className="object-cover"
              data-ai-hint={category.imageHint}
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 p-4 max-w-3xl">
            <h1 className="font-headline text-4xl md:text-5xl font-bold">{category.name}</h1>
            <p className="text-white/90 mt-4 text-lg">{category.description}</p>
          </div>
        </section>
      )}
      
      <main className="container py-12 space-y-16">
          {error && (
            <div className="text-center text-red-500 py-12">
              <p>Error loading products: {error.message}</p>
            </div>
          )}

          {!error && products && (
              <>
                {subCategories && subCategories.sort((a,b) => (a.order || 0) - (b.order || 0)).map(subCategory => {
                    const subCatProducts = products.filter(p => p.categoryIds?.includes(subCategory.id));
                    if(subCatProducts.length === 0) return null;

                    subCatProducts.forEach(p => displayedProductIds.add(p.id));
                    
                    return (
                        <section key={subCategory.id}>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="font-headline text-3xl font-bold">{subCategory.name}</h2>
                                <Link href={`/products?category=${subCategory.id}`} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                                    View all
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                            <ProductCarousel products={subCatProducts} />
                        </section>
                    )
                })}

                {(() => {
                    const remainingProducts = products.filter(p => !displayedProductIds.has(p.id));
                    if (remainingProducts.length > 0) {
                       return (
                         <section>
                            <h2 className="font-headline text-3xl font-bold mb-8">
                                {subCategories && subCategories.length > 0 ? `Other ${category?.name}` : category?.name}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                                {remainingProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </section>
                       )
                    }
                    // Only show "No products" message if there are no subcategories AND no remaining products.
                    if (products.length === 0) {
                      return (
                        <div className="text-center py-24 border-2 border-dashed rounded-lg">
                          <h3 className="font-headline text-2xl font-bold">No Products Found</h3>
                          <p className="text-muted-foreground mt-2">There are no products in this category yet.</p>
                        </div>
                      )
                    }
                    return null;
                })()}
              </>
          )}
        </main>
    </>
  );
}
