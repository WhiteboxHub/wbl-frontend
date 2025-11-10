
// lib/dexieDB.ts
import Dexie, { Table } from "dexie";
import { liveQuery } from "dexie";
import api from "./api";



export interface Lead {
  id?: number;
  full_name?: string;
  email?: string;
  phone?: string;
  lastSync?: string;
  lastModified?: string;
  synced?: boolean;
  machineId?: string;
  _action?: "add" | "update" | "delete" | null;
  version?: number;
  [key: string]: any;
}

interface SchemaField {
  primary_key?: boolean;
  type?: string;
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

      const baseFields = Object.keys(fields);
      const syncFields = [
        "lastSync",
        "lastModified",
        "synced",
        "machineId",
        "_action",
        "version",
      ];


      const allFieldNames = [...new Set([...baseFields, ...syncFields])].filter(
        (f) => f !== pkField
      );


      stores[tableName] = `${pkField}, ${allFieldNames.join(", ")}`;
    }

    return stores;
  }

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
    return liveQuery(async () => {
      await this.ensureInitialized();
      return this.table("leads").toArray();
    });
  }



  async saveLead(lead: Lead): Promise<number> {
    this.ensureClientOrThrow();
    await this.ensureInitialized();


    if (lead.id && typeof lead.id === "string") {
      lead.id = parseInt(lead.id, 10);
    }

    const ts = nowISO();
    const withMeta: Lead = {
      ...lead,
      lastModified: ts,
      lastSync: lead.lastSync,
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


    return await this.table("leads").update(id, {
      lastModified: nowISO(),
      synced: false,
      _action: "delete",
      version: Dexie.minKey, 
      machineId: this._machineId,
    } as Partial<Lead>);
  }

 

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
   
              version:
                Math.max(local.version ?? 0, serverLead.version ?? 0) || 1,
              machineId: this._machineId,
            } as Partial<Lead>);
            syncedCount++;
          } else if (!local.synced) {
   
            conflictCount++;
          }
        } else {

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
        
          const { id, lastSync, lastModified, synced, _action, machineId: _m, version, ...payload } =
            lead;
          const res = await api.post("/leads", payload);
          const saved = res.data;

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
        
            await this.table("leads").update(lead.id, {
              _action: null,
              synced: true,
            } as Partial<Lead>);
            pushed++;
          }
        } else {
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


let _db: AppDB | null = null;

export const getDB = (): AppDB | null => {
  if (!isClient()) return null;
  if (!_db) _db = new AppDB();
  return _db;
};

export const appDB = getDB();


export const LeadsStore = {

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


if (isClient()) {
  (async () => {
    try {
      await appDB?.initializeFromBackend();
    } catch (e) {
      console.error("[Dexie] bootstrap init error:", e);
    }
  })();
}
