'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Brand } from '@/lib/types';
import { Loader2, Search } from 'lucide-react';
import { slugify, cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

function BrandItem({ brand, onBrandClick }: { brand: Brand; onBrandClick: (brand: Brand) => void }) {
  const brandSlug = brand.slug || slugify(brand.name);
  return (
    <Link
      href={`/brands/${brandSlug}`}
      onClick={(e) => {
        e.preventDefault();
        onBrandClick(brand);
      }}
      className="block p-3 text-center rounded-lg hover:bg-muted"
    >
      <p className="font-semibold text-sm">{brand.name}</p>
    </Link>
  );
}

function BrandsList({ onBrandClick }: { onBrandClick: (brand: Brand) => void }) {
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
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b shrink-0">
        <div className="relative w-full max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a brand..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap justify-center items-center gap-1 mt-4">
          <Button
            variant={selectedLetter === 'ALL' ? 'secondary' : 'ghost'}
            onClick={() => setSelectedLetter('ALL')}
            className="h-8 px-3"
          >
            ALL
          </Button>
          {alphabet.map(letter => (
            <Button
              key={letter}
              variant={selectedLetter === letter ? 'secondary' : 'ghost'}
              onClick={() => setSelectedLetter(letter)}
              className={cn("h-8 w-8 p-0")}
            >
              {letter}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {groupKeys.length > 0 ? (
            <div className="space-y-8">
              {groupKeys.map(letter => (
                <div key={letter}>
                  <h2 className="font-headline text-xl font-bold mb-4 pb-2 border-b">{letter}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {groupedBrands[letter].map(brand => (
                      <BrandItem key={brand.id} brand={brand} onBrandClick={onBrandClick} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <h3 className="font-headline text-xl font-bold">No Brands Found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function BrandsDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleBrandClick = (brand: Brand) => {
    const brandSlug = brand.slug || slugify(brand.name);
    router.push(`/brands/${brandSlug}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-sm font-medium transition-colors hover:text-primary">
          Brands
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-2xl font-bold">Our Brands</DialogTitle>
          <DialogDescription>
            Discover the amazing brands and designers we partner with.
          </DialogDescription>
        </DialogHeader>
        <BrandsList onBrandClick={handleBrandClick} />
      </DialogContent>
    </Dialog>
  );
}
