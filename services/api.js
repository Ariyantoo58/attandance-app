import { API_BASE_URL } from '../config';

const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
};

export const apiService = {
  // Attendance
  clockIn: async (employeeId, location, deviceInfo) => {
    const response = await fetch(`${API_BASE_URL}/attendance/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, location, deviceInfo }),
    });
    return response.json();
  },
  clockOut: async (employeeId) => {
    const response = await fetch(`${API_BASE_URL}/attendance/clock-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    });
    return response.json();
  },
  getAttendanceHistory: async (employeeId) => {
    const response = await fetch(`${API_BASE_URL}/attendance/history/${employeeId}`);
    return response.json();
  },

  // Time Off
  getTimeOffRequests: async (employeeId) => {
    const response = await fetch(`${API_BASE_URL}/time-off/employee/${employeeId}`);
    return response.json();
  },
  requestTimeOff: async (data) => {
    const response = await fetch(`${API_BASE_URL}/time-off/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Tasks
  getTasks: async (employeeId) => {
    const response = await fetch(`${API_BASE_URL}/tasks/employee/${employeeId}`);
    return response.json();
  },
  updateTaskStatus: async (taskId, status) => {
    const response = await fetch(`${API_BASE_URL}/tasks/update-status/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },

  // Payroll
  getPayroll: async (employeeId) => {
    const response = await fetch(`${API_BASE_URL}/payroll/employee/${employeeId}`);
    return response.json();
  },

  // Notifications
  getNotifications: async (employeeId) => {
    const response = await fetch(`${API_BASE_URL}/notifications/employee/${employeeId}`);
    return response.json();
  },
  markNotificationRead: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-read/${id}`, {
      method: 'PATCH',
    });
    return response.json();
  },

  // Employee Profile
  getEmployeeProfile: async (employeeId) => {
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`);
    return response.json();
  },
  updateEmployeeProfile: async (employeeId, data) => {
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // HR / Admin Dashboard
  getHrSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/hr-dashboard/summary`);
    return response.json();
  },
  getRecentLeaves: async () => {
    const response = await fetch(`${API_BASE_URL}/hr-dashboard/recent-leaves`);
    return response.json();
  },
  getAllEmployees: async () => {
    const response = await fetch(`${API_BASE_URL}/employees`);
    return response.json();
  },
  getDepartments: async () => {
    const response = await fetch(`${API_BASE_URL}/employees/departments`);
    return response.json();
  },
  getPositions: async () => {
    const response = await fetch(`${API_BASE_URL}/employees/positions`);
    const text = await response.text();
    console.log("Positions raw response:", text);
    if (!text) return [];
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error on positions:", e);
      return [];
    }
  },
  updateTimeOffStatus: async (id, status, approvedBy) => {
    const response = await fetch(`${API_BASE_URL}/time-off/update-status/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, approvedBy }),
    });
    return response.json();
  },
  getAllTimeOffRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/time-off/all`);
    return response.json();
  },
  getDailyAttendance: async (date) => {
    const response = await fetch(`${API_BASE_URL}/attendance/daily?date=${date || ''}`);
    return response.json();
  },
  getAllTasks: async () => {
    const response = await fetch(`${API_BASE_URL}/tasks/all`);
    return response.json();
  },
  createEmployee: async (data) => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  removeEmployee: async (id) => {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
  checkFaceStatus: async (employeeId) => {
    const response = await fetch(`${API_BASE_URL}/face-recognition/status/${employeeId}`);
    return response.json();
  },
  resetFaceData: async (employeeId) => {
    const response = await fetch(`${API_BASE_URL}/face-recognition/reset/${employeeId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};
