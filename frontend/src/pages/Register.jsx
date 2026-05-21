import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Send the data to your Django backend to create the user
            await api.post('users/', formData);
            
            // On success, send them to the login page so they can authenticate
            alert("Account created successfully! Please log in.");
            navigate('/login');
        } catch (err) {
            console.error("Registration error:", err);
            setError("Failed to create account. That username might already be taken.");
        }
    };

    return (
        <div style={{ minHeight: '100vh', width: '100vw', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
                background: 'var(--card-bg)', padding: '50px', borderRadius: '24px', 
                boxShadow: 'var(--shadow)', width: '100%', maxWidth: '420px' 
            }}>
                <h2 style={{ margin: '0 0 10px 0', textAlign: 'center', color: 'var(--text-h)', fontSize: '1.8rem', fontWeight: '800' }}>
                    Create <span style={{ color: 'var(--accent)' }}>Account</span>
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text)', marginBottom: '30px', fontSize: '0.95rem' }}>
                    Join the AI-powered recruitment platform.
                </p>

                {error && <div style={{ color: 'var(--accent)', marginBottom: '15px', textAlign: 'center', fontWeight: '600' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <input type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} required style={inputStyle} />
                        <input type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} required style={inputStyle} />
                    </div>
                    
                    <input type="text" name="username" placeholder="Choose a Username" value={formData.username} onChange={handleChange} required style={inputStyle} />
                    <input type="password" name="password" placeholder="Create a Password" value={formData.password} onChange={handleChange} required style={inputStyle} />
                    
                    <button type="submit" style={{ 
                        background: 'var(--accent)', color: '#fff', border: 'none', padding: '14px', 
                        borderRadius: '30px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '10px',
                        transition: 'transform 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        Sign Up
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '25px', color: 'var(--text)', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '700', textDecoration: 'none' }}>Log in here</Link>
                </p>
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', 
    background: 'var(--code-bg)', color: 'var(--text-h)', outline: 'none', fontSize: '1rem', boxSizing: 'border-box'
};

export default Register;