import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  ChevronDown, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  Shield, 
  Briefcase, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Coins,
  ArrowRightLeft,
  GitFork,
  Download
} from 'lucide-react';
import { User, Notification, Broadcast, UserRole } from '../types';
import { authService } from '../services/auth';
import { db } from '../services/db';
import { UiFlowModal } from './UiFlowModal';

interface HeaderProps {
  currentUser: User | null;
  onToggleSidebar: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onToggleSidebar,
  onOpenProfile,
  onOpenAuth
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showQuickAccounts, setShowQuickAccounts] = useState(false);
  const [showUiFlowModal, setShowUiFlowModal] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);

  const isApprovedAdvisor = currentUser ? authService.isApprovedAdvisor(currentUser.uid) : false;
  const currentRole = currentUser?.currentRoleView || currentUser?.role;

  useEffect(() => {
    if (!currentUser) return;
    const unsub = db.subscribe<Notification>('notifications', (allNotifs) => {
      const userNotifs = allNotifs.filter(n => n.userId === currentUser.uid || n.userId === 'user_ops_admin' && currentUser.role === 'ops_admin');
      setNotifications(userNotifs);
    });
    return () => unsub();
  }, [currentUser]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (quickRef.current && !quickRef.current.contains(event.target as Node)) {
        setShowQuickAccounts(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notifId: string) => {
    db.update<Notification>('notifications', notifId, { read: true });
  };

  const markAllAsRead = () => {
    notifications.forEach(n => {
      if (!n.read) {
        db.update<Notification>('notifications', n.id, { read: true });
      }
    });
  };

  const handleLogout = () => {
    setShowUserDropdown(false);
    authService.logout();
  };

  const handleRoleToggle = (targetRole: UserRole) => {
    authService.switchRoleView(targetRole);
    setShowUserDropdown(false);
  };

  const quickLoginAccounts = [
    { email: 'member@yanc.in', label: 'Member (Aarav - Gold)', role: 'Member' },
    { email: 'nonmember@gmail.com', label: 'Non-Member (Rohan)', role: 'Non-Member' },
    { email: 'investor@yanc.in', label: 'Investor (Vikramaditya - Tier 3)', role: 'Investor' },
    { email: 'mentor@yanc.in', label: 'Mentor (Devraj - 19 sessions)', role: 'Mentor' },
    { email: 'mentor@yanc.in', label: 'Advisor (Devraj - Dual Hat)', role: 'Advisor', roleOverride: 'advisor' as UserRole },
    { email: 'ops@yanc.in', label: 'Ops Admin (Tanya)', role: 'Ops Admin' },
    { email: 'finance@yanc.in', label: 'Finance Admin (Suresh)', role: 'Finance Admin' },
    { email: 'admin@yanc.in', label: 'Super Admin (Kabir)', role: 'Super Admin' },
  ];

  const handleQuickSwitch = (email: string, roleOverride?: UserRole) => {
    const user = db.get<User>('users').find(u => u.email === email);
    if (user) {
      const userToSet = {
        ...user,
        currentRoleView: roleOverride || user.role
      };
      authService.setCurrentUser(userToSet);
      setShowQuickAccounts(false);
    }
  };

  const getRoleBadgeLabel = (role?: UserRole) => {
    switch (role) {
      case 'yanc_member': return 'YANC Member';
      case 'non_member': return 'Founder (Non-Member)';
      case 'investor': return 'Investor';
      case 'mentor': return 'Mentor';
      case 'advisor': return 'Advisor';
      case 'ops_admin': return 'Ops Admin';
      case 'finance_admin': return 'Finance Admin';
      case 'super_admin': return 'Super Admin';
      default: return 'Guest';
    }
  };

  return (
    <header className="w-full bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#D946EF] text-white shadow-md select-none sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Hamburger + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-sidebar"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-white hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white/30"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-200 bg-clip-text text-transparent">
                YANC
              </span>
              <span className="text-sm font-semibold text-purple-100 tracking-wide">
                CONNECT
              </span>
            </div>
            <span className="text-[10px] text-purple-200 font-medium tracking-wider hidden sm:inline">
              Young Minds | Networking | Life Skills
            </span>
          </div>
        </div>

        {/* Right: Actions & User Dropdown */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Architecture & Flow Diagram Button */}
          <button
            id="btn-view-ui-flow"
            onClick={() => setShowUiFlowModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-full text-white backdrop-blur-sm transition border border-white/20 shadow-2xs"
            title="View End-to-End System Architecture & Flowchart"
          >
            <GitFork className="w-3.5 h-3.5 text-pink-300" />
            <span className="hidden sm:inline">Architecture & Flow</span>
          </button>

          {/* Download Lovable Spec (.md) Button */}
          <a
            id="btn-download-lovable-spec-header"
            href="/LOVABLE_SPEC.md"
            download="YANC_CONNECT_LOVABLE_SPEC.md"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/35 rounded-full text-emerald-100 hover:text-white backdrop-blur-sm transition border border-emerald-400/30 shadow-2xs"
            title="Download Complete Lovable Build Specification Markdown File"
          >
            <Download className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden md:inline">Download Spec (.md)</span>
          </a>

          {/* Quick Demo Switcher Pill */}
          <div className="relative" ref={quickRef}>
            <button
              id="btn-quick-demo-roles"
              onClick={() => setShowQuickAccounts(!showQuickAccounts)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-full text-white backdrop-blur-sm transition border border-white/20"
              title="Quick Demo Role Switcher"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Demo Accounts</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {showQuickAccounts && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 text-gray-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Switch Sample Account</p>
                  <p className="text-[11px] text-gray-500">OTP 180825 works across all accounts</p>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {quickLoginAccounts.map((acc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickSwitch(acc.email, acc.roleOverride)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 flex items-center justify-between transition group"
                    >
                      <div>
                        <p className="font-semibold text-gray-800 group-hover:text-purple-700">{acc.label}</p>
                        <p className="text-[11px] text-gray-400">{acc.email}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium group-hover:bg-purple-100 group-hover:text-purple-800">
                        {acc.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dual Role Switcher for Approved Advisors */}
          {currentUser && isApprovedAdvisor && (
            <div className="hidden sm:flex items-center bg-black/20 rounded-full p-0.5 border border-white/20">
              <button
                id="btn-switch-mentor-view"
                onClick={() => handleRoleToggle('mentor')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  currentRole === 'mentor' 
                    ? 'bg-white text-purple-900 shadow-sm' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Mentor View
              </button>
              <button
                id="btn-switch-advisor-view"
                onClick={() => handleRoleToggle('advisor')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  currentRole === 'advisor' 
                    ? 'bg-white text-purple-900 shadow-sm' 
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Advisor View
              </button>
            </div>
          )}

          {/* Notifications Dropdown */}
          {currentUser && (
            <div className="relative" ref={notifRef}>
              <button
                id="btn-notifications-toggle"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition focus:outline-none"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-400 text-gray-900 text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 text-gray-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">Notifications</h4>
                      <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full">
                        {unreadCount} unread
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`p-3 text-xs transition cursor-pointer hover:bg-gray-50 ${
                            !notif.read ? 'bg-purple-50/70 font-medium' : 'text-gray-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-gray-800 leading-relaxed">{notif.message}</p>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-1" />
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                            <span>From: {notif.sentBy}</span>
                            <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile & Menu */}
          {currentUser ? (
            <div className="relative" ref={userRef}>
              <button
                id="btn-user-menu-toggle"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center font-bold text-white text-sm">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold leading-tight text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-purple-200 capitalize">
                    {getRoleBadgeLabel(currentRole)}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-purple-200" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 text-gray-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900">{currentUser.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                      {getRoleBadgeLabel(currentRole)}
                    </span>
                  </div>

                  {isApprovedAdvisor && (
                    <div className="py-1 border-b border-gray-100 sm:hidden">
                      <button
                        onClick={() => handleRoleToggle(currentRole === 'mentor' ? 'advisor' : 'mentor')}
                        className="w-full text-left px-4 py-2 text-xs text-purple-700 hover:bg-purple-50 flex items-center gap-2 font-medium"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        Switch to {currentRole === 'mentor' ? 'Advisor' : 'Mentor'} View
                      </button>
                    </div>
                  )}

                  <div className="py-1">
                    <button
                      id="menu-btn-ui-flow"
                      onClick={() => {
                        setShowUserDropdown(false);
                        setShowUiFlowModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-purple-700 hover:bg-purple-50 flex items-center gap-2 font-medium"
                    >
                      <GitFork className="w-4 h-4 text-purple-600" />
                      View UI Flowchart (PNG)
                    </button>
                    <button
                      id="menu-btn-my-profile"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      My Profile
                    </button>
                    <button
                      id="menu-btn-logout"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="btn-header-login"
              onClick={onOpenAuth}
              className="px-4 py-1.5 text-xs font-bold bg-white text-purple-800 rounded-lg hover:bg-purple-50 transition shadow-sm"
            >
              Sign In
            </button>
          )}

        </div>
      </div>

      {/* UI Flowchart Lightbox Modal */}
      <UiFlowModal
        isOpen={showUiFlowModal}
        onClose={() => setShowUiFlowModal(false)}
      />
    </header>
  );
};

export const AlertBar: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

  useEffect(() => {
    const unsub = db.subscribe<Broadcast>('broadcasts', (all) => {
      setBroadcasts(all);
    });
    return () => unsub();
  }, []);

  if (broadcasts.length === 0) return null;

  const latest = broadcasts[0];

  return (
    <div 
      id="system-alert-bar"
      className="w-full bg-[#EDE9FE] border-b border-[#DDD6FE] text-[#6B21A8] px-4 py-1.5 text-xs font-medium flex items-center justify-between"
    >
      <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
        </span>
        <span className="font-semibold text-purple-900 shrink-0">Broadcast:</span>
        <span className="truncate">{latest.message}</span>
        <span className="text-[10px] text-purple-700 opacity-75 shrink-0 hidden md:inline ml-auto">
          Posted by {latest.postedBy}
        </span>
      </div>
    </div>
  );
};
