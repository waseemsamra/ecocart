'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore } from '@/firebase/provider';
import type { FeaturedBrand, Brand } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query } from 'firebase/firestore';

const featuredBrandSchema = z.object({
  brandId: z.string().min(1, 'Please select a brand to feature.'),
});

type FeaturedBrandFormValues = z.infer<typeof featuredBrandSchema>;

export default function FeaturedBrandPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loading: authLoading } = useAuth();

  const settingsRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'settings', 'featuredBrand');
  }, [db]);

  const { data: featuredBrandSetting, isLoading: isLoadingSettings } = useDoc<FeaturedBrand>(settingsRef);
  const isLoadingPage = authLoading || isLoadingSettings;

  const brandsQuery = useMemo(() => {
      if (!db) return null;
      const q = query(collection(db, 'brands'));
      (q as any).__memo = true;
      return q;
  }, [db]);
  
  const { data: brands, isLoading: isLoadingBrands } = useCollection<Brand>(brandsQuery);

  const form = useForm<FeaturedBrandFormValues>({
    resolver: zodResolver(featuredBrandSchema),
    defaultValues: {
      brandId: '',
    },
  });

  useEffect(() => {
    if (featuredBrandSetting) {
      form.reset({
        brandId: featuredBrandSetting.brandId || '',
      });
    }
  }, [featuredBrandSetting, form]);

  const onSubmit = async (data: FeaturedBrandFormValues) => {
    setIsSubmitting(true);
    if (!db) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not initialized.' });
        setIsSubmitting(false);
        return;
    }
    try {
      await setDoc(doc(db, 'settings', 'featuredBrand'), {
        id: 'featuredBrand',
        ...data,
        updatedAt: new Date(),
      }, { merge: true });

      toast({
        title: 'Success',
        description: 'Featured brand updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating featured brand:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update featured brand.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPage || isLoadingBrands) {
      return (
          <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold">Featured Brand</h1>
        <p className="text-muted-foreground">Select a brand to feature on the homepage.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Select Featured Brand</CardTitle>
              <CardDescription>The brand you select here will be displayed in a special section on your homepage.</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                         <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a brand to feature" />
                          </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           {brands?.map(brand => (
                             <SelectItem key={brand.id} value={brand.id}>
                               {brand.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}
