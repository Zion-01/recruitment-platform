import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import AuthContext from '../context/AuthContext';

const Profile = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // --- ACCORDION / DROPDOWN STATE ---
    // Keep Identity open by default so the user sees an immediate entry point
    const [showParser, setShowParser] = useState(false);
    const [openSections, setOpenSections] = useState({
        identity: true,
        techStack: false,
        experience: false,
        education: false,
        projects: false
    });

    const [formData, setFormData] = useState({
        first_name: '', last_name: '', phone_number: '', location: '',
        profile: { 
            skills: '', 
            experience_years: 0, 
            preferred_job_type: 'FULL_TIME', 
            preferred_location: '',
            linkedin_url: '',
            github_url: '',
            portfolio_url: '',
            experiences: [], 
            education: [],   
            projects: []     
        }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`users/${user.user_id}/`);
                const data = response.data;
                setFormData({
                    first_name: data.first_name || '', 
                    last_name: data.last_name || '', 
                    phone_number: data.phone_number || '', 
                    location: data.location || '',
                    profile: { 
                        skills: data.profile?.skills || '', 
                        experience_years: data.profile?.experience_years || 0, 
                        preferred_job_type: data.profile?.preferred_job_type || 'FULL_TIME', 
                        preferred_location: data.profile?.preferred_location || '',
                        linkedin_url: data.profile?.linkedin_url || '',
                        github_url: data.profile?.github_url || '',
                        portfolio_url: data.profile?.portfolio_url || '',
                        experiences: data.profile?.experiences || [],
                        education: data.profile?.education || [],
                        projects: data.profile?.projects || []
                    }
                });
                setLoading(false);
            } catch (err) { 
                console.error("Error fetching profile details:", err); 
                setLoading(false); 
            }
        };
        if (user) fetchProfile();
    }, [user]);

    // --- ACCORDION TOGGLE HANDLER ---
    const toggleSection = (sectionKey) => {
        setOpenSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    // --- TURING-STYLE PROFILE COMPLETENESS METER ---
    const calculateCompleteness = () => {
        let score = 0;
        if (formData.first_name && formData.last_name) score += 15;
        if (formData.location && formData.phone_number) score += 15;
        if (formData.profile.skills.length > 10) score += 25;
        if (formData.profile.experiences.length > 0) score += 20;
        if (formData.profile.education.length > 0) score += 10;
        if (formData.profile.projects.length > 0) score += 15;
        return Math.min(score, 100);
    };

    const handleBaseChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleProfileChange = (e) => setFormData({ ...formData, profile: { ...formData.profile, [e.target.name]: e.target.value } });

    // --- MODULAR BLOCK HANDLERS ---
    const addArrayItem = (field, defaultObj) => {
        setFormData(prev => ({
            ...prev,
            profile: { ...prev.profile, [field]: [...prev.profile[field], { id: Date.now(), ...defaultObj }] }
        }));
        // Auto-open the section if they click add
        if (field === 'experiences') setOpenSections(prev => ({ ...prev, experience: true }));
        if (field === 'education') setOpenSections(prev => ({ ...prev, education: true }));
        if (field === 'projects') setOpenSections(prev => ({ ...prev, projects: true }));
    };

    const updateArrayItem = (field, id, key, value) => {
        setFormData(prev => ({
            ...prev,
            profile: { ...prev.profile, [field]: prev.profile[field].map(item => item.id === id ? { ...item, [key]: value } : item) }
        }));
    };

    const removeArrayItem = (field, id) => {
        setFormData(prev => ({
            ...prev,
            profile: { ...prev.profile, [field]: prev.profile[field].filter(item => item.id !== id) }
        }));
    };

    // --- DRAG AND DROP & REAL BACKEND PARSING ---
    const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) processResumeFile(files[0]);
    };
    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files.length > 0) processResumeFile(files[0]);
    };

    const processResumeFile = async (file) => {
        if (!file) return;
        setIsParsing(true);
        setMessage({ type: '', text: '' });

        const uploadPayload = new FormData();
        uploadPayload.append('file', file);

        try {
            const response = await api.post(`users/${user.user_id}/parse_resume/`, uploadPayload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const parsedData = response.data;

            setFormData(prev => ({
                ...prev,
                profile: {
                    ...prev.profile,
                    skills: prev.profile.skills 
                        ? Array.from(new Set([...prev.profile.skills.split(', '), ...parsedData.skills.split(', ')])).filter(Boolean).join(', ')
                        : parsedData.skills,
                    experience_years: Math.max(prev.profile.experience_years, parsedData.experience_years),
                    experiences: [...prev.profile.experiences, ...parsedData.experiences],
                    education: [...prev.profile.education, ...parsedData.education],
                    projects: [...prev.profile.projects, ...parsedData.projects]
                }
            }));

            // Automatically expand all sections so the user sees the extracted results immediately
            setOpenSections({
                identity: true,
                techStack: true,
                experience: true,
                education: true,
                projects: true
            });

            setMessage({ type: 'success', text: 'Document extracted successfully! Review auto-populated data below.' });
        } catch (err) {
            console.error("Parsing extraction failed:", err);
            const errorMessage = err.response?.data?.detail || 'Failed to read document text. Please check the file structure.';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsParsing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });
        
        try {
            await api.patch(`users/${user.user_id}/`, formData);
            setMessage({ type: 'success', text: 'Professional profile saved successfully!' });
        } catch (err) { 
            setMessage({ type: 'error', text: 'Failed to update profile. Please verify your entries.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '20px', fontWeight: '500' }}>Loading developer onboarding portal...</p>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const score = calculateCompleteness();

    // Reusable Accordion Header Styling
    const accordionHeaderStyle = (isOpen) => ({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 25px',
        background: isOpen ? 'var(--code-bg)' : 'var(--card-bg)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background 0.2s ease',
        borderBottom: isOpen ? '1px solid var(--border)' : 'none'
    });

    return (
        <div style={{ padding: 'clamp(24px, 4vw, 48px) clamp(24px, 6vw, 64px)', maxWidth: '1600px', width: '100%', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
            
            {/* Header section with inline Parser Toggle */}
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px' }}>
                        Developer <span style={{ color: 'var(--accent)' }}>Onboarding</span>
                    </h1>
                    <p style={{ color: 'var(--text)', margin: 0, fontSize: '1.05rem' }}>
                        Provide your professional background. Detailed profiles allow our platform to perfectly align you with elite roles.
                    </p>
                </div>

                {/* 🚨 PARSER TOGGLE TRIGGER */}
                <button 
                    type="button"
                    onClick={() => setShowParser(!showParser)}
                    style={{ 
                        background: showParser ? 'var(--code-bg)' : 'var(--accent)', 
                        color: showParser ? 'var(--text-h)' : '#fff', 
                        border: showParser ? '1px solid var(--border)' : 'none', 
                        padding: '10px 20px', 
                        borderRadius: '20px', 
                        fontWeight: '800', 
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: showParser ? 'none' : '0 6px 15px var(--accent-bg)'
                    }}
                >
                    {showParser ? '✕ Close Extractor' : '⚡ Open AI Extractor'}
                </button>
            </div>

                {/* DYNAMIC PROFILE METER */}
                <div style={{ background: 'var(--card-bg)', padding: '20px 25px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-h)', fontSize: '0.95rem' }}>Profile Completeness Strength</span>
                        <span style={{ 
                            background: score === 100 ? 'var(--highlight-bg)' : 'var(--accent-bg)', 
                            color: score === 100 ? 'var(--highlight)' : 'var(--accent)', 
                            padding: '4px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '0.9rem' 
                        }}>
                            {score}% {score === 100 ? 'Complete' : 'In Progress'}
                        </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--code-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${score}%`, height: '100%', 
                            background: score === 100 ? 'var(--highlight)' : 'var(--accent)', 
                            borderRadius: '4px', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
                        }} />
                    </div>
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

            {/* --- INTERACTIVE RESUME DROPZONE --- */}
            {showParser && (
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{ 
                        background: isDragOver ? 'var(--accent-bg)' : 'var(--card-bg)', 
                        padding: 'clamp(30px, 5vw, 50px)', borderRadius: '24px', marginBottom: '40px', 
                        border: isDragOver ? '2px dashed var(--accent)' : '2px dashed var(--border)', 
                        textAlign: 'center', transition: 'all 0.2s ease', cursor: 'pointer',
                        boxShadow: isDragOver ? '0 0 20px var(--accent-bg)' : 'none',
                        animation: 'slideDown 0.3s ease-out'
                    }}
                    onClick={() => !isParsing && document.getElementById('turing-resume-upload').click()}
                >
                {isParsing ? (
                    <div style={{ color: 'var(--text-h)', padding: '10px 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '15px', animation: 'pulse 1.2s infinite' }}>⚡📄</div>
                        <h3 style={{ marginBottom: '10px', fontWeight: '800' }}>Reading Your Document...</h3>
                        <p style={{ color: 'var(--text)', fontSize: '0.95rem', maxWidth: '450px', margin: '0 auto' }}>
                            Automatically pulling your past roles, core skills, and education history into the form below.
                        </p>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '3rem', marginBottom: '15px', transform: isDragOver ? 'translateY(-5px)' : 'none', transition: 'transform 0.2s ease' }}>☁️</div>
                        <h3 style={{ color: 'var(--text-h)', marginBottom: '8px', fontWeight: '800', fontSize: '1.4rem' }}>
                            {isDragOver ? 'Drop Document Here' : 'Upload Your Resume / CV'}
                        </h3>
                        <p style={{ color: 'var(--text)', fontSize: '0.95rem', marginBottom: '25px', maxWidth: '500px', margin: '0 auto 25px auto' }}>
                            Drag and drop your PDF or DOCX file. We will pre-fill your experience history to save you time.
                        </p>
                        <span style={{ 
                            background: 'var(--text-h)', color: '#fff', padding: '12px 32px', 
                            borderRadius: '30px', fontWeight: '700', fontSize: '0.95rem',
                            display: 'inline-block', transition: 'background 0.2s ease'
                        }}>
                            Browse Local Files
                        </span>
                        <input id="turing-resume-upload" type="file" accept=".pdf,.docx" onChange={handleFileSelect} style={{ display: 'none' }} />
                    </div>
                )}
                </div>
            )}
            
            {/* Main Details Form - Form sections are now clean collapsible dropdowns */}
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                
                {/* ACCORDION 1: Personal Details */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                    <div 
                        style={accordionHeaderStyle(openSections.identity)}
                        onClick={() => toggleSection('identity')}
                    >
                        <h3 style={{ color: 'var(--text-h)', margin: 0, fontSize: '1.15rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ background: 'var(--bg)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--accent)' }}>01</span> 
                            Personal Information & Links
                        </h3>
                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text)', transform: openSections.identity ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▼</span>
                    </div>

                    {openSections.identity && (
                        <div style={{ padding: '30px', borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>First Name</label>
                                    <input type="text" name="first_name" className="custom-input" placeholder="e.g. David" value={formData.first_name} onChange={handleBaseChange} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Last Name</label>
                                    <input type="text" name="last_name" className="custom-input" placeholder="e.g. Aliyu" value={formData.last_name} onChange={handleBaseChange} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Phone Number</label>
                                    <input type="text" name="phone_number" className="custom-input" placeholder="+234..." value={formData.phone_number} onChange={handleBaseChange} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>City, Country</label>
                                    <input type="text" name="location" className="custom-input" placeholder="e.g. Abuja, Nigeria" value={formData.location} onChange={handleBaseChange} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>LinkedIn Profile</label>
                                    <input type="url" name="linkedin_url" className="custom-input" placeholder="https://linkedin.com/in/..." value={formData.profile.linkedin_url} onChange={handleProfileChange} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>GitHub / Code Repository</label>
                                    <input type="url" name="github_url" className="custom-input" placeholder="https://github.com/..." value={formData.profile.github_url} onChange={handleProfileChange} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Personal Portfolio Website</label>
                                    <input type="url" name="portfolio_url" className="custom-input" placeholder="https://..." value={formData.profile.portfolio_url} onChange={handleProfileChange} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ACCORDION 2: Technical Expertise */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                    <div 
                        style={accordionHeaderStyle(openSections.techStack)}
                        onClick={() => toggleSection('techStack')}
                    >
                        <h3 style={{ color: 'var(--text-h)', margin: 0, fontSize: '1.15rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ background: 'var(--bg)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--accent)' }}>02</span> 
                            Technical Competency
                        </h3>
                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text)', transform: openSections.techStack ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▼</span>
                    </div>

                    {openSections.techStack && (
                        <div style={{ padding: '30px', borderTop: '1px solid var(--border)' }}>
                            <div style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Core Skills & Technologies (Comma Separated)</label>
                                <textarea 
                                    name="skills" 
                                    className="custom-input" 
                                    placeholder="e.g., React Native, Python, FastAPI, Node.js, TypeScript, PostgreSQL, Mobile Development"
                                    value={formData.profile.skills} 
                                    onChange={handleProfileChange} 
                                    style={{ minHeight: '100px', resize: 'vertical' }} 
                                    required 
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Total Years of Experience</label>
                                    <input type="number" name="experience_years" className="custom-input" min="0" value={formData.profile.experience_years} onChange={handleProfileChange} required />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Preferred Employment Type</label>
                                    <select name="preferred_job_type" className="custom-input custom-select" value={formData.profile.preferred_job_type} onChange={handleProfileChange}>
                                        <option value="FULL_TIME">Full-Time Dedicated</option>
                                        <option value="PART_TIME">Part-Time / Flexible</option>
                                        <option value="REMOTE">Remote Enterprise</option>
                                        <option value="CONTRACT">Contract / Project Basis</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className="form-label" style={{ fontWeight: '600', color: 'var(--text-h)', fontSize: '0.85rem' }}>Target Work Region</label>
                                    <input type="text" name="preferred_location" className="custom-input" placeholder="e.g. Remote Worldwide, Nigeria" value={formData.profile.preferred_location} onChange={handleProfileChange} required />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ACCORDION 3: Modular Work History */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                    <div 
                        style={accordionHeaderStyle(openSections.experience)}
                        onClick={() => toggleSection('experience')}
                    >
                        <h3 style={{ color: 'var(--text-h)', margin: 0, fontSize: '1.15rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ background: 'var(--bg)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--accent)' }}>03</span> 
                            Professional Experience ({formData.profile.experiences.length})
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); addArrayItem('experiences', { job_title: '', company: '', dates: '', description: '' }); }}
                                style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: '15px', fontWeight: '800', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                + Add
                            </button>
                            <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text)', transform: openSections.experience ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▼</span>
                        </div>
                    </div>

                    {openSections.experience && (
                        <div style={{ padding: '30px', borderTop: '1px solid var(--border)' }}>
                            {formData.profile.experiences.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                                    <p style={{ color: 'var(--text)', margin: 0, fontSize: '0.95rem' }}>No past experience added yet. Upload your resume above or add past roles manually.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {formData.profile.experiences.map((exp) => (
                                        <div key={exp.id} style={{ background: 'var(--bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border)', display: 'grid', gap: '15px', position: 'relative' }}>
                                            <button 
                                                type="button" 
                                                onClick={() => removeArrayItem('experiences', exp.id)}
                                                style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--code-bg)', border: 'none', color: '#ef4444', width: '30px', height: '30px', borderRadius: '50%', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Remove role"
                                            >
                                                ×
                                            </button>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '15px', paddingRight: '35px' }}>
                                                <input type="text" className="custom-input" placeholder="Job Title" value={exp.job_title} onChange={(e) => updateArrayItem('experiences', exp.id, 'job_title', e.target.value)} required />
                                                <input type="text" className="custom-input" placeholder="Company Name" value={exp.company} onChange={(e) => updateArrayItem('experiences', exp.id, 'company', e.target.value)} required />
                                                <input type="text" className="custom-input" placeholder="Dates (e.g. 2023 - Present)" value={exp.dates} onChange={(e) => updateArrayItem('experiences', exp.id, 'dates', e.target.value)} required />
                                            </div>
                                            <textarea 
                                                className="custom-input" 
                                                placeholder="Describe your daily responsibilities, tools utilized, and major project accomplishments..." 
                                                value={exp.description} 
                                                onChange={(e) => updateArrayItem('experiences', exp.id, 'description', e.target.value)}
                                                style={{ minHeight: '80px', resize: 'vertical' }}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ACCORDION 4: Academic Background */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                    <div 
                        style={accordionHeaderStyle(openSections.education)}
                        onClick={() => toggleSection('education')}
                    >
                        <h3 style={{ color: 'var(--text-h)', margin: 0, fontSize: '1.15rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ background: 'var(--bg)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--accent)' }}>04</span> 
                            Education ({formData.profile.education.length})
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); addArrayItem('education', { school: '', degree: '', year: '' }); }}
                                style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: '15px', fontWeight: '800', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                + Add
                            </button>
                            <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text)', transform: openSections.education ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▼</span>
                        </div>
                    </div>

                    {openSections.education && (
                        <div style={{ padding: '30px', borderTop: '1px solid var(--border)' }}>
                            {formData.profile.education.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                                    <p style={{ color: 'var(--text)', margin: 0, fontSize: '0.95rem' }}>No academic history added.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {formData.profile.education.map((edu) => (
                                        <div key={edu.id} style={{ background: 'var(--bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px', position: 'relative', paddingRight: '45px' }}>
                                            <input type="text" className="custom-input" placeholder="School / University" value={edu.school} onChange={(e) => updateArrayItem('education', edu.id, 'school', e.target.value)} required />
                                            <input type="text" className="custom-input" placeholder="Degree / Certificate" value={edu.degree} onChange={(e) => updateArrayItem('education', edu.id, 'degree', e.target.value)} required />
                                            <input type="text" className="custom-input" placeholder="Graduation Year" value={edu.year} onChange={(e) => updateArrayItem('education', edu.id, 'year', e.target.value)} required />
                                            <button 
                                                type="button" 
                                                onClick={() => removeArrayItem('education', edu.id)}
                                                style={{ position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#ef4444', fontWeight: '800', cursor: 'pointer', fontSize: '1.4rem' }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ACCORDION 5: Portfolio Projects */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                    <div 
                        style={accordionHeaderStyle(openSections.projects)}
                        onClick={() => toggleSection('projects')}
                    >
                        <h3 style={{ color: 'var(--text-h)', margin: 0, fontSize: '1.15rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ background: 'var(--bg)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--accent)' }}>05</span> 
                            Featured Portfolio Projects ({formData.profile.projects.length})
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); addArrayItem('projects', { title: '', link: '', description: '' }); }}
                                style={{ background: 'var(--code-bg)', color: 'var(--text-h)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: '15px', fontWeight: '800', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                + Add
                            </button>
                            <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text)', transform: openSections.projects ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▼</span>
                        </div>
                    </div>

                    {openSections.projects && (
                        <div style={{ padding: '30px', borderTop: '1px solid var(--border)' }}>
                            {formData.profile.projects.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                                    <p style={{ color: 'var(--text)', margin: 0, fontSize: '0.95rem' }}>Listing major applications or personal builds helps companies understand what you can create.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {formData.profile.projects.map((proj) => (
                                        <div key={proj.id} style={{ background: 'var(--bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border)', display: 'grid', gap: '15px', position: 'relative' }}>
                                            <button 
                                                type="button" 
                                                onClick={() => removeArrayItem('projects', proj.id)}
                                                style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--code-bg)', border: 'none', color: '#ef4444', width: '30px', height: '30px', borderRadius: '50%', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                ×
                                            </button>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px', paddingRight: '35px' }}>
                                                <input type="text" className="custom-input" placeholder="Project Name" value={proj.title} onChange={(e) => updateArrayItem('projects', proj.id, 'title', e.target.value)} required />
                                                <input type="url" className="custom-input" placeholder="Live Demo or Source Code URL" value={proj.link} onChange={(e) => updateArrayItem('projects', proj.id, 'link', e.target.value)} />
                                            </div>
                                            <textarea 
                                                className="custom-input" 
                                                placeholder="Briefly explain what the application does, what libraries you used, and problems you solved..." 
                                                value={proj.description} 
                                                onChange={(e) => updateArrayItem('projects', proj.id, 'description', e.target.value)}
                                                style={{ minHeight: '80px', resize: 'vertical' }}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Final Commit Flow */}
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
                    <button 
                        type="submit" 
                        disabled={isSaving || isParsing}
                        style={{ 
                            padding: '16px 48px', background: (isSaving || isParsing) ? 'var(--border)' : 'var(--accent)', 
                            color: (isSaving || isParsing) ? 'var(--text)' : '#fff', border: 'none', 
                            borderRadius: '30px', cursor: (isSaving || isParsing) ? 'not-allowed' : 'pointer', 
                            fontWeight: '800', fontSize: '1.1rem',
                            boxShadow: (isSaving || isParsing) ? 'none' : '0 10px 25px var(--accent-bg)', 
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => { if (!isSaving && !isParsing) e.target.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={(e) => { if (!isSaving && !isParsing) e.target.style.transform = 'translateY(0)'; }}
                    >
                        {isSaving ? 'Saving Profile Details...' : 'Complete Professional Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;