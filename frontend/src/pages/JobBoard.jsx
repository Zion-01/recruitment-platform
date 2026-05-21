import { useState, useEffect } from 'react';
import api from '../services/api';

const JobBoard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Application, Notification & Modal State
    const [appliedJobs, setAppliedJobs] = useState(new Set()); 
    const [applyingTo, setApplyingTo] = useState(null); 
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedJob, setSelectedJob] = useState(null); // Added Modal State

    useEffect(() => {
        const fetchBoardData = async () => {
            try {
                const [jobsResponse, appsResponse] = await Promise.all([
                    api.get('jobs/'),
                    api.get('applications/')
                ]);
                
                setJobs(jobsResponse.data);

                const appliedIds = new Set(appsResponse.data.map(app => typeof app.job === 'object' ? app.job.id : app.job));
                setAppliedJobs(appliedIds);
                
                setLoading(false);
            } catch (err) {
                console.error("Error fetching job board data:", err);
                setError("Failed to load jobs. Please try again later.");
                setLoading(false);
            }
        };

        fetchBoardData();
    }, []);

    const handleApply = async (jobId) => {
        setApplyingTo(jobId);
        setMessage({ type: '', text: '' });

        try {
            await api.post('applications/', { job: jobId });
            setAppliedJobs(prev => new Set(prev).add(jobId));
            setMessage({ type: 'success', text: 'Application submitted successfully!' });
        } catch (err) {
            if (err.response && err.response.status === 400) {
                setMessage({ type: 'error', text: 'You have already applied for this position.' });
                setAppliedJobs(prev => new Set(prev).add(jobId));
            } else {
                setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
            }
        } finally {
            setApplyingTo(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>
                <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '20px', fontWeight: '500' }}>Loading available positions...</p>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--accent)', fontWeight: '600' }}>{error}</div>;
    }

    return (
        <div style={{ padding: 'clamp(24px, 4vw, 48px) clamp(24px, 6vw, 64px)', maxWidth: '1600px', width: '100%', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
            
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', letterSpacing: '-1px', color: 'var(--text-h)' }}>Open Positions</h1>
                    <p style={{ color: 'var(--text)', fontSize: '1.1rem', margin: 0 }}>Discover your next big job.</p>
                </div>
            </div>

            {message.text && (
                <div style={{ 
                    position: 'fixed', top: '30px', right: '30px', zIndex: 1000,
                    background: message.type === 'success' ? 'var(--highlight)' : '#ef4444', 
                    color: '#fff', padding: '16px 24px', borderRadius: '12px', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: '600',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
                {jobs.map((job) => {
                    const hasApplied = appliedJobs.has(job.id);
                    const isApplying = applyingTo === job.id;

                    return (
                        <div key={job.id} style={{ 
                            background: 'var(--card-bg)', borderRadius: '24px', padding: '30px',
                            border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
                            display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, borderColor 0.2s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.4rem', color: 'var(--text-h)', margin: '0 0 8px 0', fontWeight: '700' }}>{job.job_title}</h3>
                                    <p style={{ color: 'var(--accent)', fontWeight: '600', margin: 0, fontSize: '0.95rem' }}>{job.company_name}</p>
                                </div>
                                <span style={{ background: 'var(--code-bg)', color: 'var(--text)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                                    {job.job_location}
                                </span>
                            </div>

                            <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '25px', flexGrow: 1 }}>
                                {job.job_description.length > 120 ? job.job_description.substring(0, 120) + '...' : job.job_description}
                            </p>

                            <div style={{ marginBottom: '25px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {job.required_skills.split(',').slice(0, 3).map((skill, index) => (
                                    <span key={index} style={{ background: 'var(--highlight-bg)', color: 'var(--highlight)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                                        {skill.trim()}
                                    </span>
                                ))}
                                {job.required_skills.split(',').length > 3 && (
                                    <span style={{ color: 'var(--text)', fontSize: '0.75rem', fontWeight: '600', padding: '4px' }}>+{job.required_skills.split(',').length - 3} more</span>
                                )}
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button 
                                    onClick={() => setSelectedJob(job)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontWeight: '600', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}
                                    onMouseOver={(e) => e.target.style.color = 'var(--accent)'}
                                    onMouseOut={(e) => e.target.style.color = 'var(--text)'}
                                >
                                    View Details
                                </button>
                                
                                <button 
                                    onClick={() => handleApply(job.id)}
                                    disabled={isApplying || hasApplied}
                                    style={{ 
                                        background: hasApplied ? 'var(--code-bg)' : (isApplying ? 'var(--border)' : 'var(--text-h)'), 
                                        color: hasApplied ? 'var(--text)' : '#fff', 
                                        border: hasApplied ? '1px solid var(--border)' : 'none', 
                                        padding: '10px 24px', borderRadius: '30px', 
                                        fontWeight: '700', fontSize: '1rem', 
                                        cursor: (isApplying || hasApplied) ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseOver={(e) => { if (!isApplying && !hasApplied) e.target.style.background = 'var(--accent)'; e.target.style.transform = 'scale(1.05)'}}
                                    onMouseOut={(e) => { if (!isApplying && !hasApplied) e.target.style.background = 'var(--text-h)'; e.target.style.transform = 'scale(1)'}}
                                >
                                    {isApplying ? 'Applying...' : (hasApplied ? 'Applied ✓' : 'Apply Now')}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {jobs.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text)' }}>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--text-h)', marginBottom: '10px' }}>No positions available</h3>
                    <p>Check back later for new jobs.</p>
                </div>
            )}

            {/* The Job Details Modal */}
            {selectedJob && (
                <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedJob(null)}>×</button>
                        
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <span style={{ background: 'var(--code-bg)', color: 'var(--text-h)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8em', fontWeight: '700', border: '1px solid var(--border)' }}>
                                {selectedJob.job_type.replace('_', ' ')}
                            </span>
                            <span style={{ background: 'var(--code-bg)', color: 'var(--text-h)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8em', fontWeight: '700', border: '1px solid var(--border)' }}>
                                {selectedJob.experience_required} Yrs Exp
                            </span>
                        </div>

                        <h2 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-h)' }}>{selectedJob.job_title}</h2>
                        <h4 style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '30px', fontWeight: '500' }}>
                            {selectedJob.company_name} • {selectedJob.job_location}
                        </h4>

                        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-h)', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Description</h3>
                        <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '30px', whiteSpace: 'pre-wrap' }}>
                            {selectedJob.job_description}
                        </p>

                        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-h)', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Required Skills</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '40px' }}>
                            {selectedJob.required_skills.split(',').map((skill, i) => (
                                <span key={i} style={{ background: 'var(--accent-bg)', color: 'var(--accent)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9em', fontWeight: '600' }}>
                                    {skill.trim()}
                                </span>
                            ))}
                        </div>

                        <button 
                            onClick={() => handleApply(selectedJob.id)}
                            disabled={appliedJobs.has(selectedJob.id) || applyingTo === selectedJob.id}
                            style={{ 
                                width: '100%', 
                                background: appliedJobs.has(selectedJob.id) ? 'var(--highlight)' : 'var(--text-h)', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '16px', borderRadius: '30px', fontWeight: '800', fontSize: '1.1rem',
                                cursor: (appliedJobs.has(selectedJob.id) || applyingTo === selectedJob.id) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: appliedJobs.has(selectedJob.id) ? 0.8 : 1
                            }}
                            onMouseOver={(e) => { if (!appliedJobs.has(selectedJob.id) && applyingTo !== selectedJob.id) e.target.style.background = 'var(--accent)'; }}
                            onMouseOut={(e) => { if (!appliedJobs.has(selectedJob.id)) e.target.style.background = 'var(--text-h)'; }}
                        >
                            {applyingTo === selectedJob.id ? 'Processing...' : (appliedJobs.has(selectedJob.id) ? '✓ Application Submitted' : 'Submit Application')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobBoard;