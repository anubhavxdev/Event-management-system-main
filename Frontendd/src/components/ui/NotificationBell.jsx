import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCircle2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getRelativeTime } from '../../utils/timeHelper';
import { API_BASE_URL } from '../../config';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { socket } = useSocket();
  const { user } = useAuth();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch notifications');
        
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some((n) => n._id === notification._id)) return prev;
        
        const newNotifications = [notification, ...prev].slice(0, 20);
        return newNotifications;
      });
      setUnreadCount((prev) => prev + 1);
      
      // Optional: show a toast for new notification
      // toast(notification.message, { icon: '🔔' });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id, currentStatus) => {
    if (currentStatus) return; // Already read

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative p-2 text-foreground/80 hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border/50 bg-background shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className={`text-xs flex items-center gap-1 transition-colors ${
                unreadCount === 0 
                  ? 'text-muted-foreground cursor-not-allowed opacity-50' 
                  : 'text-indigo-500 hover:text-indigo-600'
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              Mark all as read
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => markAsRead(notification._id, notification.isRead)}
                    className={`px-4 py-3 border-b border-border/10 cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notification.isRead ? 'bg-indigo-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!notification.isRead && (
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                      <div className={`flex flex-col gap-1 ${notification.isRead ? 'opacity-70' : ''}`}>
                        {notification.link ? (
                          <Link 
                            to={notification.link} 
                            onClick={(e) => {
                              // If they click the link, it also marks as read
                              // e.stopPropagation() is not needed because we want the outer div to trigger markAsRead
                            }}
                            className={`text-sm ${!notification.isRead ? 'font-medium text-foreground' : 'text-foreground/80'} hover:underline line-clamp-2`}
                          >
                            {notification.message}
                          </Link>
                        ) : (
                          <p className={`text-sm ${!notification.isRead ? 'font-medium text-foreground' : 'text-foreground/80'} line-clamp-2`}>
                            {notification.message}
                          </p>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {getRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
