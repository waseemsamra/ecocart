'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { doc, setDoc, getDoc, serverTimestamp, runTransaction, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { useFirestore } from '@/firebase/provider';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const { signup } = useAuth();
  const db = useFirestore();

  const handleSignUp = async () => {
    if (!db) {
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Firebase is not configured. Please check your setup.',
      });
      return;
    }
    if (!name || !email || !password) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please fill out all fields.',
        });
        return;
    }

    try {
      // First, create the user in Firebase Auth
      const userCredential = await signup(email, password);
      const user = userCredential.user;

      if (user) {
        // Now, use a transaction to safely check for and create the first admin.
        await runTransaction(db, async (transaction) => {
          const adminSettingsRef = doc(db, 'settings', 'admin');
          const adminSettingsDoc = await transaction.get(adminSettingsRef);
          
          let isFirstUser = false;
          if (!adminSettingsDoc.exists()) {
            // No admin document exists, so this is the first user.
            isFirstUser = true;
            // Create the admin document to claim the spot.
            transaction.set(adminSettingsRef, { adminUid: user.uid, createdAt: serverTimestamp() });
          }
          
          // Create the user's document with the correct role.
          const userDocRef = doc(db, 'users', user.uid);
          const userData = {
            id: user.uid,
            email: user.email,
            firstName: name.split(' ')[0] || '',
            lastName: name.split(' ').slice(1).join(' ') || '',
            displayName: name || user.email,
            roles: isFirstUser ? ['admin', 'customer'] : ['customer'],
            createdAt: serverTimestamp(),
          };
          transaction.set(userDocRef, userData);
        });
      }

      toast({
        title: 'Account Created',
        description: "You've successfully signed up.",
      });
      router.push('/account');
    } catch (error: any) {
      let title = 'Uh oh! Something went wrong.';
      let description =
        error.message || 'There was a problem with your sign-up request.';
      
      if (error.code === 'auth/email-already-in-use') {
        title = 'Email Already In Use';
        description = 'An account with this email already exists. Please delete the user from the Firebase Authentication console and the `/settings/admin` document from Firestore, then try again.';
      } else if (error.code === 'permission-denied') {
          title = 'Permission Error During Signup';
          description = 'Could not set up your account due to a permissions issue. Please ensure your Firestore rules are deployed correctly, then delete the user from Firebase Auth and the `/settings/admin` document from Firestore, and try again.';
      }

      toast({
        variant: 'destructive',
        title: title,
        description: description,
        duration: 10000,
      });
      console.error('Failed to sign up:', error);
    }
  };

  return (
    <div className="container flex h-screen items-center justify-center py-24">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">
            Create an Account
          </CardTitle>
          <CardDescription>
            Join our community of sustainable shoppers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button onClick={handleSignUp} className="w-full">
            Create Account
          </Button>
          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
