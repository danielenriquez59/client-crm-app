import { create } from 'zustand';
import { 
  Client, 
  Interaction, 
  Note, 
  addClient, 
  getAllClients, 
  getClientById, 
  updateClient, 
  deleteClient, 
  getRecentClients,
  getClientInteractions,
  getAllInteractions,
  addInteraction,
  getUniqueCompanies
} from './db';
import { findMatchingCompany } from './utils';

interface ClientStore {
  // Client state
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;
  
  // Interaction state
  interactions: Interaction[];
  isLoadingInteractions: boolean;
  interactionError: string | null;

  // Companies state
  companies: string[];
  isLoadingCompanies: boolean;
  
  // Actions - Clients
  fetchClients: () => Promise<void>;
  fetchRecentClients: (limit?: number) => Promise<void>;
  fetchClientById: (id: number) => Promise<void>;
  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  createClientWithNormalizedCompany: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  updateClientData: (id: number, client: Partial<Omit<Client, 'id' | 'createdAt'>>) => Promise<void>;
  removeClient: (id: number) => Promise<void>;
  setSelectedClient: (client: Client | null) => void;
  
  // Actions - Interactions
  fetchClientInteractions: (clientId: number) => Promise<void>;
  fetchAllInteractions: () => Promise<void>;
  createInteraction: (interaction: Omit<Interaction, 'id' | 'createdAt'>) => Promise<number>;
  
  // Actions - Companies
  fetchCompanies: () => Promise<void>;
  
  // Error handling
  clearError: () => void;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  // Initial state - Clients
  clients: [],
  selectedClient: null,
  isLoading: false,
  error: null,
  
  // Initial state - Interactions
  interactions: [],
  isLoadingInteractions: false,
  interactionError: null,
  
  // Initial state - Companies
  companies: [],
  isLoadingCompanies: false,
  
  // Actions - Clients
  fetchClients: async () => {
    set({ isLoading: true, error: null });
    try {
      const clients = await getAllClients();
      set({ clients, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  fetchRecentClients: async (limit = 5) => {
    set({ isLoading: true, error: null });
    try {
      const clients = await getRecentClients(limit);
      set({ clients, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  fetchClientById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const client = await getClientById(id);
      if (client) {
        set({ selectedClient: client, isLoading: false });
      } else {
        set({ error: `Client with ID ${id} not found`, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  createClient: async (client) => {
    set({ isLoading: true, error: null });
    try {
      const id = await addClient(client);
      // Refresh client list after adding
      await get().fetchClients();
      // Refresh companies list if a new company was added
      if (client.company) {
        await get().fetchCompanies();
      }
      set({ isLoading: false });
      return id;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  createClientWithNormalizedCompany: async (client) => {
    set({ isLoading: true, error: null });
    try {
      // Get current companies list
      const companies = get().companies;
      
      // If companies list is empty, fetch it first
      if (companies.length === 0) {
        await get().fetchCompanies();
      }
      
      // Normalize company name if present
      let normalizedClient = { ...client };
      if (client.company) {
        const normalizedCompany = await findMatchingCompany(client.company, get().companies);
        normalizedClient.company = normalizedCompany;
      }
      
      // Create client with normalized company
      const id = await addClient(normalizedClient);
      
      // Refresh client list after adding
      await get().fetchClients();
      
      // Refresh companies list if a new company was added
      if (client.company) {
        await get().fetchCompanies();
      }
      
      set({ isLoading: false });
      return id;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  updateClientData: async (id, client) => {
    set({ isLoading: true, error: null });
    try {
      // If updating company, normalize it first
      let updatedClient = { ...client };
      if (client.company) {
        const normalizedCompany = await findMatchingCompany(client.company, get().companies);
        updatedClient.company = normalizedCompany;
      }
      
      await updateClient(id, updatedClient);
      // Refresh client list and selected client
      await get().fetchClients();
      if (get().selectedClient?.id === id) {
        await get().fetchClientById(id);
      }
      // Refresh companies list if company was updated
      if (client.company) {
        await get().fetchCompanies();
      }
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  removeClient: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteClient(id);
      // Refresh client list after deletion
      await get().fetchClients();
      // Clear selected client if it was deleted
      if (get().selectedClient?.id === id) {
        set({ selectedClient: null });
      }
      // Refresh interactions as they might have been updated
      await get().fetchAllInteractions();
      // Refresh companies list as a company might have been removed
      await get().fetchCompanies();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  setSelectedClient: (client) => {
    set({ selectedClient: client });
  },
  
  // Actions - Interactions
  fetchClientInteractions: async (clientId: number) => {
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
  
  // Actions - Companies
  fetchCompanies: async () => {
    set({ isLoadingCompanies: true });
    try {
      const companies = await getUniqueCompanies();
      set({ companies, isLoadingCompanies: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoadingCompanies: false });
    }
  },
  
  clearError: () => {
    set({ error: null, interactionError: null });
  }
}));
