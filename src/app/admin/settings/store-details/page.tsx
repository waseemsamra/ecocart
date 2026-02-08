'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore } from '@/firebase/provider';
import type { StoreSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2, UploadCloud } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';

const s3BaseUrl = 'https://ecocloths.s3.us-west-2.amazonaws.com';

const storeSettingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  companyDetails: z.string().optional(),
  logoUrl: z.string().optional(),
  measuringGuideImageUrl: z.string().optional(),
});

type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

export default function StoreDetailsPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [guideImageFile, setGuideImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { loading: authLoading } = useAuth();

  const settingsRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'settings', 'storeDetails');
  }, [db]);

  const { data: storeSettings, isLoading: isLoadingSettings } = useDoc<StoreSettings>(settingsRef);
  const isLoadingPage = authLoading || isLoadingSettings;

  const form = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      storeName: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      companyDetails: '',
      logoUrl: '',
      measuringGuideImageUrl: '',
    },
  });
  
  const logoUrlValue = form.watch('logoUrl');
  const guideImageUrlValue = form.watch('measuringGuideImageUrl');

  useEffect(() => {
    if (storeSettings) {
      form.reset({
        storeName: storeSettings.storeName || '',
        contactEmail: storeSettings.contactEmail || '',
        contactPhone: storeSettings.contactPhone || '',
        address: storeSettings.address || '',
        companyDetails: storeSettings.companyDetails || '',
        logoUrl: storeSettings.logoUrl?.startsWith('http') ? storeSettings.logoUrl : storeSettings.logoUrl?.replace(s3BaseUrl, ''),
        measuringGuideImageUrl: storeSettings.measuringGuideImageUrl?.startsWith('http') ? storeSettings.measuringGuideImageUrl : storeSettings.measuringGuideImageUrl?.replace(s3BaseUrl, ''),
      });
    }
  }, [storeSettings, form]);
  
  const logoPreview = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile);
    if (logoUrlValue) return logoUrlValue.startsWith('http') ? logoUrlValue : `${s3BaseUrl}${logoUrlValue}`;
    return null;
  }, [logoFile, logoUrlValue]);

  const guideImagePreview = useMemo(() => {
    if (guideImageFile) return URL.createObjectURL(guideImageFile);
    if (guideImageUrlValue) return guideImageUrlValue.startsWith('http') ? guideImageUrlValue : `${s3BaseUrl}${guideImageUrlValue}`;
    return null;
  }, [guideImageFile, guideImageUrlValue]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => form.setValue('logoUrl', reader.result as string, { shouldDirty: true });
      reader.readAsDataURL(file);
    }
  };
  
  const handleGuideImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setGuideImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => form.setValue('measuringGuideImageUrl', reader.result as string, { shouldDirty: true });
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: StoreSettingsFormValues) => {
    setLoading(true);
    if (!db) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not initialized.' });
        setLoading(false);
        return;
    }
    try {
      let logoUrlToSave = data.logoUrl || '';
      let guideImageUrlToSave = data.measuringGuideImageUrl || '';
      
      setIsUploading(true);

      if (logoFile) {
        console.log('[CLIENT UPLOAD] Preparing to upload logo file...');
        const logoFormData = new FormData();
        logoFormData.append("file", logoFile);
        
        console.log('[CLIENT UPLOAD] Sending request to /api/image');
        const response = await fetch('/api/image', { method: 'POST', body: logoFormData });
        
        console.log(`[CLIENT UPLOAD] Received response with status: ${response.status}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Logo upload failed: ${response.statusText}` }));
            throw new Error(errorData.error);
        }
        logoUrlToSave = (await response.json()).url;
        console.log(`[CLIENT UPLOAD] Successfully received S3 URL: ${logoUrlToSave}`);
      } else if (logoUrlToSave && !logoUrlToSave.startsWith('http') && !logoUrlToSave.startsWith('data:')) {
        logoUrlToSave = `${s3BaseUrl}${logoUrlToSave}`;
      }

      if (guideImageFile) {
        console.log('[CLIENT UPLOAD] Preparing to upload guide image file...');
        const guideFormData = new FormData();
        guideFormData.append("file", guideImageFile);
        
        console.log('[CLIENT UPLOAD] Sending request to /api/image for guide image');
        const response = await fetch('/api/image', { method: 'POST', body: guideFormData });
        
        console.log(`[CLIENT UPLOAD] Received response for guide image with status: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Guide image upload failed: ${response.statusText}` }));
            throw new Error(errorData.error);
        }
         guideImageUrlToSave = (await response.json()).url;
        console.log(`[CLIENT UPLOAD] Successfully received S3 URL for guide image: ${guideImageUrlToSave}`);
      } else if (guideImageUrlToSave && !guideImageUrlToSave.startsWith('http') && !guideImageUrlToSave.startsWith('data:')) {
         guideImageUrlToSave = `${s3BaseUrl}${guideImageUrlToSave}`;
      }
      
      setIsUploading(false);
      
      await setDoc(doc(db, 'settings', 'storeDetails'), {
        ...data,
        id: 'storeDetails',
        logoUrl: logoUrlToSave.startsWith('data:') ? storeSettings?.logoUrl || '' : logoUrlToSave,
        measuringGuideImageUrl: guideImageUrlToSave.startsWith('data:') ? storeSettings?.measuringGuideImageUrl || '' : guideImageUrlToSave,
        updatedAt: new Date(),
      }, { merge: true });

      toast({
        title: 'Success',
        description: 'Store details updated successfully.',
      });
    } catch (error: any) {
      console.error('Error in onSubmit store details:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: error.message || 'Failed to update store details. Check the browser console for more details.',
        duration: 10000,
      });
      setIsUploading(false);
    } finally {
      setLoading(false);
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
        <h1 className="font-headline text-3xl font-bold">Store Details</h1>
        <p className="text-muted-foreground">Manage your store's branding and company information.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your store name, contact info, and address.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Awesome Store" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (123) 456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="123 Main St, Anytown, USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Upload your company logo and other brand assets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Logo</FormLabel>
                     <div className="mt-2 flex items-center gap-6">
                      {logoPreview ? (
                          <Image src={logoPreview} alt="Logo preview" width={80} height={80} className="rounded-lg object-contain h-20 w-20 bg-muted border p-1" unoptimized/>
                      ) : (
                          <div className="h-20 w-20 flex items-center justify-center rounded-lg bg-muted text-muted-foreground border">
                              <UploadCloud className="h-8 w-8" />
                          </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              {...field}
                              value={field.value?.startsWith('data:') ? '' : field.value}
                              placeholder="e.g. /logos/my-logo.png"
                              onChange={(e) => {
                                field.onChange(e);
                                setLogoFile(null);
                              }}
                            />
                            <Button type="button" variant="outline" asChild>
                              <label htmlFor="logo-upload" className="cursor-pointer flex items-center justify-center p-2">
                                <UploadCloud className="h-4 w-4" />
                                <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                              </label>
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>Upload a logo or provide a full URL/S3 path.</FormDescription>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="measuringGuideImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Measuring Guide Image</FormLabel>
                       <div className="mt-2 flex items-center gap-6">
                        {guideImagePreview ? (
                            <Image src={guideImagePreview} alt="Measuring Guide preview" width={80} height={80} className="rounded-lg object-contain h-20 w-20 bg-muted border p-1" unoptimized/>
                        ) : (
                            <div className="h-20 w-20 flex items-center justify-center rounded-lg bg-muted text-muted-foreground border">
                                <UploadCloud className="h-8 w-8" />
                            </div>
                        )}
                        <div className="flex-1 space-y-2">
                            <FormControl>
                              <div className="flex gap-2">
                                  <Input 
                                      {...field}
                                      value={field.value?.startsWith('data:') ? '' : field.value}
                                      placeholder="e.g. /guides/measure.jpg or https://..."
                                      onChange={(e) => {
                                          field.onChange(e);
                                          setGuideImageFile(null);
                                      }}
                                  />
                                  <Button type="button" variant="outline" asChild>
                                      <label htmlFor="guide-image-upload" className="cursor-pointer flex items-center justify-center p-2">
                                          <UploadCloud className="h-4 w-4" />
                                          <input id="guide-image-upload" type="file" accept="image/*" onChange={handleGuideImageChange} className="hidden" />
                                      </label>
                                  </Button>
                              </div>
                            </FormControl>
                            <FormDescription>Upload an image or provide a full URL/S3 path.</FormDescription>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>This information will appear on invoices and order confirmations.</CardDescription>
            </CardHeader>
             <CardContent>
                <FormField
                  control={form.control}
                  name="companyDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company & VAT Details</FormLabel>
                      <FormControl>
                        <Textarea placeholder={"e.g. VAT ID: 123456789\nCompany Reg: 987654321"} rows={4} {...field} />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading || isUploading}>
            {(loading || isUploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}
