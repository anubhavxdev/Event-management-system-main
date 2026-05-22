import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { sendTicketEmail } from '../utils/email.js';
import { generateQRCodeDataUrl } from '../utils/qrcode.js';

export const createEvent = async (req, res) => {
  try {
    let posterUrl;

    if (req.file) {
      const result = await uploadOnCloudinary(req.file.path);
      posterUrl = result?.secure_url;
    }

    // Parse tags string into array
    if (req.body.tags) {
      req.body.tags = JSON.parse(req.body.tags);
    }

    const event = await Event.create({
      ...req.body,
      organizer: req.user.id,
      posterUrl,
    });

    res.status(201).json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEvent = async (req, res) => {
  try {

    // Parse tags string into array
    if (req.body.tags) {
      req.body.tags = JSON.parse(req.body.tags);
    }

    const update = { ...req.body };

    if (req.file) {
      // Upload new poster to Cloudinary
      const result = await uploadOnCloudinary(req.file.path);

      if (result?.secure_url) {
        update.posterUrl = result.secure_url;
      }
    }

    // Fetch the old event
    const oldEvent = await Event.findOne({
      _id: req.params.id,
      organizer: req.user.id,
    }).lean();

    if (!oldEvent) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    if (oldEvent.status === 'rejected') {
      update.status = 'pending';
      update.rejectionReason = '';
    }

    const event = await Event.findOneAndUpdate(
      {
        _id: req.params.id,
        organizer: req.user.id,
      },
      update,
      { new: true }
    );

    // Delete old poster after successful update
    if (update.posterUrl && oldEvent.posterUrl) {
      await deleteFromCloudinary(oldEvent.posterUrl);
    }

    res.json({ event });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      organizer: req.user.id,
    });

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    // Clean up poster
    if (event.posterUrl) {
      await deleteFromCloudinary(event.posterUrl);
    }

    res.json({
      message: 'Deleted',
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export const listEvents = async (req, res) => {
  try {
    const { q, category, status, organizer, tags } = req.query;

    const filter = {
      status: 'approved',
    };

    // Search by title
    if (q) {
      filter.title = {
        $regex: q,
        $options: 'i',
      };
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by organizer
    if (organizer) {
      filter.organizer = organizer;
    }

    // Filter by tags (AND logic)
    if (tags) {
      const tagArray = tags
        .split(',')
        .map((tag) => tag.toLowerCase().trim())
        .filter(Boolean);

      filter.tags = {
        $all: tagArray,
      };
    }

    const events = await Event.find(filter)
      .populate('organizer', 'name')
      .sort({ date: 1 });

    res.json({ events });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export const getPopularTags = async (req, res) => {
  try {
    const tags = await Event.aggregate([
      {
        $match: {
          status: 'approved',
        },
      },

      {
        $unwind: '$tags',
      },

      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },

      {
        $sort: {
          count: -1,
        },
      },

      {
        $limit: 20,
      },

      {
        $project: {
          _id: 0,
          tag: '$_id',
          count: 1,
        },
      },
    ]);

    res.json({ tags });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name');

    if (!event) {
      return res.status(404).json({
        message: 'Not found',
      });
    }

    const count = await Registration.countDocuments({
      event: event._id,
      status: { $ne: 'cancelled' },
    });

    res.json({
      event,
      registrations: count,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

export const sendEventReminders = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    // Only organizer can send reminders
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Not authorized: Only the event organizer can send reminders',
      });
    }

    const registrations = await Registration.find({
      event: event._id,
      status: 'registered',
    }).populate('user');

    let sentCount = 0;

    for (const reg of registrations) {
      if (reg.user && reg.user.email) {

        let qrCode = reg.qrCodeDataUrl;

        if (!qrCode) {
          qrCode = await generateQRCodeDataUrl(
            JSON.stringify({
              registrationId: reg._id,
              eventId: event._id,
              userId: reg.user._id,
            })
          );

          reg.qrCodeDataUrl = qrCode;
          await reg.save();
        }

        await sendTicketEmail(
          reg.user.email,
          event,
          reg._id,
          qrCode
        );

        sentCount++;
      }
    }

    res.json({
      message: `Sent reminders to ${sentCount} participants`,
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};