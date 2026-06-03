import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

describe('Check-In API Validation & Security', () => {
  let organizer;
  let coOrganizer;
  let attendee;
  let attendeeToken;
  let organizerToken;
  let coOrganizerToken;
  let otherUser;
  let otherUserToken;
  let activeEvent;

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Event.deleteMany({});
    await Registration.deleteMany({});

    // Create Users
    organizer = await User.create({
      name: 'Event Organizer',
      email: 'organizer@test.com',
      password: 'password123',
      role: 'organizer',
    });

    coOrganizer = await User.create({
      name: 'Event Co-Organizer',
      email: 'coorganizer@test.com',
      password: 'password123',
      role: 'organizer',
    });

    attendee = await User.create({
      name: 'Event Attendee',
      email: 'attendee@test.com',
      password: 'password123',
      role: 'attendee',
    });

    otherUser = await User.create({
      name: 'Other User',
      email: 'other@test.com',
      password: 'password123',
      role: 'attendee',
    });

    // Login users to get tokens
    const loginAttendee = await request(app).post('/api/auth/login').send({
      email: 'attendee@test.com',
      password: 'password123',
    });
    attendeeToken = loginAttendee.body.token;

    const loginOrganizer = await request(app).post('/api/auth/login').send({
      email: 'organizer@test.com',
      password: 'password123',
    });
    organizerToken = loginOrganizer.body.token;

    const loginCoOrganizer = await request(app).post('/api/auth/login').send({
      email: 'coorganizer@test.com',
      password: 'password123',
    });
    coOrganizerToken = loginCoOrganizer.body.token;

    const loginOtherUser = await request(app).post('/api/auth/login').send({
      email: 'other@test.com',
      password: 'password123',
    });
    otherUserToken = loginOtherUser.body.token;

    // Create Event
    activeEvent = await Event.create({
      title: 'Realtime Verification Event',
      description: 'Testing entry security infrastructure',
      category: 'Tech',
      date: new Date(),
      location: 'Online',
      capacity: 10,
      status: 'approved',
      organizer: organizer._id,
      coOrganizers: [coOrganizer._id],
    });
  });

  it('should successfully check in a registered participant by organizer', async () => {
    // Register attendee first
    const registration = await Registration.create({
      user: attendee._id,
      event: activeEvent._id,
      status: 'registered',
    });

    // Check-in using registration ID
    const res = await request(app)
      .post(`/api/registrations/${registration._id}/checkin`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ status: 'attended' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/check-in updated/i);
    expect(res.body.registration.status).toBe('attended');
    expect(res.body.registration.checkedInAt).toBeDefined();

    // Verify DB update
    const updated = await Registration.findById(registration._id);
    expect(updated.status).toBe('attended');
    expect(updated.checkedInAt).toBeDefined();
  });

  it('should successfully check in a participant using co-organizer authorization', async () => {
    const registration = await Registration.create({
      user: attendee._id,
      event: activeEvent._id,
      status: 'registered',
    });

    // Check-in via Event ID and userId (QR Scanner payload format)
    const res = await request(app)
      .post(`/api/registrations/${activeEvent._id}/checkin`)
      .set('Authorization', `Bearer ${coOrganizerToken}`)
      .send({ userId: attendee._id, status: 'attended' });

    expect(res.statusCode).toBe(200);
    expect(res.body.registration.status).toBe('attended');
  });

  it('should reject check-ins with 403 Forbidden for unauthorized users', async () => {
    const registration = await Registration.create({
      user: attendee._id,
      event: activeEvent._id,
      status: 'registered',
    });

    // Attempt check-in by another attendee
    const res = await request(app)
      .post(`/api/registrations/${registration._id}/checkin`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ status: 'attended' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  it('should block duplicate scans and return 400 Bad Request with details', async () => {
    const registration = await Registration.create({
      user: attendee._id,
      event: activeEvent._id,
      status: 'attended', // Already checked in
      checkedInAt: new Date(Date.now() - 5000),
    });

    // Try scanning again
    const res = await request(app)
      .post(`/api/registrations/${registration._id}/checkin`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ status: 'attended' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already checked in/i);
    expect(res.body.attendeeName).toBe(attendee.name);
  });

  it('should validate request body parameters', async () => {
    const res = await request(app)
      .post(`/api/registrations/${activeEvent._id}/checkin`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ userId: 'invalid-id-format' });

    expect(res.statusCode).toBe(422);
    expect(res.body.errors[0].field).toBe('userId');
  });
});
