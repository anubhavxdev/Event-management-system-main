import User from '../models/User.js';
import { generateJwtToken } from '../utils/generateToken.js';

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password, role });
    const token = generateJwtToken({ id: user._id, role: user.role, name: user.name });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
  console.error('ERROR:', err);
  res.status(500).json({ message: err.message });
}
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (user.isBlocked) return res.status(403).json({ message: 'User is blocked' });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
    const token = generateJwtToken({ id: user._id, role: user.role, name: user.name });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
  console.error('ERROR:', err);
  res.status(500).json({ message: err.message });
}
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, points: user.points, phoneNumber: user.phoneNumber, avatarUrl: user.avatarUrl } });
  } catch (err) {
  console.error('ERROR:', err);
  res.status(500).json({ message: err.message });
}
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber, avatarUrl } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (avatarUrl) updates.avatarUrl = avatarUrl;

    // Prevent duplicate email if email is being changed
    if (email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).lean();
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
  console.error('ERROR:', err);
  res.status(500).json({ message: err.message });
}
};
