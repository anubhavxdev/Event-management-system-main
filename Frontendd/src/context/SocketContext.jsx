import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let newSocket;
    let handleConnect;
    let handleDisconnect;
    let handleConnectError;

    if (user) {
      newSocket = io(API_BASE_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      handleConnect = () => {
        setIsConnected(true);
        setConnectionError(null);
        newSocket.emit('user:join', { userId: user._id || user.id });
      };

      handleDisconnect = (reason) => {
        setIsConnected(false);
        console.warn('[SocketContext] Disconnected:', reason);
      };

      handleConnectError = (error) => {
        setIsConnected(false);
        setConnectionError(error.message);
        console.error('[SocketContext] Connection Error:', error);
      };

      newSocket.on('connect', handleConnect);
      newSocket.on('disconnect', handleDisconnect);
      newSocket.on('connect_error', handleConnectError);

      queueMicrotask(() => {
        if (newSocket.connected) {
          setIsConnected(true);
        }
        setSocket(newSocket);
      });
    } else {
      queueMicrotask(() => {
        setIsConnected(false);
        setConnectionError(null);
        setSocket(null);
      });
    }

    return () => {
      if (newSocket) {
        if (handleConnect) newSocket.off('connect', handleConnect);
        if (handleDisconnect) newSocket.off('disconnect', handleDisconnect);
        if (handleConnectError) newSocket.off('connect_error', handleConnectError);
        newSocket.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
};
