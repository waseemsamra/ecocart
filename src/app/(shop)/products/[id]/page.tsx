'use client';

import { useParams, notFound } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import type { Product, Size } from '@/lib/types';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { Loader2, Check, ShieldCheck, Truck, Info, Star } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AddToCartForm } from '@/components/add-to-cart-form';
import { ProductInfoAccordion } from '@/components/product-info-accordion';
import { RelatedProducts } from '@/components/related-products';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Default sizes to use as a fallback if the database is empty or fails to load
const defaultSizes: Size[] = [
  { id: 'xs', name: 'Extra Small', shortName: 'XS' },
  { id: 's', name: 'Small', shortName: 'S' },
  { id: 'm', name: 'Medium', shortName: 'M' },
  { id: 'l', name: 'Large', shortName: 'L' },
  { id: 'xl', name: 'Extra Large', shortName: 'XL' },
  { id: '2xl', name: '2XL', shortName: '2XL' },
  { id: '3xl', name: '3XL', shortName: '3XL' },
  { id: '4xl', name: '4XL', shortName: '4XL' },
  { id: '5xl', name: '5XL', shortName: '5XL' },
  { id: '6xl', name: '6XL', shortName: '6XL' },
];

function SizeGuide() {
    return (
      <div className="space-y-4">
        <p>Use the chart below to determine your size. If you’re on the borderline between two sizes, order the smaller size for a tighter fit or the larger size for a looser fit.</p>
        {/* Placeholder for an actual size chart table */}
        <div className="border rounded-lg p-4 text-center">
            <p className="font-semibold">Size Chart Coming Soon</p>
            <p className="text-sm text-muted-foreground">Please refer to product description for now.</p>
        </div>
      </div>
    )
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const db = useFirestore();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const productIdOrSlug = params.id;

  useEffect(() => {
    if (!db || !productIdOrSlug) {
      return;
    }

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try fetching by ID first, as it's the primary identifier
        let productSnap = await getDoc(doc(db, 'products', productIdOrSlug));

        // If not found by ID, try querying by slug as a fallback
        if (!productSnap.exists()) {
          const q = query(collection(db, 'products'), where('slug', '==', productIdOrSlug), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            productSnap = querySnapshot.docs[0];
          }
        }
        
        if (productSnap && productSnap.exists()) {
          setProduct({ id: productSnap.id, ...productSnap.data() } as Product);
        } else {
          setProduct(null);
        }
      } catch (e: any) {
        setError(e);
        console.error("Error fetching product:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [db, productIdOrSlug]);

  const images = useMemo(() => product?.images || [], [product]);

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
    <div className="container mx-auto py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        
        {/* Image Gallery */}
        <div className="lg:col-span-3 flex flex-col-reverse md:flex-row gap-4">
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pr-2 pb-2 md:pb-0">
                {images.map((image, index) => (
                    <button key={image.id} onClick={() => setSelectedImage(index)} className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${selectedImage === index ? 'border-primary' : 'border-transparent'}`}>
                        <Image src={image.imageUrl} alt={image.description || product.name} width={80} height={80} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
            <div className="flex-1 aspect-square relative bg-muted rounded-lg overflow-hidden">
                {images.length > 0 ? (
                    <Image
                        src={images[selectedImage].imageUrl}
                        alt={images[selectedImage].description || product.name}
                        fill
                        className="object-contain"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                )}
            </div>
        </div>

        {/* Product Details */}
        <div className="lg:col-span-2">
            <h1 className="text-3xl md:text-4xl font-headline font-bold">{product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
                <p className="text-2xl font-semibold">DH{product.price.toFixed(2)}</p>
                {product.originalPrice && (
                    <p className="text-lg text-muted-foreground line-through">DH{product.originalPrice.toFixed(2)}</p>
                )}
            </div>
             <div className="flex items-center gap-1 mt-2 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">(12 reviews)</span>
            </div>

            <p className="mt-4 text-muted-foreground">{product.description}</p>
            
            <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 text-sm">
                    <Check className="h-5 w-5 text-green-600"/>
                    <span className="font-medium">In Stock</span>
                </div>
                 <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-5 w-5 text-blue-600"/>
                    <span>Usually ships within 2-3 business days</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-5 w-5 text-primary"/>
                    <span>2 Year Quality Guarantee</span>
                </div>
            </div>

            <div className="mt-8">
                <div className="flex justify-between items-center mb-2">
                    <Label className="text-base font-semibold">Size</Label>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="link" className="text-sm p-0 h-auto">
                                <Info className="mr-1 h-4 w-4"/>
                                Size Guide
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Size Guide</SheetTitle>
                            </SheetHeader>
                            <div className="py-4">
                                <SizeGuide />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
                <RadioGroup defaultValue="m" className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {defaultSizes.map(size => (
                         <Label key={size.id} htmlFor={size.id} className={`relative flex items-center justify-center rounded-md border p-3 cursor-pointer hover:bg-muted has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary`}>
                            <RadioGroupItem value={size.id} id={size.id} className="sr-only"/>
                            <span className="font-semibold">{size.shortName}</span>
                            {size.shortName === '6XL' && <span className="absolute -top-2 -right-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">HOT</span>}
                         </Label>
                    ))}
                    <Label htmlFor="custom" className="flex items-center justify-center rounded-md border border-dashed p-3 cursor-pointer text-primary hover:bg-primary/5 hover:border-primary">
                        <RadioGroupItem value="custom" id="custom" className="sr-only"/>
                        <span className="text-xs font-bold text-center">CUSTOM TAILORED</span>
                    </Label>
                </RadioGroup>
            </div>

            <div className="mt-8">
                <AddToCartForm product={product} />
            </div>

            <div className="mt-12">
                <ProductInfoAccordion product={product} />
            </div>
        </div>
      </div>
      <div className="mt-16 md:mt-24">
        <RelatedProducts />
      </div>
    </div>
  );
}
