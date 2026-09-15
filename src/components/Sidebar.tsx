import React, { useState, useEffect } from 'react';
import {
  Users,
  Compass,
  Calendar,
  Layers,
  UserCheck,
  CreditCard,
  Briefcase,
  FileCheck2,
  Clock,
  Send,
  Building2,
  ShieldCheck,
  BarChart3,
  LogOut,
  Wallet,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Inbox,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Coins,
  ArrowRightLeft,
  CheckCircle2,
  Award,
  GitFork
} from 'lucide-react';
import { 
  User, 
  UserRole, 
  InvestorMentorProfile, 
  Session, 
  AdvisoryBoardRequest, 
  AdvisorSwapRequest, 
  AdvisorApplication,
  WithdrawalRequest,
  YancMember 
} from '../types';
import { db } from '../services/db';
import { authService } from '../services/auth';

interface SidebarProps {
  currentUser: User | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenAuth?: (step?: 'login' | 'apply_provider') => void;
  onOpenArchitectureFlow?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  onOpenProfile,
  onOpenAuth,
  onOpenArchitectureFlow
}) => {
  const [profiles, setProfiles] = useState<InvestorMentorProfile[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [advisoryBoards, setAdvisoryBoards] = useState<AdvisoryBoardRequest[]>([]);
  const [advisorApps, setAdvisorApps] = useState<AdvisorApplication[]>([]);
  const [swaps, setSwaps] = useState<AdvisorSwapRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [yancMember, setYancMember] = useState<YancMember | null>(null);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const activeRole: UserRole = currentUser?.currentRoleView || currentUser?.role || 'non_member';

  // Live subscriptions for real-time counts and badges
  useEffect(() => {
    const unsubProf = db.subscribe<InvestorMentorProfile>('investorMentorProfiles', setProfiles);
    const unsubSess = db.subscribe<Session>('sessions', setSessions);
    const unsubAdv = db.subscribe<AdvisoryBoardRequest>('advisoryBoardRequests', setAdvisoryBoards);
    const unsubApps = db.subscribe<AdvisorApplication>('advisorApplications', setAdvisorApps);
    const unsubSwaps = db.subscribe<AdvisorSwapRequest>('advisorSwapRequests', setSwaps);
    const unsubWdr = db.subscribe<WithdrawalRequest>('withdrawalRequests', setWithdrawals);

    return () => {
      unsubProf();
      unsubSess();
      unsubAdv();
      unsubApps();
      unsubSwaps();
      unsubWdr();
    };
  }, []);

  // Subscribe to YANC member record
  useEffect(() => {
    if (!currentUser) return;
    const unsub = db.subscribe<YancMember>('yancMembers', (all) => {
      const m = all.find(mem => mem.email.toLowerCase() === currentUser.email.toLowerCase());
      setYancMember(m || null);
    });
    return () => unsub();
  }, [currentUser]);

  // Derived metrics
  const mentorCount = profiles.filter(p => p.type === 'mentor' && p.applicationStatus === 'approved').length;
  const investorCount = profiles.filter(p => p.type === 'investor' && p.applicationStatus === 'approved').length;
  
  const mySessions = currentUser 
    ? sessions.filter(s => s.requesterId === currentUser.uid || s.providerId === currentUser.uid)
    : [];
  const pendingRequestsCount = currentUser
    ? sessions.filter(s => s.providerId === currentUser.uid && s.status === 'pending_provider_review').length
    : 0;
  const scheduledSessionsCount = currentUser
    ? sessions.filter(s => (s.providerId === currentUser.uid || s.requesterId === currentUser.uid) && (s.status === 'accepted' || s.status === 'awaiting_founder_response')).length
    : 0;

  const currentProviderProfile = currentUser
    ? profiles.find(p => p.userId === currentUser.uid || p.email === currentUser.email)
    : null;

  const pendingAppsCount = profiles.filter(p => p.applicationStatus === 'pending').length + advisorApps.filter(a => a.status === 'pending').length;
  const pendingBoardsCount = advisoryBoards.filter(b => b.status === 'awaiting_admin_approval' || b.status === 'awaiting_match').length;
  const pendingSwapsCount = swaps.filter(s => s.status === 'pending').length;
  const pendingMemosCount = sessions.filter(s => s.status === 'pending_finance_review').length;
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;

  const isApprovedAdvisor = currentUser ? authService.isApprovedAdvisor(currentUser.uid) : false;

  // Navigation Items per role
  const getNavSections = () => {
    switch (activeRole) {
      case 'yanc_member':
      case 'non_member':
        return [
          {
            title: 'EXPLORE & CONNECT',
            items: [
              { id: 'mentors', label: 'Mentors Directory', icon: Users, badge: `${mentorCount} Available` },
              { id: 'investors', label: 'Investors Directory', icon: Compass, badge: `${investorCount} Active` },
            ]
          },
          {
            title: 'MY WORKSPACE',
            items: [
              { id: 'sessions', label: 'My Scheduled Sessions', icon: Calendar, badge: mySessions.length > 0 ? `${mySessions.length}` : undefined },
              { id: 'advisory', label: 'Custom Advisory Board', icon: Layers, badge: '3-Person' },
              { id: 'profile', label: 'Founder Profile', icon: UserCheck }
            ]
          }
        ];

      case 'investor':
        return [
          {
            title: 'INVESTOR OVERVIEW',
            items: [
              { id: 'dashboard', label: 'Portfolio Dashboard', icon: BarChart3 },
              { id: 'incoming', label: 'Incoming Pitches', icon: Inbox, badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} Pending` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
              { id: 'sessions', label: 'Scheduled Sessions', icon: Calendar, badge: scheduledSessionsCount > 0 ? `${scheduledSessionsCount}` : undefined },
            ]
          },
          {
            title: 'MANAGEMENT',
            items: [
              { id: 'slots', label: 'Availability Slots', icon: Clock, badge: currentProviderProfile ? `${currentProviderProfile.availabilitySlots.length}` : undefined },
              { id: 'wallet', label: 'Wallet & Payouts', icon: Wallet, badge: currentProviderProfile ? `₹${currentProviderProfile.walletBalance.toLocaleString('en-IN')}` : undefined },
              { id: 'profile', label: 'Investor Profile', icon: UserCheck }
            ]
          }
        ];

      case 'mentor':
        return [
          {
            title: 'MENTOR OVERVIEW',
            items: [
              { id: 'dashboard', label: 'Mentor Dashboard', icon: BarChart3 },
              { id: 'incoming', label: 'Incoming Requests', icon: Inbox, badge: pendingRequestsCount > 0 ? `${pendingRequestsCount} Pending` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
              { id: 'sessions', label: 'Scheduled Sessions', icon: Calendar, badge: scheduledSessionsCount > 0 ? `${scheduledSessionsCount}` : undefined },
            ]
          },
          {
            title: 'MANAGEMENT',
            items: [
              { id: 'slots', label: 'Availability Slots', icon: Clock, badge: currentProviderProfile ? `${currentProviderProfile.availabilitySlots.length}` : undefined },
              { id: 'wallet', label: 'Wallet & Payouts', icon: Wallet, badge: currentProviderProfile ? `₹${currentProviderProfile.walletBalance.toLocaleString('en-IN')}` : undefined },
              { id: 'profile', label: 'Mentor Profile', icon: UserCheck },
              ...(!isApprovedAdvisor ? [{ id: 'advisor_app', label: 'Apply as Board Advisor', icon: Sparkles, badge: 'Equity' }] : [])
            ]
          }
        ];

      case 'advisor':
        return [
          {
            title: 'ADVISORY OVERVIEW',
            items: [
              { id: 'dashboard', label: 'Advisor Dashboard', icon: BarChart3 },
              { id: 'companies', label: 'My Startups (Equity)', icon: Building2, badge: `${advisoryBoards.filter(b => b.status === 'active' && b.finalAdvisors.some(a => a.advisorEmail === currentUser?.email || a.advisorId === currentUser?.uid)).length} Boards` },
              { id: 'profile', label: 'Advisor Profile', icon: UserCheck }
            ]
          }
        ];

      case 'ops_admin':
        return [
          {
            title: 'OPERATIONS CONTROL',
            items: [
              { id: 'admin_ops', label: 'Operations Dashboard', icon: BarChart3 },
              { id: 'applications', label: 'Provider Applications', icon: FileCheck2, badge: pendingAppsCount > 0 ? `${pendingAppsCount}` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
              { id: 'advisory_boards', label: 'Advisory Board Approvals', icon: Layers, badge: pendingBoardsCount > 0 ? `${pendingBoardsCount}` : undefined, badgeColor: 'bg-blue-100 text-blue-800' },
              { id: 'swaps', label: 'Advisor Swap Requests', icon: HelpCircle, badge: pendingSwapsCount > 0 ? `${pendingSwapsCount}` : undefined, badgeColor: 'bg-purple-100 text-purple-800' },
              { id: 'sessions_queue', label: 'Sessions Queue', icon: Clock },
              { id: 'users', label: 'Users Directory', icon: Users }
            ]
          }
        ];

      case 'finance_admin':
        return [
          {
            title: 'FINANCIAL CONTROLLER',
            items: [
              { id: 'admin_finance', label: 'Finance Dashboard', icon: BarChart3 },
              { id: 'memos', label: 'Teardown Memo Reviews', icon: FileCheck2, badge: pendingMemosCount > 0 ? `${pendingMemosCount} Pending` : undefined, badgeColor: 'bg-rose-100 text-rose-800' },
              { id: 'withdrawals', label: 'Withdrawal Approvals', icon: CreditCard, badge: pendingWithdrawalsCount > 0 ? `${pendingWithdrawalsCount} Requests` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
              { id: 'ledger', label: 'Escrow & Wallet Ledger', icon: Wallet }
            ]
          }
        ];

      case 'super_admin':
        return [
          {
            title: 'SUPER ADMIN SYSTEM',
            items: [
              { id: 'admin_super', label: 'Super Admin Overview', icon: ShieldCheck },
              { id: 'admin_ops', label: 'Operations Control', icon: BarChart3, badge: pendingAppsCount > 0 ? `${pendingAppsCount}` : undefined },
              { id: 'admin_finance', label: 'Finance & Escrow Ledger', icon: Wallet, badge: pendingMemosCount > 0 ? `${pendingMemosCount}` : undefined },
              { id: 'users', label: 'User Role Overrides', icon: Users }
            ]
          }
        ];

      default:
        return [
          {
            title: 'EXPLORE',
            items: [
              { id: 'mentors', label: 'Mentors Directory', icon: Users },
              { id: 'investors', label: 'Investors Directory', icon: Compass }
            ]
          }
        ];
    }
  };

  const navSections = getNavSections();

  const getRoleBadgeInfo = () => {
    switch (activeRole) {
      case 'yanc_member':
        return { label: 'YANC Gold Member', bg: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'non_member':
        return { label: 'Founder (Non-Member)', bg: 'bg-gray-100 text-gray-800 border-gray-200' };
      case 'investor':
        return { label: `Investor • Tier ${currentProviderProfile?.tier || 1}`, bg: 'bg-indigo-100 text-indigo-900 border-indigo-200' };
      case 'mentor':
        return { label: 'Verified Mentor', bg: 'bg-purple-100 text-purple-900 border-purple-200' };
      case 'advisor':
        return { label: 'Board Advisor (Dual)', bg: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
      case 'ops_admin':
        return { label: 'Operations Admin', bg: 'bg-blue-100 text-blue-900 border-blue-200' };
      case 'finance_admin':
        return { label: 'Finance Controller', bg: 'bg-rose-100 text-rose-900 border-rose-200' };
      case 'super_admin':
        return { label: 'Super Administrator', bg: 'bg-purple-200 text-purple-950 border-purple-300' };
      default:
        return { label: 'Guest', bg: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const roleInfo = getRoleBadgeInfo();

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        id="sidebar-mobile-backdrop"
        className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Main Sidebar Element */}
      <aside
        id="app-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col w-72 md:w-64 bg-white border-r border-gray-200 shadow-xl md:shadow-none transition-all duration-200 ease-in-out shrink-0`}
      >
        {/* Top Header: Identity & Close Button */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-indigo-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#D946EF] flex items-center justify-center text-white font-black text-sm shadow-xs">
              Y
            </div>
            <div>
              <span className="text-xs font-black text-gray-900 tracking-tight block">YANC CONNECT</span>
              <span className="text-[10px] text-purple-700 font-semibold tracking-wider uppercase block">
                Navigation Portal
              </span>
            </div>
          </div>

          <button
            id="btn-close-sidebar"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition focus:outline-none"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4 hidden md:block" />
            <X className="w-4 h-4 md:hidden" />
          </button>
        </div>

        {/* User Identity Profile Card */}
        {currentUser ? (
          <div className="p-3.5 border-b border-gray-100 bg-gray-50/50 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex items-center justify-between gap-1.5">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border truncate ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>

              {/* Quick Profile Trigger */}
              <button
                onClick={onOpenProfile}
                className="text-[10px] text-purple-700 hover:text-purple-900 font-bold underline"
              >
                Edit
              </button>
            </div>

            {/* Dynamic Financial Status Widget */}
            {(activeRole === 'yanc_member' || activeRole === 'non_member') && (
              <div className="p-2 rounded-xl bg-purple-50/80 border border-purple-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-purple-900">
                  <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="font-semibold text-[11px]">
                    {yancMember ? `${yancMember.creditBalance} Credits` : 'Non-Member'}
                  </span>
                </div>
                <span className="text-[10px] text-purple-700 font-bold">
                  {yancMember ? `₹${(yancMember.creditBalance * 100).toLocaleString('en-IN')}` : 'Pay per session'}
                </span>
              </div>
            )}

            {(activeRole === 'investor' || activeRole === 'mentor') && currentProviderProfile && (
              <div className="p-2 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-indigo-900">
                  <Wallet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-semibold text-[11px]">Wallet Balance</span>
                </div>
                <span className="text-[11px] font-extrabold text-indigo-950">
                  ₹{currentProviderProfile.walletBalance.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Guest CTA Card */
          <div className="p-3.5 border-b border-gray-100 bg-purple-50/50 space-y-2">
            <p className="text-xs font-bold text-gray-900">Welcome to YANC Connect</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Book verified mentors, pitch angel investors, and build 3-person advisory boards with 100% escrow protection.
            </p>
            {onOpenAuth && (
              <button
                onClick={() => onOpenAuth('login')}
                className="w-full py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg transition"
              >
                Sign In / Join
              </button>
            )}
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (window.innerWidth < 768) {
                          onClose();
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-[#EDE9FE] text-[#7C3AED] shadow-xs'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#7C3AED]' : 'text-gray-400 group-hover:text-gray-700'
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          item.badgeColor || (isActive ? 'bg-[#7C3AED] text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200')
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Role Switcher for Dual-hat / Testing */}
          {currentUser && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:text-purple-700 transition"
              >
                <div className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Switch Workspace View</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showRoleSwitcher ? 'rotate-90' : ''}`} />
              </button>

              {showRoleSwitcher && (
                <div className="mt-1.5 p-2 bg-gray-50 rounded-xl space-y-1 text-xs animate-in fade-in duration-150">
                  <button
                    onClick={() => authService.switchRoleView('yanc_member')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeRole === 'yanc_member' ? 'bg-purple-100 text-purple-900 font-bold' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Member Workspace
                  </button>
                  <button
                    onClick={() => authService.switchRoleView('mentor')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeRole === 'mentor' ? 'bg-purple-100 text-purple-900 font-bold' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Mentor Workspace
                  </button>
                  <button
                    onClick={() => authService.switchRoleView('investor')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeRole === 'investor' ? 'bg-purple-100 text-purple-900 font-bold' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Investor Workspace
                  </button>
                  <button
                    onClick={() => authService.switchRoleView('advisor')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeRole === 'advisor' ? 'bg-purple-100 text-purple-900 font-bold' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Advisor Workspace
                  </button>
                  <button
                    onClick={() => authService.switchRoleView('ops_admin')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeRole === 'ops_admin' ? 'bg-purple-100 text-purple-900 font-bold' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Ops Admin View
                  </button>
                  <button
                    onClick={() => authService.switchRoleView('finance_admin')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeRole === 'finance_admin' ? 'bg-purple-100 text-purple-900 font-bold' : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Finance Admin View
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Platform Rules & Escrow Trust Box */}
        <div className="p-3 border-t border-gray-100 space-y-2 bg-gray-50/50">
          {onOpenArchitectureFlow && (
            <button
              id="sidebar-btn-architecture-flow"
              onClick={onOpenArchitectureFlow}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-purple-700 transition-transform group-hover:rotate-45" />
                <span>Architecture Flowchart</span>
              </div>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-200 text-purple-950">
                Blueprint
              </span>
            </button>
          )}

          <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-[11px] text-gray-700 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-purple-800 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>100% Escrow Guarantee</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-snug">
              Fees held securely until verified 3-point Teardown Memo is audited.
            </p>
          </div>

          {currentUser && (
            <button
              id="sidebar-btn-logout"
              onClick={() => authService.logout()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

