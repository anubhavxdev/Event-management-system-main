import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['registered', 'waitlisted', 'attended', 'cancelled'], default: 'registered' },
    qrCodeDataUrl: { type: String },
    checkedInAt: { type: Date },
    paymentStatus: {
      type: String,
      enum: ['free', 'pending', 'paid', 'failed', 'refunded'],
      default: 'free',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

registrationSchema.index({ user: 1, event: 1 }, { unique: true });

export const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;