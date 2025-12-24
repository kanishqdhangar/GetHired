// app/page.tsx
'use client'; 

import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import NavBar from './components/NavBar';
import RecruiterDashboard from './components/RecruiterDashboard';
import StudentDashboard from './components/StudentDashboard';
import LandingPage from './components/LandingPage';
import { API_BASE_URL } from './utils/api';

const extractUserName = (email: string | null): string | null => {
  if (!email) return null;
  const parts = email.split('@');
  return parts[0] || null ;
}

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [initialRole, setInitialRole] = useState<'recruiter' | 'student' | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // --- Initialize from LocalStorage ---
  useEffect(() => {
    setToken(localStorage.getItem('token') || null);
    setUserRole(localStorage.getItem('role') || null);
    setUserName(localStorage.getItem('userName'))
    setIsClient(true);
  }, []);

  const saveAuth = (token: string, role: string, email: string) => {

    const username = extractUserName(email);
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('userName', username || '');
    setToken(token);
    setUserRole(role);
    setUserName(username);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    setToken(null);
    setUserRole(null);
    setUserName(null);
    setShowAuthForm(false);
    setIsRegister(false);
    setInitialRole(undefined);
  };

  interface AuthData {
    email?: string;
    password?: string;
    role?: string;
  }

  const handleAuthSubmit = async ({ email, password, role }: AuthData) => {
    if (!email || !password) return;
    setLoading(true);
    setMessage('');

    const endpoint = isRegister ? 'register' : 'token';
    let body: BodyInit;
    let contentType: string | undefined;

    if (isRegister) {
      body = JSON.stringify({ email, password, role });
      contentType = 'application/json';
    } else {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      body = formData;
      contentType = undefined;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: contentType ? { 'Content-Type': contentType } : undefined,
        body,
      });

      const data = await response.json();

      if (response.ok && isRegister) {
        setMessage('🎉 Registration successful! Please log in.');
        setIsRegister(false);
        setInitialRole(undefined);
      } else if (response.ok && !isRegister) {
        saveAuth(data.access_token as string, data.user_role as string, data.user_name as string);
        setMessage('✅ Login successful!');
      } else {
        setMessage(`❌ ${data.detail || 'Authentication failed.'}`);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      setMessage('⚠️ Network error during authentication.');
    }
    setLoading(false);
  };

  // --- Handlers for Landing Page ---

  const handleLandingPageAction = (role: 'recruiter' | 'student') => {
    setInitialRole(role);
    setIsRegister(true);
    setShowAuthForm(true); // Switches to AuthForm view
    setMessage('');
  };

  const handleLoginClick = () => {
    setIsRegister(false);
    setInitialRole(undefined);
    setShowAuthForm(true); // Switches to AuthForm view
    setMessage('');
  };

  const handleAuthToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Stop default form submission
    e.stopPropagation(); // Stop event propagation
    setIsRegister(!isRegister);
    setInitialRole(undefined); // Clear role preference when manually toggling
    setMessage('');
  };

  // --- Elegant Loading State ---
  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-gray-100 to-gray-300">
        <div className="p-10 text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-teal-500 animate-pulse">
          Loading <span className="text-gray-800">GetHired</span>...
        </div>
      </div>
    );
  }

  // --- Authentication View (Landing Page or Auth Form) ---
  if (!token) {
    if (showAuthForm) {
      return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-linear-to-br from-indigo-50 via-white to-teal-50 transition-all duration-500 p-4">
          
          <AuthForm
            isRegister={isRegister}
            onSubmit={handleAuthSubmit}
            onToggle={handleAuthToggle}
            loading={loading}
            message={message}
            initialRole={initialRole}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-100 via-white to-teal-100">
        <LandingPage
          onLoginSignup={handleLandingPageAction}
          onLogin={handleLoginClick}
        />
      </div>
    );
  }

  // --- Dashboard View ---
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-white via-gray-50 to-gray-200">
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg shadow-xl">
        <NavBar userRole={userRole} logout={logout} />
      </div>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
        
        <div key={userRole} className="w-full">
          {userRole === 'student' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 transition-all duration-500">
              <StudentDashboard token={token} userName={userName}/>
            </div>
          )}

          {userRole === 'recruiter' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 transition-all duration-500">
              <RecruiterDashboard token={token} userName={userName} />
            </div>
          )}

          {(!userRole || userRole === 'admin') && (
            <div className="mt-10 text-center text-red-600 font-semibold text-lg p-8 bg-white rounded-xl shadow">
              ⚠️ Invalid User Role. Please refresh or logout.
            </div>
          )}
        </div>
      </main>

      <footer className="text-center text-gray-500 text-sm py-4 border-t border-gray-200 bg-white/70">
        © {new Date().getFullYear()} GetHired • Empowering Careers 🌍
      </footer>
    </div>
  );
};

export default App;