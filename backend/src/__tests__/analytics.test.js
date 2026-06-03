import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

describe('Analytics & Observability API', () => {
  let attendeeToken, organizerToken, adminToken;
  let attendeeId, organizerId, adminId;
  let sampleEvent, sampleRegistration;

  beforeEach(async () => {
    // 1. Create clean user DB entries
    const attendeeUser = await User.create({
      name: 'Attendee User',
      email: 'attendee@analytics-test.com',
      password: 'password123',
      role: 'customer' // 'customer' corresponds to normal attendee role
    });
    attendeeId = attendeeUser._id.toString();

    const organizerUser = await User.create({
      name: 'Organizer User',
      email: 'organizer@analytics-test.com',
      password: 'password123',
      role: 'organizer'
    });
    organizerId = organizerUser._id.toString();

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@analytics-test.com',
      password: 'password123',
      role: 'admin'
    });
    adminId = adminUser._id.toString();

    // 2. Perform mock logins to capture JWT tokens
    const attendeeLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'attendee@analytics-test.com', password: 'password123' });
    attendeeToken = attendeeLogin.body.token;

    const organizerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'organizer@analytics-test.com', password: 'password123' });
    organizerToken = organizerLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@analytics-test.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    // 3. Setup mock events and registrations
    sampleEvent = await Event.create({
      title: 'Analytics Testing Masterclass',
      description: 'Learn metrics aggregation step-by-step',
      date: new Date(),
      location: 'Online',
      capacity: 50,
      price: 1500,
      isFree: false,
      organizer: organizerId,
      status: 'approved',
      category: 'Tech'
    });

    sampleRegistration = await Registration.create({
      event: sampleEvent._id,
      user: attendeeId,
      status: 'attended', // checked in
      paymentStatus: 'paid',
      checkedInAt: new Date()
    });
  });

  describe('Authorization Rules', () => {
    it('should block non-organizers from requesting organizer summary', async () => {
      const res = await request(app)
        .get('/api/analytics/organizer/summary')
        .set('Authorization', `Bearer ${attendeeToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('should block non-admins from admin summary and system health', async () => {
      const res1 = await request(app)
        .get('/api/analytics/admin/summary')
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(res1.statusCode).toBe(403);

      const res2 = await request(app)
        .get('/api/analytics/admin/system')
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(res2.statusCode).toBe(403);
    });

    it('should block unauthorized organizers from accessing event analytics of other organizers', async () => {
      // Create a different organizer
      const otherOrganizer = await User.create({
        name: 'Other Org',
        email: 'other@analytics-test.com',
        password: 'password123',
        role: 'organizer'
      });
      const otherOrgLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'other@analytics-test.com', password: 'password123' });
      const otherOrgToken = otherOrgLogin.body.token;

      const res = await request(app)
        .get(`/api/analytics/organizer/event/${sampleEvent._id}`)
        .set('Authorization', `Bearer ${otherOrgToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Organizer Analytics Endpoints', () => {
    it('should return cross-event aggregate stats for organizer', async () => {
      const res = await request(app)
        .get('/api/analytics/organizer/summary')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.totalEvents).toBe(1);
      expect(res.body.totalRegistrations).toBe(1);
      expect(res.body.totalCheckedIn).toBe(1);
      expect(res.body.attendanceRate).toBe(100);
      expect(res.body.totalRevenue).toBe(1500);
      expect(res.body.categoryDistribution).toBeDefined();
    });

    it('should return specific event metrics and timeline growth graphs', async () => {
      const res = await request(app)
        .get(`/api/analytics/organizer/event/${sampleEvent._id}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.event.title).toBe('Analytics Testing Masterclass');
      expect(res.body.metrics.totalRegistrations).toBe(1);
      expect(res.body.metrics.checkedInCount).toBe(1);
      expect(res.body.metrics.checkInRate).toBe(100);
      expect(res.body.metrics.revenue).toBe(1500);
      expect(res.body.registrationTimeline).toBeInstanceOf(Array);
      expect(res.body.attendanceTimeline).toBeInstanceOf(Array);
    });
  });

  describe('Admin Analytics & Observability Endpoints', () => {
    it('should fetch system and database summaries for admin dashboard', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(res.body.events).toBeDefined();
      expect(res.body.registrations).toBeDefined();
      expect(res.body.revenue).toBe(1500);
      expect(res.body.userGrowth).toBeInstanceOf(Array);
      expect(res.body.eventGrowth).toBeInstanceOf(Array);
    });

    it('should return resource allocations and system health', async () => {
      const res = await request(app)
        .get('/api/analytics/admin/system')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.uptime).toBeDefined();
      expect(res.body.memory).toBeDefined();
      expect(res.body.memory.heapUsed).toBeDefined();
      expect(res.body.cpuLoad).toBeDefined();
      expect(res.body.activeConnections).toBeDefined();
    });
  });
});
