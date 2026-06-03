import { Server } from 'socket.io';
import Notification from '../models/Notification.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import os from 'os';

let ioInstance;
let activeConnectionCount = 0;

const getEventRoom = (eventId) => `event:${eventId}`;

export function getIO() {
  return ioInstance;
}

export function getActiveConnectionCount() {
  return activeConnectionCount;
}

export function emitAdminSystemStats() {
  if (!ioInstance) return;
  const memory = process.memoryUsage();
  ioInstance.to('admin_room').emit('admin:system-update', {
    activeConnections: activeConnectionCount,
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
      rss: Math.round(memory.rss / 1024 / 1024)
    },
    cpuLoad: os.loadavg(),
    freeMem: Math.round(os.freemem() / 1024 / 1024),
    totalMem: Math.round(os.totalmem() / 1024 / 1024)
  });
}

export function initSocket(server, clientOrigin) {
  ioInstance = new Server(server, {
    cors: { origin: clientOrigin, credentials: true },
  });

  ioInstance.on('connection', (socket) => {
    activeConnectionCount++;
    emitAdminSystemStats();

    socket.on('admin:join', () => {
      socket.join('admin_room');
      emitAdminSystemStats();
    });

    socket.on('announce', (message) => {
      ioInstance.emit('announcement', { message, at: Date.now() });
    });

    socket.on('event:join', (payload = {}) => {
      const eventId = payload?.eventId;
      if (!eventId) {
        return;
      }
      socket.join(getEventRoom(eventId));
    });

    socket.on('event:leave', (payload = {}) => {
      const eventId = payload?.eventId;
      if (!eventId) {
        return;
      }
      socket.leave(getEventRoom(eventId));
    });

    socket.on('user:join', (payload = {}) => {
      const userId = payload?.userId;
      if (!userId) {
        return;
      }
      socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
      activeConnectionCount = Math.max(0, activeConnectionCount - 1);
      emitAdminSystemStats();
    });
  });

  // Periodic system telemetry updates for admins
  setInterval(() => {
    if (activeConnectionCount > 0) {
      emitAdminSystemStats();
    }
  }, 5000);

  return ioInstance;
}

export function emitRegistrationCount(eventId, count) {
  if (!ioInstance || !eventId) {
    return;
  }

  ioInstance.to(getEventRoom(eventId)).emit('registration:count', {
    eventId: String(eventId),
    count,
  });
}

export function emitNotification(userId, notificationData) {
  if (!ioInstance || !userId) {
    return;
  }
  ioInstance.to(`user_${userId}`).emit('notification:new', notificationData);
}

export function emitAttendeeUpdate(eventId, registration) {
  if (!ioInstance || !eventId) {
    return;
  }
  ioInstance.to(getEventRoom(eventId)).emit('attendee:update', {
    eventId: String(eventId),
    registration,
  });
}

export function emitNewRegistration(eventId, registration) {
  if (!ioInstance || !eventId) {
    return;
  }
  ioInstance.to(getEventRoom(eventId)).emit('registration:new', registration);
}

export async function emitUnreadCount(userId) {
  if (!ioInstance || !userId) {
    return;
  }
  try {
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
    ioInstance.to(`user_${userId}`).emit('notification:unread_count', { unreadCount });
  } catch (error) {
    console.error('Error emitting unread count:', error);
  }
}

export async function emitEventAnalyticsUpdate(eventId) {
  if (!ioInstance || !eventId) return;
  try {
    const event = await Event.findById(eventId);
    if (!event) return;

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

    ioInstance.to(getEventRoom(eventId)).emit('analytics:event-update', {
      eventId: String(eventId),
      metrics: {
        totalRegistrations: stats.totalRegistrations,
        checkedInCount: stats.checkedInCount,
        waitlistCount: stats.waitlistCount,
        checkInRate: stats.totalRegistrations > 0 ? Math.round((stats.checkedInCount / stats.totalRegistrations) * 100) : 0,
        revenue
      }
    });

    // Also broadcast platform wide updates to admin room
    ioInstance.to('admin_room').emit('admin:activity-update', {
      type: 'registration_update',
      eventId: String(eventId),
      title: event.title
    });
  } catch (err) {
    console.error('Error emitting event analytics update:', err);
  }
}


