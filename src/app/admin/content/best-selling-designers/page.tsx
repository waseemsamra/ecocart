'use client';

import { useState, useMemo, useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore } from '@/firebase/provider';
import type { BestSellingDesigners, Brand } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const MAX_SELECTIONS = 5;

export default function BestSellingDesignersPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loading: authLoading } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);

  const settingsRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'settings', 'bestSellingDesigners');
  }, [db]);

  const { data: settingsData, isLoading: isLoadingSettings } = useDoc<BestSellingDesigners>(settingsRef);

  const brandsQuery = useMemo(() => {
      if (!db) return null;
      const q = query(collection(db, 'brands'), orderBy('name', 'asc'));
      (q as any).__memo = true;
      return q;
  }, [db]);
  
  const { data: brands, isLoading: isLoadingBrands } = useCollection<Brand>(brandsQuery);

  const isLoadingPage = authLoading || isLoadingSettings || isLoadingBrands;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(timer);
    };
  }, [inputValue]);


  useEffect(() => {
    if (settingsData?.brandIds) {
      setSelectedBrandIds(settingsData.brandIds);
    }
  }, [settingsData]);

  const filteredBrands = useMemo(() => {
    if (!brands) return [];
    if (searchTerm.length < 3) {
      return searchTerm.length === 0 ? brands : [];
    }
    return brands.filter(brand =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [brands, searchTerm]);
  
  const handleCheckboxChange = (brandId: string) => {
    setSelectedBrandIds(prev => {
        const isSelected = prev.includes(brandId);
        if (isSelected) {
            return prev.filter(id => id !== brandId);
        } else {
            if (prev.length >= MAX_SELECTIONS) {
                toast({
                    variant: 'destructive',
                    title: `You can only select up to ${MAX_SELECTIONS} designers.`,
                });
                return prev;
            }
            return [...prev, brandId];
        }
    });
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    if (!db) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not initialized.' });
        setIsSubmitting(false);
        return;
    }
    try {
      await setDoc(doc(db, 'settings', 'bestSellingDesigners'), {
        id: 'bestSellingDesigners',
        brandIds: selectedBrandIds,
        updatedAt: new Date(),
      }, { merge: true });

      toast({
        title: 'Success',
        description: 'Best Selling Designers updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update settings.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPage) {
      return (
          <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold">Best Selling Designers</h1>
        <p className="text-muted-foreground">Select up to ${MAX_SELECTIONS} brands to feature on the homepage.</p>
      </div>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Select Brands</CardTitle>
            <CardDescription>
                The brands you select will be displayed in the "Best Selling Designers" section on your homepage.
                ({selectedBrandIds.length} / ${MAX_SELECTIONS} selected)
            </CardDescription>
             <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search brands (3+ characters)..."
                    className="pl-9"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
                <div className="space-y-2">
                    {filteredBrands && filteredBrands.length > 0 ? (
                        filteredBrands.map(brand => (
                            <div key={brand.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                                <Checkbox
                                    id={brand.id}
                                    checked={selectedBrandIds.includes(brand.id)}
                                    onCheckedChange={() => handleCheckboxChange(brand.id)}
                                    disabled={!selectedBrandIds.includes(brand.id) && selectedBrandIds.length >= MAX_SELECTIONS}
                                />
                                <label
                                    htmlFor={brand.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {brand.name}
                                </label>
                            </div>
                        ))
                    ) : searchTerm.length >= 3 ? (
                        <div className="text-center text-muted-foreground p-4">No brands found for "{searchTerm}".</div>
                    ) : inputValue.length > 0 ? (
                        <div className="text-center text-muted-foreground p-4">Please enter at least 3 characters to search.</div>
                    ) : (
                        <div className="text-center text-muted-foreground p-4">No brands available to select.</div>
                    )}
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
    </div>
  );
}
