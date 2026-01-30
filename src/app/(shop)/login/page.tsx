'use client';
import { useState, useEffect } from 'react';
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
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, login, resetPassword } = useAuth();

  useEffect(() => {
    // Redirect if user is already logged in
    if (!loading && user) {
      router.push('/account');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please enter both your email and password.',
      });
      return;
    }
    try {
      await login(email, password);
      // Redirection is now handled by the useEffect hook
    } catch (error: any) {
      let title = 'Login Failed';
      let description =
        'There was a problem with your request. Please try again.';

      if (error.code === 'auth/invalid-credential') {
        description =
          'Invalid credentials. Please check your email and password.';
      } else if (error.message && (error.message.includes('identity-toolkit') || error.code === 'auth/operation-not-allowed')) {
          title = 'Action Required: Enable Authentication API';
          const projectNumberMatch = error.message.match(/project-(\d+)/);
          if (projectNumberMatch && projectNumberMatch[1]) {
            const projectNumber = projectNumberMatch[1];
            const enableApiUrl = `https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/enable?project=${projectNumber}`;
            description = `The authentication service isn't enabled for your Firebase project. Please click the link to enable it, wait a few minutes, and then try again: ${enableApiUrl}`;
          } else {
            description = "The Firebase Authentication service (Identity Toolkit API) is not enabled for your project. Please enable it in your Google Cloud console and try again.";
          }
      } else if (error.message) {
        description = error.message;
      }

      toast({
        variant: 'destructive',
        title: title,
        description: description,
        duration: 20000,
      });
      console.error('Failed to sign in:', error);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
      });
      return;
    }
    try {
      await resetPassword(resetEmail);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox for instructions to reset your password.',
      });
      setShowResetDialog(false);
      setResetEmail('');
    } catch (error: any) {
      let title = 'Error';
      let description = error.message || 'Failed to send password reset email.';
       if (error.message && (error.message.includes('identity-toolkit') || error.code === 'auth/operation-not-allowed')) {
          title = 'Action Required: Enable Authentication API';
          const projectNumberMatch = error.message.match(/project-(\d+)/);
          if (projectNumberMatch && projectNumberMatch[1]) {
            const projectNumber = projectNumberMatch[1];
            const enableApiUrl = `https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/enable?project=${projectNumber}`;
            description = `The authentication service isn't enabled for your Firebase project. Please click the link to enable it, wait a few minutes, and then try again: ${enableApiUrl}`;
          } else {
            description = "The Firebase Authentication service (Identity Toolkit API) is not enabled for your project. Please enable it in your Google Cloud console and try again.";
          }
      }
      toast({
        variant: 'destructive',
        title: title,
        description: description,
        duration: 20000,
      });
    }
  };

  return (
    <div className="container flex items-center justify-center py-24">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Button
                variant="link"
                type="button"
                onClick={() => setShowResetDialog(true)}
                className="ml-auto inline-block h-auto p-0 text-sm underline"
              >
                Forgot your password?
              </Button>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button onClick={handleSignIn} className="w-full">
            Sign in
          </Button>
          <div className="text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordReset}>Send Reset Link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
