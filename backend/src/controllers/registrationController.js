import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';

import { generateQRCodeDataUrl } from '../utils/qrcode.js';
import { sendEmail } from '../utils/email.js';

import path from 'path';
import { calculateRefund } from '../utils/refundPolicy.js';
import { createObjectCsvWriter } from 'csv-writer';
import { emitRegistrationCount, emitAttendeeUpdate, emitNewRegistration } from '../services/socket.js';
import { createNotification } from './notificationController.js';

// Register for an event (handles capacity and waitlist status)
export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.status !== 'approved') {
      return res.status(400).json({ message: 'Event not available' });
    }

    // Check existing registration
    const existingRegistration = await Registration.findOne({
      user: req.user.id,
      event: event._id,
    });

    // If already active
    if (
      existingRegistration &&
      ['registered', 'waitlisted', 'attended'].includes(existingRegistration.status)
    ) {
      return res.status(400).json({
        message: 'Already registered or waitlisted',
      });
    }

    // Atomically check capacity and increment registeredCount only if under capacity
    const query = {
      _id: event._id,
      status: 'approved',
    };

    if (event.capacity > 0) {
      query.$expr = {
        $lt: ['$registeredCount', '$capacity'],
      };
    }

    const updatedEvent = await Event.findOneAndUpdate(
      query,
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({
        message: 'Event is full',
      });
    }

    const payload = JSON.stringify({
      userId: req.user.id,
      eventId: event._id,
      at: Date.now(),
    });
    const qrCodeDataUrl = await generateQRCodeDataUrl(payload);

    let registration;
    // Reuse cancelled registration if it exists
    if (existingRegistration && existingRegistration.status === 'cancelled') {
      existingRegistration.status = 'registered';
      existingRegistration.qrCodeDataUrl = qrCodeDataUrl;
      registration = await existingRegistration.save();
    } else {
      registration = await Registration.create({
        user: req.user.id,
        event: event._id,
        qrCodeDataUrl,
        status: 'registered',
      });
    }

    // Emit new registration count to socket rooms
    emitRegistrationCount(updatedEvent._id, updatedEvent.registeredCount);

    // Broadcast the new registration to the event room in real time
    try {
      await registration.populate('user', 'name email');
      const flatRegistration = {
        _id: registration._id,
        userId: registration.user?._id || registration.user,
        name: registration.user?.name || 'Unknown',
        email: registration.user?.email || 'N/A',
        status: registration.status,
        checkedIn: registration.status === 'attended',
        checkinTime: registration.status === 'attended' ? registration.updatedAt : null,
        createdAt: registration.createdAt,
      };
      emitNewRegistration(updatedEvent._id, flatRegistration);
    } catch (broadcastErr) {
      console.error('Failed to broadcast new registration:', broadcastErr);
    }

    // Send confirmation email
    try {
      await sendEmail({
        to: req.user.email,
        subject: `Registered: ${event.title}`,
        html: `<p>You are registered for ${event.title}.</p>`,
      });
    } catch (_) {}

    // Send confirmed notification
    try {
      await createNotification(
        req.user.id,
        'registration_confirmed',
        `Your registration for ${event.title} is confirmed`,
        `/events/${event._id}`
      );
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    res.status(201).json({
      registration,
      message: 'Successfully registered',
    });
  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).json({
      message: err.message,
    });
  }
};

// Fetch current user's registrations
export const myRegistrations = async (req, res) => {
  try {
    const regs = await Registration.find({ user: req.user.id }).populate('event');
    res.json({
      registrations: regs,
    });
  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get participants list mapped as flat structures for the organizer dashboard
export const participantsForEvent = async (req, res) => {
  try {
    const regs = await Registration.find({
      event: req.params.id,
    }).populate('user', 'name email');

    const mapped = regs.map((r) => ({
      _id: r._id,
      userId: r.user?._id || r.user,
      name: r.user?.name || 'Unknown',
      email: r.user?.email || 'N/A',
      status: r.status,
      checkedIn: r.status === 'attended',
      checkinTime: r.status === 'attended' ? r.updatedAt : null,
      createdAt: r.createdAt,
    }));

    res.json({
      participants: mapped,
    });
  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).json({
      message: err.message,
    });
  }
};

// Secure check-in handler supporting registration ID or event/user ID queries
export const checkInParticipant = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Unauthorized: user not authenticated',
      });
    }

    const validStatuses = ['attended', 'cancelled', 'no-show'];
    const status = (req.body?.status || 'attended')
      .toString()
      .trim()
      .toLowerCase();

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status',
      });
    }

    // Check query format: Search by event + user ID if provided, otherwise assume reg ID
    let query = {};
    if (req.body && req.body.userId) {
      query = { event: req.params.id, user: req.body.userId };
    } else {
      query = { _id: req.params.id };
    }

    const registration = await Registration.findOne(query).populate('event');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Ownership check: organizer, co-organizers, or admin only
    const isOrganizer =
      registration.event?.organizer?.toString() === req.user.id ||
      registration.event?.coOrganizers?.some((co) => co.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        message: 'Forbidden: Only the event organizer, co-organizers, or admin can check in participants',
      });
    }

    registration.status = status;
    await registration.save();

    // Populate user info for socket updates and scanner response
    await registration.populate('user', 'name email');

    // Broadcast check-in update to event room
    emitAttendeeUpdate(registration.event._id, registration);

    return res.json({
      message: 'Check-in updated',
      registration,
      attendeeName: registration.user?.name,
    });
  } catch (err) {
    console.error('[checkInParticipant] Error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// Export attendee lists as CSV
export const exportParticipantsCsv = async (req, res) => {
  try {
    const regs = await Registration.find({ event: req.params.id }).populate('user', 'name email');
    const rows = regs.map((r) => ({
      name: r.user?.name || '',
      email: r.user?.email || '',
      status: r.status,
      registeredAt: r.createdAt,
    }));
    const filePath = path.join(process.cwd(), `participants-${req.params.id}.csv`);
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'status', title: 'Status' },
        { id: 'registeredAt', title: 'Registered At' },
      ],
    });
    await csvWriter.writeRecords(rows);
    res.download(filePath);
  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};

// Check if a user is registered or waitlisted for an event
export const checkRegistrationStatus = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      event: req.params.id,
      user: req.user.id,
    });

    res.json({
      isRegistered: registration?.status === 'registered' || registration?.status === 'attended',
      isWaitlisted: registration?.status === 'waitlisted',
      registration,
      event: req.params.id,
    });
  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};

// Promote a participant from the waitlist to registered status
export const promoteFromWaitlist = async (eventId) => {
  const nextRegistration = await Registration.findOne({
    event: eventId,
    status: 'waitlisted',
  })
    .sort({ createdAt: 1 })
    .populate('user')
    .populate('event');

  if (!nextRegistration) {
    return false;
  }

  const payload = JSON.stringify({
    userId: nextRegistration.user._id,
    eventId: nextRegistration.event._id,
    at: Date.now(),
  });

  const qrCodeDataUrl = await generateQRCodeDataUrl(payload);

  nextRegistration.status = 'registered';
  nextRegistration.qrCodeDataUrl = qrCodeDataUrl;
  await nextRegistration.save();

  // Atomically increment registeredCount on Event
  await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

  try {
    await sendEmail({
      to: nextRegistration.user.email,
      subject: `Spot Confirmed: ${nextRegistration.event.title}`,
      html: `
        <p>You have been promoted from the waitlist.</p>
        <p>Your registration for ${nextRegistration.event.title} is now confirmed.</p>
      `,
    });
  } catch (_) {}

  try {
    await createNotification(
      nextRegistration.user._id,
      'waitlist_promoted',
      `Good news! A spot opened up for ${nextRegistration.event.title}`,
      `/events/${nextRegistration.event._id}`
    );
  } catch (notifErr) {
    console.error('Failed to create waitlist notification:', notifErr);
  }

  // Notify organizer of status update
  emitAttendeeUpdate(eventId, nextRegistration);

  return true;
};

// Cancel an event registration (releases spots and triggers waitlist promotion)
export const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const registration = await Registration.findById(id).populate('event');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    if (registration.user.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const previousStatus = registration.status;
    if (previousStatus === 'cancelled') {
      return res.status(400).json({ message: 'Already cancelled' });
    }
    const eventDate = new Date(registration.event.date);
    if (eventDate < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel past events' });
    }

    registration.status = 'cancelled';
    await registration.save();

    const event = await Event.findById(registration.event._id);
    if (event) {
      // Decrement count and promote only if they had a confirmed spot
      if (previousStatus === 'registered' || previousStatus === 'attended') {
        event.registeredCount = Math.max(0, event.registeredCount - 1);
        await event.save();

        // Atomically promote next waitlisted user
        await promoteFromWaitlist(event._id);
      }

      // Fetch final updated count
      const updatedEvent = await Event.findById(event._id);
      emitRegistrationCount(updatedEvent._id, updatedEvent.registeredCount);
    }

    // Broadcast cancelled status to organizer
    await registration.populate('user', 'name email');
    emitAttendeeUpdate(registration.event._id, registration);

    res.status(200).json({ message: 'Registration cancelled successfully', registration });
  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// Check refund status for a registration
export const checkRefundStatus = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    res.json({
      refundStatus: registration.refundStatus || 'not_applicable',
      refundAmount: registration.refundAmount || 0,
      refundedAt: registration.refundedAt || null,
      refundId: registration.refundId || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Calculate potential refund policy terms
export const checkRefundPolicy = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('event');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    const refund = calculateRefund(registration.event.date, registration.event.price || 0);
    res.json(refund);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
