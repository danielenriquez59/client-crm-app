import Dexie, { Table } from 'dexie';

// Define types for our database tables
export interface Client {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  companyId?: number;
  company?: string; // Keep for backward compatibility
  location?: string;
  status: 'active' | 'inactive' | 'evaluation';
  createdAt: Date;
  updatedAt: Date;
}

export interface Interaction {
  id?: number;
  clientIds: number[]; 
  type: 'email' | 'call' | 'meeting' | 'other';
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

export async function getAllCompanies(): Promise<Company[]> {
  const companies = await db.companies
    .orderBy('name')
    .toArray();
  
  return companies.map(company => convertDates(company));
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
