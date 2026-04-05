import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../auth/authSlice';
import { API_BASE_URL } from '../config';

const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken, isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    let socketInstance;

    const initSocket = async () => {
      // Prioritize the token from Redux state, fallback to AsyncStorage
      const token = accessToken || await AsyncStorage.getItem('accessToken');
      
      if (!token || !isAuthenticated) {
        if (socket) {
          socket.disconnect();
          setSocket(null);
          setIsConnected(false);
        }
        return;
      }

      console.log('Initializing socket with token...');
      socketInstance = io(API_BASE_URL, {
        auth: {
          token: token,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.log('Socket connection error:', err.message);
        setIsConnected(false);
      });

      setSocket(socketInstance);
    };

    initSocket();

    return () => {
      if (socketInstance) {
        console.log('Disconnecting socket on cleanup');
        socketInstance.disconnect();
      }
    };
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleEmployeeChange = (data) => {
      const loggedInUser = user.user || user;
      const loggedInEmployeeId = loggedInUser.employeeId || loggedInUser.employee?.id || loggedInUser.id;
      
      if (data.action === 'UPDATED' && data.employee && data.employee.id === loggedInEmployeeId) {
        console.log('Real-time profile update detected for current user:', data.employee.name);
        dispatch(updateUserProfile(data.employee));
      }
    };

    socket.on('employee_changed', handleEmployeeChange);
    return () => {
      socket.off('employee_changed', handleEmployeeChange);
    };
  }, [socket, user, dispatch]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
