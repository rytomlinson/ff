import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { Project } from '@ff/common/schemas/projectSchema.js';
import type { RootState } from '../store.js';

interface ProjectState {
  items: Record<string, Project>;
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  items: {},
  selectedId: null,
  loading: false,
  error: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<Project[]>) => {
      state.items = {};
      for (const project of action.payload) {
        state.items[project.id] = project;
      }
    },
    upsertItem: (state, action: PayloadAction<Project>) => {
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
    reset: () => initialState,
  },
});

// Primitive selectors
const primitiveSelectors = {
  selectItems: (state: RootState) => state.project.items,
  selectSelectedId: (state: RootState) => state.project.selectedId,
  selectLoading: (state: RootState) => state.project.loading,
  selectError: (state: RootState) => state.project.error,
};

// Derived selectors
const selectItemsArray = createSelector(
  [primitiveSelectors.selectItems],
  (items) => Object.values(items)
);

const selectSelectedItem = createSelector(
  [primitiveSelectors.selectItems, primitiveSelectors.selectSelectedId],
  (items, selectedId) => (selectedId ? items[selectedId] ?? null : null)
);

const selectItemById = (id: string) =>
  createSelector([primitiveSelectors.selectItems], (items) => items[id] ?? null);

export const projectActions = projectSlice.actions;

export const projectSelectors = {
  ...primitiveSelectors,
  selectItemsArray,
  selectSelectedItem,
  selectItemById,
};

export const projectReducer = projectSlice.reducer;
