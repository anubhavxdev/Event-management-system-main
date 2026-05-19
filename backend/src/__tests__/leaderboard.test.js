import request from 'supertest';

import app from '../app.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';

describe('Leaderboard API', () => {
  it('returns top organizers ranked by approved event score', async () => {
    const organizerA = await User.create({
      name: 'Organizer A',
      email: 'orga@example.com',
      password: 'password123',
      role: 'organizer',
    });

    const organizerB = await User.create({
      name: 'Organizer B',
      email: 'orgb@example.com',
      password: 'password123',
      role: 'organizer',
    });

    await Event.create([
      {
        title: 'A1',
        description: 'A1',
        category: 'Tech',
        date: new Date(),
        location: 'Delhi',
        capacity: 50,
        organizer: organizerA._id,
        status: 'approved',
        averageRating: 4.5,
      },
      {
        title: 'A2',
        description: 'A2',
        category: 'Tech',
        date: new Date(),
        location: 'Delhi',
        capacity: 50,
        organizer: organizerA._id,
        status: 'approved',
        averageRating: 4.5,
      },
      {
        title: 'B1',
        description: 'B1',
        category: 'Tech',
        date: new Date(),
        location: 'Delhi',
        capacity: 50,
        organizer: organizerB._id,
        status: 'approved',
        averageRating: 5,
      },
    ]);

    const res = await request(app).get('/api/leaderboard/organizers');

    expect(res.statusCode).toBe(200);
    expect(res.body.leaderboard).toHaveLength(2);
    expect(res.body.leaderboard[0].name).toBe('Organizer A');
    expect(res.body.leaderboard[0].score).toBeGreaterThan(res.body.leaderboard[1].score);
  });

  it('returns top attendees ranked by attended events and points', async () => {
    const customerA = await User.create({
      name: 'Customer A',
      email: 'customera@example.com',
      password: 'password123',
      role: 'customer',
      points: 15,
    });

    const customerB = await User.create({
      name: 'Customer B',
      email: 'customerb@example.com',
      password: 'password123',
      role: 'customer',
      points: 40,
    });

    const organizer = await User.create({
      name: 'Organizer',
      email: 'leaderboardorg@example.com',
      password: 'password123',
      role: 'organizer',
    });

    const events = await Event.create([
      {
        title: 'Event 1',
        description: 'Event 1',
        category: 'Tech',
        date: new Date(),
        location: 'Delhi',
        capacity: 50,
        organizer: organizer._id,
        status: 'approved',
      },
      {
        title: 'Event 2',
        description: 'Event 2',
        category: 'Tech',
        date: new Date(),
        location: 'Delhi',
        capacity: 50,
        organizer: organizer._id,
        status: 'approved',
      },
      {
        title: 'Event 3',
        description: 'Event 3',
        category: 'Tech',
        date: new Date(),
        location: 'Delhi',
        capacity: 50,
        organizer: organizer._id,
        status: 'approved',
      },
    ]);

    await Registration.create([
      { user: customerA._id, event: events[0]._id, status: 'attended' },
      { user: customerA._id, event: events[1]._id, status: 'attended' },
      { user: customerB._id, event: events[2]._id, status: 'attended' },
    ]);

    const res = await request(app).get('/api/leaderboard/customers');

    expect(res.statusCode).toBe(200);
    expect(res.body.leaderboard).toHaveLength(2);
    expect(res.body.leaderboard[0].name).toBe('Customer B');
    expect(res.body.leaderboard[0].score).toBeGreaterThan(res.body.leaderboard[1].score);
  });
});