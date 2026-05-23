import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function generateJwtToken(payload) {
  return jwt.sign(
    payload,
    env.jwtSecret || 'testsecret',
    { expiresIn: env.jwtExpiresIn || '7d' }
  );
}

export function verifyJwtToken(token) {
  return jwt.verify(token, env.jwtSecret || 'testsecret');
}
