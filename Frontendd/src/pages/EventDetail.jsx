import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Ticket, Clock, IndianRupee, Users, Tag, ChevronLeft, CalendarPlus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import GalleryLightbox from '../components/GalleryLightbox';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [event, setEvent] = useState(null);
    const [registrationsCount, setRegistrationsCount] = useState(0);
    const [isRegistered, setIsRegistered] = useState(false);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            // Fetch Event details
            const res = await fetch(`${API_BASE_URL}/api/events/${id}`);
            if (res.ok) {
                const data = await res.json();
                setEvent(data.event);
                setRegistrationsCount(data.registrations || 0);

                // If logged in, check if user is already registered for this event
                if (user && user.role === 'customer') {
                    const token = localStorage.getItem('token');
                    const regRes = await fetch(`${API_BASE_URL}/api/registrations/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (regRes.ok) {
                        const regData = await regRes.json();
                        const registeredList = regData.registrations || [];
                        const alreadyRegistered = registeredList.some(r => r.event?._id === id && r.status !== 'cancelled');
                        setIsRegistered(alreadyRegistered);
                    }
                }
            } else {
                console.error("Event not found");
            }
        } catch (error) {
            console.error("Failed to fetch event details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchEventDetails();
        }
    }, [id, user]);

    const handleRegister = async () => {
        if (!user) {
            alert('Please sign in to register for this event.');
            navigate('/signin');
            return;
        }

        if (user.role !== 'customer') {
            alert('Only customers can register for events.');
            return;
        }

        try {
            setRegistering(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/registrations/${id}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                alert('Successfully registered!');
                setIsRegistered(true);
                setRegistrationsCount(prev => prev + 1);
            } else {
                const data = await res.json();
                alert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error("Registration failed", error);
            alert('Something went wrong. Please try again.');
        } finally {
            setRegistering(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
                <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 px-4 text-center">
                <h1 className="text-3xl font-bold text-foreground">Event Not Found</h1>
                <p className="text-muted-foreground mt-2">The event you are looking for does not exist or has been removed.</p>
                <Button asChild className="mt-6 bg-rose-600 hover:bg-rose-700">
                    <Link to="/">Back to Home</Link>
                </Button>
            </div>
        );
    }

    const formattedDate = event.date ? new Date(event.date).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'TBA';

    const formattedTime = event.date ? new Date(event.date).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit'
    }) : 'TBA';

    const isFull = event.capacity > 0 && registrationsCount >= event.capacity;

    return (
        <div className="min-h-screen bg-background text-foreground pt-32 px-4 sm:px-6 lg:px-8 font-sans selection:bg-purple-500/30 relative overflow-hidden pb-20">
            {/* Background design elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="from-rose-500/10 via-background to-background absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]"></div>
                <div className="bg-purple-500/5 absolute top-0 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full blur-3xl"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:16px_16px] opacity-15"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Back Link */}
                <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-rose-500 transition-colors mb-8 group">
                    <ChevronLeft className="w-4 h-4 mr-1 transform group-hover:-translate-x-0.5 transition-transform" />
                    Back to browse
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Event Heading Card */}
                        <div className="space-y-4">
                            <span className="inline-flex items-center justify-center px-4 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold tracking-wider uppercase">
                                {event.category || 'General'}
                            </span>
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-muted-foreground">
                                {event.title}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                                <span className="font-semibold text-rose-500">Organized by:</span>
                                <span>{event.organizer?.name || 'eventOne'}</span>
                            </div>
                        </div>

                        {/* Grand Poster Image */}
                        <div className="w-full aspect-[21/9] sm:aspect-[16/7] rounded-3xl overflow-hidden border border-border shadow-lg relative bg-muted">
                            {event.posterUrl ? (
                                <img
                                    src={event.posterUrl}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                                    <Calendar className="w-16 h-16 text-muted-foreground/30 animate-pulse" />
                                    <p className="text-sm font-medium">Poster Image Not Uploaded</p>
                                </div>
                            )}
                        </div>

                        {/* About Event / Description */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold border-b border-border pb-2">About this Event</h2>
                            <p className="text-muted-foreground text-base leading-relaxed whitespace-pre-line">
                                {event.description}
                            </p>
                        </div>

                        {/* Photo Gallery Section */}
                        {event.gallery && event.gallery.length > 0 && (
                            <div className="space-y-6 pt-6 border-t border-border">
                                <div>
                                    <h2 className="text-2xl font-bold">Event Gallery</h2>
                                    <p className="text-sm text-muted-foreground mt-1">Snapshot previews shared by organizers.</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {event.gallery.map((url, idx) => (
                                        <motion.div
                                            key={`gallery-${idx}`}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => setLightboxIndex(idx)}
                                            className="group relative cursor-pointer aspect-square rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-rose-500/20 hover:border-rose-500/30 transition-all duration-300"
                                        >
                                            <img
                                                src={url}
                                                alt={`Event Gallery ${idx + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                                <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
                                                    View Large
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Booking & Metadata Card */}
                    <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
                        <div className="bg-card/50 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-border shadow-2xl space-y-8 relative overflow-hidden">
                            {/* Decorative background flare */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl" />

                            <div className="space-y-4 relative z-10">
                                <h3 className="text-lg font-semibold tracking-wide uppercase text-rose-500">Event Details</h3>
                                <div className="space-y-4">
                                    {/* Date */}
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date</p>
                                            <p className="text-sm font-semibold text-foreground mt-0.5">{formattedDate}</p>
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Time</p>
                                            <p className="text-sm font-semibold text-foreground mt-0.5">{formattedTime}</p>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Location</p>
                                            <p className="text-sm font-semibold text-foreground mt-0.5">{event.location}</p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500">
                                            <IndianRupee className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Price</p>
                                            <p className="text-sm font-semibold text-foreground mt-0.5">
                                                {event.price > 0 ? `₹${event.price}` : 'Free Entry'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Capacity */}
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Availability</p>
                                            <p className="text-sm font-semibold text-foreground mt-0.5">
                                                {event.capacity > 0 
                                                    ? `${registrationsCount} / ${event.capacity} Spots Booked` 
                                                    : `${registrationsCount} Registered`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Action Button */}
                            <div className="pt-4 border-t border-border relative z-10">
                                {!user || user.role === 'customer' ? (
                                    isRegistered ? (
                                        <Button disabled className="w-full bg-green-600/20 border border-green-500/30 text-green-500 opacity-90 h-12 rounded-xl text-base font-semibold">
                                            Registered & Confirmed ✓
                                        </Button>
                                    ) : isFull ? (
                                        <Button disabled className="w-full bg-secondary text-muted-foreground h-12 rounded-xl text-base font-semibold">
                                            Event Fully Booked
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleRegister}
                                            disabled={registering}
                                            className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 hover:shadow-rose-600/40 transition-all duration-300 h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2"
                                        >
                                            <CalendarPlus className="w-5 h-5" />
                                            {registering ? 'Booking spots...' : 'Register Now'}
                                        </Button>
                                    )
                                ) : (
                                    <div className="text-center p-4 bg-muted/40 rounded-xl border border-border">
                                        <p className="text-xs text-muted-foreground">
                                            Logged in as <span className="text-rose-500 font-semibold uppercase">{user.role}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Registration is only enabled for customer accounts.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Lightbox */}
            {lightboxIndex !== null && (
                <GalleryLightbox
                    images={event.gallery}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
}
