'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { ProductCallout } from '@/lib/types';
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

const calloutSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  linkText: z.string().min(1, 'Link text is required.'),
  linkHref: z.string().optional(),
  order: z.coerce.number().default(0),
});

type CalloutFormValues = z.infer<typeof calloutSchema>;

export default function AdminProductCalloutsPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const { loading: authLoading } = useAuth();

    const [dialogState, setDialogState] = useState<{ open: boolean; callout?: Partial<ProductCallout> }>({ open: false, callout: undefined });
    
    const form = useForm<CalloutFormValues>({
        resolver: zodResolver(calloutSchema),
        defaultValues: {
            title: '', description: '', linkText: '', linkHref: '', order: 0
        }
    });

    const calloutsQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'productCallouts'), orderBy('order', 'asc'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: callouts, isLoading: isLoadingData, error } = useCollection<ProductCallout>(calloutsQuery);
    const isLoading = authLoading || isLoadingData;

    useEffect(() => {
        if (dialogState.open && dialogState.callout) {
            form.reset({
                title: dialogState.callout.title || '',
                description: dialogState.callout.description || '',
                linkText: dialogState.callout.linkText || '',
                linkHref: dialogState.callout.linkHref || '',
                order: dialogState.callout.order || 0,
            });
        } else {
            form.reset({ title: '', description: '', linkText: '', linkHref: '', order: callouts?.length || 0 });
        }
    }, [dialogState, form, callouts]);

    const handleSaveCallout = async (data: CalloutFormValues) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }

        try {
            const dataToSave = { ...data, updatedAt: serverTimestamp() };

            if (dialogState.callout?.id) {
                await updateDoc(doc(db, 'productCallouts', dialogState.callout.id), dataToSave);
                toast({ title: 'Success', description: 'Product callout updated.' });
            } else {
                await addDoc(collection(db, 'productCallouts'), { ...dataToSave, createdAt: serverTimestamp() });
                toast({ title: 'Success', description: 'New product callout added.' });
            }
            setDialogState({ open: false, callout: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleDeleteCallout = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'productCallouts', id));
            toast({ title: 'Success', description: 'Product callout deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleReorder = async (currentIndex: number, direction: 'up' | 'down') => {
        if (!db || !callouts) return;
        if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === callouts.length - 1)) {
            return;
        }

        const itemToMove = callouts[currentIndex];
        const otherIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const itemToSwapWith = callouts[otherIndex];

        try {
            const batch = writeBatch(db);
            batch.update(doc(db, 'productCallouts', itemToMove.id), { order: itemToSwapWith.order });
            batch.update(doc(db, 'productCallouts', itemToSwapWith.id), { order: itemToMove.order });
            await batch.commit();
            toast({ title: 'Success', description: 'Callout reordered.' });
        } catch (e: any) {
            console.error('Error reordering callouts:', e);
            toast({ variant: 'destructive', title: 'Reorder Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => setDialogState(prev => ({ ...prev, open }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Product Callouts</h1>
                    <p className="text-muted-foreground">Manage the callout sections on the product detail page.</p>
                </div>
                <Button onClick={() => setDialogState({ open: true, callout: {} })}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Callout
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Callouts</CardTitle>
                    <CardDescription>A list of all callouts, ordered by display order.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Link</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            : error ? <TableRow><TableCell colSpan={6} className="text-center text-red-500">{error.message}</TableCell></TableRow>
                            : callouts?.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center">No callouts found. Add one to get started.</TableCell></TableRow>
                            : callouts?.map((callout, index) => (
                                <TableRow key={callout.id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell className="font-medium">{callout.title}</TableCell>
                                    <TableCell>{callout.description}</TableCell>
                                    <TableCell>{callout.linkText}</TableCell>
                                    <TableCell>{callout.order}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleReorder(index, 'up')} disabled={index === 0}>
                                                    <ArrowUp className="mr-2 h-4 w-4" /><span>Move Up</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleReorder(index, 'down')} disabled={index === callouts.length - 1}>
                                                    <ArrowDown className="mr-2 h-4 w-4" /><span>Move Down</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, callout })}><Edit className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteCallout(callout.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
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
                        <DialogTitle>{dialogState.callout?.id ? 'Edit Callout' : 'Add New Callout'}</DialogTitle>
                        <DialogDescription>Fill in the details for your product page callout.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSaveCallout)} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="linkText" render={({ field }) => (
                                <FormItem><FormLabel>Link Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="linkHref" render={({ field }) => (
                                <FormItem><FormLabel>Link URL</FormLabel><FormControl><Input {...field} placeholder="/contact" /></FormControl><FormMessage /></FormItem>
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
