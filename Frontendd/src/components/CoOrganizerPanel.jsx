import React, { useState, useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050';

export default function CoOrganizerPanel({ eventId, isOwner }) {
  const [coOrgs, setCoOrgs] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });
  const token = localStorage.getItem('token');

  const fetchCoOrgs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCoOrgs(data.event?.coOrganizers || []);
    } catch (_) {}
  };

  useEffect(() => { fetchCoOrgs(); }, [eventId]);

  const addCoOrg = async () => {
    setLoading(true); setMsg({ text: '', ok: true });
    const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/co-organizers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    setMsg({ text: res.ok ? 'Co-organizer added!' : (data.message || 'Error'), ok: res.ok });
    if (res.ok) { setEmail(''); fetchCoOrgs(); }
    setLoading(false);
  };

  const removeCoOrg = async (userId) => {
    const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/co-organizers/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchCoOrgs();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-purple-500" /> Co-organizers
      </h3>
      {isOwner && (
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Add co-organizer by email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && email && addCoOrg()}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            onClick={addCoOrg}
            disabled={loading || !email}
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <UserPlus size={15} /> Invite
          </button>
        </div>
      )}
      {msg.text && (
        <p className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</p>
      )}
      <ul className="space-y-2">
        {coOrgs.length === 0 && (
          <li className="text-sm text-gray-400 text-center py-3">No co-organizers added yet.</li>
        )}
        {coOrgs.map(u => (
          <li key={u._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
            <div>
              <span className="font-medium">{u.name}</span>
              <span className="text-gray-400 ml-1">({u.email})</span>
            </div>
            {isOwner && (
              <button onClick={() => removeCoOrg(u._id)} className="text-red-400 hover:text-red-600 ml-2 transition-colors">
                <X size={15} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
