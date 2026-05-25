import Event from '../models/Event.js';
import User from '../models/User.js';
import { sendEventRejectionEmail } from '../utils/email.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

const getBulkEventIds = (eventIds = []) => {
  const uniqueIds = [...new Set(eventIds.filter(Boolean))];
  const invalidIds = uniqueIds.filter((id) => !Event.db.base.Types.ObjectId.isValid(id));

  return { uniqueIds, invalidIds };
};

const buildBulkSummary = (results, eventIds) => {
  let succeeded = 0;
  let failed = 0;
  const errors = [];

  results.forEach((result, index) => {
    const eventId = eventIds[index];
    if (result.status === 'fulfilled') {
      succeeded += 1;
      return;
    }

    failed += 1;
    errors.push({
      eventId,
      error: result.reason?.message || 'Unknown error'
    });
  });

  return { succeeded, failed, errors };
};
import { createNotification } from './notificationController.js';

export const approveEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    ).populate('organizer', 'name email');
    if (!event) return res.status(404).json({ message: 'Not found' });
    
    if (event.organizer) {
      try {
        await createNotification(
          event.organizer._id,
          'event_approved',
          `Your event ${event.title} has been approved`,
          `/events/${event._id}`
        );
      } catch (notifErr) {
        console.error('Failed to create event approval notification:', notifErr);
      }
    }

    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const rejectEvent = async (req, res) => {
  try {
    const reason = req.body?.reason?.trim();

    if (!reason || reason.length < 20) {
      return res.status(400).json({
        message: 'Rejection reason is required and must be at least 20 characters long'
      });
    }

    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    if (!event) return res.status(404).json({ message: 'Not found' });

    event.status = 'rejected';
    event.rejectionReason = reason;
    await event.save();

    if (event.organizer?.email) {
      try {
        await sendEventRejectionEmail(event.organizer.email, event, reason);
      } catch (err) {
        console.warn(`Failed to send rejection email for event ${event._id}: ${err.message}`);
      }
    }

    if (event.organizer) {
      try {
        await createNotification(
          event.organizer._id,
          'event_rejected',
          `Your event ${event.title} was not approved`,
          `/events/${event._id}`
        );
      } catch (notifErr) {
        console.error('Failed to create event rejection notification:', notifErr);
      }
    }

    res.json({ message: 'Event rejected', event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listPendingEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'pending' }).populate('organizer', 'name email');
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'organizer', 'admin', 'attendee'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const bulkApproveEvents = async (req, res) => {
  try {
    const { eventIds } = req.body || {};

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ message: 'eventIds must be a non-empty array' });
    }

    const { uniqueIds, invalidIds } = getBulkEventIds(eventIds);

    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: 'One or more eventIds are invalid',
        invalidIds
      });
    }

    const results = await Promise.allSettled(
      uniqueIds.map(async (eventId) => {
        const updated = await Event.findByIdAndUpdate(
          eventId,
          { status: 'approved', rejectionReason: '' },
          { new: true }
        );

        if (!updated) {
          throw new Error('Event not found');
        }
      })
    );

    res.json(buildBulkSummary(results, uniqueIds));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const bulkRejectEvents = async (req, res) => {
  try {
    const { eventIds, rejectionReason } = req.body || {};
    const reason = rejectionReason?.trim();

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ message: 'eventIds must be a non-empty array' });
    }

    if (!reason || reason.length < 20) {
      return res.status(400).json({
        message: 'Rejection reason is required and must be at least 20 characters long'
      });
    }

    const { uniqueIds, invalidIds } = getBulkEventIds(eventIds);

    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: 'One or more eventIds are invalid',
        invalidIds
      });
    }

    const results = await Promise.allSettled(
      uniqueIds.map(async (eventId) => {
        const event = await Event.findById(eventId).populate('organizer', 'name email');

        if (!event) {
          throw new Error('Event not found');
        }

        event.status = 'rejected';
        event.rejectionReason = reason;
        await event.save();

        if (event.organizer?.email) {
          try {
            await sendEventRejectionEmail(event.organizer.email, event, reason);
          } catch (emailError) {
            console.warn(`Failed to send rejection email for event ${event._id}: ${emailError.message}`);
          }
        }
      })
    );

    res.json(buildBulkSummary(results, uniqueIds));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const bulkDeleteEvents = async (req, res) => {
  try {
    const { eventIds } = req.body || {};

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ message: 'eventIds must be a non-empty array' });
    }

    const { uniqueIds, invalidIds } = getBulkEventIds(eventIds);

    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: 'One or more eventIds are invalid',
        invalidIds
      });
    }

    const results = await Promise.allSettled(
      uniqueIds.map(async (eventId) => {
        const deleted = await Event.findByIdAndDelete(eventId);

        if (!deleted) {
          throw new Error('Event not found');
        }

        if (deleted.posterUrl) {
          try {
            await deleteFromCloudinary(deleted.posterUrl);
          } catch (cloudinaryError) {
            console.warn(`Failed to delete poster for event ${deleted._id}: ${cloudinaryError.message}`);
          }
        }
      })
    );

    res.json(buildBulkSummary(results, uniqueIds));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
