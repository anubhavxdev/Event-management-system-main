import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

describe('Notification API & Controller', () => {
  let userToken;
  let userId;
  let notifId;

  beforeEach(async () => {
    // Create user directly in DB
    const u = await User.create({
      name: 'Notif User',
      email: 'notif_test@example.com',
      password: 'password123',
      role: 'attendee'
    });
    userId = u._id.toString();

    // Login user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'notif_test@example.com',
        password: 'password123'
      });
    userToken = loginRes.body.token;

    // Clear notifications and create a fresh one for each test
    await Notification.deleteMany({});
    
    const n = await Notification.create({
      user: userId,
      type: 'registration_confirmed',
      message: 'Your registration is confirmed!',
      link: '/events/123'
    });
    notifId = n._id.toString();
  });

  it('should fetch notifications and unread count', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toBeDefined();
    expect(res.body.unreadCount).toBe(1);
  });

  it('should mark notification as read', async () => {
    const res = await request(app)
      .patch(`/api/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notification.isRead).toBe(true);

    const checkRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(checkRes.statusCode).toBe(200);
    expect(checkRes.body.unreadCount).toBe(0);
  });

  it('should mark all notifications as read', async () => {
    // Add another unread notification
    await Notification.create({
      user: userId,
      type: 'event_approved',
      message: 'New event approved!',
      link: '/events/456'
    });

    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);

    const checkRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(checkRes.statusCode).toBe(200);
    expect(checkRes.body.unreadCount).toBe(0);
  });

  it('should delete a notification', async () => {
    const res = await request(app)
      .delete(`/api/notifications/${notifId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('deleted');

    const checkRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(checkRes.body.notifications.some(n => n._id === notifId)).toBe(false);
  });
});
