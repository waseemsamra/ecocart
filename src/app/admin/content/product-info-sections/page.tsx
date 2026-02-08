'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { ProductInfoSection } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MoreHorizontal, Edit, Trash2, PlusCircle, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';

const infoSectionSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  order: z.coerce.number().default(0),
});

type InfoSectionFormValues = z.infer<typeof infoSectionSchema>;

export default function AdminProductInfoSectionsPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const { loading: authLoading } = useAuth();

    const [dialogState, setDialogState] = useState<{ open: boolean; section?: Partial<ProductInfoSection> }>({ open: false, section: undefined });
    
    const form = useForm<InfoSectionFormValues>({
        resolver: zodResolver(infoSectionSchema),
        defaultValues: {
            title: '', description: '', order: 0
        }
    });

    const sectionsQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'productInfoSections'), orderBy('order', 'asc'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: sections, isLoading: isLoadingData, error } = useCollection<ProductInfoSection>(sectionsQuery);
    const isLoading = authLoading || isLoadingData;

    useEffect(() => {
        if (dialogState.open && dialogState.section) {
            form.reset({
                title: dialogState.section.title || '',
                description: dialogState.section.description || '',
                order: dialogState.section.order || 0,
            });
        } else {
            form.reset({ title: '', description: '', order: sections?.length || 0 });
        }
    }, [dialogState, form, sections]);

    const handleSaveSection = async (data: InfoSectionFormValues) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }

        try {
            const dataToSave = { ...data, updatedAt: serverTimestamp() };

            if (dialogState.section?.id) {
                await updateDoc(doc(db, 'productInfoSections', dialogState.section.id), dataToSave);
                toast({ title: 'Success', description: 'Info section updated.' });
            } else {
                await addDoc(collection(db, 'productInfoSections'), { ...dataToSave, createdAt: serverTimestamp() });
                toast({ title: 'Success', description: 'New info section added.' });
            }
            setDialogState({ open: false, section: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleDeleteSection = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'productInfoSections', id));
            toast({ title: 'Success', description: 'Info section deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleReorder = async (currentIndex: number, direction: 'up' | 'down') => {
        if (!db || !sections) return;
        if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === sections.length - 1)) {
            return;
        }

        const itemToMove = sections[currentIndex];
        const otherIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const itemToSwapWith = sections[otherIndex];

        try {
            const batch = writeBatch(db);
            batch.update(doc(db, 'productInfoSections', itemToMove.id), { order: itemToSwapWith.order });
            batch.update(doc(db, 'productInfoSections', itemToSwapWith.id), { order: itemToMove.order });
            await batch.commit();
            toast({ title: 'Success', description: 'Section reordered.' });
        } catch (e: any) {
            console.error('Error reordering sections:', e);
            toast({ variant: 'destructive', title: 'Reorder Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => setDialogState(prev => ({ ...prev, open }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Product Info Sections</h1>
                    <p className="text-muted-foreground">Manage global informational sections on the product detail page.</p>
                </div>
                <Button onClick={() => setDialogState({ open: true, section: {} })}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Section
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Info Sections</CardTitle>
                    <CardDescription>A list of all sections, ordered by display order.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            : error ? <TableRow><TableCell colSpan={5} className="text-center text-red-500">{error.message}</TableCell></TableRow>
                            : sections?.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center">No sections found. Add one to get started.</TableCell></TableRow>
                            : sections?.map((section, index) => (
                                <TableRow key={section.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell className="font-medium">{section.title}</TableCell>
                                    <TableCell className="max-w-sm truncate">{section.description}</TableCell>
                                    <TableCell>{section.order}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleReorder(index, 'up')} disabled={index === 0}>
                                                    <ArrowUp className="mr-2 h-4 w-4" /><span>Move Up</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleReorder(index, 'down')} disabled={index === sections.length - 1}>
                                                    <ArrowDown className="mr-2 h-4 w-4" /><span>Move Down</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, section })}><Edit className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteSection(section.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
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
                        <DialogTitle>{dialogState.section?.id ? 'Edit Section' : 'Add New Section'}</DialogTitle>
                        <DialogDescription>Fill in the details for your product page info section.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSaveSection)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g. SHIPPING INFORMATION" /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} rows={5} placeholder="Enter the content for this section. You can use bullet points (e.g., using a hyphen -)." /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="order" render={({ field }) => (
                                <FormItem><FormLabel>Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>Cancel</Button>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
