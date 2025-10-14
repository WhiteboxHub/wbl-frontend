import Dexie, { Table } from 'dexie';

export interface Lead {
  id: number;
  full_name?: string | null;
  email: string;
  phone?: string | null;
  workstatus?: string | null;
  status?: string | null;
  secondary_email?: string | null;
  secondary_phone?: string | null;
  address?: string | null;
  entry_date?: string | Date | null;
  closed_date?: string | Date | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  moved_to_candidate?: boolean;
  notes?: string | null;
  massemail_unsubscribe?: boolean;
  massemail_email_sent?: boolean;
  last_synced?: string;
  is_local?: boolean;
}

interface SyncQueueItem {
  id?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
}

class LeadsDatabase extends Dexie {
  leads!: Table<Lead>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('LeadsDB');
    this.version(2).stores({
      leads: 'id, email, status, workstatus, entry_date, is_local',
      syncQueue: '++id, action, timestamp'
    });
  }
}

class LeadsStorageService {
  private db: LeadsDatabase;

  constructor() {
    this.db = new LeadsDatabase();
  }

  async init() {
    return this.db;
  }

  // Lead operations
  async getAllLeads(): Promise<Lead[]> {
    return this.db.leads.toArray();
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.db.leads.get(id);
  }

  async addLead(lead: Omit<Lead, 'id'> & { id?: number }): Promise<number> {
    const leadWithDefaults: Lead = {
      ...lead,
      id: lead.id || Date.now(),
      entry_date: lead.entry_date || new Date().toISOString(),
      is_local: true,
      last_synced: null
    };

    const id = await this.db.leads.add(leadWithDefaults);
    
    await this.addToSyncQueue({
      action: 'CREATE',
      data: leadWithDefaults
    });

    return id;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<void> {
    const existing = await this.getLead(id);
    if (!existing) throw new Error('Lead not found');

    const updatedLead = {
      ...existing,
      ...updates,
      last_synced: null,
      is_local: true
    };

    await this.db.leads.update(id, updatedLead);
    
    await this.addToSyncQueue({
      action: 'UPDATE',
      data: updatedLead
    });
  }

  async deleteLead(id: number): Promise<void> {
    const lead = await this.getLead(id);
    if (lead) {
      await this.db.leads.delete(id);
      
      if (!lead.is_local) {
        await this.addToSyncQueue({
          action: 'DELETE',
          data: { id }
        });
      }
    }
  }

  // Sync operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>) {
    await this.db.syncQueue.add({
      ...item,
      timestamp: Date.now()
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return this.db.syncQueue.toArray();
  }

  async clearSyncQueue(ids: number[]) {
    await this.db.syncQueue.bulkDelete(ids);
  }

  // Bulk operations
  async bulkAddLeads(leads: Lead[]): Promise<void> {
    const leadsWithSyncInfo = leads.map(lead => ({
      ...lead,
      is_local: false,
      last_synced: new Date().toISOString()
    }));
    
    await this.db.leads.bulkPut(leadsWithSyncInfo);
  }

  async clearAllLeads(): Promise<void> {
    await this.db.leads.clear();
    await this.db.syncQueue.clear();
  }

  // Search operations
  async searchLeads(query: string, field?: string): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    
    const searchTerm = query.toLowerCase();
    return allLeads.filter(lead => {
      if (field) {
        const value = lead[field as keyof Lead];
        return value?.toString().toLowerCase().includes(searchTerm);
      }
      
      return (
        lead.full_name?.toLowerCase().includes(searchTerm) ||
        lead.email?.toLowerCase().includes(searchTerm) ||
        lead.phone?.toLowerCase().includes(searchTerm) ||
        lead.id.toString().includes(searchTerm)
      );
    });
  }

  // Filter operations
  async filterLeads(filters: {
    status?: string[];
    workstatus?: string[];
    dateRange?: { start: string; end: string };
  }): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    
    return allLeads.filter(lead => {
      if (filters.status && filters.status.length > 0) {
        if (!lead.status || !filters.status.includes(lead.status)) return false;
      }
      
      if (filters.workstatus && filters.workstatus.length > 0) {
        if (!lead.workstatus || !filters.workstatus.includes(lead.workstatus)) return false;
      }
      
      if (filters.dateRange && lead.entry_date) {
        const entryDate = new Date(lead.entry_date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        if (entryDate < startDate || entryDate > endDate) return false;
      }
      
      return true;
    });
  }

  // Advanced query methods
  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return this.db.leads.where('status').equals(status).toArray();
  }

  async getLeadsByWorkStatus(workstatus: string): Promise<Lead[]> {
    return this.db.leads.where('workstatus').equals(workstatus).toArray();
  }

  async getRecentLeads(limit: number = 50): Promise<Lead[]> {
    return this.db.leads
      .orderBy('entry_date')
      .reverse()
      .limit(limit)
      .toArray();
  }
}

export const leadsStorage = new LeadsStorageService();