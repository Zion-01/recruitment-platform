import axios from 'axios';

// Create a custom Axios instance
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/', // Your Django API URL
});

// The Interceptor: Automatically attaches the token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;