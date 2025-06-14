import Dexie, { Table } from 'dexie';

// Define types for our database tables
export interface Client {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  companyId?: number;
  company?: string; // Keep for backward compatibility
  companyName?: string; // Added for company name lookup
  location?: string;
  status: 'active' | 'inactive' | 'evaluation';
  createdAt: Date;
  updatedAt: Date;
}

export interface Interaction {
  id?: number;
  clientIds: number[]; 
  type: 'email' | 'call' | 'meeting' | 'other' | 'task';
  date: Date;
  notes: string;
  createdAt: Date;
}

export interface Note {
  id?: number;
  clientId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id?: number;
  name: string;
  industry?: string;
  website?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define database export/import interfaces
interface ExportData {
  clients: Client[];
  interactions: Interaction[];
  notes: Note[];
  companies: Company[];
  version: number;
}

// Define our database
class ClientCRMDatabase extends Dexie {
  clients!: Table<Client>;
  interactions!: Table<Interaction>;
  notes!: Table<Note>;
  companies!: Table<Company>;

  constructor() {
    super('ClientCRMDatabase');
    
    // Define tables and indexes
    this.version(1).stores({
      clients: '++id, name, email, company, status, updatedAt',
      interactions: '++id, clientId, type, date',
      notes: '++id, clientId, createdAt'
    });

    // Add version 2 with schema migration
    this.version(2).stores({
      interactions: '++id, *clientIds, type, date'
    }).upgrade(tx => {
      // Migrate existing interactions to the new schema
      return tx.table('interactions').toCollection().modify(interaction => {
        // Convert single clientId to array of clientIds
        if (interaction.clientId !== undefined && !interaction.clientIds) {
          interaction.clientIds = [interaction.clientId];
          // Remove the old clientId property
          delete interaction.clientId;
        }
      });
    });
    
    // Add version 3 with companies table and schema migration
    this.version(3).stores({
      clients: '++id, name, email, companyId, status, updatedAt',
      companies: '++id, name, industry, website'
    }).upgrade(async tx => {
      // Step 1: Extract unique companies from clients
      const clients = await tx.table('clients').toArray();
      const uniqueCompanyNames = [...new Set(
        clients
          .map(client => client.company)
          .filter((company): company is string => 
            company !== undefined && company !== null && company.trim() !== ''
          )
      )].sort();
      
      // Step 2: Create company records
      const companyMap = new Map<string, number>();
      
      for (const companyName of uniqueCompanyNames) {
        const now = new Date();
        const companyId = await tx.table('companies').add({
          name: companyName,
          createdAt: now,
          updatedAt: now
        });
        companyMap.set(companyName, typeof companyId === 'number' ? companyId : Number(companyId));
      }
      
      // Step 3: Update client records with companyId
      await tx.table('clients').toCollection().modify(client => {
        if (client.company) {
          client.companyId = companyMap.get(client.company);
          // Keep the company field for backward compatibility during migration
          // It will be removed in version 4
        }
      });
    });
  }
}

// Create and export a database instance
export const db = new ClientCRMDatabase();

// Add export and import methods to the database
export async function exportDatabase(): Promise<string> {
  // Export all tables
  const exportData: ExportData = {
    clients: await db.clients.toArray(),
    interactions: await db.interactions.toArray(),
    notes: await db.notes.toArray(),
    companies: await db.companies.toArray(),
    version: db.verno // Store the current schema version
  };
  
  return JSON.stringify(exportData, null, 2);
}

export async function importDatabase(data: string | ExportData): Promise<boolean> {
  const importData: ExportData = typeof data === 'string' ? JSON.parse(data) : data;
  
  // Use a transaction to ensure all operations succeed or fail together
  await db.transaction('rw', [db.clients, db.interactions, db.notes, db.companies], async () => {
    // Clear existing data
    await db.clients.clear();
    await db.interactions.clear();
    await db.notes.clear();
    await db.companies.clear();
    
    // Import companies first (to maintain foreign key relationships)
    if (importData.companies && Array.isArray(importData.companies)) {
      await db.companies.bulkAdd(importData.companies);
    }
    
    // Import clients
    if (importData.clients && Array.isArray(importData.clients)) {
      await db.clients.bulkAdd(importData.clients);
    }
    
    // Import interactions
    if (importData.interactions && Array.isArray(importData.interactions)) {
      await db.interactions.bulkAdd(importData.interactions);
    }
    
    // Import notes
    if (importData.notes && Array.isArray(importData.notes)) {
      await db.notes.bulkAdd(importData.notes);
    }
  });
  
  return true;
}



// Helper function to convert date strings to Date objects in retrieved records
function convertDates<T extends { createdAt?: string | Date; updatedAt?: string | Date; date?: string | Date }>(
  record: T
): T {
  const result = { ...record };
  
  if (result.createdAt && typeof result.createdAt === 'string') {
    result.createdAt = new Date(result.createdAt);
  }
  
  if (result.updatedAt && typeof result.updatedAt === 'string') {
    result.updatedAt = new Date(result.updatedAt);
  }
  
  if (result.date && typeof result.date === 'string') {
    result.date = new Date(result.date);
  }
  
  return result;
}

// Helper functions for database operations
export async function getAllClients(): Promise<Client[]> {
  const clients = await db.clients.toArray();
  return clients.map(client => convertDates(client));
}

export async function getClientsWithCompanyNames(): Promise<(Client & { companyName?: string })[]> {
  // Get all clients and companies
  const [clients, companies] = await Promise.all([
    db.clients.toArray(),
    db.companies.toArray()
  ]);
  
  // Create a map of company IDs to company names for quick lookup
  const companyMap = new Map(
    companies.map(company => [company.id, company.name])
  );
  
  // Enhance clients with company names
  return clients.map(client => {
    const enhancedClient = convertDates(client);
    
    // If client has a companyId, look up the company name
    if (client.companyId) {
      enhancedClient.companyName = companyMap.get(client.companyId);
    }
    
    return enhancedClient;
  });
}

export async function getRecentClientsWithCompanyNames(limit: number = 5): Promise<(Client & { companyName?: string })[]> {
  // Get all companies for mapping
  const companies = await db.companies.toArray();
  
  // Create a map of company IDs to company names for quick lookup
  const companyMap = new Map(
    companies.map(company => [company.id, company.name])
  );
  
  // Get recent clients
  const clients = await db.clients
    .orderBy('updatedAt')
    .reverse()
    .limit(limit)
    .toArray();
  
  // Enhance clients with company names
  return clients.map(client => {
    const enhancedClient = convertDates(client);
    
    // If client has a companyId, look up the company name
    if (client.companyId) {
      enhancedClient.companyName = companyMap.get(client.companyId);
    }
    
    return enhancedClient;
  });
}

export async function getRecentClients(limit: number = 5): Promise<Client[]> {
  const clients = await db.clients
    .orderBy('updatedAt')
    .reverse()
    .limit(limit)
    .toArray();
  
  return clients.map(client => convertDates(client));
}

export async function getClientById(id: number): Promise<Client | undefined> {
  const client = await db.clients.get(id);
  return client ? convertDates(client) : undefined;
}

export async function getUniqueCompanies(): Promise<string[]> {
  const companies = await db.companies.toArray();
  const companyNames = companies.map(company => company.name);
  
  // Return unique companies sorted alphabetically
  return [...new Set(companyNames)].sort();
}

export async function addClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date();
  
  // Ensure we're using the new schema with companyId
  const { company, ...clientData } = client as any;
  
  const id = await db.clients.add({
    ...clientData,
    createdAt: now,
    updatedAt: now
  });
  return typeof id === 'number' ? id : Number(id);
}

export async function addBulkClients(clients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number[]> {
  const now = new Date();
  const ids = await db.clients.bulkAdd(
    clients.map(client => ({
      ...client,
      createdAt: now,
      updatedAt: now
    })),
    { allKeys: true }
  );
  return ids.map(id => typeof id === 'number' ? id : Number(id));
}

export async function updateClient(id: number, client: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<number> {
  // Ensure we're using the new schema with companyId
  const { company, ...clientData } = client as any;
  
  return await db.clients.update(id, {
    ...clientData,
    updatedAt: new Date()
  });
}

export async function deleteClient(id: number): Promise<void> {
  // Delete client and all related notes
  // For interactions, remove this client from clientIds array
  await db.transaction('rw', [db.clients, db.interactions, db.notes], async () => {
    // Delete notes for this client
    await db.notes.where('clientId').equals(id).delete();
    
    // Update interactions to remove this client
    const clientInteractions = await db.interactions
      .where('clientIds')
      .equals(id)
      .toArray();
    
    // For each interaction that includes this client
    for (const interaction of clientInteractions) {
      const updatedClientIds = interaction.clientIds.filter(cId => cId !== id);
      
      if (updatedClientIds.length === 0) {
        // If this was the only client, delete the interaction
        await db.interactions.delete(interaction.id!);
      } else {
        // Otherwise, update the interaction with the filtered client IDs
        await db.interactions.update(interaction.id!, {
          clientIds: updatedClientIds
        });
      }
    }
    
    // Finally, delete the client
    await db.clients.delete(id);
  });
}

export async function getClientInteractions(clientId: number): Promise<Interaction[]> {
  // Get interactions where the clientId is in the clientIds array
  const interactions = await db.interactions
    .where('clientIds')
    .equals(clientId)
    .reverse()
    .sortBy('date');
  
  return interactions.map(interaction => convertDates(interaction));
}

export async function getAllInteractions(): Promise<Interaction[]> {
  const interactions = await db.interactions
    .orderBy('date')
    .reverse()
    .toArray();
  
  return interactions.map(interaction => convertDates(interaction));
}

export async function addInteraction(interaction: Omit<Interaction, 'id' | 'createdAt'>): Promise<number> {
  const id = await db.interactions.add({
    ...interaction,
    createdAt: new Date()
  });
  return typeof id === 'number' ? id : Number(id);
}

export async function updateInteraction(id: number, interaction: Partial<Omit<Interaction, 'id' | 'createdAt'>>): Promise<number> {
  return await db.interactions.update(id, interaction);
}

export async function removeInteraction(id: number): Promise<void> {
  await db.interactions.delete(id);
}

export async function getClientNotes(clientId: number): Promise<Note[]> {
  const notes = await db.notes
    .where('clientId')
    .equals(clientId)
    .reverse()
    .sortBy('createdAt');
  
  return notes.map(note => convertDates(note));
}

export async function addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date();
  const id = await db.notes.add({
    ...note,
    createdAt: now,
    updatedAt: now
  });
  return typeof id === 'number' ? id : Number(id);
}

export async function updateNote(id: number, content: string): Promise<number> {
  return await db.notes.update(id, {
    content,
    updatedAt: new Date()
  });
}

export async function deleteNote(id: number): Promise<void> {
  await db.notes.delete(id);
}

export async function addCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date();
  const id = await db.companies.add({
    ...company,
    createdAt: now,
    updatedAt: now
  });
  return typeof id === 'number' ? id : Number(id);
}

export async function addBulkCompanies(companies: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number[]> {
  const now = new Date();
  const ids = await db.companies.bulkAdd(
    companies.map(company => ({
      ...company,
      createdAt: now,
      updatedAt: now
    })),
    { allKeys: true }
  );
  return ids.map(id => typeof id === 'number' ? id : Number(id));
}

export async function getCompanyById(id: number): Promise<Company | undefined> {
  const company = await db.companies.get(id);
  return company ? convertDates(company) : undefined;
}

export async function updateCompany(id: number, company: Partial<Omit<Company, 'id' | 'createdAt'>>): Promise<number> {
  return await db.companies.update(id, {
    ...company,
    updatedAt: new Date()
  });
}

export async function deleteCompany(id: number): Promise<void> {
  await db.companies.delete(id);
}

export async function removeCompanyAndUpdateClients(id: number): Promise<number> {
  // Use a transaction to ensure all operations succeed or fail together
  return await db.transaction('rw', [db.companies, db.clients], async () => {
    // Find all clients associated with this company
    const clientsToUpdate = await db.clients
      .where('companyId')
      .equals(id)
      .toArray();
    
    // Update all these clients to remove the company association
    if (clientsToUpdate.length > 0) {
      const now = new Date();
      const updates = clientsToUpdate.map(client => ({
        ...client,
        companyId: undefined, // Remove company association
        updatedAt: now
      }));
      
      // Bulk update the clients
      await db.clients.bulkPut(updates);
    }
    
    // Delete the company
    await db.companies.delete(id);
    
    // Return the number of clients that were updated
    return clientsToUpdate.length;
  });
}

export async function getAllCompanies(): Promise<Company[]> {
  const companies = await db.companies
    .orderBy('name')
    .toArray();
  
  return companies.map(company => convertDates(company));
}

export async function getCompaniesWithClientCounts(): Promise<(Company & { clientCount: number })[]> {
  // Get all companies and clients
  const [companies, clients] = await Promise.all([
    db.companies.orderBy('name').toArray(),
    db.clients.toArray()
  ]);
  
  // Create a map to count clients per company
  const clientCountMap = new Map<number, number>();
  
  // Count clients for each company
  clients.forEach(client => {
    if (client.companyId) {
      const currentCount = clientCountMap.get(client.companyId) || 0;
      clientCountMap.set(client.companyId, currentCount + 1);
    }
  });
  
  // Enhance companies with client counts
  return companies.map(company => {
    const enhancedCompany = convertDates(company) as Company & { clientCount: number };
    enhancedCompany.clientCount = clientCountMap.get(company.id as number) || 0;
    return enhancedCompany;
  });
}

export async function getClientsByCompany(companyId: number): Promise<Client[]> {
  const clients = await db.clients
    .where('companyId')
    .equals(companyId)
    .toArray();
  
  return clients.map(client => convertDates(client));
}

export async function getCompanyWithClients(companyId: number): Promise<{ company: Company, clients: Client[] } | undefined> {
  const company = await getCompanyById(companyId);
  
  if (!company) {
    return undefined;
  }
  
  const clients = await getClientsByCompany(companyId);
  
  return {
    company,
    clients
  };
}
