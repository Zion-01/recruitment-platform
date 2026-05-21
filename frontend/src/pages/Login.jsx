import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(username, password);
        if (success) navigate('/jobs');
        else alert("Invalid credentials. Please try again.");
    };

    return (
        <div style={{ minHeight: '100vh', width: '100vw', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
                background: 'var(--card-bg)', padding: '50px', borderRadius: '24px', 
                boxShadow: 'var(--shadow)', width: '100%', maxWidth: '420px' 
            }}>
                <h2 style={{ margin: '0 0 30px 0', textAlign: 'center', color: 'var(--text-h)', fontSize: '1.8rem', fontWeight: '800' }}>
                    Welcome <span style={{ color: 'var(--accent)' }}>Back</span>
                </h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <input 
                        type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required 
                        style={inputStyle}
                    />
                    <input 
                        type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required 
                        style={inputStyle}
                    />
                    <button type="submit" style={{ 
                        background: 'var(--accent)', color: 'white', border: 'none', padding: '14px', 
                        borderRadius: '30px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '10px'
                    }}>
                        Log In
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '25px', color: 'var(--text)', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: '700', textDecoration: 'none' }}>Sign up here</Link>
                </p>
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', 
    background: 'var(--code-bg)', color: 'var(--text-h)', outline: 'none', fontSize: '1rem', boxSizing: 'border-box'
};

export default Login;