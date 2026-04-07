import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../services/api';

// Async Thunks for fetching initial data
export const fetchHrDashboard = createAsyncThunk('data/fetchHrDashboard', async (_, { rejectWithValue }) => {
  try {
    const [summary, recentLeaves, allLeaveRequests, allTasks, allEmployees, allTeams] = await Promise.all([
      apiService.getHrSummary(),
      apiService.getRecentLeaves(),
      apiService.getAllTimeOffRequests(),
      apiService.getAllTasks(),
      apiService.getAllEmployees(),
      apiService.getTeams()
    ]);
    return { summary, recentLeaves, allLeaveRequests, allTasks, allEmployees, allTeams };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const fetchEmployeeTasks = createAsyncThunk('data/fetchEmployeeTasks', async (employeeId, { rejectWithValue }) => {
  try {
    const tasks = await apiService.getTasks(employeeId);
    return tasks;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const fetchEmployeeTimeOff = createAsyncThunk('data/fetchEmployeeTimeOff', async (employeeId, { rejectWithValue }) => {
  try {
    const timeOff = await apiService.getTimeOffRequests(employeeId);
    return timeOff;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const fetchNotifications = createAsyncThunk('data/fetchNotifications', async (employeeId, { rejectWithValue }) => {
  try {
    const notifications = await apiService.getNotifications(employeeId);
    return notifications;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const fetchEmployeeAttendance = createAsyncThunk('data/fetchEmployeeAttendance', async (employeeId, { rejectWithValue }) => {
  try {
    const attendance = await apiService.getAttendanceHistory(employeeId, 0, 10);
    return attendance;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const initialState = {
  hrDashboard: {
    summary: null,
    recentLeaves: [],
    leaveRequests: [],
    allTasks: [],
    allTeams: [],
    pendingOvertime: [],
    loading: false,
    error: null,
  },
  employeeData: {
    tasks: [],
    timeOff: [],
    overtime: [],
    attendanceHistory: [],
    loading: false,
    error: null,
  },
  notifications: [],
  isInitialized: false,
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setHrSummary(state, action) {
      state.hrDashboard.summary = action.payload;
    },
    setRecentLeaves(state, action) {
      state.hrDashboard.recentLeaves = action.payload;
    },
    updateRecentLeave(state, action) {
        const index = state.hrDashboard.recentLeaves.findIndex(l => l.id === action.payload.id);
        if (index !== -1) {
            state.hrDashboard.recentLeaves[index] = action.payload;
        } else {
            state.hrDashboard.recentLeaves.unshift(action.payload);
            if (state.hrDashboard.recentLeaves.length > 10) {
                state.hrDashboard.recentLeaves.pop();
            }
        }
    },
    setEmployeeTasks(state, action) {
      state.employeeData.tasks = action.payload;
    },
    updateTask(state, action) {
        const index = state.employeeData.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
            state.employeeData.tasks[index] = action.payload;
        } else {
            state.employeeData.tasks.unshift(action.payload);
        }
    },
    setEmployeeTimeOff(state, action) {
      state.employeeData.timeOff = action.payload;
    },
    updateTimeOff(state, action) {
        const index = state.employeeData.timeOff.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
            state.employeeData.timeOff[index] = action.payload;
        } else {
            state.employeeData.timeOff.unshift(action.payload);
        }
    },
    setNotifications(state, action) {
      state.notifications = action.payload;
    },
    addNotification(state, action) {
      state.notifications.unshift(action.payload);
    },
    updateEmployee(state, action) {
        const { employee, action: type, employeeId } = action.payload;
        if (type === 'CREATED') {
            const exists = state.hrDashboard.allEmployees.find(e => e.id === employee?.id);
            if (!exists && employee) {
                state.hrDashboard.allEmployees.unshift(employee);
            }
        } else if (type === 'UPDATED') {
            const index = state.hrDashboard.allEmployees.findIndex(e => e.id === employee?.id);
            if (index !== -1) {
                state.hrDashboard.allEmployees[index] = { ...state.hrDashboard.allEmployees[index], ...employee };
            }
        } else if (type === 'DELETED') {
            const idToRemove = employeeId || employee?.id;
            state.hrDashboard.allEmployees = state.hrDashboard.allEmployees.filter(e => e.id !== idToRemove);
        }
    },
    setEmployeeAttendance(state, action) {
      state.employeeData.attendanceHistory = action.payload;
    },
    updateOvertime(state, action) {
        const index = state.employeeData.overtime.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
            state.employeeData.overtime[index] = action.payload;
        } else {
            state.employeeData.overtime.unshift(action.payload);
        }
    },
    updatePendingOvertime(state, action) {
        const index = state.hrDashboard.pendingOvertime.findIndex(o => o.id === action.payload.id);
        if (action.payload.status === 'PENDING') {
            if (index !== -1) {
                state.hrDashboard.pendingOvertime[index] = action.payload;
            } else {
                state.hrDashboard.pendingOvertime.unshift(action.payload);
            }
        } else {
            // Remove if no longer pending
            if (index !== -1) {
                state.hrDashboard.pendingOvertime.splice(index, 1);
            }
        }
    },
    clearData(state) {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // HR Dashboard
      .addCase(fetchHrDashboard.pending, (state) => {
        state.hrDashboard.loading = true;
      })
      .addCase(fetchHrDashboard.fulfilled, (state, action) => {
        state.hrDashboard.loading = false;
        state.hrDashboard.summary = action.payload.summary;
        state.hrDashboard.recentLeaves = action.payload.recentLeaves;
        state.hrDashboard.leaveRequests = action.payload.allLeaveRequests;
        state.hrDashboard.allTasks = action.payload.allTasks;
        state.hrDashboard.allEmployees = action.payload.allEmployees;
        state.hrDashboard.allTeams = action.payload.allTeams;
        state.isInitialized = true;
      })
      .addCase(fetchHrDashboard.rejected, (state, action) => {
        state.hrDashboard.loading = false;
        state.hrDashboard.error = action.payload;
      })
      // Employee Tasks
      .addCase(fetchEmployeeTasks.fulfilled, (state, action) => {
        state.employeeData.tasks = action.payload;
      })
      // Employee TimeOff
      .addCase(fetchEmployeeTimeOff.fulfilled, (state, action) => {
        state.employeeData.timeOff = action.payload;
      })
      // Notifications
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
      })
      // Employee Attendance
      .addCase(fetchEmployeeAttendance.fulfilled, (state, action) => {
        state.employeeData.attendanceHistory = action.payload;
      });
  },
});

export const { 
    setHrSummary, 
    setRecentLeaves, 
    updateRecentLeave, 
    setEmployeeTasks, 
    updateTask, 
    setEmployeeTimeOff, 
    updateTimeOff,
    setNotifications,
    addNotification,
    updateEmployee,
    setEmployeeAttendance, 
    updateOvertime,
    updatePendingOvertime,
    clearData 
} = dataSlice.actions;

export default dataSlice.reducer;
