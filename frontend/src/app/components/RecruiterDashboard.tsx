// app/components/RecruiterDashboard.tsx
'use client'; 

import React, { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders, API_BASE_URL } from '../utils/api';
import ApplicantList from './ApplicantList'; 
import JobEditModal from './JobEditModal';

// --- Shared Types ---
interface Job {
    id: number;
    title: string;
    description: string;
    required_skills: string[];
    recruiter_id: number;
    date_posted: string;
    match_score?: number;
}
interface RecruiterDashboardProps {
    token: string;
    userName: string | null;
}

// --- Helper: JobList Component ---
interface JobListProps {
    jobs: Job[];
    loading: boolean;
    onDelete: (jobId: number) => Promise<void>;
    onViewApplicants: (jobId: number, jobTitle: string) => void;
    onEdit: (jobId: number) => void;
}
const JobList: React.FC<JobListProps> = ({ jobs, loading, onDelete, onViewApplicants, onEdit }) => {
    if (loading) return <p className="text-center py-10 text-xl text-indigo-600 font-semibold">Loading job postings...</p>;
    if (jobs.length === 0) return <p className="text-center py-10 text-xl text-gray-500">No jobs posted yet. Use the "Post New Job" tab to start hiring!</p>;
  
    return (
      <div className="space-y-6">
        {jobs.map(job => (
          <div 
            key={job.id} 
            className="bg-white p-6 shadow-xl rounded-xl border border-gray-100 transition duration-300 hover:shadow-2xl hover:border-indigo-200"
          >
            <div className="flex justify-between items-start flex-wrap gap-4">
              {/* Job Title and Metadata */}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 tracking-tight">{job.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ID: {job.id} | Posted: <span className="font-medium">{new Date(job.date_posted).toLocaleDateString()}</span>
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 items-center">
                {/* Edit Button (Yellow for Modification) */}
                <button
                    onClick={() => onEdit(job.id)} 
                    className="px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-xl hover:bg-yellow-600 shadow-md transition duration-150 transform hover:scale-105"
                >
                    Edit
                </button>
                {/* View Applicants Button (Blue for Analytics) */}
                <button
                    onClick={() => onViewApplicants(job.id, job.title)} 
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition duration-150 shadow-md transform hover:scale-105"
                >
                    View Applicants
                </button>
                {/* Delete Button (Red for Destruction) */}
                <button
                    onClick={() => onDelete(job.id)}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition duration-150 shadow-md flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                    </svg>
                  </button>
              </div>
            </div>
            {/* Description and Skills Tags */}
            <p className="mt-4 text-gray-700 leading-relaxed">{job.description}</p>
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
              <span className="text-sm font-semibold text-gray-600 mr-2">Skills Required:</span>
              {job.required_skills.map((skill, index) => (
                <span key={index} className="px-3 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
};

// --- Helper: JobPostForm Component ---
interface JobPostFormProps {
    token: string;
    onJobPosted: () => void;
}
const JobPostForm: React.FC<JobPostFormProps> = ({ token, onJobPosted }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skills, setSkills] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
  
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
        const response = await fetch(`${API_BASE_URL}/recruiter/jobs/ingest`, {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify(jobData),
        });
  
        const data = await response.json();
        if (response.status === 201) {
          setMessage(`Job "${data.title}" posted successfully!`);
          setTitle('');
          setDescription('');
          setSkills('');
          onJobPosted();
        } else {
          setMessage(`Error: ${data.detail || 'Failed to post job.'}`);
        }
      } catch (error) {
        setMessage('Network error posting job.');
        console.error('Network error:', error);
      }
      setLoading(false);
    };
  
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-2xl border border-gray-200">
        <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Post New Internship Opportunity</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Software Engineering Intern (Backend)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Detailed description of responsibilities and culture..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Required Skills (Comma Separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Python, SQL, AWS, Kubernetes"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:opacity-50 transform hover:scale-[1.01]"
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-center text-sm font-medium p-3 rounded-lg ${
            message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </p>
        )}
      </div>
    );
};


// --- Main RecruiterDashboard Component ---

const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ token, userName }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'view' | 'post'>('view');
  const [viewApplicants, setViewApplicants] = useState<{ jobId: number, jobTitle: string } | null>(null);
  const [editJobId, setEditJobId] = useState<number | null>(null); // State for Edit Modal

  const fetchJobs = useCallback(async () => { 
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/recruiter/jobs`, {
        headers: getAuthHeaders(token),
      });
      const data = await response.json();
      if (response.ok) {
        setJobs(data as Job[]);
      } else {
        console.error('Failed to fetch jobs:', data);
      }
    } catch (error) {
      console.error('Network error fetching jobs:', error);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (jobId: number) => {
    if (!window.confirm("Are you sure you want to delete this job? This cannot be undone.")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/recruiter/jobs/${jobId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      if (response.status === 204) {
        alert('Job deleted successfully.');
        fetchJobs(); // Refresh list
      } else {
        const errorData = await response.json();
        alert(`Error deleting job: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Network error deleting job:', error);
      alert('Network error deleting job.');
    }
  };
  
  const handleViewApplicants = (jobId: number, jobTitle: string) => {
      setViewApplicants({ jobId, jobTitle });
  };
  
  // HANDLER: Opens the edit modal
  const handleEditJob = (jobId: number) => {
      setEditJobId(jobId);
  };
  
  // HANDLER: Closes the edit modal, and optionally refreshes jobs
  const handleCloseEdit = (updated = false) => {
      setEditJobId(null);
      if (updated) {
          fetchJobs();
      }
  };


  if (viewApplicants) {
      // Applicant List View
      return (
          <div className="max-w-7xl mx-auto w-full">
              <ApplicantList
                  token={token}
                  jobId={viewApplicants.jobId}
                  jobTitle={viewApplicants.jobTitle}
                  onBack={() => setViewApplicants(null)}
              />
          </div>
      );
  }
  
  return (
    <div className="max-w-7xl mx-auto w-full">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6">Hi {userName}</h2>

      {/* Tab Navigation (Enhanced) */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`py-3 px-4 font-medium text-base rounded-t-lg transition duration-150 ${
              activeTab === 'view' ? 'border-b-4 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('view')}
          >
            View Posted Jobs ({jobs.length})
          </button>
          <button
            className={`py-3 px-4 font-medium text-base rounded-t-lg transition duration-150 ${
              activeTab === 'post' ? 'border-b-4 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('post')}
          >
            Post New Job
          </button>
        </nav>
      </div>

      {activeTab === 'view' && (
        <JobList
          jobs={jobs}
          loading={loading}
          onDelete={handleDelete}
          onViewApplicants={handleViewApplicants}
          onEdit={handleEditJob}
        />
      )}
      
      {activeTab === 'post' && (
        <JobPostForm token={token} onJobPosted={fetchJobs} />
      )}
      
      {/* RENDER EDIT MODAL */}
      {editJobId !== null && (
          <JobEditModal
              token={token}
              jobId={editJobId}
              onClose={handleCloseEdit}
          />
      )}
    </div>
  );
};

export default RecruiterDashboard;