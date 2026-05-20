import Event from '../models/Event.js';
import User from '../models/User.js';
import { sendEventRejectionEmail } from '../utils/email.js';

export const approveEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!event) return res.status(404).json({ message: 'Not found' });
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
    if (!['customer', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
