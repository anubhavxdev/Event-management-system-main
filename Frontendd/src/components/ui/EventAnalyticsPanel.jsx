import React, { useEffect, useState, useMemo } from 'react';
import { useSocket } from '../../context/SocketContext';
import { API_BASE_URL } from '../../config';
import { Ticket, Users, CheckCircle, Percent, DollarSign, Calendar, Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EventAnalyticsPanel({ eventId }) {
  const [metrics, setMetrics] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [hourlyStats, setHourlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { socket } = useSocket();

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/analytics/organizer/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load event analytics');
      const data = await res.json();
      setMetrics(data.metrics);
      setTimeline(data.registrationTimeline || []);
      setHourlyStats(data.attendanceTimeline || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to fetch analytics metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAnalytics();
  }, [eventId]);

  // Listen to realtime metrics updates
  useEffect(() => {
    if (!socket) return;

    socket.emit('event:join', { eventId });

    const handleEventUpdate = (payload) => {
      if (payload.eventId === eventId) {
        setMetrics(payload.metrics);
        // Refresh full timeline data in background silently
        fetch(`${API_BASE_URL}/api/analytics/organizer/event/${eventId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
          .then(res => res.json())
          .then(data => {
            setTimeline(data.registrationTimeline || []);
            setHourlyStats(data.attendanceTimeline || []);
          })
          .catch(console.error);
      }
    };

    socket.on('analytics:event-update', handleEventUpdate);

    return () => {
      socket.emit('event:leave', { eventId });
      socket.off('analytics:event-update', handleEventUpdate);
    };
  }, [socket, eventId]);

  // Custom timeline chart geometry calculations
  const timelineChartData = useMemo(() => {
    if (!timeline.length) return [];
    const maxVal = Math.max(...timeline.map(t => t.count), 1);
    return timeline.map(t => ({
      label: t._id.slice(5), // MM-DD
      count: t.count,
      heightPercentage: Math.round((t.count / maxVal) * 100)
    }));
  }, [timeline]);

  // Custom hourly chart geometry calculations
  const hourlyChartData = useMemo(() => {
    // Fill all 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    hourlyStats.forEach(stat => {
      if (stat._id >= 0 && stat._id < 24) {
        hours[stat._id].count = stat.count;
      }
    });

    const maxVal = Math.max(...hours.map(h => h.count), 1);
    return hours.map(h => ({
      label: `${h.hour.toString().padStart(2, '0')}:00`,
      count: h.count,
      heightPercentage: Math.round((h.count / maxVal) * 100)
    }));
  }, [hourlyStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 border border-dashed border-red-500/30 rounded-2xl bg-red-500/5 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Registrations */}
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="absolute top-4 right-4 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-rose-500">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Registrations</span>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 group-hover:scale-105 transition-transform origin-left">
            {metrics?.totalRegistrations || 0}
          </h4>
        </div>

        {/* Checked In */}
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-4 right-4 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-500">
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Checked In</span>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 group-hover:scale-105 transition-transform origin-left">
            {metrics?.checkedInCount || 0}
          </h4>
        </div>

        {/* Check-In Rate */}
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="absolute top-4 right-4 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-amber-500">
            <Percent className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Check-in Rate</span>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 group-hover:scale-105 transition-transform origin-left">
            {metrics?.checkInRate || 0}%
          </h4>
        </div>

        {/* Revenue */}
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="absolute top-4 right-4 bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20 text-purple-500">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Revenue</span>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 group-hover:scale-105 transition-transform origin-left">
            ₹{metrics?.revenue || 0}
          </h4>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Growth Timeline */}
        <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-6">
            <Calendar className="w-4 h-4 text-rose-500" /> 30-Day Registration Timeline
          </h3>
          {timelineChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm italic">
              No recent registrations recorded.
            </div>
          ) : (
            <div className="flex flex-col justify-end h-64">
              {/* Bars container */}
              <div className="flex items-end justify-between h-48 px-2 border-b border-[#27272a]">
                {timelineChartData.map((bar, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 group relative mx-0.5 max-w-[28px]">
                    <div 
                      style={{ height: `${bar.heightPercentage}%` }}
                      className="w-full bg-rose-500/80 hover:bg-rose-500 rounded-t-sm transition-all relative cursor-pointer"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1c1c1f] text-foreground text-[10px] px-2 py-0.5 rounded border border-[#27272a] shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {bar.count} regs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Labels container */}
              <div className="flex justify-between items-center mt-2 px-1 text-[9px] text-muted-foreground">
                <span>{timelineChartData[0]?.label}</span>
                <span>{timelineChartData[Math.floor(timelineChartData.length / 2)]?.label}</span>
                <span>{timelineChartData[timelineChartData.length - 1]?.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Hourly Attendance Flow */}
        <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-6">
            <Clock className="w-4 h-4 text-emerald-500" /> Attendance Hourly Timeline
          </h3>
          {hourlyStats.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm italic">
              No attendees checked in yet.
            </div>
          ) : (
            <div className="flex flex-col justify-end h-64">
              {/* Bars container */}
              <div className="flex items-end justify-between h-48 px-2 border-b border-[#27272a]">
                {hourlyChartData.map((bar, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 group relative mx-0.5 max-w-[14px]">
                    <div 
                      style={{ height: `${bar.heightPercentage}%` }}
                      className={`w-full ${bar.count > 0 ? 'bg-emerald-500/80 hover:bg-emerald-500' : 'bg-zinc-800/20'} rounded-t-sm transition-all relative cursor-pointer`}
                    >
                      {bar.count > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1c1c1f] text-foreground text-[10px] px-2 py-0.5 rounded border border-[#27272a] shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {bar.count} checkins ({bar.label})
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Labels container */}
              <div className="flex justify-between items-center mt-2 px-1 text-[9px] text-muted-foreground">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:00</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
