import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { generateQRCodeDataUrl } from '../utils/qrcode.js';
import { sendEmail } from '../utils/email.js';

export const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const alreadyRegistered = await Registration.findOne({ event: eventId, user: userId, status: { $ne: 'cancelled' } });
    if (alreadyRegistered) return res.status(400).json({ message: 'You are already registered for this event.' });
    const event = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: 'approved',
        $or: [
          { capacity: 0 },
          { $expr: { $lt: ['$registeredCount', '$capacity'] } }
        ]
      },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );
    if (!event) {
      const eventCheck = await Event.findById(eventId);
      if (!eventCheck || eventCheck.status !== 'approved') {
        return res.status(400).json({ message: 'Event not available' });
      }
      return res.status(400).json({ message: 'Event is fully booked' });
    }
    const payload = JSON.stringify({ userId: req.user.id, eventId: event._id, at: Date.now() });
    const qrCodeDataUrl = await generateQRCodeDataUrl(payload);
    const reg = await Registration.create({ user: req.user.id, event: event._id, qrCodeDataUrl });
    try {
      await sendEmail({ to: req.user.email, subject: `Registered: ${event.title}`, html: `<p>You are registered for ${event.title}.</p>` });
    } catch (_) { }
    res.status(201).json({ registration: reg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

    // Secure check-in handler (from fix/10-checkin-organizer-ownership)
    export const checkInParticipant = async (req, res) => {
      try {
        // Auth context validation
        // Verify caller is authenticated; auth middleware should populate req.user
        if (!req.user) {
          console.warn('[AUTH] Check-in attempt without auth context');
          return res.status(401).json({ message: 'Unauthorized: user not authenticated' });
        }
        if (!req.user.id || !req.user.role) {
          console.warn('[AUTH] Check-in attempt with invalid user context', { user: req.user });
          return res.status(401).json({ message: 'Unauthorized: invalid user context' });
        }

        // Request validation
        if (!req.body || !req.body.userId) {
          return res.status(400).json({ message: 'Bad Request: userId is required' });
        }

        // Validate status value (defensive)
        const validStatuses = ['attended', 'cancelled', 'no-show'];
        const status = (req.body.status || 'attended').toString().trim().toLowerCase();
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: `Invalid status: must be one of ${validStatuses.join(', ')}` });
        }

        // Load event and verify ownership for non-admin organizers
        const event = await Event.findById(req.params.id).select('organizer');
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Data integrity check
        if (!event.organizer) {
          console.error(`[ALERT] Event ${req.params.id} has missing organizer — investigate database integrity`);
          return res.status(500).json({ message: 'Server error: event data corrupted' });
        }

        // Admin bypass: admins may check in for any event
        if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
          console.warn(`[SECURITY] Unauthorized check-in attempt by organizer ${req.user.id} for event ${req.params.id}`);
          return res.status(403).json({ message: 'Forbidden: you are not the organizer of this event' });
        }

        // Perform atomic update
        const reg = await Registration.findOneAndUpdate(
          { user: req.body.userId, event: req.params.id },
          { status: status, checkedInAt: status === 'attended' ? new Date() : undefined },
          { new: true }
        );

        if (!reg) return res.status(404).json({ message: 'Registration not found for this user/event' });
        res.json({ registration: reg });
      } catch (err) {
        console.error(`[ERROR] Check-in failed for event ${req.params.id}:`, err.message);
        res.status(500).json({ message: 'Internal server error' });
      }
    };
export const checkRegistrationStatus = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      user: req.user.id,
      event: req.params.id
    });

    res.status(200).json({
      registered: !!registration,
      registration
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};
export const exportParticipantsCsv = async (req, res) => {
  try {
    const registrations = await Registration.find({
      event: req.params.id
    }).populate('user', 'name email');

    res.status(200).json({
      participants: registrations
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

export const myRegistrations = async (req, res) => {
	try {
		const registrations = await Registration.find({
			user: req.user.id
		}).populate('event');

		res.status(200).json({ registrations });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

export const participantsForEvent = async (req, res) => {
	try {
		const participants = await Registration.find({
			event: req.params.id
		}).populate('user', 'name email');

		res.status(200).json({ participants });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

export const checkInParticipant = async (req, res) => {
	try {
		if (!req.user) {
			return res.status(401).json({
				message: 'Unauthorized'
			});
		}

		const validStatuses = ['attended', 'cancelled', 'no-show'];

		const status = (req.body.status || 'attended')
			.toString()
			.trim()
			.toLowerCase();

		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				message: 'Invalid status'
			});
		}

		const event = await Event.findById(req.params.id).select(
			'organizer'
		);

		if (!event) {
			return res.status(404).json({
				message: 'Event not found'
			});
		}

		if (
			req.user.role !== 'admin' &&
			event.organizer.toString() !== req.user.id
		) {
			return res.status(403).json({
				message: 'Forbidden'
			});
		}

		const registration = await Registration.findOneAndUpdate(
			{
				user: req.body.userId,
				event: req.params.id
			},
			{
				status,
				checkedInAt:
					status === 'attended'
						? new Date()
						: undefined
			},
			{ new: true }
		);

		if (!registration) {
			return res.status(404).json({
				message: 'Registration not found'
			});
		}

		res.status(200).json({ registration });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

export const checkRegistrationStatus = async (req, res) => {
	try {
		const registration = await Registration.findOne({
			user: req.user.id,
			event: req.params.id
		});

		res.status(200).json({
			registered: !!registration,
			registration
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

export const exportParticipantsCsv = async (req, res) => {
	try {
		const eventId = req.params.id;

		const registrations = await Registration.find({
			event: eventId
		}).populate('user', 'name email');

		res.setHeader('Content-Type', 'text/csv');

		res.setHeader(
			'Content-Disposition',
			`attachment; filename=participants-${eventId}.csv`
		);

		const esc = (value) => {
			if (value === undefined || value === null) {
				return '';
			}

			const str =
				typeof value === 'string'
					? value
					: String(value);

			return `"${str.replace(/"/g, '""')}"`;
		};

		res.write(
			['Name', 'Email', 'Status', 'Registered At']
				.map(esc)
				.join(',') + '\n'
		);

		for (const registration of registrations) {
			const row = [
				registration.user?.name || '',
				registration.user?.email || '',
				registration.status || '',
				registration.createdAt
					? new Date(
							registration.createdAt
					  ).toISOString()
					: ''
			];

			res.write(row.map(esc).join(',') + '\n');
		}

		res.end();
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};