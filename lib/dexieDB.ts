

// // lib/dexieDB.ts
// import Dexie, { Table } from "dexie";
// import api from "./api";

// // Enhanced TypeScript interface for Lead with sync fields
// export interface Lead {
//   id?: number;
//   full_name?: string;
//   email?: string;
//   phone?: string;
  
//   // Sync fields for multi-system support
//   lastSync?: string;
//   lastModified?: string;
//   synced?: boolean;
//   machineId?: string;
//   _action?: 'add' | 'update' | 'delete' | null;
  
//   [key: string]: any;
// }





// // Interface for schema fields
// interface SchemaField {
//   primary_key?: boolean;
//   type?: string;
//   // Add other possible field properties here
// }

// interface TableSchema {
//   [fieldName: string]: SchemaField;
// }

// interface BackendSchema {
//   version: string;
//   tables: {
//     [tableName: string]: TableSchema;
//   };
// }

// class AppDB extends Dexie {
//   leads!: Table<Lead, number>;

//   constructor() {
//     super("WhiteboxDB");
//   }

//   // Initialize schema dynamically from backend
//   async initializeFromBackend() {
//     try {
//       const { data } = await api.get("/schema");
//       const { version, tables } = data as BackendSchema;

//       const stores: Record<string, string> = {};

//       for (const [tableName, fields] of Object.entries(tables)) {
//         const pkField =
//           Object.entries(fields).find(
//             ([, meta]) => meta.primary_key
//           )?.[0] || "id";

//         // Get all field names including sync fields
//         const baseFields = Object.keys(fields);
//         const syncFields = ['lastSync', 'lastModified', 'synced', 'machineId', '_action'];
//         const allFieldNames = [...baseFields, ...syncFields].filter(f => f !== pkField);

//         stores[tableName] = `${pkField}, ${allFieldNames.join(", ")}`;
//       }

//       console.log("[Dexie] Dynamic stores with sync fields:", stores);

//       this.version(1).stores(stores);

//       localStorage.setItem("schema_version", version);
//       return true;
//     } catch (err) {
//       console.error("[Dexie] Failed to load schema from backend:", err);
//       return false;
//     }
//   }

//   // ---- CRUD Operations ----

//   async loadLeads(): Promise<Lead[]> {
//     return await this.table("leads").toArray();
//   }

//   async saveLead(lead: Lead): Promise<number> {
//     // Ensure ID is numeric if present
//     if (lead.id && typeof lead.id === "string") {
//       lead.id = parseInt(lead.id, 10);
//     }
    
//     // Add sync metadata
//     const now = new Date().toISOString();
//     const leadWithSync = {
//       ...lead,
//       lastSync: now,
//       lastModified: now,
//       synced: false,
//       _action: 'add' as const
//     };
    
//     const id = await this.table("leads").add(leadWithSync);
//     return id as number;
//   }

//   async updateLead(id: number, data: Partial<Lead>) {
//     const updateData = {
//       ...data,
//       lastModified: new Date().toISOString(),
//       synced: false,
//       _action: 'update' as const
//     };
//     return await this.table("leads").update(id, updateData);
//   }

//   async deleteLead(id: number) {
//     // Instead of immediate deletion, mark for deletion
//     return await this.table("leads").update(id, {
//       lastModified: new Date().toISOString(),
//       synced: false,
//       _action: 'delete' as const
//     });
//   }

//   // Get unsynced leads for synchronization
//   async getUnsyncedLeads(): Promise<Lead[]> {
//     const allLeads = await this.loadLeads();
//     return allLeads.filter(lead => 
//       !lead.synced || lead._action
//     );
//   }

//   // Mark lead as synced
//   async markLeadAsSynced(id: number, serverData?: Partial<Lead>) {
//     const updateData: Partial<Lead> = {
//       lastSync: new Date().toISOString(),
//       synced: true,
//       _action: null
//     };

//     // If server data is provided, update with server values
//     if (serverData) {
//       Object.assign(updateData, serverData);
//     }

//     return await this.table("leads").update(id, updateData);
//   }

//   // Get last sync timestamp
//   async getLastSyncTime(): Promise<string> {
//     const leads = await this.loadLeads();
//     if (leads.length === 0) {
//       return '1970-01-01T00:00:00.000Z';
//     }
    
//     const lastSync = Math.max(...leads.map(lead => 
//       new Date(lead.lastSync || 0).getTime()
//     ));
    
//     return new Date(lastSync).toISOString();
//   }

//   // Get latest modification timestamp
//   async getLastModifiedTime(): Promise<string> {
//     const leads = await this.loadLeads();
//     if (leads.length === 0) {
//       return '1970-01-01T00:00:00.000Z';
//     }
    
//     const lastModified = Math.max(...leads.map(lead => 
//       new Date(lead.lastModified || lead.entry_date || 0).getTime()
//     ));
    
//     return new Date(lastModified).toISOString();
//   }

//   // Sync with server (incremental - for multi-system support)
//   async syncWithServer(forceRefresh: boolean = false): Promise<{ synced: number; conflicts: number }> {
//     try {
//       let url = "/leads";
//       const params = new URLSearchParams();
      
//       if (!forceRefresh) {
//         const lastSync = await this.getLastSyncTime();
//         params.append('modified_after', lastSync);
//       }
      
//       if (params.toString()) {
//         url += `?${params.toString()}`;
//       }

//       const { data } = await api.get(url);
//       if (!Array.isArray(data)) {
//         console.warn("[Dexie] Server returned invalid leads data:", data);
//         return { synced: 0, conflicts: 0 };
//       }

//       const now = new Date().toISOString();
//       let syncedCount = 0;
//       let conflictCount = 0;

//       // Process server data
//       for (const serverLead of data) {
//         if (!serverLead.id) continue;
        
//         // Normalize ID
//         const normalizedLead = {
//           ...serverLead,
//           id: typeof serverLead.id === "string" ? parseInt(serverLead.id, 10) : serverLead.id,
//         };

//         const existingLead = await this.table("leads").get(normalizedLead.id);
        
//         if (existingLead) {
//           // Conflict resolution
//           const serverTime = new Date(normalizedLead.lastModified || normalizedLead.entry_date || 0).getTime();
//           const localTime = new Date(existingLead.lastModified || existingLead.entry_date || 0).getTime();
          
//           if (serverTime > localTime || existingLead.synced) {
//             // Server version is newer or local version is already synced
//             await this.table("leads").update(normalizedLead.id, {
//               ...normalizedLead,
//               lastSync: now,
//               synced: true,
//               lastModified: serverTime > localTime ? 
//                 (normalizedLead.lastModified || normalizedLead.entry_date) : 
//                 existingLead.lastModified,
//               _action: null
//             });
//             syncedCount++;
//           } else if (!existingLead.synced) {
//             // Local version is newer and not synced - keep local version
//             conflictCount++;
//           }
//         } else {
//           // New lead from server
//           await this.table("leads").add({
//             ...normalizedLead,
//             lastSync: now,
//             synced: true,
//             lastModified: normalizedLead.lastModified || normalizedLead.entry_date || now,
//             _action: null
//           });
//           syncedCount++;
//         }
//       }

//       console.log(`[Dexie] Sync completed: ${syncedCount} synced, ${conflictCount} conflicts`);
//       return { synced: syncedCount, conflicts: conflictCount };
      
//     } catch (err) {
//       console.error("[Dexie] Sync failed:", err);
//       throw err;
//     }
//   }

//   // Push local changes to server
//   async pushLocalChangesToServer(machineId: string): Promise<{ pushed: number; failed: number }> {
//     const unsyncedLeads = await this.getUnsyncedLeads();
//     let pushedCount = 0;
//     let failedCount = 0;

//     for (const lead of unsyncedLeads) {
//       try {
//         if (lead._action === 'add' || !lead.id) {
//           // New lead - create on server
//           const { id, lastSync, lastModified, synced, _action, machineId: mid, ...payload } = lead;
//           const response = await api.post("/leads", payload);
//           const savedLead = response.data;
          
//           // Update local record with server ID and mark as synced
//           await this.table("leads").update(lead.id!, {
//             ...savedLead,
//             lastSync: new Date().toISOString(),
//             lastModified: new Date().toISOString(),
//             synced: true,
//             _action: null,
//             machineId: machineId
//           } as any);
//           pushedCount++;
          
//         } else if (lead._action === 'update') {
//           // Updated lead - update on server
//           const { id, lastSync, lastModified, synced, _action, machineId: leadMachineId, ...payload } = lead;
//           await api.put(`/leads/${lead.id}`, payload);
          
//           // Mark as synced
//           await this.table("leads").update(lead.id, {
//             lastSync: new Date().toISOString(),
//             lastModified: new Date().toISOString(),
//             synced: true,
//             _action: null
//           } as any);
//           pushedCount++;
          
//         } else if (lead._action === 'delete' && lead.id) {
//           // Deleted lead - delete from server
//           try {
//             await api.delete(`/leads/${lead.id}`);
//             await this.table("leads").delete(lead.id);
//             pushedCount++;
//           } catch (e) {
//             // If delete fails on server, keep local record but remove delete marker
//             await this.table("leads").update(lead.id, {
//               _action: null,
//               synced: true
//             } as any);
//             pushedCount++;
//           }
//         }
//       } catch (error) {
//         console.error(`[Dexie] Failed to sync lead ${lead.id}:`, error);
//         failedCount++;
//       }
//     }

//     console.log(`[Dexie] Push completed: ${pushedCount} pushed, ${failedCount} failed`);
//     return { pushed: pushedCount, failed: failedCount };
//   }

//   // Full synchronization (pull + push)
//   async fullSync(machineId: string, forceRefresh: boolean = false): Promise<{
//     pulled: { synced: number; conflicts: number };
//     pushed: { pushed: number; failed: number };
//   }> {
//     try {
//       // First push local changes
//       const pushResult = await this.pushLocalChangesToServer(machineId);
      
//       // Then pull server changes
//       const pullResult = await this.syncWithServer(forceRefresh);
      
//       return {
//         pulled: pullResult,
//         pushed: pushResult
//       };
//     } catch (error) {
//       console.error("[Dexie] Full sync failed:", error);
//       throw error;
//     }
//   }

//   // Clean up deleted records (after successful server sync)
//   async cleanupDeletedRecords(): Promise<number> {
//     const deletedLeads = await this.table("leads")
//       .where("_action")
//       .equals("delete")
//       .and(lead => lead.synced)
//       .toArray();
    
//     let cleanedCount = 0;
    
//     for (const lead of deletedLeads) {
//       if (lead.id) {
//         await this.table("leads").delete(lead.id);
//         cleanedCount++;
//       }
//     }
    
//     console.log(`[Dexie] Cleaned up ${cleanedCount} deleted records`);
//     return cleanedCount;
//   }

//   // Get sync status
//   async getSyncStatus(): Promise<{
//     total: number;
//     synced: number;
//     unsynced: number;
//     pendingAdd: number;
//     pendingUpdate: number;
//     pendingDelete: number;
//   }> {
//     const allLeads = await this.loadLeads();
//     const synced = allLeads.filter(lead => lead.synced);
//     const unsynced = allLeads.filter(lead => !lead.synced || lead._action);
    
//     return {
//       total: allLeads.length,
//       synced: synced.length,
//       unsynced: unsynced.length,
//       pendingAdd: allLeads.filter(lead => lead._action === 'add').length,
//       pendingUpdate: allLeads.filter(lead => lead._action === 'update').length,
//       pendingDelete: allLeads.filter(lead => lead._action === 'delete').length,
//     };
//   }
// }

// // Singleton instance
// export const appDB = new AppDB();

// // Initialize DB once
// (async () => {
//   await appDB.initializeFromBackend();
// })();












// lib/dexieDB.ts
import Dexie, { Table } from "dexie";
import { liveQuery } from "dexie";
import api from "./api";



export interface Lead {
  id?: number;
  full_name?: string;
  email?: string;
  phone?: string;
  // Sync/meta fields
  lastSync?: string;
  lastModified?: string;
  synced?: boolean;
  machineId?: string;
  _action?: "add" | "update" | "delete" | null;
  version?: number;
  // backend may include extra fields
  [key: string]: any;
}

interface SchemaField {
  primary_key?: boolean;
  type?: string;
  // room for future props
}

interface TableSchema {
  [fieldName: string]: SchemaField;
}

interface BackendSchema {
  version: string;
  tables: {
    [tableName: string]: TableSchema;
  };
}

/** ---------- Utils ---------- */

const isClient = () => typeof window !== "undefined";

const getMachineId = (): string => {
  if (!isClient()) return "server-temp-id";
  let mid = localStorage.getItem("machineId");
  if (!mid) {
    mid = `machine_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("machineId", mid);
  }
  return mid;
};

const nowISO = () => new Date().toISOString();

/** ---------- Dexie DB ---------- */

class AppDB extends Dexie {
  // Tables (populated after dynamic init)
  leads!: Table<Lead, number>;

  private _initialized = false;
  private _machineId = getMachineId();
  private _schemaVersionKey = "schema_version";

  constructor() {
    super("WhiteboxDB");
  }

  private ensureClientOrThrow() {
    if (!isClient()) {
      throw new Error("[Dexie] Attempted DB use on server. Guard your calls with `isClient()`.");
    }
  }

  private buildStoresFromBackendSchema(backend: BackendSchema) {
    const stores: Record<string, string> = {};

    for (const [tableName, fields] of Object.entries(backend.tables)) {
      const pkField =
        Object.entries(fields).find(([, meta]) => meta.primary_key)?.[0] || "id";

      // base fields from backend + required sync/meta fields
      const baseFields = Object.keys(fields);
      const syncFields = [
        "lastSync",
        "lastModified",
        "synced",
        "machineId",
        "_action",
        "version",
      ];

      // Dexie index string: "primaryKey, idx1, idx2, ..."
      const allFieldNames = [...new Set([...baseFields, ...syncFields])].filter(
        (f) => f !== pkField
      );

      // No "++" autoincrement by default since backend owns IDs
      stores[tableName] = `${pkField}, ${allFieldNames.join(", ")}`;
    }

    return stores;
  }

  /** Initialize schema dynamically from backend (idempotent) */
  async initializeFromBackend(): Promise<boolean> {
    if (!isClient()) return false; 
    if (this._initialized) return true;

    try {
      const { data } = await api.get("/schema");
      const backend = data as BackendSchema;

      const stores = this.buildStoresFromBackendSchema(backend);
      this.version(1).stores(stores);
      localStorage.setItem(this._schemaVersionKey, backend.version);
      this._initialized = true;
      console.log("[Dexie] Initialized with dynamic stores:", stores);
      return true;
    } catch (err) {
      console.error("[Dexie] Failed to load schema from backend:", err);
      const fallback = {
        leads:
          "id, full_name, email, phone, lastSync, lastModified, synced, machineId, _action, version",
      };
      this.version(1).stores(fallback);
      this._initialized = true;
      console.warn("[Dexie] Using fallback store:", fallback);
      return false;
    }
  }

  private async ensureInitialized() {
    if (!this._initialized) {
      await this.initializeFromBackend();
    }
  }



  async loadLeads(): Promise<Lead[]> {
    await this.ensureInitialized();
    return await this.table("leads").toArray();
  }

  liveLeads() {
    // observable of leads for UI auto-refresh without GET calls
    return liveQuery(async () => {
      await this.ensureInitialized();
      return this.table("leads").toArray();
    });
  }

  /** ---------- WRITE APIs (local first; mark unsynced) ---------- */

  async saveLead(lead: Lead): Promise<number> {
    this.ensureClientOrThrow();
    await this.ensureInitialized();

    // Normalize id if string (but typically backend sets id on push)
    if (lead.id && typeof lead.id === "string") {
      lead.id = parseInt(lead.id, 10);
    }

    const ts = nowISO();
    const withMeta: Lead = {
      ...lead,
      lastModified: ts,
      lastSync: lead.lastSync, // not synced yet
      synced: false,
      _action: "add",
      version: (lead.version ?? 0) + 1,
      machineId: this._machineId,
    };

    const id = await this.table("leads").add(withMeta);
    return id as number;
  }

  async updateLead(id: number, data: Partial<Lead>) {
    this.ensureClientOrThrow();
    await this.ensureInitialized();

    const existing = await this.table("leads").get(id);
    const ts = nowISO();

    const nextVersion = (existing?.version ?? 0) + 1;
    const updateData: Partial<Lead> = {
      ...data,
      lastModified: ts,
      // keep lastSync until server confirms
      synced: false,
      _action: "update",
      version: nextVersion,
      machineId: this._machineId,
    };

    return await this.table("leads").update(id, updateData);
  }

  async deleteLead(id: number) {
    this.ensureClientOrThrow();
    await this.ensureInitialized();

    // soft-delete + queued for push
    return await this.table("leads").update(id, {
      lastModified: nowISO(),
      synced: false,
      _action: "delete",
      version: Dexie.minKey, // optional: mark as special; server will remove
      machineId: this._machineId,
    } as Partial<Lead>);
  }

  /** ---------- Sync Helpers ---------- */

  async getUnsyncedLeads(): Promise<Lead[]> {
    await this.ensureInitialized();
    const all = await this.loadLeads();
    return all.filter((l) => !l.synced || !!l._action);
  }

  async markLeadAsSynced(id: number, serverData?: Partial<Lead>) {
    await this.ensureInitialized();

    const updateData: Partial<Lead> = {
      lastSync: nowISO(),
      synced: true,
      _action: null,
    };

    if (serverData) Object.assign(updateData, serverData);

    return await this.table("leads").update(id, updateData);
  }

  async getLastSyncTime(): Promise<string> {
    await this.ensureInitialized();
    const leads = await this.loadLeads();
    if (leads.length === 0) return "1970-01-01T00:00:00.000Z";

    const last = Math.max(
      ...leads.map((l) => new Date(l.lastSync || 0).getTime())
    );
    return new Date(last).toISOString();
  }

  async getLastModifiedTime(): Promise<string> {
    await this.ensureInitialized();
    const leads = await this.loadLeads();
    if (leads.length === 0) return "1970-01-01T00:00:00.000Z";

    const last = Math.max(
      ...leads.map((l) =>
        new Date(l.lastModified || (l as any).entry_date || 0).getTime()
      )
    );
    return new Date(last).toISOString();
  }

  /** ---------- Pull: fetch only modified leads since lastSync ---------- */
  async syncWithServer(
    forceRefresh: boolean = false
  ): Promise<{ synced: number; conflicts: number }> {
    this.ensureClientOrThrow();
    await this.ensureInitialized();

    let url = "/leads";
    const params = new URLSearchParams();

    if (!forceRefresh) {
      const lastSync = await this.getLastSyncTime();
      params.append("modified_after", lastSync);
    }
    if (params.toString()) url += `?${params.toString()}`;

    try {
      const { data } = await api.get(url);
      if (!Array.isArray(data)) {
        console.warn("[Dexie] Invalid leads payload from server:", data);
        return { synced: 0, conflicts: 0 };
      }

      const ts = nowISO();
      let syncedCount = 0;
      let conflictCount = 0;

      for (const serverLeadRaw of data) {
        if (!serverLeadRaw) continue;
        const serverLead: Lead = { ...serverLeadRaw };

        if (!serverLead.id) continue;
        if (typeof serverLead.id === "string") {
          serverLead.id = parseInt(serverLead.id, 10);
        }

        const local = await this.table("leads").get(serverLead.id);

        const serverTime = new Date(
          serverLead.lastModified || (serverLead as any).entry_date || 0
        ).getTime();
        const localTime = new Date(
          local?.lastModified || (local as any)?.entry_date || 0
        ).getTime();

        if (local) {
          // If server newer or local already synced → accept server
          if (serverTime > localTime || local.synced) {
            await this.table("leads").update(serverLead.id, {
              ...serverLead,
              lastSync: ts,
              synced: true,
              lastModified:
                serverTime > localTime
                  ? serverLead.lastModified || (serverLead as any).entry_date
                  : local.lastModified,
              _action: null,
              // bump version to be >= server (optional)
              version:
                Math.max(local.version ?? 0, serverLead.version ?? 0) || 1,
              machineId: this._machineId,
            } as Partial<Lead>);
            syncedCount++;
          } else if (!local.synced) {
            // Local newer & not synced → keep local (conflict)
            conflictCount++;
          }
        } else {
          // New to local
          await this.table("leads").add({
            ...serverLead,
            lastSync: ts,
            synced: true,
            lastModified:
              serverLead.lastModified || (serverLead as any).entry_date || ts,
            _action: null,
            version: serverLead.version ?? 1,
            machineId: this._machineId,
          } as Lead);
          syncedCount++;
        }
      }

      console.log(
        `[Dexie] Pull sync: ${syncedCount} applied, ${conflictCount} conflicts`
      );
      return { synced: syncedCount, conflicts: conflictCount };
    } catch (err) {
      console.error("[Dexie] Pull sync failed:", err);
      throw err;
    }
  }

  /** ---------- Push: send local changes only ---------- */
  async pushLocalChangesToServer(machineId?: string): Promise<{
    pushed: number;
    failed: number;
  }> {
    this.ensureClientOrThrow();
    await this.ensureInitialized();

    const mid = machineId || this._machineId;
    const unsynced = await this.getUnsyncedLeads();

    let pushed = 0;
    let failed = 0;

    for (const lead of unsynced) {
      try {
        if (lead._action === "add" || !lead.id) {
          // Create on server
          const { id, lastSync, lastModified, synced, _action, machineId: _m, version, ...payload } =
            lead;
          const res = await api.post("/leads", payload);
          const saved = res.data;

          // Tie local row to server state (keep current local id row)
          await this.table("leads").update(lead.id as number, {
            ...saved,
            lastSync: nowISO(),
            lastModified: nowISO(),
            synced: true,
            _action: null,
            version: (lead.version ?? 0) + 1,
            machineId: mid,
          } as Partial<Lead>);
          pushed++;
        } else if (lead._action === "update") {
          const { id, lastSync, lastModified, synced, _action, machineId: _m, ...payload } =
            lead;
          await api.put(`/leads/${lead.id}`, payload);

          await this.table("leads").update(lead.id as number, {
            lastSync: nowISO(),
            lastModified: nowISO(),
            synced: true,
            _action: null,
            version: (lead.version ?? 0) + 1,
          } as Partial<Lead>);
          pushed++;
        } else if (lead._action === "delete" && lead.id) {
          try {
            await api.delete(`/leads/${lead.id}`);
            await this.table("leads").delete(lead.id);
            pushed++;
          } catch (e) {
            // If server delete fails, clear delete marker but mark synced to avoid loops
            await this.table("leads").update(lead.id, {
              _action: null,
              synced: true,
            } as Partial<Lead>);
            pushed++;
          }
        } else {
          // No explicit action but unsynced: try a PUT as idempotent update
          if (lead.id) {
            const { id, lastSync, lastModified, synced, _action, machineId: _m, ...payload } =
              lead;
            await api.put(`/leads/${lead.id}`, payload);
            await this.table("leads").update(lead.id, {
              lastSync: nowISO(),
              synced: true,
              _action: null,
              version: (lead.version ?? 0) + 1,
            } as Partial<Lead>);
            pushed++;
          }
        }
      } catch (err) {
        console.error(`[Dexie] Push failed for lead ${lead.id}:`, err);
        failed++;
      }
    }

    console.log(`[Dexie] Push complete: pushed=${pushed}, failed=${failed}`);
    return { pushed, failed };
  }

  /** ---------- Full Sync: push then pull ---------- */
  async fullSync(
    machineId?: string,
    forceRefresh: boolean = false
  ): Promise<{
    pulled: { synced: number; conflicts: number };
    pushed: { pushed: number; failed: number };
  }> {
    this.ensureClientOrThrow();
    await this.ensureInitialized();

    const pushed = await this.pushLocalChangesToServer(machineId);
    const pulled = await this.syncWithServer(forceRefresh);

    return { pushed, pulled };
  }

  /** Remove soft-deleted rows that server has acknowledged */
  async cleanupDeletedRecords(): Promise<number> {
    await this.ensureInitialized();

    const deleteds = await this.table("leads")
      .where("_action")
      .equals("delete")
      .and((l) => !!l.synced)
      .toArray();

    let n = 0;
    for (const l of deleteds) {
      if (l.id) {
        await this.table("leads").delete(l.id);
        n++;
      }
    }
    console.log(`[Dexie] Cleanup removed ${n} rows`);
    return n;
  }

  async getSyncStatus(): Promise<{
    total: number;
    synced: number;
    unsynced: number;
    pendingAdd: number;
    pendingUpdate: number;
    pendingDelete: number;
  }> {
    await this.ensureInitialized();
    const all = await this.loadLeads();
    const synced = all.filter((l) => l.synced);
    const unsynced = all.filter((l) => !l.synced || !!l._action);
    return {
      total: all.length,
      synced: synced.length,
      unsynced: unsynced.length,
      pendingAdd: all.filter((l) => l._action === "add").length,
      pendingUpdate: all.filter((l) => l._action === "update").length,
      pendingDelete: all.filter((l) => l._action === "delete").length,
    };
  }
}

/** ---------- Singleton / SSR-safe exports ---------- */

// Avoid constructing Dexie on server
let _db: AppDB | null = null;

export const getDB = (): AppDB | null => {
  if (!isClient()) return null;
  if (!_db) _db = new AppDB();
  return _db;
};

export const appDB = getDB();

/** Optional helper facade so your UI never calls API directly */
export const LeadsStore = {
  // READ
  load: async (): Promise<Lead[]> => {
    const db = getDB();
    if (!db) return [];
    return db.loadLeads();
  },
  live: () => {
    const db = getDB();
    if (!db) return liveQuery(async () => [] as Lead[]);
    return db.liveLeads();
  },

  // WRITE (local only)
  add: async (lead: Lead) => {
    const db = getDB();
    if (!db) return -1;
    return db.saveLead(lead);
  },
  update: async (id: number, data: Partial<Lead>) => {
    const db = getDB();
    if (!db) return 0;
    return db.updateLead(id, data);
  },
  remove: async (id: number) => {
    const db = getDB();
    if (!db) return 0;
    return db.deleteLead(id);
  },

  // SYNC
  push: async () => {
    const db = getDB();
    if (!db) return { pushed: 0, failed: 0 };
    return db.pushLocalChangesToServer();
  },
  pull: async (forceRefresh = false) => {
    const db = getDB();
    if (!db) return { synced: 0, conflicts: 0 };
    return db.syncWithServer(forceRefresh);
  },
  fullSync: async (forceRefresh = false) => {
    const db = getDB();
    if (!db)
      return {
        pushed: { pushed: 0, failed: 0 },
        pulled: { synced: 0, conflicts: 0 },
      };
    return db.fullSync(undefined, forceRefresh);
  },
  cleanup: async () => {
    const db = getDB();
    if (!db) return 0;
    return db.cleanupDeletedRecords();
  },
  status: async () => {
    const db = getDB();
    if (!db)
      return {
        total: 0,
        synced: 0,
        unsynced: 0,
        pendingAdd: 0,
        pendingUpdate: 0,
        pendingDelete: 0,
      };
    return db.getSyncStatus();
  },
};

/** ---------- Client-side bootstrap ---------- */
if (isClient()) {
  (async () => {
    try {
      await appDB?.initializeFromBackend();
    } catch (e) {
      console.error("[Dexie] bootstrap init error:", e);
    }
  })();
}
