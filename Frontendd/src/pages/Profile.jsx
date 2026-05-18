import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { Button } from '../components/ui/button'; // Assuming you have a Button component
import { User, Mail, Shield, AlertCircle, Phone } from 'lucide-react';

const Profile = () => {
    const { user, login } = useAuth(); // Assuming login updates user context, or we might need a separate update function
    // Ideally useAuth should provide an 'updateProfile' method
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phoneNumber: user?.phoneNumber || '',
        showAttendance: user?.privacySettings?.showAttendanceToFriends ?? true,
    });
    const [activeTab, setActiveTab] = useState('details');
    const [friends, setFriends] = useState([]);
    const [newFriendId, setNewFriendId] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [phoneError, setPhoneError] = useState('');

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
                body: JSON.stringify({
                    name: formData.name,
                    phoneNumber: formData.phoneNumber,
                    privacySettings: { showAttendanceToFriends: formData.showAttendance }
                })
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

        return <div className="p-8 text-center">Please log in to view your profile.</div>;
    }

    const fetchFriends = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/friends`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFriends(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'friends') {
            fetchFriends();
        }
    }, [activeTab]);

    const handleAcceptRequest = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/friends/accept/${requestId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchFriends();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveFriend = async (friendId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/friends/${friendId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchFriends();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendRequest = async (e) => {
        e.preventDefault();
        if (!newFriendId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/friends/request/${newFriendId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMessageType('success');
                setMessage('Friend request sent!');
                setNewFriendId('');
                fetchFriends();
            } else {
                setMessageType('error');
                setMessage(data.message || 'Failed to send request');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 bg-background text-foreground">
            <div className="max-w-2xl mx-auto bg-card rounded-2xl border border-border p-8 shadow-sm">
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

                <div className="flex border-b border-border mb-6">
                    <button 
                        className={`px-4 py-2 font-medium text-sm ${activeTab === 'details' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Profile Details
                    </button>
                    <button 
                        className={`px-4 py-2 font-medium text-sm ${activeTab === 'friends' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('friends')}
                    >
                        Friends
                    </button>
                </div>

                {activeTab === 'details' ? (
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
                                    disabled={true} // Usually email change requires more validation
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
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none">Privacy</label>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    name="showAttendance"
                                    checked={isEditing ? formData.showAttendance : (user?.privacySettings?.showAttendanceToFriends ?? true)}
                                    onChange={(e) => setFormData({ ...formData, showAttendance: e.target.checked })}
                                    disabled={!isEditing}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <span className="text-sm">Show my event attendance to friends</span>
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
                ) : (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-xl font-bold">Your Friends</h2>
                        <form onSubmit={handleSendRequest} className="flex gap-2 w-full md:w-auto">
                            <input
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full md:w-64"
                                placeholder="Enter User ID to add friend"
                                value={newFriendId}
                                onChange={(e) => setNewFriendId(e.target.value)}
                            />
                            <Button type="submit">Add Friend</Button>
                        </form>
                    </div>
                    {friends.length === 0 ? (
                        <p className="text-muted-foreground">You don't have any friends yet.</p>
                    ) : (
                        <div className="grid gap-4">
                            {friends.map(friend => (
                                <div key={friend.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {friend.user?.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{friend.user?.name}</p>
                                            <p className="text-xs text-muted-foreground">{friend.status === 'pending' ? (friend.isSender ? 'Request Sent' : 'Pending Request') : 'Friend'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {friend.status === 'pending' && !friend.isSender && (
                                            <Button size="sm" onClick={() => handleAcceptRequest(friend.id)}>Accept</Button>
                                        )}
                                        <Button size="sm" variant="outline" className="text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={() => handleRemoveFriend(friend.id)}>
                                            {friend.status === 'accepted' ? 'Remove' : (friend.isSender ? 'Cancel' : 'Reject')}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
