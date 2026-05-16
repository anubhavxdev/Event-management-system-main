import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { generateQRCodeDataUrl } from '../utils/qrcode.js';
import { sendEmail } from '../utils/email.js';

export const registerForEvent = async (req, res) => {
	try {
		const event = await Event.findById(req.params.id);

		if (!event || event.status !== 'approved') {
			return res.status(400).json({
				message: 'Event not available'
			});
		}

		const existingRegistration = await Registration.findOne({
			user: req.user.id,
			event: event._id
		});

		if (existingRegistration) {
			return res.status(400).json({
				message: 'Already registered for this event'
			});
		}

		const updatedEvent = await Event.findOneAndUpdate(
			{
				_id: event._id,
				$expr: { $lt: ['$registeredCount', '$capacity'] }
			},
			{
				$inc: { registeredCount: 1 }
			},
			{ new: true }
		);

		if (!updatedEvent) {
			return res.status(409).json({
				message: 'Event capacity reached'
			});
		}

		const payload = JSON.stringify({
			userId: req.user.id,
			eventId: event._id,
			at: Date.now()
		});

		const qrCodeDataUrl = await generateQRCodeDataUrl(payload);

		const registration = await Registration.create({
			user: req.user.id,
			event: event._id,
			qrCodeDataUrl
		});

		try {
			await sendEmail({
				to: req.user.email,
				subject: `Registered: ${event.title}`,
				html: `<p>You are registered for ${event.title}.</p>`
			});
		} catch (_) {}

		res.status(201).json({ registration });
	} catch (err) {
		res.status(500).json({ message: err.message });
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