'use client';

import Image from 'next/image';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import type { Product, Size, Brand } from '@/lib/types';
import { doc, collection, query, where, documentId } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, Copy, MessageSquare, Scissors, Camera, Truck, Wand2 } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const db = useFirestore();
  const { toast } = useToast();

  const productRef = useMemo(() => {
    if (!db || !params.id) return null;
    const ref = doc(db, 'products', params.id);
    (ref as any).__memo = true;
    return ref;
  }, [params.id, db]);

  const { data: product, isLoading: isLoadingProduct, error } = useDoc<Product>(productRef);

  const [selectedImage, setSelectedImage] = useState(product?.images?.[0]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    if (product && product.images && product.images.length > 0) {
      setSelectedImage(product.images[0]);
    }
  }, [product]);

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
    const q = query(collection(db, 'brands'), where(documentId(), 'in', product.brandIds));
    (q as any).__memo = true;
    return q;
  }, [product, db]);
  const { data: brands } = useCollection<Brand>(brandQuery);
  const brand = useMemo(() => brands?.[0], [brands]);

  const sizesQuery = useMemo(() => {
    if (!db || !product?.sizeIds || product.sizeIds.length === 0) return null;
    const q = query(collection(db, 'sizes'), where(documentId(), 'in', product.sizeIds));
    (q as any).__memo = true;
    return q;
  }, [product, db]);
  const { data: availableSizes } = useCollection<Size>(sizesQuery);

  useEffect(() => {
    if (availableSizes && availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0].id);
    }
  }, [availableSizes, selectedSize]);

  const isLoading = isLoadingProduct || !db;

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
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

  const discountPercent = product.originalPrice && product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: `Coupon code "${code}" has been copied to your clipboard.`,
    });
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-sm text-muted-foreground mb-4">
        <Link href="/" className="hover:underline">Home</Link>
        {' > '}
        <span>{product.name}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left image gallery */}
        <div className="md:col-span-7 grid grid-cols-12 gap-4">
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

        {/* Right sticky column */}
        <div className="md:col-span-5">
           <div className="md:sticky md:top-24">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        {brand && <h1 className="font-headline text-3xl md:text-4xl font-bold uppercase">{brand.name}</h1>}
                        <p className="text-lg text-muted-foreground">{product.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <Heart className="h-6 w-6" />
                    </Button>
                </div>
                
                <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold">DH{product.price.toFixed(2)}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-lg text-muted-foreground line-through">DH{product.originalPrice.toFixed(2)}</span>
                    )}
                    {discountPercent > 0 && (
                        <span className="text-lg font-semibold text-destructive">{discountPercent}% OFF</span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">Incl. of taxes, excl. custom duties</p>

                {availableSizes && availableSizes.length > 0 && (
                  <div className="pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold">Select your size</h3>
                        <Button variant="link" className="p-0 h-auto text-sm">Size Guide</Button>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                      {availableSizes.map((size) => (
                        <Button key={size.id} variant={selectedSize === size.id ? 'default' : 'outline'} onClick={() => setSelectedSize(size.id)}>
                            {size.shortName}
                        </Button>
                      ))}
                      <Button variant="outline">Custom</Button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button size="lg" onClick={handleBuyNow}>Buy Now</Button>
                    <Button size="lg" variant="outline" onClick={handleAddToCart}>Add to Cart</Button>
                </div>
                
                <Separator />
                
                <div className="bg-secondary/50 p-3 rounded-md">
                    <p className="font-bold text-sm">SHOPMORE175K</p>
                    <p className="text-xs text-muted-foreground">Shop for DH529 more and get flat DH115 OFF!</p>
                    <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-destructive">T&C Applied</span>
                        <Button variant="link" className="p-0 h-auto text-xs" onClick={() => copyCode('SHOPMORE175K')}>COPY CODE</Button>
                    </div>
                </div>

                <div className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                        <p className="font-bold text-sm">PRICE MATCH PROMISE</p>
                        <Button variant="link" className="p-0 h-auto text-xs">KNOW MORE</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">If you find the product for less we’ll match it!</p>
                </div>
                
                <Separator />

                <div className="space-y-4 text-sm">
                    {product.description && (
                        <div>
                            <h4 className="font-bold uppercase mb-1">Product Description</h4>
                            <p className="text-muted-foreground">{product.description}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {product.fit && <div><h4 className="font-bold uppercase">Fit</h4><p className="text-muted-foreground">{product.fit}</p></div>}
                      {product.composition && <div><h4 className="font-bold uppercase">Composition</h4><p className="text-muted-foreground">{product.composition}</p></div>}
                      {product.care && <div><h4 className="font-bold uppercase">Care</h4><p className="text-muted-foreground">{product.care}</p></div>}
                      {product.productCode && <div><h4 className="font-bold uppercase">Product Code</h4><p className="text-muted-foreground">{product.productCode}</p></div>}
                    </div>
                    {product.shippingInfo && <div><h4 className="font-bold uppercase mb-1">Shipping Information</h4><p className="text-muted-foreground">{product.shippingInfo}</p></div>}
                    {product.disclaimer && <div><h4 className="font-bold uppercase mb-1">Disclaimer</h4><p className="text-muted-foreground">{product.disclaimer}</p></div>}
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex items-start gap-2"><Wand2 className="h-4 w-4 mt-0.5 shrink-0" /><div><p className="font-semibold">Customisations</p><p>Same style in a bespoke color</p></div></div>
                    <div className="flex items-start gap-2"><Scissors className="h-4 w-4 mt-0.5 shrink-0" /><div><p className="font-semibold">Don't want the whole set?</p><p>Buy only one item from the look</p></div></div>
                    <div className="flex items-start gap-2"><Camera className="h-4 w-4 mt-0.5 shrink-0" /><div><p className="font-semibold">Live Product Preview</p><p>Call us to see the product live</p></div></div>
                    <div className="flex items-start gap-2"><Truck className="h-4 w-4 mt-0.5 shrink-0" /><div><p className="font-semibold">Early Delivery</p><p>Need the product sooner?</p></div></div>
                </div>

                <Card className="mt-4">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Do you need help with customisation or shipping?</p>
                    </div>
                    <Button variant="outline"><MessageSquare className="mr-2 h-4 w-4"/> Chat with us</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
