'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, Query, DocumentData } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Loader2, LayoutGrid, List, Filter } from 'lucide-react';
import { ProductFilters } from '@/components/product-filters';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Pagination } from '@/components/pagination';

function ProductsPageContent() {
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 100;
  const { loading: authLoading } = useAuth();
  const db = useFirestore();
  
  const searchParams = useSearchParams();
  
  const showInWeddingTales = searchParams.get('showInWeddingTales') === 'true';
  const showInDesignersOnDiscount = searchParams.get('showInDesignersOnDiscount') === 'true';
  const packagingPartnerTag = searchParams.get('tag');

  const initialFilters = useMemo(() => {
    const categoryId = searchParams.get('category');
    const brandId = searchParams.get('brand');
    const newFilters: Record<string, string[]> = {};
    if (categoryId) {
        newFilters.categoryIds = [categoryId];
    }
    if (brandId) {
        newFilters.brandIds = [brandId];
    }
    return newFilters;
  }, [searchParams]);

  const productsQuery = useMemo(() => {
    if (!db) return null;
    let q: Query<DocumentData> = collection(db, 'products');

    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        q = query(q, where(key, 'array-contains-any', values));
      }
    });
    
    if (showInWeddingTales) {
        q = query(q, where('showInWeddingTales', '==', true));
    }

    if (showInDesignersOnDiscount) {
        q = query(q, where('showInDesignersOnDiscount', '==', true));
    }

    if (packagingPartnerTag) {
        q = query(q, where('packagingPartnerTags', 'array-contains', packagingPartnerTag));
    }

    (q as any).__memo = true;
    return q;
  }, [filters, db, showInWeddingTales, showInDesignersOnDiscount, packagingPartnerTag]);

  const { data: products, isLoading: isLoadingData, error } = useCollection<Product>(productsQuery);
  const isLoading = authLoading || isLoadingData;
  
  const pageTitle = useMemo(() => {
    if (showInWeddingTales) return "Wedding Tales Collection";
    if (showInDesignersOnDiscount) return "Designers on Discount";
    if (packagingPartnerTag === 'ready-to-ship') return "Ready to Ship Stunners";
    return "Find Your Perfect Packaging";
  }, [showInWeddingTales, showInDesignersOnDiscount, packagingPartnerTag]);

  const pageDescription = useMemo(() => {
    if (showInWeddingTales) return "A curated collection of our most romantic and elegant products, perfect for any wedding.";
    if (showInDesignersOnDiscount) return "Discover exclusive deals from top designers, available for a limited time.";
    if (packagingPartnerTag === 'ready-to-ship') return "These items are in stock and ready to ship out immediately.";
    return "Use our advanced filters to discover products tailored to your brand's needs. Select materials, sizes, colors, and more.";
  }, [showInWeddingTales, showInDesignersOnDiscount, packagingPartnerTag]);

  const paginatedProducts = useMemo(() => {
    if (!products) return [];
    const startIndex = (currentPage - 1) * productsPerPage;
    return products.slice(startIndex, startIndex + productsPerPage);
  }, [products, currentPage]);

  const pageCount = useMemo(() => {
    return products ? Math.ceil(products.length / productsPerPage) : 0;
  }, [products]);

  const filtersComponent = (
     <ProductFilters onFiltersChange={setFilters} initialFilters={initialFilters} />
  );

  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl font-bold">
            {pageTitle}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            {pageDescription}
        </p>
      </div>
      
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
                    {isLoading ? 'Searching...' : `Showing ${paginatedProducts.length} of ${products?.length || 0} products`}
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
          
          {isLoading && (
            <div className="flex justify-center items-center min-h-[50vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="text-center text-red-500 py-12">
              <p>Error loading products: {error.message}</p>
            </div>
          )}

          {!isLoading && !error && (
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
                    <p className="text-muted-foreground mt-2">Try adjusting your filters to find what you're looking for.</p>
                </div>
            )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="container py-12 flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ProductsPageContent />
        </Suspense>
    )
}
