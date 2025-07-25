'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            if (typeof window === 'undefined') {
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('auth_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await api.get('/user');
                setUser(data);
            } catch (error) {
                console.error('Failed to fetch user:', error);
                localStorage.removeItem('auth_token');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const login = async ({ email, password }) => {
        try {
            const { data } = await api.post('/login', { email, password });
            
            console.log('Login successful:', data); 
            
            localStorage.setItem('auth_token', data.token);
            setUser(data.user);
            router.push('/dashboard');
        } catch (error) {
            console.error('Login failed:', error.response?.data || error.message);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
            }
            setUser(null);
            router.push('/');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);