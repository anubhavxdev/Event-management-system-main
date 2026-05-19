import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import toast from "react-hot-toast";
import {
  Link,
  useNavigate,
  useSearchParams
} from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import ConfirmationModal from '../../components/ui/confirmation-modal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Upcoming Tickets');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const ticketRef = useRef(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [availableEvents, setAvailableEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRegistrationId, setSelectedRegistrationId] = useState(null);

    useEffect(() => {
        if (activeTab === 'Browse Events') {
            fetchAvailableEvents();
        } else {
            fetchRegistrations();
        }
    }, [activeTab, searchParams]);

    const fetchAvailableEvents = async () => {
        const tags = searchParams.get('tags');
        try {
            setLoading(true);
            let url = `${API_BASE_URL}/api/events?status=approved`;

            if (tags) {
                url += `&tags=${tags}`;
            }

    const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                // Filter events that are in the future
                const upcoming = (data.events || []).filter(evt => new Date(evt.date) >= new Date());
                setAvailableEvents(upcoming);
            }
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    };
    };


  const fetchRegistrations = useCallback(async () => {
    try {
      if (mountedRef.current) setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/registrations/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok && mountedRef.current) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (activeTab === 'Browse Events') await fetchAvailableEvents();
      else await fetchRegistrations();
    })();
  }, [activeTab, fetchAvailableEvents, fetchRegistrations]);

  const handleRegister = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/registrations/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Registered');
        setActiveTab('Upcoming Tickets');
        fetchRegistrations();
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  const handleCancelRegistration = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/registrations/${selectedRegistrationId}/cancel`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel');
      setRegistrations((prev) => prev.map((r) => (r._id === selectedRegistrationId ? { ...r, status: 'cancelled' } : r)));
      setSelectedRegistrationId(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  const handleDownloadTicket = async () => {
    try {
      if (!ticketRef.current || !selectedTicket) return;
      const canvas = await html2canvas(ticketRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
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
        const scale = maxHeight / pdfHeight;
        finalHeight = maxHeight;
        finalWidth = finalWidth * scale;
      }
      pdf.addImage(imgData, 'PNG', 10, 25, finalWidth, finalHeight);
      const safe = selectedTicket.event?.title?.replace(/\s+/g, '-')?.replace(/[^a-zA-Z0-9-_]/g, '')?.toUpperCase();
      const fileName = `ticket-${safe || 'EVENT'}-${selectedTicket._id.slice(-6).toUpperCase()}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error(err);
    }
  };

  const upcomingEvents = registrations.filter((reg) => reg.event && reg.status !== 'cancelled' && new Date(reg.event.date) >= new Date());
  const pastEvents = registrations.filter((reg) => reg.event && reg.status !== 'cancelled' && new Date(reg.event.date) < new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-32 px-4 sm:px-6 lg:px-8 font-sans selection:bg-purple-500/30 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="from-primary/20 via-background to-background absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]"></div>
        <div className="bg-primary/5 absolute top-0 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:16px_16px] opacity-15"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Welcome back, <span className="text-rose-500">{user?.name || 'User'}</span></h1>
            <p className="text-muted-foreground mt-2 text-base">Manage your tickets and view your event history.</p>
          </div>
          <div>
            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold tracking-wider uppercase">Customer Dashboard</span>
          </div>
        </div>

        <div className="mb-8 border-b border-border">
          <div className="flex space-x-8 overflow-x-auto no-scrollbar">
            {['Upcoming Tickets', 'Past Events', 'Browse Events'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab ? 'text-orange-500' : 'text-muted-foreground hover:text-foreground'}`}>
                {tab}
                {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-6 md:p-8 min-h-[500px] border border-border shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-foreground">{activeTab === 'Upcoming Tickets' ? 'Your Upcoming Tickets' : 'Event History'}</h2>
            {activeTab === 'Upcoming Tickets' && <span className="px-3 py-1 bg-rose-500/10 text-rose-500 text-xs font-medium rounded-full border border-rose-500/20">{upcomingEvents.length} Active</span>}
            {activeTab === 'Past Events' && <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-xs font-medium rounded-full border border-purple-500/20">{pastEvents.length} Past</span>}
          </div>

          <AnimatePresence mode="popLayout">
            {activeTab === 'Upcoming Tickets' && (
              <div className="space-y-6">
                {upcomingEvents.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-80 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4"><Ticket className="w-8 h-8 text-muted-foreground" /></div>
                    <h3 className="text-lg font-medium text-foreground">No upcoming tickets</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">You haven't registered for any upcoming events yet. Check out what's happening!</p>
                    <Button asChild className="mt-6 bg-rose-600 hover:bg-rose-700"><Link to="/#events">Browse Events</Link></Button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {upcomingEvents.map((reg, idx) => (
                      <motion.div key={reg._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }} className="group relative bg-card border border-border rounded-2xl p-4 hover:border-rose-500/50 transition-colors shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0 bg-muted relative">
                            {reg.event?.posterUrl ? <img src={reg.event.posterUrl} alt={reg.event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="flex items-center justify-center h-full text-muted-foreground"><Calendar className="w-8 h-8" /></div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <span className="absolute bottom-2 left-2 text-xs text-white/90 font-medium px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded">{reg.event?.category || 'Event'}</span>
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-foreground group-hover:text-rose-500 transition-colors">{reg.event?.title || 'Unknown Event'}</h3>
                                <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full border ${reg.status === 'attended' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : reg.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>{reg.status === 'attended' ? 'Attended' : reg.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}</span>
                              </div>

                              <p className="text-muted-foreground text-sm mt-2 line-clamp-2 max-w-2xl">{reg.event?.description}</p>
                              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span className="flex items-center"><Calendar className="w-3 h-3 mr-1.5" />{reg.event?.date ? new Date(reg.event.date).toLocaleDateString() : 'TBA'}</span>
                                <span className="flex items-center"><MapPin className="w-3 h-3 mr-1.5" />{reg.event?.location || 'TBA'}</span>
                                <span className="flex items-center"><Ticket className="w-3 h-3 mr-1.5" />Ticket ID: {reg._id.slice(-6).toUpperCase()}</span>
                              </div>
                            </div>

                            <div className="flex justify-between pt-4 md:pt-0 gap-2">
                              {reg.status === 'cancelled' ? null : (
                                <>
                                  <Button variant="outline" className="text-xs h-8 border-rose-500/30 text-rose-500 hover:bg-rose-500/10" onClick={() => setSelectedTicket(reg)}>View Details</Button>
                                  <Button variant="outline" className="text-xs h-8 bg-rose-600 border-rose-500/30 text-white hover:bg-red-400" onClick={() => { setSelectedRegistrationId(reg._id); setIsModalOpen(true); }}>Cancel Registration</Button>
                                </>
                              )}
                            </div>
                        )}

                        {activeTab === 'Browse Events' && (
                            <div className="space-y-6">
                                {availableEvents.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="w-full h-80 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center p-6"
                                    >
                                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                            <Calendar className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium text-foreground">No upcoming events found</h3>
                                        <p className="text-muted-foreground mt-2 max-w-sm">
                                            Check back later for new events!
                                        </p>
                                    </motion.div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {availableEvents.map((evt, idx) => {
                                           const isRegistered = registrations.some(
    (r) =>
        r.status === "registered" &&
        r.event?._id === evt._id
);

const isEventFullBooked =
    evt.registeredCount >= evt.capacity;

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

                            <div className="flex justify-end pt-4 md:pt-0">
                              {isRegistered ? (<Button disabled variant="success" className="text-xs h-8 bg-green-600 text-white opacity-75">Registered</Button>) : isFull ? (<Button disabled variant="secondary" className="text-xs h-8">Fully Booked</Button>) : (<Button className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white" onClick={() => handleRegister(evt._id)}>Register Now</Button>)}
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

          <div className="mt-6">
            <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleCancelRegistration} title="Cancel registration" description="Are you sure you want to cancel this registration?" />
          </div>
        </div>
      </div>
    </div>
  );
}
