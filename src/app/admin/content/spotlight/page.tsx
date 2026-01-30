
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore } from '@/firebase/provider';
import type { SpotlightSettings, Brand } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, UploadCloud } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query } from 'firebase/firestore';
import Image from 'next/image';

const s3BaseUrl = 'https://ecocloths.s3.us-west-2.amazonaws.com';

const spotlightSchema = z.object({
  brandId: z.string().min(1, 'Please select a brand to feature.'),
  imageUrl: z.string().min(1, 'Image path is required.'),
  imageHint: z.string().optional(),
});

type SpotlightFormValues = z.infer<typeof spotlightSchema>;

export default function SpotlightPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loading: authLoading } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const settingsRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'settings', 'spotlight');
  }, [db]);

  const { data: spotlightSetting, isLoading: isLoadingSettings } = useDoc<SpotlightSettings>(settingsRef);
  const isLoadingPage = authLoading || isLoadingSettings;

  const brandsQuery = useMemo(() => {
      if (!db) return null;
      const q = query(collection(db, 'brands'));
      (q as any).__memo = true;
      return q;
  }, [db]);
  
  const { data: brands, isLoading: isLoadingBrands } = useCollection<Brand>(brandsQuery);

  const form = useForm<SpotlightFormValues>({
    resolver: zodResolver(spotlightSchema),
    defaultValues: {
      brandId: '',
      imageUrl: '',
      imageHint: '',
    },
  });

  const imageUrlPath = form.watch('imageUrl');

  const previewUrl = useMemo(() => {
    if (imageFile) {
        return URL.createObjectURL(imageFile);
    }
    if (imageUrlPath) {
        return imageUrlPath.startsWith('http') ? imageUrlPath : `${s3BaseUrl}${imageUrlPath}`;
    }
    return null;
  }, [imageFile, imageUrlPath]);

  useEffect(() => {
    if (spotlightSetting) {
      form.reset({
        brandId: spotlightSetting.brandId || '',
        imageUrl: spotlightSetting.imageUrl?.replace(s3BaseUrl, '') || '',
        imageHint: spotlightSetting.imageHint || '',
      });
    }
  }, [spotlightSetting, form]);
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setImageFile(file);
    }
  };

  const onSubmit = async (data: SpotlightFormValues) => {
    setIsSubmitting(true);
    if (!db) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not initialized.' });
        setIsSubmitting(false);
        return;
    }
    try {
      let finalImageUrl = data.imageUrl;

       if (imageFile) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append("file", imageFile);
            const response = await fetch('/api/image', { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`Image upload failed: ${response.statusText}`);
            const result = await response.json();
            finalImageUrl = result.url;
            setIsUploading(false);
        } else if (finalImageUrl && !finalImageUrl.startsWith('http')) {
            finalImageUrl = `${s3BaseUrl}${finalImageUrl}`;
        }

      await setDoc(doc(db, 'settings', 'spotlight'), {
        id: 'spotlight',
        ...data,
        imageUrl: finalImageUrl,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: 'Success',
        description: 'Designers Spotlight section updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating spotlight settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update settings.',
      });
      setIsUploading(false);
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
        <h1 className="font-headline text-3xl font-bold">Designers in the Spotlight</h1>
        <p className="text-muted-foreground">Manage the content for the "Designers in the Spotlight" homepage section.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Spotlight Details</CardTitle>
              <CardDescription>Select a brand and an image to feature.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
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
                 <FormItem>
                    <FormLabel>Background Image</FormLabel>
                    <div className="mt-2 flex items-center gap-6">
                        {previewUrl ? <Image src={previewUrl} alt="Image preview" width={80} height={80} className="rounded-lg object-contain h-20 w-20 bg-muted border p-1" unoptimized />
                        : <div className="h-20 w-20 flex items-center justify-center rounded-lg bg-muted text-muted-foreground border"><UploadCloud className="h-8 w-8" /></div>}
                        <div className='flex flex-col gap-2'>
                            <Input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload')?.click()} disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {imageFile ? 'Change Image' : 'Upload Image'}
                            </Button>
                            <p className="text-xs text-muted-foreground">Or provide a path below.</p>
                        </div>
                    </div>
                </FormItem>
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                    <FormItem><FormLabel>Image Path</FormLabel><FormControl><Input {...field} placeholder="/spotlight/background.jpg" /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="imageHint" render={({ field }) => (
                    <FormItem><FormLabel>AI Image Hint</FormLabel><FormControl><Input {...field} placeholder="e.g., fashion models" /></FormControl><FormMessage /></FormItem>
                )} />
            </CardContent>
          </Card>
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}
