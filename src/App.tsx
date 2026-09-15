import React, { useState, useEffect } from 'react';
import { User, UserRole, Session } from './types';
import { authService } from './services/auth';
import { db, isSessionStale } from './services/db';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { UiFlowModal } from './components/UiFlowModal';
import { MemberView } from './views/MemberView';
import { ProviderView } from './views/ProviderView';
import { AdvisorView } from './views/AdvisorView';
import { AdminView } from './views/AdminView';
import { AlertCircle, Clock, ArrowRight, Menu, PanelLeftOpen } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<string>('mentors');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialStep, setAuthInitialStep] = useState<'login' | 'apply_provider'>('login');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);
  const [staleSessions, setStaleSessions] = useState<Session[]>([]);

  // Subscribe to auth changes
  useEffect(() => {
    const unsub = authService.subscribe((user) => {
      setCurrentUser(user);
      if (user) {
        // Adjust default tab according to active role view
        const activeRole = user.currentRoleView || user.role;
        if (activeRole === 'investor' || activeRole === 'mentor') {
          setCurrentTab('dashboard');
        } else if (activeRole === 'advisor') {
          setCurrentTab('dashboard');
        } else if (activeRole === 'ops_admin') {
          setCurrentTab('admin_ops');
        } else if (activeRole === 'finance_admin') {
          setCurrentTab('admin_finance');
        } else if (activeRole === 'super_admin') {
          setCurrentTab('admin_super');
        } else {
          setCurrentTab('mentors');
        }
      }
    });

    return () => unsub();
  }, []);

  // Monitor stale sessions (> 48 hrs in pending_provider_review)
  useEffect(() => {
    if (!currentUser) return;
    const unsub = db.subscribe<Session>('sessions', (all) => {
      const stale = all.filter(s => 
        s.status === 'pending_provider_review' && 
        isSessionStale(s.createdAt) &&
        (s.requesterId === currentUser.uid || s.providerId === currentUser.uid)
      );
      setStaleSessions(stale);
    });

    return () => unsub();
  }, [currentUser]);

  const activeRole: UserRole = currentUser?.currentRoleView || currentUser?.role || 'non_member';

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-gray-900 flex flex-col font-sans antialiased selection:bg-purple-200">
      
      {/* Top Navigation Header */}
      <Header
        currentUser={currentUser}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onOpenAuth={(step) => {
          setAuthInitialStep(step || 'login');
          setShowAuthModal(true);
        }}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Floating Edge Re-open Button when Sidebar is Closed */}
      {!isSidebarOpen && (
        <button
          id="btn-open-sidebar-dock"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-0 top-24 z-30 flex items-center gap-2 px-3 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-r-xl shadow-lg border-y border-r border-purple-400 transition-all cursor-pointer group"
          title="Open Navigation Menu"
        >
          <PanelLeftOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span className="hidden sm:inline">Open Menu</span>
        </button>
      )}

      {/* Main Container Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* Left Sidebar Navigation */}
        <Sidebar
          currentUser={currentUser}
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'profile') {
              setShowProfileModal(true);
            } else {
              setCurrentTab(tab);
            }
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenAuth={(step) => {
            setAuthInitialStep(step || 'login');
            setShowAuthModal(true);
          }}
          onOpenArchitectureFlow={() => setShowArchitectureModal(true)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0">
          
          {/* Stale Session Alert Banner (Pending > 48 Hours) */}
          {staleSessions.length > 0 && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <h4 className="font-bold text-amber-900">
                  Notice: {staleSessions.length} session request(s) awaiting response over 48 hours
                </h4>
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  Per YANC Connect platform rules, pending requests older than 48 hours without provider response may be flagged for automated escrow reversal or reassignment by Operations Admin.
                </p>
              </div>
            </div>
          )}

          {/* Conditional View Rendering Based on Role & Tab */}
          {(!currentUser || activeRole === 'yanc_member' || activeRole === 'non_member') && (
            <MemberView
              currentUser={currentUser || {
                uid: 'guest',
                email: 'guest@yanc.in',
                role: 'non_member',
                name: 'Guest Founder',
                phone: '',
                bio: 'Exploring YANC Connect ecosystem',
                createdAt: new Date().toISOString()
              }}
              activeTab={currentTab}
            />
          )}

          {currentUser && (activeRole === 'investor' || activeRole === 'mentor') && (
            <ProviderView
              currentUser={currentUser}
              activeTab={currentTab}
            />
          )}

          {currentUser && activeRole === 'advisor' && (
            <AdvisorView
              currentUser={currentUser}
              activeTab={currentTab}
            />
          )}

          {currentUser && (activeRole === 'ops_admin' || activeRole === 'finance_admin' || activeRole === 'super_admin') && (
            <AdminView
              currentUser={currentUser}
              activeTab={currentTab}
            />
          )}

        </main>
      </div>

      {/* Authentication & Provider Application Modal */}
      <AuthModal
        isOpen={showAuthModal}
        initialStep={authInitialStep}
        onClose={() => setShowAuthModal(false)}
      />

      {/* User Profile & Edit Modal */}
      <ProfileModal
        currentUser={currentUser}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* End-to-End System Architecture & Flowchart Modal */}
      <UiFlowModal
        isOpen={showArchitectureModal}
        onClose={() => setShowArchitectureModal(false)}
      />

    </div>
  );
}
