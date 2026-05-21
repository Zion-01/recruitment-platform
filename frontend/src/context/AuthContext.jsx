import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Check if the user is already logged in when the app loads
    useEffect(() => {
        const token = localStorage.getItem('access');
        if (token) {
            try {
                const decodedUser = jwtDecode(token);
                setUser(decodedUser);
            } catch (error) {
                console.error("Invalid token");
                logout();
            }
        }
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('token/', { username, password });
            localStorage.setItem('access', response.data.access);
            localStorage.setItem('refresh', response.data.refresh);
            
            // Decode the JWT to get the user's ID and details
            const decodedUser = jwtDecode(response.data.access);
            setUser(decodedUser);
            return true;
        } catch (error) {
            console.error("Login failed:", error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;