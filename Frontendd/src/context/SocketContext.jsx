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

      const handleConnect = () => {
        setIsConnected(true);
        setConnectionError(null);
        newSocket.emit('user:join', { userId: user._id || user.id });
      };

      const handleDisconnect = (reason) => {
        setIsConnected(false);
        console.warn('[SocketContext] Disconnected:', reason);
      };

      const handleConnectError = (error) => {
        setIsConnected(false);
        setConnectionError(error.message);
        console.error('[SocketContext] Connection Error:', error);
      };

      newSocket.on('connect', handleConnect);
      newSocket.on('disconnect', handleDisconnect);
      newSocket.on('connect_error', handleConnectError);

      if (newSocket.connected) {
        setIsConnected(true);
      }

      setSocket(newSocket);
    } else {
      setIsConnected(false);
      setConnectionError(null);
      setSocket(null);
    }

    return () => {
      if (newSocket) {
        newSocket.off('connect', handleConnect);
        newSocket.off('disconnect', handleDisconnect);
        newSocket.off('connect_error', handleConnectError);
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
