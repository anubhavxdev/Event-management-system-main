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
    });
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

    if (!user) {
        return <div className="p-8 text-center">Please log in to view your profile.</div>;
    }

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
        </div>
    );
};

export default Profile;
