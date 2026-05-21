import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';

const Landing = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // 1. UI & Parallax State
    const [offsetY, setOffsetY] = useState(0);
    const [previewJobs, setPreviewJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // 2. Redirect if already authenticated
    useEffect(() => {
        if (user) {
            navigate('/jobs');
        }
    }, [user, navigate]);

    // 3. Listen to scroll and fetch job previews
    useEffect(() => {
        const handleScroll = () => setOffsetY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        
        const fetchPreview = async () => {
            try {
                const res = await api.get('jobs/');
                // Take the 3 most recent roles to show on the landing page
                setPreviewJobs(res.data.slice(0, 3));
            } catch (err) {
                console.error("Failed to fetch job teaser:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', width: '100vw', fontFamily: 'var(--sans)', overflowX: 'hidden' }}>
            
            {/* Minimalist Top Navigation */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 50px', background: 'transparent', position: 'relative', zIndex: 10 }}>
                <h2 style={{ color: 'var(--text-h)', fontWeight: '800', margin: 0 }}>
                    Talent<span style={{ color: 'var(--accent)' }}>Engine</span>
                </h2>
                <div>
                    <Link to="/login" style={{ 
                        padding: '10px 24px', background: 'var(--card-bg)', color: 'var(--text-h)', 
                        textDecoration: 'none', borderRadius: '20px', fontWeight: '700', 
                        border: '1px solid var(--border)', transition: 'all 0.2s ease'
                    }}>
                        Sign In
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{ padding: '100px 20px 100px 20px', textAlign: 'center', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                
                {/* Floating Orbs Background Effect */}
                <div style={{ position: 'absolute', top: '10%', left: '-10%', width: '400px', height: '400px', background: 'rgba(255, 30, 0, 0.12)', borderRadius: '50%', filter: 'blur(80px)', animation: 'float 6s ease-in-out infinite', zIndex: 0, pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '450px', height: '450px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '50%', filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite reverse', zIndex: 0, pointerEvents: 'none' }}></div>

                {/* Parallax Container */}
                <div style={{ 
                    position: 'relative', 
                    zIndex: 1,
                    transform: `translateY(${offsetY * 0.4}px)`,
                    opacity: Math.max(1 - offsetY / 500, 0)
                }}>
                    <span className="animate-fade-1" style={{ 
                        background: 'var(--card-bg)', color: 'var(--text-h)', padding: '8px 16px', 
                        borderRadius: '20px', fontSize: '0.9em', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px',
                        border: '1px solid var(--border)', display: 'inline-block', marginBottom: '20px', boxShadow: 'var(--shadow)'
                    }}>
                        ✨ Next-Generation AI Hiring
                    </span>
                    
                    <h1 className="animate-fade-2" style={{ fontSize: '4.5rem', fontWeight: '800', color: 'var(--text-h)', lineHeight: '1.1', margin: '0 0 20px 0', letterSpacing: '-1px' }}>
                        Step Into Your Dream Role with <span style={{ 
                            background: `linear-gradient(270deg, var(--accent), #ff7b00)`, 
                            backgroundSize: '200% 200%', 
                            WebkitBackgroundClip: 'text', 
                            WebkitTextFillColor: 'transparent',
                            animation: 'gradientShift 5s ease infinite'
                        }}>Striking Confidence.</span>
                    </h1>
                    
                    <p className="animate-fade-3" style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '40px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 40px auto' }}>
                        Say farewell to manual job searches. We help you find the right roles using advanced AI techniques.
                    </p>
                    
                    <div className="animate-fade-4" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <Link to="/register" style={{ 
                            padding: '16px 40px', background: 'var(--accent)', color: '#fff', 
                            textDecoration: 'none', borderRadius: '30px', fontWeight: '800', fontSize: '1.1rem',
                            boxShadow: '0 10px 25px var(--accent-bg)', transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                            Start Your Journey
                        </Link>
                    </div>
                </div>
            </section>



            {/* Platform Features Grid (MOVED UP AND UPDATED) */}
            <section style={{ padding: '80px 50px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', maxWidth: '1200px', margin: '0 auto', background: 'var(--bg)', position: 'relative', zIndex: 3 }}>
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginBottom: '40px' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px' }}>How It Works</span>
                    <h2 style={{ fontSize: '2.8rem', color: 'var(--text-h)', fontWeight: '800', marginTop: '10px' }}>Your Journey to <span style={{ color: 'var(--accent)' }}>Success</span></h2>
                </div>
                
                <FeatureCard 
                    step="1"
                    title="Build Your AI Profile" 
                    desc="Upload your CV or input your experience. Our AI instantly extracts your core skills, experience, and professional accolades."
                />
                <FeatureCard 
                    step="2"
                    title="Intelligent Matching" 
                    desc="Our engine continuously scans our pool of jobs, where your unique profile gets you the roles you are most likely to succeed in."
                />
                <FeatureCard
                    step="3"
                    title="One-Click Applications" 
                    desc="Stop filling out repetitive forms. Apply to your best-fit roles instantly and step right into your next career move."
                />
            </section>

            {/* OPPORTUNITY TEASER SECTION (MOVED DOWN AND ENHANCED) */}
            <section style={{ 
                padding: '120px 20px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 3 
            }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>

                    <h2 style={{ fontSize: '2.8rem', color: 'var(--text-h)', fontWeight: '800', marginTop: '10px' }}>
                        Preview <span style={{ color: 'var(--accent)' }}>Jobs Available Now</span>
                    </h2>
                    <p style={{ color: 'var(--text)', fontSize: '1.1rem', maxWidth: '600px', margin: '15px auto 0 auto' }}>
                        Here are some of the jobs currently available. Sign up to see your personalized AI match scores for these roles.
                    </p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text)' }}>Scanning marketplace for jobs...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                        {previewJobs.map((job, index) => {
                            // Generate mock skills based on description or title (just for preview appeal)
                            const mockSkills = ["Leadership", "Communication", "Problem Solving"];
                            const aiScore = 90 + (index * 3); // Fake tease score
                            
                            return (
                                <div key={job.id} style={{ 
                                    background: 'var(--card-bg)', padding: '30px', borderRadius: '24px', 
                                    border: '1px solid var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                                    display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
                                    transition: 'transform 0.3s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                    
                                    {/* Top Row: Company Avatar + Match Badge */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ 
                                                width: '50px', height: '50px', borderRadius: '15px', 
                                                background: 'linear-gradient(135deg, var(--accent), #ff7b00)',
                                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.5rem', fontWeight: '900', flexShrink: 0
                                            }}>
                                                {job.company_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p style={{ color: 'var(--text-h)', fontWeight: '800', margin: 0, fontSize: '1.1rem' }}>{job.company_name}</p>
                                                <span style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: '600' }}>
                                                    📍 {job.job_location}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* AI Match Teaser Badge */}
                                        <div style={{ 
                                            background: 'rgba(255, 123, 0, 0.1)', color: 'var(--accent)', 
                                            padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800',
                                            display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
                                        }}>
                                            ✨ {aiScore}% Match
                                        </div>
                                    </div>
                                    
                                    <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-h)', fontSize: '1.4rem', fontWeight: '800' }}>
                                        {job.job_title}
                                    </h3>
                                    
                                    <p style={{ 
                                        color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.6', flexGrow: 1,
                                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                        marginBottom: '20px'
                                    }}>
                                        {job.job_description}
                                    </p>

                                    {/* Skill Pills */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '25px' }}>
                                        {mockSkills.map((skill, i) => (
                                            <span key={i} style={{ 
                                                background: 'var(--bg)', border: '1px solid var(--border)', 
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', 
                                                fontWeight: '700', color: 'var(--text)'
                                            }}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <button 
                                        onClick={() => navigate('/register')}
                                        style={{ 
                                            width: '100%', padding: '14px', borderRadius: '15px', 
                                            background: 'transparent', border: '2px solid var(--accent)', 
                                            color: 'var(--text-h)', fontWeight: '800', cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => { e.target.style.background = 'var(--accent)'; e.target.style.color = '#fff'; }}
                                        onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-h)'; }}
                                    >
                                        Unlock Full Details
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Closing Call to Action */}
            <section style={{ padding: '120px 20px', textAlign: 'center', background: 'var(--card-bg)', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 3 }}>
                <h2 style={{ fontSize: '2.5rem', color: 'var(--text-h)', marginBottom: '20px', fontWeight: '800' }}>Ready to optimize your career?</h2>
                <p style={{ color: 'var(--text)', marginBottom: '40px', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 40px auto' }}>Join the ecosystem today and let AI find the roles that match your true potential.</p>
                <Link to="/register" style={{ 
                    padding: '16px 50px', background: 'var(--text-h)', color: 'var(--bg)', 
                    textDecoration: 'none', borderRadius: '30px', fontWeight: '800', fontSize: '1.1rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}>
                    Create Free Profile
                </Link>
            </section>
        </div>
    );
};

const FeatureCard = ({ step, title, desc }) => (
    <div style={{ 
        background: 'var(--card-bg)', padding: '40px', borderRadius: '24px', 
        boxShadow: 'var(--shadow)', border: '1px solid var(--border)', 
        position: 'relative', overflow: 'hidden', transition: 'transform 0.3s ease' 
    }}
    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
        
        <div style={{ 
            position: 'absolute', top: '-10px', right: '-10px', 
            fontSize: '8rem', fontWeight: '900', color: 'var(--code-bg)', 
            zIndex: 0, lineHeight: 1, userSelect: 'none' 
        }}>
            {step}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '1.1rem', marginBottom: '15px', display: 'block' }}>
                Step 0{step}
            </span>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-h)', marginBottom: '15px', fontWeight: '700' }}>
                {title}
            </h3>
            <p style={{ color: 'var(--text)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                {desc}
            </p>
        </div>
    </div>
);

export default Landing;