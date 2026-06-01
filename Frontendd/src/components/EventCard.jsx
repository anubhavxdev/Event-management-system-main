import { Calendar, MapPin, Users, Tag, IndianRupee } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import FriendsAttending from './FriendsAttending';
import { Button } from './ui/button';

export default function EventCard({ event, onManageClick, onScanClick, onEditClick }) {
  return (
    <div className="group relative bg-card border border-border rounded-2xl p-4 hover:border-purple-500/50 transition-colors shadow-sm">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Poster */}
        <div className="w-full md:w-56 h-36 rounded-xl overflow-hidden shrink-0 bg-muted relative">
          {event.posterUrl ? (
            <img
              src={event.posterUrl}
              alt={event.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000';
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Calendar className="w-8 h-8" />
            </div>
          )}
          {event.status && (
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide backdrop-blur-md border ${event.status === 'approved' ? 'bg-green-500/20 border-green-500/30 text-green-100' :
                event.status === 'rejected' ? 'bg-red-500/20 border-red-500/30 text-red-100' :
                  'bg-yellow-500/20 border-yellow-500/30 text-yellow-100'
                }`}>
                {event.status}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-purple-500 transition-colors">
                {event.title}
              </h3>
              {event.category && (
                <span className="flex items-center text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                  <Tag className="w-3 h-3 mr-1" />
                  {event.category}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2 max-w-2xl">
              {event.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              {event.date && (
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1.5" />
                  {new Date(event.date).toLocaleDateString()}
                </span>
              )}
              {event.date && <CountdownTimer eventDate={event.date} />}
              {event.location && (
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1.5" />
                  {event.location}
                </span>
              )}
              {event.registrations !== undefined && (
                <span className="flex items-center">
                  <Users className="w-3 h-3 mr-1.5" />
                  {event.registrations || 0} / {event.capacity}
                </span>
              )}
              {event.price !== undefined && (
                <span className="flex items-center">
                  <IndianRupee className="w-3 h-3 mr-1.5" />
                  {event.price > 0 ? `₹${event.price}` : 'Free'}
                </span>
              )}
            </div>

            {/* Friends Attending Section */}
            {event._id && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <FriendsAttending eventId={event._id} />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(onManageClick || onScanClick || onEditClick) && (
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
              {onScanClick && event.status === 'approved' && (
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => onScanClick(event)}
                >
                  Scan QR
                </Button>
              )}

              {onEditClick && event.status === 'rejected' && (
                <Button
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => onEditClick(event)}
                >
                  Edit & Resubmit
                </Button>
              )}

              {onManageClick && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                  onClick={() => onManageClick(event)}
                >
                  Manage Event
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
