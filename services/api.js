import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../config';

let logoutAction = () => {};

export const setLogoutAction = (action) => {
  logoutAction = action;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const userStr = await AsyncStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        const user = userData?.user || userData;

        if (!refreshToken || !user) throw new Error('No session data found');

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          userId: user.id || user.sub,
          refreshToken,
        });

        if (data.access_token) {
          await AsyncStorage.setItem('accessToken', data.access_token);
          if (data.refresh_token) await AsyncStorage.setItem('refreshToken', data.refresh_token);

          apiClient.defaults.headers.Authorization = `Bearer ${data.access_token}`;
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        console.log('Session expired, logging out...', refreshError);
        // Clear all session data
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'isAuthenticated', 'user', 'role']);
        
        Alert.alert(
          'Sesi Berakhir',
          'Sesi Anda telah habis. Silakan login kembali untuk melanjutkan.',
          [{ text: 'OK', onPress: () => {
             if (typeof logoutAction === 'function') logoutAction();
          }}]
        );
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Attendance
  clockIn: async (employeeId, location, deviceInfo) => {
    const response = await apiClient.post('/attendance/clock-in', { employeeId, location, deviceInfo });
    return response.data;
  },
  clockOut: async (employeeId) => {
    const response = await apiClient.post('/attendance/clock-out', { employeeId });
    return response.data;
  },
  getAttendanceHistory: async (employeeId, skip, take) => {
    const response = await apiClient.get(`/attendance/history/${employeeId}`, {
      params: { skip, take }
    });
    return response.data;
  },
  getMonthlyAttendance: async (employeeId, month, year) => {
    const response = await apiClient.get(`/attendance/monthly/${employeeId}`, {
      params: { month, year }
    });
    return response.data;
  },

  // Time Off
  getTimeOffRequests: async (employeeId) => {
    const response = await apiClient.get(`/time-off/employee/${employeeId}`);
    return response.data;
  },
  requestTimeOff: async (data) => {
    const response = await apiClient.post('/time-off/request', data);
    return response.data;
  },

  // Tasks
  getTasks: async (employeeId) => {
    const response = await apiClient.get(`/tasks/employee/${employeeId}`);
    return response.data;
  },
  updateTaskStatus: async (taskId, status) => {
    const response = await apiClient.patch(`/tasks/update-status/${taskId}`, { status });
    return response.data;
  },
  updateTaskProgress: async (taskId, progress) => {
    const response = await apiClient.patch(`/tasks/update-progress/${taskId}`, { progress });
    return response.data;
  },
  updateTask: async (taskId, data) => {
    const response = await apiClient.patch(`/tasks/${taskId}`, data);
    return response.data;
  },
  assignTask: async (data) => {
    const response = await apiClient.post('/tasks', data);
    return response.data;
  },

  // Payroll
  getPayroll: async (employeeId) => {
    const response = await apiClient.get(`/payroll/employee/${employeeId}`);
    return response.data;
  },
  getMonthlyPayrolls: async (month, year) => {
    const response = await apiClient.get('/payroll/monthly', {
      params: { month, year }
    });
    return response.data;
  },
  createPayroll: async (data) => {
    const response = await apiClient.post('/payroll', data);
    return response.data;
  },

  // Notifications
  getNotifications: async (employeeId) => {
    const response = await apiClient.get(`/notifications/employee/${employeeId}`);
    return response.data;
  },
  markNotificationRead: async (id) => {
    const response = await apiClient.patch(`/notifications/mark-read/${id}`);
    return response.data;
  },

  // Employee Profile
  getEmployeeProfile: async (employeeId) => {
    const response = await apiClient.get(`/employees/${employeeId}`);
    return response.data;
  },
  updateEmployeeProfile: async (employeeId, data) => {
    const response = await apiClient.patch(`/employees/${employeeId}`, data);
    return response.data;
  },

  // HR / Admin Dashboard
  getHrSummary: async () => {
    const response = await apiClient.get('/hr-dashboard/summary');
    return response.data;
  },
  getRecentLeaves: async () => {
    const response = await apiClient.get('/hr-dashboard/recent-leaves');
    return response.data;
  },
  getHrAnalytics: async () => {
    const response = await apiClient.get('/hr-dashboard/analytics');
    return response.data;
  },
  getAllEmployees: async () => {
    const response = await apiClient.get('/employees');
    return response.data;
  },
  getDepartments: async () => {
    const response = await apiClient.get('/employees/departments');
    return response.data;
  },
  getPositions: async () => {
    const response = await apiClient.get('/employees/positions');
    return response.data;
  },
  updateTimeOffStatus: async (id, status, approvedBy) => {
    const response = await apiClient.patch(`/time-off/update-status/${id}`, { status, approvedBy });
    return response.data;
  },
  getAllTimeOffRequests: async () => {
    const response = await apiClient.get('/time-off/all');
    return response.data;
  },
  getDailyAttendance: async (date) => {
    const response = await apiClient.get('/attendance/daily', { params: { date } });
    return response.data;
  },
  getAllTasks: async (params) => {
    const response = await apiClient.get('/tasks/all', { params });
    return response.data;
  },
  createEmployee: async (data) => {
    const response = await apiClient.post('/employees', data);
    return response.data;
  },
  removeEmployee: async (id) => {
    const response = await apiClient.delete(`/employees/${id}`);
    return response.data;
  },
  checkFaceStatus: async (employeeId) => {
    const response = await apiClient.get(`/face-recognition/status/${employeeId}`);
    return response.data;
  },
  resetFaceData: async (employeeId) => {
    const response = await apiClient.delete(`/face-recognition/reset/${employeeId}`);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
  registerFace: async (formData) => {
    const response = await apiClient.post('/face-recognition/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  recognizeFace: async (formData) => {
    const response = await apiClient.post('/face-recognition/recognize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Attendance Correction
  requestAttendanceCorrection: async (data) => {
    const response = await apiClient.post('/attendance-correction', data);
    return response.data;
  },
  getMyAttendanceCorrections: async (employeeId) => {
    const response = await apiClient.get(`/attendance-correction/my/${employeeId}`);
    return response.data;
  },
  getAllPendingAttendanceCorrections: async () => {
    const response = await apiClient.get('/attendance-correction/pending');
    return response.data;
  },
  updateAttendanceCorrectionStatus: async (id, status, adminNote) => {
    const response = await apiClient.patch(`/attendance-correction/${id}/status`, { status, adminNote });
    return response.data;
  },

  // Teams
  getTeams: async () => {
    const response = await apiClient.get('/teams');
    return response.data;
  },
  getMyTeams: async () => {
    const response = await apiClient.get('/teams/my-teams/list');
    return response.data;
  },
  getTeamById: async (id) => {
    const response = await apiClient.get(`/teams/${id}`);
    return response.data;
  },
  createTeam: async (data) => {
    const response = await apiClient.post('/teams', data);
    return response.data;
  },
  updateTeam: async (id, data) => {
    const response = await apiClient.patch(`/teams/${id}`, data);
    return response.data;
  },
  deleteTeam: async (id) => {
    const response = await apiClient.delete(`/teams/${id}`);
    return response.data;
  },

  // Overtime
  requestOvertime: async (data) => {
    const response = await apiClient.post('/overtime/request', data);
    return response.data;
  },
  getMyOvertime: async () => {
    const response = await apiClient.get('/overtime/my');
    return response.data;
  },
  getAllPendingOvertime: async () => {
    const response = await apiClient.get('/overtime/pending');
    return response.data;
  },
  approveOvertime: async (id, status, adminNote) => {
    const response = await apiClient.put(`/overtime/approve/${id}`, { status, adminNote });
    return response.data;
  },

  // KPI
  getKpiSummary: async (month, year) => {
    const response = await apiClient.get('/kpi/summary', { params: { month, year } });
    return response.data;
  },
  getEmployeeKpi: async (employeeId, month, year) => {
    const response = await apiClient.get(`/kpi/employee/${employeeId}`, { params: { month, year } });
    return response.data;
  },
  getKpiHistory: async (employeeId) => {
    const response = await apiClient.get(`/kpi/history/${employeeId}`);
    return response.data;
  },
  submitKpiReview: async (data) => {
    const response = await apiClient.post('/kpi/review', data);
    return response.data;
  },
  getKpiCriteria: async () => {
    const response = await apiClient.get('/kpi/criteria');
    return response.data;
  },
  addKpiCriteria: async (name) => {
    const response = await apiClient.post('/kpi/criteria', { name });
    return response.data;
  },
  deleteKpiCriteria: async (id) => {
    const response = await apiClient.post(`/kpi/delete-criteria/${id}`);
    return response.data;
  },
};



