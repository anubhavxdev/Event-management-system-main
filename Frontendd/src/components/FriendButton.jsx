import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getPendingRequests,
  getFriendsList
} from '../services/friendService';
import { Button } from './ui/button';
import toast from 'react-hot-toast';

export default function FriendButton({ userId }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(null); // 'none', 'pending-sent', 'pending-received', 'friends'
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  // Check relationship status with the user
  const checkRelationshipStatus = useCallback(async () => {
    if (!user || !userId || user.id === userId) {
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);
      
      // Get pending requests received
      const pendingRes = await getPendingRequests();
      const pendingRequests = pendingRes.requests || [];
      
      // Get friends list
      const friendsRes = await getFriendsList();
      const friends = friendsRes.friends || [];

      // Check if already friends
      const isFriend = friends.some(f => f._id === userId);
      if (isFriend) {
        setStatus('friends');
        setRequestId(null);
        return;
      }

      // Check if pending request from this user
      const receivedRequest = pendingRequests.find(
        req => req.fromUser._id === userId
      );
      if (receivedRequest) {
        setStatus('pending-received');
        setRequestId(receivedRequest._id);
        return;
      }

      // If none of the above, check if we sent a request
      // We need to fetch pending requests sent (not received)
      // For now, we assume if not friends and no received request, then either no request or sent request
      // This is a limitation without an API endpoint to check sent requests
      
      setStatus('none');
      setRequestId(null);
    } catch (error) {
      console.error('Error checking relationship status:', error);
      setStatus('none');
    } finally {
      setIsChecking(false);
    }
  }, [user, userId]);

  useEffect(() => {
    checkRelationshipStatus();
  }, [checkRelationshipStatus]);

  const handleAddFriend = useCallback(async () => {
    try {
      setLoading(true);
      await sendFriendRequest(userId);
      setStatus('pending-sent');
      toast.success('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error(error.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleAcceptRequest = useCallback(async () => {
    if (!requestId) return;
    
    try {
      setLoading(true);
      await acceptFriendRequest(requestId);
      setStatus('friends');
      toast.success('Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error(error.message || 'Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  const handleRejectRequest = useCallback(async () => {
    if (!requestId) return;
    
    try {
      setLoading(true);
      await rejectFriendRequest(requestId);
      setStatus('none');
      setRequestId(null);
      toast.success('Friend request rejected');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error(error.message || 'Failed to reject friend request');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  const handleRemoveFriend = useCallback(async () => {
    try {
      setLoading(true);
      await removeFriend(userId);
      setStatus('none');
      setRequestId(null);
      toast.success('Friend removed');
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error(error.message || 'Failed to remove friend');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Don't show button for self
  if (user && user.id === userId) {
    return null;
  }

  if (isChecking) {
    return (
      <Button size="sm" disabled variant="outline">
        Loading...
      </Button>
    );
  }

  if (status === 'friends') {
    return (
      <Button
        size="sm"
        variant="destructive"
        onClick={handleRemoveFriend}
        disabled={loading}
      >
        {loading ? 'Removing...' : 'Remove Friend'}
      </Button>
    );
  }

  if (status === 'pending-sent') {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
      >
        Request Sent
      </Button>
    );
  }

  if (status === 'pending-received') {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleAcceptRequest}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          {loading ? 'Accepting...' : 'Accept'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRejectRequest}
          disabled={loading}
        >
          {loading ? 'Rejecting...' : 'Reject'}
        </Button>
      </div>
    );
  }

  // status === 'none'
  return (
    <Button
      size="sm"
      onClick={handleAddFriend}
      disabled={loading}
    >
      {loading ? 'Adding...' : 'Add Friend'}
    </Button>
  );
}
