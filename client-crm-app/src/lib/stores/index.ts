import { create } from 'zustand';

// Import all slice creators
import { ClientSlice, createClientSlice } from './clientStore';
import { CompanySlice, createCompanySlice } from './companyStore';
import { InteractionSlice, createInteractionSlice } from './interactionStore';
import { ErrorSlice, createErrorSlice } from './errorStore';

// Define the combined store type
export type ClientStore = ClientSlice & CompanySlice & InteractionSlice & ErrorSlice;

// Create the combined store
export const useClientStore = create<ClientStore>()((...a) => ({
  ...createClientSlice(...a),
  ...createCompanySlice(...a),
  ...createInteractionSlice(...a),
  ...createErrorSlice(...a),
}));

// Re-export types from each slice for convenience
export type { 
  ClientState, 
  ClientActions 
} from './clientStore';

export type { 
  CompanyState, 
  CompanyActions 
} from './companyStore';

export type { 
  InteractionState, 
  InteractionActions 
} from './interactionStore';
