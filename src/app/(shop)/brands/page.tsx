'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Brand } from '@/lib/types';
import { Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { slugify, cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function BrandCard({ brand }: { brand: Brand }) {
  const brandSlug = brand.slug || slugify(brand.name);
  return (
    <Link href={`/brands/${brandSlug}`} className="block hover:shadow-lg transition-shadow rounded-lg">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">{brand.name}</CardTitle>
        </CardHeader>
        {brand.description && (
            <CardContent>
                <p className="text-muted-foreground line-clamp-3 text-xs">{brand.description}</p>
            </CardContent>
        )}
      </Card>
    </Link>
  );
}

export default function AllBrandsPage() {
  const db = useFirestore();
  const { loading: authLoading } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');

  const brandsQuery = useMemo(() => {
    if (!db) return null;
    const q = query(collection(db, 'brands'), orderBy('name', 'asc'));
    (q as any).__memo = true;
    return q;
  }, [db]);

  const { data: brands, isLoading: isLoadingData } = useCollection<Brand>(brandsQuery);
  const isLoading = authLoading || isLoadingData;
  
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const groupedBrands = useMemo(() => {
    if (!brands) return {};
    
    const filtered = brands.filter(brand => {
        const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLetter = selectedLetter === 'ALL' || brand.name.toUpperCase().startsWith(selectedLetter);
        return matchesSearch && matchesLetter;
    });

    return filtered.reduce((acc, brand) => {
        const firstLetter = brand.name[0].toUpperCase();
        if (!acc[firstLetter]) {
            acc[firstLetter] = [];
        }
        acc[firstLetter].push(brand);
        return acc;
    }, {} as Record<string, Brand[]>);

  }, [brands, searchTerm, selectedLetter]);

  const groupKeys = Object.keys(groupedBrands);

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl font-bold">Our Brands</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Discover the amazing brands and designers we partner with.
        </p>
      </div>

      <div className="mb-12 space-y-6">
        <div className="flex justify-end">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for a brand..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-1 border rounded-md p-1">
            <Button
                variant={selectedLetter === 'ALL' ? 'default' : 'ghost'}
                onClick={() => setSelectedLetter('ALL')}
                className="h-8 px-3"
            >
                ALL
            </Button>
            {alphabet.map(letter => (
                <Button
                    key={letter}
                    variant={selectedLetter === letter ? 'default' : 'ghost'}
                    onClick={() => setSelectedLetter(letter)}
                    className={cn("h-8 w-8 p-0", selectedLetter === letter && "bg-primary text-primary-foreground")}
                >
                    {letter}
                </Button>
            ))}
        </div>
      </div>

      {groupKeys.length > 0 ? (
        <div className="space-y-12">
          {groupKeys.map(letter => (
            <div key={letter}>
              <h2 className="font-headline text-3xl font-bold mb-6 pb-2 border-b">{letter}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupedBrands[letter].map(brand => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border-2 border-dashed rounded-lg">
          <h3 className="font-headline text-2xl font-bold">No Brands Found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or filter.</p>
        </div>
      )}
    </div>
  );
}
