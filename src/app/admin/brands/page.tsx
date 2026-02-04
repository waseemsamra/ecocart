'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, writeBatch } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Brand } from '@/lib/types';
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
import { MoreHorizontal, Edit, Trash2, PlusCircle, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { slugify } from '@/lib/utils';

const initialBrandData = `AIK Atelier
Addee
Alif Yay
Artistic Wear
AJR Couture - Abbas Jamil Rajpoot
Afrozeh
Alizeh Fashion by Bilal Embroidery
Asifa & Nabeel
AR Apparel
Ahlam by Safa Textile
All collections
Asim Jofa
AWA Scrunchies
Ahmad Raza
Amal
Atiya Irfan Studio
AY Textile
Aisha Fatema
Ameerah Usman
Avyana
Aabyaan
Aizaz Zafar
Anayra Amal
Awwal
Aahang
Akbar Aslam
Annafeu Apparels
Ayesha Closet
Aalaya
Al Dawood Textile
Annara Begum
Ayla Studio
Aayra
Al Harir Apparel
Annus Abrar
Ayzel By Afrozeh
Abaan Zohan
Al Karam
Ansab Jahangir
Azure
Abaya pk
Al Siyaab
Apricocia
Azzal By Ayesha & Usman
Adaa By Mahnoor
Al Zohaib
Aqs n Man
Adam's Couture
Aleen
Arif Ashraf
Khadi`;

export default function BrandsPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [dialogState, setDialogState] = useState<{open: boolean; brand?: Partial<Brand>}>({ open: false, brand: undefined });
    
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const { loading: authLoading } = useAuth();
    
    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
    const [bulkAddText, setBulkAddText] = useState(initialBrandData);
    const [isBulkAdding, setIsBulkAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const brandsQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'brands'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: brands, isLoading: isLoadingData, error } = useCollection<Brand>(brandsQuery);
    const isLoading = authLoading || isLoadingData;
    
    const filteredBrands = useMemo(() => {
        if (!brands) return [];
        if (!searchTerm) return brands;
        return brands.filter(brand => 
            brand.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [brands, searchTerm]);

    useEffect(() => {
        if (dialogState.open && dialogState.brand) {
            setName(dialogState.brand.name || '');
            setSlug(dialogState.brand.slug || '');
            setDescription(dialogState.brand.description || '');
        }
    }, [dialogState.open, dialogState.brand]);
    
    useEffect(() => {
        if (dialogState.open) {
          setSlug(slugify(name));
        }
    }, [name, dialogState.open]);

    const handleSaveBrand = async () => {
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

        const data = { name, slug, description };

        try {
            if (dialogState.brand?.id) {
                await updateDoc(doc(db, 'brands', dialogState.brand.id), data);
                toast({ title: 'Success', description: 'Brand updated.' });
            } else {
                await addDoc(collection(db, 'brands'), {
                    ...data,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'New Brand added.' });
            }
            setDialogState({ open: false, brand: undefined });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };
    
    const handleBulkAdd = async () => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        if (!bulkAddText.trim()) {
            toast({ variant: 'destructive', title: 'Input Empty', description: 'Please enter brand names to add.' });
            return;
        }

        setIsBulkAdding(true);
        try {
            const brandNames = bulkAddText.split('\n').map(name => name.trim()).filter(Boolean);
            const batch = writeBatch(db);
            const brandsCollection = collection(db, 'brands');
            
            brandNames.forEach(name => {
                const newBrandRef = doc(brandsCollection);
                const slug = slugify(name);
                batch.set(newBrandRef, {
                    name,
                    slug,
                    description: '',
                    createdAt: serverTimestamp(),
                });
            });

            await batch.commit();
            toast({
                title: 'Success!',
                description: `${brandNames.length} brands have been added successfully.`,
            });
            setIsBulkAddOpen(false);
            setBulkAddText('');

        } catch (e: any) {
            console.error('Bulk add error:', e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsBulkAdding(false);
        }
    };


    const handleDeleteBrand = async (id: string) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            await deleteDoc(doc(db, 'brands', id));
            toast({ title: 'Success', description: 'Brand deleted.' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setDialogState({ open: false, brand: undefined });
        } else {
            setDialogState(prev => ({ ...prev, open }));
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Brand/Designer Options</h1>
                    <p className="text-muted-foreground">Manage brands and designers for your store.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsBulkAddOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Bulk Add
                    </Button>
                    <Button onClick={() => setDialogState({ open: true, brand: {} })}>
                        <PlusCircle className="mr-2 h-4 w-4" />Add Brand/Designer
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>All Brands/Designers</CardTitle>
                            <CardDescription>A list of all available brands and designers.</CardDescription>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search brands..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
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
                            {!isLoading && filteredBrands?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No brands found.</TableCell>
                                </TableRow>
                            )}
                            {!isLoading && filteredBrands?.map((brand) => (
                                <TableRow key={brand.id}>
                                    <TableCell className="font-medium">{brand.name}</TableCell>
                                    <TableCell>{brand.description}</TableCell>
                                    <TableCell>{brand.createdAt ? format(brand.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => setDialogState({ open: true, brand })}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteBrand(brand.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
                        <DialogTitle>{dialogState.brand?.id ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
                        <DialogDescription>
                            {dialogState.brand?.id ? `Update the details for ${"\'\'\'"
                            + dialogState.brand.name +
                            "\'\'\'"}.` : 'Enter the details for the new brand.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Awesome Designers" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input id="slug" value={slug} placeholder="e.g., awesome-designers" readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., A collective of awesome designers." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSaveBrand}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Bulk Add Brands</DialogTitle>
                        <DialogDescription>
                            Paste a list of brand names, one per line.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="bulk-add-textarea" className="sr-only">Brand Names</Label>
                        <Textarea
                            id="bulk-add-textarea"
                            value={bulkAddText}
                            onChange={(e) => setBulkAddText(e.target.value)}
                            placeholder={"Brand One\nBrand Two\nBrand Three"}
                            rows={15}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkAddOpen(false)} disabled={isBulkAdding}>Cancel</Button>
                        <Button onClick={handleBulkAdd} disabled={isBulkAdding}>
                            {isBulkAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isBulkAdding ? 'Adding...' : 'Add Brands'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    
