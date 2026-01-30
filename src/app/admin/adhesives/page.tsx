'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Adhesive } from '@/lib/types';
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

export default function AdhesivesPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [dialogState, setDialogState] = useState<{open: boolean; adhesive?: Partial<Adhesive>}>({ open: false, adhesive: undefined });
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const { loading: authLoading } = useAuth();

    const adhesivesQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'adhesives'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: adhesives, isLoading: isLoadingData, error } = useCollection<Adhesive>(adhesivesQuery);
    
    const isLoading = authLoading || isLoadingData;

    useEffect(() => {
        if (dialogState.open && dialogState.adhesive) {
            setName(dialogState.adhesive.name || '');
            setDescription(dialogState.adhesive.description || '');
        }
    }, [dialogState.open, dialogState.adhesive]);

    const handleSaveAdhesive = async () => {
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
            if (dialogState.adhesive?.id) {
                await updateDoc(doc(db, 'adhesives', dialogState.adhesive.id), data);
                toast({ title: 'Success', description: 'Adhesive updated.' });
            } else {
                await addDoc(collection(db, 'adhesives'), {
                    ...data,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'New adhesive added.' });
            }
            setDialogState({ open: false, adhesive: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleDeleteAdhesive = async (id: string) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            await deleteDoc(doc(db, 'adhesives', id));
            toast({ title: 'Success', description: 'Adhesive deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setDialogState({ open: false, adhesive: undefined });
        } else {
            setDialogState(prev => ({ ...prev, open }));
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Adhesive Options</h1>
                    <p className="text-muted-foreground">Manage product adhesive options for your store.</p>
                </div>
                <Button onClick={() => setDialogState({ open: true, adhesive: {} })}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Adhesive
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Adhesive Options</CardTitle>
                    <CardDescription>A list of all available adhesive options.</CardDescription>
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
                            {!isLoading && adhesives?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No adhesive options found. Add one to get started.</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && adhesives?.map((adhesive) => (
                                <TableRow key={adhesive.id}>
                                    <TableCell className="font-medium">{adhesive.name}</TableCell>
                                    <TableCell>{adhesive.description}</TableCell>
                                    <TableCell>{adhesive.createdAt ? format(adhesive.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, adhesive })}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteAdhesive(adhesive.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
                        <DialogTitle>{dialogState.adhesive?.id ? 'Edit Adhesive' : 'Add New Adhesive'}</DialogTitle>
                        <DialogDescription>
                            {dialogState.adhesive?.id ? `Update the details for ${"\'\'\'"
                              + dialogState.adhesive.name +
                            "\'\'\'"}.` : 'Enter the details for the new adhesive option.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Single" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Single-sided adhesive." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSaveAdhesive}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
