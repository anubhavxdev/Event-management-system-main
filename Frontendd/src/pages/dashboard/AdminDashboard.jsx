import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Calendar, MapPin, Building, Shield, Users, Activity, TrendingUp, Download, Trash2, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';


import { API_BASE_URL } from '../../config';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [pendingEvents, setPendingEvents] = useState([]);
    const [, setStats] = useState({ totalUsers: 0, totalEvents: 0, pendingCount: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Pending Reviews');
    const [allEvents, setAllEvents] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    const [rejectingEvent, setRejectingEvent] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);
    const mountedRef = useRef(true);

    // Bulk action state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkLoading, setBulkLoading] = useState(null);
    const [bulkProgress, setBulkProgress] = useState({ action: '', completed: 0, total: 0 });
    const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
    const [bulkRejectReason, setBulkRejectReason] = useState('');

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const fetchPendingEvents = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/admin/events/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok && mountedRef.current) {
                const data = await res.json();
                setPendingEvents(data.events || []);
            }
        } catch (error) {
            console.error("Failed to fetch pending events", error);
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    const fetchAllEvents = useCallback(async () => {
        try {
            // Fetch all events for management
            const res = await fetch(`${API_BASE_URL}/api/events`); // Helper endpoint that returns all without filter if no params
            if (res.ok && mountedRef.current) {
                const data = await res.json();
                setAllEvents(data.events || []);
            }
        } catch (error) {
            console.error("Failed to fetch all events", error);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok && mountedRef.current) {
                const data = await res.json();
                setAllUsers(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/stats/dashboard`);
            if (res.ok && mountedRef.current) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            if (activeTab === 'Pending Reviews') {
                await fetchPendingEvents();
            } else if (activeTab === 'All Events & Management') {
                await fetchAllEvents();
            } else if (activeTab === 'User Management') {
                await fetchUsers();
            }
            await fetchStats();
        };

        if (mounted) {
            loadData();
        }

        return () => {
            mounted = false;
        };
    }, [activeTab, fetchPendingEvents, fetchAllEvents, fetchUsers, fetchStats]);

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


    const handleRejectEvent = async () => {
        const trimmedReason = rejectReason.trim();

        if (!rejectingEvent || trimmedReason.length < 20) {
            return;
        }

        try {
            setRejectLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/admin/events/${rejectingEvent._id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reason: trimmedReason })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.message || 'Failed to reject event');
                return;
            }

            setPendingEvents(prev => prev.filter(e => e._id !== rejectingEvent._id));
            if (activeTab === 'All Events & Management') {
                fetchAllEvents();
            }
            fetchStats();
            setRejectingEvent(null);
            setRejectReason('');
        } catch (error) {
            console.error("Failed to reject event", error);
            alert('Failed to reject event');
        } finally {
            setRejectLoading(false);
        }

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

    // --- Bulk Action Helpers ---

    const selectedCount = selectedIds.size;

    const toggleSelectId = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === pendingEvents.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pendingEvents.map(e => e._id)));
        }
    };

    const runBulkAction = async (action, extraBody = {}) => {
        const ids = [...selectedIds];
        if (ids.length === 0) return;

        setBulkLoading(action);
        setBulkProgress({ action, completed: 0, total: ids.length });

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/admin/events/bulk-${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ eventIds: ids, ...extraBody }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || `Bulk ${action} failed`);
                return;
            }

            setBulkProgress({ action, completed: data.succeeded, total: ids.length });

            if (data.failed === 0) {
                toast.success(`${data.succeeded} event${data.succeeded > 1 ? 's' : ''} ${action}${action === 'approve' ? 'd' : action === 'reject' ? 'ed' : 'd'} successfully`);
            } else {
                toast.error(`${data.succeeded} succeeded, ${data.failed} failed`);
            }

            setSelectedIds(new Set());
            fetchPendingEvents();
            fetchStats();
        } catch (error) {
            console.error(`Bulk ${action} failed`, error);
            toast.error(`Bulk ${action} failed. Please try again.`);
        } finally {
            setBulkLoading(null);
            setBulkProgress({ action: '', completed: 0, total: 0 });
        }
    };

    const handleBulkRejectSubmit = async () => {
        if (bulkRejectReason.trim().length < 20) return;
        await runBulkAction('reject', { rejectionReason: bulkRejectReason.trim() });
        setBulkRejectOpen(false);
        setBulkRejectReason('');
    };

    const handleBulkDelete = () => {
        const count = selectedIds.size;
        if (!window.confirm(`Are you sure you want to permanently delete ${count} event${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
            return;
        }
        runBulkAction('delete');
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
                                    <>
                                    {/* Select All Bar */}
                                    <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-secondary/30 border border-border mb-2">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={pendingEvents.length > 0 && selectedIds.size === pendingEvents.length}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-border accent-purple-500 cursor-pointer"
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {selectedCount > 0 ? `${selectedCount} of ${pendingEvents.length} selected` : 'Select All'}
                                            </span>
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        {pendingEvents.map((event, idx) => (
                                            <motion.div
                                                key={event._id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`group relative bg-card border rounded-2xl p-4 transition-colors shadow-sm ${
                                                    selectedIds.has(event._id)
                                                        ? 'border-purple-500 bg-purple-500/5'
                                                        : 'border-border hover:border-purple-500/50'
                                                }`}
                                            >
                                                {/* Selection Checkbox */}
                                                <div className="absolute top-3 left-3 z-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(event._id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            toggleSelectId(event._id);
                                                        }}
                                                        className="w-4 h-4 rounded border-border accent-purple-500 cursor-pointer"
                                                    />
                                                </div>
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

                                                                onClick={() => {
                                                                    setRejectingEvent(event);
                                                                    setRejectReason('');
                                                                }}

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
                                    </>
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

            {/* Floating Bulk Action Bar */}
            <AnimatePresence>
                {selectedCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-6 left-1/2 z-50 w-[95%] max-w-3xl -translate-x-1/2 rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md"
                    >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="text-sm text-foreground">
                                <span className="font-semibold">{selectedCount}</span> event{selectedCount > 1 ? 's' : ''} selected
                                {bulkLoading && (
                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        {bulkProgress.action === 'approve' && `Approving ${bulkProgress.completed} of ${bulkProgress.total}...`}
                                        {bulkProgress.action === 'reject' && `Rejecting ${bulkProgress.completed} of ${bulkProgress.total}...`}
                                        {bulkProgress.action === 'delete' && `Deleting ${bulkProgress.completed} of ${bulkProgress.total}...`}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => runBulkAction('approve')}
                                    disabled={Boolean(bulkLoading)}
                                    className="bg-green-600 text-white hover:bg-green-700"
                                >
                                    ✅ Approve Selected ({selectedCount})
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setBulkRejectOpen(true)}
                                    disabled={Boolean(bulkLoading)}
                                    className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                                >
                                    ❌ Reject Selected ({selectedCount})
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleBulkDelete}
                                    disabled={Boolean(bulkLoading)}
                                    className="border-zinc-500/30 text-zinc-400 hover:bg-zinc-500/10"
                                >
                                    🗑 Delete Selected ({selectedCount})
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedIds(new Set())}
                                    disabled={Boolean(bulkLoading)}
                                    className="text-muted-foreground"
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Reject Modal */}
            <AnimatePresence>
                {bulkRejectOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white text-zinc-950 w-full max-w-lg rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start gap-4 mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-zinc-900">Reject Selected Events</h3>
                                        <p className="text-zinc-500 text-sm mt-1">This reason will be applied to all {selectedCount} selected event{selectedCount > 1 ? 's' : ''}.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (bulkLoading) return;
                                            setBulkRejectOpen(false);
                                            setBulkRejectReason('');
                                        }}
                                        className="text-zinc-400 hover:text-zinc-900"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-zinc-800">
                                        Reason for rejection
                                    </label>
                                    <Textarea
                                        value={bulkRejectReason}
                                        onChange={(e) => setBulkRejectReason(e.target.value)}
                                        placeholder="Provide a reason for rejecting these events..."
                                        className="min-h-[140px] bg-zinc-50 border-zinc-200"
                                    />
                                    <div className={`text-xs ${bulkRejectReason.trim().length >= 20 ? 'text-green-600' : 'text-zinc-500'}`}>
                                        {bulkRejectReason.trim().length}/20 characters minimum
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setBulkRejectOpen(false);
                                            setBulkRejectReason('');
                                        }}
                                        disabled={Boolean(bulkLoading)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleBulkRejectSubmit}
                                        disabled={Boolean(bulkLoading) || bulkRejectReason.trim().length < 20}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        {bulkLoading === 'reject' ? 'Rejecting...' : `Reject ${selectedCount} Event${selectedCount > 1 ? 's' : ''}`}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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

                                        onClick={() => {
                                            setSelectedEvent(null);
                                            setRejectingEvent(selectedEvent);
                                            setRejectReason('');
                                        }}
                                        variant="outline"
                                        className="w-full justify-center border-red-500/30 text-red-600 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />

                                        Reject Event
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            <AnimatePresence>
                {rejectingEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}

                            className="bg-white text-zinc-950 w-full max-w-lg rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start gap-4 mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-zinc-900">Reject Event</h3>
                                        <p className="text-zinc-500 text-sm mt-1">{rejectingEvent.title}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (rejectLoading) return;
                                            setRejectingEvent(null);
                                            setRejectReason('');
                                        }}
                                        className="text-zinc-400 hover:text-zinc-900"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-zinc-800">
                                        Reason for rejection
                                    </label>
                                    <Textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Reason for rejection"
                                        className="min-h-[140px] bg-zinc-50 border-zinc-200"
                                    />
                                    <div className={`text-xs ${rejectReason.trim().length >= 20 ? 'text-green-600' : 'text-zinc-500'}`}>
                                        {rejectReason.trim().length}/20 characters minimum
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setRejectingEvent(null);
                                            setRejectReason('');
                                        }}
                                        disabled={rejectLoading}

                                    >
                                        Cancel
                                    </Button>
                                    <Button

                                        onClick={handleRejectEvent}
                                        disabled={rejectLoading || rejectReason.trim().length < 20}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        {rejectLoading ? 'Rejecting...' : 'Reject Event'}

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
