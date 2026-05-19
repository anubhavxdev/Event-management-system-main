import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, RefreshCw, Sparkles, Trophy, Users } from 'lucide-react';

import SEO from '../components/SEO';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const tabs = [
  { id: 'organizers', label: 'Top Organizers' },
  { id: 'customers', label: 'Top Attendees' },
];

const medalStyles = [
  'bg-amber-400/15 text-amber-400 border-amber-400/30',
  'bg-slate-300/15 text-slate-300 border-slate-300/30',
  'bg-orange-500/15 text-orange-300 border-orange-500/30',
];

const initialsFor = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

const formatScore = (value) => {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
};

const LeaderboardRow = ({ row, activeUserId }) => {
  const isMe = activeUserId && row.userId === activeUserId;
  const medal = row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col gap-4 rounded-2xl border p-4 shadow-sm transition-all md:flex-row md:items-center md:justify-between ${
        isMe
          ? 'border-rose-500/40 bg-rose-500/10 ring-1 ring-rose-500/20'
          : 'border-border bg-card/80 hover:border-rose-500/25 hover:bg-card'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-black ${medal ? medalStyles[row.rank - 1] : 'border-border bg-muted text-muted-foreground'}`}>
          {medal || `#${row.rank}`}
        </div>

        <Avatar className="h-12 w-12 border border-border">
          <AvatarImage src={row.avatarUrl} alt={row.name} />
          <AvatarFallback className="bg-background text-sm font-semibold text-foreground">
            {initialsFor(row.name)}
          </AvatarFallback>
        </Avatar>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-foreground">{row.name}</p>
            {isMe && (
              <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-500">
                You
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{row.metricLabel}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:items-center md:gap-8">
        <div className="rounded-xl bg-background/60 px-4 py-3 text-left">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Score</p>
          <p className="text-lg font-semibold text-foreground">{formatScore(row.score)}</p>
        </div>
        <div className="rounded-xl bg-background/60 px-4 py-3 text-left">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Key Metric</p>
          <p className="text-sm font-medium text-foreground">{row.metricValue}</p>
        </div>
      </div>
    </motion.div>
  );
};

const SkeletonRow = () => (
  <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-4 md:flex-row md:items-center md:justify-between">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 animate-pulse rounded-2xl bg-muted" />
      <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
      <div className="space-y-2">
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
    <div className="grid gap-3 md:grid-cols-2 md:gap-8">
      <div className="h-16 w-40 animate-pulse rounded-xl bg-muted" />
      <div className="h-16 w-40 animate-pulse rounded-xl bg-muted" />
    </div>
  </div>
);

export default function Leaderboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('organizers');
  const [leaderboards, setLeaderboards] = useState({ organizers: [], customers: [] });
  const [loading, setLoading] = useState({ organizers: true, customers: true });
  const [error, setError] = useState(null);

  const activeRows = leaderboards[activeTab] || [];
  const isActiveLoading = loading[activeTab];

  const loadTab = async (tab) => {
    try {
      setLoading((previous) => ({ ...previous, [tab]: true }));
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/leaderboard/${tab}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load leaderboard');
      }

      const formattedRows = (data.leaderboard || []).map((row) => ({
        ...row,
        metricLabel: tab === 'organizers' ? 'Approved events x average rating' : 'Attended events + points',
        metricValue:
          tab === 'organizers'
            ? `${row.totalApprovedEvents || 0} approved events · ${formatScore(row.averageRating || 0)} avg rating`
            : `${row.attendedEvents || 0} attended · ${row.points || 0} points`,
      }));

      setLeaderboards((previous) => ({ ...previous, [tab]: formattedRows }));
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading((previous) => ({ ...previous, [tab]: false }));
    }
  };

  useEffect(() => {
    loadTab('organizers');
    loadTab('customers');
  }, []);

  useEffect(() => {
    loadTab(activeTab);

    const interval = window.setInterval(() => {
      loadTab(activeTab);
    }, 10 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [activeTab]);

  const stats = useMemo(
    () => ({
      organizers: leaderboards.organizers.length,
      customers: leaderboards.customers.length,
    }),
    [leaderboards],
  );

  return (
    <div className="min-h-screen overflow-hidden bg-background pt-28 text-foreground">
      <SEO
        title="Leaderboard"
        description="Celebrate the top organizers and the most active attendees on eventone."
        url="/leaderboard"
      />

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:16px_16px] opacity-10" />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2rem] border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_34%)]" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-500">
                <Sparkles className="h-3 w-3" />
                Campus gamification
              </Badge>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                  Leaderboard
                </h1>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Celebrate the organizers driving the most value and the attendees showing up consistently.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Organizers</p>
                <p className="mt-1 text-2xl font-bold">{stats.organizers}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Attendees</p>
                <p className="mt-1 text-2xl font-bold">{stats.customers}</p>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="mt-8 rounded-[2rem] border border-border bg-card/70 p-4 shadow-xl backdrop-blur-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant={activeTab === tab.id ? 'default' : 'outline'}
                className={
                  activeTab === tab.id
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'border-border bg-background/60 text-foreground hover:bg-accent'
                }
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}

            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
              Refreshes every 10 minutes
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            {isActiveLoading
              ? Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)
              : activeRows.length > 0
                ? activeRows.map((row) => <LeaderboardRow key={row.userId} row={row} activeUserId={user?.id} />)
                : (
                  <div className="rounded-3xl border border-dashed border-border bg-background/60 px-6 py-16 text-center">
                    <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-4 text-lg font-semibold text-foreground">No entries yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Check back after more events are hosted and attended.
                    </p>
                  </div>
                )}
          </div>
        </section>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card/70 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-400">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Top Organizers</p>
                <p className="text-sm text-muted-foreground">Approved events multiplied by average rating.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/70 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Top Attendees</p>
                <p className="text-sm text-muted-foreground">Attended events weighted with earned points.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}