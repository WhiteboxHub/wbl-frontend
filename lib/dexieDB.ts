
import Dexie, { Table } from "dexie";
import { liveQuery } from "dexie";

export interface Lead {
  id?: number; 
  full_name?: string;
  email: string;
  phone?: string;
  status?: string;
  workstatus?: string;
  address?: string;
  entry_date?: string;
  closed_date?: string;
  moved_to_candidate?: boolean;
  notes?: string;
  secondary_email?:String;
  secondary_phone?:String;
  massemail_subscribe?: boolean;
  massemail_unsubscribe?: boolean;
  massemail_email_sent?: boolean;
  synced?: boolean;
  lastSync?: string;
  isSynced?: boolean;
  _action?: "add" | "update" | "delete" | null;
}

// Dexie database
export class LeadsDB extends Dexie {
  leads!: Table<Lead, number>;

  constructor() {
    super("LeadsDatabase");
    this.version(1).stores({
      leads:
        "id, full_name, email, phone, status, workstatus, address, entry_date, closed_date, notes, secondary_email,secondary_phone, moved_to_candidate, massemail_unsubscribe, massemail_email_sent, synced, isSynced, _action",
    });
  }
}

// DB instance
export const db = new LeadsDB();

// Helper functions
export const LeadsHelper = {
  addLead: async (lead: Lead) => db.leads.add({ ...lead, synced: false }),
  updateLead: async (id: number, updates: Partial<Lead>) =>
    db.leads.update(id, { ...updates, synced: false }),
  deleteLead: async (id: number) => db.leads.delete(id),
  getAllLeads: async () => db.leads.toArray(),
  liveLeads: () => liveQuery(() => db.leads.toArray()),
};
