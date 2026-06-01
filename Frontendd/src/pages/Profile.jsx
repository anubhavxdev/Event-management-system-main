import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { User, Mail, Shield, AlertCircle, Phone, Users, UserPlus, Lock } from 'lucide-react';
import PrivacySettings from '../components/PrivacySettings';
import {
  getFriendsList,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend
} from '../services/friendService';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, login } = useAuth();
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'friends'
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phoneNumber: user?.phoneNumber || '',
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [phoneError, setPhoneError] = useState('');

    // Friends tab states
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [loadingRequests, setLoadingRequests] = useState(false);

    // Validate phone number format
    const validatePhoneNumber = (phoneNumber) => {
        if (!phoneNumber) return true; // Allow empty phone number
        // Accept international format with +, country code, and 7-15 digits
        const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{6,14}$/;
        return phoneRegex.test(phoneNumber.replace(/[\s\-()]/g, ''));
    };

    // Validate name
    const validateName = (name) => {
        return name && name.trim().length >= 2;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Validate phone number in real-time
        if (name === 'phoneNumber' && value) {
            if (!validatePhoneNumber(value)) {
                setPhoneError('Invalid phone number format. Use format: +1234567890 or 1234567890');
            } else {
                setPhoneError('');
            }
        } else if (name === 'phoneNumber') {
            setPhoneError(''); // Clear error if field is empty
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setPhoneError('');
        
        // Validate form data
        if (!validateName(formData.name)) {
            setMessageType('error');
            setMessage('Name must be at least 2 characters long.');
            return;
        }

        if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
            setMessageType('error');
            setMessage('Invalid phone number format. Use format: +1234567890 or 1234567890');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessageType('error');
                setMessage('No authentication token found. Please log in again.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Update the AuthContext with new user data
                login(token, data.user);
                setMessageType('success');
                setMessage('Profile updated successfully!');
                setIsEditing(false);
                // Clear success message after 3 seconds
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessageType('error');
                setMessage(data.message || 'Failed to update profile.');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            setMessageType('error');
            setMessage('An error occurred while updating your profile. Please try again.');
        }
    };

    // Fetch friends and pending requests
    useEffect(() => {
        if (activeTab === 'friends') {
            fetchFriendsData();
        }
    }, [activeTab]);

    const fetchFriendsData = async () => {
        try {
            setLoadingFriends(true);
            const friendsRes = await getFriendsList();
            setFriends(friendsRes.friends || []);
        } catch (error) {
            console.error('Error fetching friends:', error);
            setFriends([]);
        } finally {
            setLoadingFriends(false);
        }

        try {
            setLoadingRequests(true);
            const requestsRes = await getPendingRequests();
            setPendingRequests(requestsRes.requests || []);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            setPendingRequests([]);
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            await acceptFriendRequest(requestId);
            toast.success('Friend request accepted!');
            fetchFriendsData();
        } catch (error) {
            console.error('Error accepting request:', error);
            toast.error('Failed to accept request');
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            await rejectFriendRequest(requestId);
            toast.success('Friend request rejected');
            fetchFriendsData();
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast.error('Failed to reject request');
        }
    };

    const handleRemoveFriend = async (friendId) => {
        try {
            await removeFriend(friendId);
            toast.success('Friend removed');
            fetchFriendsData();
        } catch (error) {
            console.error('Error removing friend:', error);
            toast.error('Failed to remove friend');
        }
    };

    if (!user) {
        return <div className="p-8 text-center">Please log in to view your profile.</div>;
    }

    const getInitials = (name) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="min-h-screen pt-24 px-4 bg-background text-foreground">
            <div className="max-w-4xl mx-auto">
                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-border">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`pb-3 px-4 font-medium transition-colors ${
                            activeTab === 'profile'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 ${
                            activeTab === 'friends'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Friends
                    </button>
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 ${
                            activeTab === 'privacy'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Lock className="w-4 h-4" />
                        Privacy
                    </button>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User className="h-10 w-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{user.name}</h1>
                                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                    <span className="capitalize px-2 py-0.5 bg-secondary rounded-full text-xs font-medium">
                                        {user.role}
                                    </span>
                                    <span>{user.email}</span>
                                </div>
                            </div>
                        </div>

                        {message && (
                            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 text-sm ${
                                messageType === 'success' 
                                    ? 'bg-green-500/10 text-green-600' 
                                    : 'bg-red-500/10 text-red-600'
                            }`}>
                                <AlertCircle className="h-4 w-4" />
                                {message}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium leading-none">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            name="name"
                                            value={isEditing ? formData.name : user.name}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium leading-none">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            name="email"
                                            value={user.email}
                                            disabled={true}
                                        />
                                    </div>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Email cannot be changed directly.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium leading-none">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input
                                            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                                phoneError ? 'border-red-500' : 'border-input'
                                            }`}
                                            name="phoneNumber"
                                            value={isEditing ? formData.phoneNumber : (user.phoneNumber || 'Not provided')}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            placeholder="Enter your phone number (e.g., +1234567890)"
                                        />
                                    </div>
                                    {phoneError && (
                                        <p className="text-[0.8rem] text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {phoneError}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium leading-none">Role</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                            value={user.role}
                                            disabled={true}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t border-border">
                                {isEditing ? (
                                    <>
                                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        <Button 
                                            onClick={handleSubmit}
                                            disabled={phoneError || !validateName(formData.name)}
                                            className="disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Friends Tab */}
                {activeTab === 'friends' && (
                    <div className="space-y-6">
                        {/* Pending Requests Section */}
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <UserPlus className="w-5 h-5" />
                                Friend Requests ({pendingRequests.length})
                            </h2>

                            {loadingRequests ? (
                                <div className="space-y-3">
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : pendingRequests.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No pending friend requests</p>
                            ) : (
                                <div className="space-y-3">
                                    {pendingRequests.map((request) => (
                                        <div key={request._id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    {request.fromUser.avatarUrl ? (
                                                        <AvatarImage src={request.fromUser.avatarUrl} />
                                                    ) : null}
                                                    <AvatarFallback className="bg-blue-500 text-white">
                                                        {getInitials(request.fromUser.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{request.fromUser.name}</p>
                                                    <p className="text-sm text-muted-foreground">{request.fromUser.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAcceptRequest(request._id)}
                                                    className="bg-green-500 hover:bg-green-600 text-white"
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRejectRequest(request._id)}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Friends List Section */}
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Friends ({friends.length})
                            </h2>

                            {loadingFriends ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : friends.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No friends yet. Start adding friends to see them here!</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {friends.map((friend) => (
                                        <div key={friend._id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    {friend.avatarUrl ? (
                                                        <AvatarImage src={friend.avatarUrl} />
                                                    ) : null}
                                                    <AvatarFallback className="bg-blue-500 text-white">
                                                        {getInitials(friend.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{friend.name}</p>
                                                    <p className="text-sm text-muted-foreground">{friend.email}</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleRemoveFriend(friend._id)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                    <PrivacySettings />
                )}
            </div>
        </div>

    );
};

export default Profile;
