import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import reducers
import uiReducer from './uiSlice';
import authReducer from './authSlice';
import filtersReducer from './filtersSlice';

// Define root state type
export interface RootState {
  ui: import('./uiSlice').UIState;
  auth: import('./authSlice').AuthState;
  filters: import('./filtersSlice').FilterState;
}

// Create Redux store
export const store = configureStore({
  reducer: combineReducers({
    ui: uiReducer,
    auth: authReducer,
    filters: filtersReducer,
  }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Export typed hooks
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;