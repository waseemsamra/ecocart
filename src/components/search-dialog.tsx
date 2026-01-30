'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, Loader2 } from 'lucide-react';
import { collection, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';
import { useAuth } from '@/context/auth-context';

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const db = useFirestore();

  const productsQuery = useMemo(() => {
    if (!open || !db) return null;
    const q = query(collection(db, 'products'));
    (q as any).__memo = true;
    return q;
  }, [open, db]);

  const { data: allProducts, isLoading: isLoadingData } = useCollection<Product>(productsQuery);
  const isLoading = authLoading || isLoadingData;

  const [defaultProducts, setDefaultProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
      setDefaultProducts(shuffled.slice(0, 20));
    }
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return defaultProducts;
    }
    if (!allProducts) return [];
    return allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allProducts, defaultProducts]);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setSearchTerm(''), 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleProductClick = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    router.push(`/products/${productId}`);
    
    setTimeout(() => {
      setOpen(false);
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="w-full">
            <div className="hidden lg:block w-full">
                 <div className="relative w-full max-w-md cursor-pointer" role="button">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <div className="pl-9 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background flex items-center">
                        Search for mailers
                    </div>
                </div>
            </div>
            <div className="lg:hidden">
                <Button variant="ghost" size="icon">
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search</span>
                </Button>
            </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-none w-screen h-screen sm:max-w-none sm:h-screen sm:rounded-none p-0 overflow-y-auto bg-background">
        <DialogTitle className="sr-only">Search Products</DialogTitle>
        <DialogDescription className="sr-only">Search for products, view suggestions, and see results as you type.</DialogDescription>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-2xl mx-auto relative">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <Input
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for mailers, boxes, and more..."
                className="w-full h-16 rounded-full text-lg pl-14 pr-36 bg-secondary border-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 {searchTerm && <span className="text-sm text-muted-foreground">{filteredProducts.length} results</span>}
                 <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-background/50 hover:bg-background" onClick={() => setOpen(false)}>
                    <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="mt-8">
              {isLoading ? (
                <div className="flex justify-center items-center h-full p-8 pt-24">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredProducts && filteredProducts.length > 0 ? (
                <>
                  {!searchTerm && <h3 className="font-headline text-2xl font-bold mb-6 text-center">Trending Products</h3>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {filteredProducts.map(product => (
                          <ProductCard key={product.id} product={product} onClick={(e) => handleProductClick(e, product.id)} />
                      ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-24 px-8">
                    <h3 className="font-headline text-2xl font-bold">No Products Found</h3>
                    <p className="text-muted-foreground mt-2">Your search for "{searchTerm}" did not match any products.</p>
                </div>
              )}
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
