import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../services/api';

// Async Thunks for fetching initial data
export const fetchHrDashboard = createAsyncThunk('data/fetchHrDashboard', async (_, { rejectWithValue }) => {
  try {
    const [summary, recentLeaves, allLeaveRequests, allTasks, allEmployees] = await Promise.all([
      apiService.getHrSummary(),
      apiService.getRecentLeaves(),
      apiService.getAllTimeOffRequests(),
      apiService.getAllTasks(),
      apiService.getAllEmployees()
    ]);
    return { summary, recentLeaves, allLeaveRequests, allTasks, allEmployees };
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

const initialState = {
  hrDashboard: {
    summary: null,
    recentLeaves: [],
    leaveRequests: [],
    allTasks: [],
    allEmployees: [],
    loading: false,
    error: null,
  },
  employeeData: {
    tasks: [],
    timeOff: [],
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
    clearData 
} = dataSlice.actions;

export default dataSlice.reducer;
