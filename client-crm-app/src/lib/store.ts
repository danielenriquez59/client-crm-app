import { create } from 'zustand';
import { Client, Interaction, Note, addClient, getAllClients, getClientById, updateClient, deleteClient, getRecentClients } from './db';

interface ClientStore {
  // Client state
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchClients: () => Promise<void>;
  fetchRecentClients: (limit?: number) => Promise<void>;
  fetchClientById: (id: number) => Promise<void>;
  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  updateClientData: (id: number, client: Partial<Omit<Client, 'id' | 'createdAt'>>) => Promise<void>;
  removeClient: (id: number) => Promise<void>;
  setSelectedClient: (client: Client | null) => void;
  clearError: () => void;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  // Initial state
  clients: [],
  selectedClient: null,
  isLoading: false,
  error: null,
  
  // Actions
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
      await updateClient(id, client);
      // Refresh client list and selected client
      await get().fetchClients();
      if (get().selectedClient?.id === id) {
        await get().fetchClientById(id);
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
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  setSelectedClient: (client) => {
    set({ selectedClient: client });
  },
  
  clearError: () => {
    set({ error: null });
  }
}));
