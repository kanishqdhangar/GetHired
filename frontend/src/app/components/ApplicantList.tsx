// app/components/ApplicantList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders, API_BASE_URL } from '../utils/api';

// --- Types ---
interface Applicant {
    id: number;
    student_id: number;
    job_id: number;
    status: string;
    applied_date: string;
    student_email: string;
}
interface ApplicantListProps {
    token: string;
    jobId: number;
    jobTitle: string;
    onBack: () => void;
}

const ApplicantList: React.FC<ApplicantListProps> = ({ token, jobId, jobTitle, onBack }) => {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);

    const ALLOWED_STATUSES = ["Applied", "Interview", "Accepted", "Rejected"];

    const fetchApplicants = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/recruiter/jobs/${jobId}/applicants`, {
                headers: getAuthHeaders(token),
            });
            const data = await response.json();

            if (response.ok) {
                setApplicants(data as Applicant[]);
            } else {
                alert(`Error loading applicants: ${data.detail}`);
            }
        } catch (error) {
            console.error('Network error fetching applicants:', error);
            alert('Network error fetching applicants.');
        }
        setLoading(false);
    }, [token, jobId]);

    useEffect(() => {
        fetchApplicants();
    }, [fetchApplicants]);

    // --- Handlers ---
    const handleDownload = async (appId: number) => {
        setLoading(true); 
        
        try {
            // Use fetch to send the Authorization header, then trigger download via Blob
            const response = await fetch(`${API_BASE_URL}/recruiter/resume/${appId}`, {
                method: 'GET',
                headers: { 
                    Authorization: `Bearer ${token}`, 
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Error downloading resume: ${errorData.detail || response.statusText}`);
                setLoading(false);
                return;
            }

            // 1. Get the blob data and determine the filename
            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `resume_app_${appId}.pdf`; 
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+?)"/);
                if (match && match[1]) {
                    filename = match[1];
                }
            }
            
            // 2. Create a temporary Blob URL and trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url); // Clean up the temporary URL

        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to securely download resume.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (appId: number, newStatus: string) => {
        if (!window.confirm(`Change status of Application #${appId} to "${newStatus}"?`)) return;

        try {
            // Hits the secure PUT /applications/{app_id}/status endpoint
            const response = await fetch(`${API_BASE_URL}/recruiter/applications/${appId}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(token),
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                // Update local state immediately upon success
                setApplicants(prev => prev.map(app => 
                    app.id === appId ? { ...app, status: newStatus } : app
                ));
                alert(`Status updated to "${newStatus}"`);
            } else {
                const errorData = await response.json();
                alert(`Status update failed: ${errorData.detail}`);
            }
        } catch (error) {
            alert('Network error during status update.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Accepted': return 'bg-green-600 border-green-700 text-white';
            case 'Interview': return 'bg-blue-600 border-blue-700 text-white';
            case 'Rejected': return 'bg-red-600 border-red-700 text-white';
            default: return 'bg-yellow-500 border-yellow-600 text-gray-900'; // Applied/Pending
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-3xl border border-gray-100">
            {/* Header and Back Button */}
            <div className="mb-6 flex justify-between items-center border-b pb-4">
                <h3 className="text-2xl font-bold text-gray-800">
                    Applicants for: <span className="text-indigo-600">{jobTitle}</span>
                </h3>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 flex items-center text-sm font-medium transition"
                >
                    &larr; Back to Job List
                </button>
            </div>

            {loading && <p className="text-center py-10 text-xl text-indigo-600 font-semibold">Loading applicant data...</p>}
            
            {!loading && applicants.length === 0 && (
                <p className="text-center py-10 text-xl text-gray-500">No students have applied to this job yet.</p>
            )}

            {/* Applicant List */}
            <div className="space-y-4">
                {applicants.map(applicant => (
                    <div 
                        key={applicant.id} 
                        className="p-5 border border-gray-200 rounded-xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white hover:bg-gray-50 transition duration-150"
                    >
                        {/* Applicant Info */}
                        <div className="mb-3 sm:mb-0">
                            <p className="text-lg font-bold text-indigo-700">{applicant.student_email}</p>
                            <p className="text-sm text-gray-500">Application ID: {applicant.id}</p>
                            <p className="text-sm text-gray-500">Applied: {new Date(applicant.applied_date).toLocaleDateString()}</p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 items-start md:items-center">
                            
                            {/* Status Selector */}
                            <select
                                value={applicant.status}
                                onChange={(e) => handleStatusChange(applicant.id, e.target.value)}
                                className={`p-2 text-sm font-bold rounded-xl shadow-sm border ${getStatusColor(applicant.status)} transition focus:ring-2 focus:ring-offset-2`}
                                disabled={loading}
                            >
                                {ALLOWED_STATUSES.map(status => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>

                            {/* Resume Download Button */}
                            <button
                                onClick={() => handleDownload(applicant.id)}
                                className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition duration-150 shadow-md flex items-center disabled:opacity-50"
                                disabled={loading}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.707-8.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L10 10.586 6.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Download Resume
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ApplicantList;