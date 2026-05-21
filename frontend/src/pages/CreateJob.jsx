import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';

const CreateJob = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        job_title: '',
        company_name: '',
        job_location: '',
        job_type: 'FULL_TIME',
        experience_required: 0,
        required_skills: '',
        job_description: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            await api.post('jobs/', formData);
            setMessage({ type: 'success', text: 'Job published successfully!' });
            
            // Clear form and redirect to the job board after a brief delay
            setTimeout(() => {
                navigate('/jobs');
            }, 2000);
        } catch (err) {
            console.error("Failed to publish job:", err);
            // Catch our backend PermissionDenied error or standard validation failures
            if (err.response && err.response.status === 403) {
                setMessage({ type: 'error', text: 'Access Denied: Only authorized recruiters can post roles.' });
            } else {
                setMessage({ type: 'error', text: 'Failed to publish role. Please verify all inputs.' });
            }
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: 'clamp(24px, 4vw, 48px) clamp(24px, 6vw, 64px)', maxWidth: '1400px', width: '100%', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
            
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px' }}>
                    Publish <span style={{ color: 'var(--accent)' }}>Job</span>
                </h1>
                <p style={{ color: 'var(--text)', margin: 0, fontSize: '1.05rem' }}>
                    Create a new job. The required skills and description will immediately feed the matching engine.
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

            <div style={{ background: 'var(--card-bg)', padding: 'clamp(25px, 5vw, 50px)', borderRadius: '32px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '30px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Job Title</label>
                            <input type="text" name="job_title" className="custom-input" placeholder="e.g. Senior Full-Stack Engineer" value={formData.job_title} onChange={handleChange} required />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Company Name</label>
                            <input type="text" name="company_name" className="custom-input" placeholder="e.g. Innova Systems" value={formData.company_name} onChange={handleChange} required />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Location</label>
                            <input type="text" name="job_location" className="custom-input" placeholder="e.g. Remote Worldwide, Abuja" value={formData.job_location} onChange={handleChange} required />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Employment Type</label>
                            <select name="job_type" className="custom-input custom-select" value={formData.job_type} onChange={handleChange}>
                                <option value="FULL_TIME">Full-time</option>
                                <option value="PART_TIME">Part-time</option>
                                <option value="CONTRACT">Contract</option>
                                <option value="REMOTE">Remote</option>
                                <option value="INTERNSHIP">Internship</option>
                                <option value="HYBRID">Hybrid</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Minimum Experience (Years)</label>
                            <input type="number" name="experience_required" className="custom-input" min="0" value={formData.experience_required} onChange={handleChange} required />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Required Skills (Comma Separated)</label>
                        <input type="text" name="required_skills" className="custom-input" placeholder="e.g. React, Python, FastAPI, PostgreSQL" value={formData.required_skills} onChange={handleChange} required />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Comprehensive Description</label>
                        <textarea 
                            name="job_description" 
                            className="custom-input" 
                            placeholder="Outline the responsibilities, tech stack, and ideal candidate profile..." 
                            value={formData.job_description} 
                            onChange={handleChange} 
                            style={{ minHeight: '150px', resize: 'vertical' }}
                            required 
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            style={{ 
                                padding: '16px 48px', background: isSubmitting ? 'var(--border)' : 'var(--accent)', 
                                color: isSubmitting ? 'var(--text)' : '#fff', border: 'none', 
                                borderRadius: '30px', cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                                fontWeight: '800', fontSize: '1.05rem',
                                boxShadow: isSubmitting ? 'none' : '0 10px 25px var(--accent-bg)', 
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => { if (!isSubmitting) e.target.style.transform = 'translateY(-2px)' }}
                            onMouseOut={(e) => { if (!isSubmitting) e.target.style.transform = 'translateY(0)' }}
                        >
                            {isSubmitting ? 'Publishing Job...' : 'Publish Job'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateJob;