
"use client";

import React, { useState, FormEvent } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/'); // Redirect to homepage on successful signup
    } catch (error: any) {
      console.error('Sign-up error:', error.message);
      let friendlyMessage = 'An unexpected error occurred during sign-up. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            friendlyMessage = 'This email address is already registered. Please log in or use a different email.';
            break;
          case 'auth/invalid-email':
            friendlyMessage = 'The email address is not valid. Please enter a valid email.';
            break;
          case 'auth/weak-password':
            friendlyMessage = 'The password is too weak. It should be at least 6 characters long.';
            break;
          default:
            friendlyMessage = error.message || friendlyMessage;
        }
      } else if (error.message) {
        friendlyMessage = error.message;
      }
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="w-full space-y-6">
      <div>
        <Label htmlFor="email-signup" className="block text-sm font-medium text-foreground">Email</Label>
        <Input
          type="email"
          id="email-signup"
          className="mt-1 block w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="password-signup" className="block text-sm font-medium text-foreground">Password</Label>
        <Input
          type="password"
          id="password-signup"
          className="mt-1 block w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={isLoading}
        />
      </div>

      {error && <p className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md border border-destructive/30">{error}</p>}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing up...
            </>
          ) : (
            'Sign Up'
          )}
      </Button>
    </form>
  );
};

export default SignUp;
