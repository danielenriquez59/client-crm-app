import Dexie, { Table } from 'dexie';

// Define types for our database tables
export interface Client {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  status: 'active' | 'inactive' | 'prospect';
  createdAt: Date;
  updatedAt: Date;
}

export interface Interaction {
  id?: number;
  clientId: number;
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

// Define our database
class ClientCRMDatabase extends Dexie {
  clients!: Table<Client>;
  interactions!: Table<Interaction>;
  notes!: Table<Note>;

  constructor() {
    super('ClientCRMDatabase');
    
    // Define tables and indexes
    this.version(1).stores({
      clients: '++id, name, email, company, status, updatedAt',
      interactions: '++id, clientId, type, date',
      notes: '++id, clientId, createdAt'
    });
  }
}

// Create and export a database instance
export const db = new ClientCRMDatabase();

// Helper functions for database operations
export async function getAllClients(): Promise<Client[]> {
  return await db.clients.toArray();
}

export async function getRecentClients(limit: number = 5): Promise<Client[]> {
  return await db.clients
    .orderBy('updatedAt')
    .reverse()
    .limit(limit)
    .toArray();
}

export async function getClientById(id: number): Promise<Client | undefined> {
  return await db.clients.get(id);
}

export async function addClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date();
  return await db.clients.add({
    ...client,
    createdAt: now,
    updatedAt: now
  });
}

export async function updateClient(id: number, client: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<number> {
  return await db.clients.update(id, {
    ...client,
    updatedAt: new Date()
  });
}

export async function deleteClient(id: number): Promise<void> {
  // Delete client and all related interactions and notes
  await db.transaction('rw', [db.clients, db.interactions, db.notes], async () => {
    await db.notes.where('clientId').equals(id).delete();
    await db.interactions.where('clientId').equals(id).delete();
    await db.clients.delete(id);
  });
}

export async function getClientInteractions(clientId: number): Promise<Interaction[]> {
  return await db.interactions
    .where('clientId')
    .equals(clientId)
    .reverse()
    .sortBy('date');
}

export async function addInteraction(interaction: Omit<Interaction, 'id' | 'createdAt'>): Promise<number> {
  return await db.interactions.add({
    ...interaction,
    createdAt: new Date()
  });
}

export async function getClientNotes(clientId: number): Promise<Note[]> {
  return await db.notes
    .where('clientId')
    .equals(clientId)
    .reverse()
    .sortBy('createdAt');
}

export async function addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date();
  return await db.notes.add({
    ...note,
    createdAt: now,
    updatedAt: now
  });
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
