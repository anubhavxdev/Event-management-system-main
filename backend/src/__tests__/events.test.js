import request from 'supertest';

import app from '../app.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

describe('Events API', () => {
  describe('GET /api/events', () => {
    it('should return all events', async () => {
      const organizer = await User.create({
        name: 'Organizer',
        email: 'organizer@example.com',
        password: 'password123',
        role: 'organizer'
      });

      await Event.create({
        title: 'Hackathon 2025',
        description: 'Coding event',
        category: 'Tech',
        date: new Date(),
        location: 'Delhi',
        capacity: 100,
        organizer: organizer._id,
        status: 'approved'
      });

      const res = await request(app).get('/api/events');

      expect(res.statusCode).toBe(200);

      expect(res.body.events).toBeDefined();

      expect(res.body.events.length).toBe(1);

      expect(res.body.events[0].title).toBe('Hackathon 2025');
    });

    it('should return empty array when no events exist', async () => {
      const res = await request(app).get('/api/events');

      expect(res.statusCode).toBe(200);

      expect(res.body.events).toEqual([]);
    });
  });
});
