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
      console.error('Sign-up error:', error.message);
      setError(error.message); // Set the error message to display
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
        />
      </div>
      <div> {/* Added wrapping div for password input and label */}
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >Sign Up</button>
    </form>
  );
};

export default SignUp;