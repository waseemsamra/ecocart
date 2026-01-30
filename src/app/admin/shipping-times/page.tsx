'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { ShippingTime } from '@/lib/types';
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

export default function ShippingTimesPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [dialogState, setDialogState] = useState<{open: boolean; shippingTime?: Partial<ShippingTime>}>({ open: false, shippingTime: undefined });
    
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [cost, setCost] = useState(0);
    const { loading: authLoading } = useAuth();

    const shippingTimesQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'shippingTimes'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: shippingTimes, isLoading: isLoadingData, error } = useCollection<ShippingTime>(shippingTimesQuery);
    const isLoading = authLoading || isLoadingData;
    
    useEffect(() => {
        if (dialogState.open && dialogState.shippingTime) {
            setName(dialogState.shippingTime.name || '');
            setDuration(dialogState.shippingTime.duration || '');
            setCost(dialogState.shippingTime.cost || 0);
        } else {
            setName('');
            setDuration('');
            setCost(0);
        }
    }, [dialogState.open, dialogState.shippingTime]);

    const handleSaveShippingTime = async () => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        if (!name.trim() || !duration.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Name and Duration are required.',
            });
            return;
        }

        const data = { name, duration, cost };

        try {
            if (dialogState.shippingTime?.id) {
                await updateDoc(doc(db, 'shippingTimes', dialogState.shippingTime.id), data);
                toast({ title: 'Success', description: 'Shipping Time updated.' });
            } else {
                await addDoc(collection(db, 'shippingTimes'), {
                    ...data,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'New Shipping Time added.' });
            }
            setDialogState({ open: false, shippingTime: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };

    const handleDeleteShippingTime = async (id: string) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            await deleteDoc(doc(db, 'shippingTimes', id));
            toast({ title: 'Success', description: 'Shipping Time deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setDialogState({ open: false, shippingTime: undefined });
        } else {
            setDialogState(prev => ({ ...prev, open }));
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Shipping Times</h1>
                    <p className="text-muted-foreground">Manage shipping options for your store.</p>
                </div>
                <Button onClick={() => setDialogState({ open: true, shippingTime: {} })}>
                    <PlusCircle className="mr-2 h-4 w-4" />Add Shipping Time
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Shipping Times</CardTitle>
                    <CardDescription>A list of all available shipping options.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell>
                                </TableRow>
                            )}
                            {!isLoading && error && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-red-500">{error.message}</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && shippingTimes?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">No shipping times found. Add one to get started.</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && shippingTimes?.map((shippingTime) => (
                                <TableRow key={shippingTime.id}>
                                    <TableCell className="font-medium">{shippingTime.name}</TableCell>
                                    <TableCell>{shippingTime.duration}</TableCell>
                                    <TableCell>DH{shippingTime.cost.toFixed(2)}</TableCell>
                                    <TableCell>{shippingTime.createdAt ? format(shippingTime.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, shippingTime })}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteShippingTime(shippingTime.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
                        <DialogTitle>{dialogState.shippingTime?.id ? 'Edit Shipping Time' : 'Add New Shipping Time'}</DialogTitle>
                        <DialogDescription>
                            {dialogState.shippingTime?.id ? `Update the details for ${"\'\'\'"
                            + dialogState.shippingTime.name +
                            "\'\'\'"}.` : 'Enter the details for the new shipping time.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Input id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 5-7 business days" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost">Cost</Label>
                            <Input id="cost" type="number" value={cost} onChange={(e) => setCost(parseFloat(e.target.value) || 0)} placeholder="e.g., 5.00" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSaveShippingTime}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
    