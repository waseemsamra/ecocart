'use client';

import Image from 'next/image';
import { useParams, notFound } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import type { Product, Size, Colour } from '@/lib/types';
import { doc, collection, query, where, documentId } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Loader2, Truck, Zap, Leaf, HelpCircle } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { QuantityPricingTable } from '@/components/quantity-pricing-table';
import { ProductInfoAccordion } from '@/components/product-info-accordion';
import { RelatedProducts } from '@/components/related-products';
import { BrandStories } from '@/components/brand-stories';
import { useAuth } from '@/context/auth-context';

type PricingTier = { qty: number; pricePerUnit: number; save: number; total: number; };
const defaultTier = { qty: 1000, pricePerUnit: 0.130, save: 0, total: 130.00 };


export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const db = useFirestore();
  const { loading: authLoading } = useAuth();

  const productRef = useMemo(() => {
    if (!db || !params.id) return null;
    const ref = doc(db, 'products', params.id);
    (ref as any).__memo = true;
    return ref;
  }, [params.id, db]);

  const { data: product, isLoading: isLoadingProduct, error } = useDoc<Product>(productRef);

  useEffect(() => {
    // Only run on the client and when a product is successfully loaded.
    if (typeof window !== 'undefined' && product) {
        const RECENTLY_VIEWED_KEY = 'recentlyViewed';
        const MAX_RECENTLY_VIEWED = 10;
        
        try {
            const storedIdsRaw = localStorage.getItem(RECENTLY_VIEWED_KEY);
            const storedIds = storedIdsRaw ? JSON.parse(storedIdsRaw) : [];

            const filteredIds = storedIds.filter((id: string) => id !== product.id);
            const newIds = [product.id, ...filteredIds];
            const finalIds = newIds.slice(0, MAX_RECENTLY_VIEWED);
            
            localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(finalIds));
        } catch (e) {
            console.error("Failed to update recently viewed products:", e);
        }
    }
  }, [product]);

  const sizesQuery = useMemo(() => {
    if (!db || !product?.sizeIds || product.sizeIds.length === 0) return null;
    const q = query(collection(db, 'sizes'), where(documentId(), 'in', product.sizeIds));
    (q as any).__memo = true;
    return q;
  }, [product, db]);
  const { data: availableSizes } = useCollection<Size>(sizesQuery);

  const coloursQuery = useMemo(() => {
    if (!db || !product?.colourIds || product.colourIds.length === 0) return null;
    const q = query(collection(db, 'colours'), where(documentId(), 'in', product.colourIds));
    (q as any).__memo = true;
    return q;
  }, [product, db]);
  const { data: availableColours } = useCollection<Colour>(coloursQuery);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedLid, setSelectedLid] = useState<string | null>('None');
  const [selectedTier, setSelectedTier] = useState<PricingTier>(defaultTier);
  const [selectedColour, setSelectedColour] = useState<string | null>(null);

  const isLoading = authLoading || isLoadingProduct;

  useEffect(() => {
    if (availableSizes && availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0].id);
    }
    if (availableColours && availableColours.length > 0 && !selectedColour) {
      setSelectedColour(availableColours[0].id);
    }
  }, [availableSizes, selectedSize, availableColours, selectedColour]);

  if (isLoading || !params.id) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return notFound();
  }
  
  const handleDesignLater = () => {
    if (product) {
        addToCart(product, selectedTier.qty);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12">
        {/* Left scrolling column */}
        <div className="md:col-span-7">
          <div className="bg-muted/30 pt-16">
            <Carousel className="w-full max-w-2xl mx-auto">
              <CarouselContent>
                {product.images && product.images.length > 0 ? (
                  product.images.map((image) => (
                    <CarouselItem key={image.id}>
                      <div className="aspect-square relative">
                        <Image
                          src={image.imageUrl || 'https://placehold.co/800x600'}
                          alt={image.description || product.name}
                          fill
                          className="object-cover"
                          data-ai-hint={image.imageHint}
                        />
                      </div>
                    </CarouselItem>
                  ))
                ) : (
                  <CarouselItem>
                    <div className="aspect-square relative bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No Image</span>
                    </div>
                  </CarouselItem>
                )}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-10 top-1/2 -translate-y-1/2 hidden md:flex" />
              <CarouselNext className="absolute -right-10 top-1/2 -translate-y-1/2 hidden md:flex" />
            </Carousel>
          </div>
          <div className="bg-background">
             <div className="container py-12 md:py-20 space-y-16">
                <ProductInfoAccordion product={product} />
                <RelatedProducts />
            </div>
          </div>
        </div>

        {/* Right sticky column */}
        <div className="md:col-span-5">
           <div className="md:sticky md:top-32 p-8 pt-16 md:py-0 md:px-12 lg:px-16">
              <div className="w-full max-w-md">
                <div className="text-sm text-muted-foreground">
                  <span>Hot Cups</span> — <span>Custom Coffee Cups Compostable</span>
                </div>

                <h1 className="font-headline text-3xl lg:text-4xl font-bold mt-2">{product.name}</h1>

                <p className="text-lg text-muted-foreground mt-2">from DH{product.price.toFixed(3)} / unit</p>

                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm text-primary">
                  Free standard shipping & proofing available on all orders*
                </div>

                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">Estimated arrival:</h3>
                  <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">Standard (Free): Feb 13 - Feb 15</span>
                    </div>
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                      <Leaf className="h-4 w-4 text-green-600"/>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">Express: Feb 02 - Feb 04</span>
                    </div>
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                      <Leaf className="h-4 w-4 text-green-600"/>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-6">
                  {availableColours && availableColours.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Colour</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {availableColours.map((colour) => (
                          <Button key={colour.id} variant={selectedColour === colour.id ? 'default' : 'outline'} onClick={() => setSelectedColour(colour.id)}>{colour.name}</Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {availableSizes && availableSizes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">Size (Capacity) <HelpCircle className="h-4 w-4 text-muted-foreground"/></h3>
                      <div className="grid grid-cols-2 gap-2">
                        {availableSizes.map((size) => (
                          <Button key={size.id} variant={selectedSize === size.id ? 'default' : 'outline'} onClick={() => setSelectedSize(size.id)}>{size.name}</Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">Lid Type <HelpCircle className="h-4 w-4 text-muted-foreground"/></h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant={selectedLid === 'None' ? 'default' : 'outline'} onClick={() => setSelectedLid('None')}>None</Button>
                      <Button variant={selectedLid === 'Sip' ? 'default' : 'outline'} onClick={() => setSelectedLid('Sip')}>Sip (Paper)</Button>
                    </div>
                  </div>
                </div>

                <QuantityPricingTable onQuantityChange={setSelectedTier} />

                <div className="mt-6 text-right">
                  <p className="text-sm text-muted-foreground">Total (excl. VAT)</p>
                  <p className="font-headline text-3xl font-bold">DH{selectedTier.total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">or financing from DH{(selectedTier.total / 4).toFixed(2)}/Mo.</p>
                </div>

                <div className="mt-6 space-y-3">
                  <Button size="lg" className="w-full bg-pink-500 hover:bg-pink-600 text-white">Upload design</Button>
                  <Button size="lg" variant="outline" className="w-full" onClick={handleDesignLater}>
                    Design later — Add to cart
                  </Button>
                </div>
              </div>
            </div>
        </div>
      </div>
      <BrandStories />
    </>
  );
}
