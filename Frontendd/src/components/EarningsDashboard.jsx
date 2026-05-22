import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, TrendingUp, Clock, Download } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Button } from './ui/button';
import { API_BASE_URL } from '../config';

// ─── Helpers ───────────────────────────────────────────────────────────────

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function downloadEarningsCSV(perEvent) {
    const rows = [
        ['Event Name', 'Date', 'Tickets Sold', 'Ticket Price (₹)', 'Revenue (₹)'],
        ...perEvent.map((e) => [
            `"${e.title}"`,
            new Date(e.date).toLocaleDateString('en-IN'),
            e.ticketsSold,
            e.ticketPrice,
            e.revenue,
        ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'earnings.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// ─── Summary Card ──────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, label, value, color }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
            <div className={`inline-flex w-fit rounded-xl p-2 ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
        </motion.div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function EarningsDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEarnings = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/organizer/earnings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to load earnings');
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEarnings();
    }, [fetchEarnings]);

    // ── Loading ──
    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
        );
    }

    // ── Error ──
    if (error) {
        return (
            <div className="py-16 text-center text-sm text-destructive">
                {error}
            </div>
        );
    }

    // ── Empty state: no paid events ──
    if (!data?.hasPaidEvents) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center"
            >
                <div className="mb-4 rounded-full bg-muted p-4">
                    <IndianRupee className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold text-foreground">₹0 — No paid events yet</p>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Revenue data appears here once you create a paid event and receive confirmed registrations.
                </p>
            </motion.div>
        );
    }

    const { perEvent, summary, monthlyChart } = data;

    return (
        <div className="space-y-8">

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SummaryCard
                    icon={IndianRupee}
                    label="Total Earnings (Lifetime)"
                    value={fmt(summary.lifetimeEarnings)}
                    color="bg-orange-500/10 text-orange-500"
                />
                <SummaryCard
                    icon={TrendingUp}
                    label="This Month"
                    value={fmt(summary.thisMonthEarnings)}
                    color="bg-green-500/10 text-green-500"
                />
                <SummaryCard
                    icon={Clock}
                    label="Pending Payout"
                    value={fmt(summary.pendingPayout)}
                    color="bg-purple-500/10 text-purple-500"
                />
            </div>

            {/* Monthly Bar Chart */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-base font-semibold text-foreground">
                    Monthly Earnings — Last 6 Months
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyChart} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            formatter={(v) => [fmt(v), 'Earnings']}
                            contentStyle={{
                                background: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '12px',
                                color: 'hsl(var(--foreground))',
                            }}
                        />
                        <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Per-Event Table */}
            <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="text-base font-semibold text-foreground">Per-Event Revenue</h3>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => downloadEarningsCSV(perEvent)}
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs text-muted-foreground">
                                <th className="px-6 py-3 font-medium">Event Name</th>
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium text-right">Tickets Sold</th>
                                <th className="px-4 py-3 font-medium text-right">Price</th>
                                <th className="px-4 py-3 font-medium text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {perEvent.map((ev, idx) => (
                                <motion.tr
                                    key={ev.eventId}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                                >
                                    <td className="px-6 py-3 font-medium text-foreground">{ev.title}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(ev.date).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-foreground">{ev.ticketsSold}</td>
                                    <td className="px-4 py-3 text-right text-foreground">₹{ev.ticketPrice}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-orange-500">
                                        {fmt(ev.revenue)}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}