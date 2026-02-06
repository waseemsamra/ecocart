'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { TrendingItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MoreHorizontal, Edit, Trash2, PlusCircle, Loader2, UploadCloud, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';

const s3BaseUrl = 'https://ecocloths.s3.us-west-2.amazonaws.com';

const itemSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  imageUrl: z.string().min(1, 'Image path is required.'),
  imageHint: z.string().optional(),
  order: z.coerce.number().default(0),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export default function AdminTrendingNowPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const { loading: authLoading } = useAuth();

    const [dialogState, setDialogState] = useState<{ open: boolean; item?: Partial<TrendingItem> }>({ open: false, item: undefined });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const form = useForm<ItemFormValues>({
        resolver: zodResolver(itemSchema),
        defaultValues: { title: '', imageUrl: '', imageHint: '', order: 0 }
    });
    
    const itemsQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'trendingItems'), orderBy('order', 'asc'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: items, isLoading: isLoadingData, error } = useCollection<TrendingItem>(itemsQuery);
    const isLoading = authLoading || isLoadingData;
    
    const imageUrlPath = form.watch('imageUrl');

    useEffect(() => {
        if (imageFile) return;
        if (imageUrlPath) {
            const url = imageUrlPath.startsWith('http') ? imageUrlPath : `${s3BaseUrl}${imageUrlPath}`;
            setImagePreview(url);
        } else {
            setImagePreview(null);
        }
    }, [imageUrlPath, imageFile]);

    useEffect(() => {
        if (dialogState.open && dialogState.item) {
            form.reset({
                title: dialogState.item.title || '',
                imageUrl: dialogState.item.imageUrl || '',
                imageHint: dialogState.item.imageHint || '',
                order: dialogState.item.order || 0,
            });
            setImagePreview(dialogState.item.imageUrl || null);
            setImageFile(null);
        } else {
            form.reset({ title: '', imageUrl: '', imageHint: '', order: items?.length || 0 });
            setImagePreview(null);
            setImageFile(null);
        }
    }, [dialogState, form, items]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveItem = async (data: ItemFormValues) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }

        let finalImageUrl = data.imageUrl || '';
        try {
            if (imageFile) {
                setIsUploading(true);
                const formData = new FormData();
                formData.append("file", imageFile);
                const response = await fetch('/api/image', { method: 'POST', body: formData });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: `Image upload failed: ${response.statusText}` }));
                    throw new Error(errorData.error);
                }
                const result = await response.json();
                finalImageUrl = result.url;
                setIsUploading(false);
            }

            const dataToSave = { ...data, imageUrl: finalImageUrl, updatedAt: serverTimestamp() };

            if (dialogState.item?.id) {
                await updateDoc(doc(db, 'trendingItems', dialogState.item.id), dataToSave);
                toast({ title: 'Success', description: 'Trending item updated.' });
            } else {
                await addDoc(collection(db, 'trendingItems'), { ...dataToSave, createdAt: serverTimestamp() });
                toast({ title: 'Success', description: 'New trending item added.' });
            }
            setDialogState({ open: false, item: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
            setIsUploading(false);
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'trendingItems', id));
            toast({ title: 'Success', description: 'Trending item deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleCloneItem = async (itemToClone: TrendingItem) => {
        if (!db) return;
        try {
            const { id, createdAt, updatedAt, ...clonedData } = itemToClone;
            const newItemData = {
                ...clonedData,
                title: `${clonedData.title} (Copy)`,
                order: items ? items.length : 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            await addDoc(collection(db, 'trendingItems'), newItemData);
            toast({ title: 'Success', description: `"${itemToClone.title}" has been cloned.` });
        } catch (e: any) {
            console.error('Error cloning item:', e);
            toast({ variant: 'destructive', title: 'Clone Error', description: e.message });
        }
    };

    const handleReorder = async (currentIndex: number, direction: 'up' | 'down') => {
        if (!db || !items) return;
        if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === items.length - 1)) {
            return;
        }

        const itemToMove = items[currentIndex];
        const otherIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const itemToSwapWith = items[otherIndex];

        try {
            const batch = writeBatch(db);
            batch.update(doc(db, 'trendingItems', itemToMove.id), { order: itemToSwapWith.order });
            batch.update(doc(db, 'trendingItems', itemToSwapWith.id), { order: itemToMove.order });
            await batch.commit();
            toast({ title: 'Success', description: 'Item reordered.' });
        } catch (e: any) {
            console.error('Error reordering items:', e);
            toast({ variant: 'destructive', title: 'Reorder Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => setDialogState(prev => ({ ...prev, open }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Trending Now Items</h1>
                    <p className="text-muted-foreground">Manage items for your homepage 'Trending Now' section.</p>
                </div>
                <Button onClick={() => setDialogState({ open: true, item: {} })}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Item
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Trending Items</CardTitle>
                    <CardDescription>A list of all items, ordered by display order.</CardDescription>
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
                            : items?.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center">No items found. Add one to get started.</TableCell></TableRow>
                            : items?.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        {item.imageUrl && <Image alt={item.title} className="aspect-square rounded-md object-cover" height="64" src={item.imageUrl} width="64" unoptimized />}
                                    </TableCell>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell>{item.order}</TableCell>
                                    <TableCell>{item.updatedAt ? format(item.updatedAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleReorder(index, 'up')} disabled={index === 0}>
                                                    <ArrowUp className="mr-2 h-4 w-4" /><span>Move Up</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleReorder(index, 'down')} disabled={index === items.length - 1}>
                                                    <ArrowDown className="mr-2 h-4 w-4" /><span>Move Down</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, item })}><Edit className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleCloneItem(item)}>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    <span>Clone</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteItem(item.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
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
                        <DialogTitle>{dialogState.item?.id ? 'Edit Trending Item' : 'Add New Trending Item'}</DialogTitle>
                        <DialogDescription>Fill in the details for your trending item.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSaveItem)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="order" render={({ field }) => (
                                <FormItem><FormLabel>Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormItem>
                                <FormLabel>Background Image</FormLabel>
                                <div className="mt-2 flex items-center gap-6">
                                    {imagePreview ? <Image src={imagePreview} alt="Image preview" width={80} height={80} className="rounded-lg object-contain h-20 w-20 bg-muted border p-1" unoptimized />
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
                                <FormItem><FormLabel>Image Path</FormLabel><FormControl><Input {...field} placeholder="/trending/item1.jpg" /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="imageHint" render={({ field }) => (
                                <FormItem><FormLabel>AI Image Hint</FormLabel><FormControl><Input {...field} placeholder="e.g., custom tape" /></FormControl><FormMessage /></FormItem>
                            )} />

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
