import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, slugify, getFullImageUrl } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
  onClick?: (e: React.MouseEvent) => void;
}

export function ProductCard({ product, layout = 'grid', onClick }: ProductCardProps) {
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const hoverImage = product.images?.find(img => img.id !== primaryImage?.id && img.imageUrl);

  const imageUrl = getFullImageUrl(primaryImage?.imageUrl);
  const hoverImageUrl = getFullImageUrl(hoverImage?.imageUrl);
  
  const productUrl = `/products/${product.slug || product.id}`;

  if (layout === 'list') {
      return (
        <Card className="flex flex-col md:flex-row overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-xl group">
             <Link href={productUrl} className="block md:w-1/3" onClick={onClick}>
                <div className="aspect-square relative h-full">
                    {imageUrl ? (
                         <>
                            <Image
                                src={imageUrl}
                                alt={primaryImage?.description || product.name}
                                fill
                                className={cn(
                                    "object-cover object-top transition-opacity duration-300",
                                    hoverImageUrl && "group-hover:opacity-0"
                                )}
                                data-ai-hint={primaryImage?.imageHint}
                                unoptimized
                            />
                            {hoverImageUrl && (
                                <Image
                                    src={hoverImageUrl}
                                    alt={hoverImage?.description || product.name}
                                    fill
                                    className="object-cover object-top opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                    data-ai-hint={hoverImage?.imageHint}
                                    unoptimized
                                />
                            )}
                        </>
                    ) : (
                        <div className="bg-muted flex items-center justify-center h-full">
                            <span className="text-muted-foreground">No Image</span>
                        </div>
                    )}
                </div>
            </Link>
            <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                    <CardTitle className="font-headline text-xl mb-2 hover:text-primary transition-colors">
                        <Link href={productUrl} onClick={onClick}>{product.name}</Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
                </div>
                 <div className="flex justify-between items-end mt-4">
                    <p className="text-xl font-semibold">${product.price.toFixed(2)}</p>
                    <Button asChild variant="outline" size="sm">
                        <Link href={productUrl} onClick={onClick}>View Details <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </div>
            </div>
        </Card>
      )
  }

  // Grid layout
  return (
    <Link href={productUrl} className="group block" onClick={onClick}>
      <div className="relative overflow-hidden aspect-square rounded-xl bg-muted">
        {imageUrl ? (
            <>
                <Image
                    src={imageUrl}
                    alt={primaryImage?.description || product.name}
                    fill
                    className={cn(
                        "object-cover object-top transition-opacity duration-300",
                        hoverImageUrl ? "group-hover:opacity-0" : "group-hover:scale-105"
                    )}
                    data-ai-hint={primaryImage?.imageHint}
                    unoptimized
                />
                {hoverImageUrl && (
                    <Image
                        src={hoverImageUrl}
                        alt={hoverImage?.description || product.name}
                        fill
                        className="object-cover object-top opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:scale-105"
                        data-ai-hint={hoverImage?.imageHint}
                        unoptimized
                    />
                )}
            </>
        ) : (
            <div className="flex items-center justify-center h-full">
                <span className="text-muted-foreground">No Image</span>
            </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="font-headline font-semibold mt-1 group-hover:text-primary transition-colors">{product.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">from ${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
