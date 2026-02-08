'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { WallType } from '@/lib/types';
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

export default function WallTypesPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [dialogState, setDialogState] = useState<{open: boolean; wallType?: Partial<WallType>}>({ open: false, wallType: undefined });
    
    const [name, setName] = useState('');
    const { loading: authLoading } = useAuth();

    const wallTypesQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'wallTypes'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: wallTypes, isLoading: isLoadingData, error } = useCollection<WallType>(wallTypesQuery);
    const isLoading = authLoading || isLoadingData;
    
    useEffect(() => {
        if (dialogState.open && dialogState.wallType) {
            setName(dialogState.wallType.name || '');
        }
    }, [dialogState.open, dialogState.wallType]);

    const handleSaveWallType = async () => {
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

        const data = { name };

        try {
            if (dialogState.wallType?.id) {
                await updateDoc(doc(db, 'wallTypes', dialogState.wallType.id), data);
                toast({ title: 'Success', description: 'Wall Type updated.' });
            } else {
                await addDoc(collection(db, 'wallTypes'), {
                    ...data,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'New Wall Type added.' });
            }
            setDialogState({ open: false, wallType: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleDeleteWallType = async (id: string) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            await deleteDoc(doc(db, 'wallTypes', id));
            toast({ title: 'Success', description: 'Wall Type deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setDialogState({ open: false, wallType: undefined });
        } else {
            setDialogState(prev => ({ ...prev, open }));
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Wall Types</h1>
                    <p className="text-muted-foreground">Manage cup wall types for your store.</p>
                </div>
                <Button onClick={() => setDialogState({ open: true, wallType: {} })}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Wall Type
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Wall Types</CardTitle>
                    <CardDescription>A list of all available cup wall types.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell>
                                </TableRow>
                            )}
                            {!isLoading && error && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-red-500">{error.message}</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && wallTypes?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No wall types found. Add one to get started.</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && wallTypes?.map((wallType) => (
                                <TableRow key={wallType.id}>
                                    <TableCell className="font-medium">{wallType.name}</TableCell>
                                    <TableCell>{wallType.createdAt ? format(wallType.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, wallType })}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteWallType(wallType.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
                        <DialogTitle>{dialogState.wallType?.id ? 'Edit Wall Type' : 'Add New Wall Type'}</DialogTitle>
                        <DialogDescription>
                            {dialogState.wallType?.id ? `Update the details for ${"\'\'\'"
                            + dialogState.wallType.name +
                            "\'\'\'"}.` : 'Enter the details for the new wall type.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Double Wall" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSaveWallType}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
