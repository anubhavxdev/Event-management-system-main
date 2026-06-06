import { Server } from 'socket.io';

let ioInstance;

const getEventRoom = (eventId) => `event:${eventId}`;

export function getIO() {
  return ioInstance;
}

export function initSocket(server, clientOrigin) {
  ioInstance = new Server(server, {
    cors: { origin: clientOrigin, credentials: true },
  });

  ioInstance.on('connection', (socket) => {
    socket.on('announce', (message) => {
      ioInstance.emit('announcement', { message, at: Date.now() });
    });

    socket.on('event:join', (payload = {}) => {
      const eventId = payload?.eventId;

      if (!eventId) {
        return;
      }

      socket.join(getEventRoom(eventId));
    });

    socket.on('event:leave', (payload = {}) => {
      const eventId = payload?.eventId;

      if (!eventId) {
        return;
      }

      socket.leave(getEventRoom(eventId));
    socket.on('user:join', (payload = {}) => {
      const userId = payload?.userId;
      if (!userId) {
        return;
      }
      socket.join(`user_${userId}`);
    });
  });

  return ioInstance;
}

export function emitRegistrationCount(eventId, count) {
  if (!ioInstance || !eventId) {
    return;
  }

  ioInstance.to(getEventRoom(eventId)).emit('registration:count', {
    eventId: String(eventId),
    count,
  });
}

export function emitNotification(userId, notificationData) {
  if (!ioInstance || !userId) {
    return;
  }
  ioInstance.to(`user_${userId}`).emit('notification:new', notificationData);
}

