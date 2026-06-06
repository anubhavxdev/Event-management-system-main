import { jest } from '@jest/globals';

// --- Mocks ---

const mockEvent = {
  findByIdAndUpdate: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

const mockSendEventRejectionEmail = jest.fn();
const mockCreateNotification = jest.fn();
const mockDeleteFromCloudinary = jest.fn();

jest.unstable_mockModule('../models/Event.js', () => ({
  default: mockEvent,
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {},
}));

jest.unstable_mockModule('../utils/email.js', () => ({
  sendEventRejectionEmail: mockSendEventRejectionEmail,
}));

jest.unstable_mockModule('./notificationController.js', () => ({
  createNotification: mockCreateNotification,
}));

jest.unstable_mockModule('../config/cloudinary.js', () => ({
  deleteFromCloudinary: mockDeleteFromCloudinary,
}));

const { bulkApproveEvents, bulkRejectEvents, bulkDeleteEvents } = await import(
  '../controllers/adminController.js'
);

// --- Helpers ---

const VALID_ID_1 = '507f1f77bcf86cd799439011';
const VALID_ID_2 = '507f1f77bcf86cd799439012';
const VALID_ID_3 = '507f1f77bcf86cd799439013';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (body) => ({ body });

// --- Tests ---

beforeEach(() => {
  jest.clearAllMocks();
});

// =====================
// bulkApproveEvents
// =====================

describe('bulkApproveEvents', () => {
  it('should approve multiple events successfully', async () => {
    const req = mockReq({ eventIds: [VALID_ID_1, VALID_ID_2] });
    const res = mockRes();

    const fakeEvent1 = {
      _id: VALID_ID_1,
      title: 'Event 1',
      organizer: { _id: 'org1', name: 'Org', email: 'org@test.com' },
    };
    const fakeEvent2 = {
      _id: VALID_ID_2,
      title: 'Event 2',
      organizer: { _id: 'org2', name: 'Org2', email: 'org2@test.com' },
    };

    mockEvent.findByIdAndUpdate
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(fakeEvent1) })
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(fakeEvent2) });

    await bulkApproveEvents(req, res);

    expect(res.json).toHaveBeenCalledWith({
      succeeded: 2,
      failed: 0,
      errors: [],
    });
    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
  });

  it('should return 400 when eventIds is an empty array', async () => {
    const req = mockReq({ eventIds: [] });
    const res = mockRes();

    await bulkApproveEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'eventIds must be a non-empty array',
    });
  });

  it('should return 400 when eventIds is not an array', async () => {
    const req = mockReq({ eventIds: 'not-an-array' });
    const res = mockRes();

    await bulkApproveEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'eventIds must be a non-empty array',
    });
  });

  it('should return 400 when eventIds contains invalid ObjectIds', async () => {
    const req = mockReq({ eventIds: [VALID_ID_1, 'invalid-id'] });
    const res = mockRes();

    await bulkApproveEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'One or more eventIds are invalid',
      invalidIds: ['invalid-id'],
    });
  });

  it('should handle partial failures (some events not found)', async () => {
    const req = mockReq({ eventIds: [VALID_ID_1, VALID_ID_2] });
    const res = mockRes();

    const fakeEvent1 = {
      _id: VALID_ID_1,
      title: 'Event 1',
      organizer: { _id: 'org1', name: 'Org', email: 'org@test.com' },
    };

    mockEvent.findByIdAndUpdate
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(fakeEvent1) })
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(null) });

    await bulkApproveEvents(req, res);

    expect(res.json).toHaveBeenCalledWith({
      succeeded: 1,
      failed: 1,
      errors: [{ eventId: VALID_ID_2, error: 'Event not found' }],
    });
  });
});

// =====================
// bulkRejectEvents
// =====================

describe('bulkRejectEvents', () => {
  const VALID_REASON = 'This event does not meet our community guidelines and standards';

  it('should reject multiple events with valid reason', async () => {
    const req = mockReq({
      eventIds: [VALID_ID_1, VALID_ID_2],
      rejectionReason: VALID_REASON,
    });
    const res = mockRes();

    const makeEvent = (id, title) => ({
      _id: id,
      title,
      status: 'pending',
      rejectionReason: '',
      organizer: { _id: `org-${id}`, name: 'Org', email: 'org@test.com' },
      save: jest.fn().mockResolvedValue(true),
    });

    const event1 = makeEvent(VALID_ID_1, 'Event 1');
    const event2 = makeEvent(VALID_ID_2, 'Event 2');

    mockEvent.findById
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(event1) })
      .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(event2) });

    await bulkRejectEvents(req, res);

    expect(res.json).toHaveBeenCalledWith({
      succeeded: 2,
      failed: 0,
      errors: [],
    });
    expect(event1.save).toHaveBeenCalled();
    expect(event2.save).toHaveBeenCalled();
    expect(mockSendEventRejectionEmail).toHaveBeenCalledTimes(2);
    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
  });

  it('should return 400 when rejection reason is too short', async () => {
    const req = mockReq({
      eventIds: [VALID_ID_1],
      rejectionReason: 'Too short',
    });
    const res = mockRes();

    await bulkRejectEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Rejection reason is required and must be at least 20 characters long',
    });
  });

  it('should return 400 when rejection reason is missing', async () => {
    const req = mockReq({ eventIds: [VALID_ID_1] });
    const res = mockRes();

    await bulkRejectEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Rejection reason is required and must be at least 20 characters long',
    });
  });

  it('should return 400 when eventIds is empty', async () => {
    const req = mockReq({ eventIds: [], rejectionReason: VALID_REASON });
    const res = mockRes();

    await bulkRejectEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'eventIds must be a non-empty array',
    });
  });
});

// =====================
// bulkDeleteEvents
// =====================

describe('bulkDeleteEvents', () => {
  it('should delete multiple events and call deleteFromCloudinary for events with posterUrl', async () => {
    const req = mockReq({ eventIds: [VALID_ID_1, VALID_ID_2] });
    const res = mockRes();

    mockEvent.findByIdAndDelete
      .mockResolvedValueOnce({
        _id: VALID_ID_1,
        posterUrl: 'https://res.cloudinary.com/demo/image/upload/v123/eventone/posters/poster1.webp',
      })
      .mockResolvedValueOnce({
        _id: VALID_ID_2,
        posterUrl: null,
      });

    await bulkDeleteEvents(req, res);

    expect(res.json).toHaveBeenCalledWith({
      succeeded: 2,
      failed: 0,
      errors: [],
    });
    expect(mockDeleteFromCloudinary).toHaveBeenCalledTimes(1);
    expect(mockDeleteFromCloudinary).toHaveBeenCalledWith(
      'https://res.cloudinary.com/demo/image/upload/v123/eventone/posters/poster1.webp'
    );
  });

  it('should return 400 when eventIds is empty', async () => {
    const req = mockReq({ eventIds: [] });
    const res = mockRes();

    await bulkDeleteEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'eventIds must be a non-empty array',
    });
  });

  it('should return 400 when eventIds contains invalid ObjectIds', async () => {
    const req = mockReq({ eventIds: ['bad-id'] });
    const res = mockRes();

    await bulkDeleteEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'One or more eventIds are invalid',
      invalidIds: ['bad-id'],
    });
  });

  it('should handle partial failure when some events are not found', async () => {
    const req = mockReq({ eventIds: [VALID_ID_1, VALID_ID_2, VALID_ID_3] });
    const res = mockRes();

    mockEvent.findByIdAndDelete
      .mockResolvedValueOnce({ _id: VALID_ID_1, posterUrl: null })
      .mockResolvedValueOnce(null) // not found
      .mockResolvedValueOnce({ _id: VALID_ID_3, posterUrl: null });

    await bulkDeleteEvents(req, res);

    expect(res.json).toHaveBeenCalledWith({
      succeeded: 2,
      failed: 1,
      errors: [{ eventId: VALID_ID_2, error: 'Event not found' }],
    });
  });
});
