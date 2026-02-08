'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Discount } from '@/lib/types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DiscountsPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [dialogState, setDialogState] = useState<{open: boolean; discount?: Partial<Discount>}>({ open: false, discount: undefined });
    
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
    const [value, setValue] = useState(0);
    const [description, setDescription] = useState('');
    const { loading: authLoading } = useAuth();

    const discountsQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'discounts'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: discounts, isLoading: isLoadingData, error } = useCollection<Discount>(discountsQuery);
    const isLoading = authLoading || isLoadingData;
    
    useEffect(() => {
        if (dialogState.open && dialogState.discount) {
            setName(dialogState.discount.name || '');
            setCode(dialogState.discount.code || '');
            setType(dialogState.discount.type || 'percentage');
            setValue(dialogState.discount.value || 0);
            setDescription(dialogState.discount.description || '');
        } else {
            setName('');
            setCode('');
            setType('percentage');
            setValue(0);
            setDescription('');
        }
    }, [dialogState.open, dialogState.discount]);

    const handleSaveDiscount = async () => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        if (!name.trim() || !code.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Name and Code are required.',
            });
            return;
        }
        if (value <= 0) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Value must be greater than zero.',
            });
            return;
        }

        const data = { name, code, type, value, description };

        try {
            if (dialogState.discount?.id) {
                await updateDoc(doc(db, 'discounts', dialogState.discount.id), data);
                toast({ title: 'Success', description: 'Discount updated.' });
            } else {
                await addDoc(collection(db, 'discounts'), {
                    ...data,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'New discount added.' });
            }
            setDialogState({ open: false, discount: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleDeleteDiscount = async (id: string) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            await deleteDoc(doc(db, 'discounts', id));
            toast({ title: 'Success', description: 'Discount deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setDialogState({ open: false, discount: undefined });
        } else {
            setDialogState(prev => ({ ...prev, open }));
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Discount Settings</h1>
                    <p className="text-muted-foreground">Manage discounts and promotions for your store.</p>
                </div>
                <Button onClick={() => setDialogState({ open: true, discount: {} })}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Discount
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Discounts</CardTitle>
                    <CardDescription>A list of all available discounts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell>
                                </TableRow>
                            )}
                            {!isLoading && error && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-red-500">{error.message}</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && discounts?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">No discounts found. Add one to get started.</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && discounts?.map((discount) => (
                                <TableRow key={discount.id}>
                                    <TableCell className="font-medium">{discount.name}</TableCell>
                                    <TableCell>{discount.code}</TableCell>
                                    <TableCell>{discount.type}</TableCell>
                                    <TableCell>{discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value.toFixed(2)}`}</TableCell>
                                    <TableCell>{discount.createdAt ? format(discount.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, discount })}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteDiscount(discount.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
                        <DialogTitle>{dialogState.discount?.id ? 'Edit Discount' : 'Add New Discount'}</DialogTitle>
                        <DialogDescription>
                            {dialogState.discount?.id ? `Update the details for ${"\'\'\'" + dialogState.discount.name + "\'\'\'"}.` : 'Enter the details for the new discount.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Summer Sale" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Code</Label>
                            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., SUMMER20" />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select value={type} onValueChange={(v: 'percentage' | 'fixed') => setType(v)}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Value</Label>
                                <Input id="value" type="number" value={value} onChange={(e) => setValue(parseFloat(e.target.value))} placeholder={type === 'percentage' ? "e.g., 10" : "e.g., 50"} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., 20% off all summer items." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSaveDiscount}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
