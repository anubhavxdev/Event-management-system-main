import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Ticket, X, Download, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import {
  Link,
  useNavigate,
  useSearchParams
} from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import ConfirmationModal from "../../components/ui/confirmation-modal";
import { useDebounce } from '../../hooks/useDebounce';

import { generateCertificate } from '../../utils/generateCertificate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CATEGORIES = ['Tech', 'Sports', 'Cultural', 'Workshop', 'Music', 'Other'];

export default function CustomerDashboard() {
const { user } = useAuth();
const [registrations, setRegistrations] = useState([]);
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState('Upcoming Tickets');
const [selectedTicket, setSelectedTicket] = useState(null);
const ticketRef = useRef(null);
const mountedRef = useRef(true);
const navigate = useNavigate();

const [searchParams, setSearchParams] = useSearchParams();

const [availableEvents, setAvailableEvents] = useState([]);
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedRegistrationId, setSelectedRegistrationId] = useState(null);

const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || ''
);

const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || ''
);
const [isFetching, setIsFetching] = useState(false);  
useEffect(() => () => (mountedRef.current = false), []);
//  debounced value — API only fires 400ms after user stops typing 
const debouncedSearch = useDebounce(searchQuery, 400);

useEffect(() => {
    if (activeTab !== 'Browse Events') return;

    const next = new URLSearchParams(searchParams);

    if (debouncedSearch.trim()) {
        next.set('q', debouncedSearch.trim());
    } else {
        next.delete('q');
    }

    if (selectedCategory) {
        next.set('category', selectedCategory);
    } else {
        next.delete('category');
    }

    next.delete('page');

    if (next.toString() !== searchParams.toString()) {
        setSearchParams(next, { replace: true });
    }
}, [debouncedSearch, selectedCategory, activeTab]);

useEffect(() => {
    if (activeTab === 'Browse Events') {
        fetchAvailableEvents();
    } else {
        fetchRegistrations();
    }
}, [activeTab, searchParams.toString()]);

const fetchAvailableEvents = async () => {
    try {
        setIsFetching(true);

        const params = new URLSearchParams();

        params.set('status', 'approved');
        params.set('page', searchParams.get('page') || '1');
        params.set('limit', '12');

        const q = searchParams.get('q');
        const category = searchParams.get('category');

        if (q) params.set('q', q);
        if (category) params.set('category', category);

        const url = `${API_BASE_URL}/api/events?${params.toString()}`;

        
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error('Failed to fetch events');
        }

        const data = await res.json();

        const upcoming = (data.events || []).filter(
            (evt) => new Date(evt.date) >= new Date()
        );

        setAvailableEvents(upcoming);

    } catch (error) {
        console.error('Failed to fetch events:', error);
    } finally {
        setIsFetching(false);
        setLoading(false);
    }
};
const fetchRegistrations = async () => {
    try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/registrations/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setRegistrations(data.registrations || []);
        }
    } catch (error) {
        console.error("Failed to fetch registrations", error);
    } finally {
        setLoading(false);
    }
};

const handleRegister = async (eventId) => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/registrations/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        if (res.ok) {
            alert('Successfully registered!');
            setActiveTab('Upcoming Tickets');
        } else {
            const data = await res.json();
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error("Registration failed", error);
        alert('Something went wrong');
    }
};

const handleCancelRegistration = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(
            `${API_BASE_URL}/api/registrations/${selectedRegistrationId}/cancel`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to cancel registration");
        }

        setRegistrations((prev) =>
            prev.map((reg) =>
                reg._id === selectedRegistrationId
                    ? { ...reg, status: "cancelled" }
                    : reg
            )
        );

        setIsModalOpen(false);
        setSelectedRegistrationId(null);
        console.log("Cancelled");

    } catch (error) {
        console.error(error);
        alert('Something went wrong');
    }
};

const handleDownloadTicket = async () => {
    try {
        if (!ticketRef.current || !selectedTicket) return;

        const canvas = await html2canvas(ticketRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * (pdfWidth - 20)) / imgProps.width;

        pdf.setFontSize(20);
        pdf.setTextColor(244, 63, 94);
        pdf.text('EventOne Ticket', 15, 15);

        const maxHeight = 250;
        let finalWidth = pdfWidth - 20;
        let finalHeight = pdfHeight;

        if (pdfHeight > maxHeight) {
            const scaleFactor = maxHeight / pdfHeight;
            finalHeight = maxHeight;
            finalWidth = finalWidth * scaleFactor;
        }

        pdf.addImage(imgData, 'PNG', 10, 25, finalWidth, finalHeight);

        const safeEventName = selectedTicket.event?.title
            ?.replace(/\s+/g, '-')
            ?.replace(/[^a-zA-Z0-9-_]/g, '')
            ?.toUpperCase();

        const fileName = `ticket-${safeEventName || 'EVENT'}-${selectedTicket._id.slice(-6).toUpperCase()}.pdf`;
        pdf.save(fileName);
    } catch (error) {
        console.error('PDF generation failed:', error);
    }
};

// Hardcoded for now (same as original)
const upcomingEvents = [];
const pastEvents = [
    {
        _id: "abc12345678",
        status: "attended",
        event: {
            title: "AI Innovation Summit",
            description: "A tech conference on AI and innovation.",
            date: "2025-04-10",
            location: "Mumbai",
            category: "Technology",
        },
    },
];

if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

return (
    <div className="min-h-screen bg-background text-foreground pt-32 px-4 sm:px-6 lg:px-8 font-sans selection:bg-purple-500/30 relative overflow-hidden">
        {/* Background gradient */}
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
                        Welcome back, <span className="text-rose-500">{user?.name || 'User'}</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-base">
                        Manage your tickets and view your event history.
                    </p>
                </div>
                <div>
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold tracking-wider uppercase">
                        Customer Dashboard
                    </span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-8 border-b border-border">
                <div className="flex space-x-8 overflow-x-auto no-scrollbar">
                    {['Upcoming Tickets', 'Past Events', 'Browse Events'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab
                                ? 'text-orange-500'
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
                {/* Content Header */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-semibold text-foreground">
                        {activeTab === 'Upcoming Tickets' ? 'Your Upcoming Tickets' : activeTab === 'Past Events' ? 'Event History' : 'Browse Events'}
                    </h2>
                    {activeTab === 'Upcoming Tickets' && (
                        <span className="px-3 py-1 bg-rose-500/10 text-rose-500 text-xs font-medium rounded-full border border-rose-500/20">
                            {upcomingEvents.filter(event => event.status !== "cancelled").length} Active
                        </span>
                    )}
                    {activeTab === 'Past Events' && (
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-xs font-medium rounded-full border border-purple-500/20">
                            {pastEvents.length} Past
                        </span>
                    )}
                </div>

                {/* Content Body */}
                <AnimatePresence mode="popLayout">

                    {/* ── Upcoming Tickets tab (unchanged) ───────────────────────────── */}
                    {activeTab === 'Upcoming Tickets' && (
                        <div className="space-y-6">
                            {upcomingEvents.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="w-full h-80 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center p-6"
                                >
                                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                        <Ticket className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground">No upcoming tickets</h3>
                                    <p className="text-muted-foreground mt-2 max-w-sm">
                                        You haven't registered for any upcoming events yet. Check out what's happening!
                                    </p>
                                    <Button asChild className="mt-6 bg-rose-600 hover:bg-rose-700">
                                        <Link to="/#events">Browse Events</Link>
                                    </Button>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {upcomingEvents.map((reg, idx) => (
                                        <motion.div
                                            key={reg._id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group relative bg-card border border-border rounded-2xl p-4 hover:border-rose-500/50 transition-colors shadow-sm"
                                        >
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0 bg-muted relative">
                                                    {reg.event?.posterUrl ? (
                                                        <img
                                                            src={reg.event.posterUrl}
                                                            alt={reg.event.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                                            <Calendar className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                    <span className="absolute bottom-2 left-2 text-xs text-white/90 font-medium px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded">
                                                        {reg.event?.category || 'Event'}
                                                    </span>
                                                </div>
                                                <div className="flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="text-lg font-semibold text-foreground group-hover:text-rose-500 transition-colors">
                                                                {reg.event?.title || 'Unknown Event'}
                                                            </h3>
                                                            <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full border ${reg.status === "attended"
                                                                ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                                                : reg.status === "cancelled"
                                                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                                    : "bg-green-500/10 text-green-500 border-green-500/20"
                                                                }`}>
                                                                {reg.status === "attended" ? "Attended" : reg.status === "cancelled" ? "Cancelled" : "Confirmed"}
                                                            </span>
                                                        </div>
                                                        <p className="text-muted-foreground text-sm mt-2 line-clamp-2 max-w-2xl">
                                                            {reg.event?.description}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                            <span className="flex items-center">
                                                                <Calendar className="w-3 h-3 mr-1.5" />
                                                                {reg.event?.date ? new Date(reg.event.date).toLocaleDateString() : 'TBA'}
                                                            </span>
                                                            <span className="flex items-center">
                                                                <MapPin className="w-3 h-3 mr-1.5" />
                                                                {reg.event?.location || 'TBA'}
                                                            </span>
                                                            <span className="flex items-center">
                                                                <Ticket className="w-3 h-3 mr-1.5" />
                                                                Ticket ID: {reg._id.slice(-6).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between pt-4 md:pt-0 gap-2">
                                                        {reg.status === "cancelled" ? null : (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    className="text-xs h-8 border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                                                                    onClick={() => setSelectedTicket(reg)}
                                                                >
                                                                    View Details
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    className="text-xs h-8 bg-rose-600 border-rose-500/30 text-white hover:bg-red-400"
                                                                    onClick={() => {
                                                                        setSelectedRegistrationId(reg._id);
                                                                        setIsModalOpen(true);
                                                                    }}
                                                                >
                                                                    Cancel Registration
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Past Events tab (unchanged) ────────────────────────────────── */}
                    {activeTab === 'Past Events' && (
                        <div className="space-y-6">
                            {pastEvents.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="w-full h-80 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center p-6"
                                >
                                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                        <Calendar className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground">No past events</h3>
                                    <p className="text-muted-foreground mt-2 max-w-sm">
                                        You haven't attended any past events yet.
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {pastEvents.map((reg, idx) => (
                                        <motion.div
                                            key={reg._id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group relative bg-card/60 border border-border rounded-2xl p-4 transition-colors shadow-sm opacity-75 hover:opacity-100"
                                        >
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="w-full md:w-40 h-24 rounded-xl overflow-hidden shrink-0 bg-muted grayscale group-hover:grayscale-0 transition-all">
                                                    {reg.event?.posterUrl ? (
                                                        <img src={reg.event.posterUrl} alt={reg.event.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                                            <Calendar className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="text-base font-semibold text-foreground">{reg.event?.title}</h3>
                                                        <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full border ${reg.status === 'attended'
                                                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                                            : 'bg-secondary text-muted-foreground'
                                                            }`}>
                                                            {reg.status === 'attended' ? 'Attended' : 'Completed'}
                                                        </span>
                                                    </div>
                                                    <p className="text-muted-foreground text-xs mt-1">
                                                        {reg.event?.date ? new Date(reg.event.date).toLocaleDateString() : 'TBA'} • {reg.event?.location}
                                                    </p>
                                                    {reg.status === 'attended' && (
                                                        <div className="mt-4">
                                                            <Button
                                                                onClick={() => generateCertificate({
                                                                    attendeeName: user?.name || 'Participant',
                                                                    eventTitle: reg.event?.title || 'Event',
                                                                    eventDate: reg.event?.date ? new Date(reg.event.date).toLocaleDateString() : 'TBA',
                                                                    organizerName: 'eventOne',
                                                                    registrationId: reg._id,
                                                                })}
                                                                className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                                                            >
                                                                <Download className="w-3 h-3 mr-2" />
                                                                Download Certificate
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Browse Events tab (NEW: search + category pills + loading + empty state) */}
                    {activeTab === 'Browse Events' && (
                        <div className="space-y-6">

                            {/* Search input with clear button */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search events by title or description..."
                                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Category filter pills — active one is highlighted */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedCategory('')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedCategory === ''
                                        ? 'bg-rose-500 text-white border-rose-500'
                                        : 'bg-muted/50 text-muted-foreground border-border hover:border-rose-500/50'
                                        }`}
                                >
                                    All
                                </button>
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedCategory === cat
                                            ? 'bg-rose-500 text-white border-rose-500'
                                            : 'bg-muted/50 text-muted-foreground border-border hover:border-rose-500/50'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Subtle loading spinner during debounce + fetch */}
                            {isFetching && (
                                <div className="flex justify-center py-6">
                                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {/* Empty state with Clear Filters button */}
                            {!isFetching && availableEvents.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="w-full h-80 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center p-6"
                                >
                                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                        <Calendar className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground">
                                        No events found matching your search
                                    </h3>
                                    <p className="text-muted-foreground mt-2 max-w-sm text-sm">
                                        Try a different keyword or remove the category filter.
                                    </p>
                                    <Button
                                        className="mt-6 bg-rose-600 hover:bg-rose-700 text-white text-xs"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedCategory('');
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                </motion.div>
                            )}

                            {/* Event cards grid (unchanged structure) */}
                            {!isFetching && availableEvents.length > 0 && (
                                <div className="grid grid-cols-1 gap-6">
                                    {availableEvents.map((evt, idx) => {
                                        const isRegistered = registrations.some(
                                            r => r.status === "registered" && r.event?._id === evt._id
                                        );
                                        const isEventFullBooked = evt.registeredCount === evt.capacity;

                                        return (
                                            <motion.div
                                                key={evt._id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group relative bg-card border border-border rounded-2xl p-4 hover:border-rose-500/50 transition-colors shadow-sm"
                                            >
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0 bg-muted relative">
                                                        {evt.posterUrl ? (
                                                            <img
                                                                src={evt.posterUrl}
                                                                alt={evt.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                                                <Calendar className="w-8 h-8" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                        <span className="absolute bottom-2 left-2 text-xs text-white/90 font-medium px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded">
                                                            {evt.category}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="text-lg font-semibold text-foreground group-hover:text-rose-500 transition-colors">
                                                                    {evt.title}
                                                                </h3>
                                                                <span className="inline-flex items-center text-xs px-2 py-1 rounded-full border bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                                    {evt.capacity ? `${evt.capacity} Spots` : 'Open'}
                                                                </span>
                                                            </div>
                                                            <p className="text-muted-foreground text-sm mt-2 line-clamp-2 max-w-2xl">
                                                                {evt.description}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                                <span className="flex items-center">
                                                                    <Calendar className="w-3 h-3 mr-1.5" />
                                                                    {new Date(evt.date).toLocaleDateString()}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    <MapPin className="w-3 h-3 mr-1.5" />
                                                                    {evt.location}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end pt-4 md:pt-0">
                                                            {isRegistered ? (
                                                                <Button disabled variant="success" className="text-xs h-8 bg-green-600 text-white opacity-75">
                                                                    Registered
                                                                </Button>
                                                            ) : isEventFullBooked ? (
                                                                <Button disabled variant="secondary" className="text-xs h-8">
                                                                    Fully Booked
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white"
                                                                    onClick={() => handleRegister(evt._id)}
                                                                >
                                                                    Register Now
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* Ticket Details Modal (unchanged) */}
        <AnimatePresence>
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white text-zinc-950 w-full max-w-md rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden relative"
                    >
                        <div className="h-2 bg-gradient-to-r from-rose-500 to-orange-500" />
                        <button
                            onClick={() => setSelectedTicket(null)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors p-1 hover:bg-zinc-100 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-6 bg-white">
                            <div ref={ticketRef}>
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold mb-1 text-rose-600">EventOne Ticket</h3>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Admit One</p>
                                </div>
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-start gap-4 p-3 bg-zinc-50 border border-zinc-100 rounded-lg">
                                        <div className="h-16 w-16 rounded-md overflow-hidden bg-zinc-200 shrink-0">
                                            {selectedTicket.event?.posterUrl && (
                                                <img src={selectedTicket.event.posterUrl} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm line-clamp-1">{selectedTicket.event?.title}</h4>
                                            <p className="text-xs text-zinc-500 mt-1 flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {selectedTicket.event?.date ? new Date(selectedTicket.event.date).toLocaleDateString() : 'TBA'}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5 flex items-center">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {selectedTicket.event?.location || 'TBA'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                                            <span className="text-xs text-zinc-500 block mb-1">Attendee</span>
                                            <div className="font-medium truncate">{user?.name}</div>
                                        </div>
                                        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                                            <span className="text-xs text-zinc-500 block mb-1">Ticket ID</span>
                                            <div className="font-medium font-mono text-xs">{selectedTicket._id.slice(-8).toUpperCase()}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-dashed border-zinc-300 mb-6 relative">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-[linear-gradient(to_right,transparent_50%,#000_50%)] bg-[size:10px_10px]" />
                                    {selectedTicket.qrCodeDataUrl ? (
                                        <img src={selectedTicket.qrCodeDataUrl} alt="Ticket QR Code" className="w-48 h-48 object-contain" />
                                    ) : (
                                        <div className="w-48 h-48 flex items-center justify-center bg-zinc-100 text-zinc-400 text-xs">
                                            QR Code Unavailable
                                        </div>
                                    )}
                                    <p className="text-[10px] text-zinc-500 mt-2 font-mono">SCAN AT ENTRANCE</p>
                                </div>
                            </div>
                            <Button onClick={handleDownloadTicket} className="w-full bg-rose-600 hover:bg-rose-700 text-white">
                                <Download className="w-4 h-4 mr-2" />
                                Download / Print Ticket
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        <ConfirmationModal
            isOpen={isModalOpen}
            onClose={() => {
                setIsModalOpen(false);
                setSelectedRegistrationId(null);
            }}
            onConfirm={handleCancelRegistration}
            title="Cancel Registration"
            message="Are you sure you want to cancel your registration? This action cannot be undone."
        />
    </div>
);
}
