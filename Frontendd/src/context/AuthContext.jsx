import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const mountedRef = useRef(true);

    const fetchUser = async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok && mountedRef.current) {
                const userData = await response.json();
                setUser(userData.user);
            } else if (!response.ok) {
                localStorage.removeItem('token');
                if (mountedRef.current) {
                    setUser(null);
                }
            }
        } catch (error) {
            console.error('Failed to fetch user', error);
            localStorage.removeItem('token');
            if (mountedRef.current) {
                setUser(null);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        let mounted = true;

        const initializeUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                await fetchUser(token);
            } else {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initializeUser();

        return () => {
            mounted = false;
            mountedRef.current = false;
        };
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const logout = (navigate) => {
        localStorage.removeItem('token');
        setUser(null);
        if (navigate) {
        navigate('/');
        } else {
        window.location.href = '/';
        }
    };

    // Always render children, pass loading state through context
    // This prevents the app from being stuck on loading screen
    return (
        <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

