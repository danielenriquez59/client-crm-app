import { StateCreator } from 'zustand';

// Error handling state and actions
export interface ErrorSlice {
  clearError: () => void;
}

// This is a slice creator function that will be composed with other slices
export const createErrorSlice: StateCreator<
  ClientSlice & CompanySlice & InteractionSlice & ErrorSlice,
  [],
  [],
  ErrorSlice
> = (set) => ({
  // Error handling actions
  clearError: () => {
    set({ error: null, interactionError: null });
  },
});

// Import types from other slices to avoid circular dependencies
import { ClientSlice } from './clientStore';
import { CompanySlice } from './companyStore';
import { InteractionSlice } from './interactionStore';
