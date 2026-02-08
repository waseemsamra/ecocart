'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Colour } from '@/lib/types';
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

export default function ColoursPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [dialogState, setDialogState] = useState<{open: boolean; colour?: Partial<Colour>}>({ open: false, colour: undefined });
    
    const [name, setName] = useState('');
    const [hexCode, setHexCode] = useState('');
    const { loading: authLoading } = useAuth();

    const coloursQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'colours'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: colours, isLoading: isLoadingData, error } = useCollection<Colour>(coloursQuery);
    const isLoading = authLoading || isLoadingData;
    
    useEffect(() => {
        if (dialogState.open && dialogState.colour) {
            setName(dialogState.colour.name || '');
            setHexCode(dialogState.colour.hexCode || '');
        }
    }, [dialogState.open, dialogState.colour]);

    const handleSaveColour = async () => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        if (!name.trim() || !hexCode.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Both Name and Hex Code are required.',
            });
            return;
        }

        const data = { name, hexCode };

        try {
            if (dialogState.colour?.id) {
                await updateDoc(doc(db, 'colours', dialogState.colour.id), data);
                toast({ title: 'Success', description: 'Colour updated.' });
            } else {
                await addDoc(collection(db, 'colours'), {
                    ...data,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'New colour added.' });
            }
            setDialogState({ open: false, colour: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleDeleteColour = async (id: string) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            await deleteDoc(doc(db, 'colours', id));
            toast({ title: 'Success', description: 'Colour deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setDialogState({ open: false, colour: undefined });
        } else {
            setDialogState(prev => ({ ...prev, open }));
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Colours</h1>
                    <p className="text-muted-foreground">Manage product colours for your store.</p>
                </div>
                <Button onClick={() => setDialogState({ open: true, colour: {} })}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Colour
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Colours</CardTitle>
                    <CardDescription>A list of all available product colours.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Hex Code</TableHead>
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
                            {!isLoading && colours?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No colours found. Add one to get started.</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && colours?.map((colour) => (
                                <TableRow key={colour.id}>
                                    <TableCell className="font-medium">{colour.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: colour.hexCode }}></div>
                                            {colour.hexCode}
                                        </div>
                                    </TableCell>
                                    <TableCell>{colour.createdAt ? format(colour.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, colour })}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteColour(colour.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
                        <DialogTitle>{dialogState.colour?.id ? 'Edit Colour' : 'Add New Colour'}</DialogTitle>
                        <DialogDescription>
                            {dialogState.colour?.id ? `Update the details for ${"\'\'\'"
                            + dialogState.colour.name +
                            "\'\'\'"}.` : 'Enter the details for the new colour.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Forest Green" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hexCode">Hex Code</Label>
                            <Input id="hexCode" value={hexCode} onChange={(e) => setHexCode(e.target.value)} placeholder="e.g., #228B22" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSaveColour}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
