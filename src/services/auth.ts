import { User, UserRole, YancMember, InvestorMentorProfile, AdminUser, AdvisorApplication } from '../types';
import { db } from './db';

const CURRENT_USER_KEY = 'yanc_connect_current_user';

class AuthService {
  private currentUser: User | null = null;
  private listeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      } else {
        // Default to first seed user so the workspace is immediately populated
        this.currentUser = {
          uid: 'user_member_1',
          email: 'member@yanc.in',
          role: 'yanc_member',
          name: 'Aarav Patel',
          phone: '9876543210',
          bio: 'Founder of BioDrop — developing portable solar-powered water purification units for semi-urban communities.',
          createdAt: '2026-08-01T09:00:00Z'
        };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));
      }
    } catch {
      this.currentUser = null;
    }
  }

  public subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentUser);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.currentUser));
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    this.notify();
  }

  public logout() {
    this.setCurrentUser(null);
  }

  public switchRoleView(newRole: UserRole) {
    if (!this.currentUser) return;
    const updated = {
      ...this.currentUser,
      currentRoleView: newRole
    };
    this.setCurrentUser(updated);
  }

  // Check if an email belongs to an approved advisor
  public isApprovedAdvisor(userId: string): boolean {
    const apps = db.get<AdvisorApplication>('advisorApplications');
    return apps.some(a => a.userId === userId && a.status === 'approved');
  }

  // Get YancMember data if exists
  public getYancMember(email: string): YancMember | null {
    return db.getDoc<YancMember>('yancMembers', 'email', email);
  }

  // Get Investor/Mentor profile if exists
  public getProfile(userId: string): InvestorMentorProfile | null {
    return db.getDoc<InvestorMentorProfile>('investorMentorProfiles', 'userId', userId);
  }

  // Get Admin user if exists
  public getAdmin(email: string): AdminUser | null {
    return db.getDoc<AdminUser>('adminUsers', 'email', email);
  }
}

export const authService = new AuthService();
