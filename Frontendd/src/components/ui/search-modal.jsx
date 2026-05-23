import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search as SearchIcon,
  X,
  Calendar,
  MapPin,
  Tag,
  ArrowRight,
  Loader2,
  TrendingUp,
  User,
  Ticket,
  Clock,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { BorderBeam } from "../ui/border-beam";

const CATEGORIES = ["Tech", "Sports", "Cultural", "Workshop", "Music", "Other"];

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    // Focus input on open
    setTimeout(() => inputRef.current?.focus(), 150);

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/events?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await res.json();
        setResults(data.events || []);
      } catch (err) {
        console.error("Search error:", err);
        setError("Unable to retrieve search results.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }

      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setSelectedEvent(null);
    setError(null);
    onClose();
  };

  const handleCategoryClick = (category) => {
    setQuery(category);
    setSelectedEvent(null);
  };

  const handleRegisterClick = (event) => {
    handleClose();
    if (!user) {
      navigate("/login");
    } else {
      navigate("/customer/dashboard");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 md:px-0">
          {/* Glassmorphic Backdrop overlay with dense blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-background/40 dark:bg-black/60 backdrop-blur-md"
          />

          {/* Premium Floating Command Palette Search Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -15 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-2xl bg-background/80 dark:bg-zinc-950/85 backdrop-blur-2xl border border-border/60 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
          >
            {/* Animated glowing border beam on the command palette container */}
            <BorderBeam
              size={180}
              duration={7}
              colorFrom="var(--color-primary, #6366f1)"
              colorTo="var(--color-primary, #d946ef)"
              className="opacity-80"
            />

            {/* Glowing theme background decorations */}
            <div className="absolute -left-20 -top-20 -z-10 h-52 w-52 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 -z-10 h-52 w-52 rounded-full bg-purple-500/10 dark:bg-purple-500/15 blur-3xl pointer-events-none" />

            {/* Elegant Search Input Bar */}
            <div className="p-4 border-b border-border/50 dark:border-white/5 bg-transparent flex items-center gap-3">
              <SearchIcon className="h-5 w-5 text-indigo-500 shrink-0 ml-1" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedEvent(null);
                }}
                placeholder="Search events, categories, organizers..."
                className="w-full bg-transparent border-0 outline-none placeholder:text-muted-foreground text-foreground text-base focus:ring-0 p-1"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setSelectedEvent(null);
                  }}
                  className="p-1.5 hover:bg-muted dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="h-4.5 w-4.5 text-muted-foreground" />
                </button>
              )}
              <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted dark:bg-white/5 border border-border/50 dark:border-white/10 rounded-md select-none">
                ESC
              </span>
            </div>

            {/* Results / Suggestions panel */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0 space-y-4 relative">
              {/* suggestions list */}
              {!query.trim() && (
                <div className="space-y-4 py-1">
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-indigo-500" /> Popular Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => handleCategoryClick(cat)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted/50 dark:bg-white/5 text-foreground hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all border border-border/50 dark:border-white/10 hover:border-transparent active:scale-95"
                        >
                          <Tag className="h-3 w-3 text-indigo-400" />
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/50 dark:border-white/5 bg-muted/20 dark:bg-white/5">
                    <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="h-4 w-4 text-purple-400" /> Discover Smart Events
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Enter any keyword to find matching hackathons, summits, workshops and cultural celebrations instantly.
                    </p>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="relative">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xs" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium animate-pulse">Filtering matching events...</p>
                </div>
              )}

              {/* Error block */}
              {error && (
                <div className="text-center py-10 text-xs text-rose-500 bg-rose-500/5 rounded-xl border border-rose-500/10 p-3">
                  {error}
                </div>
              )}

              {/* No items matched query */}
              {!loading && query.trim() && results.length === 0 && (
                <div className="text-center py-14">
                  <div className="h-11 w-11 bg-muted dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 border border-border/50 dark:border-white/5">
                    <SearchIcon className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                  <h5 className="text-xs font-bold text-foreground">No events matched "{query}"</h5>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Try searching a general topic, category tag, or check the spelling.
                  </p>
                </div>
              )}

              {/* Live search result list */}
              {!loading && results.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Events found ({results.length})</span>
                    <span className="text-[9px] font-normal normal-case text-indigo-400 flex items-center gap-0.5">
                      Click to reveal details
                    </span>
                  </h4>

                  <div className="space-y-1.5">
                    {results.map((event) => (
                      <div key={event._id} className="space-y-2">
                        {/* Event Card Row */}
                        <div
                          onClick={() => setSelectedEvent(selectedEvent?._id === event._id ? null : event)}
                          className={cn(
                            "group p-3 rounded-xl border transition-all duration-200 cursor-pointer flex gap-3.5 items-center relative overflow-hidden",
                            selectedEvent?._id === event._id
                              ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/40 shadow-md"
                              : "bg-card/50 dark:bg-zinc-900/40 hover:bg-muted/40 dark:hover:bg-white/5 border-border/50 dark:border-white/5 hover:border-indigo-500/30"
                          )}
                        >
                          {/* Mini poster image or calendar icon */}
                          <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-muted/80 dark:bg-white/5 border border-border/30 dark:border-white/5 relative">
                            {event.posterUrl ? (
                              <img
                                src={event.posterUrl}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-indigo-500">
                                <Calendar className="w-5.5 h-5.5" />
                              </div>
                            )}
                          </div>

                          {/* Event info block */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 border border-indigo-500/10">
                                {event.category}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
                                {event.date
                                  ? new Date(event.date).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "TBA"}
                              </span>
                            </div>
                            <h5 className="font-bold text-sm text-foreground group-hover:text-indigo-400 transition-colors truncate">
                              {event.title}
                            </h5>
                          </div>

                          {/* Interactive status arrow */}
                          <div className="shrink-0 flex items-center gap-1.5">
                            <span className="text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              {selectedEvent?._id === event._id ? "Collapse" : "Details"}
                            </span>
                            <ArrowRight
                              className={cn(
                                "h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0",
                                selectedEvent?._id === event._id && "rotate-90 text-indigo-500 opacity-100"
                              )}
                            />
                          </div>
                        </div>

                        {/* Expandable/Collapsible detail panel directly beneath the event card */}
                        <AnimatePresence>
                          {selectedEvent?._id === event._id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 rounded-xl border border-indigo-500/20 bg-muted/10 dark:bg-white/5 flex flex-col md:flex-row gap-4 mt-1">
                                {/* Details right part poster */}
                                {event.posterUrl && (
                                  <div className="w-full md:w-36 h-24 rounded-lg overflow-hidden shrink-0 bg-muted border border-border/80 relative">
                                    <img src={event.posterUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                )}

                                {/* Details text elements */}
                                <div className="flex-1 flex flex-col justify-between gap-3 text-xs">
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-muted-foreground font-medium">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                        <span className="text-foreground/80">{event.location || "Online / TBA"}</span>
                                      </span>
                                      {event.organizer && (
                                        <span className="flex items-center gap-1">
                                          <User className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                          <span className="text-foreground/80">{event.organizer.name}</span>
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <Ticket className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                        <span className="text-foreground/80">
                                          {event.registeredCount || 0} registered
                                          {event.capacity ? ` / ${event.capacity}` : ""}
                                        </span>
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                      {event.description || "No description provided."}
                                    </p>
                                  </div>

                                  {/* Call to action register */}
                                  <div className="flex justify-end pt-1 shrink-0">
                                    <button
                                      onClick={() => handleRegisterClick(event)}
                                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 active:scale-97 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md hover:shadow-indigo-500/15 transition-all"
                                    >
                                      <Ticket className="h-3.5 w-3.5" />
                                      <span>Register or View Dashboard</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
