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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, UploadCloud } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const storeSettingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  companyDetails: z.string().optional(),
  measuringGuideImageUrl: z.string().optional(),
});

type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

export default function StoreDetailsPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [guideImageFile, setGuideImageFile] = useState<File | null>(null);
  const [guideImagePreview, setGuideImagePreview] = useState<string | null>(null);
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
      measuringGuideImageUrl: '',
    },
  });

  useEffect(() => {
    if (storeSettings) {
      form.reset({
        storeName: storeSettings.storeName || '',
        contactEmail: storeSettings.contactEmail || '',
        contactPhone: storeSettings.contactPhone || '',
        address: storeSettings.address || '',
        companyDetails: storeSettings.companyDetails || '',
        measuringGuideImageUrl: storeSettings.measuringGuideImageUrl || '',
      });
      if(storeSettings.logoUrl) {
          setLogoPreview(storeSettings.logoUrl);
      }
      if(storeSettings.measuringGuideImageUrl) {
        setGuideImagePreview(storeSettings.measuringGuideImageUrl);
      }
    }
  }, [storeSettings, form]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleGuideImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setGuideImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGuideImagePreview(reader.result as string);
      };
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
      let logoUrl = storeSettings?.logoUrl || '';
      let measuringGuideImageUrl = storeSettings?.measuringGuideImageUrl || '';

      if (logoFile || guideImageFile) {
        setIsUploading(true);
        const uploadPromises = [];

        if (logoFile) {
          const logoFormData = new FormData();
          logoFormData.append("file", logoFile);
          uploadPromises.push(
            fetch('/api/image', { method: 'POST', body: logoFormData })
              .then(res => res.json())
              .then(result => { logoUrl = result.url; })
          );
        }

        if (guideImageFile) {
          const guideFormData = new FormData();
          guideFormData.append("file", guideImageFile);
          uploadPromises.push(
            fetch('/api/image', { method: 'POST', body: guideFormData })
              .then(res => res.json())
              .then(result => { measuringGuideImageUrl = result.url; })
          );
        }
        
        await Promise.all(uploadPromises);
        setIsUploading(false);
      }
      
      await setDoc(doc(db, 'settings', 'storeDetails'), {
        ...data,
        id: 'storeDetails',
        logoUrl,
        measuringGuideImageUrl,
        updatedAt: new Date(),
      }, { merge: true });

      toast({
        title: 'Success',
        description: 'Store details updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating store details:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update store details.',
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
              <FormItem>
                <FormLabel>Store Logo</FormLabel>
                <div className="mt-2 flex items-center gap-6">
                    {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" width={80} height={80} className="rounded-lg object-contain h-20 w-20 bg-muted border p-1" />
                    ) : (
                        <div className="h-20 w-20 flex items-center justify-center rounded-lg bg-muted text-muted-foreground border">
                            <UploadCloud className="h-8 w-8" />
                        </div>
                    )}
                    <div className='flex flex-col gap-2'>
                        <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()} disabled={isUploading}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {logoFile ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP up to 5MB.</p>
                    </div>
                </div>
                 <FormMessage />
              </FormItem>
               <FormItem>
                <FormLabel>Measuring Guide Image</FormLabel>
                <div className="mt-2 flex items-center gap-6">
                    {guideImagePreview ? (
                        <img src={guideImagePreview} alt="Measuring Guide preview" width={80} height={80} className="rounded-lg object-contain h-20 w-20 bg-muted border p-1" />
                    ) : (
                        <div className="h-20 w-20 flex items-center justify-center rounded-lg bg-muted text-muted-foreground border">
                            <UploadCloud className="h-8 w-8" />
                        </div>
                    )}
                    <div className='flex flex-col gap-2'>
                        <Input id="guide-image-upload" type="file" accept="image/*" onChange={handleGuideImageChange} className="hidden" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('guide-image-upload')?.click()} disabled={isUploading}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {guideImageFile ? 'Change Image' : 'Upload Image'}
                        </Button>
                        <p className="text-xs text-muted-foreground">Image for the size guide pop-up.</p>
                    </div>
                </div>
                 <FormMessage />
              </FormItem>
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
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}
