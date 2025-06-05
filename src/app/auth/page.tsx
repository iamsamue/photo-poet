"use client";

import { useState } from 'react';
import Login from '@/components/auth/Login';
import SignUp from '@/components/auth/SignUp';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 flex justify-center">
          <button
            className={`mx-2 px-4 py-2 text-sm font-medium ${
              isLogin
                ? 'rounded-md bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`mx-2 px-4 py-2 text-sm font-medium ${
              !isLogin
                ? 'rounded-md bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>
        {isLogin ? <Login /> : <SignUp />}
      </div>
    </div>
  );
};

export default AuthPage;