// app/components/StudentDashboard.tsx
'use client'; 

import React, { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders, API_BASE_URL } from '../utils/api'; 

// --- Shared Types (Confirmed) ---
interface Job {
    id: number;
    title: string; 
    match_score: number; 
    description: string; 
    required_skills: string[]; 
    job_title: string;          
    relevance_reason: string;   
    missing_skills: string[];   
    recommended_courses: string[];
    fit_score: number;          
    final_comment: string;
    recruiter_id: number;
    date_posted: string;
}
interface Application {
    id: number;
    student_id: number;
    job_id: number;
    status: string;
    applied_date: string;
    job_title: string;
    job_description: string;
    skills_required: string[];
    resume_path?: string;
}
interface StudentDashboardProps {
    token: string;
    userName: string | null;
}

// --- Helper: Job Detail Card Component (NEW) ---
interface ApplicationDetailCardProps {
    application: Application;
    onClose: () => void;
}
// --- Helper: Job Detail Card Component (NEW - Styled for Transparency) ---
interface ApplicationDetailCardProps {
    token: string;
    application: Application;
    onClose: () => void;
}
const ApplicationDetailCard: React.FC<ApplicationDetailCardProps> = ({ token, application, onClose }) => {

  const handleViewOwnResume = () => {
        // Hitting the new endpoint with the necessary job_id query parameter
        const downloadUrl = `${API_BASE_URL}/student/my-resume?job_id=${application.job_id}`;
        
        // Use window.open with the token query parameter for simple browser download
        window.open(`${downloadUrl}&token=${token}`, '_blank'); 
    };
    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            
            <div className="bg-white w-full max-w-xl p-8 rounded-2xl shadow-xl border border-gray-200/60 relative animate-popIn">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:scale-110 transition-all"
                >
                    ✕
                </button>

                {/* Header */}
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                    Application Details  
                </h3>

                <div className="space-y-5">

                    <div>
                        <p className="text-sm text-gray-500">Position:</p>
                        <p className="text-xl font-semibold text-indigo-600">
                            {application.job_title}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Status:</p>
                        <p className={`text-lg font-bold ${
                            application.status === 'Accepted'
                                ? 'text-green-600'
                                : application.status === 'Rejected'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                        }`}>
                            {application.status}
                        </p>
                    </div>

                    {application.job_description && (
                        <div>
                            <p className="text-sm text-gray-500">Description:</p>
                            <p className="text-gray-700 leading-relaxed">
                                {application.job_description}
                            </p>
                        </div>
                    )}

                    {application.skills_required && application.skills_required.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">
                          Skills Required:
                        </p>

                        {/* If it is an array, show badges */}
                        {Array.isArray(application.skills_required) ? (
                          <div className="flex flex-wrap gap-2">
                            {application.skills_required.map((skill: string, index: number) => (
                              <span
                                key={index}
                                className="px-3 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full shadow-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          /* If it is a string, show plain text */
                          <p className="text-gray-700 leading-relaxed">
                            {application.skills_required}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="pt-4 border-t mt-4">
                      <button
                          onClick={handleViewOwnResume}
                          className="w-full px-4 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition shadow-lg flex items-center justify-center space-x-2"
                      >
                          <span>View Submitted Resume (PDF)</span>
                      </button>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Applied On:</p>
                        <p className="text-gray-700 font-medium">
                            {new Date(application.applied_date).toLocaleDateString()}
                        </p>
                    </div>

                    <p className="text-xs text-gray-500 italic pt-4 border-t">
                        This application card confirms your submission details.
                    </p>
                </div>
            </div>

            {/* Animations */}
            <style jsx>{`
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .animate-popIn {
                    animation: popIn 0.25s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

// --- Helper: Recommendation Content Component (Remains the same) ---
interface RecommendationContentProps {
    recommendations: Job[];
    loading: boolean;
    uploadMessage: string;
    onGenerate: (file: File) => void;
    onApply: (jobId: number, file: File) => void; 
    setFile: (file: File | null) => void;
    file: File | null;
}
const RecommendationContent: React.FC<RecommendationContentProps> = ({ recommendations, loading, uploadMessage, onGenerate, onApply, setFile, file }) => {
    // ... (logic remains the same) ...
    // Note: The structure inside RecommendationContent is very long, so I'm omitting 
    // it here but assuming it is the code block I provided in the last turn.
    // It is functionally complete.
    const allCourses = recommendations.reduce((acc, job) => {
        (job.recommended_courses || []).forEach(course => {
            if (!acc.includes(course)) {
                acc.push(course);
            }
        });
        return acc;
    }, [] as string[]);
  
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (file) {
            onGenerate(file);
        } else {
            alert('Please select a PDF file to upload.');
        }
    };
  
    return (
      <div className="space-y-10">
        {/* Resume Upload Form */}
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg mx-auto border-t-4 border-indigo-500/80">
          <h3 className="text-xl font-bold mb-5 text-gray-800">Find the perfect job for you.</h3>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            
            {/* File Input */}
            <input
              type="file"
              accept=".pdf"
              required
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="flex-grow p-3 border border-gray-300 rounded-lg w-full text-gray-700 bg-gray-50 hover:bg-gray-100 transition shadow-inner"
            />
            
            {/* Button (Ensured it fits and has max-width on smaller screens) */}
            <button
              type="submit"
              disabled={loading || !file}
              className="py-3 px-6 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition duration-150 shadow-lg w-full sm:w-auto whitespace-nowrap transform hover:scale-[1.01]"
            >
              {loading ? 'Matching...' : 'Find Job'}
            </button>
          </form>
          {uploadMessage && (
            <p className={`mt-4 text-sm font-medium text-center ${uploadMessage.startsWith('Error') ? 'text-red-600' : 'text-indigo-600'}`}>
                {uploadMessage}
            </p>
          )}
        </div>
  
        {loading && <p className="text-center py-10 text-indigo-600 font-semibold text-lg">Analyzing resume and fetching results...</p>}
  
        {/* --- Skill Development Plan (Courses) --- */}
        {allCourses.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-2xl border-l-4 border-blue-500/80">
                <h3 className="text-2xl font-extrabold text-blue-700 mb-4 flex items-center">
                    <span role="img" aria-label="lightbulb" className="mr-3 text-2xl">💡</span>
                    Your Skill Development Plan
                </h3>
                <p className="text-gray-600 mb-5 text-base">
                    Based on the skill gaps identified in your top job matches, prioritize these courses:
                </p>
                <div className="flex flex-wrap gap-3">
                    {allCourses.map((course, index) => (
                        <span key={index} className="px-4 py-2 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full shadow-md transition hover:bg-blue-200 cursor-default">
                            {course}
                        </span>
                    ))}
                </div>
            </div>
        )}
        
        {/* --- Job Matches --- */}
        {recommendations.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-800 border-b pb-2">Top Job Matches</h3>
            {recommendations.map((job) => (
              <div key={job.id} className="bg-white p-6 shadow-xl rounded-xl border border-green-300 transition duration-300 hover:shadow-2xl">
                <div className="flex justify-between items-start flex-col sm:flex-row">
                  <div className="mb-3 sm:mb-0">
                    <h4 className="text-xl font-bold text-green-700">{job.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Fit Score: <span className="font-extrabold text-lg text-indigo-600">{(job.match_score * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onApply(Number(job.id), file!)} 
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition duration-150 shadow-lg w-full sm:w-auto transform hover:scale-105"
                    disabled={!file}
                  >
                    Apply Now
                  </button>
                </div>
                
                {/* Detailed Analysis */}
                <p className="mt-4 text-gray-700 font-medium border-t pt-3 border-gray-100">
                    Why you fit: <span className="font-normal text-gray-600">{job.relevance_reason}</span>
                </p>
                
                {/* Missing Skills */}
                <div className="mt-3 p-3 bg-red-50/50 rounded-lg">
                    <span className="text-sm font-semibold text-red-600 block mb-2">Missing Skills for This Role:</span>
                    <div className="flex flex-wrap gap-2">
                        {job.missing_skills.map((skill, index) => (
                            <span key={index} className="px-3 py-1 text-xs font-semibold bg-red-200 text-red-800 rounded-full shadow-sm">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {recommendations.length === 0 && !loading && uploadMessage && !uploadMessage.startsWith('Error') && (
          <p className="text-center py-10 text-gray-500 font-medium text-lg">No matching internships found based on your skills. Try uploading a different resume!</p>
        )}
      </div>
    );
};


// --- Helper: Application List Component (MODIFIED) ---
interface ApplicationListProps {
    applications: Application[];
    onViewDetails: (app: Application) => void;
}
const ApplicationList: React.FC<ApplicationListProps> = ({ applications, onViewDetails }) => {
    if (applications.length === 0) return <p className="text-center py-10 text-gray-500 font-medium text-lg">You have not submitted any applications yet.</p>;
  
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">Your Application History</h3>
        {applications.map(app => (
          <div 
            key={app.id} 
            className="bg-white p-5 shadow-lg rounded-xl border border-gray-200 transition duration-300 hover:shadow-xl cursor-pointer"
            onClick={() => onViewDetails(app)} // <-- Attach click handler to the card
          >
            <div className="flex justify-between items-center flex-wrap gap-3">
              {/* Job Title is now the clickable element */}
              <h4 className="text-lg font-bold text-indigo-600 hover:text-indigo-800 transition underline"> 
                {app.job_title}
              </h4>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-1 text-sm font-bold rounded-full shadow-sm ${
                  app.status === 'Accepted' ? 'bg-green-100 text-green-700' : 
                  app.status === 'Interview' ? 'bg-blue-100 text-blue-700' :
                  app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {app.status}
                </span>
                <p className="text-xs text-gray-500">Applied on: {new Date(app.applied_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
};


// --- Main Component (StudentDashboard) ---
const StudentDashboard: React.FC<StudentDashboardProps> = ({ token, userName }) => {
    const [activeTab, setActiveTab] = useState<'recommend' | 'applications'>('recommend');
    const [recommendations, setRecommendations] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null); 
    // NEW STATE: Tracks the application object to show in the detail modal
    const [viewingApplication, setViewingApplication] = useState<Application | null>(null);
  
    // --- Utility Functions ---
    const fetchApplications = useCallback(async () => { /* ... remains the same ... */ 
      try {
        const response = await fetch(`${API_BASE_URL}/student/applications`, {
          headers: getAuthHeaders(token),
        });
        const data = await response.json();
        if (response.ok) {
          setApplications(data as Application[]);
        }
      } catch (error) {
        console.error('Network error fetching applications:', error);
      }
    }, [token]);
    
    useEffect(() => {
      fetchApplications();
    }, [fetchApplications]);
  
    // --- Handlers ---
    const handleGenerateRecommendations = async (file: File) => { /* ... remains the same ... */ };
  
    const handleApplyAndSubmitResume = async (jobId: number, file: File) => {
      // CRITICAL GUARD: Check if the Job ID is valid immediately
      if (typeof jobId !== 'number' || jobId <= 0) {
          alert("Application failed: Invalid Job ID detected.");
          console.error("Invalid Job ID received for application:", jobId);
          return; 
      }
      
      setLoading(true);
      
      const formData = new FormData();
      formData.append('file', file); 
      formData.append('job_id', jobId.toString()); 
      
      try {
        const response = await fetch(`${API_BASE_URL}/student/apply/${jobId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
  
        if (response.status === 201) {
          alert('Application submitted successfully!');
          fetchApplications(); 
        } else {
          const errorData = await response.json();
          alert(`Error applying: ${errorData.detail}`);
        }
      } catch (error) {
        alert('Network error during application submission.');
        console.error('Apply Network Error:', error);
      }
      setLoading(false);
    };
    
    // NEW HANDLER: Opens the detail modal when a job title is clicked
    const handleViewApplicationDetails = (app: Application) => {
        setViewingApplication(app);
    };
  
    return (
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6">Hi {userName}</h2>
  
        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-3 px-4 font-medium text-base rounded-t-lg transition duration-150 ${
                activeTab === 'recommend' ? 'border-b-4 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('recommend')}
            >
              Recommendations & Plan
            </button>
            <button
              className={`py-3 px-4 font-medium text-base rounded-t-lg transition duration-150 ${
                activeTab === 'applications' ? 'border-b-4 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('applications')}
            >
              Application History ({applications.length})
            </button>
          </nav>
        </div>
  
        {/* Tab Content */}
        {activeTab === 'recommend' && (
          <RecommendationContent
            recommendations={recommendations}
            loading={loading}
            uploadMessage={uploadMessage}
            onGenerate={handleGenerateRecommendations}
            onApply={handleApplyAndSubmitResume} 
            setFile={setResumeFile} 
            file={resumeFile} 
          />
        )}
        
        {activeTab === 'applications' && (
          <ApplicationList 
              applications={applications} 
              onViewDetails={handleViewApplicationDetails} // <-- PASS NEW HANDLER
          />
        )}
        
        {/* Render Detail Modal */}
        {viewingApplication && (
            <ApplicationDetailCard 
                token = {token}
                application={viewingApplication} 
                onClose={() => setViewingApplication(null)} 
            />
        )}
      </div>
    );
};

export default StudentDashboard;