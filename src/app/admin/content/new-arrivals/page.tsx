'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { collection, query, updateDoc, doc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, PlusCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

function ProductListItem({
  product,
  onAction,
  actionType,
}: {
  product: Product;
  onAction: () => void;
  actionType: 'add' | 'remove';
}) {
  const Icon = actionType === 'add' ? PlusCircle : XCircle;
  const buttonVariant = actionType === 'add' ? 'outline' : 'ghost';
  const iconColor = actionType === 'add' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="flex items-center gap-4 py-2">
      <Image
        alt={product.name}
        className="aspect-square rounded-md object-cover"
        height="40"
        src={product.images?.[0]?.imageUrl || 'https://placehold.co/40x40'}
        width="40"
      />
      <div className="flex-1">
        <p className="text-sm font-medium truncate">{product.name}</p>
      </div>
      <Button size="icon" variant={buttonVariant} onClick={onAction}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </Button>
    </div>
  );
}

export default function AdminNewArrivalsPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { loading: authLoading } = useAuth();

  const [featuredSearch, setFeaturedSearch] = useState('');
  const [availableSearch, setAvailableSearch] = useState('');

  const productsQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'products'));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: allProducts, isLoading: isLoadingData, error } = useCollection<Product>(productsQuery);
  const isLoading = authLoading || isLoadingData;

  const { featuredProducts, availableProducts } = useMemo(() => {
    if (!allProducts) return { featuredProducts: [], availableProducts: [] };
    const featured = allProducts.filter(p => p.showInNewArrivals);
    const available = allProducts.filter(p => !p.showInNewArrivals);
    return { featuredProducts, availableProducts };
  }, [allProducts]);

  const filteredFeatured = useMemo(() => {
    return featuredProducts.filter(p => p.name.toLowerCase().includes(featuredSearch.toLowerCase()));
  }, [featuredProducts, featuredSearch]);

  const filteredAvailable = useMemo(() => {
    return availableProducts.filter(p => p.name.toLowerCase().includes(availableSearch.toLowerCase()));
  }, [availableProducts, availableSearch]);

  const handleToggleNewArrival = async (product: Product, show: boolean) => {
    if (!db) return;
    const productRef = doc(db, 'products', product.id);
    try {
      await updateDoc(productRef, {
        showInNewArrivals: show,
      });
      toast({
        title: 'Success',
        description: `Product ${show ? 'added to' : 'removed from'} "New Arrivals".`,
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (error) {
    return <p className="text-destructive text-center p-8">{error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold">New Arrivals Selections</h1>
        <p className="text-muted-foreground">Add or remove products from the 'New Arrivals' homepage section.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Featured in New Arrivals ({filteredFeatured.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search featured..." className="pl-8" value={featuredSearch} onChange={e => setFeaturedSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {filteredFeatured.length > 0 ? (
                filteredFeatured.map(product => (
                  <ProductListItem
                    key={product.id}
                    product={product}
                    actionType="remove"
                    onAction={() => handleToggleNewArrival(product, false)}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No products in New Arrivals.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Available Products ({filteredAvailable.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search available..." className="pl-8" value={availableSearch} onChange={e => setAvailableSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {filteredAvailable.length > 0 ? (
                filteredAvailable.map(product => (
                  <ProductListItem
                    key={product.id}
                    product={product}
                    actionType="add"
                    onAction={() => handleToggleNewArrival(product, true)}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No products to add.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
