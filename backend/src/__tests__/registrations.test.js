import request from 'supertest';

import app from '../app.js';

import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

describe('Registrations API', () => {
  
  describe('POST /api/registrations/:id/register', () => {
    it('should prevent duplicate registrations', async () => {
  const user = await User.create({
    name: 'Duplicate User',
    email: 'duplicate@example.com',
    password: 'password123',
    role: 'attendee'
  });

  const organizer = await User.create({
    name: 'Organizer',
    email: 'duporganizer@example.com',
    password: 'password123',
    role: 'organizer'
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'duplicate@example.com',
      password: 'password123'
    });

  const event = await Event.create({
    title: 'Duplicate Registration Event',
    description: 'Testing duplicate registration prevention',
    category: 'Tech',
    date: new Date(),
    location: 'Delhi',
    capacity: 5,
    status: 'approved',
    organizer: organizer._id
  });

  await request(app)
    .post(`/api/registrations/${event._id}/register`)
    .set('Authorization', `Bearer ${loginRes.body.token}`);

  const secondRes = await request(app)
    .post(`/api/registrations/${event._id}/register`)
    .set('Authorization', `Bearer ${loginRes.body.token}`);

  expect(secondRes.statusCode).toBe(400);

  expect(secondRes.body.message).toMatch(/already registered/i);
});
    it('should register user for an event', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'user@example.com',
        password: 'password123',
        role: 'attendee'
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123'
        });

      const token = loginRes.body.token;

      const organizer = await User.create({
        name: 'Organizer',
        email: 'organizer@example.com',
        password: 'password123',
        role: 'organizer'
      });

      const event = await Event.create({
        title: 'Tech Event',
        description: 'Test description',
        category: 'Tech',
        date: new Date(),
        location: 'Delhi',
        capacity: 1,
        status: 'approved',
        organizer: organizer._id
      });

      const res = await request(app)
        .post(`/api/registrations/${event._id}/register`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(201);

      expect(res.body.registration).toBeDefined();
    });

    it('should enforce capacity limit under concurrent requests', async () => {
      const organizer = await User.create({
        name: 'Organizer',
        email: 'organizer2@example.com',
        password: 'password123',
        role: 'organizer'
      });

      const user1 = await User.create({
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123',
        role: 'attendee'
      });

      const user2 = await User.create({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123',
        role: 'attendee'
      });

      const login1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user1@example.com',
          password: 'password123'
        });

      const login2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user2@example.com',
          password: 'password123'
        });

      const event = await Event.create({
        title: 'Limited Event',
        description: 'Limited seats',
        category: 'Tech',
        date: new Date(),
        location: 'Mumbai',
        capacity: 1,
        status: 'approved',
        organizer: organizer._id
      });

      

     const [res1, res2] = await Promise.allSettled([
  request(app)
    .post(`/api/registrations/${event._id}/register`)
    .set('Authorization', `Bearer ${login1.body.token}`),

  request(app)
    .post(`/api/registrations/${event._id}/register`)
    .set('Authorization', `Bearer ${login2.body.token}`)
]);

const registrations = await Registration.find({
  event: event._id
});

const successResponses = [res1, res2].filter(
  r => r.value?.statusCode === 201
);

expect(successResponses.length).toBe(1);

expect(registrations.length).toBe(1);
    });
  });
});
