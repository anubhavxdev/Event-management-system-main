import User from '../models/User.js';
import { generateJwtToken } from '../utils/generateToken.js';

const handleAuthError = (res, err) => {
  console.error('ERROR:', err);

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Email already exists',
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors).map((error) => error.message).join(', '),
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password, role });
    const token = generateJwtToken({ id: user._id, role: user.role, name: user.name });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    return handleAuthError(res, err);
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
    return handleAuthError(res, err);
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, points: user.points, phoneNumber: user.phoneNumber, avatarUrl: user.avatarUrl } });
  } catch (err) {
    return handleAuthError(res, err);
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
    return handleAuthError(res, err);
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { access_token, role } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ message: 'Access token is required' });
    }

    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    if (!googleRes.ok) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }
    
    const googleUser = await googleRes.json();
    const { email, name, picture } = googleUser;
    
    let user = await User.findOne({ email });
    if (!user) {
      const generatedPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      user = await User.create({
        name,
        email,
        password: generatedPassword,
        role: role || 'attendee',
        avatarUrl: picture
      });
    } else if (user.isBlocked) {
      return res.status(403).json({ message: 'User is blocked' });
    }
    
    const token = generateJwtToken({ id: user._id, role: user.role, name: user.name });
    res.json({
      token,
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
    return handleAuthError(res, err);
  }
};

export const githubAuth = async (req, res) => {
  try {
    const { code, role } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'GitHub authorization code is required' });
    }

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      return res.status(400).json({ message: tokenData.error_description || 'Invalid GitHub code' });
    }
    
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from GitHub
    const userRes = await fetch('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });
    
    if (!userRes.ok) {
      return res.status(400).json({ message: 'Failed to fetch GitHub user' });
    }
    
    const githubUser = await userRes.json();
    let email = githubUser.email;
    const { name, avatar_url, login } = githubUser;
    
    // 3. If email is private, fetch from emails endpoint
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      });
      const emails = await emailRes.json();
      const primaryEmail = emails.find(e => e.primary) || emails[0];
      if (primaryEmail) {
        email = primaryEmail.email;
      }
    }
    
    if (!email) {
      return res.status(400).json({ message: 'No public or private email found on GitHub account' });
    }
    
    let user = await User.findOne({ email });
    if (!user) {
      const generatedPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      user = await User.create({
        name: name || login,
        email,
        password: generatedPassword,
        role: role || 'attendee',
        avatarUrl: avatar_url
      });
    } else if (user.isBlocked) {
      return res.status(403).json({ message: 'User is blocked' });
    }
    
    const token = generateJwtToken({ id: user._id, role: user.role, name: user.name });
    res.json({
      token,
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
    return handleAuthError(res, err);
  }
};
