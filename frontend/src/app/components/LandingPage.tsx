// app/components/LandingPage.tsx
'use client';

import React from 'react';

// Define the icon SVG components for clean design
const InternIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1H7v-2h2a1 1 0 001-1V4.414l.293.293a1 1 0 001.414-1.414z"/>
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
    </svg>
);
const RecruiterIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.586l1.293 1.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414L8 10.586V8H6zm.93-2.185A1 1 0 006 5v1h8V5a1 1 0 00-1.07-1.185l-.57.86a1 1 0 01-.84.455H8.44a1 1 0 01-.84-.455l-.57-.86z" clipRule="evenodd" />
    </svg>
);


interface LandingPageProps {
    onLoginSignup: (initialRole: 'recruiter' | 'student') => void;
    onLogin: () => void; // Passed from App.tsx
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginSignup, onLogin }) => {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-4">
            
            {/* Top Navigation Bar */}
            <header className="absolute top-0 left-0 w-full p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                    <div className="text-3xl font-extrabold text-indigo-600">GetHired</div>
                    <button
                        onClick={onLogin}
                        className="px-6 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition duration-150"
                    >
                        Login
                    </button>
                </div>
            </header>

            {/* Main Hero Content - Centered */}
            <div className="max-w-4xl w-full text-center mt-20">
                
                {/* Tagline */}
                <span className="inline-block px-4 py-1 text-sm font-semibold text-teal-600 bg-teal-100 rounded-full mb-4 shadow-md">
                    ML-Powered Career Recommender
                </span>

                {/* Primary Headline */}
                <h1 className="text-6xl md:text-7xl font-black leading-tight tracking-tight mb-4">
                    Get the <span className="text-indigo-600">Right Job.</span>
                </h1>
                
                {/* Secondary Text */}
                <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12">
                    A personalized platform guaranteeing the best talent for companies and the most relevant internships for students, powered by advanced skill-gap analysis.
                </p>

                {/* Role Selection CTAs */}
                <div className="flex flex-col sm:flex-row justify-center space-y-6 sm:space-y-0 sm:space-x-6">
                    
                    {/* Interns: Apply Button */}
                    <button
                        onClick={() => onLoginSignup('student')} 
                        className="flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-2xl shadow-teal-300/60 transition duration-300 transform hover:scale-105"
                    >
                        <InternIcon />
                        <span className="ml-3">Interns: Apply Now</span>
                    </button>

                    {/* Companies: Hire Button */}
                    <button
                        onClick={() => onLoginSignup('recruiter')} 
                        className="flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-300/60 transition duration-300 transform hover:scale-105"
                    >
                        <RecruiterIcon />
                        <span className="ml-3">Companies: Hire Talent</span>
                    </button>
                </div>
            </div>

            
        </div>
    );
};

export default LandingPage;