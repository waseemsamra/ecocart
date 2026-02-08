'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Size } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Edit, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';

export default function SizesPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [dialogState, setDialogState] = useState<{open: boolean; size?: Partial<Size>}>({ open: false, size: undefined });
    
    const [name, setName] = useState('');
    const [shortName, setShortName] = useState('');
    const { loading: authLoading } = useAuth();

    const sizesQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'sizes'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: sizes, isLoading: isLoadingData, error } = useCollection<Size>(sizesQuery);
    const isLoading = authLoading || isLoadingData;
    
    useEffect(() => {
        if (dialogState.open && dialogState.size) {
            setName(dialogState.size.name || '');
            setShortName(dialogState.size.shortName || '');
        }
    }, [dialogState.open, dialogState.size]);

    const handleSaveSize = async () => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        if (!name.trim() || !shortName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Both Name and Short Name are required.',
            });
            return;
        }

        const data = { name, shortName };

        try {
            if (dialogState.size?.id) {
                await updateDoc(doc(db, 'sizes', dialogState.size.id), data);
                toast({ title: 'Success', description: 'Size updated.' });
            } else {
                await addDoc(collection(db, 'sizes'), {
                    ...data,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'New size added.' });
            }
            setDialogState({ open: false, size: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleDeleteSize = async (id: string) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            await deleteDoc(doc(db, 'sizes', id));
            toast({ title: 'Success', description: 'Size deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setDialogState({ open: false, size: undefined });
        } else {
            setDialogState(prev => ({ ...prev, open }));
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Sizes</h1>
                    <p className="text-muted-foreground">Manage product sizes for your store.</p>
                </div>
                <Button onClick={() => setDialogState({ open: true, size: {} })}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Size
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Sizes</CardTitle>
                    <CardDescription>A list of all available product sizes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Short Name</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell>
                                </TableRow>
                            )}
                            {!isLoading && error && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-red-500">{error.message}</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && sizes?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No sizes found. Add one to get started.</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && sizes?.map((size) => (
                                <TableRow key={size.id}>
                                    <TableCell className="font-medium">{size.name}</TableCell>
                                    <TableCell>{size.shortName}</TableCell>
                                    <TableCell>{size.createdAt ? format(size.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, size })}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteSize(size.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogState.size?.id ? 'Edit Size' : 'Add New Size'}</DialogTitle>
                        <DialogDescription>
                            {dialogState.size?.id ? `Update the details for ${"\'\'\'"
                            + dialogState.size.name +
                            "\'\'\'"}.` : 'Enter the details for the new size.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Medium" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shortName">Short Name</Label>
                            <Input id="shortName" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="e.g., M" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSaveSize}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
