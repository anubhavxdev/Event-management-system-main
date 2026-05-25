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


export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.status !== 'approved') return res.status(400).json({ message: 'Event not available' });
    const payload = JSON.stringify({ userId: req.user.id, eventId: event._id, at: Date.now() });
    const qrCodeDataUrl = await generateQRCodeDataUrl(payload);

    // Current implementation includes : 
    // Checks for an existing cancelled registration
    // Reactivating the existing registration instead of inserting a new record
    // Capacity validation on event registration
    // Keeps the audit trail intact while avoiding unique index conflicts

    // Check active registration
    const activeRegistrations = await Registration.countDocuments({
      event: req.params.id,
      status: { $ne: "cancelled" },
    });

    // Capacity validation
    if (activeRegistrations >= event.capacity && event.capacity > 0) {
      return res.status(400).json({
        message: "Event is fully booked"
      })
    }

    // To reinitiate the existing registered event
    const existingRegistration = await Registration.findOne({ user: req.user.id, event: req.params.id });

    if (existingRegistration) {
      if (existingRegistration.status === "cancelled") {
        existingRegistration.status = 'registered';
      }

    if (!event || event.status !== 'approved') {
      return res.status(400).json({
        message: 'Event not available',
      });
    }

    // Check existing registration
    const existingRegistration = await Registration.findOne({
      user: req.user.id,
      event: event._id,
    });

    // Already active
    if (
      existingRegistration &&
      ['registered', 'waitlisted', 'attended'].includes(
        existingRegistration.status
      )
    ) {
      return res.status(400).json({
        message: 'Already registered or waitlisted',
      });
    }

    // Atomically increment count only if under capacity
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: event._id,
        status: 'approved',
        $expr: {
          $lt: ['$registeredCount', '$capacity'],
        },
      },
      {
        $inc: {
          registeredCount: 1,
        },
      },
      {
        new: true,
      }
    );

      return res.status(201).json({
        registration: existingRegistration,
      })
    }

    else {
      const reg = await Registration.create({ user: req.user.id, event: event._id, qrCodeDataUrl });
      try {
        await sendEmail({ to: req.user.email, subject: `Registered: ${event.title}`, html: `<p>You are registered for ${event.title}.</p>` });
      } catch (_) { }
    // Event is full — reject immediately, no registration created
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

    const qrCodeDataUrl =
      await generateQRCodeDataUrl(payload);

    let registration;

    // Reuse cancelled registration
    if (
      existingRegistration &&
      existingRegistration.status === 'cancelled'
    ) {
      existingRegistration.status = 'registered';
      existingRegistration.qrCodeDataUrl =
        qrCodeDataUrl;

      registration =
        await existingRegistration.save();
    } else {
      try {
        registration = await Registration.create({
          user: req.user.id,
          event: event._id,
          qrCodeDataUrl,
          status: 'registered',
        });
      } catch (dupErr) {
        if (dupErr.code === 11000) {
          await Event.findByIdAndUpdate(
            event._id,
            {
              $inc: {
                registeredCount: -1,
              },
            }
          );

          return res.status(400).json({
            message:
              'Already registered or waitlisted',
          });
        }

        throw dupErr;
      }
    }


    // Send email
    emitRegistrationCount(
      updatedEvent._id,
      updatedEvent.registeredCount,
    );

    try {
      await sendEmail({
        to: req.user.email,
        subject: `Registered: ${event.title}`,
        html: `<p>You are registered for ${event.title}.</p>`,
      });
    } catch (_) {}

    // Send notification
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

// Fetch registrations with waitlist position
export const myRegistrations = async (
  req,
  res
) => {
  try {
    const regs = await Registration.find({ user: req.user.id }).populate('event');

    
    const payload = JSON.stringify({ userId: req.user.id, eventId: event._id, at: Date.now() });
    const qrCodeDataUrl = await generateQRCodeDataUrl(payload);
    
    // Current implementation includes : 
    // Checks for an existing cancelled registration
    // Reactivating the existing registration instead of inserting a new record
    // Capacity validation on event registration
    // Keeps the audit trail intact while avoiding unique index conflicts

    // Check active registration
    const activeRegistrations = await Registration.countDocuments({
      event: req.params.id,
      status: { $ne: "cancelled" },
    });

    // Capacity validation
    if (activeRegistrations>=event.capacity && event.capacity>0){
      return res.status(400).json({
        message:"Event is fully booked"
      })
    }

    // To reinitiate the existing registered event
    const existingRegistration = await Registration.findOne({user:req.user.id,event:req.params.id});

    if (existingRegistration){
      if (existingRegistration.status==="cancelled"){
          existingRegistration.status = 'registered';
      }

      await existingRegistration.save();
      try {
        await sendEmail({ to: req.user.email, subject: `Registered: ${event.title}`, html: `<p>You are registered for ${event.title}.</p>` });
      } catch (_) { }

      return res.status(201).json({
        registration:existingRegistration,
      })
    }

    else{
      const reg = await Registration.create({ user: req.user.id, event: event._id, qrCodeDataUrl });
      try {
        await sendEmail({ to: req.user.email, subject: `Registered: ${event.title}`, html: `<p>You are registered for ${event.title}.</p>` });
      } catch (_) { }

      res.status(201).json({ registration: reg });
    }

    

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// fetching registrations with waiting position


export const participantsForEvent = async (req, res) => {
  try {
    const regs = await Registration.find({
      event: req.params.id,
    }).populate('user', 'name email');

    res.json({
      participants: regs,
    });

  } catch (err) {
    console.error('ERROR:', err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// Get participants for organizer/admin
export const participantsForEvent =
  async (req, res) => {
    try {
      const regs = await Registration.find({
        event: req.params.id,
      }).populate('user', 'name email');

      res.json({
        participants: regs,
      });
    } catch (err) {
      console.error('ERROR:', err);

      res.status(500).json({
        message: err.message,
      });
    }
  };

// Secure check-in handler
export const checkInParticipant =
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message:
            'Unauthorized: user not authenticated',
        });
      }

      if (!req.body || !req.body.userId) {
        return res.status(400).json({
          message:
            'Bad Request: userId is required',
        });
      }

      const validStatuses = [
        'attended',
        'cancelled',
        'no-show',
      ];

      const status = (
        req.body.status || 'attended'
      )
        .toString()
        .trim()
        .toLowerCase();

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Invalid status',
        });
      }

    // Perform atomic update
    const registration = await Registration.findOneAndUpdate(
      { event: req.params.id, user: req.body.userId },
      { status },
      { new: true }
    );
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found for this user and event' });
    }
    return res.json({ message: 'Check-in updated', registration });
  } catch (err) {
    console.error('[checkInParticipant] Error:', err);
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
    res.download(filePath);
  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};

        isWaitlisted:
          registration?.status ===
          'waitlisted',

    res.json({
      isRegistered: registration?.status === 'registered',
      isWaitlisted: registration?.status === 'waitlisted',
      registration,
      event: req.params.id
    });
  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};


// promoting from waitlist to registered
export const promoteFromWaitlist = async (eventId) => {
  const nextRegistration = await Registration.findOne({
    event: eventId,
    status: 'waitlisted',
  })
    .sort({ createdAt: 1 })
    .populate('user')
    .populate('event');

    const payload = JSON.stringify({
      userId:
        nextRegistration.user._id,
      eventId:
        nextRegistration.event._id,
      at: Date.now(),
    });

    const qrCodeDataUrl =
      await generateQRCodeDataUrl(
        payload
      );

    nextRegistration.status =
      'registered';

    nextRegistration.qrCodeDataUrl =
      qrCodeDataUrl;

    await nextRegistration.save();

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
  };

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
    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Already cancelled' });
    }
    const eventDate = new Date(registration.event.date);
    if (eventDate < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel past events' });
    }
    registration.status = 'cancelled';
    await registration.save();
    res.status(200).json({ message: 'Registration cancelled successfully', registration });
  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};
