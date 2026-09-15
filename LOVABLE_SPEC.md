# YANC Connect — Complete Product Architecture & Lovable Specification

> **Target Platform:** Lovable (Full-Stack React + Vite + Tailwind CSS + Supabase / PostgreSQL)  
> **Application Type:** Multi-Tenant Startup Advisory, Mentorship Marketplace, and 100% Escrow Governance Platform  
> **Data Handling:** Production-ready relational schema, strictly zero dummy/mock records, fully dynamic state machines, and real-time reactive updates.

---

## 1. Product Overview & System Philosophy

**YANC Connect** is an institutional-grade marketplace and advisory governance platform designed to connect startup founders (both verified YANC Community Members and external founders) with vetted industry Mentors, Tier 1–4 Angel/VC Investors, and curated 3-Person Startup Advisory Boards.

### Core Tenets
1. **100% Zero-Risk Escrow Guarantee**: Founders never pay providers directly. 100% of booking fees are locked in platform escrow at reservation time. Funds are held until the provider conducts the call AND submits a high-quality 3-Point Teardown Memo.
2. **Mandatory 3-Point Teardown Memo**: Every paid session legally mandates three written deliverables from the provider:
   - **Immediate Next Steps** (3–5 concrete tactical recommendations)
   - **Competitive Moat & Defensibility Assessment**
   - **#1 Existential Risk to Mitigate**
3. **Finance Admin Gatekeeper**: Escrow is **never** auto-released upon call completion. A designated Finance Controller must review and approve the Teardown Memo. Subpar or low-effort memos are returned for revision.
4. **48-Hour Response SLA with Auto-Reversal**: Providers must Accept, Propose an Alternate Online Slot, or Decline within 48 hours of booking. If the provider is inactive for 48 hours, the session expires and 100% of the escrowed funds are auto-refunded to the founder.
5. **Dynamic Cap Formulas**: Mentors cannot arbitrarily price-gouge; their maximum session fee cap scales mathematically based on completed session volume and platform tenure. Investors have strict tier caps (Tier 1–4).
6. **Institutional FAST Governance**: Founders can assemble curated 3-person advisory boards governed by Founder Advisor Standard Template (FAST) equity vesting schedules (1-year cliff, 24-month monthly vesting, 0.25%–1.0% equity) with a protected 90-day swap guarantee.

---

## 2. Technical Stack & Architectural Boundaries

- **Frontend Framework**: React 18+ with TypeScript (Strict mode enabled)
- **Styling**: Tailwind CSS with custom design tokens (Violet `#7C3AED`, Deep Indigo `#4F46E5`, Emerald `#10B981`, Amber `#F59E0B`, Rose `#F43F5E`)
- **Iconography**: `lucide-react` exclusively
- **Animations**: `motion/react` for layout transitions, drawer slides, and status badges
- **Database / Backend**: PostgreSQL / Supabase (Tables, Foreign Keys, RLS Policies, Triggers) or Reactive In-Memory / IndexedDB Engine with real-time PubSub subscriptions
- **File Storage**: Supabase Storage / S3 / IndexedDB for pitch deck binaries (`.pdf`, `.ppt`, `.pptx`, max 15MB)
- **Payment Gateway Integration**: Razorpay Escrow (Cards, UPI, NetBanking) + Internal YANC Credit Ledger (1 Credit = ₹100 INR)

---

## 3. Database Schema & Data Models

### 3.1 Custom Enums
```sql
CREATE TYPE user_role AS ENUM (
  'yanc_member',
  'non_member',
  'investor',
  'mentor',
  'advisor',
  'ops_admin',
  'finance_admin',
  'super_admin'
);

CREATE TYPE investor_tier AS ENUM ('1', '2', '3', '4');

CREATE TYPE session_status AS ENUM (
  'payment_pending',
  'pending_provider_review',
  'awaiting_founder_response',
  'accepted',
  'pending_finance_review',
  'memo_rejected',
  'completed',
  'rejected',
  'cancelled'
);

CREATE TYPE escrow_status AS ENUM ('held', 'released', 'refunded');

CREATE TYPE credit_ledger_type AS ENUM ('earned', 'spent', 'transferred_to_investor', 'refunded');

CREATE TYPE board_status AS ENUM ('awaiting_match', 'awaiting_admin_approval', 'active', 'archived');

CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected');
```

---

### 3.2 Relational Tables (PostgreSQL DDL)

#### 1. `users`
Represents core authenticated entities.
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'non_member',
  bio TEXT,
  avatar_url TEXT,
  current_role_view user_role, -- Allows dual-role users (Mentor/Advisor) to switch viewports
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 2. `yanc_members`
Whitelist registry for verified YANC community members.
```sql
CREATE TABLE yanc_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_yanc_member BOOLEAN NOT NULL DEFAULT TRUE,
  credit_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- 1 credit = ₹100 INR
  membership_tier VARCHAR(50) NOT NULL DEFAULT 'Gold', -- Silver | Gold | Platinum
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 3. `investor_mentor_profiles`
Public directory profile for vetted Mentors and Investors.
```sql
CREATE TABLE investor_mentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('investor', 'mentor')),
  application_status application_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  tier investor_tier DEFAULT '1', -- Used if type = 'investor'
  min_ticket_price NUMERIC(12, 2) DEFAULT 500000.00,
  typical_ticket_size NUMERIC(12, 2),
  past_investment_history TEXT,
  max_charge_cap NUMERIC(12, 2) NOT NULL, -- Evaluated via formula
  sectors_or_expertise_tags TEXT[] NOT NULL DEFAULT '{}',
  sessions_completed INT NOT NULL DEFAULT 0,
  credits_earned_from_transfers NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Cleared funds available for payout
  lifetime_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  average_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  total_ratings INT NOT NULL DEFAULT 0,
  portfolio_url TEXT,
  years_of_experience INT DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 4. `availability_slots`
Available booking slots published by providers.
```sql
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES investor_mentor_profiles(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  time_range VARCHAR(100) NOT NULL, -- e.g. "10:00 AM - 11:00 AM"
  mode VARCHAR(20) NOT NULL DEFAULT 'online' CHECK (mode IN ('online', 'offline')),
  location TEXT, -- Optional city/venue if offline
  is_booked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 5. `sessions`
Core 1:1 meeting state machine with escrow and deliverables.
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id),
  requester_name VARCHAR(255) NOT NULL,
  requester_email VARCHAR(255) NOT NULL,
  provider_id UUID NOT NULL REFERENCES investor_mentor_profiles(id),
  provider_name VARCHAR(255) NOT NULL,
  provider_role VARCHAR(20) NOT NULL CHECK (provider_role IN ('investor', 'mentor')),
  mode VARCHAR(20) NOT NULL DEFAULT 'online' CHECK (mode IN ('online', 'offline')),
  slot_id UUID REFERENCES availability_slots(id),
  slot_date DATE NOT NULL,
  slot_time VARCHAR(100) NOT NULL,
  slot_location TEXT,
  pitch_text TEXT NOT NULL CHECK (char_length(pitch_text) >= 50),
  pitch_deck_url TEXT NOT NULL,
  pitch_deck_file_name VARCHAR(255),
  ask_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  price_charged NUMERIC(12, 2) NOT NULL,
  credits_paid NUMERIC(12, 2) DEFAULT 0.00,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'credits')),
  status session_status NOT NULL DEFAULT 'pending_provider_review',
  escrow_amount NUMERIC(12, 2) NOT NULL,
  escrow_status escrow_status NOT NULL DEFAULT 'held',
  
  -- 3-Point Teardown Memo
  memo_next_steps TEXT,
  memo_competitive_moat TEXT,
  memo_biggest_risk TEXT,
  memo_submitted_at TIMESTAMPTZ,
  finance_review_note TEXT,

  -- Founder Feedback
  founder_rating INT CHECK (founder_rating BETWEEN 1 AND 5),
  founder_review_text TEXT,
  provider_rejection_reason TEXT,
  offline_surcharge_refunded BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 6. `credits_ledger`
Double-entry ledger tracking all YANC credit inflows, burns, transfers, and escrow allocations.
```sql
CREATE TABLE credits_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC(12, 2) NOT NULL, -- Positive for credits added, negative for spent
  type credit_ledger_type NOT NULL,
  related_session_id UUID REFERENCES sessions(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 7. `advisory_board_requests`
Curated 3-person advisory board formations with FAST equity agreements.
```sql
CREATE TABLE advisory_board_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES users(id),
  founder_name VARCHAR(255) NOT NULL,
  founder_email VARCHAR(255) NOT NULL,
  pitch_summary TEXT NOT NULL,
  industry_tags TEXT[] NOT NULL DEFAULT '{}',
  status board_status NOT NULL DEFAULT 'awaiting_match',
  suggested_advisor_ids UUID[] DEFAULT '{}',
  final_advisors JSONB DEFAULT '[]', -- Array of { advisorId, advisorName, advisorEmail, equityPercent }
  yearly_package_cost NUMERIC(12, 2) NOT NULL DEFAULT 150000.00,
  package_payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (package_payment_status IN ('unpaid', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 8. `advisor_swap_requests`
90-day governance guarantee allowing founders to replace inactive/misaligned advisors.
```sql
CREATE TABLE advisor_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisory_board_request_id UUID NOT NULL REFERENCES advisory_board_requests(id) ON DELETE CASCADE,
  founder_id UUID NOT NULL REFERENCES users(id),
  founder_name VARCHAR(255) NOT NULL,
  advisor_id_to_remove UUID NOT NULL,
  advisor_name_to_remove VARCHAR(255) NOT NULL,
  replacement_advisor_id UUID,
  reason TEXT NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  admin_decision_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 9. `advisor_applications`
Questionnaire submitted by mentors/investors seeking dual-role board qualification.
```sql
CREATE TABLE advisor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  why_advise TEXT NOT NULL,
  sectors_of_expertise TEXT[] NOT NULL DEFAULT '{}',
  availability_hours_per_month VARCHAR(50) NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 10. `withdrawal_requests`
Provider payouts from cleared escrow balances.
```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(20) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  bank_or_upi_details TEXT NOT NULL,
  status withdrawal_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ
);
```

#### 11. `notifications` & `broadcasts`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_by VARCHAR(255) NOT NULL DEFAULT 'System',
  related_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  posted_by VARCHAR(255) NOT NULL,
  target_role VARCHAR(50) DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. TypeScript Interfaces & Data Contracts

Create `/src/types.ts` with exact typings:

```typescript
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
  avatarUrl?: string;
  currentRoleView?: UserRole;
  createdAt: string;
}

export interface YancMember {
  email: string;
  name: string;
  isYancMember: true;
  creditBalance: number; // 1 credit = ₹100 INR
  membershipTier: 'Silver' | 'Gold' | 'Platinum';
}

export type CreditLedgerType = 'earned' | 'spent' | 'transferred_to_investor' | 'refunded';

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
  time: string; // "HH:MM AM - HH:MM PM"
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
  tier?: InvestorTier;
  minTicketPrice: number;
  typicalTicketSize?: number;
  pastInvestmentHistory?: string;
  maxChargeCap: number;
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
  askAmount: number;
  priceCharged: number;
  creditsPaid?: number;
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
```

---

## 5. Core Business Logic & Dynamic Formulas

### 5.1 Dynamic Mentor Fee Cap Formula
To eliminate unchecked price inflation while rewarding seasoned mentors, calculate the mentor's maximum fee ceiling using:

$$\text{SessionBonus} = \lfloor \frac{\text{sessionsCompleted}}{5} \rfloor \times ₹500$$
$$\text{CreditBonus} = \lfloor \frac{\text{creditsEarnedFromTransfers}}{100} \rfloor \times ₹200$$
$$\text{MaxChargeCap} = \min(₹3,000 + \text{SessionBonus} + \text{CreditBonus}, ₹25,000)$$

```typescript
export function calculateMentorFeeCap(sessionsCompleted: number, creditsEarned: number): number {
  const sessionBonus = Math.floor((sessionsCompleted || 0) / 5) * 500;
  const creditBonus = Math.floor((creditsEarned || 0) / 100) * 200;
  return Math.min(3000 + sessionBonus + creditBonus, 25000);
}
```

---

### 5.2 Investor Tiering & Tier Cap Formula
Investor fee caps are strictly bounded by investor tier. For every 500 credits earned through platform transfers, the investor is automatically promoted by one tier (up to Tier 4):

$$\text{BonusLevels} = \lfloor \frac{\text{creditsEarnedFromTransfers}}{500} \rfloor$$
$$\text{ComputedTier} = \min(4, \text{baseTier} + \text{BonusLevels})$$

| Investor Tier | Label | Maximum Charge Cap | Minimum Ticket Recommendation |
| :--- | :--- | :--- | :--- |
| **Tier 1** | Emerging Angel | ₹5,000 INR | ₹2,50,000+ |
| **Tier 2** | Syndicate Lead / Super Angel | ₹15,000 INR | ₹10,00,000+ |
| **Tier 3** | Institutional Micro-VC | ₹40,000 INR | ₹25,00,000+ |
| **Tier 4** | Marquee Growth Fund Partner | ₹1,00,000 INR | ₹1,00,00,000+ |

```typescript
export function calculateInvestorTierAndCap(baseTier: InvestorTier, creditsEarned: number) {
  const bonusLevels = Math.floor((creditsEarned || 0) / 500);
  const computedTier = Math.min(4, (baseTier || 1) + bonusLevels) as InvestorTier;
  const tierCaps: Record<InvestorTier, number> = {
    1: 5000,
    2: 15000,
    3: 40000,
    4: 100000
  };
  return {
    computedTier,
    maxChargeCap: tierCaps[computedTier]
  };
}
```

---

### 5.3 48-Hour Response SLA & Auto-Reversal Engine
1. When a founder books a slot, `status` becomes `pending_provider_review` and `createdAt` is timestamped.
2. A client/server cron job checks for stale sessions:
   $$\Delta \text{Hours} = \frac{\text{Date.now()} - \text{Session.createdAt}}{1000 \times 60 \times 60}$$
3. If $\Delta \text{Hours} \ge 48$ and status remains `pending_provider_review` or `awaiting_founder_response`:
   - Session status transitions to `cancelled`.
   - Escrow status transitions to `refunded`.
   - If paid via YANC credits, credits are re-credited to `yanc_members.credit_balance` and a `refunded` ledger entry is appended.
   - If paid via Razorpay, payment refund API is invoked.
   - An automated notification is sent to both the founder and provider.

---

### 5.4 Mandatory 3-Point Teardown Memo Criteria
To complete a session, the provider **must** fill out all three memo fields:
1. `nextSteps`: Minimum 100 characters. Must contain 3–5 bullet points outlining immediate actions.
2. `competitiveMoat`: Minimum 50 characters. Must evaluate network effects, IP, proprietary distribution, or tech moat.
3. `biggestRisk`: Minimum 50 characters. Must flag the primary failure mode (e.g., unit economics, CAC/LTV, runway, regulatory hurdles).

---

### 5.5 Finance Admin Escrow Audit Protocol
1. After the call, provider submits the Teardown Memo $\rightarrow$ Session status becomes `pending_finance_review`.
2. Escrow status remains **`held`**. Provider wallet **does not** receive funds yet.
3. Finance Admin inspects the memo inside the Audit Queue:
   - **Approve**: Status transitions to `completed`. Escrow status becomes `released`. Provider `wallet_balance` increases by `price_charged`. Provider `sessions_completed` increments by 1. Profile max fee cap is automatically recalculated.
   - **Reject**: Finance Admin writes a mandatory note explaining what needs expansion. Status transitions to `memo_rejected`. Provider is notified to revise their memo.

---

### 5.6 FAST Advisory Board Governance Rules
1. Founder creates an Advisory Board Request detailing industry tags, stage, and equity proposal (0.25%–1.0% per advisor).
2. Operations Admin curates and matches a 3-person slate of vetted advisors.
3. **90-Day Swap Guarantee**: If an advisor fails to attend calls or is strategic misaligned within 90 days of activation:
   - Founder submits an `AdvisorSwapRequest`.
   - Ops Admin reviews the case, approves the removal, and assigns a qualified replacement advisor.
   - The FAST agreement is re-generated with the new advisor without altering the other two advisors' vesting tables.

---

## 6. End-to-End User Journeys & UI Views

### View 1: Header & Role-Switching Navigation Bar
- **Logo & Brand Title**: YANC Connect badge with live status pill.
- **Credit Balance Widget**: Displays real-time YANC credits (`₹ Balance = Credits * 100`). Clicking opens the transaction ledger drawer.
- **Notification Dropdown**: Shows unread count badge, notification timestamps, mark-as-read triggers.
- **Role Switcher Dropdown**: Allows instant simulation across all 8 user personas (`yanc_member`, `non_member`, `investor`, `mentor`, `advisor`, `ops_admin`, `finance_admin`, `super_admin`).
- **Architecture & Flow Button**: Opens the modal showing system blueprints and download links.

---

### View 2: Member / Founder Workspace (`/views/MemberView.tsx`)
- **Discovery Header**: Live search input (mentor name, domain keywords, company) + Horizontal filter tags (`Fintech`, `SaaS`, `AI/ML`, `D2C`, `Healthtech`, `Edtech`, `CleanTech`, `DeepTech`).
- **Profile Cards Grid**:
  - Avatar, full name, type badge (Verified Mentor / Investor Tier 1–4).
  - Domain pills, years of experience, average rating (with star counts), and past investment ticket size.
  - Transparent pricing tag: `₹X / Session` with `Max Cap: ₹Y` verified badge.
  - Mode tag: `Online (Google Meet / Zoom)` or `Offline (Location specified)`.
  - **"Book Session"** primary CTA.
- **Pitch Deck Upload & Booking Drawer**:
  - Availability slot picker (dates and times formatted clearly).
  - Executive Pitch Memo input (enforces $\ge 50$ characters).
  - Drag-and-drop Pitch Deck uploader (`.pdf`, `.ppt`, `.pptx`, max 15MB) with upload progress animation and persistent IndexedDB/Storage backing.
  - Payment method toggle: **YANC Credits** vs. **Razorpay Escrow**.
  - Escrow security guarantee card explaining the 48h SLA and 100% refund terms.
- **My Sessions Tab**:
  - Filter tabs: `All`, `Pending Review`, `Confirmed & Upcoming`, `Action Required (Teardown Ready)`, `Completed`.
  - Session Card displays meeting date/time, provider details, escrow status badge (`HELD` / `RELEASED`), and direct **"Join Meeting"** link when confirmed.
  - **"Read Teardown Memo"** button opens a modal rendering the 3 deliverables once submitted and approved.
  - Post-session rating modal allowing the founder to submit 1–5 stars and written review.
- **Startup Advisory Board Tab**:
  - Request 3-Person Board form: Industry selector, round stage, and equity pool slider (0.5%–3.0% total).
  - Status tracker: Shows current board slate, advisor bios, FAST vesting progress bar, and **"Request Advisor Swap"** action.

---

### View 3: Provider Workspace (`/views/ProviderView.tsx`)
- **Executive Metrics Row**:
  - Total Sessions Completed
  - Lifetime Earnings (INR)
  - Current Available Balance (Cleared for withdrawal)
  - Pending Escrow Balance (Awaiting memo audit)
  - Average Founder Rating
- **Incoming Pitches Queue**:
  - Pitch Deck viewer button (opens PDF/PPT previewer).
  - 48-Hour SLA Countdown Clock: Highlights in amber/red if nearing deadline.
  - Actions: **Accept Slot**, **Propose Alternate Time**, or **Decline Request** (with reason modal).
- **Slot & Availability Manager**:
  - Calendar picker to publish recurring or one-off availability windows.
  - Buffer control (15-minute gap auto-injected between sessions).
- **Teardown Memo Workspace**:
  - Accessible as soon as the session meeting time concludes.
  - 3 input textareas: (1) Immediate Next Steps, (2) Competitive Moat Assessment, (3) #1 Existential Risk.
  - Real-time character count validator.
  - Submits directly to the Finance Admin review queue.
- **Wallet & Payout Drawer**:
  - Request Withdrawal form: Amount (min ₹1,000), Bank Account Number + IFSC, or UPI ID.
  - Historical withdrawal status table (`Pending`, `Approved & Dispatched`, `Rejected`).
- **"Apply for Startup Advisory Board" Banner**:
  - Mentors with $\ge 3$ sessions and $>4.5$ rating can submit the board advisor questionnaire.

---

### View 4: Operations Admin Desk (`/views/AdminView.tsx` - Ops Tab)
- **Pending Provider Applications Table**:
  - Candidate details, LinkedIn link, domain expertise, years of experience.
  - Approve button: Assigns initial Mentor Cap or Investor Tier (1–4).
  - Reject button: Sends feedback email with rejection reason.
- **Advisory Board Curation Desk**:
  - Founder board requests awaiting match.
  - Multi-select search to pick 3 approved advisors matching the founder's sector.
  - Confirms FAST agreement generation.
- **Advisor Swap Queue**:
  - Reviews founder justification for replacing an advisor.
  - Assigns replacement advisor from the approved pool.
- **System Broadcast Composer**:
  - Sends immediate announcements across all user dashboards.

---

### View 5: Finance Admin Controller Desk (`/views/AdminView.tsx` - Finance Tab)
- **Teardown Memo Audit Queue**:
  - Displays submitted memos for review.
  - Side-by-side view of Founder Pitch Deck, Session Details, and Provider's 3-Point Memo.
  - **Approve Memo**: Releases escrow to provider wallet instantly.
  - **Reject Memo**: Prompts for feedback note; sends back to provider for revision.
- **Withdrawal Approvals Desk**:
  - Provider payout requests with bank/UPI details.
  - **Confirm Payout**: Deducts wallet balance, records reference UTR/transaction ID.
- **Escrow Ledger Audit View**:
  - Real-time balances of `Total Escrow Inflow`, `Total Currently Held`, `Total Released`, and `Total Refunded`.

---

## 7. Storage, Uploads & Offline Persistence

### 7.1 Pitch Deck Storage Pipeline
1. Founder selects a file via `<input type="file" accept=".pdf,.ppt,.pptx" />`.
2. Client validates file extension and size ($\le 15\text{MB}$).
3. File is converted to a base64 Data URL and stored in an IndexedDB ObjectStore (`YancConnectFileStorage` / `files`).
4. In production environments, this maps to Supabase Storage bucket `pitch-decks` with public signed URLs.

### 7.2 Reactive In-Memory / LocalStorage Engine
For self-contained execution without backend setup:
- A `ReactiveDatabase` singleton maintains memory caches of all collections.
- All mutations (`add`, `update`, `delete`) write to `localStorage` under `yanc_connect_db_<collection>` and immediately trigger subscriber callbacks.
- Real-time cross-tab synchronization via `window.addEventListener('storage', ...)`.

---

## 8. Step-by-Step Lovable Implementation Prompt

Copy and paste the prompt below into Lovable to generate the complete application:

```markdown
Build "YANC Connect", an institutional-grade startup mentorship, investor advisory, and 100% escrow governance platform using React, TypeScript, Tailwind CSS, Lucide icons, and Motion. 

CRITICAL REQUIREMENTS:
1. Zero Dummy / Seed Data: Start with an empty, fully functional production schema. Do not generate fake placeholder mock profiles or hardcoded lists. Everything must be created dynamically through the user workflows, applications, and forms.
2. Complete RBAC with 8 Roles: Implement support for:
   - YANC Member (Gold Founder)
   - Non-Member (External Founder)
   - Verified Mentor
   - Angel/VC Investor (Tiers 1–4)
   - Startup Board Advisor (Dual Role)
   - Operations Admin
   - Finance Admin
   - Super Administrator
   Include a role switcher in the header to easily navigate and test any role context.
3. 100% Escrow Engine:
   - Founders pay via YANC Credits (1 Credit = ₹100 INR) or Razorpay Escrow.
   - Funds are locked in "held" escrow at booking time.
   - 48-Hour Response SLA: Providers must accept, propose alternate time, or decline within 48h. If 48h expires without action, the session auto-cancels and 100% of escrow is auto-refunded to the founder.
4. Mandatory 3-Point Teardown Memo:
   - Post-session, provider must submit: (1) Immediate Next Steps (3-5 items), (2) Competitive Moat Assessment, (3) #1 Existential Risk to Mitigate.
   - Finance Admin Audit: Escrow is NEVER auto-released. A Finance Controller must review the memo quality in the Audit Queue. Approving releases funds to the provider's wallet; rejecting returns it with revision notes.
5. Dynamic Pricing Caps:
   - Mentor Cap = min(₹3,000 + floor(sessionsCompleted / 5) * ₹500 + floor(creditsEarned / 100) * ₹200, ₹25,000).
   - Investor Tier Caps: Tier 1 (₹5,000), Tier 2 (₹15,000), Tier 3 (₹40,000), Tier 4 (₹1,00,000), with auto-upgrade every 500 credits.
6. FAST Advisory Board Governance:
   - Request 3-Person Advisory Boards with FAST equity agreements (1-yr cliff, 24-mo monthly vesting, 0.25%-1.0% equity).
   - 90-day swap guarantee: Founders can request an advisor swap if inactive, subject to Ops Admin review.
7. File Uploads & Deliverables:
   - Drag-and-drop pitch deck upload (.pdf, .ppt, .pptx, max 15MB) with progress indicators and persistent preview.
   - Provider wallet withdrawal requests with UPI / Bank Account details and Finance Admin clearance.
8. Visual Aesthetics:
   - Clean, high-contrast dark/light mode with rich violet (#7C3AED), indigo, emerald, and rose accents.
   - Rounded-2xl cards, crisp badges, Lucide icons, and zero AI-slop gradients.
   - Include an interactive Architecture Flowchart modal with diagrams and tabbed specs.
```

---

## 9. Verification & Quality Checklist

Before finalizing any deployment in Lovable, ensure the following tests pass:
- [ ] **Founder Booking**: Founder can upload a deck, select an available slot, and lock escrow via credits or Razorpay.
- [ ] **48-Hour Expiry**: Session accurately flags as stale after 48 hours and auto-reverses held escrow.
- [ ] **Provider Workflow**: Provider can view pitch deck, accept the meeting, conduct the call, and submit the 3-point memo.
- [ ] **Finance Gatekeeper**: Provider wallet balance does **not** increase until Finance Admin approves the teardown memo.
- [ ] **Dynamic Fee Recalculation**: Mentor and Investor fee caps update automatically when session milestones are reached.
- [ ] **FAST Advisory Swaps**: Submitting an advisor swap preserves existing board records while allowing Ops Admin to assign a vetted replacement.
- [ ] **No Hardcoded Mocks**: All records originate from authenticated actions, submitted forms, or admin approvals.

---

## 10. Backend Integration Readiness & Architecture Questionnaire

When moving this client application to a live backend (such as Supabase, AWS/GCP, or custom Node.js/Go/Python microservices), your engineering team and backend architects should answer the following categorized integration questions to finalize production implementation:

### 10.1 Database, Identity & Authentication (AuthN / AuthZ)
1. **Authentication Provider**: Will you use Supabase Auth (GoTrue), Firebase Auth, Auth0, or custom JWT authentication?
2. **OTP & Phone Verification**: Which SMS/WhatsApp provider will handle mobile OTP verification for Indian founders (e.g., Twilio, MSG91, Kaleyra, Gupshup)?
3. **YANC Whitelist Validation**: Is the YANC community whitelist hosted in an external CRM/database (e.g., Airtable, HubSpot, custom PostgreSQL), or should it sync bi-directionally via webhooks?
4. **Row Level Security (RLS)**: How will PostgreSQL RLS policies enforce that:
   - Founders can only view their own pitch decks, session notes, and memos?
   - Providers can only view pitch decks for sessions explicitly requested with them?
   - Finance Admins have read/write access to the escrow ledger and memo review queue?
5. **Multi-Role Handling**: If a user is both an approved Mentor and an equity Board Advisor, should the JWT token contain multiple role scopes (`claims.roles = ['mentor', 'advisor']`), or will switching roles reissue a session token?

---

### 10.2 Payment Gateway & Escrow Settlement Architecture
1. **Escrow Mechanism**:
   - Will you use **Razorpay Route / Marketplace Transfers** (linked accounts where platform splits fees and delays settlement via transfer hold)?
   - Or a licensed **Nodal / Escrow Bank Account** (e.g., ICICI / Yes Bank Escrow APIs or Castler) where platform holds 100% of funds until programmatic release instructions are signed?
2. **Payment Webhook Idempotency**: How will incoming webhooks (`payment.captured`, `transfer.processed`, `refund.processed`) be verified, logged, and processed idempotently to prevent duplicate balance additions?
3. **Internal Credits Ledger (1 Credit = ₹100 INR)**:
   - Is credit purchasing taxable at the point of sale (pre-paid voucher), or is GST (18%) charged upon session consumption?
   - How are promotional or community-granted credits separated from cash-purchased credits in the financial ledger?
4. **Provider Payouts**: Will provider bank/UPI withdrawals be executed via **RazorpayX Payouts**, **Cashfree Payouts**, or manual batch NEFT file uploads signed by the Finance Controller?
5. **Tax Deducted at Source (TDS)**: Does the backend need to deduct TDS (e.g., Section 194J - Fees for Professional/Technical Services at 10% or 2%) prior to releasing wallet balances to mentors/investors?

---

### 10.3 Background Scheduling & SLA State Machines
1. **Cron / Worker Engine**: What worker system will run background tasks (e.g., Supabase `pg_cron`, Celery, BullMQ / Redis, AWS EventBridge, Cloudflare Queues)?
2. **48-Hour SLA Expiry Worker**: How frequently will the expiry job run? (Recommended: every 5 or 15 minutes checking `WHERE status = 'pending_provider_review' AND created_at <= NOW() - INTERVAL '48 HOURS'`).
3. **SLA Warning Triggers**: Should automated warning emails/SMS be scheduled at the 24-hour and 40-hour marks if a mentor has not yet accepted a request?
4. **Advisory Vesting Calculations**: Will FAST monthly vesting be computed on the fly by comparing `NOW()` against `board.activated_at` and `cliff_date`, or materialized into a monthly ledger table?

---

### 10.4 Pitch Deck Storage & Document Security
1. **Object Storage**: Will pitch decks be stored in Supabase Storage, AWS S3, or Google Cloud Storage?
2. **Private Bucket & Signed URLs**: Pitch decks contain confidential startup financials and IP. Are files stored in strictly private buckets with time-limited presigned URLs (e.g., 15-minute expiry) generated on demand?
3. **Anti-Virus & MIME Inspection**: Will an asynchronous worker (e.g., ClamAV / AWS Lambda) scan uploaded `.pdf` and `.ppt` files for malware and verify true file headers before making them accessible to providers?
4. **Slide Rendering & Preview**: Does the backend need to convert PowerPoint files (`.ppt`, `.pptx`) to web-friendly `.pdf` or SVG slide images for seamless in-browser preview without downloading?

---

### 10.5 Real-Time Communication & Notifications
1. **Real-time Subscriptions**: Will real-time UI updates (e.g., instant status change when provider accepts, incoming pitch notification) use Supabase Realtime (Postgres CDC), WebSockets, Pusher, or Server-Sent Events (SSE)?
2. **Transactional Email Service**: Which email service (e.g., Resend, SendGrid, Postmark, AWS SES) will dispatch meeting invitations, calendar `.ics` attachments, and memo approval receipts?
3. **Meeting Link Generation**:
   - Will providers paste their own Google Meet / Zoom personal links?
   - Or should the backend automatically provision dynamic Google Meet (Google Workspace API) or Zoom Meeting rooms with automated calendar invites sent to both participants?

---

### 10.6 Legal Agreements & FAST Board Contracts
1. **e-Signature Integration**: How will the Founder Advisor Standard Template (FAST) contracts be executed?
   - Via an embedded canvas signature captured with timestamp and IP address?
   - Or an integrated e-sign API like HelloSign (Dropbox Sign), DocuSign, or Aadhaar eSign (Leegality / Digio)?
2. **Document Versioning**: Where are finalized, countersigned PDF contracts archived, and how are replacement addendums generated during a 90-day advisor swap?

---

### 10.7 Invoicing, GST & Statutory Compliance
1. **Invoicing Engine**: Will the system generate automated GST-compliant tax invoices (showing SAC code 9983 for Management Consulting / Advisory Services, 18% GST, CGST/SGST vs IGST)?
2. **Invoice Numbering**: Are invoice sequences sequential, tamper-proof, and distinct per financial year (e.g., `YANC/2026-27/0001`)?
3. **Audit Trail**: How will administrative overrides (e.g., manual escrow release, dispute overrides, tier adjustments) be logged for third-party financial auditors?

