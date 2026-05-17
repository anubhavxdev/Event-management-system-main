import Review from '../models/Review.js';
import Event from '../models/Event.js';

export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    // Check if user already reviewed this event
    const existingReview = await Review.findOne({ user: req.user.id, event: req.params.id });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this event. You can only post one review per event.' });
    }
    
    const review = await Review.create({ user: req.user.id, event: req.params.id, rating, comment });
    // Update event average rating
    const agg = await Review.aggregate([
      { $match: { event: review.event } },
      { $group: { _id: '$event', avg: { $avg: '$rating' } } },
    ]);
    const avg = agg[0]?.avg || 0;
    await Event.findByIdAndUpdate(review.event, { averageRating: avg });
    res.status(201).json({ review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this event. You can only post one review per event.' });
    }
    console.error('Review creation error:', err);
    res.status(500).json({ message: err.message });
  }
};

export const listReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ event: req.params.id }).populate('user', 'name');
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
