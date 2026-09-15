import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  Coins, 
  Wallet, 
  DollarSign, 
  Search, 
  Filter, 
  Sparkles, 
  Building2, 
  RefreshCw, 
  UserCheck, 
  Sliders, 
  Check, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { 
  User, 
  InvestorMentorProfile, 
  Session, 
  WithdrawalRequest, 
  AdvisoryBoardRequest, 
  AdvisorSwapRequest, 
  AdvisorApplication,
  UserRole
} from '../types';
import { db, createNotification, recalculateProfile } from '../services/db';

interface AdminViewProps {
  currentUser: User;
  activeTab: string;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser, activeTab }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<InvestorMentorProfile[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [advisoryBoards, setAdvisoryBoards] = useState<AdvisoryBoardRequest[]>([]);
  const [swapRequests, setSwapRequests] = useState<AdvisorSwapRequest[]>([]);
  const [advisorApps, setAdvisorApps] = useState<AdvisorApplication[]>([]);

  // Sub-tab selection for admin view
  const [adminSubTab, setAdminSubTab] = useState<'ops' | 'finance' | 'super'>('ops');

  // Search in user directory
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Provider app rejection modal
  const [rejectingApp, setRejectingApp] = useState<InvestorMentorProfile | null>(null);
  const [appRejectReason, setAppRejectReason] = useState('');

  // Teardown memo audit
  const [rejectingMemoSession, setRejectingMemoSession] = useState<Session | null>(null);
  const [memoRejectNote, setMemoRejectNote] = useState('');

  // Advisory Board curation form
  const [curatingBoard, setCuratingBoard] = useState<AdvisoryBoardRequest | null>(null);
  const [chosenAdvisorIds, setChosenAdvisorIds] = useState<string[]>([]);
  const [advisorsEquity, setAdvisorsEquity] = useState<{ [key: string]: number }>({});
  const [curateError, setCurateError] = useState('');

  // Advisor Swap resolution
  const [resolvingSwap, setResolvingSwap] = useState<AdvisorSwapRequest | null>(null);
  const [swapReplacementId, setSwapReplacementId] = useState<string>('');

  // Super Admin Role override
  const [targetUserId, setTargetUserId] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('yanc_member');
  const [roleChangeSuccess, setRoleChangeSuccess] = useState('');

  useEffect(() => {
    // Sync subtab with activeTab
    if (activeTab === 'admin_finance' || activeTab === 'memos' || activeTab === 'withdrawals' || activeTab === 'ledger') {
      setAdminSubTab('finance');
    } else if (activeTab === 'admin_super' || activeTab === 'reports' || activeTab === 'role_override') {
      setAdminSubTab('super');
    } else if (activeTab === 'admin_ops' || activeTab === 'applications' || activeTab === 'advisory_boards' || activeTab === 'swaps' || activeTab === 'sessions_queue') {
      setAdminSubTab('ops');
    }
  }, [activeTab]);

  useEffect(() => {
    // Set default subtab based on role
    if (currentUser.role === 'finance_admin') setAdminSubTab('finance');
    else if (currentUser.role === 'super_admin') setAdminSubTab('super');
    else setAdminSubTab('ops');

    const unsubUsers = db.subscribe<User>('users', setUsers);
    const unsubProfiles = db.subscribe<InvestorMentorProfile>('investorMentorProfiles', setProfiles);
    const unsubSessions = db.subscribe<Session>('sessions', setSessions);
    const unsubWithdrawals = db.subscribe<WithdrawalRequest>('withdrawalRequests', setWithdrawals);
    const unsubAdvisory = db.subscribe<AdvisoryBoardRequest>('advisoryBoardRequests', setAdvisoryBoards);
    const unsubSwaps = db.subscribe<AdvisorSwapRequest>('advisorSwapRequests', setSwapRequests);
    const unsubAdvApps = db.subscribe<AdvisorApplication>('advisorApplications', setAdvisorApps);

    return () => {
      unsubUsers();
      unsubProfiles();
      unsubSessions();
      unsubWithdrawals();
      unsubAdvisory();
      unsubSwaps();
      unsubAdvApps();
    };
  }, [currentUser]);

  // Derived filtered items
  const pendingProfiles = profiles.filter(p => p.applicationStatus === 'pending');
  const pendingAdvApps = advisorApps.filter(a => a.status === 'pending');
  const pendingBoards = advisoryBoards.filter(b => b.status === 'awaiting_admin_approval');
  const pendingSwaps = swapRequests.filter(s => s.status === 'pending');
  const pendingMemoReviews = sessions.filter(s => s.status === 'pending_finance_review');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  // User directory filtering
  const filteredUsers = users.filter(u => {
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate escrow totals
  const totalEscrowHeld = sessions
    .filter(s => s.escrowStatus === 'held')
    .reduce((sum, s) => sum + (s.priceCharged || 0), 0);

  const totalEscrowReleased = sessions
    .filter(s => s.escrowStatus === 'released')
    .reduce((sum, s) => sum + (s.priceCharged || 0), 0);

  const totalPackageRevenue = advisoryBoards
    .filter(b => b.packagePaymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.yearlyPackageCost || 0), 0);

  // Approve Provider Application
  const handleApproveProviderApp = (profile: InvestorMentorProfile) => {
    db.update<InvestorMentorProfile>('investorMentorProfiles', profile.id, {
      applicationStatus: 'approved'
    });

    // Update user role to investor or mentor if they are non_member or member
    const userDoc = db.get<User>('users').find(u => u.uid === profile.userId || u.email === profile.email);
    if (userDoc) {
      db.update<User>('users', userDoc.uid, {
        role: profile.type
      }, 'uid');
    }

    createNotification(
      profile.userId,
      `Congratulations! Your ${profile.type} application on YANC Connect has been approved. You can now add slots.`,
      'Operations Admin'
    );
  };

  // Reject Provider Application
  const handleConfirmRejectProvider = () => {
    if (!rejectingApp) return;

    db.update<InvestorMentorProfile>('investorMentorProfiles', rejectingApp.id, {
      applicationStatus: 'rejected'
    });

    createNotification(
      rejectingApp.userId,
      `Your ${rejectingApp.type} application was reviewed and could not be approved. Reason: ${appRejectReason || 'Credentials criteria not met'}.`,
      'Operations Admin'
    );

    setRejectingApp(null);
    setAppRejectReason('');
  };

  // Approve Advisor Application
  const handleApproveAdvisorApp = (app: AdvisorApplication) => {
    db.update<AdvisorApplication>('advisorApplications', app.id, {
      status: 'approved'
    });

    // Update user role to include advisor access
    const user = db.get<User>('users').find(u => u.uid === app.userId);
    if (user) {
      db.update<User>('users', user.uid, {
        role: 'advisor'
      }, 'uid');
    }

    createNotification(
      app.userId,
      `Congratulations! Your application to become an Advisory Board Member has been approved!`,
      'Operations Admin'
    );
  };

  // Reject Advisor Application
  const handleRejectAdvisorApp = (app: AdvisorApplication) => {
    db.update<AdvisorApplication>('advisorApplications', app.id, {
      status: 'rejected'
    });

    createNotification(
      app.userId,
      `Your Advisor application was not approved at this time.`,
      'Operations Admin'
    );
  };

  // Curate & Finalize Advisory Board (Must pick exactly 3)
  const handleFinalizeBoard = () => {
    if (!curatingBoard) return;
    setCurateError('');

    if (chosenAdvisorIds.length !== 3) {
      setCurateError('Please select exactly 3 advisors for the startup board.');
      return;
    }

    const finalAdvisorsList = chosenAdvisorIds.map(advId => {
      const p = profiles.find(pr => pr.id === advId);
      return {
        advisorId: p ? p.userId : advId,
        advisorName: p ? p.name : 'Board Advisor',
        advisorEmail: p ? p.email : '',
        equityPercent: advisorsEquity[advId] || 1.5
      };
    });

    db.update<AdvisoryBoardRequest>('advisoryBoardRequests', curatingBoard.id, {
      status: 'active',
      finalAdvisors: finalAdvisorsList
    });

    // Notify founder
    createNotification(
      curatingBoard.founderId,
      `Your Startup Advisory Board has been finalized with 3 curated advisors! View board in your Advisory tab.`,
      'Operations Admin'
    );

    // Notify all 3 advisors
    finalAdvisorsList.forEach(adv => {
      createNotification(
        adv.advisorId,
        `You have been appointed to ${curatingBoard.founderName}'s Startup Advisory Board (${adv.equityPercent}% equity).`,
        'Operations Admin'
      );
    });

    setCuratingBoard(null);
    setChosenAdvisorIds([]);
  };

  // Resolve Advisor Swap
  const handleApproveSwap = () => {
    if (!resolvingSwap || !swapReplacementId) return;

    const board = advisoryBoards.find(b => b.id === resolvingSwap.advisoryBoardRequestId);
    const replacementProf = profiles.find(p => p.id === swapReplacementId);

    if (board && replacementProf) {
      const updatedAdvisors = board.finalAdvisors.map(adv => {
        if (adv.advisorId === resolvingSwap.advisorIdToRemove) {
          return {
            advisorId: replacementProf.userId,
            advisorName: replacementProf.name,
            advisorEmail: replacementProf.email,
            equityPercent: adv.equityPercent
          };
        }
        return adv;
      });

      db.update<AdvisoryBoardRequest>('advisoryBoardRequests', board.id, {
        finalAdvisors: updatedAdvisors
      });

      db.update<AdvisorSwapRequest>('advisorSwapRequests', resolvingSwap.id, {
        status: 'approved'
      });

      // Notify Founder
      createNotification(
        resolvingSwap.founderId,
        `Advisor Swap Approved! ${replacementProf.name} has joined your board, replacing ${resolvingSwap.advisorNameToRemove}.`,
        'Operations Admin'
      );

      // Notify New Advisor
      createNotification(
        replacementProf.userId,
        `You have been appointed to ${resolvingSwap.founderName}'s Advisory Board following a board reorganization.`,
        'Operations Admin'
      );
    }

    setResolvingSwap(null);
    setSwapReplacementId('');
  };

  // Finance: Approve Teardown Memo & Release Escrow
  const handleApproveMemoAndPayout = (session: Session) => {
    // 1. Release escrow to provider's wallet
    const providerProfile = profiles.find(p => p.id === session.providerId || p.userId === session.providerId);
    if (providerProfile) {
      const newBalance = providerProfile.walletBalance + session.priceCharged;
      const newLifetime = providerProfile.lifetimeEarnings + session.priceCharged;
      const newCompleted = providerProfile.sessionsCompleted + 1;

      db.update<InvestorMentorProfile>('investorMentorProfiles', providerProfile.id, {
        walletBalance: newBalance,
        lifetimeEarnings: newLifetime,
        sessionsCompleted: newCompleted
      });

      // Recalculate dynamic tier or caps
      recalculateProfile(providerProfile.id);

      createNotification(
        providerProfile.userId,
        `Teardown memo approved! Escrow of ₹${session.priceCharged.toLocaleString('en-IN')} has been released to your wallet.`,
        'Finance Admin',
        session.id
      );
    }

    // 2. Mark session completed & released
    db.update<Session>('sessions', session.id, {
      status: 'completed',
      escrowStatus: 'released'
    });

    // 3. Notify founder to rate the session
    createNotification(
      session.requesterId,
      `Your session with ${session.providerName} has been verified and marked completed. Please leave a rating!`,
      'Finance Admin',
      session.id
    );
  };

  // Finance: Reject Teardown Memo
  const handleRejectMemo = () => {
    if (!rejectingMemoSession || !memoRejectNote.trim()) return;

    db.update<Session>('sessions', rejectingMemoSession.id, {
      status: 'memo_rejected',
      financeReviewNote: memoRejectNote.trim()
    });

    const provProfile = profiles.find(p => p.id === rejectingMemoSession.providerId);
    if (provProfile) {
      createNotification(
        provProfile.userId,
        `Your Teardown Memo for ${rejectingMemoSession.requesterName} requires revision: "${memoRejectNote.trim()}". Please update and resubmit.`,
        'Finance Admin',
        rejectingMemoSession.id
      );
    }

    setRejectingMemoSession(null);
    setMemoRejectNote('');
  };

  // Finance: Approve Withdrawal Request
  const handleApproveWithdrawal = (wdr: WithdrawalRequest) => {
    const prof = profiles.find(p => p.userId === wdr.userId);
    if (prof) {
      const newBal = Math.max(0, prof.walletBalance - wdr.amount);
      db.update<InvestorMentorProfile>('investorMentorProfiles', prof.id, {
        walletBalance: newBal
      });
    }

    db.update<WithdrawalRequest>('withdrawalRequests', wdr.id, {
      status: 'approved'
    });

    createNotification(
      wdr.userId,
      `Payout of ₹${wdr.amount.toLocaleString('en-IN')} has been approved and transferred to your bank/UPI (${wdr.bankOrUpiDetails}).`,
      'Finance Admin'
    );
  };

  // Finance: Reject Withdrawal Request
  const handleRejectWithdrawal = (wdr: WithdrawalRequest) => {
    db.update<WithdrawalRequest>('withdrawalRequests', wdr.id, {
      status: 'rejected'
    });

    createNotification(
      wdr.userId,
      `Payout of ₹${wdr.amount.toLocaleString('en-IN')} could not be processed. Please check bank details.`,
      'Finance Admin'
    );
  };

  // Super Admin: Override User Role
  const handleRoleOverride = () => {
    if (!targetUserId) return;

    db.update<User>('users', targetUserId, {
      role: newRole
    }, 'uid');

    setRoleChangeSuccess(`User role successfully changed to ${newRole}!`);
    setTimeout(() => setRoleChangeSuccess(''), 3000);
  };

  // Super Admin: Reset Data to Seed
  const handleResetData = () => {
    if (window.confirm('Reset all demo database records back to original seed state?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 to-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">YANC Connect Platform Administration</h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 uppercase">
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-purple-200 mt-1 max-w-xl">
            Audit applications, curate algorithmic advisory boards, verify session teardowns, and oversee financial escrow releases.
          </p>
        </div>

        {/* Admin Navigation Pills */}
        <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl border border-white/20">
          {(currentUser.role === 'ops_admin' || currentUser.role === 'super_admin') && (
            <button
              onClick={() => setAdminSubTab('ops')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                adminSubTab === 'ops' ? 'bg-white text-purple-950 shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              Ops Admin
            </button>
          )}

          {(currentUser.role === 'finance_admin' || currentUser.role === 'super_admin') && (
            <button
              onClick={() => setAdminSubTab('finance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                adminSubTab === 'finance' ? 'bg-white text-purple-950 shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              Finance Admin
            </button>
          )}

          {currentUser.role === 'super_admin' && (
            <button
              onClick={() => setAdminSubTab('super')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                adminSubTab === 'super' ? 'bg-white text-purple-950 shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              Super Admin
            </button>
          )}
        </div>
      </div>

      {/* ===================== OPS ADMIN TAB ===================== */}
      {adminSubTab === 'ops' && (
        <div className="space-y-6">
          
          {/* Applications Queue */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                  Provider Applications Queue ({pendingProfiles.length})
                </h3>
                <p className="text-xs text-gray-500">Review pending Investor & Mentor credential requests.</p>
              </div>
            </div>

            {pendingProfiles.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No pending provider applications.</p>
            ) : (
              <div className="space-y-3">
                {pendingProfiles.map(p => (
                  <div key={p.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-gray-900">{p.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({p.email})</span>
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 capitalize">
                          {p.type} Application
                        </span>
                      </div>
                      <span className="text-xs text-purple-700 font-bold">Base Cap: ₹{p.maxChargeCap.toLocaleString('en-IN')}</span>
                    </div>

                    <p className="text-xs text-gray-700">{p.bio}</p>

                    <div className="flex flex-wrap gap-1">
                      {p.sectorsOrExpertiseTags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-gray-200">
                      <button
                        onClick={() => handleApproveProviderApp(p)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                      >
                        Approve Application
                      </button>
                      <button
                        onClick={() => setRejectingApp(p)}
                        className="px-3 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs rounded-lg transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advisor Applications Queue */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Advisor Applications Queue ({pendingAdvApps.length})
                </h3>
                <p className="text-xs text-gray-500">Mentors applying for Board Advisory roles.</p>
              </div>
            </div>

            {pendingAdvApps.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No pending advisor applications.</p>
            ) : (
              <div className="space-y-3">
                {pendingAdvApps.map(app => (
                  <div key={app.id} className="p-4 bg-purple-50/40 rounded-xl border border-purple-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm">{app.userName}</span>
                      <span className="text-gray-500">{app.userEmail}</span>
                    </div>

                    <p><strong className="text-gray-900">Why Advise:</strong> "{app.questionnaireResponses.whyAdvise}"</p>
                    <p><strong className="text-gray-900">Availability:</strong> {app.questionnaireResponses.availability}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {app.questionnaireResponses.sectorsOfExpertise.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-semibold text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApproveAdvisorApp(app)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                      >
                        Approve Advisor
                      </button>
                      <button
                        onClick={() => handleRejectAdvisorApp(app)}
                        className="px-3 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-bold rounded-lg transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advisory Board Assembly Queue */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Advisory Board Assembly Queue ({pendingBoards.length})
                </h3>
                <p className="text-xs text-gray-500">Curate top 5 candidates, assign 3 advisors & set equity allocations.</p>
              </div>
            </div>

            {pendingBoards.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No advisory board requests waiting for assembly.</p>
            ) : (
              <div className="space-y-4">
                {pendingBoards.map(board => (
                  <div key={board.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">Request #{board.id.slice(-6)} - {board.founderName}</h4>
                        <p className="text-xs text-gray-500">{board.founderEmail} • Package ₹{board.yearlyPackageCost.toLocaleString('en-IN')} (Paid)</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Awaiting Board Curation
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                      <strong className="block text-gray-900 mb-0.5">Pitch:</strong> {board.pitchSummary}
                    </p>

                    <div className="flex flex-wrap gap-1 text-xs">
                      <span className="text-gray-500 font-semibold mr-1">Industry Verticals:</span>
                      {board.industryTags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-semibold text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setCuratingBoard(board);
                        setChosenAdvisorIds([]);
                        setAdvisorsEquity({});
                        setCurateError('');
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      Curate & Finalize 3 Board Advisors
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advisor Swap Requests Queue */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                  Advisor Swap Requests ({pendingSwaps.length})
                </h3>
                <p className="text-xs text-gray-500">Founders requesting to replace an appointed board member.</p>
              </div>
            </div>

            {pendingSwaps.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No pending advisor swap requests.</p>
            ) : (
              <div className="space-y-3">
                {pendingSwaps.map(swap => (
                  <div key={swap.id} className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">Founder: {swap.founderName}</span>
                      <span className="text-red-600 font-bold">Removing: {swap.advisorNameToRemove}</span>
                    </div>
                    <p className="text-gray-700"><strong className="text-gray-900">Reason:</strong> "{swap.reason}"</p>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setResolvingSwap(swap);
                          setSwapReplacementId('');
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
                      >
                        Select Replacement & Approve Swap
                      </button>
                      <button
                        onClick={() => {
                          db.update<AdvisorSwapRequest>('advisorSwapRequests', swap.id, { status: 'rejected' });
                          createNotification(swap.founderId, `Your advisor swap request was reviewed and declined.`, 'Operations Admin');
                        }}
                        className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                      >
                        Reject Swap
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Directory */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Platform User Directory ({filteredUsers.length})
                </h3>
                <p className="text-xs text-gray-500">Live directory of all members, founders, providers, and admins.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user..."
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-xl outline-none bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="yanc_member">YANC Member</option>
                  <option value="non_member">Non-Member</option>
                  <option value="investor">Investor</option>
                  <option value="mentor">Mentor</option>
                  <option value="advisor">Advisor</option>
                  <option value="ops_admin">Ops Admin</option>
                  <option value="finance_admin">Finance Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(u => (
                    <tr key={u.uid} className="hover:bg-gray-50/50">
                      <td className="p-3 font-semibold text-gray-900">{u.name}</td>
                      <td className="p-3 text-gray-600">{u.email}</td>
                      <td className="p-3">
                        <span className="capitalize font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full text-[10px]">
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{u.phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ===================== FINANCE ADMIN TAB ===================== */}
      {adminSubTab === 'finance' && (
        <div className="space-y-6">
          
          {/* Escrow & Financial Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-indigo-900 p-5 rounded-2xl text-white shadow-xs">
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">Total Escrow Currently Held</span>
              <p className="text-3xl font-black mt-1">₹{totalEscrowHeld.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-indigo-200 mt-2">Locked pending teardown review</p>
            </div>

            <div className="bg-emerald-900 p-5 rounded-2xl text-white shadow-xs">
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">Total Escrow Released</span>
              <p className="text-3xl font-black mt-1">₹{totalEscrowReleased.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-emerald-200 mt-2">Paid out to verified mentors & investors</p>
            </div>

            <div className="bg-purple-900 p-5 rounded-2xl text-white shadow-xs">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">Advisory Package Revenue</span>
              <p className="text-3xl font-black mt-1">₹{totalPackageRevenue.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-purple-200 mt-2">Board curation fees paid</p>
            </div>
          </div>

          {/* Session Teardown Memo Review Queue */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Teardown Memo Audit & Escrow Release Queue ({pendingMemoReviews.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Verify substantive feedback before triggering automated escrow wallet release.
                </p>
              </div>
            </div>

            {pendingMemoReviews.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No teardown memos awaiting finance review.</p>
            ) : (
              <div className="space-y-4">
                {pendingMemoReviews.map(s => (
                  <div key={s.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-gray-900">Provider: {s.providerName}</h4>
                          <span className="text-xs text-gray-500">({s.providerRole})</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Session with Founder: <strong className="text-gray-900">{s.requesterName}</strong> • {s.slotDetails.date} ({s.mode})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Escrow to Release</span>
                        <span className="text-lg font-black text-emerald-700">₹{s.priceCharged.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Teardown Memo Content */}
                    <div className="p-4 bg-white rounded-xl border border-gray-200 text-xs space-y-2">
                      <span className="font-bold text-purple-900 uppercase tracking-wider text-[10px] block">
                        Submitted Teardown Memo Content
                      </span>
                      <p><strong className="text-gray-900">1. Concrete Next Steps:</strong> {s.teardownMemo?.nextSteps}</p>
                      <p><strong className="text-gray-900">2. Biggest Competitive Moat:</strong> {s.teardownMemo?.competitiveMoat}</p>
                      <p><strong className="text-gray-900">3. Biggest Risk / Blindspot:</strong> {s.teardownMemo?.biggestRisk}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-1">
                      <button
                        id={`btn-approve-escrow-${s.id}`}
                        onClick={() => handleApproveMemoAndPayout(s)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Memo & Release ₹{s.priceCharged.toLocaleString('en-IN')} to Wallet
                      </button>

                      <button
                        id={`btn-reject-memo-${s.id}`}
                        onClick={() => {
                          setRejectingMemoSession(s);
                          setMemoRejectNote('');
                        }}
                        className="px-4 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Memo (Request Revision)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdrawal Requests Queue */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-600" />
                  Provider Bank/UPI Withdrawal Requests ({pendingWithdrawals.length})
                </h3>
                <p className="text-xs text-gray-500">Sign off and initiate transfers from verified wallet earnings.</p>
              </div>
            </div>

            {pendingWithdrawals.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No pending withdrawal requests.</p>
            ) : (
              <div className="space-y-3">
                {pendingWithdrawals.map(w => (
                  <div key={w.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{w.userName}</span>
                        <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          {w.userRole}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-0.5"><strong className="text-gray-800">Target Bank / UPI:</strong> {w.bankOrUpiDetails}</p>
                      <p className="text-gray-400 text-[10px]">{new Date(w.requestedAt).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-gray-900">₹{w.amount.toLocaleString('en-IN')}</span>
                      <button
                        onClick={() => handleApproveWithdrawal(w)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                      >
                        Approve Payout
                      </button>
                      <button
                        onClick={() => handleRejectWithdrawal(w)}
                        className="px-3 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs rounded-lg transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ===================== SUPER ADMIN TAB ===================== */}
      {adminSubTab === 'super' && (
        <div className="space-y-6">
          
          {/* System Config & Dynamic Tier Formula Preview */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-600" />
              Dynamic Auto-Calculation System Parameters (Section 10)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                <span className="font-bold text-purple-900 uppercase tracking-wider block">Investor Tiers & Ceilings</span>
                <p>• <strong>Tier 1</strong>: &lt;500 credits transferred → Max Cap: ₹25,000</p>
                <p>• <strong>Tier 2</strong>: 500–999 credits transferred → Max Cap: ₹50,000</p>
                <p>• <strong>Tier 3</strong>: 1,000–1,999 credits transferred → Max Cap: ₹1,00,000</p>
                <p>• <strong>Tier 4</strong>: 2,000+ credits transferred → Max Cap: ₹2,50,000</p>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <span className="font-bold text-indigo-900 uppercase tracking-wider block">Mentor Reputation Formula</span>
                <p>• <strong>Base Cap</strong>: Initial ceiling starts at ₹5,000</p>
                <p>• <strong>Scaling</strong>: +₹1,500 per verified completed session</p>
                <p>• <strong>Rating Multiplier</strong>: (Average Rating / 5.0)</p>
                <p>• <strong>Formula</strong>: <code className="bg-white px-1 py-0.5 rounded text-indigo-800">Math.round((5000 + sessions * 1500) * (rating / 5))</code></p>
              </div>
            </div>
          </div>

          {/* User Role Override */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4 max-w-xl">
            <h3 className="text-base font-bold text-gray-900">Emergency Role Override</h3>
            <p className="text-xs text-gray-500">Directly alter any user account's permission level in the reactive database.</p>

            {roleChangeSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
                {roleChangeSuccess}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Target User</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none bg-white"
                >
                  <option value="">-- Choose User --</option>
                  {users.map(u => (
                    <option key={u.uid} value={u.uid}>{u.name} ({u.email}) - Current: {u.role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">New Role Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none bg-white"
                >
                  <option value="yanc_member">YANC Member</option>
                  <option value="non_member">Non-Member</option>
                  <option value="investor">Investor</option>
                  <option value="mentor">Mentor</option>
                  <option value="advisor">Advisor</option>
                  <option value="ops_admin">Ops Admin</option>
                  <option value="finance_admin">Finance Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <button
                onClick={handleRoleOverride}
                disabled={!targetUserId}
                className="py-2.5 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-xs transition"
              >
                Apply Role Override
              </button>
            </div>
          </div>

          {/* Seed Data Reset */}
          <div className="bg-red-50 rounded-2xl p-6 border border-red-200 space-y-3 max-w-xl">
            <h3 className="text-base font-bold text-red-900">Database State Reset</h3>
            <p className="text-xs text-red-700">
              Clear local storage modifications and revert to fresh seed profiles, sessions, and members.
            </p>
            <button
              onClick={handleResetData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Reset Database to Seed State
            </button>
          </div>

        </div>
      )}

      {/* CURATE ADVISORY BOARD MODAL (Top 5 algorithmic scoring + pick 3) */}
      {curatingBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 p-6 space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">Curate 3 Board Advisors</h3>
                <p className="text-xs text-purple-600 font-semibold">
                  Founder: {curatingBoard.founderName} • Verticals: {curatingBoard.industryTags.join(', ')}
                </p>
              </div>
              <button onClick={() => setCuratingBoard(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 text-xs space-y-3 pr-1">
              <p className="text-gray-500">
                Top candidates are ranked by overlap with founder industry tags and verified sessions completed. Select exactly 3 advisors:
              </p>

              <div className="space-y-2">
                {profiles.map(prof => {
                  const isChosen = chosenAdvisorIds.includes(prof.id);
                  const overlapCount = prof.sectorsOrExpertiseTags.filter(t => curatingBoard.industryTags.includes(t)).length;

                  return (
                    <div
                      key={prof.id}
                      onClick={() => {
                        if (isChosen) {
                          setChosenAdvisorIds(chosenAdvisorIds.filter(id => id !== prof.id));
                        } else {
                          if (chosenAdvisorIds.length < 3) {
                            setChosenAdvisorIds([...chosenAdvisorIds, prof.id]);
                            setAdvisorsEquity({ ...advisorsEquity, [prof.id]: 1.5 });
                          }
                        }
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                        isChosen ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isChosen ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {isChosen && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-sm">{prof.name}</span>
                          <span className="text-[11px] text-gray-500 ml-2">({prof.email})</span>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            Overlap score: <strong className="text-purple-700">{overlapCount} matching tags</strong> • {prof.sessionsCompleted} completed sessions
                          </p>
                        </div>
                      </div>

                      {isChosen && (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Equity %</label>
                          <input
                            type="number"
                            step="0.5"
                            value={advisorsEquity[prof.id] || 1.5}
                            onChange={(e) => setAdvisorsEquity({ ...advisorsEquity, [prof.id]: parseFloat(e.target.value) || 1.5 })}
                            className="w-16 px-2 py-1 text-xs border border-purple-300 rounded-lg outline-none bg-white font-bold text-purple-900"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {curateError && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{curateError}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setCuratingBoard(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-finalize-board"
                onClick={handleFinalizeBoard}
                disabled={chosenAdvisorIds.length !== 3}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Approve & Finalize Board ({chosenAdvisorIds.length}/3 selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESOLVE ADVISOR SWAP MODAL */}
      {resolvingSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Select Replacement Advisor</h3>
              <button onClick={() => setResolvingSwap(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Replacing <strong>{resolvingSwap.advisorNameToRemove}</strong> for founder <strong>{resolvingSwap.founderName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Choose Replacement Candidate</label>
              <select
                value={swapReplacementId}
                onChange={(e) => setSwapReplacementId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none bg-white"
              >
                <option value="">-- Select Replacement Advisor --</option>
                {profiles
                  .filter(p => p.userId !== resolvingSwap.advisorIdToRemove)
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sectorsOrExpertiseTags.slice(0, 2).join(', ')})</option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setResolvingSwap(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-swap-replace"
                onClick={handleApproveSwap}
                disabled={!swapReplacementId}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Confirm Replacement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MEMO MODAL (Finance) */}
      {rejectingMemoSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Request Memo Revision</h3>
              <button onClick={() => setRejectingMemoSession(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Provider <strong>{rejectingMemoSession.providerName}</strong> will receive your specific revision request and must resubmit before escrow is released.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Audit Feedback / Required Revision *
              </label>
              <textarea
                rows={3}
                value={memoRejectNote}
                onChange={(e) => setMemoRejectNote(e.target.value)}
                placeholder="e.g. Next steps section lacks concrete 30-day KPIs; please elaborate before payout..."
                className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectingMemoSession(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reject-memo"
                onClick={handleRejectMemo}
                disabled={!memoRejectNote.trim()}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT PROVIDER APP MODAL */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Decline Provider Application</h3>
              <button onClick={() => setRejectingApp(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Declining application for <strong>{rejectingApp.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Feedback Note (Optional)</label>
              <textarea
                rows={3}
                value={appRejectReason}
                onChange={(e) => setAppRejectReason(e.target.value)}
                placeholder="e.g. Requires further operational founder track record..."
                className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectingApp(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectProvider}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
