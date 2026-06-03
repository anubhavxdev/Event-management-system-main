import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';

import { generateQRCodeDataUrl } from '../utils/qrcode.js';
import { sendEmail } from '../utils/email.js';
import path from 'path';
import { calculateRefund } from '../utils/refundPolicy.js';
import { createObjectCsvWriter } from 'csv-writer';
import { emitRegistrationCount } from '../services/socket.js';
import { createNotification } from './notificationController.js';

const getWaitlistPosition = async (registration) => {
  if (!registration || registration.status !== 'waitlisted') {
    return null;
  }

  const count = await Registration.countDocuments({
    event: registration.event,
    status: 'waitlisted',
    createdAt: { $lt: registration.createdAt },
  });

  return count + 1;
};

export const checkRegistrationStatus = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      user: req.user.id,
      event: req.params.id,
    }).populate('event');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    return res.json({
      registration,
      isRegistered: registration.status === 'registered',
      isWaitlisted: registration.status === 'waitlisted',
      waitlistPosition: await getWaitlistPosition(registration),
    });
  } catch (err) {
    console.error('[checkRegistrationStatus] ERROR:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.status !== 'approved') {
      return res.status(400).json({ message: 'Event not available' });
    }

    const existingRegistration = await Registration.findOne({
      user: req.user.id,
      event: event._id,
    });

    const qrCodeDataUrl = await generateQRCodeDataUrl(
      JSON.stringify({
        userId: req.user.id,
        eventId: event._id,
        at: Date.now(),
      })
    );

    if (existingRegistration) {
      if (['registered', 'waitlisted', 'attended'].includes(existingRegistration.status)) {
        return res.status(400).json({ message: 'Already registered or waitlisted' });
      }

      existingRegistration.status =
        event.capacity > 0 && event.registeredCount >= event.capacity
          ? 'waitlisted'
          : 'registered';
      existingRegistration.qrCodeDataUrl = qrCodeDataUrl;
      await existingRegistration.save();

      if (existingRegistration.status === 'registered') {
        await Event.findByIdAndUpdate(event._id, { $inc: { registeredCount: 1 } });
        emitRegistrationCount(event._id, event.registeredCount + 1);
      }

      try {
        await sendEmail({
          to: req.user.email,
          subject: `Registration ${existingRegistration.status === 'registered' ? 'Confirmed' : 'Waitlisted'}: ${event.title}`,
          html: `<p>Your registration for ${event.title} is ${existingRegistration.status}.</p>`,
        });
      } catch (_) {}

      return res.status(200).json({
        message:
          existingRegistration.status === 'registered'
            ? 'Successfully registered'
            : 'Added to waitlist',
        registration: existingRegistration,
      });
    }

    const isFull = event.capacity > 0 && event.registeredCount >= event.capacity;
    const status = isFull ? 'waitlisted' : 'registered';

    const registration = await Registration.create({
      user: req.user.id,
      event: event._id,
      qrCodeDataUrl,
      status,
    });

    if (status === 'registered') {
      await Event.findByIdAndUpdate(event._id, { $inc: { registeredCount: 1 } });
      emitRegistrationCount(event._id, event.registeredCount + 1);
    }

    try {
      await sendEmail({
        to: req.user.email,
        subject: `Registration ${status === 'registered' ? 'Confirmed' : 'Waitlisted'}: ${event.title}`,
        html: `<p>Your registration for ${event.title} is ${status}.</p>`,
      });
    } catch (_) {}

    try {
      await createNotification(
        req.user.id,
        status === 'registered' ? 'registration_confirmed' : 'waitlist_promoted',
        status === 'registered'
          ? `Your registration for ${event.title} is confirmed`
          : `You are waitlisted for ${event.title}`,
        `/events/${event._id}`
      );
    } catch (_) {}

    return res.status(201).json({
      message: status === 'registered' ? 'Successfully registered' : 'Added to waitlist',
      registration,
    });
  } catch (err) {
    console.error('[registerForEvent] ERROR:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const myRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user.id }).populate('event');
    const results = await Promise.all(
      registrations.map(async (registration) => ({
        ...registration.toObject(),
        waitlistPosition: await getWaitlistPosition(registration),
      }))
    );

    return res.json({ registrations: results });
  } catch (err) {
    console.error('[myRegistrations] ERROR:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const participantsForEvent = async (req, res) => {
  try {
    const participants = await Registration.find({ event: req.params.id }).populate('user', 'name email');
    return res.json({ participants });
  } catch (err) {
    console.error('[participantsForEvent] ERROR:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const checkInParticipant = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('event');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    registration.status = 'attended';
    await registration.save();

    return res.json({ message: 'Check-in updated', registration });
  } catch (err) {
    console.error('[checkInParticipant] ERROR:', err);
    return res.status(500).json({ message: err.message });
  }
};

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
    return res.download(filePath);
  } catch (err) {
    console.error('[exportParticipantsCsv] ERROR:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const checkRefundStatus = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('event');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    return res.json({
      refundStatus: registration.refundStatus,
      refundAmount: registration.refundAmount,
      refundedAt: registration.refundedAt,
      refundId: registration.refundId,
    });
  } catch (err) {
    console.error('[checkRefundStatus] ERROR:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const checkRefundPolicy = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('event');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const eventDate = new Date(registration.event.date);
    const refund = calculateRefund(eventDate, registration.event.price || 0);

    return res.json({ refundPolicy: refund });
  } catch (err) {
    console.error('[checkRefundPolicy] ERROR:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('event');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Already cancelled' });
    }

    const eventDate = new Date(registration.event.date);
    if (eventDate < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel past events' });
    }

    const wasRegistered = registration.status === 'registered';
    const refund = calculateRefund(eventDate, registration.event.price || 0);

    registration.status = 'cancelled';
    registration.refundStatus = refund.status;
    registration.refundAmount = refund.refundAmount;
    registration.refundedAt = refund.eligible ? new Date() : registration.refundedAt;
    await registration.save();

    if (wasRegistered) {
      await Event.findByIdAndUpdate(registration.event._id, { $inc: { registeredCount: -1 } });
      await promoteFromWaitlist(registration.event._id);
      emitRegistrationCount(registration.event._id, Math.max((registration.event.registeredCount || 1) - 1, 0));
    }

    return res.json({ message: 'Registration cancelled successfully', registration, refund });
  } catch (err) {
    console.error('[cancelRegistration] ERROR:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const promoteFromWaitlist = async (eventId) => {
  try {
    const event = await Event.findById(eventId);
    if (!event || event.status !== 'approved') {
      return;
    }

    if (event.capacity > 0 && event.registeredCount >= event.capacity) {
      return;
    }

    const nextRegistration = await Registration.findOne({
      event: eventId,
      status: 'waitlisted',
    })
      .sort({ createdAt: 1 })
      .populate('user')
      .populate('event');

    if (!nextRegistration) {
      return;
    }

    nextRegistration.status = 'registered';
    nextRegistration.qrCodeDataUrl = await generateQRCodeDataUrl(
      JSON.stringify({
        userId: nextRegistration.user._id,
        eventId: nextRegistration.event._id,
        at: Date.now(),
      })
    );

    await nextRegistration.save();
    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

    try {
      await sendEmail({
        to: nextRegistration.user.email,
        subject: `Spot Confirmed: ${nextRegistration.event.title}`,
        html: `<p>You have been promoted from the waitlist for ${nextRegistration.event.title}.</p>`,
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
  } catch (err) {
    console.error('[promoteFromWaitlist] ERROR:', err);
  }
};
