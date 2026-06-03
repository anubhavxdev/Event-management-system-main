import React, { useEffect, useState, useMemo } from 'react';
import { useSocket } from '../../context/SocketContext';
import { API_BASE_URL } from '../../config';
import { 
  Users, Calendar, Ticket, CheckCircle, Percent, DollarSign, 
  Activity, Cpu, HardDrive, Clock, Loader2, ArrowUpRight, 
  Terminal, ShieldCheck, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminAnalyticsPanel() {
  const { socket, isConnected } = useSocket();
  const [summary, setSummary] = useState(null);
  const [system, setSystem] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/analytics/admin/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load admin summary statistics');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch platform metrics.');
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/analytics/admin/system`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load system health');
      const data = await res.json();
      setSystem(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchSystemHealth()]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSummary(), fetchSystemHealth()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    // Add initial activity
    setActivities([
      {
        id: 'init',
        timestamp: new Date().toLocaleTimeString(),
        type: 'system',
        message: 'Observability channel initialized'
      }
    ]);
  }, []);

  // Socket subscription and handling
  useEffect(() => {
    if (!socket) return;

    // Join admin dashboard room
    socket.emit('admin:join');

    const handleSystemUpdate = (payload) => {
      setSystem(payload);
    };

    const handleActivityUpdate = (payload) => {
      setActivities(prev => [
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: payload.type || 'activity',
          message: payload.title 
            ? `New registration: "${payload.title}"`
            : 'Platform data modification detected'
        },
        ...prev.slice(0, 14) // Keep last 15 items
      ]);
    };

    socket.on('admin:system-update', handleSystemUpdate);
    socket.on('admin:activity-update', handleActivityUpdate);

    return () => {
      socket.off('admin:system-update', handleSystemUpdate);
      socket.off('admin:activity-update', handleActivityUpdate);
    };
  }, [socket]);

  // Derived user statistics
  const userMetrics = useMemo(() => {
    if (!summary?.users) return { total: 0, customers: 0, organizers: 0, admins: 0 };
    const customers = summary.users.find(u => u._id === 'customer')?.count || 0;
    const organizers = summary.users.find(u => u._id === 'organizer')?.count || 0;
    const admins = summary.users.find(u => u._id === 'admin')?.count || 0;
    return {
      total: customers + organizers + admins,
      customers,
      organizers,
      admins
    };
  }, [summary]);

  // Derived event statistics
  const eventMetrics = useMemo(() => {
    if (!summary?.events) return { total: 0, approved: 0, pending: 0, rejected: 0 };
    const approved = summary.events.find(e => e._id === 'approved')?.count || 0;
    const pending = summary.events.find(e => e._id === 'pending')?.count || 0;
    const rejected = summary.events.find(e => e._id === 'rejected')?.count || 0;
    return {
      total: approved + pending + rejected,
      approved,
      pending,
      rejected
    };
  }, [summary]);

  // Derived registration statistics
  const registrationMetrics = useMemo(() => {
    if (!summary?.registrations) return { total: 0, checkedIn: 0, rate: 0 };
    const total = summary.registrations.reduce((acc, curr) => acc + curr.count, 0);
    const checkedIn = summary.registrations.find(r => r._id === 'attended')?.count || 0;
    return {
      total,
      checkedIn,
      rate: total > 0 ? Math.round((checkedIn / total) * 100) : 0
    };
  }, [summary]);

  // SVG Chart data construction (last 6 months user & event growth)
  const growthChartData = useMemo(() => {
    const monthsSet = new Set([
      ...(summary?.userGrowth || []).map(g => g._id),
      ...(summary?.eventGrowth || []).map(g => g._id)
    ]);
    const months = Array.from(monthsSet).sort();
    
    if (!months.length) return [];

    const chartData = months.map(m => {
      const users = summary.userGrowth?.find(g => g._id === m)?.count || 0;
      const events = summary.eventGrowth?.find(g => g._id === m)?.count || 0;
      return { month: m, users, events };
    });

    const maxVal = Math.max(...chartData.flatMap(d => [d.users, d.events]), 1);

    return chartData.map(d => ({
      ...d,
      userPercentage: Math.round((d.users / maxVal) * 100),
      eventPercentage: Math.round((d.events / maxVal) * 100)
    }));
  }, [summary]);

  // Format server uptime
  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ''}${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <span className="text-muted-foreground text-sm font-medium">Assembling platform command center...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 border border-dashed border-red-500/30 rounded-2xl bg-red-500/5 text-red-400 max-w-lg mx-auto">
        <p className="font-semibold">{error}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-xl text-xs hover:bg-red-500/30 transition-all">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-foreground">
      {/* Header telemetry and connection indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#141416] border border-[#27272a] rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className={`flex h-3.5 w-3.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            {isConnected && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping top-0 left-0" />
            )}
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Telemetry Engine</span>
            <h4 className="text-sm font-bold text-foreground">
              {isConnected ? 'Connected & Aggregating Live Stream' : 'Offline / Socket Reconnecting'}
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-xs text-muted-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
            Force Refresh
          </button>
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="absolute top-4 right-4 bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20 text-purple-500">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Active Users</span>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 group-hover:scale-105 transition-transform origin-left">
            {userMetrics.total}
          </h4>
          <p className="text-[11px] text-muted-foreground mt-2 flex gap-2">
            <span>Cust: {userMetrics.customers}</span>
            <span>Org: {userMetrics.organizers}</span>
          </p>
        </div>

        {/* Total Events */}
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="absolute top-4 right-4 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-rose-500">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Platform Events</span>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 group-hover:scale-105 transition-transform origin-left">
            {eventMetrics.total}
          </h4>
          <p className="text-[11px] text-muted-foreground mt-2 flex gap-2">
            <span className="text-emerald-400">Appr: {eventMetrics.approved}</span>
            <span className="text-amber-400">Pend: {eventMetrics.pending}</span>
          </p>
        </div>

        {/* Total Registrations */}
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-4 right-4 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-500">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Registrations</span>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 group-hover:scale-105 transition-transform origin-left">
            {registrationMetrics.total}
          </h4>
          <p className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between">
            <span>Checked-in: {registrationMetrics.checkedIn}</span>
            <span className="text-emerald-400 font-medium">{registrationMetrics.rate}% rate</span>
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-5 relative overflow-hidden group hover:border-orange-500/30 transition-all">
          <div className="absolute top-4 right-4 bg-orange-500/10 p-2.5 rounded-xl border border-orange-500/20 text-orange-500">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Sales Vol.</span>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 group-hover:scale-105 transition-transform origin-left">
            ₹{summary?.revenue || 0}
          </h4>
          <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
            <span className="text-orange-500 font-semibold flex items-center gap-0.5">
              Live <ArrowUpRight className="w-3 h-3" />
            </span>
            <span>across paid tickets</span>
          </p>
        </div>
      </div>

      {/* Grid: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trend Bar Chart */}
        <div className="lg:col-span-2 bg-[#121214] border border-[#27272a] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" /> Platform Growth Timeline (6 Months)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Monthly registration counts for Users and Events</p>
          </div>

          {growthChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm italic">
              No registration growth data recorded yet.
            </div>
          ) : (
            <div className="flex flex-col justify-end h-64 mt-6">
              {/* Bars display */}
              <div className="flex items-end justify-around h-48 px-2 border-b border-[#27272a] gap-2">
                {growthChartData.map((data, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 max-w-[80px]">
                    <div className="flex items-end justify-center w-full gap-1.5 h-full relative group">
                      {/* Users Growth Column */}
                      <div 
                        style={{ height: `${data.userPercentage}%` }}
                        className="w-4 sm:w-6 bg-purple-500/80 hover:bg-purple-500 rounded-t-sm transition-all cursor-pointer relative"
                      >
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1c1c1f] text-foreground text-[10px] px-2 py-0.5 rounded border border-[#27272a] shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {data.users} new users ({data.month})
                        </div>
                      </div>

                      {/* Events Growth Column */}
                      <div 
                        style={{ height: `${data.eventPercentage}%` }}
                        className="w-4 sm:w-6 bg-rose-500/80 hover:bg-rose-500 rounded-t-sm transition-all cursor-pointer relative"
                      >
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1c1c1f] text-foreground text-[10px] px-2 py-0.5 rounded border border-[#27272a] shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {data.events} events ({data.month})
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-2 whitespace-nowrap">{data.month}</span>
                  </div>
                ))}
              </div>

              {/* Chart Legend */}
              <div className="flex justify-center gap-6 mt-4 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-purple-500 rounded-sm" />
                  <span className="text-muted-foreground">New User Signups</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
                  <span className="text-muted-foreground">Created Events</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Platform Distributions */}
        <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" /> Platform Demographics
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Breakdown of roles and event status</p>
          </div>

          <div className="space-y-6 my-6">
            {/* User roles distribution */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-muted-foreground">User Roles</span>
                <span className="text-foreground">{userMetrics.total} total</span>
              </div>
              <div className="h-3 w-full bg-zinc-800/40 rounded-full flex overflow-hidden border border-zinc-700/30">
                <div 
                  style={{ width: `${userMetrics.total > 0 ? (userMetrics.customers / userMetrics.total) * 100 : 0}%` }} 
                  className="bg-purple-500"
                  title={`Customers: ${userMetrics.customers}`}
                />
                <div 
                  style={{ width: `${userMetrics.total > 0 ? (userMetrics.organizers / userMetrics.total) * 100 : 0}%` }} 
                  className="bg-rose-500"
                  title={`Organizers: ${userMetrics.organizers}`}
                />
                <div 
                  style={{ width: `${userMetrics.total > 0 ? (userMetrics.admins / userMetrics.total) * 100 : 0}%` }} 
                  className="bg-orange-500"
                  title={`Admins: ${userMetrics.admins}`}
                />
              </div>
              <div className="grid grid-cols-3 gap-1 text-[9px] text-muted-foreground text-center">
                <div>
                  <span className="inline-block w-1.5 h-1.5 bg-purple-500 rounded-full mr-1" />
                  Cust ({userMetrics.customers})
                </div>
                <div>
                  <span className="inline-block w-1.5 h-1.5 bg-rose-500 rounded-full mr-1" />
                  Org ({userMetrics.organizers})
                </div>
                <div>
                  <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full mr-1" />
                  Admin ({userMetrics.admins})
                </div>
              </div>
            </div>

            {/* Event status distribution */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-muted-foreground">Event Status</span>
                <span className="text-foreground">{eventMetrics.total} total</span>
              </div>
              <div className="h-3 w-full bg-zinc-800/40 rounded-full flex overflow-hidden border border-zinc-700/30">
                <div 
                  style={{ width: `${eventMetrics.total > 0 ? (eventMetrics.approved / eventMetrics.total) * 100 : 0}%` }} 
                  className="bg-emerald-500"
                  title={`Approved: ${eventMetrics.approved}`}
                />
                <div 
                  style={{ width: `${eventMetrics.total > 0 ? (eventMetrics.pending / eventMetrics.total) * 100 : 0}%` }} 
                  className="bg-amber-500"
                  title={`Pending: ${eventMetrics.pending}`}
                />
                <div 
                  style={{ width: `${eventMetrics.total > 0 ? (eventMetrics.rejected / eventMetrics.total) * 100 : 0}%` }} 
                  className="bg-red-500"
                  title={`Rejected: ${eventMetrics.rejected}`}
                />
              </div>
              <div className="grid grid-cols-3 gap-1 text-[9px] text-muted-foreground text-center">
                <div>
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1" />
                  Appr ({eventMetrics.approved})
                </div>
                <div>
                  <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full mr-1" />
                  Pend ({eventMetrics.pending})
                </div>
                <div>
                  <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-1" />
                  Rej ({eventMetrics.rejected})
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#27272a] pt-4 text-[10px] text-muted-foreground italic text-center">
            Updated automatically via REST channel
          </div>
        </div>
      </div>

      {/* Grid: Observability Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time System Telemetry */}
        <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-rose-500" /> Host System Health Telemetry
          </h3>
          <p className="text-xs text-muted-foreground mb-6">Real-time resources captured on the backend host</p>

          <div className="space-y-6">
            {/* Connection stats & uptime */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#18181b] border border-zinc-800/80 rounded-xl p-4 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">WebSocket Clients</span>
                <div className="text-2xl font-extrabold text-foreground mt-1 flex items-center justify-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  {system?.activeConnections ?? 0}
                </div>
              </div>
              <div className="bg-[#18181b] border border-zinc-800/80 rounded-xl p-4 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Runtime Uptime</span>
                <div className="text-sm font-bold text-foreground mt-2.5 truncate" title={formatUptime(system?.uptime)}>
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                  {formatUptime(system?.uptime)}
                </div>
              </div>
            </div>

            {/* Heap memory utilization */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-orange-500" /> Node JS heap Memory
                </span>
                <span className="text-foreground">
                  {system?.memory?.heapUsed ?? 0}MB / {system?.memory?.heapTotal ?? 0}MB
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-800/40 rounded-full overflow-hidden border border-zinc-700/30">
                <div 
                  style={{ 
                    width: `${
                      system?.memory?.heapTotal 
                        ? Math.min(Math.round((system.memory.heapUsed / system.memory.heapTotal) * 100), 100) 
                        : 0
                    }%` 
                  }} 
                  className="h-full bg-orange-500 transition-all duration-1000" 
                />
              </div>
            </div>

            {/* Host Total System memory */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-blue-500" /> System Total Memory
                </span>
                <span className="text-foreground">
                  {system ? system.totalMem - system.freeMem : 0}MB / {system?.totalMem ?? 0}MB
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-800/40 rounded-full overflow-hidden border border-zinc-700/30">
                <div 
                  style={{ 
                    width: `${
                      system?.totalMem 
                        ? Math.min(Math.round(((system.totalMem - system.freeMem) / system.totalMem) * 100), 100) 
                        : 0
                    }%` 
                  }} 
                  className="h-full bg-blue-500 transition-all duration-1000" 
                />
              </div>
            </div>

            {/* CPU Load average */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Host CPU Load Averages</div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#18181b] border border-zinc-800/50 p-2 rounded-lg">
                  <div className="text-[10px] text-muted-foreground">1-Min</div>
                  <div className="font-bold text-foreground mt-0.5">{(system?.cpuLoad?.[0] ?? 0).toFixed(2)}</div>
                </div>
                <div className="bg-[#18181b] border border-zinc-800/50 p-2 rounded-lg">
                  <div className="text-[10px] text-muted-foreground">5-Min</div>
                  <div className="font-bold text-foreground mt-0.5">{(system?.cpuLoad?.[1] ?? 0).toFixed(2)}</div>
                </div>
                <div className="bg-[#18181b] border border-zinc-800/50 p-2 rounded-lg">
                  <div className="text-[10px] text-muted-foreground">15-Min</div>
                  <div className="font-bold text-foreground mt-0.5">{(system?.cpuLoad?.[2] ?? 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live System Activity Log Console */}
        <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 flex flex-col justify-between h-[420px]">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" /> Live Platform Activity Feed
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Real-time terminal tracking system events</p>
          </div>

          <div className="flex-1 bg-black/40 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-emerald-400/90 overflow-y-auto mt-4 space-y-2 custom-scrollbar">
            <AnimatePresence initial={false}>
              {activities.map((act) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-2 items-start"
                >
                  <span className="text-zinc-600">[{act.timestamp}]</span>
                  <span className={act.type === 'system' ? 'text-blue-400' : 'text-emerald-500'}>
                    {act.type === 'system' ? 'SYS:' : 'EVENT:'}
                  </span>
                  <span className="text-zinc-300 break-all">{act.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="text-[9px] text-zinc-600 mt-2 text-right">
            Console updates on registration changes and platform checkins
          </div>
        </div>
      </div>
    </div>
  );
}
