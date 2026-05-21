import { useContext } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Helper to dynamically style active navigation links
    const navLinkStyle = (path) => {
        const isActive = location.pathname === path;
        return {
            color: isActive ? 'var(--accent)' : 'var(--text)',
            fontWeight: isActive ? '700' : '500',
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '20px',
            background: isActive ? 'var(--accent-bg)' : 'transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.95rem'
        };
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'var(--bg)', 
            display: 'flex', 
            flexDirection: 'column' 
        }}>
            {/* --- TOP STICKY NAVBAR --- */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'var(--card-bg)',
                borderBottom: '1px solid var(--border)',
                padding: '0 clamp(20px, 5vw, 40px)',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.3s ease'
            }}>
                
                {/* LEFT SIDE: Brand & Primary Candidate Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                    {/* Platform Brand Logo */}
                    <Link to="/jobs" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                            background: 'var(--text-h)', 
                            color: '#fff', 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '12px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: '900',
                            fontSize: '1.2rem',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}>
                            ▲
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '1.3rem', color: 'var(--text-h)', letterSpacing: '-0.5px' }}>
                            Talent<span style={{ color: 'var(--accent)' }}>Engine</span>
                        </span>
                    </Link>

                    {/* Primary Navigation Center */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Link to="/jobs" style={navLinkStyle('/jobs')}>Job Board</Link>
                        <Link to="/recommendations" style={navLinkStyle('/recommendations')}>AI Matches</Link>
                        <Link to="/applications" style={navLinkStyle('/applications')}>My Applications</Link>
                        <Link to="/profile" style={navLinkStyle('/profile')}>My Profile</Link>
                    </nav>
                </div>

                {/* RIGHT SIDE: Recruiter Tools, Identity & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    
                    {/* 🚨 RECRUITER CONDITIONAL LINK: Clean button distinct from dev links */}
                    {user?.is_staff && (
                        <Link 
                            to="/create-job" 
                            style={{
                                background: location.pathname === '/create-job' ? 'var(--accent)' : 'var(--code-bg)',
                                color: location.pathname === '/create-job' ? '#fff' : 'var(--text-h)',
                                border: location.pathname === '/create-job' ? 'none' : '1px dashed var(--accent)',
                                padding: '10px 20px',
                                borderRadius: '25px',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: location.pathname === '/create-job' ? '0 6px 15px var(--accent-bg)' : 'none'
                            }}
                            onMouseOver={(e) => { 
                                if (location.pathname !== '/create-job') {
                                    e.target.style.background = 'var(--accent-bg)';
                                    e.target.style.color = 'var(--accent)';
                                }
                            }}
                            onMouseOut={(e) => { 
                                if (location.pathname !== '/create-job') {
                                    e.target.style.background = 'var(--code-bg)';
                                    e.target.style.color = 'var(--text-h)';
                                }
                            }}
                        >
                            <span>⚡</span> Create Job
                        </Link>
                    )}

                    {/* User Profile Pill & Logout Container */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        paddingLeft: '15px', 
                        borderLeft: '2px solid var(--code-bg)' 
                    }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-h)', lineHeight: '1.1' }}>
                                {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                            </div>
                            <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '800', 
                                color: user?.is_staff ? 'var(--accent)' : 'var(--text)', 
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px' 
                            }}>
                                {user?.is_staff ? 'Staff' : 'Developer'}
                            </span>
                        </div>

                        {/* Interactive Avatar / Logout Trigger */}
                        <button 
                            onClick={handleLogout}
                            title="Sign out of platform"
                            style={{ 
                                width: '42px', 
                                height: '42px', 
                                borderRadius: '50%', 
                                background: 'var(--accent-bg)', 
                                border: '2px solid var(--accent)', 
                                color: 'var(--accent)', 
                                fontWeight: '700', 
                                fontSize: '1rem', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                transition: 'all 0.2s ease' 
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#ef4444';
                                e.currentTarget.style.borderColor = '#ef4444';
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.textContent = '✕';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'var(--accent-bg)';
                                e.currentTarget.style.borderColor = 'var(--accent)';
                                e.currentTarget.style.color = 'var(--accent)';
                                e.currentTarget.textContent = user?.username ? user.username[0].toUpperCase() : 'U';
                            }}
                        >
                            {user?.username ? user.username[0].toUpperCase() : 'U'}
                        </button>
                    </div>

                </div>
            </header>

            {/* --- MAIN CONTENT CANVAS --- */}
            {/* The page containers naturally expand to fit this clean space underneath */}
            <main style={{ 
                flexGrow: 1, 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column' 
            }}>
                <Outlet />
            </main>
            
        </div>
    );
};

export default Layout;