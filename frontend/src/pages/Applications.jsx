import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';

const Applications = () => {
    const { user } = useContext(AuthContext);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedApp, setSelectedApp] = useState(null); // Powers the review modal

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await api.get('applications/');
                setApplications(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch application pipeline:", err);
                setError("Unable to load application history. Please try refreshing.");
                setLoading(false);
            }
        };

        if (user) fetchApplications();
    }, [user]);

    // Helper to format clean visual badges based on current pipeline status
    const getStatusConfig = (status) => {
        switch (status?.toUpperCase()) {
            case 'SHORTLISTED':
                return { 
                    label: '★ Shortlisted', 
                    bg: 'var(--highlight-bg)', 
                    color: 'var(--highlight)', 
                    border: '1px solid var(--highlight)' 
                };
            case 'REJECTED':
                return { 
                    label: 'Archived', 
                    bg: '#fee2e2', 
                    color: '#ef4444', 
                    border: '1px solid #fca5a5' 
                };
            default: // APPLIED
                return { 
                    label: 'Review Pending', 
                    bg: 'var(--code-bg)', 
                    color: 'var(--accent)', 
                    border: '1px solid var(--border)' 
                };
        }
    };

    // Filter pipeline records based on active tab
    const filteredApps = applications.filter(app => {
        if (statusFilter === 'ALL') return true;
        return app.application_status?.toUpperCase() === statusFilter;
    });

    if (loading) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text)', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '20px', fontWeight: '500' }}>Synchronizing tracking dashboard...</p>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444', fontWeight: '700' }}>{error}</div>;
    }

    return (
        <div style={{ padding: 'clamp(24px, 4vw, 48px) clamp(24px, 6vw, 64px)', maxWidth: '1600px', margin: '0 auto', width: '100%', animation: 'fadeIn 0.3s ease-out' }}>
            
            {/* Header Canvas */}
            <div style={{ marginBottom: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px' }}>
                        Application <span style={{ color: 'var(--accent)' }}>Pipeline</span>
                    </h1>
                    <p style={{ color: 'var(--text)', margin: 0, fontSize: '1.05rem' }}>
                        Real-time status updates on your job applications.
                    </p>
                </div>

                {/* Pipeline Status Filter Tabs */}
                <div style={{ display: 'flex', background: 'var(--card-bg)', padding: '6px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                    {['ALL', 'APPLIED', 'SHORTLISTED', 'REJECTED'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            style={{
                                background: statusFilter === tab ? 'var(--accent-bg)' : 'transparent',
                                color: statusFilter === tab ? 'var(--accent)' : 'var(--text)',
                                border: 'none',
                                padding: '8px 18px',
                                borderRadius: '16px',
                                fontWeight: statusFilter === tab ? '800' : '600',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {tab === 'ALL' ? 'All Roles' : tab === 'APPLIED' ? 'Pending' : tab === 'SHORTLISTED' ? 'Shortlisted' : 'Archived'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Empty State Fallback */}
            {filteredApps.length === 0 ? (
                <div style={{ background: 'var(--card-bg)', padding: '60px 30px', borderRadius: '24px', border: '1px dashed var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📫</div>
                    <h3 style={{ color: 'var(--text-h)', marginBottom: '10px', fontWeight: '700' }}>No matching applications found</h3>
                    <p style={{ color: 'var(--text)', maxWidth: '400px', margin: '0 auto 25px auto', fontSize: '0.95rem' }}>
                        {statusFilter === 'ALL' 
                            ? "You haven't submitted any job applications yet. Browse the open roles and let the AI find your match."
                            : `No positions are currently marked as ${statusFilter.toLowerCase()}.`}
                    </p>
                    <Link 
                        to="/jobs" 
                        style={{ 
                            background: 'var(--text-h)', color: '#fff', padding: '12px 28px', 
                            borderRadius: '25px', fontWeight: '700', textDecoration: 'none', 
                            display: 'inline-block', fontSize: '0.95rem' 
                        }}
                    >
                        Explore Open Positions
                    </Link>
                </div>
            ) : (
                /* Application Grid Canvas */
                <div style={{ display: 'grid', gap: '20px' }}>
                    {filteredApps.map((app) => {
                        const job = app.job_details || {};
                        const statusObj = getStatusConfig(app.application_status);
                        const applyDate = new Date(app.application_date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                        });

                        return (
                            <div 
                                key={app.id} 
                                style={{ 
                                    background: 'var(--card-bg)', 
                                    borderRadius: '20px', 
                                    padding: '25px 30px',
                                    border: '1px solid var(--border)', 
                                    boxShadow: 'var(--shadow)',
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    flexWrap: 'wrap', 
                                    gap: '20px',
                                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                            >
                                {/* Left Side: Role Info */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '250px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.3rem', fontWeight: '800' }}>
                                            {job.job_title || "Position Title Unavailable"}
                                        </h3>
                                        <span style={{ background: 'var(--bg)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text)' }}>
                                            {job.job_location || "Location N/A"}
                                        </span>
                                    </div>
                                    <span style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.95rem' }}>
                                        {job.company_name || "Company Name N/A"}
                                    </span>
                                    <span style={{ color: 'var(--text)', fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>
                                        Submitted on {applyDate}
                                    </span>
                                </div>

                                {/* Right Side: Visual Badges & Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                                    
                                    {/* Visual Status Indicator Badge */}
                                    <span style={{
                                        background: statusObj.bg,
                                        color: statusObj.color,
                                        border: statusObj.border,
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontWeight: '800',
                                        fontSize: '0.85rem',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase'
                                    }}>
                                        {statusObj.label}
                                    </span>

                                    {/* Review Original Job Details Trigger */}
                                    <button
                                        onClick={() => setSelectedApp(app)}
                                        style={{
                                            background: 'var(--code-bg)',
                                            color: 'var(--text-h)',
                                            border: '1px solid var(--border)',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontWeight: '700',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s ease'
                                        }}
                                        onMouseOver={(e) => e.target.style.background = 'var(--bg)'}
                                        onMouseOut={(e) => e.target.style.background = 'var(--code-bg)'}
                                    >
                                        Review Details
                                    </button>

                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- IMMERSIVE JOB DETAILS OVERLAY MODAL --- */}
            {selectedApp && (
                <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedApp(null)}>×</button>
                        
                        {/* Status Stamp inside Modal */}
                        <div style={{ marginBottom: '20px', display: 'inline-block' }}>
                            <span style={{
                                background: getStatusConfig(selectedApp.application_status).bg,
                                color: getStatusConfig(selectedApp.application_status).color,
                                border: getStatusConfig(selectedApp.application_status).border,
                                padding: '6px 14px', borderRadius: '20px', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase'
                            }}>
                                Current State: {getStatusConfig(selectedApp.application_status).label}
                            </span>
                        </div>

                        <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-h)' }}>
                            {selectedApp.job_details?.job_title}
                        </h2>
                        <h4 style={{ fontSize: '1.1rem', color: 'var(--accent)', marginBottom: '25px', fontWeight: '700' }}>
                            {selectedApp.job_details?.company_name} • {selectedApp.job_details?.job_location}
                        </h4>

                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-h)', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Role Description</h3>
                        <p style={{ color: 'var(--text)', lineHeight: '1.8', marginBottom: '30px', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                            {selectedApp.job_details?.job_description || "No description supplied."}
                        </p>

                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-h)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Target Stack</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                            {selectedApp.job_details?.required_skills?.split(',').map((skill, i) => (
                                <span key={i} style={{ background: 'var(--bg)', color: 'var(--text-h)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                                    {skill.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Applications;