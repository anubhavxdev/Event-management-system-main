import User from '../models/User.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

export const leaderboard = async (req, res) => {
  try {
    const top = await User.find({ role: { $in: ['customer', 'attendee', 'organizer'] }, isBlocked: false })
      .sort({ points: -1 })
      .limit(10)
      .select('name points');
    res.json({ leaderboard: top });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const recommendations = async (req, res) => {
  try {
    // Find categories from user's past registrations
    const regs = await Registration.find({ user: req.user.id }).populate('event', 'category');
    const categories = [...new Set(regs.map(r => r.event?.category).filter(Boolean))];
    const filter = { date: { $gte: new Date() }, status: 'approved' };
    if (categories.length) filter.category = { $in: categories };
    const events = await Event.find(filter).sort({ date: 1 }).limit(6);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Quick counts for cards on the home page
export const summary = async (_req, res) => {
  try {
    const [totalEvents, approvedEvents, upcomingEvents, totalRegistrations, totalCustomers, totalOrganizers] = await Promise.all([
      Event.countDocuments({}),
      Event.countDocuments({ status: 'approved' }),
      Event.countDocuments({ status: 'approved', date: { $gte: new Date() } }),
      Registration.countDocuments({}),
      User.countDocuments({ role: { $in: ['customer', 'attendee'] }, isBlocked: false }),
      User.countDocuments({ role: 'organizer', isBlocked: false }),
    ]);

    res.json({
      totals: {
        events: totalEvents,
        approvedEvents,
        upcomingEvents,
        registrations: totalRegistrations,
        customers: totalCustomers,
        organizers: totalOrganizers,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Popular/trending events
export const trending = async (_req, res) => {
  try {
    // Popular by registrations
    const popularAgg = await Registration.aggregate([
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    const popularIds = popularAgg.map(p => p._id).filter(Boolean);
    const popular = await Event.find({ _id: { $in: popularIds } }).lean();
    // Preserve order of popularity
    const popularityMap = new Map(popularAgg.map(p => [String(p._id), p.count]));
    const popularOrdered = popular
      .map(e => ({ ...e, registrations: popularityMap.get(String(e._id)) || 0 }))
      .sort((a,b) => (b.registrations - a.registrations));

    // Top rated events
    const topRated = await Event.find({ status: 'approved' })
      .sort({ averageRating: -1 })
      .limit(6)
      .lean();

    // Recently added approved events
    const recent = await Event.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    res.json({ popular: popularOrdered, topRated, recent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Stats for dashboard widgets (categories and upcoming timeline)
export const dashboardStats = async (_req, res) => {
  try {
    const categories = await Event.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const upcomingByMonth = await Event.aggregate([
      { $match: { status: 'approved', date: { $gte: new Date() } } },
      { $project: { ym: { $dateToString: { format: '%Y-%m', date: '$date' } } } },
      { $group: { _id: '$ym', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]);

    res.json({ categories, upcomingByMonth });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin-only aggregated analytics ──────────────────────────────────
export const adminStats = async (_req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      usersByRole,
      eventsByStatus,
      eventsByCategory,
      registrationsPerDay,
      checkInAgg,
    ] = await Promise.all([
      // 1. Total users grouped by role
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),

      // 2. Events grouped by status
      Event.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // 3. Events grouped by category (all statuses)
      Event.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // 4. Registration count per day for last 30 days
      Registration.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 5. Overall check-in rate
      Registration.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            attended: {
              $sum: { $cond: [{ $eq: ['$status', 'attended'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    // ── Shape the response ───────────────────────────────────────────
    // Users by role → { customer: N, organizer: N, admin: N }
    const usersMap = {};
    let totalUsers = 0;
    for (const { _id, count } of usersByRole) {
      usersMap[_id] = count;
      totalUsers += count;
    }

    // Events by status → { pending: N, approved: N, rejected: N }
    const statusMap = {};
    let totalEvents = 0;
    for (const { _id, count } of eventsByStatus) {
      statusMap[_id] = count;
      totalEvents += count;
    }

    // Check-in rate
    const cRaw = checkInAgg[0] || { total: 0, attended: 0 };
    const checkInRate =
      cRaw.total > 0
        ? Math.round((cRaw.attended / cRaw.total) * 10000) / 100
        : 0;

    // Fill in missing days in the 30-day window so the chart has no gaps
    const regMap = new Map(registrationsPerDay.map((d) => [d._id, d.count]));
    const filledRegistrations = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      filledRegistrations.push({ date: key, count: regMap.get(key) || 0 });
    }

    res.json({
      usersByRole: usersMap,
      totalUsers,
      eventsByStatus: statusMap,
      totalEvents,
      eventsByCategory: eventsByCategory.map((c) => ({
        category: c._id || 'Uncategorized',
        count: c.count,
      })),
      registrationsPerDay: filledRegistrations,
      totalRegistrations: cRaw.total,
      checkInRate,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


