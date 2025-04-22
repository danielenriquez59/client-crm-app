import { StateCreator } from 'zustand';
import { 
  Client,
  addClient, 
  getAllClients, 
  getClientById, 
  updateClient, 
  deleteClient, 
  getRecentClients,
  addBulkClients,
} from '../db';

// Client state and actions
export interface ClientState {
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;
}

export interface ClientActions {
  fetchClients: () => Promise<void>;
  fetchRecentClients: (limit?: number) => Promise<void>;
  fetchClientById: (id: number) => Promise<void>;
  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  createClientWithCompany: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> & { companyName?: string }) => Promise<number>;
  createBulkClients: (clients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<number[]>;
  updateClientData: (id: number, client: Partial<Omit<Client, 'id' | 'createdAt'>>) => Promise<void>;
  removeClient: (id: number) => Promise<void>;
  setSelectedClient: (client: Client | null) => void;
}

export type ClientSlice = ClientState & ClientActions;

// This is a slice creator function that will be composed with other slices
export const createClientSlice: StateCreator<
  ClientSlice & CompanySlice & InteractionSlice & ErrorSlice,
  [],
  [],
  ClientSlice
> = (set, get) => ({
  // Client state
  clients: [],
  selectedClient: null,
  isLoading: false,
  error: null,
  
  // Client actions
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
  
  createClientWithCompany: async (client) => {
    set({ isLoading: true, error: null });
    try {
      // Get current companies list
      const companies = get().companies;
      
      // If companies list is empty, fetch it first
      if (companies.length === 0) {
        await get().fetchCompanies();
      }
      
      // Handle company if companyName is provided
      let companyId: number | undefined = client.companyId;
      
      if (client.companyName && client.companyName.trim() !== '') {
        // Try to find existing company
        const existingCompany = get().companies.find(
          c => c.name.toLowerCase() === client.companyName!.toLowerCase()
        );
        
        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Create new company
          const newCompanyId = await get().createCompany({ name: client.companyName });
          companyId = newCompanyId;
        }
      }
      
      // Create client with company reference
      const clientToCreate = {
        name: client.name,
        email: client.email,
        phone: client.phone,
        companyId,
        location: client.location,
        status: client.status
      };
      
      const id = await addClient(clientToCreate);
      
      // Refresh client list after adding
      await get().fetchClients();
      
      set({ isLoading: false });
      return id;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  createBulkClients: async (clients) => {
    set({ isLoading: true, error: null });
    try {
      const ids = await addBulkClients(clients);
      // Refresh client list after adding
      await get().fetchClients();
      set({ isLoading: false });
      return ids;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
  
  updateClientData: async (id, client) => {
    set({ isLoading: true, error: null });
    try {
      // If updating company name, handle it
      let updatedClient = { ...client };
      
      await updateClient(id, updatedClient);
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
});

// Import types from other slices to avoid circular dependencies
import { CompanySlice } from './companyStore';
import { InteractionSlice } from './interactionStore';
import { ErrorSlice } from './errorStore';
