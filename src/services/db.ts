import {
  User,
  YancMember,
  CreditLedgerEntry,
  InvestorMentorProfile,
  Session,
  WithdrawalRequest,
  AdvisoryBoardRequest,
  AdvisorSwapRequest,
  AdvisorApplication,
  Notification,
  Broadcast,
  AdminUser,
  InvestorTier
} from '../types';

import {
  SEED_USERS,
  SEED_YANC_MEMBERS,
  SEED_CREDITS_LEDGER,
  SEED_INVESTOR_MENTOR_PROFILES,
  SEED_SESSIONS,
  SEED_WITHDRAWAL_REQUESTS,
  SEED_ADVISORY_BOARDS,
  SEED_ADVISOR_SWAP_REQUESTS,
  SEED_ADVISOR_APPLICATIONS,
  SEED_NOTIFICATIONS,
  SEED_BROADCASTS,
  SEED_ADMIN_USERS
} from '../data/seedData';

type CollectionName = 
  | 'users'
  | 'yancMembers'
  | 'creditsLedger'
  | 'investorMentorProfiles'
  | 'sessions'
  | 'withdrawalRequests'
  | 'advisoryBoardRequests'
  | 'advisorSwapRequests'
  | 'advisorApplications'
  | 'notifications'
  | 'broadcasts'
  | 'adminUsers';

type Subscriber<T> = (data: T[]) => void;

class ReactiveDatabase {
  private memoryCache: Map<CollectionName, any[]> = new Map();
  private subscribers: Map<CollectionName, Set<Subscriber<any>>> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  public initialize(forceReset = false) {
    if (this.isInitialized && !forceReset) return;

    const storagePrefix = 'yanc_connect_db_';
    
    // Check if data already exists in localStorage
    const hasData = localStorage.getItem(storagePrefix + 'initialized');

    if (!hasData || forceReset) {
      // Seed all collections
      this.memoryCache.set('users', [...SEED_USERS]);
      this.memoryCache.set('yancMembers', [...SEED_YANC_MEMBERS]);
      this.memoryCache.set('creditsLedger', [...SEED_CREDITS_LEDGER]);
      this.memoryCache.set('investorMentorProfiles', [...SEED_INVESTOR_MENTOR_PROFILES]);
      this.memoryCache.set('sessions', [...SEED_SESSIONS]);
      this.memoryCache.set('withdrawalRequests', [...SEED_WITHDRAWAL_REQUESTS]);
      this.memoryCache.set('advisoryBoardRequests', [...SEED_ADVISORY_BOARDS]);
      this.memoryCache.set('advisorSwapRequests', [...SEED_ADVISOR_SWAP_REQUESTS]);
      this.memoryCache.set('advisorApplications', [...SEED_ADVISOR_APPLICATIONS]);
      this.memoryCache.set('notifications', [...SEED_NOTIFICATIONS]);
      this.memoryCache.set('broadcasts', [...SEED_BROADCASTS]);
      this.memoryCache.set('adminUsers', [...SEED_ADMIN_USERS]);

      this.persistAll();
      localStorage.setItem(storagePrefix + 'initialized', 'true');
    } else {
      // Load from localStorage
      const collections: CollectionName[] = [
        'users',
        'yancMembers',
        'creditsLedger',
        'investorMentorProfiles',
        'sessions',
        'withdrawalRequests',
        'advisoryBoardRequests',
        'advisorSwapRequests',
        'advisorApplications',
        'notifications',
        'broadcasts',
        'adminUsers'
      ];

      for (const col of collections) {
        try {
          const raw = localStorage.getItem(storagePrefix + col);
          if (raw) {
            this.memoryCache.set(col, JSON.parse(raw));
          } else {
            this.memoryCache.set(col, []);
          }
        } catch {
          this.memoryCache.set(col, []);
        }
      }
    }

    this.isInitialized = true;
    this.notifyAll();
  }

  private persist(col: CollectionName) {
    try {
      const data = this.memoryCache.get(col) || [];
      localStorage.setItem(`yanc_connect_db_${col}`, JSON.stringify(data));
    } catch (e) {
      console.error('Storage quota exceeded or error persisting', e);
    }
  }

  private persistAll() {
    const keys = Array.from(this.memoryCache.keys());
    for (const key of keys) {
      this.persist(key);
    }
  }

  public get<T>(col: CollectionName): T[] {
    const items = this.memoryCache.get(col) || [];
    
    // Auto-calculate investor tier / mentor cap dynamically on read
    if (col === 'investorMentorProfiles') {
      return (items as InvestorMentorProfile[]).map(p => this.recalculateProfile(p)) as unknown as T[];
    }
    
    return [...items];
  }

  public getDoc<T>(col: CollectionName, idKey: string, idVal: any): T | null {
    const items = this.get<T>(col);
    return (items as any[]).find(item => item[idKey] === idVal) || null;
  }

  public subscribe<T>(col: CollectionName, subscriber: Subscriber<T>): () => void {
    if (!this.subscribers.has(col)) {
      this.subscribers.set(col, new Set());
    }
    this.subscribers.get(col)!.add(subscriber);

    // Immediately trigger with current state
    subscriber(this.get<T>(col));

    return () => {
      this.subscribers.get(col)?.delete(subscriber);
    };
  }

  private notify(col: CollectionName) {
    const subs = this.subscribers.get(col);
    if (subs) {
      const data = this.get(col);
      subs.forEach(fn => {
        try {
          fn(data);
        } catch (err) {
          console.error('Error notifying subscriber:', err);
        }
      });
    }
  }

  private notifyAll() {
    const keys = Array.from(this.memoryCache.keys());
    for (const key of keys) {
      this.notify(key);
    }
  }

  public add<T extends Record<string, any>>(col: CollectionName, item: T): T {
    const current = this.memoryCache.get(col) || [];
    const docWithId = {
      id: item.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: item.createdAt || new Date().toISOString(),
      ...item
    };
    current.unshift(docWithId);
    this.memoryCache.set(col, current);
    this.persist(col);
    this.notify(col);
    return docWithId as T;
  }

  public update<T extends Record<string, any>>(
    col: CollectionName, 
    id: string, 
    partial: Partial<T>,
    idField: string = 'id'
  ): boolean {
    const current = this.memoryCache.get(col) || [];
    const idx = current.findIndex((item: any) => item[idField] === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...partial };
      this.memoryCache.set(col, current);
      this.persist(col);
      this.notify(col);
      return true;
    }
    return false;
  }

  public delete(col: CollectionName, id: string, idField: string = 'id'): boolean {
    const current = this.memoryCache.get(col) || [];
    const filtered = current.filter((item: any) => item[idField] !== id);
    if (filtered.length !== current.length) {
      this.memoryCache.set(col, filtered);
      this.persist(col);
      this.notify(col);
      return true;
    }
    return false;
  }

  // Recalculate tier / caps per Section 10 rules
  public recalculateProfile(profile: InvestorMentorProfile): InvestorMentorProfile {
    const updated = { ...profile };

    if (updated.type === 'investor') {
      let baseTier: InvestorTier = updated.tier || 1;
      
      // Auto upgrade one level whenever creditsEarnedFromTransfers crosses 500 threshold
      const bonusLevels = Math.floor((updated.creditsEarnedFromTransfers || 0) / 500);
      const computedTier = Math.min(4, baseTier + bonusLevels) as InvestorTier;
      updated.tier = computedTier;

      // Tier caps: Tier 1: 5k, Tier 2: 15k, Tier 3: 40k, Tier 4: 100k
      const tierCaps: Record<InvestorTier, number> = {
        1: 5000,
        2: 15000,
        3: 40000,
        4: 100000
      };
      updated.maxChargeCap = tierCaps[computedTier];
    } else if (updated.type === 'mentor') {
      // Mentor cap formula:
      // cap = min(₹3,000 + (⌊sessionsCompleted / 5⌋ × ₹500) + (⌊creditsEarned / 100⌋ × ₹200), ₹25,000)
      const sessionBonus = Math.floor((updated.sessionsCompleted || 0) / 5) * 500;
      const creditBonus = Math.floor((updated.creditsEarnedFromTransfers || 0) / 100) * 200;
      const computedCap = Math.min(3000 + sessionBonus + creditBonus, 25000);
      updated.maxChargeCap = computedCap;
    }

    return updated;
  }
}

export const db = new ReactiveDatabase();

// Pitch Deck File Storage (IndexedDB + Data URL backing for persistent real download & preview)
class FileStorageService {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return;
      }
      const request = indexedDB.open('YancConnectFileStorage', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async uploadPitchDeck(
    file: File, 
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; fileName: string; size: number }> {
    return new Promise((resolve, reject) => {
      // Validation: .pdf, .ppt, .pptx only, max 15MB
      const allowedExts = ['.pdf', '.ppt', '.pptx'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExts.includes(fileExt)) {
        throw new Error('Only .pdf, .ppt, and .pptx files are allowed.');
      }
      if (file.size > 15 * 1024 * 1024) {
        throw new Error('File size exceeds maximum allowed 15MB limit.');
      }

      // Simulate realistic upload progress bar
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 20;
        if (onProgress) onProgress(Math.min(currentProgress, 95));
        if (currentProgress >= 100) {
          clearInterval(interval);
          
          // Convert to persistent Data URL / Blob URL
          const reader = new FileReader();
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            const fileId = `deck_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

            try {
              const idb = await this.dbPromise;
              if (idb) {
                const tx = idb.transaction('files', 'readwrite');
                tx.objectStore('files').put({
                  id: fileId,
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: dataUrl
                });
              }
            } catch (e) {
              console.warn('Could not store in IndexedDB, fallback to DataURL', e);
            }

            if (onProgress) onProgress(100);
            resolve({
              url: dataUrl,
              fileName: file.name,
              size: file.size
            });
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        }
      }, 150);
    });
  }
}

export const fileStorage = new FileStorageService();

// Helper to check if a session is stale (> 48 hours in pending status)
export function isSessionStale(createdAt: string, status: string = 'pending_provider_review'): boolean {
  if (status !== 'pending_provider_review' && status !== 'awaiting_founder_response') {
    return false;
  }
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffHours = (now - created) / (1000 * 60 * 60);
  return diffHours >= 48;
}

// Standalone recalculation helper for profiles
export function recalculateProfile(profileIdOrObj: string | InvestorMentorProfile): InvestorMentorProfile | null {
  if (typeof profileIdOrObj === 'string') {
    const p = db.getDoc<InvestorMentorProfile>('investorMentorProfiles', 'id', profileIdOrObj);
    if (!p) return null;
    const recalculated = db.recalculateProfile(p);
    db.update<InvestorMentorProfile>('investorMentorProfiles', p.id, recalculated);
    return recalculated;
  }
  return db.recalculateProfile(profileIdOrObj);
}

// Notification sender helper matching Section 17 Matrix
export function createNotification(
  userId: string, 
  message: string, 
  sentBy: string = 'System', 
  relatedId?: string
) {
  db.add<Notification>('notifications', {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    message,
    read: false,
    sentBy,
    relatedId,
    createdAt: new Date().toISOString()
  });
}
