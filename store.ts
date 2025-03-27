import { configureStore } from '@reduxjs/toolkit';
import connectionReducer from '../features/connection/connectionSlice';
import serviceReducer from '../features/service/serviceSlice';
import settingsReducer from '../features/settings/settingsSlice';

export const store = configureStore({
  reducer: {
    connection: connectionReducer,
    service: serviceReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;