import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
   
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    capacity: {
      type: Number,
      default: 0,
    },

    registeredCount: {
      type: Number,
      default: 0,
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    coOrganizers: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
],

    posterUrl: {
      type: String,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) =>
        tags.map((tag) => tag.toLowerCase().trim()),
      validate: {
        validator: function (tags) {
          return (
            tags.length <= 10 &&
            tags.every((tag) => tag.length <= 30)
          );
        },
        message:
          'Maximum 10 tags allowed and each tag must be under 30 characters',
      },
    },

    averageRating: {
      type: Number,
      default: 0,
    },
    
    // Event price fields (temporary optional)
    price: { type: Number, default: 0 },
    isFree: {type:Boolean, default:true}
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', eventSchema);

export default Event;

