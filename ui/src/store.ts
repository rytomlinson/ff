import { configureStore } from '@reduxjs/toolkit';
import { fishingTripReducer } from './slices/fishingTripSlice.js';

export const store = configureStore({
  reducer: {
    fishingTrip: fishingTripReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore date serialization warnings for createdAt/updatedAt
        ignoredActions: ['fishingTrip/setItems', 'fishingTrip/upsertItem'],
        ignoredPaths: ['fishingTrip.items'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
