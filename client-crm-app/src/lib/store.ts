import { create } from 'zustand';
import { 
  Client, 
  Interaction, 
  Note,
  Company,
  addClient, 
  getAllClients, 
  getClientById, 
  updateClient, 
  deleteClient, 
  getRecentClients,
  getClientInteractions,
  getAllInteractions,
  addInteraction,
  getUniqueCompanies,
  addCompany,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getClientsByCompany,
  getCompanyWithClients
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
  companies: Company[];
  selectedCompany: Company | null;
  isLoadingCompanies: boolean;
  
  // Actions - Clients
  fetchClients: () => Promise<void>;
  fetchRecentClients: (limit?: number) => Promise<void>;
  fetchClientById: (id: number) => Promise<void>;
  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  createClientWithCompany: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> & { companyName?: string }) => Promise<number>;
  updateClientData: (id: number, client: Partial<Omit<Client, 'id' | 'createdAt'>>) => Promise<void>;
  removeClient: (id: number) => Promise<void>;
  setSelectedClient: (client: Client | null) => void;
  
  // Actions - Interactions
  fetchClientInteractions: (clientId: number) => Promise<void>;
  fetchAllInteractions: () => Promise<void>;
  createInteraction: (interaction: Omit<Interaction, 'id' | 'createdAt'>) => Promise<number>;
  
  // Actions - Companies
  fetchCompanies: () => Promise<void>;
  fetchCompanyById: (id: number) => Promise<void>;
  createCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  updateCompanyData: (id: number, company: Partial<Omit<Company, 'id' | 'createdAt'>>) => Promise<void>;
  removeCompany: (id: number) => Promise<void>;
  setSelectedCompany: (company: Company | null) => void;
  fetchClientsByCompany: (companyId: number) => Promise<void>;
  fetchCompanyWithClients: (companyId: number) => Promise<void>;
  
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
  selectedCompany: null,
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
      // Convert string array to Company array
      const companyObjects = await Promise.all(
        companies.map(async (name) => {
          // Try to find existing company by name
          const existingCompany = get().companies.find(c => c.name === name);
          if (existingCompany) {
            return existingCompany;
          }
          
          // If not found, create a new company object
          const id = await addCompany({ name });
          return { id, name, createdAt: new Date(), updatedAt: new Date() };
        })
      );
      set({ companies: companyObjects, isLoadingCompanies: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoadingCompanies: false });
    }
  },
  
  fetchCompanyById: async (id: number) => {
    set({ isLoadingCompanies: true, error: null });
    try {
      const company = await getCompanyById(id);
      if (company) {
        set({ selectedCompany: company, isLoadingCompanies: false });
      } else {
        set({ error: `Company with ID ${id} not found`, isLoadingCompanies: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoadingCompanies: false });
    }
  },
  
  createCompany: async (company) => {
    set({ isLoadingCompanies: true, error: null });
    try {
      const id = await addCompany(company);
      // Refresh companies list after adding
      await get().fetchCompanies();
      set({ isLoadingCompanies: false });
      return id;
    } catch (error) {
      set({ error: (error as Error).message, isLoadingCompanies: false });
      throw error;
    }
  },
  
  updateCompanyData: async (id, company) => {
    set({ isLoadingCompanies: true, error: null });
    try {
      await updateCompany(id, company);
      // Refresh companies list and selected company
      await get().fetchCompanies();
      if (get().selectedCompany?.id === id) {
        await get().fetchCompanyById(id);
      }
      set({ isLoadingCompanies: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoadingCompanies: false });
    }
  },
  
  removeCompany: async (id) => {
    set({ isLoadingCompanies: true, error: null });
    try {
      await deleteCompany(id);
      // Refresh companies list after deletion
      await get().fetchCompanies();
      // Clear selected company if it was deleted
      if (get().selectedCompany?.id === id) {
        set({ selectedCompany: null });
      }
      set({ isLoadingCompanies: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoadingCompanies: false });
    }
  },
  
  setSelectedCompany: (company) => {
    set({ selectedCompany: company });
  },
  
  fetchClientsByCompany: async (companyId: number) => {
    set({ isLoading: true, error: null });
    try {
      const clients = await getClientsByCompany(companyId);
      set({ clients, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  fetchCompanyWithClients: async (companyId: number) => {
    set({ isLoading: true, isLoadingCompanies: true, error: null });
    try {
      const result = await getCompanyWithClients(companyId);
      if (result) {
        set({ 
          selectedCompany: result.company, 
          clients: result.clients, 
          isLoading: false, 
          isLoadingCompanies: false 
        });
      } else {
        set({ 
          error: `Company with ID ${companyId} not found`, 
          isLoading: false, 
          isLoadingCompanies: false 
        });
      }
    } catch (error) {
      set({ 
        error: (error as Error).message, 
        isLoading: false, 
        isLoadingCompanies: false 
      });
    }
  },
  
  clearError: () => {
    set({ error: null, interactionError: null });
  }
}));
