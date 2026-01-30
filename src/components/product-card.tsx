import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
  onClick?: (e: React.MouseEvent) => void;
}

export function ProductCard({ product, layout = 'grid', onClick }: ProductCardProps) {
  const image = product.images?.[0];
  
  if (layout === 'list') {
      return (
        <Card className="flex flex-col md:flex-row overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-xl">
             <Link href={`/products/${product.id}`} className="block md:w-1/3" onClick={onClick}>
                <div className="aspect-square relative h-full">
                    {image ? (
                        <Image
                        src={image.imageUrl}
                        alt={image.description || product.name}
                        fill
                        className="object-cover"
                        data-ai-hint={image.imageHint}
                        />
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
                        <Link href={`/products/${product.id}`} onClick={onClick}>{product.name}</Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
                </div>
                 <div className="flex justify-between items-end mt-4">
                    <p className="text-xl font-semibold">DH{product.price.toFixed(2)}</p>
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/products/${product.id}`} onClick={onClick}>View Details <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </div>
            </div>
        </Card>
      )
  }

  // Grid layout
  return (
    <Link href={`/products/${product.id}`} className="group block" onClick={onClick}>
      <div className="relative overflow-hidden aspect-square rounded-xl bg-muted">
        {image ? (
            <Image
            src={image.imageUrl}
            alt={image.description || product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={image.imageHint}
            />
        ) : (
            <div className="flex items-center justify-center h-full">
                <span className="text-muted-foreground">No Image</span>
            </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="font-headline font-semibold mt-1 group-hover:text-primary transition-colors">{product.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">from DH{product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
