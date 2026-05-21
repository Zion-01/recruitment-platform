import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import JobBoard from './pages/JobBoard';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';
import CreateJob from './pages/CreateJob';
import Applications from './pages/Applications';

const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* 1. Explicit Public Routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* 2. Pathless Protected Layout Route */}
                    {/* Notice there is no path="/" here anymore! */}
                    <Route element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        {/* These routes inherit the Layout and the Protection */}
                        <Route path="/jobs" element={<JobBoard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/recommendations" element={<Recommendations />} />
                        <Route path="/create-job" element={<CreateJob />} />
                        <Route path="/applications" element={<Applications />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;