import User from '../models/User.js';
import { generateJwtToken } from '../utils/generateToken.js';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    // 1. Generate secure unhashed token for the email link
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash the token to save in DB securely
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const tokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // 3. Create user with verification details
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: tokenExpires
      // isEmailVerified schema me default false hai, toh explicitly likhne ki zarurat nahi
    });

    // 4. Construct verification URL (Frontend Route)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    // 5. Message for the email
    const message = `Welcome to the Platform, ${name}!\n\nPlease verify your email address by clicking the link below:\n\n${verifyUrl}\n\nThis link will expire in 24 hours.`;

    // 6. Attempt to send email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify Your Email Address',
        message: message
      });

      // No JWT generated here! We just tell the frontend it was successful.
      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.'
      });

    } catch (emailError) {
      // Rollback: Agar email fail ho jaye, toh DB se token clear kar do taaki baad me resend kiya ja sake
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Email sending failed:", emailError);
      return res.status(500).json({ message: 'Error sending verification email. Please try again later.' });
    }

  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
    });
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
    const token = generateJwtToken({ 
  id: user._id, 
  role: user.role, 
  name: user.name, 
  isVerified: user.isVerified // <-- Yeh line honi hi chahiye
});
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
  } catch (err) {
  console.error(err);

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Email already exists',
    });
  }

  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  });
}
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, points: user.points, phoneNumber: user.phoneNumber, avatarUrl: user.avatarUrl, isVerified: user.isVerified } });
  } catch (err) {
  console.error(err);

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Email already exists',
    });
  }

  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  });
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
  console.error(err);

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Email already exists',
    });
  }

  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  });
}
};

export const verifyEmail = async (req, res) => {
  try {
    // 1. Get token from URL params
    const { token } = req.params;

    // 2. Hash the token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 3. Find user with this token and check if it hasn't expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() } // $gt means 'greater than' current time
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token is invalid or has expired.' 
      });
    }

    // 4. Update user state
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email successfully verified. You can now log in.'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong during verification.'
    });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Update user
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Send email again
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;
    const message = `Hi ${user.name},\n\nPlease verify your email address by clicking the link below:\n\n${verifyUrl}\n\nThis link will expire in 24 hours.`;

    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email Address (Resend)',
      message: message
    });

    res.status(200).json({
      success: true,
      message: 'A fresh verification link has been sent to your email.'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong while resending the email.'
    });
  }
};