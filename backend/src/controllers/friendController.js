import Friend from '../models/Friend.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import mongoose from 'mongoose';

// Send a friend request
export const requestFriend = async (req, res) => {
  try {
    const { userId } = req.params; // The ID of the user to send request to
    const myId = req.user.id;

    if (userId === myId) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // Check privacy settings
    if (targetUser.privacySettings?.allowFriendRequestsFrom === 'nobody') {
      return res.status(403).json({ message: "This user does not accept friend requests" });
    }

    // Check if request already exists
    const existing = await Friend.findOne({
      $or: [
        { userId: myId, friendId: userId },
        { userId: userId, friendId: myId }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: "Friend relationship or request already exists" });
    }

    const friendRequest = await Friend.create({
      userId: myId,
      friendId: userId,
      status: 'pending'
    });

    res.status(201).json({ message: "Friend request sent", request: friendRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept a friend request
export const acceptFriend = async (req, res) => {
  try {
    const { requestId } = req.params;
    const myId = req.user.id;

    const request = await Friend.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.friendId.toString() !== myId) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }

    if (request.status === 'accepted') {
      return res.status(400).json({ message: "Request already accepted" });
    }

    request.status = 'accepted';
    request.acceptedAt = new Date();
    await request.save();

    res.status(200).json({ message: "Friend request accepted", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a friend or reject a request
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const myId = req.user.id;

    // The param could be the friend relationship ID or the user ID of the friend
    // Assuming friendId is the user ID of the friend as per typical routes, but the route says /api/friends/:friendId, could be the User's ID or the relationship ID.
    // If it's the User's ID:
    const relationship = await Friend.findOneAndDelete({
      $or: [
        { userId: myId, friendId: friendId },
        { userId: friendId, friendId: myId }
      ]
    });

    if (!relationship) {
      // Maybe it was the relationship ID?
      const byRelId = await Friend.findOneAndDelete({
        _id: friendId,
        $or: [{ userId: myId }, { friendId: myId }]
      });
      if (!byRelId) {
         return res.status(404).json({ message: "Friend relationship not found" });
      }
    }

    res.status(200).json({ message: "Friend removed / Request deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get friends list for the current user
export const getFriends = async (req, res) => {
  try {
    const myId = req.user.id;
    const friends = await Friend.find({
      $or: [{ userId: myId }, { friendId: myId }]
    }).populate('userId friendId', 'name avatarUrl role');

    // Format the list
    const formatted = friends.map(f => {
      const isSender = f.userId._id.toString() === myId;
      const otherUser = isSender ? f.friendId : f.userId;
      return {
        id: f._id,
        user: otherUser,
        status: f.status,
        isSender
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get friends attending an event
export const getFriendsAttending = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const myId = req.user?.id;

    if (!myId) return res.status(200).json([]); // if not logged in

    // 1. Get all accepted friends of the user
    const relationships = await Friend.find({
      $or: [{ userId: myId }, { friendId: myId }],
      status: 'accepted'
    });

    const friendIds = relationships.map(rel => 
      rel.userId.toString() === myId ? rel.friendId.toString() : rel.userId.toString()
    );

    if (friendIds.length === 0) return res.status(200).json([]);

    // 2. Find which of these friends are registered for the event
    const registrations = await Registration.find({
      event: eventId,
      user: { $in: friendIds },
      status: 'registered' // Assuming status for successful registration
    }).populate({
      path: 'user',
      select: 'name avatarUrl privacySettings',
    });

    // 3. Filter by privacy settings
    const attendingFriends = registrations
      .map(reg => reg.user)
      .filter(user => user.privacySettings?.showAttendanceToFriends !== false);

    res.status(200).json(attendingFriends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Batch get friends attending multiple events
export const getBatchFriendsAttending = async (req, res) => {
  try {
    const eventIds = req.query.eventIds ? req.query.eventIds.split(',') : [];
    const myId = req.user?.id;

    if (!myId || eventIds.length === 0) return res.status(200).json({});

    // 1. Get all accepted friends of the user
    const relationships = await Friend.find({
      $or: [{ userId: myId }, { friendId: myId }],
      status: 'accepted'
    });

    const friendIds = relationships.map(rel => 
      rel.userId.toString() === myId ? rel.friendId.toString() : rel.userId.toString()
    );

    if (friendIds.length === 0) {
      const emptyResult = {};
      eventIds.forEach(id => { emptyResult[id] = []; });
      return res.status(200).json(emptyResult);
    }

    // 2. Find registrations for these friends and events
    const registrations = await Registration.find({
      event: { $in: eventIds },
      user: { $in: friendIds },
      status: 'registered'
    }).populate({
      path: 'user',
      select: 'name avatarUrl privacySettings',
    });

    // 3. Group by eventId and filter by privacy
    const result = {};
    eventIds.forEach(id => { result[id] = []; });

    registrations.forEach(reg => {
      if (reg.user?.privacySettings?.showAttendanceToFriends !== false) {
        const evId = reg.event.toString();
        if (result[evId]) {
          result[evId].push(reg.user);
        } else {
          result[evId] = [reg.user];
        }
      }
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
