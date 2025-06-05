import React, { useState, FormEvent } from 'react';
import { auth } from '@/lib/firebase'; // Assuming firebase.ts is in lib
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError(null); // Clear previous errors
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in successfully:', userCredential.user);
    } catch (error: any) {
      console.error('Error signing in:', error.message);
      // TODO: Display error message to the user
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {error && <div className="text-red-500 mb-4">{error}</div>}
    <form onSubmit={handleLogin} className="space-y-4 p-6 border rounded-lg shadow-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email:
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          autoComplete="email"

        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          autoComplete="current-password"

        />
      </div>
      <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        Login
      </button>
    </form>
    </div>
  );
};

export default Login;