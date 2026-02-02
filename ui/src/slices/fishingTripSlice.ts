import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { FishingTrip } from '@ff/common/schemas/fishingTripSchema.js';
import type { RootState } from '../store.js';

export interface FishingTripState {
  items: Record<string, FishingTrip>;
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  formOpen: boolean;
  pendingCoordinates: { lat: number; lng: number } | null;
  pendingLocationName: string | null;
}

const initialState: FishingTripState = {
  items: {},
  selectedId: null,
  loading: false,
  error: null,
  formOpen: false,
  pendingCoordinates: null,
  pendingLocationName: null,
};

const fishingTripSlice = createSlice({
  name: 'fishingTrip',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<FishingTrip[]>) => {
      state.items = {};
      for (const trip of action.payload) {
        state.items[trip.id] = trip;
      }
    },
    upsertItem: (state, action: PayloadAction<FishingTrip>) => {
      state.items[action.payload.id] = action.payload;
    },
    deleteItem: (state, action: PayloadAction<string>) => {
      delete state.items[action.payload];
      if (state.selectedId === action.payload) {
        state.selectedId = null;
      }
    },
    setSelectedId: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    openForm: (state, action: PayloadAction<{ lat?: number; lng?: number; locationName?: string } | undefined>) => {
      state.formOpen = true;
      if (action.payload?.lat !== undefined && action.payload?.lng !== undefined) {
        state.pendingCoordinates = { lat: action.payload.lat, lng: action.payload.lng };
      }
      if (action.payload?.locationName) {
        state.pendingLocationName = action.payload.locationName;
      }
    },
    closeForm: (state) => {
      state.formOpen = false;
      state.pendingCoordinates = null;
      state.pendingLocationName = null;
    },
    reset: () => initialState,
  },
});

// Primitive selectors
const primitiveSelectors = {
  selectItems: (state: RootState) => state.fishingTrip.items,
  selectSelectedId: (state: RootState) => state.fishingTrip.selectedId,
  selectLoading: (state: RootState) => state.fishingTrip.loading,
  selectError: (state: RootState) => state.fishingTrip.error,
  selectFormOpen: (state: RootState) => state.fishingTrip.formOpen,
  selectPendingCoordinates: (state: RootState) => state.fishingTrip.pendingCoordinates,
  selectPendingLocationName: (state: RootState) => state.fishingTrip.pendingLocationName,
};

// Derived selectors
const selectItemsArray = createSelector(
  [primitiveSelectors.selectItems],
  (items) => Object.values(items).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
);

const selectSelectedItem = createSelector(
  [primitiveSelectors.selectItems, primitiveSelectors.selectSelectedId],
  (items, selectedId) => (selectedId ? items[selectedId] ?? null : null)
);

const selectItemById = (id: string) =>
  createSelector([primitiveSelectors.selectItems], (items) => items[id] ?? null);

export const fishingTripActions = fishingTripSlice.actions;

export const fishingTripSelectors = {
  ...primitiveSelectors,
  selectItemsArray,
  selectSelectedItem,
  selectItemById,
};

export const fishingTripReducer = fishingTripSlice.reducer;
