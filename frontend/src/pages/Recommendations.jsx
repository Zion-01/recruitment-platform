import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';

const Recommendations = () => {
    const { user } = useContext(AuthContext);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Application, Notification & Modal State
    const [applyingTo, setApplyingTo] = useState(null);
    const [appliedJobs, setAppliedJobs] = useState(new Set());
    const [selectedJob, setSelectedJob] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [recResponse, appResponse] = await Promise.all([
                    api.get(`users/${user.user_id}/recommendations/`),
                    api.get('applications/')
                ]);

                setRecommendations(recResponse.data);
                
                const appliedJobIds = new Set(appResponse.data.map(app => typeof app.job === 'object' ? app.job.id : app.job));
                setAppliedJobs(appliedJobIds);
                
                setLoading(false);
            } catch (err) { 
                setError("The AI engine encountered an error. Please try again later."); 
                setLoading(false); 
            }
        };
        
        if (user) fetchAllData();
    }, [user]);

    const handleApply = async (jobId) => {
        setApplyingTo(jobId);
        setMessage({ type: '', text: '' });

        try {
            await api.post('applications/', { job: jobId });
            setAppliedJobs(prev => new Set(prev).add(jobId));
            setMessage({ type: 'success', text: 'Application submitted successfully!' });
        } catch (err) {
            console.error("Application failed:", err);
            if (err.response && err.response.status === 400) {
                setMessage({ type: 'error', text: 'You have already applied for this position.' });
                setAppliedJobs(prev => new Set(prev).add(jobId));
            } else {
                setMessage({ type: 'error', text: 'Failed to submit application. Please try again.' });
            }
        } finally {
            setApplyingTo(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-h)' }}>
                <div style={{ fontSize: '3em', marginBottom: '20px', animation: 'pulse 1.5s infinite' }}>🧠</div>
                <h2 style={{ fontWeight: '800' }}>AI is analyzing your profile...</h2>
                <p style={{ color: 'var(--text)' }}>Computing vector alignment scores with open roles.</p>
            </div>
        );
    }

    if (error) return <h2 style={{ padding: '40px', color: 'var(--accent)' }}>{error}</h2>;

    return (
        <div style={{ padding: 'clamp(24px, 4vw, 48px) clamp(24px, 6vw, 64px)', maxWidth: '1600px', width: '100%', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
            
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ margin: '0 0 10px 0', color: 'var(--text-h)', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px' }}>
                    Your AI <span style={{ color: 'var(--highlight)' }}>Matches</span>
                </h1>
                <p style={{ color: 'var(--text)', margin: 0, fontSize: '1.1rem' }}>
                    Ranked by how well your professional profile aligns with our roles.
                </p>
            </div>

            {/* Floating Toast Notification */}
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
                {recommendations.length === 0 ? (
                    <div style={{ background: 'var(--card-bg)', padding: '40px', borderRadius: '24px', textAlign: 'center', gridColumn: '1 / -1', border: '1px solid var(--border)' }}>
                        <h3 style={{ color: 'var(--text-h)', fontSize: '1.5rem', marginBottom: '10px' }}>No matches found yet.</h3>
                        <p style={{ color: 'var(--text)', marginBottom: '25px' }}>
                            Our AI needs a bit more data to find your perfect role. Try updating your profile with more specific skills!
                        </p>
                        <Link to="/profile" style={{ 
                            padding: '12px 28px', background: 'var(--accent)', color: '#fff', 
                            textDecoration: 'none', borderRadius: '30px', fontWeight: '700', display: 'inline-block' 
                        }}>
                            Update Profile
                        </Link>
                    </div>
                ) : (
                    recommendations.map((rec, index) => {
                        const job = rec.job || {}; 
                        const score = rec.match_percentage || 0;

                        const isApplied = appliedJobs.has(job.id);
                        const isApplying = applyingTo === job.id;
                        const isEliteMatch = score >= 75;
                        const defaultButtonColor = index === 0 ? 'var(--highlight)' : 'var(--text-h)';

                        return (
                            <div key={rec.id} style={{ 
                                background: 'var(--card-bg)', padding: '30px', borderRadius: '24px', 
                                boxShadow: index === 0 ? `0 15px 40px var(--highlight-bg)` : 'var(--shadow)', 
                                border: index === 0 ? `2px solid var(--highlight)` : '1px solid var(--border)', 
                                display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease',
                                overflow: 'hidden'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                
                                {/* 🛡️ FIXED HEADER ROW: Safely manages badges in normal document flow */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'flex-start', 
                                    gap: '12px',
                                    marginBottom: '15px',
                                    flexWrap: 'wrap-reverse' // Stacks safely if the viewport becomes extremely narrow
                                }}>
                                    
                                    {/* Left Side: Optional Top Match Tag */}
                                    <div>
                                        {index === 0 && (
                                            <span style={{ 
                                                background: 'var(--highlight)', color: '#fff', padding: '6px 14px', 
                                                borderRadius: '20px', fontSize: '0.8em', fontWeight: '800', 
                                                display: 'inline-block', textTransform: 'uppercase', letterSpacing: '1px'
                                            }}>
                                                Top Match
                                            </span>
                                        )}
                                    </div>

                                    {/* Right Side: Dynamic AI Confidence Pill */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: isEliteMatch ? 'var(--accent-bg)' : 'var(--bg)',
                                        padding: '6px 12px',
                                        borderRadius: '16px',
                                        border: `1px solid ${isEliteMatch ? 'var(--accent)' : 'var(--border)'}`,
                                        marginLeft: 'auto' // Forces alignment to the far right edge
                                    }}>
                                        <span style={{ fontSize: '1rem' }}>{isEliteMatch ? '🔥' : '⚡'}</span>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--text)', textTransform: 'uppercase', lineHeight: '1' }}>
                                                AI Match
                                            </div>
                                            <div style={{ fontSize: '1rem', fontWeight: '900', color: isEliteMatch ? 'var(--accent)' : 'var(--text-h)', lineHeight: '1.1' }}>
                                                {score}%
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                
                                {/* Job Title spans fully without colliding into absolute elements */}
                                <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '1.4rem' }}>
                                    {job.job_title}
                                </h2>
                                <h4 style={{ margin: '0 0 20px 0', color: 'var(--text)', fontSize: '0.9rem', fontWeight: '500' }}>
                                    {job.company_name} • {job.job_location}
                                </h4>
                                <p style={{ color: 'var(--text)', lineHeight: '1.6', flexGrow: 1, fontSize: '0.95rem' }}>
                                    {job.job_description?.length > 120 ? job.job_description.substring(0, 120) + '...' : job.job_description}
                                </p>
                                
                                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                        disabled={isApplied || isApplying}
                                        style={{ 
                                            background: isApplied ? 'var(--highlight)' : (isApplying ? 'var(--border)' : defaultButtonColor), 
                                            color: isApplied ? '#fff' : (isApplying ? 'var(--text)' : '#fff'), 
                                            border: 'none', padding: '10px 24px', borderRadius: '30px', 
                                            fontWeight: '700', cursor: (isApplied || isApplying) ? 'not-allowed' : 'pointer', 
                                            transition: 'all 0.2s ease',
                                            opacity: isApplied ? 0.8 : 1
                                        }}
                                        onMouseOver={(e) => { if (!isApplied && !isApplying && index !== 0) e.target.style.background = 'var(--accent)'; }}
                                        onMouseOut={(e) => { if (!isApplied && !isApplying && index !== 0) e.target.style.background = defaultButtonColor; }}
                                    >
                                        {isApplying ? 'Applying...' : (isApplied ? '✓ Applied' : 'Apply Now')}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* The Job Details Modal Overlay */}
            {selectedJob && (
                <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedJob(null)}>×</button>
                        
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <span style={{ background: 'var(--code-bg)', color: 'var(--text-h)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8em', fontWeight: '700', border: '1px solid var(--border)' }}>
                                {selectedJob.job_type?.replace('_', ' ')}
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
                            {selectedJob.required_skills?.split(',').map((skill, i) => (
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

export default Recommendations;