// Local Storage helper for small, frequently accessed data
export class LocalStorageHelper {
  private static prefix = 'leads_';

  static set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(`${this.prefix}${key}`, serializedValue);
    } catch (error) {
      console.warn('LocalStorage set failed:', error);
    }
  }

  static get<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return defaultValue || null;
    
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      if (!item) return defaultValue || null;
      
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn('LocalStorage get failed:', error);
      return defaultValue || null;
    }
  }

  static remove(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      console.warn('LocalStorage remove failed:', error);
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('LocalStorage clear failed:', error);
    }
  }
}

// Specific keys for leads management with proper typing
export const LEADS_KEYS = {
  SEARCH_HISTORY: 'search_history',
  COLUMN_STATE: 'column_state',
  FILTER_STATE: 'filter_state',
  SORT_STATE: 'sort_state',
  RECENT_LEADS: 'recent_leads',
  OFFLINE_MODE: 'offline_mode'
} as const;

// Type definitions for stored data
export interface SortModel {
  colId: string;
  sort: 'asc' | 'desc';
}

export interface FilterState {
  status: string[];
  workstatus: string[];
}