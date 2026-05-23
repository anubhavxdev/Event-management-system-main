import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
    const { user, loading } = useAuth();

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!user) {
        // Ideally redirect to login here but we'll let the protected route handle that
        return null;
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <DashboardSidebar />
            <main className="flex-1 overflow-y-auto p-8 relative">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />
                <Outlet />
            </main>
        </div>
    );
}
