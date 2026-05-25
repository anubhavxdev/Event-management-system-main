import request from 'supertest';
import mongoose from 'mongoose';

import app from '../app.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { generateJwtToken } from '../utils/generateToken.js';

const createAdminAuthHeader = async () => {
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin.bulk@example.com',
    password: 'password123',
    role: 'admin'
  });

  const token = generateJwtToken({ id: admin._id.toString(), role: admin.role });
  return { Authorization: `Bearer ${token}` };
};

const createOrganizer = async () => {
  return User.create({
    name: 'Organizer User',
    email: `organizer.${Date.now()}@example.com`,
    password: 'password123',
    role: 'organizer'
  });
};

const createPendingEvent = async (organizer, title) => {
  return Event.create({
    title,
    description: 'An event waiting for admin review approval.',
    category: 'Tech',
    date: new Date('2026-07-01T10:00:00Z'),
    location: 'Delhi',
    capacity: 100,
    organizer: organizer._id,
    status: 'pending'
  });
};

describe('Admin bulk event actions', () => {
  it('POST /api/admin/events/bulk-approve should approve valid ids and report failures', async () => {
    const headers = await createAdminAuthHeader();
    const organizer = await createOrganizer();

    const eventOne = await createPendingEvent(organizer, 'Bulk Approve One');
    const eventTwo = await createPendingEvent(organizer, 'Bulk Approve Two');
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/api/admin/events/bulk-approve')
      .set(headers)
      .send({ eventIds: [eventOne._id.toString(), eventTwo._id.toString(), missingId] });

    expect(res.statusCode).toBe(200);
    expect(res.body.succeeded).toBe(2);
    expect(res.body.failed).toBe(1);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBe(1);

    const [updatedOne, updatedTwo] = await Promise.all([
      Event.findById(eventOne._id),
      Event.findById(eventTwo._id)
    ]);

    expect(updatedOne.status).toBe('approved');
    expect(updatedTwo.status).toBe('approved');
  });

  it('POST /api/admin/events/bulk-reject should require rejection reason', async () => {
    const headers = await createAdminAuthHeader();
    const organizer = await createOrganizer();
    const event = await createPendingEvent(organizer, 'Bulk Reject Validation');

    const res = await request(app)
      .post('/api/admin/events/bulk-reject')
      .set(headers)
      .send({ eventIds: [event._id.toString()], rejectionReason: 'too short' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/rejection reason/i);
  });

  it('POST /api/admin/events/bulk-delete should delete existing events and report missing ids', async () => {
    const headers = await createAdminAuthHeader();
    const organizer = await createOrganizer();

    const eventOne = await createPendingEvent(organizer, 'Bulk Delete One');
    const eventTwo = await createPendingEvent(organizer, 'Bulk Delete Two');
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/api/admin/events/bulk-delete')
      .set(headers)
      .send({ eventIds: [eventOne._id.toString(), eventTwo._id.toString(), missingId] });

    expect(res.statusCode).toBe(200);
    expect(res.body.succeeded).toBe(2);
    expect(res.body.failed).toBe(1);

    const [deletedOne, deletedTwo] = await Promise.all([
      Event.findById(eventOne._id),
      Event.findById(eventTwo._id)
    ]);

    expect(deletedOne).toBeNull();
    expect(deletedTwo).toBeNull();
  });
});
