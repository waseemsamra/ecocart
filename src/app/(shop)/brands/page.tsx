
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Brand } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { slugify } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

function BrandCard({ brand }: { brand: Brand }) {
  const brandSlug = brand.slug || slugify(brand.name);
  return (
    <Link href={`/brands/${brandSlug}`} className="block hover:shadow-lg transition-shadow rounded-lg">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{brand.name}</CardTitle>
        </CardHeader>
        {brand.description && (
            <CardContent>
                <p className="text-muted-foreground line-clamp-3">{brand.description}</p>
            </CardContent>
        )}
      </Card>
    </Link>
  );
}

export default function AllBrandsPage() {
  const db = useFirestore();
  const { loading: authLoading } = useAuth();

  const brandsQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'brands'), orderBy('name', 'asc'));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: brands, isLoading: isLoadingData } = useCollection<Brand>(brandsQuery);
  const isLoading = authLoading || isLoadingData;

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl font-bold">Our Brands</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Discover the amazing brands and designers we partner with.
        </p>
      </div>

      {brands && brands.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {brands.map(brand => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border-2 border-dashed rounded-lg">
          <h3 className="font-headline text-2xl font-bold">No Brands Found</h3>
          <p className="text-muted-foreground mt-2">Check back soon to see our collection of brands.</p>
        </div>
      )}
    </div>
  );
}
