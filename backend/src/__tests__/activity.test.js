import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import ActivityLog from '../models/ActivityLog.js';

describe('Activity Logging Infrastructure', () => {
  let organizerToken;
  let organizerId;
  let adminToken;
  let adminId;
  let eventId;

  beforeEach(async () => {
    // Create organizer directly in DB
    const org = await User.create({
      name: 'Org User',
      email: 'org_activity@example.com',
      password: 'password123',
      role: 'organizer'
    });
    organizerId = org._id.toString();

    // Login organizer
    const orgRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'org_activity@example.com',
        password: 'password123'
      });
    organizerToken = orgRes.body.token;

    // Create admin directly in DB
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin_activity@example.com',
      password: 'password123',
      role: 'admin'
    });
    adminId = admin._id.toString();

    // Login admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin_activity@example.com',
        password: 'password123'
      });
    adminToken = adminRes.body.token;
  });

  it('should log user signup and login actions', async () => {
    // 1. Signup
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'New Attendee',
        email: 'attendee_act@example.com',
        password: 'password123',
        role: 'attendee'
      });
    expect(signupRes.statusCode).toBe(201);

    // 2. Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'attendee_act@example.com',
        password: 'password123'
      });
    expect(loginRes.statusCode).toBe(200);

    // 3. Verify activity logs exist
    const signupLog = await ActivityLog.findOne({ action: 'user_signup' });
    expect(signupLog).toBeDefined();
    expect(signupLog.description).toContain('New Attendee');

    const loginLog = await ActivityLog.findOne({ action: 'user_login' });
    expect(loginLog).toBeDefined();
  });

  it('should log event actions and fetch them via activities endpoint', async () => {
    // Create event
    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Activity Event Tech',
        description: 'Logging details for event tech',
        date: new Date(Date.now() + 86400000).toISOString(),
        location: 'Hall A',
        capacity: 100,
        price: 0,
        category: 'Tech'
      });
    expect(eventRes.statusCode).toBe(201);
    eventId = eventRes.body.event._id;

    // Verify activity event_created
    const eventLog = await ActivityLog.findOne({ action: 'event_created', event: eventId });
    expect(eventLog).toBeDefined();
    expect(eventLog.description).toContain('Activity Event Tech');

    // Update event
    const updateRes = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Activity Event Tech Updated',
        description: 'Logging details for event tech updated',
        date: new Date(Date.now() + 86400000).toISOString(),
        location: 'Hall B',
        capacity: 120,
        price: 0,
        category: 'Tech'
      });
    expect(updateRes.statusCode).toBe(200);

    // Verify activity event_updated
    const updateLog = await ActivityLog.findOne({ action: 'event_updated', event: eventId });
    expect(updateLog).toBeDefined();

    // Fetch organizer activity log timeline
    const activityRes = await request(app)
      .get('/api/events/activities/organizer')
      .set('Authorization', `Bearer ${organizerToken}`);
    
    expect(activityRes.statusCode).toBe(200);
    expect(activityRes.body.activities).toBeDefined();
    expect(activityRes.body.activities.length).toBeGreaterThanOrEqual(2);
    expect(activityRes.body.activities[0].event).toBeDefined();
  });
});
