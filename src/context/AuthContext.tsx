"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, Auth } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Assuming lib/firebase is correctly aliased

interface AuthContextType {
  user: User | null;
  auth: Auth;
  isAuthLoading: boolean;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { signInAnonymously } from 'firebase/auth';export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Attempt to sign in anonymously if no user is logged in
        signInAnonymously(auth).catch((error) => {
          console.error("Error signing in anonymously:", error);
          // Handle the error appropriately, maybe set a global error state
        });
        setUser(null); // Set user to null while attempting anonymous sign-in or if it fails
      }
    });
    setIsAuthLoading(false); // Authentication check is complete

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, auth, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};
