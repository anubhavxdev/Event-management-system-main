import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['registered', 'waitlisted' ,  'attended', 'cancelled'], default: 'registered' },
    qrCodeDataUrl: { type: String },

    // Payment field that must be added by issue 76 - Feature: Integrate Razorpay Payment Gateway for paid event tickets 
    paymentId:{type:String,default:null},
    orderId:{type:String,default:null},
    paymentStatus:{type:String,enum: ['pending', 'paid', 'failed', 'refunded','not_applicable'],default:'not_applicable'},

    // Required fields for refund-flow
    refundedAt: {type: Date},
    refundId:{type:String,default: null},
    refundStatus:{type:String,enum:['pending','processed','failed','not_applicable'],default: "not_applicable"},
    refundAmount:{type:Number,default:0}

  },
  { timestamps: true }
);

registrationSchema.index({ user: 1, event: 1 }, { unique: true });

export const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
