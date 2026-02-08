'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Handle } from '@/lib/types';
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';

export default function HandlesPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [dialogState, setDialogState] = useState<{open: boolean; handle?: Partial<Handle>}>({ open: false, handle: undefined });
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const { loading: authLoading } = useAuth();

    const handlesQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'handles'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: handles, isLoading: isLoadingData, error } = useCollection<Handle>(handlesQuery);
    const isLoading = authLoading || isLoadingData;
    
    useEffect(() => {
        if (dialogState.open && dialogState.handle) {
            setName(dialogState.handle.name || '');
            setDescription(dialogState.handle.description || '');
        }
    }, [dialogState.open, dialogState.handle]);

    const handleSaveHandle = async () => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        if (!name.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Name is required.',
            });
            return;
        }

        const data = { name, description };

        try {
            if (dialogState.handle?.id) {
                await updateDoc(doc(db, 'handles', dialogState.handle.id), data);
                toast({ title: 'Success', description: 'Handle updated.' });
            } else {
                await addDoc(collection(db, 'handles'), {
                    ...data,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'New handle added.' });
            }
            setDialogState({ open: false, handle: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleDeleteHandle = async (id: string) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            await deleteDoc(doc(db, 'handles', id));
            toast({ title: 'Success', description: 'Handle deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setDialogState({ open: false, handle: undefined });
        } else {
            setDialogState(prev => ({ ...prev, open }));
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Handle Options</h1>
                    <p className="text-muted-foreground">Manage bag handle options for your store.</p>
                </div>
                <Button onClick={() => setDialogState({ open: true, handle: {} })}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Handle
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Handle Options</CardTitle>
                    <CardDescription>A list of all available handle options.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
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
                            {!isLoading && handles?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No handle options found. Add one to get started.</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && handles?.map((handle) => (
                                <TableRow key={handle.id}>
                                    <TableCell className="font-medium">{handle.name}</TableCell>
                                    <TableCell>{handle.description}</TableCell>
                                    <TableCell>{handle.createdAt ? format(handle.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, handle })}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteHandle(handle.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
                        <DialogTitle>{dialogState.handle?.id ? 'Edit Handle' : 'Add New Handle'}</DialogTitle>
                        <DialogDescription>
                            {dialogState.handle?.id ? `Update the details for ${"\'\'\'"
                            + dialogState.handle.name +
                            "\'\'\'"}.` : 'Enter the details for the new handle option.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Flat" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Flat paper handle." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSaveHandle}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
