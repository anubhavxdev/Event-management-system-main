import { useState, useEffect } from 'react';
import { getFriendsAttendingEvent } from '../services/friendService';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

export default function FriendsAttending({ eventId }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const response = await getFriendsAttendingEvent(eventId);
        setFriends(response.friendsAttending || []);
      } catch (error) {
        console.error('Error fetching friends attending event:', error);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchFriends();
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-muted animate-pulse border border-background"
            />
          ))}
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return null;
  }

  const displayCount = Math.min(friends.length, 3);
  const visibleFriends = friends.slice(0, 3);
  const remainingCount = friends.length - 3;

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visibleFriends.map((friend) => (
          <Avatar key={friend._id} className="w-8 h-8 border-2 border-background">
            {friend.avatarUrl ? (
              <AvatarImage src={friend.avatarUrl} alt={friend.name} />
            ) : null}
            <AvatarFallback className="text-xs font-semibold bg-blue-500 text-white">
              {getInitials(friend.name)}
            </AvatarFallback>
          </Avatar>
        ))}
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-background flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200">
            +{remainingCount}
          </div>
        )}
      </div>
      <span className="text-sm text-muted-foreground">
        {friends.length === 1
          ? '1 friend going'
          : `${friends.length} friends going`}
      </span>
    </div>
  );
}
