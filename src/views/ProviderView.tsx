import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  Calendar, 
  Inbox, 
  Wallet, 
  Star, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  ExternalLink, 
  User as UserIcon, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Building,
  Coins
} from 'lucide-react';
import { 
  User, 
  InvestorMentorProfile, 
  Session, 
  WithdrawalRequest, 
  AvailabilitySlot, 
  AdvisorApplication 
} from '../types';
import { db, createNotification } from '../services/db';
import { authService } from '../services/auth';

interface ProviderViewProps {
  currentUser: User;
  activeTab: string;
}

export const ProviderView: React.FC<ProviderViewProps> = ({ currentUser, activeTab }) => {
  const [profile, setProfile] = useState<InvestorMentorProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [advisorApp, setAdvisorApp] = useState<AdvisorApplication | null>(null);

  // Add slot form
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('10:00 AM - 11:00 AM');
  const [slotMode, setSlotMode] = useState<'online' | 'offline'>('online');
  const [slotLocation, setSlotLocation] = useState('');
  const [slotError, setSlotError] = useState('');

  // Teardown Memo form
  const [completingSession, setCompletingSession] = useState<Session | null>(null);
  const [nextSteps, setNextSteps] = useState('');
  const [competitiveMoat, setCompetitiveMoat] = useState('');
  const [biggestRisk, setBiggestRisk] = useState('');
  const [memoError, setMemoError] = useState('');

  // Reject Request form
  const [rejectingSession, setRejectingSession] = useState<Session | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Withdrawal Request form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  // Apply as Advisor questionnaire
  const [whyAdvise, setWhyAdvise] = useState('');
  const [advisorSectors, setAdvisorSectors] = useState<string[]>([]);
  const [advisorAvailability, setAdvisorAvailability] = useState('4 hours/month');
  const [advisorError, setAdvisorError] = useState('');
  const [advisorSuccess, setAdvisorSuccess] = useState('');

  // Selected Founder for "View Founder Profile" Modal
  const [selectedFounder, setSelectedFounder] = useState<User | null>(null);

  useEffect(() => {
    const unsubProfile = db.subscribe<InvestorMentorProfile>('investorMentorProfiles', (all) => {
      const found = all.find(p => p.userId === currentUser.uid || p.email === currentUser.email);
      setProfile(found || null);
    });

    const unsubSessions = db.subscribe<Session>('sessions', (all) => {
      setSessions(all.filter(s => s.providerId === currentUser.uid || s.providerName === currentUser.name));
    });

    const unsubWithdrawals = db.subscribe<WithdrawalRequest>('withdrawalRequests', (all) => {
      setWithdrawals(all.filter(w => w.userId === currentUser.uid));
    });

    const unsubAdvApps = db.subscribe<AdvisorApplication>('advisorApplications', (all) => {
      const app = all.find(a => a.userId === currentUser.uid);
      setAdvisorApp(app || null);
    });

    return () => {
      unsubProfile();
      unsubSessions();
      unsubWithdrawals();
      unsubAdvApps();
    };
  }, [currentUser]);

  // Derived metrics
  const upcomingSessions = sessions.filter(s => s.status === 'accepted');
  const incomingRequests = sessions.filter(s => s.status === 'pending_provider_review');
  const awaitingPayout = sessions.filter(s => s.status === 'pending_finance_review' || s.status === 'memo_rejected');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  // Handle Add Slot
  const handleAddSlot = () => {
    if (!profile) return;
    setSlotError('');
    if (!slotDate) {
      setSlotError('Date is required.');
      return;
    }
    if (!slotTime.trim()) {
      setSlotError('Time range is required.');
      return;
    }
    if (slotMode === 'offline' && !slotLocation.trim()) {
      setSlotError('Physical location is required for offline slots.');
      return;
    }

    const newSlot: AvailabilitySlot = {
      id: `slot_${Date.now()}`,
      date: slotDate,
      time: slotTime.trim(),
      mode: slotMode,
      location: slotMode === 'offline' ? slotLocation.trim() : undefined,
      isBooked: false
    };

    const updatedSlots = [...(profile.availabilitySlots || []), newSlot];
    db.update<InvestorMentorProfile>('investorMentorProfiles', profile.id, {
      availabilitySlots: updatedSlots
    });

    setShowAddSlot(false);
    setSlotDate('');
    setSlotLocation('');
  };

  // Delete Slot
  const handleDeleteSlot = (slotId: string) => {
    if (!profile) return;
    const updatedSlots = profile.availabilitySlots.filter(s => s.id !== slotId);
    db.update<InvestorMentorProfile>('investorMentorProfiles', profile.id, {
      availabilitySlots: updatedSlots
    });
  };

  // Accept incoming request
  const handleAcceptRequest = (session: Session) => {
    db.update<Session>('sessions', session.id, {
      status: 'accepted'
    });

    createNotification(
      session.requesterId,
      `${currentUser.name} accepted your session booking! It is now scheduled for ${session.slotDetails.date}.`,
      currentUser.name,
      session.id
    );
  };

  // Reject incoming request
  const handleConfirmReject = () => {
    if (!rejectingSession) return;

    // Refund founder
    if (rejectingSession.paymentMethod === 'credits' && rejectingSession.creditsPaid) {
      const founderMember = db.getDoc<any>('yancMembers', 'email', rejectingSession.requesterEmail);
      if (founderMember) {
        db.update('yancMembers', founderMember.email, {
          creditBalance: founderMember.creditBalance + rejectingSession.creditsPaid
        }, 'email');

        db.add('creditsLedger', {
          id: `cld_${Date.now()}`,
          userId: rejectingSession.requesterId,
          amount: rejectingSession.creditsPaid,
          type: 'earned',
          note: `Refund for rejected session ${rejectingSession.id}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Reopen slot
    if (profile) {
      const updatedSlots = profile.availabilitySlots.map(s => 
        s.id === rejectingSession.slotId ? { ...s, isBooked: false } : s
      );
      db.update<InvestorMentorProfile>('investorMentorProfiles', profile.id, {
        availabilitySlots: updatedSlots
      });
    }

    db.update<Session>('sessions', rejectingSession.id, {
      status: 'rejected',
      escrowStatus: 'refunded',
      providerRejectionReason: rejectReason.trim() || 'Schedule conflict'
    });

    createNotification(
      rejectingSession.requesterId,
      `${currentUser.name} was unable to accept your session request. Escrow has been 100% refunded.`,
      currentUser.name,
      rejectingSession.id
    );

    setRejectingSession(null);
    setRejectReason('');
  };

  // Propose online instead
  const handleProposeOnline = (session: Session) => {
    db.update<Session>('sessions', session.id, {
      status: 'awaiting_founder_response'
    });

    createNotification(
      session.requesterId,
      `${currentUser.name} proposed conducting your session online instead of offline. Please confirm or decline.`,
      currentUser.name,
      session.id
    );
  };

  // Submit Teardown Memo
  const handleSubmitTeardownMemo = () => {
    if (!completingSession) return;
    setMemoError('');

    if (nextSteps.trim().length < 20) {
      setMemoError('Next Steps must be at least 20 characters.');
      return;
    }
    if (competitiveMoat.trim().length < 20) {
      setMemoError('Competitive Moat must be at least 20 characters.');
      return;
    }
    if (biggestRisk.trim().length < 20) {
      setMemoError('Biggest Risk / Blindspot must be at least 20 characters.');
      return;
    }

    db.update<Session>('sessions', completingSession.id, {
      status: 'pending_finance_review',
      teardownMemo: {
        nextSteps: nextSteps.trim(),
        competitiveMoat: competitiveMoat.trim(),
        biggestRisk: biggestRisk.trim(),
        submittedAt: new Date().toISOString()
      }
    });

    // Notify Finance Admin
    createNotification(
      'user_finance_admin',
      `Teardown memo submitted by ${currentUser.name} for session ${completingSession.id}. Awaiting payout approval.`,
      currentUser.name,
      completingSession.id
    );

    setCompletingSession(null);
    setNextSteps('');
    setCompetitiveMoat('');
    setBiggestRisk('');
  };

  // Request Withdrawal
  const handleRequestWithdrawal = () => {
    if (!profile) return;
    setWithdrawError('');
    setWithdrawSuccess('');

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawError('Please enter a valid amount.');
      return;
    }
    if (amt > profile.walletBalance) {
      setWithdrawError(`Amount cannot exceed current wallet balance of ₹${profile.walletBalance.toLocaleString('en-IN')}.`);
      return;
    }
    if (!withdrawDetails.trim()) {
      setWithdrawError('Bank account details or UPI ID is required.');
      return;
    }

    db.add<WithdrawalRequest>('withdrawalRequests', {
      id: `wdr_${Date.now()}`,
      userId: currentUser.uid,
      userName: currentUser.name,
      userRole: profile.type,
      amount: amt,
      bankOrUpiDetails: withdrawDetails.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString()
    });

    // Notify Finance Admin
    createNotification(
      'user_finance_admin',
      `New withdrawal request of ₹${amt.toLocaleString('en-IN')} submitted by ${currentUser.name}.`,
      currentUser.name
    );

    setWithdrawSuccess('Withdrawal request submitted! Finance team will verify and transfer funds.');
    setWithdrawAmount('');
    setWithdrawDetails('');
    setTimeout(() => setWithdrawSuccess(''), 4000);
  };

  // Apply to Become an Advisor questionnaire submit
  const handleApplyAdvisor = () => {
    setAdvisorError('');
    setAdvisorSuccess('');

    if (whyAdvise.trim().length < 30) {
      setAdvisorError('Please explain why you want to advise (minimum 30 characters).');
      return;
    }
    if (advisorSectors.length === 0) {
      setAdvisorError('Please select at least 1 sector of expertise.');
      return;
    }

    db.add<AdvisorApplication>('advisorApplications', {
      id: `adv_app_${Date.now()}`,
      userId: currentUser.uid,
      userName: currentUser.name,
      userEmail: currentUser.email,
      questionnaireResponses: {
        whyAdvise: whyAdvise.trim(),
        sectorsOfExpertise: advisorSectors,
        availability: advisorAvailability
      },
      status: 'pending',
      submittedAt: new Date().toISOString()
    });

    createNotification(
      'user_ops_admin',
      `Mentor ${currentUser.name} applied to become a Board Advisor. Application awaiting review.`,
      currentUser.name
    );

    setAdvisorSuccess('Advisor application submitted! Operations Admin will review your credentials.');
  };

  const handleOpenFounderProfile = (founderEmail: string) => {
    const user = db.get<User>('users').find(u => u.email === founderEmail);
    if (user) {
      setSelectedFounder(user);
    }
  };

  if (!profile) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
        <p className="text-gray-500 text-xs">Loading provider suite...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">{profile.name}</h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/40 text-purple-200 border border-purple-400/30 capitalize">
                  {profile.type === 'investor' ? `Tier ${profile.tier} Investor` : 'Verified Mentor'}
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-1 max-w-xl leading-relaxed">
                Dynamic session charge cap: <strong className="text-white">₹{profile.maxChargeCap.toLocaleString('en-IN')}</strong>. 
                {profile.type === 'investor' 
                  ? ` Upgrades auto-computed per 500 transferred credits.` 
                  : ` Cap scales auto-computed via completed sessions & reputation.`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right px-4 py-2 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
                <span className="text-[10px] text-purple-200 uppercase font-semibold block">Available Wallet</span>
                <span className="text-lg font-black text-amber-300">₹{profile.walletBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Stat Cards Grid (Tinted lavender & pink per Section 3) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-[#EEF2FF] p-4 rounded-2xl border border-indigo-100 space-y-1">
              <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Incoming Requests</span>
              <p className="text-2xl font-black text-indigo-950">{incomingRequests.length}</p>
              <p className="text-[10px] text-indigo-600">Pending your review</p>
            </div>

            <div className="bg-[#FDF2F8] p-4 rounded-2xl border border-pink-100 space-y-1">
              <span className="text-[10px] text-pink-700 font-bold uppercase tracking-wider">Scheduled Sessions</span>
              <p className="text-2xl font-black text-pink-950">{upcomingSessions.length}</p>
              <p className="text-[10px] text-pink-600">Upcoming calendar</p>
            </div>

            <div className="bg-[#EEF2FF] p-4 rounded-2xl border border-indigo-100 space-y-1">
              <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Completed Sessions</span>
              <p className="text-2xl font-black text-indigo-950">{profile.sessionsCompleted}</p>
              <p className="text-[10px] text-indigo-600">Verified & paid out</p>
            </div>

            <div className="bg-[#FDF2F8] p-4 rounded-2xl border border-pink-100 space-y-1">
              <span className="text-[10px] text-pink-700 font-bold uppercase tracking-wider">Current Cap / Tier</span>
              <p className="text-xl font-black text-pink-950">₹{profile.maxChargeCap.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-pink-600">
                {profile.type === 'investor' ? `Tier ${profile.tier}` : 'Reputation Cap'}
              </p>
            </div>

            <div className="bg-[#EEF2FF] p-4 rounded-2xl border border-indigo-100 space-y-1 col-span-2 lg:col-span-1">
              <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Average Rating</span>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-2xl font-black text-indigo-950">{profile.averageRating}</span>
              </div>
              <p className="text-[10px] text-indigo-600">{profile.totalRatings} founder reviews</p>
            </div>
          </div>

          {/* Quick Action Tables: Incoming Requests & Upcoming */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Incoming Requests Box */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-purple-600" />
                  Incoming Session Requests ({incomingRequests.length})
                </h3>
              </div>

              {incomingRequests.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No pending session requests.</p>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map(s => (
                    <div key={s.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{s.requesterName}</span>
                        <span className="text-purple-700 font-bold">₹{s.priceCharged.toLocaleString('en-IN')} held in escrow</span>
                      </div>
                      <p className="text-gray-600 line-clamp-2 italic">"{s.pitchText}"</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-gray-500">{s.slotDetails.date} • {s.slotDetails.time}</span>
                        <button
                          onClick={() => handleAcceptRequest(s)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg transition"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Sessions Box */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Upcoming Confirmed Sessions ({upcomingSessions.length})
                </h3>
              </div>

              {upcomingSessions.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No upcoming sessions scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map(s => (
                    <div key={s.id} className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{s.requesterName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold uppercase">
                          {s.mode}
                        </span>
                      </div>
                      <p className="text-gray-600">{s.slotDetails.date} • {s.slotDetails.time}</p>
                      <button
                        onClick={() => {
                          setCompletingSession(s);
                          setNextSteps('');
                          setCompetitiveMoat('');
                          setBiggestRisk('');
                        }}
                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition"
                      >
                        Mark Complete & Submit Teardown Memo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* INCOMING REQUESTS TAB */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <h2 className="text-xl font-black text-gray-900">Incoming Founder Requests</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review pitch descriptions, pitch decks, founder credentials, and decide to accept, reject, or propose online.
            </p>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700">No incoming requests</h3>
              <p className="text-xs text-gray-400 mt-1">Make sure you have open availability slots added to receive bookings.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map(s => (
                <div
                  key={s.id}
                  id={`incoming-card-${s.id}`}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">{s.requesterName}</h3>
                        <span className="text-xs text-gray-500">{s.requesterEmail}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Requested: {s.slotDetails.date} • {s.slotDetails.time} • <strong className="capitalize text-purple-700">{s.mode}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Escrow Secured</span>
                      <span className="text-base font-black text-purple-700">₹{s.priceCharged.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Pitch and Links */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 leading-relaxed">
                      <span className="font-bold text-gray-900 block mb-1">Founder Pitch:</span>
                      {s.pitchText}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      {s.pitchDeckUrl && (
                        <a
                          href={s.pitchDeckUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-purple-700 hover:text-purple-900 font-bold bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View Deck ({s.pitchDeckFileName || 'Deck.pdf'})</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      <button
                        onClick={() => handleOpenFounderProfile(s.requesterEmail)}
                        className="inline-flex items-center gap-1.5 text-gray-700 hover:text-gray-900 font-semibold bg-gray-100 px-3 py-1.5 rounded-lg"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>View Founder Profile</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons: Accept, Reject, Propose Online */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      id={`btn-accept-${s.id}`}
                      onClick={() => handleAcceptRequest(s)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      Accept Request
                    </button>

                    <button
                      id={`btn-reject-${s.id}`}
                      onClick={() => {
                        setRejectingSession(s);
                        setRejectReason('');
                      }}
                      className="px-4 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl transition"
                    >
                      Reject Request (Refund Founder)
                    </button>

                    {s.mode === 'offline' && (
                      <button
                        id={`btn-propose-online-${s.id}`}
                        onClick={() => handleProposeOnline(s)}
                        className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl transition"
                      >
                        Propose Online Instead
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* SCHEDULED SESSIONS TAB */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <h2 className="text-xl font-black text-gray-900">Scheduled Sessions & Teardown Reviews</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Conduct sessions, submit mandatory Teardown Memos to release escrow, and review finance audit statuses.
            </p>
          </div>

          {/* Upcoming Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Upcoming Scheduled Sessions ({upcomingSessions.length})
            </h3>

            {upcomingSessions.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center text-xs text-gray-400">
                No active upcoming sessions.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{s.requesterName}</h4>
                      <p className="text-xs text-gray-500">
                        {s.slotDetails.date} • {s.slotDetails.time} • <span className="capitalize font-semibold text-purple-700">{s.mode}</span>
                        {s.slotDetails.location && ` (${s.slotDetails.location})`}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 max-w-xl truncate">"{s.pitchText}"</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id={`btn-complete-memo-${s.id}`}
                        onClick={() => {
                          setCompletingSession(s);
                          setNextSteps('');
                          setCompetitiveMoat('');
                          setBiggestRisk('');
                          setMemoError('');
                        }}
                        className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl shadow-xs transition"
                      >
                        Mark Complete & Submit Teardown Memo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Awaiting Payout Section */}
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Completed — Awaiting Finance Review ({awaitingPayout.length})
            </h3>

            {awaitingPayout.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center text-xs text-gray-400">
                No sessions currently in finance review queue.
              </div>
            ) : (
              <div className="space-y-3">
                {awaitingPayout.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{s.requesterName}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.status === 'memo_rejected' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {s.status === 'memo_rejected' ? 'Revision Requested by Finance' : 'Pending Finance Sign-Off'}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-purple-700">₹{s.priceCharged.toLocaleString('en-IN')}</span>
                    </div>

                    {s.financeReviewNote && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                        <span className="font-bold block">Finance Admin Audit Note:</span>
                        <p>{s.financeReviewNote}</p>
                      </div>
                    )}

                    {s.teardownMemo && (
                      <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1 text-gray-700">
                        <p><strong className="text-gray-900">Next Steps:</strong> {s.teardownMemo.nextSteps}</p>
                        <p><strong className="text-gray-900">Moat:</strong> {s.teardownMemo.competitiveMoat}</p>
                        <p><strong className="text-gray-900">Risk:</strong> {s.teardownMemo.biggestRisk}</p>
                      </div>
                    )}

                    {s.status === 'memo_rejected' && (
                      <button
                        onClick={() => {
                          setCompletingSession(s);
                          setNextSteps(s.teardownMemo?.nextSteps || '');
                          setCompetitiveMoat(s.teardownMemo?.competitiveMoat || '');
                          setBiggestRisk(s.teardownMemo?.biggestRisk || '');
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition"
                      >
                        Revise & Resubmit Teardown Memo
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* AVAILABILITY SLOTS TAB */}
      {activeTab === 'slots' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">Availability & Slots Management</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage your open slots. Unbooked slots can be deleted; booked slots remain locked in escrow.
              </p>
            </div>
            <button
              id="btn-open-add-slot"
              onClick={() => setShowAddSlot(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Slot
            </button>
          </div>

          {/* Slots List */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            {profile.availabilitySlots.length === 0 ? (
              <div className="p-10 text-center text-xs text-gray-400">
                No slots configured yet. Click "Add Slot" above.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Time Range</th>
                    <th className="p-3.5">Mode</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {profile.availabilitySlots.map(slot => (
                    <tr key={slot.id} className="hover:bg-gray-50/50">
                      <td className="p-3.5 font-semibold text-gray-800">{slot.date}</td>
                      <td className="p-3.5 text-gray-600">{slot.time}</td>
                      <td className="p-3.5">
                        <span className="capitalize font-semibold text-purple-700">{slot.mode}</span>
                        {slot.location && <span className="text-gray-400 block text-[10px]">{slot.location}</span>}
                      </td>
                      <td className="p-3.5">
                        {slot.isBooked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            Booked / Locked
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Open
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {!slot.isBooked && (
                          <button
                            id={`btn-delete-slot-${slot.id}`}
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Delete Slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* WALLET & WITHDRAWALS TAB */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <h2 className="text-xl font-black text-gray-900">Wallet & Earnings Payout</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Escrow releases from approved teardown memos accumulate here. Request bank or UPI payouts anytime.
            </p>
          </div>

          {/* Wallet Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-700 to-indigo-800 p-5 rounded-2xl text-white shadow-xs">
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider block">Available Balance</span>
              <p className="text-3xl font-black mt-1">₹{profile.walletBalance.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-purple-200 mt-2">Ready for instant withdrawal request</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Lifetime Earnings</span>
              <p className="text-3xl font-black text-gray-900 mt-1">₹{profile.lifetimeEarnings.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-emerald-600 mt-2 font-semibold">100% verified platform payouts</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Completed Sessions</span>
              <p className="text-3xl font-black text-gray-900 mt-1">{profile.sessionsCompleted}</p>
              <p className="text-[11px] text-purple-600 mt-2 font-semibold">Teardown memos approved</p>
            </div>
          </div>

          {/* Request Withdrawal Form Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 max-w-xl">
            <h3 className="text-base font-bold text-gray-900">Request Payout Withdrawal</h3>

            {withdrawSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Amount to Withdraw (₹) * (Max ₹{profile.walletBalance.toLocaleString('en-IN')})
              </label>
              <input
                id="input-withdraw-amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="e.g. 25000"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Bank Account or UPI Details *
              </label>
              <input
                id="input-withdraw-details"
                type="text"
                value={withdrawDetails}
                onChange={(e) => setWithdrawDetails(e.target.value)}
                placeholder="e.g. HDFC A/C: 5010029384928, IFSC: HDFC0000128 or name@okhdfcbank"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {withdrawError && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            <button
              id="btn-submit-withdrawal"
              onClick={handleRequestWithdrawal}
              disabled={profile.walletBalance <= 0}
              className="py-2.5 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Submit Withdrawal Request
            </button>
          </div>

          {/* Withdrawal History Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs space-y-3 p-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Withdrawal History</h3>
            {withdrawals.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No past withdrawals requested.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Details</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawals.map(w => (
                    <tr key={w.id}>
                      <td className="p-3 text-gray-600">{new Date(w.requestedAt).toLocaleDateString()}</td>
                      <td className="p-3 font-bold text-gray-900">₹{w.amount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-gray-600">{w.bankOrUpiDetails}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          w.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : (w.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')
                        }`}>
                          {w.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* APPLY AS ADVISOR TAB (Only for mentors) */}
      {activeTab === 'advisor_app' && profile.type === 'mentor' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4 max-w-xl">
          <div className="flex items-center gap-2 text-purple-700">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900">Apply to Become a Board Advisor</h2>
          </div>
          <p className="text-xs text-gray-500">
            Approved advisors are matched directly onto early-stage startup advisory boards and receive equity allocations.
          </p>

          {advisorApp ? (
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">Application Status:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  advisorApp.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {advisorApp.status.toUpperCase()}
                </span>
              </div>
              <p>Submitted on: {new Date(advisorApp.submittedAt).toLocaleDateString()}</p>
              <p>Reason: "{advisorApp.questionnaireResponses.whyAdvise}"</p>
              {advisorApp.status === 'approved' && (
                <p className="font-semibold text-emerald-700 pt-1">
                  You are an approved Advisor! You can now switch to Advisor View via the role switcher in the header!
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {advisorSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
                  {advisorSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Why do you want to advise early-stage startup boards? * (min 30 chars)
                </label>
                <textarea
                  id="input-why-advise"
                  rows={3}
                  value={whyAdvise}
                  onChange={(e) => setWhyAdvise(e.target.value)}
                  placeholder="Explain your strategic advisory philosophy and track record..."
                  className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sectors of Strategic Expertise *
                </label>
                <div className="flex flex-wrap gap-1">
                  {profile.sectorsOrExpertiseTags.map(tag => {
                    const isSelected = advisorSectors.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) setAdvisorSectors(advisorSectors.filter(t => t !== tag));
                          else setAdvisorSectors([...advisorSectors, tag]);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition ${
                          isSelected ? 'bg-purple-600 text-white border-purple-600 font-bold' : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Monthly Availability for Board Meetings
                </label>
                <select
                  value={advisorAvailability}
                  onChange={(e) => setAdvisorAvailability(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none bg-white"
                >
                  <option value="2-4 hours/month">2-4 hours / month (Quarterly board calls + monthly sync)</option>
                  <option value="4-6 hours/month">4-6 hours / month (Bi-weekly advisory syncs)</option>
                  <option value="6+ hours/month">6+ hours / month (Hands-on strategic coaching)</option>
                </select>
              </div>

              {advisorError && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs">
                  {advisorError}
                </div>
              )}

              <button
                id="btn-submit-advisor-app"
                onClick={handleApplyAdvisor}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Submit Advisor Application
              </button>
            </div>
          )}
        </div>
      )}

      {/* TEARDOWN MEMO SUBMISSION MODAL */}
      {completingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 p-6 space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">Mandatory Teardown Memo</h3>
                <p className="text-xs text-purple-600 font-semibold">
                  Founder: {completingSession.requesterName} • Escrow Payout: ₹{completingSession.priceCharged.toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => setCompletingSession(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 text-xs pr-1">
              <p className="text-gray-500 bg-purple-50 p-2.5 rounded-xl text-[11px] border border-purple-100">
                All three fields are required with at least 20 characters each. Finance Admin reviews this before releasing escrow.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  1. Concrete Next Steps * (min 20 chars)
                </label>
                <textarea
                  id="input-memo-next-steps"
                  rows={2}
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  placeholder="e.g. Conduct 5 stress tests under real solar fluctuations before beginning tooling..."
                  className="w-full p-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  2. Biggest Competitive Moat * (min 20 chars)
                </label>
                <textarea
                  id="input-memo-moat"
                  rows={2}
                  value={competitiveMoat}
                  onChange={(e) => setCompetitiveMoat(e.target.value)}
                  placeholder="e.g. Proprietary carbon nanotube thermal membrane reducing fouling by 65%..."
                  className="w-full p-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  3. Biggest Risk / Blindspot * (min 20 chars)
                </label>
                <textarea
                  id="input-memo-risk"
                  rows={2}
                  value={biggestRisk}
                  onChange={(e) => setBiggestRisk(e.target.value)}
                  placeholder="e.g. Distributor dependency in remote rural panchayats and high membrane replacement cost..."
                  className="w-full p-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {memoError && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{memoError}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setCompletingSession(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id="btn-submit-teardown-memo"
                onClick={handleSubmitTeardownMemo}
                className="flex-1 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Submit Memo for Finance Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT REQUEST MODAL */}
      {rejectingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Decline Session Request</h3>
              <button onClick={() => setRejectingSession(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Rejecting this request will immediately refund 100% of the held escrow (₹{rejectingSession.priceCharged.toLocaleString('en-IN')}) back to {rejectingSession.requesterName} and reopen your slot.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Optional Reason / Feedback</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Seeking ventures outside my primary domain focus..."
                className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRejectingSession(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-reject-request"
                onClick={handleConfirmReject}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Confirm Rejection & Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD AVAILABILITY SLOT MODAL */}
      {showAddSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Add Availability Slot</h3>
              <button onClick={() => setShowAddSlot(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Date *</label>
                <input
                  id="input-slot-date"
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Time Range *</label>
                <input
                  id="input-slot-time"
                  type="text"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  placeholder="e.g. 10:00 AM - 11:00 AM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Mode *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSlotMode('online')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      slotMode === 'online' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Online (Video)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotMode('offline')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      slotMode === 'offline' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Offline (In-Person)
                  </button>
                </div>
              </div>

              {slotMode === 'offline' && (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Physical Location Address *</label>
                  <input
                    id="input-slot-location"
                    type="text"
                    value={slotLocation}
                    onChange={(e) => setSlotLocation(e.target.value)}
                    placeholder="e.g. WeWork Galaxy, Residency Rd, Bangalore"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              )}

              {slotError && (
                <div className="p-2 bg-red-50 text-red-700 rounded-lg">
                  {slotError}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddSlot(false)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id="btn-save-slot"
                onClick={handleAddSlot}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Save Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOUNDER PROFILE PREVIEW MODAL */}
      {selectedFounder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Founder Profile</h3>
              <button onClick={() => setSelectedFounder(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p><span className="font-bold text-gray-700">Name:</span> {selectedFounder.name}</p>
              <p><span className="font-bold text-gray-700">Email:</span> {selectedFounder.email}</p>
              <p><span className="font-bold text-gray-700">Role:</span> <span className="capitalize font-semibold text-purple-700">{selectedFounder.role.replace('_', ' ')}</span></p>
              {selectedFounder.bio && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700">
                  <span className="font-bold block mb-1">Founder Bio:</span>
                  {selectedFounder.bio}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedFounder(null)}
              className="w-full py-2 bg-gray-800 text-white font-bold text-xs rounded-xl hover:bg-gray-900 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
