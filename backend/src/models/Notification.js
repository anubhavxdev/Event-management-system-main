import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['registration_confirmed', 'event_approved', 'event_rejected', 'waitlist_promoted'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: 500,
  },
  link: {
    type: String,
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index: auto-delete after 30 days (2592000 seconds)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// Compound index for fast queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function (userId, type, message, link) {
  try {
    return await this.create({ user: userId, type, message, link });
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  return await this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
