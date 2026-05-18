import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'pending',
    },
    acceptedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Ensure unique friend requests between two users
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

export const Friend = mongoose.model('Friend', friendSchema);

export default Friend;
