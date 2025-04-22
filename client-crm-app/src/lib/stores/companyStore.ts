import { StateCreator } from 'zustand';
import { 
  Company,
  addCompany,
  getCompanyById,
  updateCompany,
  deleteCompany,
  getClientsByCompany,
  getCompanyWithClients,
  getAllCompanies,
  addBulkCompanies,
  removeCompanyAndUpdateClients
} from '../db';

// Company state and actions
export interface CompanyState {
  companies: Company[];
  selectedCompany: Company | null;
  isLoadingCompanies: boolean;
  error: string | null;
  message: string | null;
}

export interface CompanyActions {
  fetchCompanies: () => Promise<void>;
  fetchCompanyById: (id: number) => Promise<void>;
  createCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  createBulkCompanies: (companies: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<number[]>;
  updateCompanyData: (id: number, company: Partial<Omit<Company, 'id' | 'createdAt'>>) => Promise<void>;
  removeCompany: (id: number) => Promise<void>;
  setSelectedCompany: (company: Company | null) => void;
  fetchClientsByCompany: (companyId: number) => Promise<void>;
  fetchCompanyWithClients: (companyId: number) => Promise<void>;
}

export type CompanySlice = CompanyState & CompanyActions;

// This is a slice creator function that will be composed with other slices
export const createCompanySlice: StateCreator<
  ClientSlice & CompanySlice & InteractionSlice & ErrorSlice,
  [],
  [],
  CompanySlice
> = (set, get) => ({
  // Company state
  companies: [],
  selectedCompany: null,
  isLoadingCompanies: false,
  error: null,
  message: null,
  
  // Company actions
  fetchCompanies: async () => {
    set({ isLoadingCompanies: true, error: null, message: null });
    try {
      const companies = await getAllCompanies();
      set({ companies, isLoadingCompanies: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoadingCompanies: false, message: null });
    }
  },
  
  fetchCompanyById: async (id: number) => {
    set({ isLoadingCompanies: true, error: null, message: null });
    try {
      const company = await getCompanyById(id);
      if (company) {
        set({ selectedCompany: company, isLoadingCompanies: false });
      } else {
        set({ error: `Company with ID ${id} not found`, isLoadingCompanies: false, message: null });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoadingCompanies: false, message: null });
    }
  },
  
  createCompany: async (company) => {
    set({ isLoadingCompanies: true, error: null, message: null });
    try {
      const id = await addCompany(company);
      // Refresh companies list after adding
      await get().fetchCompanies();
      set({ isLoadingCompanies: false, message: `Company created successfully` });
      return id;
    } catch (error) {
      set({ error: (error as Error).message, isLoadingCompanies: false, message: null });
      throw error;
    }
  },
  
  createBulkCompanies: async (companies) => {
    set({ isLoadingCompanies: true, error: null, message: null });
    try {
      const ids = await addBulkCompanies(companies);
      // Refresh companies list after adding
      await get().fetchCompanies();
      set({ isLoadingCompanies: false, message: `Companies created successfully` });
      return ids;
    } catch (error) {
      set({ error: (error as Error).message, isLoadingCompanies: false, message: null });
      throw error;
    }
  },
  
  updateCompanyData: async (id, company) => {
    set({ isLoadingCompanies: true, error: null, message: null });
    try {
      await updateCompany(id, company);
      // Refresh companies list and selected company
      await get().fetchCompanies();
      if (get().selectedCompany?.id === id) {
        await get().fetchCompanyById(id);
      }
      set({ isLoadingCompanies: false, message: `Company updated successfully` });
    } catch (error) {
      set({ error: (error as Error).message, isLoadingCompanies: false, message: null });
    }
  },
  
  removeCompany: async (id) => {
    set({ isLoadingCompanies: true, error: null, message: null });
    try {
      // Use the new function that handles both company deletion and client updates
      const updatedClientsCount = await removeCompanyAndUpdateClients(id);
      
      // Refresh companies list after deletion
      await get().fetchCompanies();
      
      // Clear selected company if it was deleted
      if (get().selectedCompany?.id === id) {
        set({ selectedCompany: null });
      }
      
      set({ 
        isLoadingCompanies: false,
        // Add a success message with the number of clients updated
        message: updatedClientsCount > 0 
          ? `Company deleted and ${updatedClientsCount} client${updatedClientsCount === 1 ? '' : 's'} updated` 
          : 'Company deleted successfully'
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoadingCompanies: false, message: null });
    }
  },
  
  setSelectedCompany: (company) => {
    set({ selectedCompany: company });
  },
  
  fetchClientsByCompany: async (companyId: number) => {
    set({ isLoading: true, error: null, message: null });
    try {
      const clients = await getClientsByCompany(companyId);
      set({ clients, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false, message: null });
    }
  },
  
  fetchCompanyWithClients: async (companyId: number) => {
    set({ isLoading: true, isLoadingCompanies: true, error: null, message: null });
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
});

// Import types from other slices to avoid circular dependencies
import { ClientSlice } from './clientStore';
import { InteractionSlice } from './interactionStore';
import { ErrorSlice } from './errorStore';
