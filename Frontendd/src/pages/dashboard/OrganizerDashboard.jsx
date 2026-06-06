import React, { useEffect, useState, useCallback, useRef } from 'react';
import CountdownTimer from '../../components/CountdownTimer';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Plus, Upload, Tag, Search, TrendingUp, IndianRupee, Clock, CheckCircle, XCircle, AlertCircle, Download, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CoOrganizerPanel from '../../components/CoOrganizerPanel';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import toast from "react-hot-toast";

import { API_BASE_URL } from '../../config';
// Manual Check-In: helper debounce delay
const SEARCH_DEBOUNCE_MS = 150;

export default function OrganizerDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [activeTab, setActiveTab] = useState('My Events');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [editingEventId, setEditingEventId] = useState(null);
    // Manual Check-In states
    const [participants, setParticipants] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [filterMode, setFilterMode] = useState('all'); // all | checked | pending
    const [loadingId, setLoadingId] = useState(null);
    const [manualOpen, setManualOpen] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: 'General',
        price: '',
        capacity: '',
        poster: null
    });

    const [stats, setStats] = useState({
        approved: 0,
        pending: 0,
        rejected: 0,
        totalEvents: 0,
        totalRegistrations: 0,
        byCategory: {}
    });

    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Debounce searchQuery -> debouncedQuery
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [searchQuery]);

    // Fetch participants when selectedEvent changes
    useEffect(() => {
        let cancelled = false;
        const fetchParticipants = async () => {
            if (!selectedEvent) return;
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/registrations/${selectedEvent._id}/participants`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) setParticipants(data.participants || data || []);
            } catch (err) {
                console.error('Failed to fetch participants', err);
            }
        };
        fetchParticipants();
        return () => { cancelled = true; };
    }, [selectedEvent]);

    const calculateStats = (events) => {
        const newStats = {
            approved: events.filter(e => e.status === 'approved').length,
            pending: events.filter(e => e.status === 'pending').length,
            rejected: events.filter(e => e.status === 'rejected').length,
            totalEvents: events.length,
            totalRegistrations: events.reduce((acc, curr) => acc + (curr.registrations || 0), 0),
            byCategory: {}
        };
        events.forEach(e => {
            const cat = e.category || 'Uncategorized';
            newStats.byCategory[cat] = (newStats.byCategory[cat] || 0) + 1;
        });
        if (mountedRef.current) {
            setStats(newStats);
        }
    };

    const fetchMyEvents = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');

            const res = await fetch(`${API_BASE_URL}/api/events`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok && mountedRef.current) {
                const data = await res.json();
                // Filter events where the organizer matches the current user
                // Adjust logic based on how your backend returns data (populated organizer object vs id)
                const myEvents = (data.events || []).filter(
                    e => e.organizer?._id === user?.id || e.organizer === user?.id || e.organizerId === user?.id
                );

                setEvents(myEvents);
                calculateStats(myEvents);
                // Fetch co-organized events
                try {
                    const coRes = await fetch(`${API_BASE_URL}/api/events`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (coRes.ok) {
                        const coData = await coRes.json();
                        const coEvents = (coData.events || []).filter(
                            e => e.organizer?._id !== user?.id && e.organizer !== user?.id &&
                            (e.coOrganizers || []).some(co => co._id === user?.id || co === user?.id)
                        ).map(e => ({ ...e, _isCoOrganized: true }));
                        if (coEvents.length > 0) setEvents(prev => [...prev, ...coEvents]);
                    }
                } catch (_) {}
            }
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        document.title = 'Organizer Dashboard | Event.One';
        if (user) {
            (async () => {
                await fetchMyEvents();
            })();
        }
    }, [user, fetchMyEvents]);

    const handleDownloadCSV = (eventId) => {
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

const handleDeleteEvent = async (eventId) => {
    const confirmDelete = window.confirm(
        'Are you sure you want to delete this event? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    const loadingToast = toast.loading("Deleting event...");

    try {
        const token = localStorage.getItem('token');

        const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
            setEvents(prev => prev.filter(e => e._id !== eventId));

            setStats(curr => ({
                ...curr,
                totalEvents: curr.totalEvents - 1,
            }));

            setSelectedEvent(null);

            toast.success('Event deleted successfully', {
                id: loadingToast,
            });

            fetchMyEvents();
        } else {
            toast.error('Failed to delete event', {
                id: loadingToast,
            });
        }
    } catch (error) {
        console.error("Failed to delete event", error);

        toast.error("Something went wrong", {
            id: loadingToast,
        });
    }
};

    // Handle check-in with optimistic update
    const handleCheckin = async (registrationObj) => {
        // permission check: only organizer can checkin
        const isOrganizer = selectedEvent && (selectedEvent.organizer?._id === user?.id || selectedEvent.organizer === user?.id || selectedEvent.organizerId === user?.id);
        if (!isOrganizer) {
            toast.error('You do not have permission to check in attendees for this event.');
            return;
        }

        if (loadingId === registrationObj._id) return; // prevent duplicate

        setLoadingId(registrationObj._id);

        const original = participants.map(p => ({ ...p }));
        const now = new Date();

        // optimistic
        setParticipants(prev => prev.map(p => p._id === registrationObj._id ? { ...p, checkedIn: true, checkinTime: now.toISOString() } : p));

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/registrations/${registrationObj._id}/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed');

            toast.success(`${registrationObj.name} checked in at ${now.toLocaleTimeString()}`);
        } catch (err) {
            // rollback
            setParticipants(original);
            console.error('Check-in failed', err);
            toast.error(`Failed to check in ${registrationObj.name}. Please try again.`);
        } finally {
            setLoadingId(null);
        }
    };

    const resetForm = () => {
        setEditingEventId(null);
        setFormData({
            title: '', description: '', date: '', time: '',
            location: '', category: '', price: '', capacity: '', poster: null
        });
    };

    const handleEditResubmit = (event) => {
        setEditingEventId(event._id);
        const eventDate = new Date(event.date);
        setFormData({
            title: event.title || '',
            description: event.description || '',
            date: eventDate.toISOString().split('T')[0],
            time: eventDate.toTimeString().slice(0, 5),
            location: event.location || '',
            category: event.category || '',
            price: event.price || '',
            capacity: event.capacity || '',
            poster: null,
        });
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'poster') {
            setFormData({ ...formData, poster: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

const handleCreateSubmit = async (e) => {
    e.preventDefault();

    setCreating(true);

    const loadingToast = toast.loading("Creating event...");

    try {
        const data = new FormData();

        const fullDate = new Date(`${formData.date}T${formData.time}`);

        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('date', fullDate.toISOString());
        data.append('location', formData.location);
        data.append('category', formData.category);
        data.append('price', formData.price);
        data.append('capacity', formData.capacity);

        if (formData.poster) {
            data.append('poster', formData.poster);
        }

        const token = localStorage.getItem('token');

        const res = await fetch(`${API_BASE_URL}/api/events`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: data
        });

        if (res.ok) {
            setFormData({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                category: 'General',
                price: '',
                capacity: '',
                poster: null
            });

            toast.success('Event created successfully!', {
                id: loadingToast,
            });

            fetchMyEvents();

            setActiveTab('My Events');
        } else {
            const err = await res.json();

            toast.error(err.message || 'Failed to create event', {
                id: loadingToast,
            });
        }
    } catch (error) {
        console.error("Failed to create event", error);

        toast.error("Something went wrong", {
            id: loadingToast,
        });
    } finally {
        setCreating(false);
    }
};

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
                <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleGenerateCertificate = (event) => {
    toast.success(
        `Certificate generation request received for "${event.title}"`
    );

    toast(
        "Automated certificate generation feature coming soon!"
    );
};

    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date());
    const pastEvents = events.filter(e => new Date(e.date) < new Date());

    return (
        <div className="min-h-screen bg-background text-foreground pt-24 px-4 sm:px-6 lg:px-8 font-sans selection:bg-purple-500/30 relative overflow-hidden">
            {/* Background gradient from Admin/Hero */}
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
                            Welcome back, <span className="text-purple-500">{user?.name || 'Organizer'}</span>
                        </h1>
                        <p className="text-muted-foreground mt-2 text-base">
                            Access your dashboard to manage your events and view analytics.
                        </p>
                    </div>
                    <div>
                        <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-500 text-xs font-semibold tracking-wider uppercase">
                            Organizer Dashboard
                        </span>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-8 border-b border-border">
                    <div className="flex space-x-8 overflow-x-auto no-scrollbar">
                        {['My Events', 'Past Events', 'Create New Event', 'Analytics'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab
                                    ? 'text-orange-500' // Keeping orange accent for Organizer distinction
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
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
                            {activeTab === 'My Events' && 'Your Upcoming Events'}
                            {activeTab === 'Past Events' && 'Past Events History'}
                            {activeTab === 'Create New Event' && 'Create a New Event'}
                            {activeTab === 'Analytics' && 'Performance Overview'}
                        </h2>
                        {activeTab === 'My Events' && (
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-xs font-medium rounded-full border border-purple-500/20">
                                    {upcomingEvents.length} Upcoming
                                </span>
                            </div>
                        )}
                        {activeTab === 'Past Events' && (
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-xs font-medium rounded-full border border-purple-500/20">
                                    {pastEvents.length} Past
                                </span>
                            </div>
                        )}
                    </div>



                    <AnimatePresence mode="popLayout">
                        {/* MY EVENTS TAB */}
                        {activeTab === 'My Events' && (
                            <div className="space-y-6">
                                {upcomingEvents.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center w-full h-80 border border-dashed border-border rounded-2xl"
                                    >
                                        <div className="p-4 bg-muted rounded-full mb-4">
                                            <Calendar className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium mb-2">No upcoming events found</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setActiveTab('Create New Event')}
                                        >
                                            Create your first event
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {upcomingEvents.map((event, idx) => (
                                            <motion.div
                                                key={event._id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
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
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000';
                                                                }}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                                                <Calendar className="w-8 h-8" />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-2 right-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide backdrop-blur-md border ${event.status === 'approved' ? 'bg-green-500/20 border-green-500/30 text-green-100' :
                                                                event.status === 'rejected' ? 'bg-red-500/20 border-red-500/30 text-red-100' :
                                                                    'bg-yellow-500/20 border-yellow-500/30 text-yellow-100'
                                                                }`}>
                                                                {event.status}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="text-lg font-semibold text-foreground group-hover:text-purple-500 transition-colors">
                                                                    {event.title}
                                                                    {event._isCoOrganized && (
                                                                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium align-middle">Co-organizing</span>
                                                                    )}
                                                                </h3>
                                                                <span className="flex items-center text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                                                                    <Tag className="w-3 h-3 mr-1" />
                                                                    {event.category}
                                                                </span>
                                                            </div>
                                                            <p className="text-muted-foreground text-sm mt-2 line-clamp-2 max-w-2xl">
                                                                {event.description}
                                                            </p>
                                                            {event.status === 'rejected' && event.rejectionReason && (
                                                                <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                                                                    Reason: {event.rejectionReason}
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                                <span className="flex items-center">
                                                                   <Calendar className="w-3 h-3 mr-1.5" />
                                                                    {new Date(event.date).toLocaleDateString()}
                                                                </span>
                                                                <CountdownTimer eventDate={event.date} />
                                                                <span className="flex items-center">
                                                                    <MapPin className="w-3 h-3 mr-1.5" />
                                                                    {event.location}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    <Users className="w-3 h-3 mr-1.5" />
                                                                    {event.registrations || 0} / {event.capacity}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    <IndianRupee className="w-3 h-3 mr-1.5" />
                                                                    {event.price > 0 ? `₹${event.price}` : 'Free'}
                                                                </span>
                                                            </div>
                                                            {event.status === 'rejected' && (
                                                                <div className="mt-3 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                                                    <div>
                                                                        <p className="text-sm font-medium text-red-500">Event Rejected</p>
                                                                        {event.rejectionReason ? (
                                                                            <p className="text-xs text-red-400/80 mt-0.5">Reason: {event.rejectionReason}</p>
                                                                        ) : (
                                                                            <p className="text-xs text-red-400/80 mt-0.5">No specific reason was provided. Please contact the admin for more details.</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {event.tags?.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-3">
                                                                {event.tags.map((tag) => (
                                                                    <button
                                                                        key={tag}
                                                                        type="button"
                                                                        onClick={() => navigate(`/?tags=${tag}`)}
                                                                        className="text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded-full hover:bg-purple-500/20 transition"
                                                                    >
                                                                        #{tag}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}

                                                        
                                                        {/* Management Actions */}
                                                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
                                                            {event.status === 'approved' && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                                                    onClick={() => navigate(`/organizer/scan/${event._id}`)}
                                                                >
                                                                    Scan QR
                                                                </Button>
                                                            )}

                                                            {event.status === 'rejected' && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-red-600 text-white hover:bg-red-700"
                                                                    onClick={() => handleEditResubmit(event)}
                                                                >
                                                                    Edit & Resubmit
                                                                </Button>
                                                            )}

                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                                                                onClick={() => setSelectedEvent(event)}
                                                            >
                                                                Manage Event
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

                        {/* PAST EVENTS TAB */}
                        {activeTab === 'Past Events' && (
                            <div className="space-y-6">
                                {pastEvents.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center w-full h-80 border border-dashed border-border rounded-2xl"
                                    >
                                        <div className="p-4 bg-muted rounded-full mb-4">
                                            <Calendar className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium mb-2">No past events found</p>
                                    </motion.div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {pastEvents.map((event, idx) => (
                                            <motion.div
                                                key={event._id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group relative bg-card border border-border rounded-2xl p-4 hover:border-purple-500/50 transition-colors shadow-sm opacity-80 hover:opacity-100"
                                            >
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    {/* Poster */}
                                                    <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0 bg-muted relative grayscale group-hover:grayscale-0 transition-all">
                                                        {event.posterUrl ? (
                                                            <img
                                                                src={event.posterUrl}
                                                                alt={event.title}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000';
                                                                }}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                                                <Calendar className="w-8 h-8" />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-2 right-2">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide backdrop-blur-md border bg-secondary/50 text-muted-foreground">
                                                                Completed
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="text-lg font-semibold text-foreground group-hover:text-purple-500 transition-colors">
                                                                    {event.title}
                                                                </h3>
                                                                <span className="flex items-center text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                                                                    <Tag className="w-3 h-3 mr-1" />
                                                                    {event.category}
                                                                </span>
                                                            </div>
                                                            <p className="text-muted-foreground text-sm mt-2 line-clamp-2 max-w-2xl">
                                                                {event.description}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                                <span className="flex items-center">
                                                                    <Calendar className="w-3 h-3 mr-1.5" />
                                                                    {new Date(event.date).toLocaleDateString()}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    <Users className="w-3 h-3 mr-1.5" />
                                                                    {event.registrations || 0} Attended
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {event.tags?.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-3">
                                                                {event.tags.map((tag) => (
                                                                    <button
                                                                        key={tag}
                                                                        type="button"
                                                                        onClick={() => navigate(`/?tags=${tag}`)}
                                                                        className="text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded-full hover:bg-purple-500/20 transition"
                                                                    >
                                                                        #{tag}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Past Actions */}
                                                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleGenerateCertificate(event);
                                                                }}
                                                                className="border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                                                            >
                                                                <Download className="w-4 h-4 mr-2" />
                                                                Generate Certificates
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

                        {/* CREATE EVENT TAB */}
                        {activeTab === 'Create New Event' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-3xl mx-auto"
                            >
                                <form onSubmit={handleCreateSubmit} className="space-y-8">
                                    {editingEventId && (
                                        <div className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                                            <div>
                                                <div className="text-sm font-semibold text-red-600">Editing rejected event</div>
                                                <div className="text-xs text-red-500/80">Save changes to resubmit this event for admin review.</div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                                                onClick={resetForm}
                                            >
                                                Cancel Edit
                                            </Button>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Event Title</Label>
                                                <Input
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter event name"
                                                    required
                                                    className="bg-secondary/50 border-border"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Date</Label>
                                                    <Input
                                                        type="date"
                                                        name="date"
                                                        value={formData.date}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="bg-secondary/50 border-border"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Time</Label>
                                                    <Input
                                                        type="time"
                                                        name="time"
                                                        value={formData.time}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="bg-secondary/50 border-border"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleInputChange}
                                                    className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="General">General</option>
                                                    <option value="Tech">Tech</option>
                                                    <option value="Workshop">Workshop</option>
                                                    <option value="Sports">Sports</option>
                                                    <option value="Cultural">Cultural</option>
                                                    <option value="Arts">Arts</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Location</Label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        name="location"
                                                        value={formData.location}
                                                        onChange={handleInputChange}
                                                        placeholder="Venue address"
                                                        className="pl-9 bg-secondary/50 border-border"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Price (₹)</Label>
                                                    <Input
                                                        type="number"
                                                        name="price"
                                                        value={formData.price}
                                                        onChange={handleInputChange}
                                                        placeholder="0.00"
                                                        min="0"
                                                        className="bg-secondary/50 border-border"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Capacity</Label>
                                                    <Input
                                                        type="number"
                                                        name="capacity"
                                                        value={formData.capacity}
                                                        onChange={handleInputChange}
                                                        placeholder="Max attendees"
                                                        min="1"
                                                        className="bg-secondary/50 border-border"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Event Poster</Label>
                                                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-secondary/50 transition-colors cursor-pointer relative">
                                                    <input
                                                        type="file"
                                                        name="poster"
                                                        onChange={handleInputChange}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        accept="image/*"
                                                    />
                                                    <div className="flex flex-col items-center">
                                                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                                        <span className="text-sm text-muted-foreground">
                                                            {formData.poster ? formData.poster.name : "Click or drag to upload"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Description</Label>
                                                <Textarea
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    placeholder="Describe your event..."
                                                    className="bg-secondary/50 border-border min-h-[120px]"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            className="w-full md:w-auto min-w-[200px]"
                                            disabled={creating}
                                        >
                                            {creating ? (
                                                <>Processing...</>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    {editingEventId ? 'Resubmit Event' : 'Publish Event'}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* ANALYTICS TAB */}
                        {activeTab === 'Analytics' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="bg-card border border-border rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium text-muted-foreground">Total Events</h3>
                                            <Calendar className="w-4 h-4 text-purple-500" />
                                        </div>
                                        <div className="text-2xl font-bold">{stats.totalEvents}</div>
                                    </div>
                                    <div className="bg-card border border-border rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium text-muted-foreground">Approved</h3>
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        </div>
                                        <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
                                    </div>
                                    <div className="bg-card border border-border rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
                                            <Clock className="w-4 h-4 text-yellow-500" />
                                        </div>
                                        <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
                                    </div>
                                    <div className="bg-card border border-border rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium text-muted-foreground">Rejected</h3>
                                            <XCircle className="w-4 h-4 text-red-500" />
                                        </div>
                                        <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
                                    </div>
                                    <div className="bg-card border border-border rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium text-muted-foreground">Total Registrations</h3>
                                            <Users className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-card border border-border rounded-xl p-6">
                                        <h3 className="font-semibold mb-6 flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-purple-500" />
                                            Events by Category
                                        </h3>
                                        <div className="space-y-4">
                                            {Object.entries(stats.byCategory).map(([cat, count]) => (
                                                <div key={cat} className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">{cat}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-purple-500"
                                                                style={{ width: `${(count / stats.totalEvents) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-medium w-6 text-right">{count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {Object.keys(stats.byCategory).length === 0 && (
                                                <p className="text-muted-foreground text-sm italic">No data available yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Manage Event Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white text-black w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden relative"
                        >
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded-full z-10"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>

                            <div className="h-32 bg-muted relative">
                                {selectedEvent.posterUrl ? (
                                    <img
                                        src={selectedEvent.posterUrl}
                                        alt=""
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000';
                                        }}
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-secondary">
                                        <Calendar className="w-12 h-12 text-muted-foreground" />
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                                <div className="absolute bottom-4 left-6">
                                    <h3 className="text-2xl font-bold line-clamp-1">{selectedEvent.title}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(selectedEvent.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 bg-secondary/30 rounded-lg flex flex-col items-center justify-center text-center">
                                        <Users className="w-5 h-5 text-blue-500 mb-1" />
                                        <span className="text-2xl font-bold">{selectedEvent.registrations || 0}</span>
                                        <span className="text-xs text-muted-foreground">Registrations</span>
                                    </div>
                                    <div className="p-3 bg-secondary/30 rounded-lg flex flex-col items-center justify-center text-center">
                                        <IndianRupee className="w-5 h-5 text-green-500 mb-1" />
                                        <span className="text-2xl font-bold">{selectedEvent.price > 0 ? `₹${selectedEvent.price}` : 'Free'}</span>
                                        <span className="text-xs text-muted-foreground">Ticket Price</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                                                <Download className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">Download Participants CSV</div>
                                                <div className="text-xs text-muted-foreground">Get a list of all registered users</div>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownloadCSV(selectedEvent._id)}
                                        >
                                            Download
                                        </Button>
                                    </div>

                                    <div className="p-3 bg-secondary/20 rounded-lg border border-border/50">
                                        <CoOrganizerPanel
                                            eventId={selectedEvent._id}
                                            isOwner={selectedEvent.organizer?._id === user?.id || selectedEvent.organizer === user?.id}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/10">

                                                                            {/* Manual Check-In Panel */}
                                                                            <div className="mt-4 p-4 bg-secondary/10 rounded-lg border border-border/50">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <h4 className="font-semibold">Manual Check-In</h4>
                                                                                        <span className="text-xs text-muted-foreground">Fallback if QR fails</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="text-sm text-muted-foreground">{participants.filter(p=>p.checkedIn).length} / {participants.length} checked in</div>
                                                                                        <button
                                                                                            className="text-sm text-muted-foreground hover:text-foreground"
                                                                                            onClick={() => setManualOpen(!manualOpen)}
                                                                                        >
                                                                                            {manualOpen ? 'Hide' : 'Show'}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>

                                                                                {manualOpen && (
                                                                                    <div>
                                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                                                                            <div className="md:col-span-2">
                                                                                                <Input
                                                                                                    placeholder="Search by name or email..."
                                                                                                    value={searchQuery}
                                                                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                                                                    aria-label="Search participants"
                                                                                                />
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <button
                                                                                                    className={`px-3 py-1 rounded ${filterMode==='all'?'bg-primary text-white':'bg-secondary/50 text-muted-foreground'}`}
                                                                                                    onClick={() => setFilterMode('all')}
                                                                                                >All</button>
                                                                                                <button
                                                                                                    className={`px-3 py-1 rounded ${filterMode==='checked'?'bg-primary text-white':'bg-secondary/50 text-muted-foreground'}`}
                                                                                                    onClick={() => setFilterMode('checked')}
                                                                                                >Checked In</button>
                                                                                                <button
                                                                                                    className={`px-3 py-1 rounded ${filterMode==='pending'?'bg-primary text-white':'bg-secondary/50 text-muted-foreground'}`}
                                                                                                    onClick={() => setFilterMode('pending')}
                                                                                                >Pending</button>
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Participant list */}
                                                                                        <div className="max-h-64 overflow-auto border border-border rounded-lg">
                                                                                            <table className="w-full text-sm">
                                                                                                <thead className="bg-secondary/30 sticky top-0">
                                                                                                    <tr>
                                                                                                        <th className="text-left px-3 py-2">Name</th>
                                                                                                        <th className="text-left px-3 py-2">Email</th>
                                                                                                        <th className="text-left px-3 py-2">Status</th>
                                                                                                        <th className="text-left px-3 py-2">Check-In</th>
                                                                                                        <th className="text-left px-3 py-2">Action</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody>
                                                                                                    {(() => {
                                                                                                        const q = debouncedQuery;
                                                                                                        let list = participants || [];
                                                                                                        if (q) {
                                                                                                            list = list.filter(p => ((p.name||'').toLowerCase().includes(q) || (p.email||'').toLowerCase().includes(q)));
                                                                                                        }
                                                                                                        if (filterMode === 'checked') list = list.filter(p => p.checkedIn === true);
                                                                                                        if (filterMode === 'pending') list = list.filter(p => !p.checkedIn);
                                                                                                        if (list.length === 0) {
                                                                                                            return (
                                                                                                                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No participants</td></tr>
                                                                                                            );
                                                                                                        }
                                                                                                        return list.map(p => (
                                                                                                            <tr key={p._id} className="border-t border-border/50">
                                                                                                                <td className="px-3 py-2">{p.name}</td>
                                                                                                                <td className="px-3 py-2">{p.email}</td>
                                                                                                                <td className="px-3 py-2">{p.status || 'Registered'}</td>
                                                                                                                <td className="px-3 py-2">
                                                                                                                    {p.checkedIn ? (
                                                                                                                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded text-green-700 bg-green-100">✓ Checked In{p.checkinTime?` (${new Date(p.checkinTime).toLocaleTimeString()})`:''}</span>
                                                                                                                    ) : (
                                                                                                                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded text-yellow-800 bg-yellow-100">Pending</span>
                                                                                                                    )}
                                                                                                                </td>
                                                                                                                <td className="px-3 py-2">
                                                                                                                    {!p.checkedIn ? (
                                                                                                                        <Button
                                                                                                                            size="sm"
                                                                                                                            onClick={() => handleCheckin(p)}
                                                                                                                            disabled={loadingId === p._id || !(selectedEvent && (selectedEvent.organizer?._id === user?.id || selectedEvent.organizer === user?.id || selectedEvent.organizerId === user?.id))}
                                                                                                                        >
                                                                                                                            {loadingId === p._id ? (<span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin inline-block mr-2" />) : null}
                                                                                                                            Check In
                                                                                                                        </Button>
                                                                                                                    ) : (
                                                                                                                        <span className="text-sm text-muted-foreground">—</span>
                                                                                                                    )}
                                                                                                                </td>
                                                                                                            </tr>
                                                                                                        ));
                                                                                                    })()}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-500/10 rounded-full text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-red-500">Delete Event</div>
                                                <div className="text-xs text-red-500/70">Permanently remove this event</div>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDeleteEvent(selectedEvent._id)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
