import Friend from '../models/Friend.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';

export const sendFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!friendId) {
      return res.status(400).json({
        message: 'Friend ID is required'
      });
    }

    // Check if user is trying to add themselves
    if (userId.toString() === friendId) {
      return res.status(400).json({
        message: 'Cannot send friend request to yourself'
      });
    }

    // Check if friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if request already exists (both pending and accepted)
    const existingFriend = await Friend.findOne({
      $or: [
        { userId: userId, friendId: friendId },
        { userId: friendId, friendId: userId }
      ]
    });

    if (existingFriend) {
      return res.status(400).json({
        message: 'Friend request already exists'
      });
    }

    // Create new friend request
    const newFriendRequest = new Friend({
      userId: userId,
      friendId: friendId,
      status: 'pending'
    });

    await newFriendRequest.save();

    res.status(201).json({
      message: 'Friend request sent successfully',
      friendRequest: newFriendRequest
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { friendRequestId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!friendRequestId) {
      return res.status(400).json({
        message: 'Friend request ID is required'
      });
    }

    const friendRequest = await Friend.findById(friendRequestId);

    if (!friendRequest) {
      return res.status(404).json({
        message: 'Friend request not found'
      });
    }

    // Check if the logged-in user is the recipient
    if (friendRequest.friendId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'You can only accept friend requests sent to you'
      });
    }

    // Check if already accepted
    if (friendRequest.status === 'accepted') {
      return res.status(400).json({
        message: 'Friend request already accepted'
      });
    }

    // Update status to accepted
    friendRequest.status = 'accepted';
    friendRequest.acceptedAt = new Date();

    await friendRequest.save();

    res.status(200).json({
      message: 'Friend request accepted successfully',
      friendRequest: friendRequest
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const { friendRequestId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!friendRequestId) {
      return res.status(400).json({
        message: 'Friend request ID is required'
      });
    }

    const friendRequest = await Friend.findById(friendRequestId);

    if (!friendRequest) {
      return res.status(404).json({
        message: 'Friend request not found'
      });
    }

    // Check if the logged-in user is the recipient or sender
    if (friendRequest.friendId.toString() !== userId.toString() && 
        friendRequest.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'You can only reject friend requests sent to you'
      });
    }

    // Delete the friend request
    await Friend.findByIdAndDelete(friendRequestId);

    res.status(200).json({
      message: 'Friend request rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!friendId) {
      return res.status(400).json({
        message: 'Friend ID is required'
      });
    }

    // Find and delete the friendship (works in both directions)
    const friendship = await Friend.findOneAndDelete({
      $or: [
        { userId: userId, friendId: friendId, status: 'accepted' },
        { userId: friendId, friendId: userId, status: 'accepted' }
      ]
    });

    if (!friendship) {
      return res.status(404).json({
        message: 'Friendship not found'
      });
    }

    res.status(200).json({
      message: 'Friend removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const getFriendsList = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Find all accepted friendships where user is either sender or receiver
    const friendships = await Friend.find({
      $or: [
        { userId: userId, status: 'accepted' },
        { friendId: userId, status: 'accepted' }
      ]
    }).populate('userId', 'name email avatarUrl').populate('friendId', 'name email avatarUrl');

    // Extract friend details from both directions
    const friends = friendships.map(friendship => {
      if (friendship.userId._id.toString() === userId.toString()) {
        return {
          _id: friendship.friendId._id,
          name: friendship.friendId.name,
          email: friendship.friendId.email,
          avatarUrl: friendship.friendId.avatarUrl,
          friendshipId: friendship._id,
          acceptedAt: friendship.acceptedAt
        };
      } else {
        return {
          _id: friendship.userId._id,
          name: friendship.userId.name,
          email: friendship.userId.email,
          avatarUrl: friendship.userId.avatarUrl,
          friendshipId: friendship._id,
          acceptedAt: friendship.acceptedAt
        };
      }
    });

    res.status(200).json({
      message: 'Friends list retrieved successfully',
      friends: friends
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Get pending requests where user is the recipient (friendId)
    const pendingRequests = await Friend.find({
      friendId: userId,
      status: 'pending'
    }).populate('userId', 'name email avatarUrl').populate('friendId', 'name email avatarUrl');

    const requests = pendingRequests.map(request => ({
      _id: request._id,
      fromUser: {
        _id: request.userId._id,
        name: request.userId.name,
        email: request.userId.email,
        avatarUrl: request.userId.avatarUrl
      },
      requestedAt: request.requestedAt,
      status: request.status
    }));

    res.status(200).json({
      message: 'Pending friend requests retrieved successfully',
      requests: requests
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const getFriendsAttendingEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id || req.user.id;

    if (!eventId) {
      return res.status(400).json({
        message: 'Event ID is required'
      });
    }

    // Get all friends of the user
    const friendships = await Friend.find({
      $or: [
        { userId: userId, status: 'accepted' },
        { friendId: userId, status: 'accepted' }
      ]
    });

    // Extract friend IDs
    const friendIds = friendships.map(friendship => {
      return friendship.userId._id.toString() === userId.toString()
        ? friendship.friendId
        : friendship.userId;
    });

    // Find registrations for the event by friends
    const eventRegistrations = await Registration.find({
      event: eventId,
      user: { $in: friendIds },
      status: { $ne: 'cancelled' }
    }).populate('user', 'name email avatarUrl');

    const friendsAttending = eventRegistrations.map(registration => ({
      _id: registration.user._id,
      name: registration.user.name,
      email: registration.user.email,
      avatarUrl: registration.user.avatarUrl,
      registrationStatus: registration.status
    }));

    res.status(200).json({
      message: 'Friends attending event retrieved successfully',
      friendsAttending: friendsAttending
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
