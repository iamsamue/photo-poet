import React, { useState, FormEvent } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created:', userCredential.user);
      // Optionally redirect the user or show a success message
    } catch (error: any) {
      console.error('Sign-up error:', error.message); // For developer logs
      let friendlyMessage = 'An unexpected error occurred during sign-up. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            friendlyMessage = 'This email address is already registered. If you have an account, please log in. Otherwise, try a different email.';
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
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4 p-4 border rounded shadow">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
        <input
          type="email"
          id="email"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password:</label>
        <input
          type="password"
          id="password"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >Sign Up</button>
    </form>
  );
};

export default SignUp;
