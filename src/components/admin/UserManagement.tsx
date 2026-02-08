'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, doc, deleteDoc, updateDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { User } from '@/lib/types';
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
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2, PlusCircle, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { Input } from '@/components/ui/input';

export default function UserManagement() {
    const { toast } = useToast();
    const db = useFirestore();
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { loading: authLoading } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    
    const usersQuery = useMemo(() => {
        if (!db) return null;
        const q = query(collection(db, 'users'));
        (q as any).__memo = true;
        return q;
    }, [db]);

    const { data: users, isLoading: isLoadingData, error } = useCollection<User>(usersQuery);
    const isLoading = authLoading || isLoadingData;

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        if (!searchTerm) return users;
        return users.filter(user => 
            (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);
    
    const getPrimaryRole = (roles: User['roles'] | undefined) => {
        if (!roles) return 'customer';
        return roles.includes('admin') ? 'admin' : roles[0] || 'customer';
    };

    const handleDeleteSelected = async () => {
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }
        try {
            const batch = writeBatch(db);
            selectedUserIds.forEach(id => {
                 batch.delete(doc(db, 'users', id));
            });
            await batch.commit();
            toast({
                title: `${selectedUserIds.length} user(s) deleted.`,
                description: 'The selected users have been removed.',
            });
            setSelectedUserIds([]);
        } catch(e: any) {
             toast({
                variant: 'destructive',
                title: 'Error Deleting Users',
                description: e.message || 'There was a problem deleting users.',
            });
        } finally {
            setShowDeleteConfirm(false);
        }
    };
    
    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            setSelectedUserIds(filteredUsers?.map(p => p.id) || []);
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleSelectUser = (userId: string, checked: boolean) => {
        if (checked) {
            setSelectedUserIds((prev) => [...prev, userId]);
        } else {
            setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
        }
    };

    const allSelected = (filteredUsers?.length ?? 0) > 0 && selectedUserIds.length === filteredUsers?.length;
    const someSelected = selectedUserIds.length > 0 && selectedUserIds.length < (filteredUsers?.length ?? 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="font-headline text-3xl font-bold">Users</h1>
                    <p className="text-muted-foreground">Manage your store's users and their roles.</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedUserIds.length > 0 && (
                        <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedUserIds.length})
                        </Button>
                    )}
                </div>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>All Users</CardTitle>
                            <CardDescription>A list of all users in your store.</CardDescription>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search users..."
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
                                        disabled={isLoading || !filteredUsers || filteredUsers.length === 0}
                                    />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>}
                            {!isLoading && error && <TableRow><TableCell colSpan={6} className="h-24 text-center text-red-500">{error.message}</TableCell></TableRow>}
                            {!isLoading && filteredUsers?.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">No users found.</TableCell></TableRow>}
                            {!isLoading && filteredUsers?.map((user) => (
                                <TableRow key={user.id} data-state={selectedUserIds.includes(user.id) && 'selected'}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedUserIds.includes(user.id)}
                                            onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                                            aria-label={`Select user ${user.displayName}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{user.displayName || `${user.firstName} ${user.lastName}`}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{getPrimaryRole(user.roles)}</TableCell>
                                    <TableCell>{user.createdAt ? format(user.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Edit className="mr-2 h-4 w-4" /><span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setSelectedUserIds([user.id]); setShowDeleteConfirm(true); }} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the selected user accounts.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
