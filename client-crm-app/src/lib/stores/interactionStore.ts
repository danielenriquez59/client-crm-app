import { StateCreator } from 'zustand';
import { 
  Interaction,
  getClientInteractions,
  getAllInteractions,
  updateInteraction,
  removeInteraction,
  addInteraction,
} from '../db';

// Interaction state and actions
export interface InteractionState {
  interactions: Interaction[];
  isLoadingInteractions: boolean;
  interactionError: string | null;
}

export interface InteractionActions {
  fetchClientInteractions: (clientId: number) => Promise<void>;
  fetchAllInteractions: () => Promise<void>;
  createInteraction: (interaction: Omit<Interaction, 'id' | 'createdAt'>) => Promise<number>;
  updateInteraction: (id: number, interaction: Partial<Omit<Interaction, 'id' | 'createdAt'>>) => Promise<void>;
  removeInteraction: (id: number) => Promise<void>;
}

export type InteractionSlice = InteractionState & InteractionActions;

// This is a slice creator function that will be composed with other slices
export const createInteractionSlice: StateCreator<
  ClientSlice & CompanySlice & InteractionSlice & ErrorSlice,
  [],
  [],
  InteractionSlice
> = (set, get) => ({
  // Interaction state
  interactions: [],
  isLoadingInteractions: false,
  interactionError: null,
  
  // Interaction actions
  fetchClientInteractions: async (clientId) => {
    set({ isLoadingInteractions: true, interactionError: null });
    try {
      const interactions = await getClientInteractions(clientId);
      set({ interactions, isLoadingInteractions: false });
    } catch (error) {
      set({ interactionError: (error as Error).message, isLoadingInteractions: false });
    }
  },
  
  fetchAllInteractions: async () => {
    set({ isLoadingInteractions: true, interactionError: null });
    try {
      const interactions = await getAllInteractions();
      set({ interactions, isLoadingInteractions: false });
    } catch (error) {
      set({ interactionError: (error as Error).message, isLoadingInteractions: false });
    }
  },
  
  createInteraction: async (interaction) => {
    set({ isLoadingInteractions: true, interactionError: null });
    try {
      const id = await addInteraction(interaction);
      // Refresh interactions after adding
      await get().fetchAllInteractions(); 
      set({ isLoadingInteractions: false });
      return id;
    } catch (error) {
      set({ interactionError: (error as Error).message, isLoadingInteractions: false });
      throw error;
    }
  },
  updateInteraction: async (id, interaction) => {
    set({ isLoadingInteractions: true, interactionError: null });
    try {
      await updateInteraction(id, interaction);
      // Refresh interactions after updating
      await get().fetchAllInteractions(); 
      set({ isLoadingInteractions: false });
    } catch (error) {
      set({ interactionError: (error as Error).message, isLoadingInteractions: false });
      throw error;
    }
  },
  removeInteraction: async (id) => {
    set({ isLoadingInteractions: true, interactionError: null });
    try {
      await removeInteraction(id);
      // Refresh interactions after deleting
      await get().fetchAllInteractions(); 
      set({ isLoadingInteractions: false });
    } catch (error) {
      set({ interactionError: (error as Error).message, isLoadingInteractions: false });
      throw error;
    }
  },
});

// Import types from other slices to avoid circular dependencies
import { ClientSlice } from './clientStore';
import { CompanySlice } from './companyStore';
import { ErrorSlice } from './errorStore';
