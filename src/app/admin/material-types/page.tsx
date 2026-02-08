'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { MaterialType } from '@/lib/types';
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

export default function MaterialTypesPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [dialogState, setDialogState] = useState<{open: boolean; material?: Partial<MaterialType>}>({ open: false, material: undefined });
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const { loading: authLoading } = useAuth();

    const materialsQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'materialTypes'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: materials, isLoading: isLoadingData, error } = useCollection<MaterialType>(materialsQuery);
    const isLoading = authLoading || isLoadingData;
    
    useEffect(() => {
        if (dialogState.open && dialogState.material) {
            setName(dialogState.material.name || '');
            setDescription(dialogState.material.description || '');
        }
    }, [dialogState.open, dialogState.material]);

    const handleSaveMaterial = async () => {
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
            if (dialogState.material?.id) {
                await updateDoc(doc(db, 'materialTypes', dialogState.material.id), data);
                toast({ title: 'Success', description: 'Material updated.' });
            } else {
                await addDoc(collection(db, 'materialTypes'), {
                    ...data,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'New material added.' });
            }
            setDialogState({ open: false, material: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleDeleteMaterial = async (id: string) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            await deleteDoc(doc(db, 'materialTypes', id));
            toast({ title: 'Success', description: 'Material deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setDialogState({ open: false, material: undefined });
        } else {
            setDialogState(prev => ({ ...prev, open }));
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Materials</h1>
                    <p className="text-muted-foreground">Manage materials for your store.</p>
                </div>
                <Button onClick={() => setDialogState({ open: true, material: {} })}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Material
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Materials</CardTitle>
                    <CardDescription>A list of all available materials.</CardDescription>
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
                            {!isLoading && materials?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No materials found. Add materials like 'Standard White' or 'Kraft' to get started.</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && materials?.map((material) => (
                                <TableRow key={material.id}>
                                    <TableCell className="font-medium">{material.name}</TableCell>
                                    <TableCell>{material.description}</TableCell>
                                    <TableCell>{material.createdAt ? format(material.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, material })}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteMaterial(material.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
                        <DialogTitle>{dialogState.material?.id ? 'Edit Material' : 'Add New Material'}</DialogTitle>
                        <DialogDescription>
                            {dialogState.material?.id ? `Update the details for ${"\'\'\'"
                            + dialogState.material.name +
                            "\'\'\'"}.` : 'Enter the details for the new material.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard White" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., An uncoated, matte white material." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSaveMaterial}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
