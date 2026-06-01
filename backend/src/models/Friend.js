import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'pending'
    },

    requestedAt: {
      type: Date,
      default: Date.now
    },

    acceptedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

export const Friend = mongoose.model('Friend', friendSchema);

export default Friend;
