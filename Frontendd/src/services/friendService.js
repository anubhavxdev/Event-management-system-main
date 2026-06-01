import { API_BASE_URL } from '../config';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const sendFriendRequest = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/friends/request/${userId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send friend request');
    }

    return data;
  } catch (error) {
    console.error('Send friend request error:', error);
    throw error;
  }
};

export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/friends/accept/${requestId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to accept friend request');
    }

    return data;
  } catch (error) {
    console.error('Accept friend request error:', error);
    throw error;
  }
};

export const rejectFriendRequest = async (requestId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/friends/reject/${requestId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reject friend request');
    }

    return data;
  } catch (error) {
    console.error('Reject friend request error:', error);
    throw error;
  }
};

export const removeFriend = async (friendId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/friends/remove/${friendId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove friend');
    }

    return data;
  } catch (error) {
    console.error('Remove friend error:', error);
    throw error;
  }
};

export const getFriendsList = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/friends/list`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch friends list');
    }

    return data;
  } catch (error) {
    console.error('Get friends list error:', error);
    throw error;
  }
};

export const getPendingRequests = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/friends/pending`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch pending requests');
    }

    return data;
  } catch (error) {
    console.error('Get pending requests error:', error);
    throw error;
  }
};

export const getFriendsAttendingEvent = async (eventId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/friends/attending/${eventId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch friends attending event');
    }

    return data;
  } catch (error) {
    console.error('Get friends attending event error:', error);
    throw error;
  }
};
