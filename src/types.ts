export type UserRole = 
  | 'yanc_member' 
  | 'non_member' 
  | 'investor' 
  | 'mentor' 
  | 'advisor' 
  | 'ops_admin' 
  | 'finance_admin' 
  | 'super_admin';

export type InvestorTier = 1 | 2 | 3 | 4;

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  bio?: string;
  createdAt: string;
  currentRoleView?: UserRole; // for dual mentor/advisor switching
}

export interface YancMember {
  email: string;
  name: string;
  isYancMember: true;
  creditBalance: number; // 1 credit = ₹100
  membershipTier: 'Silver' | 'Gold' | 'Platinum';
}

export type CreditLedgerType = 'earned' | 'spent' | 'transferred_to_investor';

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  amount: number;
  type: CreditLedgerType;
  relatedSessionId?: string;
  note?: string;
  timestamp: string;
}

export interface AvailabilitySlot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM - 11:00 AM"
  mode: 'online' | 'offline';
  location?: string;
  isBooked: boolean;
}

export interface InvestorMentorProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  type: 'investor' | 'mentor';
  applicationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  tier?: InvestorTier; // For investors
  minTicketPrice: number; // e.g. 500000
  typicalTicketSize?: number; // ₹
  pastInvestmentHistory?: string;
  maxChargeCap: number; // calculated for mentor, fixed by tier for investor
  sectorsOrExpertiseTags: string[];
  sessionsCompleted: number;
  creditsEarnedFromTransfers: number;
  availabilitySlots: AvailabilitySlot[];
  walletBalance: number;
  lifetimeEarnings: number;
  averageRating: number;
  totalRatings: number;
  reviews?: {
    founderName: string;
    rating: number;
    text: string;
    date: string;
  }[];
  portfolioUrl?: string;
  yearsOfExperience?: number;
  bio?: string;
}

export type SessionStatus = 
  | 'payment_pending'
  | 'pending_provider_review'
  | 'awaiting_founder_response'
  | 'accepted'
  | 'pending_finance_review'
  | 'memo_rejected'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface TeardownMemo {
  nextSteps: string;
  competitiveMoat: string;
  biggestRisk: string;
  submittedAt: string;
}

export interface Session {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  providerId: string;
  providerName: string;
  providerRole: 'investor' | 'mentor';
  mode: 'online' | 'offline';
  slotId: string;
  slotDetails: {
    date: string;
    time: string;
    location?: string;
  };
  pitchText: string;
  pitchDeckUrl: string;
  pitchDeckFileName?: string;
  askAmount: number; // Amount sought in ₹
  priceCharged: number; // Price charged for the session in ₹
  creditsPaid?: number; // If paid in credits
  paymentMethod: 'cash' | 'credits';
  status: SessionStatus;
  escrowAmount: number;
  escrowStatus: 'held' | 'released' | 'refunded';
  teardownMemo?: TeardownMemo;
  financeReviewNote?: string;
  founderRating?: number;
  founderReviewText?: string;
  providerRejectionReason?: string;
  offlineSurchargeRefunded?: boolean;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: 'investor' | 'mentor';
  amount: number;
  bankOrUpiDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  requestedAt: string;
  processedBy?: string;
  processedAt?: string;
}

export interface FinalAdvisor {
  advisorId: string;
  advisorName: string;
  advisorEmail: string;
  equityPercent: number;
}

export interface AdvisoryBoardRequest {
  id: string;
  founderId: string;
  founderName: string;
  founderEmail: string;
  pitchSummary: string;
  industryTags: string[];
  status: 'awaiting_match' | 'awaiting_admin_approval' | 'active';
  suggestedAdvisorIds: string[];
  finalAdvisors: FinalAdvisor[];
  yearlyPackageCost: number;
  packagePaymentStatus: 'unpaid' | 'paid';
  createdAt: string;
}

export interface AdvisorSwapRequest {
  id: string;
  advisoryBoardRequestId: string;
  founderId: string;
  founderName: string;
  advisorIdToRemove: string;
  advisorNameToRemove: string;
  replacementAdvisorId?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminDecisionReason?: string;
  createdAt: string;
}

export interface AdvisorApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  questionnaireResponses: {
    whyAdvise: string;
    sectorsOfExpertise: string[];
    availability: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  sentBy: string;
  relatedId?: string;
  createdAt: string;
}

export interface Broadcast {
  id: string;
  message: string;
  postedBy: string;
  createdAt: string;
}

export interface AdminUser {
  email: string;
  role: 'ops_admin' | 'finance_admin' | 'super_admin';
  name: string;
}

export interface PaymentTransactionReceipt {
  transactionId: string;
  date: string;
  type: 'session_escrow' | 'advisory_package';
  itemTitle: string;
  amountInr: number;
  creditsUsed?: number;
  payerName: string;
  payerEmail: string;
  beneficiaryName: string;
  status: string;
  paymentMethod: string;
  cardOrUpiLast4?: string;
}
