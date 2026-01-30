'use client';

import { useState, useMemo } from 'react';
import { collection, doc, updateDoc, query, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase/provider';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function GrantAdminPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const { user: currentUser, loading: authLoading } = useAuth();
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
        return users.filter(user => 
            (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);
    
    const handleRoleChange = async (user: User, isAdmin: boolean) => {
        if (!db || !currentUser || user.id === currentUser.uid) {
            toast({
                variant: 'destructive',
                title: 'Action Forbidden',
                description: 'You cannot change your own role.',
            });
            return;
        }

        const userDocRef = doc(db, 'users', user.id);
        try {
            if (isAdmin) {
                await updateDoc(userDocRef, {
                    roles: arrayUnion('admin')
                });
                toast({ title: 'Success', description: `${user.displayName || user.email} is now an admin.` });
            } else {
                await updateDoc(userDocRef, {
                    roles: arrayRemove('admin')
                });
                toast({ title: 'Success', description: `${user.displayName || user.email} is no longer an admin.` });
            }
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: 'Error updating role',
                description: e.message,
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="font-headline text-3xl font-bold">Grant Admin Access</h1>
                    <p className="text-muted-foreground">Toggle admin permissions for users.</p>
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
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Admin</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>}
                            {!isLoading && error && <TableRow><TableCell colSpan={3} className="h-24 text-center text-red-500">{error.message}</TableCell></TableRow>}
                            {!isLoading && filteredUsers?.length === 0 && <TableRow><TableCell colSpan={3} className="h-24 text-center">No users found.</TableCell></TableRow>}
                            {!isLoading && filteredUsers?.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.displayName || `${user.firstName} ${user.lastName}`}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                        <Label htmlFor={`admin-switch-${user.id}`} className="sr-only">
                                            Admin
                                        </Label>
                                        <Switch
                                            id={`admin-switch-${user.id}`}
                                            checked={user.roles?.includes('admin')}
                                            onCheckedChange={(checked) => handleRoleChange(user, checked)}
                                            disabled={user.id === currentUser?.uid}
                                        />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
