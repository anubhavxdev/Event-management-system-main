import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { sendTicketEmail } from '../utils/email.js';
import { generateQRCodeDataUrl } from '../utils/qrcode.js';
import User from "../models/User.js";

export const addCoOrganizer = async (req, res) => {
  try {
    const { email } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // only owner can add
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only owner can add co-organizers",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // avoid duplicate
    if (
      event.coOrganizers.includes(user._id)
    ) {
      return res.status(400).json({
        message: "Already a co-organizer",
      });
    }

    event.coOrganizers.push(user._id);

    await event.save();

    res.status(200).json({
      message: "Co-organizer added successfully",
      coOrganizers: event.coOrganizers,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const removeCoOrganizer = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // only owner can remove
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only owner can remove co-organizers",
      });
    }

    event.coOrganizers = event.coOrganizers.filter(
      (id) => id.toString() !== req.params.userId
    );

    await event.save();

    res.status(200).json({
      message: "Co-organizer removed successfully",
      coOrganizers: event.coOrganizers,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

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
    const { q, category, status, organizer } = req.query;

    const filter = {};

    if (q) {
      filter.title = {
        $regex: q,
        $options: 'i',
      };
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (organizer) {
      filter.organizer = organizer;
    }

    const events = await Event.find(filter)
      .populate('organizer', 'name')
      .sort({ date: 1 });

    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        const registeredCount =
          await Registration.countDocuments({
            event: event._id,
            status: 'registered',
          });

        return {
          ...event.toObject(),
          registeredCount,
        };
      })
    );

    res.json({
      events: eventsWithCount,
    });

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
    ]);

    res.json({
      tags,
    });

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
    const isOwner =
  event.organizer.toString() === req.user.id;

const isCoOrganizer =
  event.coOrganizers?.some(
    (id) => id.toString() === req.user.id
  );

if (!isOwner && !isCoOrganizer) {
  return res.status(403).json({
    message: "Not authorized",
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