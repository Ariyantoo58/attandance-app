import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loadAuthState, logout } from './authSlice';
import dataReducer from './dataSlice';
import { setLogoutAction } from '../services/api';

const store = configureStore({
  reducer: {
    auth: authReducer,
    data: dataReducer,
  },
});

setLogoutAction(() => store.dispatch(logout()));

store.dispatch(loadAuthState());

export default store;
