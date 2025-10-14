import { leadsStorage, Lead } from './leadsStorage';
import { LocalStorageHelper, LEADS_KEYS } from './localStorageHelper';
import { toast } from "sonner";


export class SyncService {
  private apiEndpoint: string;
  private isOnline: boolean = true;

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint;
    this.setupOnlineListener();
  }

  private setupOnlineListener() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncPendingChanges();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  async syncPendingChanges(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const syncQueue = await leadsStorage.getSyncQueue();
      
      for (const item of syncQueue) {
        try {
          switch (item.action) {
            case 'CREATE':
              await this.syncCreateLead(item.data);
              break;
            case 'UPDATE':
              await this.syncUpdateLead(item.data);
              break;
            case 'DELETE':
              await this.syncDeleteLead(item.data.id);
              break;
          }
          
          if (item.id) {
            await leadsStorage.clearSyncQueue([item.id]);
          }
        } catch (error) {
          console.error(`Sync failed for ${item.action}:`, error);
        }
      }
    } catch (error) {
      console.error('Sync process failed:', error);
    }
  }

  private async syncCreateLead(lead: Lead) {
    const token = localStorage.getItem('token');
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lead),
    });

    if (!response.ok) throw new Error('Create sync failed');
    
    const savedLead = await response.json();
    
    await leadsStorage.updateLead(lead.id, {
      ...savedLead,
      is_local: false,
      last_synced: new Date().toISOString()
    });
  }

  private async syncUpdateLead(lead: Lead) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.apiEndpoint}/${lead.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lead),
    });

    if (!response.ok) throw new Error('Update sync failed');
    
    await leadsStorage.updateLead(lead.id, {
      last_synced: new Date().toISOString(),
      is_local: false
    });
  }

  private async syncDeleteLead(id: number) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.apiEndpoint}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Delete sync failed');
  }

  async fullSyncFromServer(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(this.apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch from server');

      const serverLeads = await response.json();
      await leadsStorage.clearAllLeads();
      await leadsStorage.bulkAddLeads(serverLeads);

      LocalStorageHelper.set('last_sync', new Date().toISOString());
    } catch (error) {
      console.error('Full sync failed:', error);
      throw error;
    }
  }

    async getLeadsWithFallback(search?: string, filters?: any): Promise<Lead[]> {
    if (this.isOnline) {
        try {
        const serverLeads = await this.fetchFromServer(search, filters);
        await leadsStorage.bulkAddLeads(serverLeads);
        return serverLeads;
        } catch (error) {
        console.warn('Server fetch failed, falling back to local storage');
        toast.warning('Server unreachable — loading cached leads');
        }
    }

    const localLeads = await leadsStorage.getAllLeads();
    if (localLeads.length === 0) {
        toast.error('No leads available (API and local storage empty)');
    }

    return localLeads;
    }
  private async fetchFromServer(search?: string, filters?: any): Promise<Lead[]> {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();

    if (search) {
      params.append('search', search);
    }
    
    if (filters?.status) {
      params.append('status', filters.status.join(','));
    }
    
    if (filters?.workstatus) {
      params.append('workstatus', filters.workstatus.join(','));
    }

    const url = `${this.apiEndpoint}?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Server fetch failed');
    
    return await response.json();
  }
}