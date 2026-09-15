import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  Calendar, 
  Clock, 
  MapPin, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  X, 
  Download, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Users,
  Award,
  Sparkles
} from 'lucide-react';
import { 
  User, 
  YancMember, 
  InvestorMentorProfile, 
  Session, 
  AdvisoryBoardRequest, 
  AdvisorSwapRequest, 
  AvailabilitySlot,
  PaymentTransactionReceipt
} from '../types';
import { db, fileStorage, createNotification } from '../services/db';
import { PaymentModal } from '../components/PaymentModal';
import { ReceiptModal } from '../components/ReceiptModal';

interface MemberViewProps {
  currentUser: User;
  activeTab: string;
}

const SECTORS_LIST = [
  'FinTech',
  'CleanTech',
  'DeepTech',
  'AI & ML',
  'D2C',
  'Consumer Tech',
  'B2B SaaS',
  'Enterprise Tech',
  'HealthTech',
  'Agritech',
  'Hardware',
  'Legal & IP',
  'Growth Marketing',
  'System Architecture'
];

export const MemberView: React.FC<MemberViewProps> = ({ currentUser, activeTab }) => {
  // Directory state
  const [profiles, setProfiles] = useState<InvestorMentorProfile[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [advisoryBoards, setAdvisoryBoards] = useState<AdvisoryBoardRequest[]>([]);
  const [swapRequests, setSwapRequests] = useState<AdvisorSwapRequest[]>([]);
  const [yancMember, setYancMember] = useState<YancMember | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | ''>('');
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');

  // Selected Profile for "View Profile" Modal
  const [selectedProfile, setSelectedProfile] = useState<InvestorMentorProfile | null>(null);

  // Book Session Modal state
  const [bookingProfile, setBookingProfile] = useState<InvestorMentorProfile | null>(null);
  const [pitchText, setPitchText] = useState('');
  const [askAmount, setAskAmount] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [sessionMode, setSessionMode] = useState<'online' | 'offline'>('online');
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDeckUrl, setUploadedDeckUrl] = useState('');
  const [uploadedDeckName, setUploadedDeckName] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<{
    itemTitle: string;
    amountInr: number;
    beneficiaryName: string;
    onSuccessAction: (details: any) => void;
  } | null>(null);

  // Rating Modal
  const [ratingSession, setRatingSession] = useState<Session | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Swap Request Modal
  const [swapTarget, setSwapTarget] = useState<{
    boardId: string;
    advisorId: string;
    advisorName: string;
  } | null>(null);
  const [swapReason, setSwapReason] = useState('');
  const [swapError, setSwapError] = useState('');

  // Advisory Board Request Form
  const [advisoryPitch, setAdvisoryPitch] = useState('');
  const [selectedIndustryTags, setSelectedIndustryTags] = useState<string[]>([]);
  const [advisoryFormError, setAdvisoryFormError] = useState('');

  // Receipt Modal
  const [viewReceipt, setViewReceipt] = useState<PaymentTransactionReceipt | null>(null);

  // Load Firestore data
  useEffect(() => {
    const unsubProfiles = db.subscribe<InvestorMentorProfile>('investorMentorProfiles', (all) => {
      setProfiles(all.filter(p => p.applicationStatus === 'approved'));
    });

    const unsubSessions = db.subscribe<Session>('sessions', (all) => {
      setSessions(all.filter(s => s.requesterId === currentUser.uid || s.requesterEmail === currentUser.email));
    });

    const unsubAdvisory = db.subscribe<AdvisoryBoardRequest>('advisoryBoardRequests', (all) => {
      setAdvisoryBoards(all.filter(b => b.founderId === currentUser.uid || b.founderEmail === currentUser.email));
    });

    const unsubSwaps = db.subscribe<AdvisorSwapRequest>('advisorSwapRequests', (all) => {
      setSwapRequests(all.filter(r => r.founderId === currentUser.uid));
    });

    const unsubMember = db.subscribe<YancMember>('yancMembers', (all) => {
      const found = all.find(m => m.email === currentUser.email);
      setYancMember(found || null);
    });

    return () => {
      unsubProfiles();
      unsubSessions();
      unsubAdvisory();
      unsubSwaps();
      unsubMember();
    };
  }, [currentUser]);

  // Filtered providers
  const isMentorTab = activeTab === 'mentors';
  const directoryType = isMentorTab ? 'mentor' : 'investor';

  const filteredProfiles = profiles.filter(p => {
    if (p.type !== directoryType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBio = (p.bio || '').toLowerCase().includes(q);
      const matchTags = p.sectorsOrExpertiseTags.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchBio && !matchTags) return false;
    }
    if (sectorFilter !== 'all') {
      if (!p.sectorsOrExpertiseTags.includes(sectorFilter)) return false;
    }
    if (maxPriceFilter !== '') {
      if (p.maxChargeCap > maxPriceFilter) return false;
    }
    if (ratingFilter !== '') {
      if (p.averageRating < ratingFilter) return false;
    }
    return true;
  }).sort((a, b) => b.averageRating - a.averageRating);

  // File upload handler
  const handleDeckUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBookingError('');
    setUploadingDeck(true);
    setUploadProgress(10);

    try {
      const result = await fileStorage.uploadPitchDeck(file, (percent) => {
        setUploadProgress(percent);
      });
      setUploadedDeckUrl(result.url);
      setUploadedDeckName(result.fileName);
    } catch (err: any) {
      setBookingError(err.message || 'File upload failed');
    } finally {
      setUploadingDeck(false);
    }
  };

  // Start booking session flow
  const handleOpenBooking = (profile: InvestorMentorProfile) => {
    setBookingProfile(profile);
    setPitchText('');
    setAskAmount(profile.maxChargeCap.toString());
    setSelectedSlotId(profile.availabilitySlots.find(s => !s.isBooked)?.id || '');
    setUploadedDeckUrl('');
    setUploadedDeckName('');
    setBookingError('');
    setSessionMode('online');
  };

  const handleProceedToPayment = () => {
    if (!bookingProfile) return;
    setBookingError('');

    // Validation
    if (pitchText.trim().length < 50) {
      setBookingError('Pitch text is required and must be at least 50 characters.');
      return;
    }
    if (!uploadedDeckUrl) {
      setBookingError('Pitch deck upload is required (.pdf, .ppt, .pptx).');
      return;
    }
    const askNum = parseFloat(askAmount);
    if (isNaN(askNum) || askNum <= 0) {
      setBookingError('Amount sought must be greater than 0.');
      return;
    }
    if (askNum > bookingProfile.maxChargeCap) {
      setBookingError(`Amount exceeds provider's current cap of ₹${bookingProfile.maxChargeCap.toLocaleString('en-IN')}.`);
      return;
    }
    if (!selectedSlotId) {
      setBookingError('Please select an open availability slot.');
      return;
    }

    const chosenSlot = bookingProfile.availabilitySlots.find(s => s.id === selectedSlotId);
    if (!chosenSlot || chosenSlot.isBooked) {
      setBookingError('Selected slot is no longer available. Please choose another slot.');
      return;
    }

    // Open simulated payment gateway
    setPaymentConfig({
      itemTitle: `Mentorship / Advisory Session with ${bookingProfile.name}`,
      amountInr: askNum,
      beneficiaryName: bookingProfile.name,
      onSuccessAction: (details) => {
        // 1. Lock the slot immediately!
        const updatedSlots = bookingProfile.availabilitySlots.map(s => 
          s.id === selectedSlotId ? { ...s, isBooked: true } : s
        );
        db.update<InvestorMentorProfile>('investorMentorProfiles', bookingProfile.id, {
          availabilitySlots: updatedSlots
        });

        // 2. If paid in credits, deduct from member balance and log ledger
        if (details.paymentMethod === 'credits' && yancMember) {
          const newCreditBal = Math.max(0, yancMember.creditBalance - (details.creditsUsed || 0));
          db.update<YancMember>('yancMembers', yancMember.email, {
            creditBalance: newCreditBal
          }, 'email');

          db.add('creditsLedger', {
            id: `cld_${Date.now()}`,
            userId: currentUser.uid,
            amount: details.creditsUsed || 0,
            type: 'spent',
            note: `Session booked with ${bookingProfile.name}`,
            timestamp: new Date().toISOString()
          });
        }

        // 3. Create Session doc in Firestore
        const newSession = db.add<Session>('sessions', {
          id: `sess_${Date.now()}`,
          requesterId: currentUser.uid,
          requesterName: currentUser.name,
          requesterEmail: currentUser.email,
          providerId: bookingProfile.id,
          providerName: bookingProfile.name,
          providerRole: bookingProfile.type,
          mode: sessionMode,
          slotId: selectedSlotId,
          slotDetails: {
            date: chosenSlot.date,
            time: chosenSlot.time,
            location: chosenSlot.location
          },
          pitchText: pitchText.trim(),
          pitchDeckUrl: uploadedDeckUrl,
          pitchDeckFileName: uploadedDeckName,
          askAmount: askNum,
          priceCharged: askNum,
          creditsPaid: details.creditsUsed || 0,
          paymentMethod: details.paymentMethod,
          status: 'pending_provider_review',
          escrowAmount: askNum,
          escrowStatus: 'held',
          createdAt: new Date().toISOString()
        });

        // 4. Notify Provider matching Section 17
        createNotification(
          bookingProfile.userId,
          `New session request from ${currentUser.name}. Escrow held: ₹${askNum.toLocaleString('en-IN')}.`,
          currentUser.name,
          newSession.id
        );

        setBookingProfile(null);
      }
    });

    setShowPaymentModal(true);
  };

  // Founder cancel pending request
  const handleCancelSession = (session: Session) => {
    if (session.status !== 'pending_provider_review') return;
    
    // Refund credits or cash
    if (session.paymentMethod === 'credits' && session.creditsPaid && yancMember) {
      db.update<YancMember>('yancMembers', yancMember.email, {
        creditBalance: yancMember.creditBalance + session.creditsPaid
      }, 'email');

      db.add('creditsLedger', {
        id: `cld_${Date.now()}`,
        userId: currentUser.uid,
        amount: session.creditsPaid,
        type: 'earned',
        note: `Refund for cancelled session ${session.id}`,
        timestamp: new Date().toISOString()
      });
    }

    // Reopen slot
    const provider = db.getDoc<InvestorMentorProfile>('investorMentorProfiles', 'id', session.providerId);
    if (provider) {
      const updatedSlots = provider.availabilitySlots.map(s => 
        s.id === session.slotId ? { ...s, isBooked: false } : s
      );
      db.update<InvestorMentorProfile>('investorMentorProfiles', provider.id, {
        availabilitySlots: updatedSlots
      });
    }

    db.update<Session>('sessions', session.id, {
      status: 'cancelled',
      escrowStatus: 'refunded'
    });

    // Notify provider
    const provProfile = profiles.find(p => p.id === session.providerId);
    if (provProfile) {
      createNotification(
        provProfile.userId,
        `${currentUser.name} cancelled their pending session request. Slot reopened.`,
        currentUser.name,
        session.id
      );
    }
  };

  // Offline to Online proposed response
  const handleRespondToOnlineProposal = (session: Session, accept: boolean) => {
    if (accept) {
      // Founder accepts online mode
      db.update<Session>('sessions', session.id, {
        status: 'accepted',
        mode: 'online'
      });

      const provProfile = profiles.find(p => p.id === session.providerId);
      if (provProfile) {
        createNotification(
          provProfile.userId,
          `${currentUser.name} accepted switching your session to Online mode.`,
          currentUser.name,
          session.id
        );
      }
    } else {
      // Founder declines: full refund and cancel
      if (session.paymentMethod === 'credits' && session.creditsPaid && yancMember) {
        db.update<YancMember>('yancMembers', yancMember.email, {
          creditBalance: yancMember.creditBalance + session.creditsPaid
        }, 'email');

        db.add('creditsLedger', {
          id: `cld_${Date.now()}`,
          userId: currentUser.uid,
          amount: session.creditsPaid,
          type: 'earned',
          note: `Refund for declined online session switch ${session.id}`,
          timestamp: new Date().toISOString()
        });
      }

      // Reopen slot
      const provider = db.getDoc<InvestorMentorProfile>('investorMentorProfiles', 'id', session.providerId);
      if (provider) {
        const updatedSlots = provider.availabilitySlots.map(s => 
          s.id === session.slotId ? { ...s, isBooked: false } : s
        );
        db.update<InvestorMentorProfile>('investorMentorProfiles', provider.id, {
          availabilitySlots: updatedSlots
        });
      }

      db.update<Session>('sessions', session.id, {
        status: 'cancelled',
        escrowStatus: 'refunded'
      });

      const provProfile = profiles.find(p => p.id === session.providerId);
      if (provProfile) {
        createNotification(
          provProfile.userId,
          `${currentUser.name} declined switching to online. Session cancelled and escrow refunded.`,
          currentUser.name,
          session.id
        );
      }
    }
  };

  // Founder Rating Submission (Section 11)
  const handleSubmitRating = () => {
    if (!ratingSession) return;
    setRatingSubmitting(true);

    // 1. Update session
    db.update<Session>('sessions', ratingSession.id, {
      founderRating: ratingStars,
      founderReviewText: reviewText.trim()
    });

    // 2. Recalculate provider average rating & reviews
    const provider = db.getDoc<InvestorMentorProfile>('investorMentorProfiles', 'id', ratingSession.providerId);
    if (provider) {
      const currentTotal = provider.totalRatings || 0;
      const currentAvg = provider.averageRating || 5.0;
      const newTotal = currentTotal + 1;
      const newAvg = parseFloat(((currentAvg * currentTotal + ratingStars) / newTotal).toFixed(1));

      const newReview = reviewText.trim() ? {
        founderName: currentUser.name,
        rating: ratingStars,
        text: reviewText.trim(),
        date: new Date().toISOString().split('T')[0]
      } : null;

      const currentReviews = provider.reviews || [];
      const updatedReviews = newReview ? [newReview, ...currentReviews] : currentReviews;

      db.update<InvestorMentorProfile>('investorMentorProfiles', provider.id, {
        averageRating: newAvg,
        totalRatings: newTotal,
        reviews: updatedReviews
      });
    }

    setRatingSubmitting(false);
    setRatingSession(null);
  };

  // Submit Advisory Board Request
  const handleSubmitAdvisoryRequest = () => {
    setAdvisoryFormError('');
    if (advisoryPitch.trim().length < 50) {
      setAdvisoryFormError('Pitch summary must be at least 50 characters.');
      return;
    }
    if (selectedIndustryTags.length === 0 || selectedIndustryTags.length > 3) {
      setAdvisoryFormError('Please select between 1 and 3 industry tags.');
      return;
    }

    const packageCost = 180000; // Yearly package ₹1,80,000

    setPaymentConfig({
      itemTitle: 'Yearly Advisory Board Package',
      amountInr: packageCost,
      beneficiaryName: 'YANC Connect Advisory Board Program',
      onSuccessAction: (details) => {
        // Run matching algorithm per Section 12:
        // score = count of overlapping tags between founder industryTags and advisor's expertise tags
        const allAdvisorApps = db.get('advisorApplications') as any[];
        const approvedAdvisorUserIds = allAdvisorApps
          .filter(a => a.status === 'approved')
          .map(a => a.userId);

        const allMentorProfiles = db.get<InvestorMentorProfile>('investorMentorProfiles');
        const candidateProfiles = allMentorProfiles.filter(p => approvedAdvisorUserIds.includes(p.userId));

        // Score candidates
        const scored = candidateProfiles.map(cand => {
          const overlapCount = cand.sectorsOrExpertiseTags.filter(tag => 
            selectedIndustryTags.includes(tag)
          ).length;
          return {
            id: cand.id,
            userId: cand.userId,
            score: overlapCount,
            sessionsCompleted: cand.sessionsCompleted
          };
        });

        // Sort by score desc, tiebreaker sessionsCompleted desc
        scored.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.sessionsCompleted - a.sessionsCompleted;
        });

        const top5AdvisorIds = scored.slice(0, 5).map(s => s.id);

        db.add<AdvisoryBoardRequest>('advisoryBoardRequests', {
          id: `adv_board_${Date.now()}`,
          founderId: currentUser.uid,
          founderName: currentUser.name,
          founderEmail: currentUser.email,
          pitchSummary: advisoryPitch.trim(),
          industryTags: selectedIndustryTags,
          status: 'awaiting_admin_approval',
          suggestedAdvisorIds: top5AdvisorIds,
          finalAdvisors: [],
          yearlyPackageCost: packageCost,
          packagePaymentStatus: 'paid',
          createdAt: new Date().toISOString()
        });

        // Notify Ops Admin
        createNotification(
          'user_ops_admin',
          `New Advisory Board requested by ${currentUser.name}. Matching algorithm scored top 5 candidates.`,
          currentUser.name
        );

        setAdvisoryPitch('');
        setSelectedIndustryTags([]);
      }
    });

    setShowPaymentModal(true);
  };

  // Submit Advisor Swap Request
  const handleSubmitSwapRequest = () => {
    if (!swapTarget) return;
    setSwapError('');
    if (swapReason.trim().length < 10) {
      setSwapError('Swap reason must be at least 10 characters.');
      return;
    }

    db.add<AdvisorSwapRequest>('advisorSwapRequests', {
      id: `swap_${Date.now()}`,
      advisoryBoardRequestId: swapTarget.boardId,
      founderId: currentUser.uid,
      founderName: currentUser.name,
      advisorIdToRemove: swapTarget.advisorId,
      advisorNameToRemove: swapTarget.advisorName,
      reason: swapReason.trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    createNotification(
      'user_ops_admin',
      `New Advisor Swap requested by ${currentUser.name} for advisor ${swapTarget.advisorName}.`,
      currentUser.name
    );

    setSwapTarget(null);
    setSwapReason('');
  };

  return (
    <div className="space-y-6">
      
      {/* DIRECTORY VIEW: MENTORS / INVESTORS */}
      {(activeTab === 'mentors' || activeTab === 'investors') && (
        <div className="space-y-5">
          
          {/* Header & Filter Controls */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-gray-900 capitalize">
                  {isMentorTab ? 'Verified Mentors Directory' : 'Angel & Institutional Investors'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isMentorTab 
                    ? '1-on-1 strategic deep dives with vetted operators. Dynamic fee caps based on verified sessions & reputation.'
                    : 'Pitch your venture, get investment readiness teardowns, and unlock venture syndicate backing.'}
                </p>
              </div>

              {yancMember && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-xl border border-purple-200 text-xs font-semibold text-purple-800">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Your Credits: {yancMember.creditBalance}</span>
                  <span className="text-[10px] text-purple-600">(1 Credit = ₹100)</span>
                </div>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, expertise..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  <option value="all">All Sectors & Expertise</option>
                  {SECTORS_LIST.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  <option value="">Any Max Fee Cap</option>
                  <option value="5000">Up to ₹5,000</option>
                  <option value="15000">Up to ₹15,000</option>
                  <option value="40000">Up to ₹40,000</option>
                  <option value="100000">Up to ₹1,00,000</option>
                </select>
              </div>

              <div>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  <option value="">Any Rating</option>
                  <option value="4.8">4.8+ Stars</option>
                  <option value="4.9">4.9+ Stars</option>
                  <option value="5.0">5.0 Stars Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredProfiles.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700">No matching profiles found</h3>
              <p className="text-xs text-gray-400 mt-1">Try resetting your filters or search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProfiles.map(profile => {
                const openSlots = profile.availabilitySlots.filter(s => !s.isBooked);
                return (
                  <div
                    key={profile.id}
                    id={`profile-card-${profile.id}`}
                    className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Avatar + Tier / Type + Rating */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                            {profile.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 leading-snug">{profile.name}</h4>
                            <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                              {profile.type === 'investor' 
                                ? `Tier ${profile.tier} Investor` 
                                : 'Verified Mentor'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-gray-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{profile.averageRating}</span>
                          <span className="text-[10px] text-gray-400 font-normal">({profile.totalRatings})</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-gray-600 line-clamp-3 mb-3 leading-relaxed">
                        {profile.bio || 'Verified startup ecosystem partner.'}
                      </p>

                      {/* Sector Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {profile.sectorsOrExpertiseTags.slice(0, 4).map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer: Price Cap & Actions */}
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 font-semibold block uppercase">Session Cap</span>
                          <span className="font-extrabold text-purple-700 text-sm">
                            ₹{profile.maxChargeCap.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-semibold block uppercase">Open Slots</span>
                          <span className="font-semibold text-gray-700 text-xs">
                            {openSlots.length} available
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          id={`btn-view-profile-${profile.id}`}
                          onClick={() => setSelectedProfile(profile)}
                          className="py-2 text-xs font-bold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-center"
                        >
                          View Profile
                        </button>
                        <button
                          id={`btn-book-session-${profile.id}`}
                          onClick={() => handleOpenBooking(profile)}
                          className="py-2 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl shadow-xs transition text-center"
                        >
                          Book Session
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* MY SESSIONS TAB */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">My Scheduled Sessions</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Track real-time escrow status, session memos, receipts, and provide ratings.
              </p>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700">No booked sessions yet</h3>
              <p className="text-xs text-gray-400 mt-1">Explore the Mentors or Investors directories to book a strategic session.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map(sess => {
                const isOfflineProposed = sess.status === 'awaiting_founder_response';
                const isPendingReview = sess.status === 'pending_provider_review';
                const isCompleted = sess.status === 'completed';
                const hasRated = !!sess.founderRating;

                const getStatusBadge = (st: string) => {
                  switch (st) {
                    case 'pending_provider_review':
                      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">Pending Provider Review</span>;
                    case 'awaiting_founder_response':
                      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 animate-pulse">Action Needed: Online Proposed</span>;
                    case 'accepted':
                      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">Scheduled / Confirmed</span>;
                    case 'pending_finance_review':
                      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">Teardown in Finance Review</span>;
                    case 'memo_rejected':
                      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">Memo Under Revision</span>;
                    case 'completed':
                      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">Completed & Paid Out</span>;
                    case 'rejected':
                      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800">Rejected & Refunded</span>;
                    case 'cancelled':
                      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Cancelled & Refunded</span>;
                    default:
                      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{st}</span>;
                  }
                };

                return (
                  <div
                    key={sess.id}
                    id={`session-card-${sess.id}`}
                    className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-gray-900">{sess.providerName}</h4>
                          <span className="text-xs text-gray-400 capitalize">({sess.providerRole})</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {sess.slotDetails.date} • {sess.slotDetails.time} • <span className="capitalize font-semibold text-purple-700">{sess.mode}</span>
                          {sess.slotDetails.location && ` (${sess.slotDetails.location})`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(sess.status)}
                      </div>
                    </div>

                    {/* Proposal Banner if provider proposed online */}
                    {isOfflineProposed && (
                      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          <span>Provider proposed switching this session from Offline to Online.</span>
                        </div>
                        <p className="text-xs text-blue-800">
                          Due to logistics or scheduling, {sess.providerName} requested an Online meeting instead.
                        </p>
                        <div className="flex gap-2 pt-1">
                          <button
                            id={`btn-accept-online-${sess.id}`}
                            onClick={() => handleRespondToOnlineProposal(sess, true)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition"
                          >
                            Accept Online Instead
                          </button>
                          <button
                            id={`btn-decline-online-${sess.id}`}
                            onClick={() => handleRespondToOnlineProposal(sess, false)}
                            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50 transition"
                          >
                            Decline (Cancel & Refund)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Pitch & Deck Info */}
                    <div className="text-xs space-y-2">
                      <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="font-semibold text-gray-900 block mb-1">Your Submitted Pitch:</span>
                        {sess.pitchText}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-gray-500 pt-1">
                        <div className="flex items-center gap-4">
                          <span>
                            Escrow Held: <strong className="text-purple-700">₹{sess.escrowAmount.toLocaleString('en-IN')}</strong>
                          </span>
                          <span>
                            Method: <strong className="capitalize text-gray-800">{sess.paymentMethod}</strong>
                          </span>
                        </div>

                        {sess.pitchDeckUrl && (
                          <a
                            href={sess.pitchDeckUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-purple-700 hover:text-purple-900 font-semibold"
                          >
                            <FileText className="w-4 h-4" />
                            <span>View Uploaded Deck ({sess.pitchDeckFileName || 'Deck.pdf'})</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Teardown Memo Preview if Completed */}
                    {sess.teardownMemo && (
                      <div className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-xl text-xs space-y-1.5">
                        <p className="font-bold text-purple-900">Provider Teardown Memo (Verified):</p>
                        <p><strong className="text-gray-900">Next Steps:</strong> {sess.teardownMemo.nextSteps}</p>
                        <p><strong className="text-gray-900">Competitive Moat:</strong> {sess.teardownMemo.competitiveMoat}</p>
                        <p><strong className="text-gray-900">Biggest Risk / Blindspot:</strong> {sess.teardownMemo.biggestRisk}</p>
                      </div>
                    )}

                    {/* Rejection / Refund note */}
                    {sess.providerRejectionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                        <span className="font-bold block">Rejection Feedback:</span>
                        {sess.providerRejectionReason}
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <div>
                        {isPendingReview && (
                          <button
                            id={`btn-cancel-request-${sess.id}`}
                            onClick={() => handleCancelSession(sess)}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
                          >
                            Cancel Request (Full Refund)
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Download Receipt */}
                        <button
                          id={`btn-view-receipt-${sess.id}`}
                          onClick={() => {
                            setViewReceipt({
                              transactionId: `TXN_YANC_${sess.id.slice(-8)}`,
                              date: sess.createdAt,
                              type: 'session_escrow',
                              itemTitle: `Session with ${sess.providerName}`,
                              amountInr: sess.priceCharged,
                              creditsUsed: sess.creditsPaid,
                              payerName: sess.requesterName,
                              payerEmail: sess.requesterEmail,
                              beneficiaryName: sess.providerName,
                              status: sess.escrowStatus === 'released' ? 'Paid Out' : (sess.escrowStatus === 'refunded' ? 'Refunded' : 'Escrow Held'),
                              paymentMethod: sess.paymentMethod === 'credits' ? 'YANC Credits' : 'Online Escrow Gateway'
                            });
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Receipt
                        </button>

                        {/* Rate Session */}
                        {isCompleted && !hasRated && (
                          <button
                            id={`btn-rate-session-${sess.id}`}
                            onClick={() => {
                              setRatingSession(sess);
                              setRatingStars(5);
                              setReviewText('');
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition flex items-center gap-1.5"
                          >
                            <Star className="w-3.5 h-3.5 fill-white" />
                            Rate this Session
                          </button>
                        )}

                        {isCompleted && hasRated && (
                          <span className="text-xs text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            Rated {sess.founderRating}/5 Stars
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ADVISORY BOARD TAB */}
      {activeTab === 'advisory' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <h2 className="text-xl font-black text-gray-900">Custom Startup Advisory Board</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Assemble a 3-person curated advisory board aligned with your exact industry verticals and technical stack.
            </p>
          </div>

          {/* Active Boards List */}
          {advisoryBoards.length > 0 ? (
            <div className="space-y-6">
              {advisoryBoards.map(board => {
                const isActive = board.status === 'active';
                const isPending = board.status === 'awaiting_admin_approval' || board.status === 'awaiting_match';

                return (
                  <div
                    key={board.id}
                    id={`advisory-board-${board.id}`}
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">Advisory Board #{board.id.slice(-6)}</h3>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}>
                            {isActive ? 'Active Board' : 'Pending Assembly'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{board.pitchSummary}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-semibold block uppercase">Yearly Package</span>
                        <span className="text-sm font-bold text-gray-900">
                          ₹{board.yearlyPackageCost.toLocaleString('en-IN')} (Paid)
                        </span>
                      </div>
                    </div>

                    {/* Pending Notice */}
                    {isPending && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          Pending assembly — our team is curating your board
                        </p>
                        <p>
                          Our algorithmic matching scored the top 5 advisor candidates based on your industry tags ({board.industryTags.join(', ')}). Operations Admin is finalizing advisor availability and equity allocation terms.
                        </p>
                      </div>
                    )}

                    {/* Active Advisors List */}
                    {isActive && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                          Appointed Board Advisors ({board.finalAdvisors.length})
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {board.finalAdvisors.map(adv => {
                            const pendingSwap = swapRequests.find(r => 
                              r.advisoryBoardRequestId === board.id && 
                              r.advisorIdToRemove === adv.advisorId && 
                              r.status === 'pending'
                            );

                            return (
                              <div
                                key={adv.advisorId}
                                className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-bold text-sm text-gray-900">{adv.advisorName}</h5>
                                    <span className="text-xs font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                      {adv.equityPercent}% Equity
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 mt-0.5">{adv.advisorEmail}</p>
                                </div>

                                <div>
                                  {pendingSwap ? (
                                    <div className="p-2 rounded-lg bg-amber-100 text-amber-900 text-[10px] font-bold">
                                      Swap requested — pending review
                                    </div>
                                  ) : (
                                    <button
                                      id={`btn-swap-advisor-${adv.advisorId}`}
                                      onClick={() => {
                                        setSwapTarget({
                                          boardId: board.id,
                                          advisorId: adv.advisorId,
                                          advisorName: adv.advisorName
                                        });
                                        setSwapReason('');
                                        setSwapError('');
                                      }}
                                      className="w-full py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition"
                                    >
                                      Request Swap
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* No Board: Request Board Form */
            <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4 max-w-2xl mx-auto">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Request an Advisory Board</h3>
                <p className="text-xs text-gray-500">
                  Provide your venture pitch and select 1–3 industry tags. We run an automated algorithmic matching pass against our approved advisors.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Venture Pitch Summary * (min 50 chars)
                  </label>
                  <textarea
                    id="input-advisory-pitch"
                    rows={4}
                    value={advisoryPitch}
                    onChange={(e) => setAdvisoryPitch(e.target.value)}
                    placeholder="Describe your venture's product, current traction, and specific strategic areas where board advice is needed..."
                    className="w-full p-3 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>Minimum 50 characters</span>
                    <span>{advisoryPitch.length} characters</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Industry Verticals * (Select 1 to 3 tags)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SECTORS_LIST.map(tag => {
                      const isSelected = selectedIndustryTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedIndustryTags(selectedIndustryTags.filter(t => t !== tag));
                            } else {
                              if (selectedIndustryTags.length < 3) {
                                setSelectedIndustryTags([...selectedIndustryTags, tag]);
                              }
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-full border transition ${
                            isSelected 
                              ? 'bg-purple-600 text-white border-purple-600 font-bold' 
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {advisoryFormError && (
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{advisoryFormError}</span>
                  </div>
                )}

                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-center justify-between">
                  <span>Yearly Advisory Board Fee:</span>
                  <span className="font-extrabold text-sm">₹1,80,000 / year</span>
                </div>

                <button
                  id="btn-submit-advisory-request"
                  onClick={handleSubmitAdvisoryRequest}
                  className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  Proceed to Payment & Algorithmic Matching
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* VIEW PROFILE MODAL */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 relative max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-[#7C3AED] to-[#D946EF] p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xl font-bold">
                  {selectedProfile.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold">{selectedProfile.name}</h3>
                  <p className="text-xs text-purple-100 capitalize">
                    {selectedProfile.type === 'investor' ? `Tier ${selectedProfile.tier} Investor` : 'Verified Mentor'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedProfile(null)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                {selectedProfile.bio}
              </p>

              <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Session Cap</span>
                  <span className="text-sm font-extrabold text-purple-700">₹{selectedProfile.maxChargeCap.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Rating</span>
                  <span className="text-sm font-extrabold text-amber-600 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {selectedProfile.averageRating} ({selectedProfile.totalRatings} ratings)
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-gray-900 block mb-1">Sectors & Expertise:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedProfile.sectorsOrExpertiseTags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {selectedProfile.reviews && selectedProfile.reviews.length > 0 && (
                <div>
                  <span className="font-bold text-gray-900 block mb-2">Verified Founder Reviews:</span>
                  <div className="space-y-2">
                    {selectedProfile.reviews.map((rev, i) => (
                      <div key={i} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">{rev.founderName}</span>
                          <span className="flex items-center gap-0.5 text-amber-600 font-bold text-[11px]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {rev.rating}/5
                          </span>
                        </div>
                        <p className="text-gray-600 italic">"{rev.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                onClick={() => {
                  const p = selectedProfile;
                  setSelectedProfile(null);
                  handleOpenBooking(p);
                }}
                className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Book Session with {selectedProfile.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOOK SESSION MODAL */}
      {bookingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 relative max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-[#7C3AED] to-[#D946EF] p-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold">Book Session with {bookingProfile.name}</h3>
                <p className="text-xs text-purple-100">
                  Cap: ₹{bookingProfile.maxChargeCap.toLocaleString('en-IN')} • Escrow Protection
                </p>
              </div>
              <button onClick={() => setBookingProfile(null)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Pitch Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Venture Pitch / Discussion Overview * (min 50 chars)
                </label>
                <textarea
                  id="input-booking-pitch"
                  rows={3}
                  value={pitchText}
                  onChange={(e) => setPitchText(e.target.value)}
                  placeholder="Outline your venture, target metrics, and exact topics you want to review in this session..."
                  className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>Minimum 50 characters</span>
                  <span>{pitchText.length} characters</span>
                </div>
              </div>

              {/* Pitch Deck Real Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Upload Pitch Deck * (.pdf, .ppt, .pptx - Max 15MB)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-purple-400 transition bg-gray-50/50">
                  {uploadedDeckUrl ? (
                    <div className="flex items-center justify-between text-xs bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="font-semibold text-purple-900 truncate">{uploadedDeckName}</span>
                      </div>
                      <a
                        href={uploadedDeckUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 font-bold ml-2 shrink-0 flex items-center gap-1"
                      >
                        Preview <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <div>
                      <input
                        id="input-deck-file"
                        type="file"
                        accept=".pdf,.ppt,.pptx"
                        onChange={handleDeckUpload}
                        disabled={uploadingDeck}
                        className="hidden"
                      />
                      <label
                        htmlFor="input-deck-file"
                        className="cursor-pointer flex flex-col items-center justify-center"
                      >
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="font-semibold text-purple-700">Click to upload pitch deck</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">PDF or PowerPoint up to 15MB</span>
                      </label>
                    </div>
                  )}

                  {uploadingDeck && (
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-purple-600 h-full transition-all duration-200" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-purple-700 font-semibold">Uploading {uploadProgress}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Input with Inline Cap Validation */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700">Amount Offered / Charged (₹) *</label>
                  <span className="text-[10px] text-purple-700 font-semibold">
                    Cap: ₹{bookingProfile.maxChargeCap.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  id="input-booking-amount"
                  type="number"
                  value={askAmount}
                  onChange={(e) => setAskAmount(e.target.value)}
                  placeholder={`Up to ${bookingProfile.maxChargeCap}`}
                  className={`w-full px-3 py-2 text-xs border rounded-xl outline-none ${
                    parseFloat(askAmount) > bookingProfile.maxChargeCap 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                  }`}
                />
                {parseFloat(askAmount) > bookingProfile.maxChargeCap && (
                  <p className="text-[10px] text-red-600 mt-0.5">
                    * Amount exceeds provider's ceiling of ₹{bookingProfile.maxChargeCap.toLocaleString('en-IN')}.
                  </p>
                )}
              </div>

              {/* Availability Slots Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Select an Open Time Slot *
                </label>
                {bookingProfile.availabilitySlots.filter(s => !s.isBooked).length === 0 ? (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs">
                    No open slots currently available. Please check back later.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {bookingProfile.availabilitySlots.filter(s => !s.isBooked).map(slot => (
                      <label
                        key={slot.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                          selectedSlotId === slot.id 
                            ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="slotSelection"
                            checked={selectedSlotId === slot.id}
                            onChange={() => {
                              setSelectedSlotId(slot.id);
                              setSessionMode(slot.mode);
                            }}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span>{slot.date} • {slot.time}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 uppercase font-bold text-gray-600">
                          {slot.mode}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {bookingError && (
                <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2 shrink-0">
              <button
                onClick={() => setBookingProfile(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                id="btn-proceed-to-payment"
                onClick={handleProceedToPayment}
                disabled={uploadingDeck || parseFloat(askAmount) > bookingProfile.maxChargeCap || !selectedSlotId}
                className="flex-1 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                Proceed to Payment
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      {ratingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Rate Session</h3>
                <p className="text-xs text-gray-500">Provide direct feedback for {ratingSession.providerName}</p>
              </div>
              <button onClick={() => setRatingSession(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stars Selector */}
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold text-gray-700">Overall Experience Rating *</span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingStars(star)}
                    className="p-1 text-2xl transition hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Optional Written Feedback / Review
              </label>
              <textarea
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share how this session helped your venture roadmap..."
                className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRatingSession(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id="btn-submit-rating"
                onClick={handleSubmitRating}
                disabled={ratingSubmitting}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SWAP REQUEST MODAL */}
      {swapTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Request Advisor Swap</h3>
                <p className="text-xs text-gray-500">Removing {swapTarget.advisorName} from board</p>
              </div>
              <button onClick={() => setSwapTarget(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for Swap * (min 10 chars)
              </label>
              <textarea
                rows={3}
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                placeholder="Explain why a swap is requested (e.g., strategic focus changed to enterprise B2B sales)..."
                className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {swapError && (
              <div className="p-2 rounded-lg bg-red-50 text-red-700 text-xs">
                {swapError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSwapTarget(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-swap"
                onClick={handleSubmitSwapRequest}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Submit Swap Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT GATEWAY MODAL */}
      {paymentConfig && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentConfig(null);
          }}
          itemTitle={paymentConfig.itemTitle}
          amountInr={paymentConfig.amountInr}
          beneficiaryName={paymentConfig.beneficiaryName}
          payerUser={currentUser}
          yancMemberData={yancMember}
          onSuccess={(details) => {
            paymentConfig.onSuccessAction(details);
            setShowPaymentModal(false);
            setPaymentConfig(null);
          }}
        />
      )}

      {/* RECEIPT VIEW MODAL */}
      {viewReceipt && (
        <ReceiptModal
          receipt={viewReceipt}
          isOpen={!!viewReceipt}
          onClose={() => setViewReceipt(null)}
        />
      )}

    </div>
  );
};
