'use client';

import { useState, useMemo, Suspense } from 'react';
import { useParams, notFound } from 'next/navigation';
import { collection, query, where, Query, DocumentData } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Product, Brand } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Loader2, LayoutGrid, List, Filter, ArrowLeft, ArrowRight } from 'lucide-react';
import { ProductFilters } from '@/components/product-filters';
import { Button } from '@/components/ui/button';
import { cn, slugify } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) {
    const handlePrevious = () => {
        onPageChange(currentPage - 1);
    };

    const handleNext = () => {
        onPageChange(currentPage + 1);
    };

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-center space-x-6 mt-12">
            <Button variant="outline" onClick={handlePrevious} disabled={currentPage <= 1}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
            </Button>
            <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" onClick={handleNext} disabled={currentPage >= totalPages}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}


function BrandPageContent() {
  const params = useParams<{ slug: string }>();
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 70;
  const { loading: authLoading } = useAuth();
  const db = useFirestore();
  
  const brandSlug = params.slug;

  const allBrandsQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'brands'));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: allBrands, isLoading: isLoadingBrand } = useCollection<Brand>(allBrandsQuery);

  const brand = useMemo(() => {
    if (!allBrands || !brandSlug) return undefined;
    // First, try to find by the 'slug' field.
    const brandBySlug = allBrands.find(b => b.slug === brandSlug);
    if (brandBySlug) return brandBySlug;
    // As a fallback, find by slugifying the name. This handles old data.
    return allBrands.find(b => slugify(b.name) === brandSlug);
  }, [allBrands, brandSlug]);
  
  const brandId = brand?.id;

  const productsQuery = useMemo(() => {
    if (!db || !brandId) return null;
    
    let q: Query<DocumentData> = query(collection(db, 'products'), where('brandIds', 'array-contains', brandId));

    // Apply user-selected filters
    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        // Ensure we don't re-add the brand filter if it's somehow in the state
        if (key !== 'brandIds') {
            q = query(q, where(key, 'array-contains-any', values));
        }
      }
    });

    (q as any).__memo = true;
    return q;
  }, [brandId, filters, db]);

  const { data: products, isLoading: isLoadingProducts, error } = useCollection<Product>(productsQuery);
  
  const isLoading = authLoading || isLoadingBrand || isLoadingProducts;

  const initialBrandFilter = useMemo(() => {
      return brandId ? { 'brandIds': [brandId] } : {};
  }, [brandId]);

  const availableOptions = useMemo(() => {
    if (!products) return {};

    const options: Record<string, Set<string>> = {
        categoryIds: new Set(),
        sizeIds: new Set(),
        colourIds: new Set(),
        materialTypeIds: new Set(),
        finishTypeIds: new Set(),
        adhesiveIds: new Set(),
        handleIds: new Set(),
        shapeIds: new Set(),
        lidIds: new Set(),
    };

    for (const product of products) {
        product.categoryIds?.forEach(id => options.categoryIds.add(id));
        product.sizeIds?.forEach(id => options.sizeIds.add(id));
        product.colourIds?.forEach(id => options.colourIds.add(id));
        product.materialTypeIds?.forEach(id => options.materialTypeIds.add(id));
        product.finishTypeIds?.forEach(id => options.finishTypeIds.add(id));
        product.adhesiveIds?.forEach(id => options.adhesiveIds.add(id));
        product.handleIds?.forEach(id => options.handleIds.add(id));
        product.shapeIds?.forEach(id => options.shapeIds.add(id));
        product.lidIds?.forEach(id => options.lidIds.add(id));
    }

    const result: Record<string, string[]> = {};
    for (const key in options) {
        result[key] = Array.from(options[key as keyof typeof options]);
    }
    return result;
  }, [products]);

  const paginatedProducts = useMemo(() => {
    if (!products) return [];
    const startIndex = (currentPage - 1) * productsPerPage;
    return products.slice(startIndex, startIndex + productsPerPage);
  }, [products, currentPage]);
  
  const pageCount = useMemo(() => {
      return products ? Math.ceil(products.length / productsPerPage) : 0;
  }, [products]);


  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoadingBrand && !brand) {
      return notFound();
  }

  const filtersComponent = (
    <ProductFilters 
      onFiltersChange={setFilters} 
      initialFilters={initialBrandFilter} 
      disabledFilters={['brandIds']}
      availableOptions={availableOptions}
    />
  );

  return (
    <>
      {brand && (
        <section className="bg-secondary py-12 text-center">
            <div className="container">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">{brand.name}</h1>
                {brand.description && <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">{brand.description}</p>}
            </div>
        </section>
      )}

      <div className="container py-12">
        <div>
          <main>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                        <SheetDescription className="sr-only">Apply filters to narrow down product results.</SheetDescription>
                      </SheetHeader>
                      <div className="py-4">
                        {filtersComponent}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isLoadingProducts ? 'Searching...' : `Showing ${paginatedProducts.length} of ${products?.length || 0} products`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setLayout('grid')} className={cn(layout === 'grid' && 'bg-accent')}>
                      <LayoutGrid className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setLayout('list')} className={cn(layout === 'list' && 'bg-accent')}>
                      <List className="h-5 w-5" />
                  </Button>
              </div>
            </div>
            
            {isLoadingProducts && (
              <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {error && (
              <div className="text-center text-red-500 py-12">
                <p>Error loading products: {error.message}</p>
              </div>
            )}

            {!isLoadingProducts && !error && (
              <>
              {products && products.length > 0 ? (
                <>
                  <div className={cn(
                      "grid gap-8",
                      layout === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"
                  )}>
                      {paginatedProducts.map(product => (
                          <ProductCard key={product.id} product={product} layout={layout} />
                      ))}
                  </div>
                  <Pagination currentPage={currentPage} totalPages={pageCount} onPageChange={setCurrentPage} />
                </>
              ) : (
                  <div className="text-center py-24 border-2 border-dashed rounded-lg">
                      <h3 className="font-headline text-2xl font-bold">No Products Found</h3>
                      <p className="text-muted-foreground mt-2">There are no products for this brand yet.</p>
                  </div>
              )}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default function BrandPage() {
    return (
        <Suspense fallback={
            <div className="container py-12 flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <BrandPageContent />
        </Suspense>
    )
}
