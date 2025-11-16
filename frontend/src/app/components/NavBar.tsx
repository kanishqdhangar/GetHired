// app/components/Navbar.tsx
'use client'; 

import React from 'react';

interface NavBarProps {
    userRole: string | null;
    logout: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ userRole, logout }) => (
  // Use slightly thicker shadow and fixed width
  <header className="bg-white/95 backdrop-blur-sm shadow-xl sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      
      {/* App Logo/Name */}
      <div className="flex items-center">
        <div className="text-3xl font-extrabold text-indigo-600 tracking-tight">
          GetHired
        </div>
        {/* Subtle separator */}
        <span className="ml-4 pl-4 border-l border-gray-300 text-base font-medium text-gray-500 hidden sm:inline">Dashboard</span>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Role Display */}
        <span className="text-md font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
          <span className="text-gray-500">Role:</span> <span className="capitalize font-semibold text-indigo-700">{userRole}</span>
        </span>
        
        {/* Logout Button (Clean, high-contrast design) */}
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition duration-150 shadow-md"
        >
          Logout
        </button>
      </div>
    </div>
  </header>
);

export default NavBar;