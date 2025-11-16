// app/components/JobEditModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { getAuthHeaders, API_BASE_URL } from '../utils/api';

// --- Types ---
interface Job {
    id: number;
    title: string;
    description: string;
    required_skills: string[];
    recruiter_id: number;
    date_posted: string;
}
interface JobEditModalProps {
    token: string;
    jobId: number;
    onClose: (updated?: boolean) => void;
}

const JobEditModal: React.FC<JobEditModalProps> = ({ token, jobId, onClose }) => {
    // --- Form State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skills, setSkills] = useState('');
    
    // --- UI/API State ---
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [initialLoad, setInitialLoad] = useState(true);
    const [jobLoadError, setJobLoadError] = useState(''); // Separate state for fetch failure

    // --- 1. Fetch and Pre-fill initial job data ---
    useEffect(() => {
        const fetchJobData = async () => {
            setInitialLoad(true);
            setJobLoadError('');
            try {
                // Fetch ALL jobs posted by the recruiter 
                const response = await fetch(`${API_BASE_URL}/recruiter/jobs`, {
                    headers: getAuthHeaders(token),
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch jobs (Status: ${response.status})`);
                }
                
                const allJobs = await response.json() as Job[];

                // Filter to find the specific job being edited
                const jobToEdit = allJobs.find(job => job.id === jobId);

                if (jobToEdit) {
                    // Pre-fill form fields with existing data
                    setTitle(jobToEdit.title);
                    setDescription(jobToEdit.description);
                    setSkills(jobToEdit.required_skills.join(', '));
                } else {
                    setJobLoadError(`Error: Job ID ${jobId} not found among your posted jobs.`);
                }
            } catch (error) {
                console.error("Job Data Fetch Error:", error);
                setJobLoadError(`Failed to load job details. Error: ${error instanceof Error ? error.message : 'Unknown'}`);
            } finally {
                setInitialLoad(false); 
            }
        };
        fetchJobData();
    }, [jobId, token]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        
        const jobData = {
            title,
            description,
            required_skills: skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
        };

        try {
            // Hits the PUT /recruiter/jobs/{job_id} endpoint
            const response = await fetch(`${API_BASE_URL}/recruiter/jobs/${jobId}`, {
                method: 'PUT',
                headers: getAuthHeaders(token),
                body: JSON.stringify(jobData),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(`✅ Job "${data.title}" updated successfully!`);
                setTimeout(() => onClose(true), 1500); // Close and refresh parent
            } else {
                setMessage(`❌ Error: ${data.detail || 'Failed to update job.'}`);
            }
        } catch (error) {
            setMessage('⚠️ Network error updating job.');
            console.error('Network error:', error);
        }
        setLoading(false);
    };

    // --- Loading View ---
    if (initialLoad) {
        return (
            // FIX: Soft gray backdrop with blur
            <div className="fixed inset-0 bg-gray-200 bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-xl shadow-2xl border border-indigo-200">
                    <p className="text-center text-lg font-semibold text-indigo-600 animate-pulse">Loading job details...</p>
                </div>
            </div>
        );
    }

    // --- Error View (If initial fetch failed) ---
    if (jobLoadError) {
        return (
             <div className="fixed inset-0 bg-gray-200 bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-lg p-8 rounded-xl shadow-2xl relative border border-red-300">
                    <p className="text-center text-red-600 font-semibold text-xl mb-4">
                        ❌ Failed to load job for editing.
                    </p>
                    <p className="text-sm text-gray-600 mb-6">{jobLoadError}</p>
                    <button 
                        onClick={() => onClose()}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }
    
    // --- Main Edit Form View ---
    return (
        // FIX: Soft gray backdrop with blur
        <div className="fixed inset-0 bg-gray-200 bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white w-full max-w-3xl p-8 rounded-2xl shadow-3xl relative border border-gray-100">
                
                {/* Close Button */}
                <button 
                    onClick={() => onClose()}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h3 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-6">Editing Job Post ID: <span className="text-indigo-600">{jobId}</span></h3>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Job Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            // CLEAN INPUT STYLING
                            className="mt-1 block w-full p-3.5 border border-gray-300 rounded-xl shadow-sm focus:ring-teal-500 focus:border-teal-500 transition"
                            placeholder="e.g., Senior Data Scientist Intern"
                        />
                    </div>
                    {/* Description Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Description</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            // CLEAN TEXTAREA STYLING
                            className="mt-1 block w-full p-3.5 border border-gray-300 rounded-xl shadow-sm focus:ring-teal-500 focus:border-teal-500 transition"
                            placeholder="Update the responsibilities and requirements..."
                        />
                    </div>
                    {/* Skills Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Required Skills (Comma Separated)</label>
                        <input
                            type="text"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            // CLEAN INPUT STYLING
                            className="mt-1 block w-full p-3.5 border border-gray-300 rounded-xl shadow-sm focus:ring-teal-500 focus:border-teal-500 transition"
                            placeholder="Python, SQL, AWS, ML"
                        />
                    </div>
                    
                    {/* Submit Button & Cancel */}
                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="px-6 py-3 border border-gray-300 rounded-xl shadow-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition duration-150 transform hover:scale-[1.01]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 rounded-xl shadow-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition duration-150 transform hover:scale-[1.01]"
                        >
                            {loading ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
                {message && (
                    <p className={`mt-4 text-center text-sm font-medium p-3 rounded-lg ${
                        message.startsWith('❌') || message.startsWith('⚠️') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

export default JobEditModal;