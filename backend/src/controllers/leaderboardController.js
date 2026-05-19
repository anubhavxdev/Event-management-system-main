import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

const CACHE_TTL_MS = 10 * 60 * 1000;
const leaderboardCache = new Map();

const getCache = (key) => {
  const entry = leaderboardCache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    leaderboardCache.delete(key);
    return null;
  }

  return entry.value;
};

const setCache = (key, value) => {
  leaderboardCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const buildOrganizersLeaderboard = async () => {
  const rows = await Event.aggregate([
    { $match: { status: 'approved', organizer: { $ne: null } } },
    {
      $group: {
        _id: '$organizer',
        totalApprovedEvents: { $sum: 1 },
        averageRating: { $avg: { $ifNull: ['$averageRating', 0] } },
      },
    },
    {
      $addFields: {
        score: {
          $multiply: [
            '$totalApprovedEvents',
            { $ifNull: ['$averageRating', 0] },
          ],
        },
      },
    },
    { $sort: { score: -1, totalApprovedEvents: -1, averageRating: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: { $toString: '$_id' },
        name: '$user.name',
        avatarUrl: '$user.avatarUrl',
        role: '$user.role',
        score: 1,
        totalApprovedEvents: 1,
        averageRating: 1,
      },
    },
  ]);

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    score: Number(row.score || 0),
    averageRating: Number(row.averageRating || 0),
  }));
};

const buildCustomersLeaderboard = async () => {
  const rows = await Registration.aggregate([
    { $match: { status: 'attended' } },
    {
      $group: {
        _id: '$user',
        attendedEvents: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $match: {
        'user.isBlocked': { $ne: true },
        'user.role': { $in: ['customer', 'attendee'] },
      },
    },
    {
      $addFields: {
        points: { $ifNull: ['$user.points', 0] },
        score: {
          $add: [
            { $multiply: ['$attendedEvents', 10] },
            { $ifNull: ['$user.points', 0] },
          ],
        },
      },
    },
    { $sort: { score: -1, attendedEvents: -1, points: -1, 'user.name': 1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        userId: { $toString: '$_id' },
        name: '$user.name',
        avatarUrl: '$user.avatarUrl',
        role: '$user.role',
        score: 1,
        attendedEvents: 1,
        points: 1,
      },
    },
  ]);

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    score: Number(row.score || 0),
    points: Number(row.points || 0),
  }));
};

const respondWithCache = async (key, builder, res) => {
  const cached = getCache(key);

  if (cached) {
    return res.json({ cached: true, generatedAt: cached.generatedAt, leaderboard: cached.leaderboard });
  }

  const leaderboard = await builder();
  const payload = {
    generatedAt: new Date().toISOString(),
    leaderboard,
  };

  setCache(key, payload);

  return res.json({ cached: false, ...payload });
};

export const getOrganizersLeaderboard = async (_req, res) => {
  try {
    await respondWithCache('organizers', buildOrganizersLeaderboard, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomersLeaderboard = async (_req, res) => {
  try {
    await respondWithCache('customers', buildCustomersLeaderboard, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};