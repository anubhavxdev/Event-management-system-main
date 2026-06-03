import os from 'os';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import { getActiveConnectionCount } from '../services/socket.js';

// Get analytics for a specific event
export const getEventAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Authorization check: User must be owner or co-organizer
    const isOwner = event.organizer.toString() === req.user.id;
    const isCoOrganizer = event.coOrganizers?.some(id => id.toString() === req.user.id);
    if (!isOwner && !isCoOrganizer) {
      return res.status(403).json({ message: 'Not authorized to view analytics for this event' });
    }

    // 1. Basic counts (registrations, checked-in, waitlisted)
    const statsResult = await Registration.aggregate([
      { $match: { event: event._id } },
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, 1, 0] } },
          checkedInCount: { $sum: { $cond: [{ $eq: ['$status', 'attended'] }, 1, 0] } },
          waitlistCount: { $sum: { $cond: [{ $eq: ['$status', 'waitlisted'] }, 1, 0] } },
          paidCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } }
        }
      }
    ]);

    const stats = statsResult[0] || {
      totalRegistrations: 0,
      checkedInCount: 0,
      waitlistCount: 0,
      paidCount: 0
    };

    const revenue = stats.paidCount * (event.price || 0);

    // 2. Timeline: registrations per day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const registrationTimeline = await Registration.aggregate([
      { 
        $match: { 
          event: event._id, 
          status: { $ne: 'cancelled' }, 
          createdAt: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Hourly check-in timeline (for event day)
    const attendanceTimeline = await Registration.aggregate([
      { 
        $match: { 
          event: event._id, 
          status: 'attended', 
          checkedInAt: { $exists: true } 
        } 
      },
      {
        $group: {
          _id: { $hour: '$checkedInAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      event: {
        id: event._id,
        title: event.title,
        capacity: event.capacity,
        price: event.price,
        isFree: event.isFree
      },
      metrics: {
        totalRegistrations: stats.totalRegistrations,
        checkedInCount: stats.checkedInCount,
        waitlistCount: stats.waitlistCount,
        checkInRate: stats.totalRegistrations > 0 ? Math.round((stats.checkedInCount / stats.totalRegistrations) * 100) : 0,
        revenue
      },
      registrationTimeline,
      attendanceTimeline
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get summary stats for an organizer across all their events
export const getOrganizerSummary = async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { organizer: req.user.id },
        { coOrganizers: req.user.id }
      ]
    });

    const eventIds = events.map(e => e._id);

    if (eventIds.length === 0) {
      return res.json({
        totalEvents: 0,
        totalRegistrations: 0,
        totalCheckedIn: 0,
        totalRevenue: 0,
        categoryDistribution: []
      });
    }

    const regStats = await Registration.aggregate([
      { $match: { event: { $in: eventIds }, status: { $ne: 'cancelled' } } },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventInfo'
        }
      },
      { $unwind: '$eventInfo' },
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: 1 },
          totalCheckedIn: { $sum: { $cond: [{ $eq: ['$status', 'attended'] }, 1, 0] } },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'paid'] },
                { $ifNull: ['$eventInfo.price', 0] },
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = regStats[0] || {
      totalRegistrations: 0,
      totalCheckedIn: 0,
      totalRevenue: 0
    };

    const categoryDistribution = await Event.aggregate([
      { $match: { _id: { $in: eventIds } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalEvents: eventIds.length,
      totalRegistrations: stats.totalRegistrations,
      totalCheckedIn: stats.totalCheckedIn,
      attendanceRate: stats.totalRegistrations > 0 ? Math.round((stats.totalCheckedIn / stats.totalRegistrations) * 100) : 0,
      totalRevenue: stats.totalRevenue,
      categoryDistribution
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get platform-wide metrics for admins
export const getAdminMetrics = async (req, res) => {
  try {
    const [userStats, eventStats, regStats] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Event.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Registration.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const revenueStats = await Registration.aggregate([
      { $match: { status: { $ne: 'cancelled' }, paymentStatus: 'paid' } },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventInfo'
        }
      },
      { $unwind: '$eventInfo' },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$eventInfo.price', 0] } }
        }
      }
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const eventGrowth = await Event.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      users: userStats,
      events: eventStats,
      registrations: regStats,
      revenue: revenueStats[0]?.totalRevenue || 0,
      userGrowth,
      eventGrowth
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get system performance and health stats for admins
export const getSystemHealth = async (req, res) => {
  try {
    const memory = process.memoryUsage();
    const activeConnections = getActiveConnectionCount();

    res.json({
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        rss: Math.round(memory.rss / 1024 / 1024)
      },
      cpuLoad: os.loadavg(),
      activeConnections,
      freeMem: Math.round(os.freemem() / 1024 / 1024),
      totalMem: Math.round(os.totalmem() / 1024 / 1024)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
