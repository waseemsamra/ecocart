'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, doc, deleteDoc, query, addDoc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { MoreHorizontal, Edit, Trash2, PlusCircle, Loader2, Search, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function AdminProductsPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { loading: authLoading } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
    const [bulkAddText, setBulkAddText] = useState('');
    const [isBulkAdding, setIsBulkAdding] = useState(false);
    
    const productsQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'products'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: products, isLoading: isLoadingData, error } = useCollection<Product>(productsQuery);
    const isLoading = authLoading || isLoadingData;

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        if (!searchTerm) return products;
        return products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const handleCloneProduct = async (productToClone: Product) => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            const { id, createdAt, updatedAt, ...clonedData } = productToClone;
            const newProductData = {
                ...clonedData,
                name: `${clonedData.name} (Copy)`,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            await addDoc(collection(db, 'products'), newProductData);
            toast({ title: 'Success', description: `"${productToClone.name}" has been cloned.` });
        } catch (e: any) {
            console.error('Error cloning product:', e);
            toast({ variant: 'destructive', title: 'Clone Error', description: e.message });
        }
    };

    const handleDeleteSelected = async () => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            const deletePromises = selectedProductIds.map(id => deleteDoc(doc(db, 'products', id)));
            await Promise.all(deletePromises);
            toast({
                title: `${selectedProductIds.length} product(s) deleted.`,
                description: 'The selected products have been removed from the database.',
            });
            setSelectedProductIds([]);
        } catch(e: any) {
             toast({
                variant: 'destructive',
                title: 'Error Deleting Products',
                description: e.message || 'There was a problem deleting the products.',
            });
        } finally {
            setShowDeleteConfirm(false);
        }
    };
    
    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            setSelectedProductIds(filteredProducts?.map(p => p.id) || []);
        } else {
            setSelectedProductIds([]);
        }
    };

    const handleSelectProduct = (productId: string, checked: boolean) => {
        if (checked) {
            setSelectedProductIds((prev) => [...prev, productId]);
        } else {
            setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
        }
    };

    const allSelected = (filteredProducts?.length ?? 0) > 0 && selectedProductIds.length === filteredProducts?.length;
    const someSelected = selectedProductIds.length > 0 && selectedProductIds.length < (filteredProducts?.length ?? 0);

    const handleBulkAdd = async () => {
      if (!db) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
        return;
      }
      if (!bulkAddText.trim()) {
        toast({ variant: 'destructive', title: 'Input Empty', description: 'Please paste some product data.' });
        return;
      }

      setIsBulkAdding(true);

      try {
        const categoriesCollection = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        const categoryMap = new Map(categoriesSnapshot.docs.map(doc => [(doc.data().name || '').trim().toLowerCase(), doc.id]));
        
        const lines = bulkAddText.trim().split('\n');
        const batch = writeBatch(db);
        const productsCollection = collection(db, 'products');
        let productsAddedCount = 0;
        const errors: string[] = [];

        lines.forEach((line, index) => {
            const parts = line.split(',');
            if (parts.length < 2) {
                errors.push(`Line ${index + 1}: Invalid format. Expected Name,CategoryName.`);
                return;
            }

            const categoryName = (parts.pop() || '').trim();
            const name = parts.join(',').trim();

            if (!name || !categoryName) {
                errors.push(`Line ${index + 1}: Name and Category Name cannot be empty.`);
                return;
            }
            
            const categoryId = categoryMap.get(categoryName.toLowerCase());

            if (!categoryId) {
                errors.push(`Line ${index + 1}: Category "${categoryName}" not found.`);
                return;
            }

            const newProductRef = doc(productsCollection);
            batch.set(newProductRef, {
            name,
            price: 0,
            description: '',
            categoryIds: [categoryId],
            images: [],
            materials: [],
            certifications: [],
            sustainabilityImpact: '',
            sizeIds: [],
            colourIds: [],
            printOptionIds: [],
            wallTypeIds: [],
            thicknessIds: [],
            materialTypeIds: [],
            finishTypeIds: [],
            adhesiveIds: [],
            handleIds: [],
            shapeIds: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            });
            productsAddedCount++;
        });

        if (errors.length > 0) {
            toast({
            variant: 'destructive',
            title: `Found ${errors.length} error(s)`,
            description: <div className="max-h-48 overflow-y-auto"><pre className="whitespace-pre-wrap">{errors.join('\n')}</pre></div>,
            duration: 10000,
            });
            setIsBulkAdding(false);
            return;
        }

        if (productsAddedCount === 0) {
            toast({
            variant: 'destructive',
            title: 'No Products to Add',
            description: 'Could not find any valid products in the provided text.',
            });
            setIsBulkAdding(false);
            return;
        }

        await batch.commit();
        toast({
            title: 'Success!',
            description: `${productsAddedCount} products have been added successfully.`,
        });
        setIsBulkAddOpen(false);
        setBulkAddText('');
      } catch (e: any) {
        console.error("Bulk add error: ", e);
        toast({
          variant: 'destructive',
          title: 'Error Saving Products',
          description: e.message || 'An unexpected error occurred while saving to the database.',
        });
      } finally {
        setIsBulkAdding(false);
      }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="font-headline text-3xl font-bold">Products</h1>
                    <p className="text-muted-foreground">Manage your store's products.</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedProductIds.length > 0 ? (
                        <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedProductIds.length})
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setIsBulkAddOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Bulk Add
                            </Button>
                            <Button asChild>
                                <Link href="/admin/products/new">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>All Products</CardTitle>
                            <CardDescription>A list of all products in your store.</CardDescription>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search products..."
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
                                <TableHead className="w-12">
                                     <Checkbox
                                        onCheckedChange={handleSelectAll}
                                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                        disabled={isLoading || !filteredProducts || filteredProducts.length === 0}
                                    />
                                </TableHead>
                                <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>}
                            {!isLoading && error && <TableRow><TableCell colSpan={6} className="h-24 text-center text-red-500">{error.message}</TableCell></TableRow>}
                            {!isLoading && filteredProducts?.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">No products found.</TableCell></TableRow>}
                            {!isLoading && filteredProducts?.map((product) => (
                                <TableRow key={product.id} data-state={selectedProductIds.includes(product.id) && 'selected'}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedProductIds.includes(product.id)}
                                            onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                                            aria-label={`Select product ${product.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Image
                                            alt={product.name}
                                            className="aspect-square rounded-md object-cover"
                                            height="64"
                                            src={product.images?.[0]?.imageUrl || 'https://placehold.co/64x64'}
                                            width="64"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>${product.price.toFixed(2)}</TableCell>
                                    <TableCell>{product.createdAt ? format(product.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/products/${product.id}/edit`}>
                                                        <Edit className="mr-2 h-4 w-4" /><span>Edit</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleCloneProduct(product)}>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    <span>Clone</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setSelectedProductIds([product.id]); setShowDeleteConfirm(true); }} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                    <Trash2 className="mr-2 h-4 w-4" /><span>Delete</span>
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
            
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the selected products from the database.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Bulk Add Products</DialogTitle>
                        <DialogDescription>
                            Paste a comma-separated list of products. Each product should be on a new line in the format: Name,CategoryName
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="bulk-add-textarea" className="sr-only">Product Data</Label>
                        <Textarea
                            id="bulk-add-textarea"
                            value={bulkAddText}
                            onChange={(e) => setBulkAddText(e.target.value)}
                            placeholder={"Eco-Friendly Water Bottle,Paper Products\nOrganic Cotton T-Shirt,Apparel"}
                            rows={10}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkAddOpen(false)} disabled={isBulkAdding}>Cancel</Button>
                        <Button onClick={handleBulkAdd} disabled={isBulkAdding}>
                            {isBulkAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isBulkAdding ? 'Adding...' : 'Add Products'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
