import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { uploadOnCloudinary, deleteFromCloudinary, cloudinary } from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

const uploadStreamToCloudinary = (fileBuffer, folderName = 'eventone/posters') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: 'auto',
        format: 'webp',
        quality: 80,
        width: 1200,
        crop: 'limit',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    stream.end(fileBuffer);
  });
};

export const createEvent = async (req, res) => {
  try {
    let posterUrl;

    if (req.file) {
      const result = await uploadStreamToCloudinary(req.file.buffer, 'eventone/posters');
      posterUrl = result?.secure_url || '';
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

    // Parse gallery string into array if sent as JSON
    if (req.body.gallery) {
      try {
        req.body.gallery = JSON.parse(req.body.gallery);
      } catch (e) {
        // Already an array or invalid JSON, ignore
      }
    }

    const update = { ...req.body };

    if (req.file) {
      const result = await uploadStreamToCloudinary(req.file.buffer, 'eventone/posters');

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

    if (status) {
      if (status !== 'all') {
        filter.status = status;
      }
    } else {
      filter.status = 'approved';
    }

    if (q) {
      filter.title = {
        $regex: q,
        $options: 'i',
      };
    }

    if (category) filter.category = category;
    if (organizer) filter.organizer = organizer;

    if (tags) {
      const tagArray = tags
        .split(',')
        .map((tag) => tag.toLowerCase().trim())
        .filter(Boolean);

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

export const uploadGalleryImages = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Auth check: organizer must own the event
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized: Only the event organizer can perform this action' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const currentGalleryCount = event.gallery.length;
    const newFilesCount = req.files.length;

    if (currentGalleryCount + newFilesCount > 6) {
      return res.status(400).json({ message: `Exceeds maximum limit of 6 gallery images. Currently has ${currentGalleryCount}, trying to add ${newFilesCount}` });
    }

    // Validate size and mimetype
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/jpg'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    for (const file of req.files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: `Invalid file type: ${file.originalname}. Only JPEG, PNG, and WebP are allowed.` });
      }
      if (file.size > maxFileSize) {
        return res.status(400).json({ message: `File size too large: ${file.originalname}. Maximum file size is 5MB.` });
      }
    }

    // Process uploads
    const newUrls = [];
    for (const file of req.files) {
      const result = await uploadStreamToCloudinary(file.buffer, 'eventone/gallery');
      if (result && result.secure_url) {
        newUrls.push(result.secure_url);
      }
    }

    // Append to gallery and save
    event.gallery.push(...newUrls);
    await event.save();

    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteGalleryImage = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Auth check: organizer must own the event
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized: Only the event organizer can perform this action' });
    }

    const index = parseInt(req.params.imageIndex, 10);
    if (isNaN(index) || index < 0 || index >= event.gallery.length) {
      return res.status(400).json({ message: 'Invalid image index' });
    }

    const imageUrl = event.gallery[index];

    // If Cloudinary URL, delete from Cloudinary
    if (imageUrl.includes('cloudinary.com')) {
      await deleteFromCloudinary(imageUrl);
    } else if (imageUrl.includes('/uploads/')) {
      // Local file, try deleting it from local storage
      const filename = imageUrl.split('/uploads/')[1];
      if (filename) {
        const filepath = path.join(process.cwd(), 'uploads', filename);
        fs.unlink(filepath, (err) => {
          if (err) console.error('Failed to delete local gallery image:', err);
        });
      }
    }

    // Splice out of array and save
    event.gallery.splice(index, 1);
    await event.save();

    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
