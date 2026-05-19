import request from 'supertest';
import app from '../app.js';

describe('Auth API', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'customer'
        });

      expect(res.statusCode).toBe(201);

      expect(res.body.token).toBeDefined();

      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject duplicate email signup', async () => {
      const userData = {
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'customer'
      };

      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      const res = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(res.statusCode).toBe(400);

      expect(res.body.message).toMatch(/already in use/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login existing user', async () => {
      const userData = {
        name: 'Login User',
        email: 'login@example.com',
        password: 'password123',
        role: 'customer'
      };

      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(res.statusCode).toBe(200);

      expect(res.body.token).toBeDefined();

      expect(res.body.user.email).toBe(userData.email);
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(400);

      expect(res.body.message).toMatch(/invalid credentials/i);
    });
  });
});
