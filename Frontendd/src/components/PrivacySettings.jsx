import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { Button } from './ui/button';
import { AlertCircle, Eye, EyeOff, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrivacySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    showAttendanceToFriends: true,
    allowFriendRequests: 'everyone'
  });
  const [hasChanged, setHasChanged] = useState(false);

  // Fetch current privacy settings
  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const privacySettings = data.user?.privacySettings || {
          showAttendanceToFriends: true,
          allowFriendRequests: 'everyone'
        };
        setSettings(privacySettings);
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setSettings({
      ...settings,
      showAttendanceToFriends: !settings.showAttendanceToFriends
    });
    setHasChanged(true);
  };

  const handleFriendRequestChange = (value) => {
    setSettings({
      ...settings,
      allowFriendRequests: value
    });
    setHasChanged(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/users/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Privacy settings updated successfully');
        setHasChanged(false);
      } else {
        toast.error(data.message || 'Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('An error occurred while saving privacy settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-12 bg-muted rounded-lg" />
          <div className="h-10 bg-muted rounded-lg w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Privacy Settings</h2>

      <div className="space-y-6">
        {/* Show Attendance Toggle */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-3">
            {settings.showAttendanceToFriends ? (
              <Eye className="w-5 h-5 text-primary" />
            ) : (
              <EyeOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Show my attendance to friends</p>
              <p className="text-sm text-muted-foreground">
                {settings.showAttendanceToFriends
                  ? 'Your friends can see which events you are attending'
                  : 'Your friends cannot see your event attendance'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              settings.showAttendanceToFriends
                ? 'bg-primary'
                : 'bg-muted-foreground/20'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                settings.showAttendanceToFriends ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Friend Requests Dropdown */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-3 flex-1">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Allow friend requests from</p>
              <p className="text-sm text-muted-foreground">
                Control who can send you friend requests
              </p>
            </div>
          </div>
          <select
            value={settings.allowFriendRequests}
            onChange={(e) => handleFriendRequestChange(e.target.value)}
            className="px-3 py-2 rounded-md border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="everyone">Everyone</option>
            <option value="mutual_events">People from mutual events</option>
            <option value="none">Nobody</option>
          </select>
        </div>

        {/* Info Box */}
        <div className="flex gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-400">
            These settings help you control your privacy while using the friends feature. You can change them anytime.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          {hasChanged && (
            <p className="text-sm text-muted-foreground mr-auto my-auto">
              You have unsaved changes
            </p>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanged || saving}
            className={!hasChanged ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
