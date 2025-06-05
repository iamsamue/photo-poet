
"use client";

import React, { useState, FormEvent } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Initialize router

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/'); // Redirect to homepage on successful login
    } catch (error: any) {
      console.error('Error signing in:', error.message);
      let friendlyMessage = 'An unexpected error occurred. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            friendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
            break;
          case 'auth/invalid-email':
            friendlyMessage = 'The email address is not valid. Please enter a valid email.';
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
    <div className="flex flex-col items-center justify-center">
      <form onSubmit={handleLogin} className="w-full space-y-6">
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </Label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full"
            autoComplete="email"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="password-login" className="block text-sm font-medium text-foreground">
            Password
          </Label>
          <Input
            type="password"
            id="password-login"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full"
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>
        {error && <p className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md border border-destructive/30">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </Button>
      </form>
    </div>
  );
};

export default Login;
