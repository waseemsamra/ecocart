'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import type { Product, Size, Brand } from '@/lib/types';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { Loader2, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { RelatedProducts } from '@/components/related-products';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/context/cart-context';
import { ProductCallouts } from '@/components/product-callouts';
import { ProductInfoSections } from '@/components/product-info-sections';
import { VirtualTryOn } from '@/components/virtual-try-on';

const RECENTLY_VIEWED_KEY = 'recentlyViewed';
const MAX_RECENTLY_VIEWED = 10;

const defaultSizes: Size[] = [
  { id: 'xs', name: 'Extra Small', shortName: 'XS' },
  { id: 's', name: 'Small', shortName: 'S' },
  { id: 'm', name: 'Medium', shortName: 'M' },
  { id: 'l', name: 'Large', shortName: 'L' },
  { id: 'xl', name: 'Extra Large', shortName: 'XL' },
  { id: '2xl', name: '2XL', shortName: '2XL' },
  { id: '3xl', name: '3XL', shortName: '3XL' },
  { id: '4xl', name: '4XL', shortName: '4XL' },
];

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const db = useFirestore();
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const productIdOrSlug = params.id;

  useEffect(() => {
    if (!db || !productIdOrSlug) {
      setIsLoading(true);
      return;
    }

    const fetchProductAndBrand = async () => {
      setIsLoading(true);
      setError(null);
      let productData: Product | null = null;
      try {
        const docRef = doc(db, 'products', productIdOrSlug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          productData = { id: docSnap.id, ...docSnap.data() } as Product;
        } else {
          const q = query(collection(db, 'products'), where('slug', '==', productIdOrSlug), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const productSnap = querySnapshot.docs[0];
            productData = { id: productSnap.id, ...productSnap.data() } as Product;
          }
        }
        
        if (productData) {
           setProduct(productData);
           if (productData.brandIds?.[0]) {
                const brandDoc = await getDoc(doc(db, 'brands', productData.brandIds[0]));
                if (brandDoc.exists()) {
                    setBrand({ id: brandDoc.id, ...brandDoc.data() } as Brand);
                }
           }
            try {
              const storedIds = localStorage.getItem(RECENTLY_VIEWED_KEY);
              let recentIds = storedIds ? JSON.parse(storedIds) : [];
              recentIds = recentIds.filter((id: string) => id !== productData!.id);
              recentIds.unshift(productData!.id);
              localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentIds.slice(0, MAX_RECENTLY_VIEWED)));
            } catch (e) {
                console.error("Could not update recently viewed products in localStorage", e);
            }
        }

      } catch (e: any) {
        setError(e);
        console.error("Error fetching product:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductAndBrand();
  }, [db, productIdOrSlug]);

  const images = useMemo(() => product?.images || [], [product]);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[80vh] text-center p-4">
        <h2 className="text-2xl font-bold text-destructive">Error Loading Product</h2>
        <p className="text-muted-foreground mt-2">There was an error fetching this product's details.</p>
        <pre className="mt-4 bg-muted p-4 rounded-md text-xs text-left whitespace-pre-wrap max-w-full overflow-x-auto">{error.message}</pre>
      </div>
    );
  }

  if (!product) {
    return notFound();
  }

  return (
    <div className="py-8 md:py-12">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="lg:col-span-1">
            <div className="relative">
              <div className="flex flex-row-reverse gap-4">
                <div className="flex-1 aspect-[3/4] relative bg-muted rounded-lg overflow-hidden">
                  {images.length > 0 && images[selectedImage]?.imageUrl ? (
                    <Image
                      src={images[selectedImage].imageUrl!}
                      alt={
                        images[selectedImage].description || product.name
                      }
                      fill
                      className="object-cover"
                      priority
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <div className="w-20 shrink-0 flex flex-col gap-2 overflow-y-auto pr-2">
                  {images.map((image, index) => (
                    <button
                      key={image.id || index}
                      onClick={() => setSelectedImage(index)}
                      className={`block w-full aspect-[3/4] rounded-md overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? 'border-primary'
                          : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={image.imageUrl || 'https://placehold.co/80x96'}
                        alt={image.description || product.name}
                        width={80}
                        height={96}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="lg:col-span-1">
            {brand && (
              <h2 className="text-3xl font-bold tracking-widest uppercase">
                {brand.name}
              </h2>
            )}
            <div className="flex justify-between items-start">
              <h1 className="text-xs text-muted-foreground mt-1">
                {product.name}
              </h1>
              <Button variant="ghost" size="icon">
                <Heart className="h-6 w-6" />
              </Button>
            </div>

            <p className="text-base font-semibold my-4">
              DH{product.price.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              Incl. of taxes, excl. custom duties
            </p>

            <Separator className="my-6" />

            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs font-semibold">
                  Select your size
                </Label>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="link"
                      className="text-xs p-0 h-auto text-primary"
                    >
                      Size Guide & Virtual Try-On
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-4xl">
                    <SheetHeader>
                      <SheetTitle>Virtual Try-On</SheetTitle>
                      <SheetDescription>See how this item looks on you.</SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                      <VirtualTryOn product={product} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <RadioGroup
                defaultValue="m"
                className="flex flex-wrap gap-2"
              >
                {defaultSizes.map(size => (
                  <Label
                    key={size.id}
                    htmlFor={size.id}
                    className={`relative flex items-center justify-center rounded-md border p-3 cursor-pointer hover:bg-muted has-[:checked]:border-primary w-14 h-12`}
                  >
                    <RadioGroupItem
                      value={size.id}
                      id={size.id}
                      className="sr-only"
                    />
                    <span className="font-semibold">{size.shortName}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="bg-black text-white hover:bg-black/80 rounded-sm w-full h-12"
                onClick={handleBuyNow}
              >
                BUY NOW
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-sm w-full h-12"
                onClick={handleAddToCart}
              >
                ADD TO CART
              </Button>
            </div>

            <ProductCallouts />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              <div className="md:col-span-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">
                  Product Description
                </h3>
                <p className="text-xs text-muted-foreground">
                  {product.description}
                </p>
              </div>
              <div>
                {product.productCode && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-2">
                      Product Code
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {product.productCode}
                    </p>
                    <Button
                      asChild
                      variant="link"
                      className="text-red-500 font-semibold p-0 h-auto mt-1 text-xs"
                    >
                      <Link href="#">View Supplier Information</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <ProductInfoSections />

            <Separator />

            <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-4">
              {product.fit && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Fit
                  </h3>
                  <p className="text-xs text-muted-foreground">{product.fit}</p>
                </div>
              )}
              {product.composition && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Composition
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {product.composition}
                  </p>
                </div>
              )}
              {product.care && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Care
                  </h3>
                  <p className="text-xs text-muted-foreground">{product.care}</p>
                </div>
              )}
              {product.materials && product.materials.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider">
                    Components
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {product.materials.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-16 md:mt-24">
          <RelatedProducts />
        </div>
      </div>
    </div>
  );
}
