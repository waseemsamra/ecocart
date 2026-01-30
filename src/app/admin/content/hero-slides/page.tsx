'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { HeroSlide } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Edit, Trash2, PlusCircle, Loader2, UploadCloud, Link as LinkIcon, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';

const s3BaseUrl = 'https://ecocloths.s3.us-west-2.amazonaws.com';

const slideSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  shopNowUrl: z.string().optional(),
  imageUrl: z.string().min(1, 'Image path is required.'),
  imageHint: z.string().optional(),
  order: z.coerce.number().default(0),
  subLinks: z.array(z.object({
    text: z.string().min(1, 'Link text is required.'),
    href: z.string().min(1, 'Link URL is required.'),
  })).optional(),
});

type SlideFormValues = z.infer<typeof slideSchema>;

export default function AdminHeroSlidesPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const { loading: authLoading } = useAuth();

    const [dialogState, setDialogState] = useState<{ open: boolean; slide?: Partial<HeroSlide> }>({ open: false, slide: undefined });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const form = useForm<SlideFormValues>({
        resolver: zodResolver(slideSchema),
        defaultValues: {
            title: '', shopNowUrl: '', imageUrl: '', imageHint: '', order: 0, subLinks: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "subLinks",
    });

    const slidesQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'heroSlides'), orderBy('order', 'asc'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: slides, isLoading: isLoadingData, error } = useCollection<HeroSlide>(slidesQuery);
    const isLoading = authLoading || isLoadingData;
    
    const imageUrlPath = form.watch('imageUrl');

    useEffect(() => {
        if (logoFile) return;
        if (imageUrlPath) {
            const url = imageUrlPath.startsWith('http') ? imageUrlPath : `${s3BaseUrl}${imageUrlPath}`;
            setLogoPreview(url);
        } else {
            setLogoPreview(null);
        }
    }, [imageUrlPath, logoFile]);

    useEffect(() => {
        if (dialogState.open && dialogState.slide) {
            form.reset({
                title: dialogState.slide.title || '',
                shopNowUrl: dialogState.slide.shopNowUrl || '',
                imageUrl: dialogState.slide.imageUrl || '',
                imageHint: dialogState.slide.imageHint || '',
                order: dialogState.slide.order || 0,
                subLinks: dialogState.slide.subLinks || []
            });
            setLogoPreview(dialogState.slide.imageUrl || null);
            setLogoFile(null);
        } else {
            form.reset({ title: '', shopNowUrl: '', imageUrl: '', imageHint: '', order: slides?.length || 0, subLinks: [] });
            setLogoPreview(null);
            setLogoFile(null);
        }
    }, [dialogState, form, slides]);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSlide = async (data: SlideFormValues) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }

        let finalImageUrl = data.imageUrl || '';
        try {
            if (logoFile) {
                setIsUploading(true);
                const formData = new FormData();
                formData.append("file", logoFile);
                const response = await fetch('/api/image', { method: 'POST', body: formData });
                if (!response.ok) throw new Error(`Image upload failed: ${response.statusText}`);
                const result = await response.json();
                finalImageUrl = result.url;
                setIsUploading(false);
            }

            const dataToSave = { ...data, imageUrl: finalImageUrl, updatedAt: serverTimestamp() };

            if (dialogState.slide?.id) {
                await updateDoc(doc(db, 'heroSlides', dialogState.slide.id), dataToSave);
                toast({ title: 'Success', description: 'Hero slide updated.' });
            } else {
                await addDoc(collection(db, 'heroSlides'), { ...dataToSave, createdAt: serverTimestamp() });
                toast({ title: 'Success', description: 'New hero slide added.' });
            }
            setDialogState({ open: false, slide: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
            setIsUploading(false);
        }
    };

    const handleDeleteSlide = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'heroSlides', id));
            toast({ title: 'Success', description: 'Hero slide deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleCloneSlide = async (slideToClone: HeroSlide) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            const { id, createdAt, updatedAt, ...clonedData } = slideToClone;
            const newSlideData = {
                ...clonedData,
                title: `${clonedData.title} (Copy)`,
                order: slides ? slides.length : 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            await addDoc(collection(db, 'heroSlides'), newSlideData);
            toast({ title: 'Success', description: `"${slideToClone.title}" has been cloned.` });
        } catch (e: any) {
            console.error('Error cloning slide:', e);
            toast({ variant: 'destructive', title: 'Clone Error', description: e.message });
        }
    };

    const handleReorder = async (currentIndex: number, direction: 'up' | 'down') => {
        if (!db || !slides) return;
        if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === slides.length - 1)) {
            return;
        }

        const slideToMove = slides[currentIndex];
        const otherIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const slideToSwapWith = slides[otherIndex];

        try {
            const batch = writeBatch(db);

            const slideToMoveRef = doc(db, 'heroSlides', slideToMove.id);
            batch.update(slideToMoveRef, { order: slideToSwapWith.order });

            const slideToSwapWithRef = doc(db, 'heroSlides', slideToSwapWith.id);
            batch.update(slideToSwapWithRef, { order: slideToMove.order });

            await batch.commit();
            toast({ title: 'Success', description: 'Slide reordered.' });
        } catch (e: any) {
            console.error('Error reordering slides:', e);
            toast({ variant: 'destructive', title: 'Reorder Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => setDialogState(prev => ({ ...prev, open }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Hero Slides</h1>
                    <p className="text-muted-foreground">Manage slides for your homepage hero section.</p>
                </div>
                <Button onClick={() => setDialogState({ open: true, slide: {} })}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Slide
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Hero Slides</CardTitle>
                    <CardDescription>A list of all hero slides, ordered by display order.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            : error ? <TableRow><TableCell colSpan={6} className="text-center text-red-500">{error.message}</TableCell></TableRow>
                            : slides?.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center">No slides found. Add one to get started.</TableCell></TableRow>
                            : slides?.map((slide, index) => (
                                <TableRow key={slide.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        {slide.imageUrl && <Image alt={slide.title} className="aspect-square rounded-md object-cover" height="64" src={slide.imageUrl} width="64" unoptimized />}
                                    </TableCell>
                                    <TableCell className="font-medium">{slide.title}</TableCell>
                                    <TableCell>{slide.order}</TableCell>
                                    <TableCell>{slide.updatedAt ? format(slide.updatedAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleReorder(index, 'up')} disabled={index === 0}>
                                                    <ArrowUp className="mr-2 h-4 w-4" /><span>Move Up</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleReorder(index, 'down')} disabled={index === slides.length - 1}>
                                                    <ArrowDown className="mr-2 h-4 w-4" /><span>Move Down</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, slide })}><Edit className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleCloneSlide(slide)}>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    <span>Clone</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteSlide(slide.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <Dialog open={dialogState.open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>{dialogState.slide?.id ? 'Edit Hero Slide' : 'Add New Hero Slide'}</DialogTitle>
                        <DialogDescription>Fill in the details for your hero slide.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSaveSlide)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="shopNowUrl" render={({ field }) => (
                                <FormItem><FormLabel>Shop Now URL</FormLabel><FormControl><Input {...field} placeholder="/products" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="order" render={({ field }) => (
                                <FormItem><FormLabel>Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormItem>
                                <FormLabel>Background Image</FormLabel>
                                <div className="mt-2 flex items-center gap-6">
                                    {logoPreview ? <Image src={logoPreview} alt="Logo preview" width={80} height={80} className="rounded-lg object-contain h-20 w-20 bg-muted border p-1" unoptimized />
                                    : <div className="h-20 w-20 flex items-center justify-center rounded-lg bg-muted text-muted-foreground border"><UploadCloud className="h-8 w-8" /></div>}
                                    <div className='flex flex-col gap-2'>
                                        <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                        <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()} disabled={isUploading}>
                                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {logoFile ? 'Change Image' : 'Upload Image'}
                                        </Button>
                                        <p className="text-xs text-muted-foreground">Or provide a path below.</p>
                                    </div>
                                </div>
                            </FormItem>
                            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                <FormItem><FormLabel>Image Path</FormLabel><FormControl><Input {...field} placeholder="/hero/slide1.jpg" /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="imageHint" render={({ field }) => (
                                <FormItem><FormLabel>AI Image Hint</FormLabel><FormControl><Input {...field} placeholder="e.g., coffee cups" /></FormControl><FormMessage /></FormItem>
                            )} />

                            <div className="space-y-4">
                                <Label>Sub Links</Label>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-2 p-3 border rounded-lg">
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <FormField control={form.control} name={`subLinks.${index}.text`} render={({ field }) => (
                                                <FormItem><FormControl><Input {...field} placeholder="Link Text" /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name={`subLinks.${index}.href`} render={({ field }) => (
                                                <FormItem><FormControl><Input {...field} placeholder="/products" /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={() => append({ text: '', href: '' })}><LinkIcon className="mr-2 h-4 w-4" />Add Link</Button>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>Cancel</Button>
                                <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
                                    {(form.formState.isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
