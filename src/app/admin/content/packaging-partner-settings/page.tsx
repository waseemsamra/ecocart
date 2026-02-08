'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore } from '@/firebase/provider';
import type { PackagingPartnerSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const packagingPartnerSettingsSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  tabs: z.array(z.object({
      id: z.string(),
      label: z.string().min(1, 'Tab label is required.'),
  })).max(3),
});

type SettingsFormValues = z.infer<typeof packagingPartnerSettingsSchema>;

const defaultSettings: PackagingPartnerSettings = {
    id: 'packagingPartner',
    title: 'Packaging partner to world-leading brands',
    tabs: [
        { id: 'new-in', label: 'New In' },
        { id: 'most-popular', label: 'Most Popular' },
        { id: 'ready-to-ship', label: 'Ready to Ship' },
    ],
};

export default function PackagingPartnerSettingsPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loading: authLoading } = useAuth();

  const settingsRef = useMemo(() => {
    if (!db) return null;
    const ref = doc(db, 'settings', 'packagingPartner');
    (ref as any).__memo = true;
    return ref;
  }, [db]);

  const { data: settingsData, isLoading: isLoadingSettings } = useDoc<PackagingPartnerSettings>(settingsRef);
  const isLoadingPage = authLoading || isLoadingSettings;

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(packagingPartnerSettingsSchema),
    defaultValues: {
        title: '',
        tabs: [],
    },
  });
  
  const { fields } = useFieldArray({
    control: form.control,
    name: "tabs"
  });

  useEffect(() => {
    const currentSettings = settingsData || defaultSettings;
    if (currentSettings) {
      form.reset({
        title: currentSettings.title || '',
        tabs: currentSettings.tabs || [],
      });
    }
  }, [settingsData, form]);

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSubmitting(true);
    if (!db) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not initialized.' });
        setIsSubmitting(false);
        return;
    }
    try {
      await setDoc(doc(db, 'settings', 'packagingPartner'), {
        id: 'packagingPartner',
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: 'Success',
        description: 'Packaging Partner section updated successfully.',
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
        <h1 className="font-headline text-3xl font-bold">Packaging Partner Section</h1>
        <p className="text-muted-foreground">Customize the title and tab labels for the homepage section.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Section Title</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                       <FormControl>
                        <Input {...field} placeholder="Section title"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>
           <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Tab Labels</CardTitle>
              <CardDescription>Edit the display text for each tab. The underlying tag will remain the same.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {fields.map((field, index) => (
                 <FormField
                  key={field.id}
                  control={form.control}
                  name={`tabs.${index}.label`}
                  render={({ field: tabField }) => (
                    <FormItem>
                      <FormLabel>Label for "{field.id}"</FormLabel>
                       <FormControl>
                        <Input {...tabField} placeholder={`Label for ${field.id}`}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               ))}
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
