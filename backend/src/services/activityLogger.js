import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog.js';
import { getIO } from './socket.js';

export async function logActivity({ actorId, action, eventId = null, description }) {
  try {
    const activity = await ActivityLog.create({
      actor: actorId,
      action,
      event: eventId,
      description,
    });

    const populatePaths = [];

    if (mongoose.models.User) {
      populatePaths.push({ path: 'actor', select: 'name email role' });
    }

    if (mongoose.models.Event) {
      populatePaths.push({ path: 'event', select: 'title' });
    }

    // Populate details
    const populated = populatePaths.length > 0
      ? await activity.populate(populatePaths)
      : activity;

    // Broadcast to the event room if eventId is provided
    if (eventId) {
      const io = getIO();
      if (io) {
        io.to(`event:${eventId}`).emit('activity:new', populated);
      }
    }

    return populated;
  } catch (error) {
    console.error('[logActivity] Error creating activity log:', error);
    return null;
  }
}
