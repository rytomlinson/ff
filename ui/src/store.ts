import { configureStore } from '@reduxjs/toolkit';
import { projectReducer } from './slices/projectSlice.js';

export const store = configureStore({
  reducer: {
    project: projectReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore date serialization warnings for createdAt/updatedAt
        ignoredActions: ['project/setItems', 'project/upsertItem'],
        ignoredPaths: ['project.items'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
