'use client';

import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import type { Product, Size, Brand } from '@/lib/types';
import { doc, collection, query, where } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, Truck, Info, Zap } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils';

function ProductDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const db = useFirestore();

  const productId = params.id;

  const productRef = useMemo(() => {
    if (!db || !productId) return null;
    return doc(db, 'products', productId);
  }, [productId, db]);
  
  const { data: product, isLoading: isLoadingProduct } = useDoc<Product>(productRef);

  const [selectedImage, setSelectedImage] = useState(product?.images?.[0]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    if (product && product.images && product.images.length > 0) {
      if (!selectedImage) {
        setSelectedImage(product.images[0]);
      }
    }
  }, [product, selectedImage]);

  useEffect(() => {
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

  const brandQuery = useMemo(() => {
    if (!db || !product?.brandIds || product.brandIds.length === 0) return null;
    const q = query(collection(db, 'brands'), where('__name__', 'in', product.brandIds));
    (q as any).__memo = true;
    return q;
  }, [product, db]);
  const { data: brands } = useCollection<Brand>(brandQuery);
  const brand = useMemo(() => brands?.[0], [brands]);

  const sizesQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'sizes')); 
    (q as any).__memo = true;
    return q;
  }, [db]);
  
  const { data: dbSizes, isLoading: isLoadingSizes } = useCollection<Size>(sizesQuery);

  const availableSizes = useMemo(() => {
    if (dbSizes && dbSizes.length > 0) {
      return dbSizes;
    }
    // Fallback default sizes
    return [
      { id: 'xs', name: 'Extra Small', shortName: 'XS' },
      { id: 's', name: 'Small', shortName: 'S' },
      { id: 'm', name: 'Medium', shortName: 'M' },
      { id: 'l', name: 'Large', shortName: 'L' },
      { id: 'xl', name: 'Extra Large', shortName: 'XL' },
      { id: 'xxl', name: '2XL', shortName: '2XL' },
      { id: '3xl', name: '3XL', shortName: '3XL' },
      { id: '4xl', name: '4XL', shortName: '4XL' },
      { id: '5xl', name: '5XL', shortName: '5XL' },
      { id: '6xl', name: '6XL', shortName: '6XL' },
    ];
  }, [dbSizes]);

  useEffect(() => {
    if (availableSizes && availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0].id);
    }
  }, [availableSizes, selectedSize]);

  if (isLoadingProduct || isLoadingSizes) {
    return (
      <div className="py-8 px-4 md:px-0">
        <div className="container mx-auto">
          <div className="flex justify-center items-center min-h-[80vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return notFound();
  }

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, 1);
    }
  };
  
  const handleBuyNow = () => {
    if (product) {
      addToCart(product, 1);
      router.push('/checkout');
    }
  };

  return (
    <div className="py-8 px-4 md:px-0">
      <div className="container mx-auto">
        <div className="text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          {' > '}
          <span>{product.name}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-2">
              <div className="flex flex-col gap-3">
                {product.images?.map((image) => (
                  <button
                    key={image.id}
                    className={`aspect-square relative border-2 rounded-md overflow-hidden ${selectedImage?.id === image.id ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <Image
                      src={image.imageUrl || 'https://placehold.co/100x100'}
                      alt={image.description || product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 10vw, 5vw"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-10">
              <div className="aspect-[3/4] relative bg-muted rounded-lg overflow-hidden">
                {selectedImage ? (
                  <Image
                    src={selectedImage.imageUrl || 'https://placehold.co/600x800'}
                    alt={selectedImage.description || product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 80vw, 50vw"
                    priority
                  />
                ) : <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>}
              </div>
            </div>
          </div>

          <div className="md:sticky md:top-24">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                  <div>
                      {brand && <h1 className="text-4xl font-bold tracking-tight uppercase">{brand.name}</h1>}
                      <p className="text-lg text-muted-foreground">{product.name}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                      <Heart className="h-6 w-6" />
                  </Button>
              </div>
              
               <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">DH{product.price.toFixed(2)}</span>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>Price is inclusive of all taxes.</p>
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </div>
              <p className="text-xs text-muted-foreground">Incl. of taxes, excl. custom duties</p>

              <Separator className="my-6" />
              
              {availableSizes && availableSizes.length > 0 && (
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-semibold">Select your size</h3>
                      <Button variant="link" className="hidden md:inline-flex p-0 h-auto text-sm text-red-500 hover:underline">Size Guide</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {availableSizes.map((size) => (
                      <Button
                        key={size.id}
                        variant="outline"
                        onClick={() => setSelectedSize(size.id)}
                        className={cn(
                          "relative flex flex-col h-[60px] w-[60px] justify-center items-center p-1",
                          selectedSize === size.id ? "border-red-500 text-red-500" : ""
                        )}
                      >
                        {size.shortName === '6XL' && <span className="absolute -top-2 right-0 px-1 py-0.5 bg-black text-white text-[10px] font-semibold rounded">5 left</span>}

                        <span className="font-medium flex items-center">
                          {size.shortName}
                          {size.shortName === '6XL' && <Zap className="h-4 w-4 ml-1" />}
                        </span>
                        <span className="text-xs text-red-500 mt-1">25%</span>
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      className="h-[60px] w-auto px-4 border-red-500 text-red-500 hover:bg-red-500 hover:text-white focus:bg-red-500 focus:text-white"
                    >
                      CUSTOM TAILORED
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-2 text-sm text-muted-foreground mt-4">
                  <Truck className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>Standard Shipping: The estimated shipping date for this product is by 21st of February. Please note that this is the shipping date and not the delivery date.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button size="lg" className="bg-black text-white hover:bg-black/80" onClick={handleBuyNow}>Buy Now</Button>
                  <Button size="lg" variant="outline" onClick={handleAddToCart}>Add to Cart</Button>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailContent;
