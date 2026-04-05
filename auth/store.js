// store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loadAuthState } from './authSlice';
import dataReducer from './dataSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    data: dataReducer,
  },
});

store.dispatch(loadAuthState());

export default store;
