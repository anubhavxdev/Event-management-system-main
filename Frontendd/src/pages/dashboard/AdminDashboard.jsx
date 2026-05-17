import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Calendar, MapPin, Building, Shield, Users, Activity, TrendingUp, Download, Trash2, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';


import { API_BASE_URL } from '../../config';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [pendingEvents, setPendingEvents] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, totalEvents: 0, pendingCount: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Pending Reviews');
    const [allEvents, setAllEvents] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (activeTab === 'Pending Reviews') {
            fetchPendingEvents();
        } else if (activeTab === 'All Events & Management') {
            fetchAllEvents();
        } else if (activeTab === 'User Management') {
            fetchUsers();
        }
        fetchStats();
    }, [activeTab]);

    const fetchPendingEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/admin/events/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingEvents(data.events || []);
            }
        } catch (error) {
            console.error("Failed to fetch pending events", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllEvents = async () => {
        try {
            // Fetch all events for management
            const res = await fetch(`${API_BASE_URL}/api/events`); // Helper endpoint that returns all without filter if no params
            if (res.ok) {
                const data = await res.json();
                setAllEvents(data.events || []);
            }
        } catch (error) {
            console.error("Failed to fetch all events", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAllUsers(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/stats/dashboard`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    const handleAction = async (eventId, action, reason) => {
        try {
            const token = localStorage.getItem('token');
            const fetchOptions = {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            };
            // Send rejection reason in body if rejecting
            if (action === 'reject' && reason) {
                fetchOptions.headers['Content-Type'] = 'application/json';
                fetchOptions.body = JSON.stringify({ rejectionReason: reason });
            }
            const res = await fetch(`${API_BASE_URL}/api/admin/events/${eventId}/${action}`, fetchOptions);
            if (res.ok) {
                // Remove from pending
                setPendingEvents(prev => prev.filter(e => e._id !== eventId));
                // Update in allEvents if present
                if (activeTab === 'All Events & Management') {
                    fetchAllEvents(); // Refresh to show new status
                }
            }
        } catch (error) {
            console.error(`Failed to ${action} event`, error);
        }
    };

    const submitReject = () => {
        if (!rejectTarget) return;
        handleAction(rejectTarget, 'reject', rejectionReason);
        setRejectTarget(null);
        setRejectionReason('');
        setSelectedEvent(null);
    };

    const handleUserAction = async (userId, action) => {
        try {
            const token = localStorage.getItem('token');
            // Assuming endpoints like /api/admin/users/:id/block or unblock
            // Adjust endpoint based on backend routes
            const endpoint = action === 'delete' ? `${API_BASE_URL}/api/admin/users/${userId}` : `${API_BASE_URL}/api/admin/users/${userId}/${action}`;

            // For block/unblock which we saw in adminRoutes
            const method = action === 'delete' ? 'DELETE' : 'POST';

            const res = await fetch(endpoint, {
                method: method,
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error(`Failed to ${action} user`, error);
        }
    }

    const [selectedEvent, setSelectedEvent] = useState(null);

    const handleDownloadCSV = (eventId) => {
        // Direct navigation to download endpoint
        const token = localStorage.getItem('token');
        fetch(`${API_BASE_URL}/api/registrations/${eventId}/participants.csv`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `participants-${eventId}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(err => console.error("Failed to download CSV", err));
    };

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                // Optimistically update the UI or refetch
                setAllUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
            }
        } catch (error) {
            console.error("Failed to update user role", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
                <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pt-32 px-4 sm:px-6 lg:px-8 font-sans selection:bg-purple-500/30 relative overflow-hidden">
            {/* Background gradient from Home/Hero */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="from-primary/20 via-background to-background absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]"></div>
                <div className="bg-primary/5 absolute top-0 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full blur-3xl"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:16px_16px] opacity-15"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-12">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            Welcome back, <span className="text-purple-500">{user?.name || 'Admin'}</span>
                        </h1>
                        <p className="text-muted-foreground mt-2 text-base">
                            Access your dashboard to manage events and account settings.
                        </p>
                    </div>
                    <div>
                        <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-500 text-xs font-semibold tracking-wider uppercase">
                            Admin Dashboard
                        </span>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-8 border-b border-border">
                    <div className="flex space-x-8 overflow-x-auto no-scrollbar">
                        {['Pending Reviews', 'All Events & Management', 'User Management'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab
                                    ? 'text-orange-500' // Orange text
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" // Orange underline
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-6 md:p-8 min-h-[500px] border border-border shadow-sm">
                    {/* Content Header based on Tab */}
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-semibold text-foreground">
                            {activeTab === 'Pending Reviews' && 'Pending Events'}
                            {activeTab === 'All Events & Management' && 'All Events'}
                            {activeTab === 'User Management' && 'User Management'}
                        </h2>
                        {activeTab === 'Pending Reviews' && (
                            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-medium rounded-full border border-yellow-500/20">
                                {pendingEvents.length} Pending
                            </span>
                        )}
                        {activeTab === 'All Events & Management' && (
                            <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-xs font-medium rounded-full border border-purple-500/20">
                                {allEvents.length} Total
                            </span>
                        )}
                        {activeTab === 'User Management' && (
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-xs font-medium rounded-full border border-blue-500/20">
                                {allUsers.length} Users
                            </span>
                        )}
                    </div>

                    {/* Content Body */}
                    <AnimatePresence mode="popLayout">
                        {/* PENDING EVENTS TAB */}
                        {activeTab === 'Pending Reviews' && (
                            <div className="space-y-6">
                                {pendingEvents.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="w-full h-80 border border-dashed border-border rounded-2xl flex items-center justify-center"
                                    >
                                        <p className="text-muted-foreground italic text-sm">No pending events to review at the moment.</p>
                                    </motion.div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {pendingEvents.map((event, idx) => (
                                            <motion.div
                                                key={event._id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group relative bg-card border border-border rounded-2xl p-4 hover:border-purple-500/50 transition-colors shadow-sm"
                                            >
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    {/* Poster */}
                                                    <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0 bg-muted relative">
                                                        {event.posterUrl ? (
                                                            <img
                                                                src={event.posterUrl}
                                                                alt={event.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                                                <Calendar className="w-8 h-8" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                        <span className="absolute bottom-2 left-2 text-xs text-white/90 font-medium px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded">
                                                            {event.category}
                                                        </span>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="text-lg font-semibold text-foreground group-hover:text-purple-500 transition-colors">
                                                                    {event.title}
                                                                </h3>
                                                                <span className="hidden md:inline-flex items-center text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                                                                    <Users className="w-3 h-3 mr-1" />
                                                                    {event.organizer?.name || 'Unknown Organizer'}
                                                                </span>
                                                            </div>
                                                            <p className="text-muted-foreground text-sm mt-2 line-clamp-2 max-w-2xl">
                                                                {event.description}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                                <span className="flex items-center">
                                                                    <Calendar className="w-3 h-3 mr-1.5" />
                                                                    {new Date(event.date).toLocaleDateString()}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    <MapPin className="w-3 h-3 mr-1.5" />
                                                                    {event.location}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setRejectTarget(event._id)}
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-9"
                                                            >
                                                                Reject
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAction(event._id, 'approve')}
                                                                className="bg-green-600 text-white hover:bg-green-700 border-none h-9"
                                                            >
                                                                Approve
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ALL EVENTS TAB */}
                        {activeTab === 'All Events & Management' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                                        <tr>
                                            <th className="px-6 py-3">Event Name</th>
                                            <th className="px-6 py-3">Organizer</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allEvents.map((event) => (
                                            <tr key={event._id} className="bg-card border-b border-border hover:bg-secondary/20">
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
                                                            {event.posterUrl ? (
                                                                <img src={event.posterUrl} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center">
                                                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="truncate max-w-[200px]" title={event.title}>{event.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {event.organizer?.name || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {new Date(event.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize w-fit ${event.status === 'approved' ? 'bg-green-500/10 text-green-500' : event.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                            {event.status}
                                                        </span>
                                                        {event.status === 'rejected' && event.rejectionReason && (
                                                            <span className="text-[11px] text-red-400/80 italic truncate max-w-[200px]" title={event.rejectionReason}>
                                                                "{event.rejectionReason}"
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button size="sm" variant="secondary" onClick={() => setSelectedEvent(event)} className="h-8 hover:bg-purple-500/10 hover:text-purple-500 transition-colors">
                                                        Manage
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {allEvents.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground italic">
                                                    No events found in the system.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* USER MANAGEMENT TAB */}
                        {activeTab === 'User Management' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                                        <tr>
                                            <th className="px-6 py-3">User</th>
                                            <th className="px-6 py-3">Role</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allUsers.map((user) => (
                                            <tr key={user._id} className="bg-card border-b border-border hover:bg-secondary/20">
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    <div>{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                                                        className="bg-secondary/50 border-none text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-purple-500 cursor-pointer capitalize"
                                                    >
                                                        <option value="customer">Customer</option>
                                                        <option value="organizer">Organizer</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.isBlocked ? (
                                                        <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded text-xs">Blocked</span>
                                                    ) : (
                                                        <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded text-xs">Active</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className={`h-8 ${user.isBlocked ? 'text-green-500' : 'text-red-500'}`}
                                                        onClick={() => handleUserAction(user._id, user.isBlocked ? 'unblock' : 'block')}
                                                    >
                                                        {user.isBlocked ? 'Unblock' : 'Block'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Manage Event Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white text-zinc-950 w-full max-w-lg rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-zinc-900">{selectedEvent.title}</h3>
                                        <p className="text-zinc-500 text-sm mt-1">{selectedEvent.organizer?.name}</p>
                                    </div>
                                    <button onClick={() => setSelectedEvent(null)} className="text-zinc-400 hover:text-zinc-900">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center text-zinc-500">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {new Date(selectedEvent.date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center text-zinc-500">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            {selectedEvent.location}
                                        </div>
                                        <div className="flex items-center text-zinc-500 col-span-2">
                                            <Building className="w-4 h-4 mr-2" />
                                            Category: {selectedEvent.category}
                                        </div>
                                    </div>
                                    <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                        {selectedEvent.description}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Button onClick={() => handleDownloadCSV(selectedEvent._id)} className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-center">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Participants CSV
                                    </Button>
                                    <Button
                                        onClick={() => setRejectTarget(selectedEvent._id)}
                                        variant="destructive"
                                        className="w-full justify-center bg-red-600 hover:bg-red-700"
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Reject Event
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Rejection Reason Modal */}
            <AnimatePresence>
                {rejectTarget && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white text-zinc-950 w-full max-w-md rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-red-100 rounded-full">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-zinc-900">Reject Event</h3>
                                </div>
                                <p className="text-sm text-zinc-500 mb-4">
                                    Are you sure you want to reject this event? You can provide an optional reason for the organizer.
                                </p>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Rejection Reason (optional)</label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="e.g., Incomplete event details, violates community guidelines..."
                                        className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 min-h-[80px] resize-none"
                                    />
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <Button
                                        variant="ghost"
                                        onClick={() => { setRejectTarget(null); setRejectionReason(''); }}
                                        className="text-zinc-500 hover:text-zinc-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={submitReject}
                                        className="bg-red-600 text-white hover:bg-red-700 border-none"
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Confirm Rejection
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
