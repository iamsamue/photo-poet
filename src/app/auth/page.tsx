
"use client";

import { useState } from 'react';
import Login from '@/components/auth/Login';
import SignUp from '@/components/auth/SignUp';
import { Button } from '@/components/ui/button';
import { BookUser } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-2">
            <BookUser className="h-12 w-12 text-primary" />
            <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary">Photo Poet</h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground mt-1">
            {isLogin ? "Welcome back! Sign in to continue." : "Join us! Create an account to start."}
          </p>
        </div>
      <div className="w-full max-w-md rounded-xl bg-card p-8 shadow-xl border border-border">
        <div className="mb-6 flex justify-center border-b border-border pb-4">
          <Button
            variant={isLogin ? "default" : "ghost"}
            className={`flex-1 mx-1 text-sm font-medium ${isLogin ? 'shadow-md' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </Button>
          <Button
            variant={!isLogin ? "default" : "ghost"}
            className={`flex-1 mx-1 text-sm font-medium ${!isLogin ? 'shadow-md' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </Button>
        </div>
        {isLogin ? <Login /> : <SignUp />}
      </div>
    </div>
  );
};

export default AuthPage;
