import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { apiService } from '../services/api';

export const loadAuthState = createAsyncThunk('auth/loadAuthState', async () => {
  const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
  const user = JSON.parse(await AsyncStorage.getItem('user'));
  const accessToken = await AsyncStorage.getItem('accessToken');
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  return {
    isAuthenticated: isAuthenticated === 'true' && !!accessToken,
    user: user,
    accessToken,
    refreshToken,
  };
});

export const loginUser = createAsyncThunk('auth/loginUser', async ({ username, password }, thunkAPI) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Invalid Username and Password');
    }

    const tokenData = await response.json();

    // First, save tokens to AsyncStorage so future requests (like get profile) can use them
    if (tokenData.access_token) await AsyncStorage.setItem('accessToken', tokenData.access_token);
    if (tokenData.refresh_token) await AsyncStorage.setItem('refreshToken', tokenData.refresh_token);

    // Fetch full user profile
    const userData = await apiService.getCurrentUser();

    await AsyncStorage.setItem('isAuthenticated', 'true');
    await AsyncStorage.setItem('user', JSON.stringify(userData));

    return {
      ...tokenData,
      ...userData,
    };

  } catch (error) {
    return thunkAPI.rejectWithValue(error.message);
  }
});


const initialState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  isHydrated: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      AsyncStorage.removeItem('isAuthenticated');
      AsyncStorage.removeItem('user');
      AsyncStorage.removeItem('accessToken');
      AsyncStorage.removeItem('refreshToken');
    },
    setTokens(state, action) {
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      AsyncStorage.setItem('accessToken', action.payload.access_token);
      AsyncStorage.setItem('refreshToken', action.payload.refresh_token);
    },
    updateUserProfile(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loadAuthState.fulfilled, (state, action) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isHydrated = true;
    });
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      state.loading = false;
      state.error = null;
    });

    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { logout, updateUserProfile, setTokens } = authSlice.actions;
export default authSlice.reducer;