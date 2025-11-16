// app/components/AuthForm.tsx
'use client'; 

import React, { useState, useEffect } from 'react';

interface AuthFormProps {
  isRegister: boolean;
  loading: boolean;
  message: string;
  initialRole?: 'recruiter' | 'student'; 
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onSubmit: (data: { email?: string; password?: string; role?: string }) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ isRegister, onSubmit, loading, message, initialRole, onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'recruiter'>(initialRole || 'student'); 

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    onSubmit({ email, password, role });
  };

  return (
    // Centered container with soft background removed for parent control
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-3xl border border-gray-100/70 transition-all duration-300">
        
        {/* Title and Logo */}
        <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tighter mb-2">GetHired</h1>
            <h2 className="text-xl font-semibold text-gray-800">
              {isRegister ? `Register as a ${role}` : 'Welcome Back'}
            </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full p-3.5 border border-gray-300 rounded-xl shadow-sm focus:border-teal-500 focus:ring-teal-500 transition duration-150"
              placeholder="name@example.com"
            />
          </div>
          
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-3.5 border border-gray-300 rounded-xl shadow-sm focus:border-teal-500 focus:ring-teal-500 transition duration-150"
              placeholder="••••••••"
            />
          </div>
          
          {/* Role Select (Only for Register) */}
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'recruiter')}
                className="mt-1 block w-full p-3.5 border border-gray-300 rounded-xl shadow-sm focus:border-teal-500 focus:ring-teal-500 transition duration-150 bg-white"
              >
                <option value="student">Student</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </div>
          )}
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150 transform hover:scale-[1.01]"
          >
            {loading ? 'Processing...' : isRegister ? `Register as ${role.toUpperCase()}` : 'Log In Securely'}
          </button>
        </form>
        
        {/* Message Area (Centered and styled for clarity) */}
        {message && (
            <p className={`mt-5 text-center text-sm font-medium p-3 rounded-lg ${
                message.startsWith('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
                {message}
            </p>
        )}
        
        {/* Toggle Link */}
        <p className="mt-5 text-center text-sm text-gray-500">
          {isRegister ? 'Already have an account?' : 'Need an account?'}
          <button
            onClick={onToggle} 
            type="button" 
            className="font-medium text-teal-600 hover:text-teal-700 ml-2 transition duration-150 underline"
          >
            {isRegister ? 'Log in' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;