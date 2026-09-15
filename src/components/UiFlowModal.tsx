import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  GitFork, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  Layers,
  Users,
  Lock,
  KeyRound,
  Eye,
  Wallet,
  Clock,
  Briefcase,
  TrendingUp,
  Award,
  AlertTriangle,
  Copy,
  Check,
  Building2,
  Compass,
  CreditCard,
  Sparkles
} from 'lucide-react';

interface UiFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'diagram' | 'matrix' | 'lifecycle' | 'spec';

export const UiFlowModal: React.FC<UiFlowModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('diagram');
  const [activeDiagram, setActiveDiagram] = useState<'architecture' | 'user_flow'>('architecture');
  const [selectedPersona, setSelectedPersona] = useState<string>('yanc_member');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const personas = [
    {
      id: 'yanc_member',
      roleName: 'YANC Member (Founder)',
      badge: 'Gold Founder',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      accessMethod: 'Whitelist verification against registered YANC membership database (Email / Phone) + OTP Simulation. Instant verification grants access with pre-allocated credits.',
      whatTheySee: [
        'Verified Mentors Directory with dynamic search, domain filters, and mentor rating badges',
        'Investors Directory with Tier 1, 2, and 3 classifications and maximum fee ceilings',
        'Real-time YANC Credit balance widget with INR conversion (1 Credit = ₹100 INR)',
        'My Sessions dashboard showing Pending, Confirmed, Completed, and Teardown Received states',
        'Pitch Deck upload previewer with slide counts and executive pitch memo generator',
        'Custom 3-Person Advisory Board request builder with domain criteria and equity range',
        '3-Point Teardown Memo reader (Next Steps, Competitive Moat, Biggest Risk) for completed sessions'
      ],
      actionsAndLimits: [
        'Can book any verified mentor or investor up to their slot capacity',
        'Can pay via pre-loaded YANC Credits or instant Razorpay Escrow checkout',
        '48-hour response guarantee: 100% refund auto-credited if provider does not respond',
        'Can submit custom Advisory Board requests (3 advisors) with equity agreements',
        'Can request advisor swaps within 90 days if inactive or misaligned'
      ],
      financialRules: '1 Credit = ₹100 INR. 100% escrow protection until 3-point teardown memo audit.'
    },
    {
      id: 'non_member',
      roleName: 'Non-Member Founder (External)',
      badge: 'Direct Founder',
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-300',
      accessMethod: 'Direct phone OTP / Email authentication. Creates standard founder profile without YANC member credit allotment.',
      whatTheySee: [
        'Full public Mentors & Investors Directory with fee tags, backgrounds, and availability slots',
        'Razorpay checkout modal with transparent pricing (Session Fee + 18% GST + Escrow guarantee)',
        'Founder session tracker with meeting links, calendar integration, and reminder countdowns',
        'Advisory Board exploration overview with requirements to upgrade or apply for custom curation'
      ],
      actionsAndLimits: [
        'Pays per session via Razorpay Escrow (Credit card, UPI, NetBanking)',
        'Subject to provider-specific session fee caps (Mentor: ₹15k, Tier 1: ₹15k, Tier 2: ₹25k, Tier 3: ₹50k)',
        'Full access to 3-point Teardown Memos upon completion',
        'Option to apply for YANC Gold Membership directly from workspace'
      ],
      financialRules: '100% refundable escrow held by platform. Auto-reversed after 48h non-response.'
    },
    {
      id: 'mentor',
      roleName: 'Verified Mentor',
      badge: 'Knowledge Provider',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      accessMethod: 'Provider application flow requiring LinkedIn URL, company background, domain expertise, and founder testimonials. Approved by Operations Admin.',
      whatTheySee: [
        'Provider Operations Dashboard with lifetime metrics, completed sessions, and rating stars',
        'Incoming Pitches Inbox with founder pitch deck preview (PDF/PPT) and executive summary',
        '48-Hour SLA countdown timer per incoming request with Accept / Alternate / Decline options',
        'Availability Slot Manager (recurring or specific dates/times with 15-min buffer)',
        'Mandatory 3-Point Teardown Memo Editor (Next Steps, Moat, Biggest Risk)',
        'Provider Escrow Wallet with pending escrow balance and available payout balances',
        'Apply as Startup Board Advisor button with dual-role qualification badge'
      ],
      actionsAndLimits: [
        'Max fee cap enforced at ₹15,000 INR per session',
        'Must submit thorough 3-point teardown memo post-session to unlock escrow payment',
        'Can submit UPI / Bank Account withdrawal requests once escrow is approved by Finance Admin',
        'Can qualify and apply for equity-based Board Advisor positions'
      ],
      financialRules: 'Fee held in escrow. Payout unlocked only after Finance Admin memo approval.'
    },
    {
      id: 'investor',
      roleName: 'Angel / VC Investor',
      badge: 'Capital Provider',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      accessMethod: 'Curated invite or application with Fund/Angel portfolio verification and Ops Admin tier assignment (Tier 1: Emerging Angel, Tier 2: Syndicate Lead, Tier 3: Institutional VC).',
      whatTheySee: [
        'Investor Dealflow Dashboard: Incoming pitch decks filtered by sector, round stage, and traction',
        'Pitch Deck quick-viewer with deck attachment download, founder bios, and requested focus',
        'Calendar slots configuration with selective acceptance controls',
        'Post-pitch 3-point Investment Teardown form (Thesis, Moat validation, Key Investment Risk)',
        'Earnings & Escrow Wallet tracker with breakdown of held funds and cleared earnings'
      ],
      actionsAndLimits: [
        'Tier-based fee caps: Tier 1 max ₹15,000, Tier 2 max ₹25,000, Tier 3 max ₹50,000 per session',
        'Can accept pitch meetings or route directly to firm associates',
        '48-hour response SLA to maintain high-response badge and search ranking',
        'Can invite high-potential founders directly to their firm formal pipeline'
      ],
      financialRules: 'All fees held in escrow. 100% refund guarantee to founder if canceled.'
    },
    {
      id: 'advisor',
      roleName: 'Board Advisor (Dual Role)',
      badge: 'Equity Partner',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      accessMethod: 'Must be an active, approved Mentor or Investor with minimum 3 completed sessions and rating >4.5, vetted by Ops Admin for advisory board readiness.',
      whatTheySee: [
        'Advisory Board Portfolio: Startups where advisor sits on the 3-person board',
        'FAST Agreement & Equity Vesting Tracker (Percentage equity, 1-yr cliff, 24-mo monthly vesting)',
        'Quarterly Board Check-in schedules and strategic meeting notes repository',
        'Board Swap and Governance notification status'
      ],
      actionsAndLimits: [
        'Assigned to curated 3-person advisory boards matching founder vertical requirements',
        'Receives equity allocation (typically 0.25% - 1.0% per advisor) governed by FAST contract',
        'Subject to replacement via Founder Advisor Swap Request if disengaged within 90 days'
      ],
      financialRules: 'Long-term equity vesting backed by standard FAST contracts.'
    },
    {
      id: 'ops_admin',
      roleName: 'Operations Admin (Ops Control)',
      badge: 'Platform Ops',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      accessMethod: 'Admin credentials with role assignment. Role switcher allows testing from any user perspective.',
      whatTheySee: [
        'Provider Application Review Queue (Mentors and Investors pending background verification)',
        'Advisory Board Request Matching Desk: Assembles curated 3-person advisor slates for founders',
        'Advisor Swap Request Queue (Reviews founder swap justifications and assigns alternates)',
        'Platform Broadcast composer for sending system-wide announcements to founders or providers',
        'Full Platform User Directory with verification flags and contact logs'
      ],
      actionsAndLimits: [
        'Approves/Rejects Mentor and Investor applications and sets investor tiers (Tier 1–3)',
        'Reviews startup pitch decks and curates tailored 3-person advisory board selections',
        'Enforces 48-hour response SLAs across the provider network'
      ],
      financialRules: 'Oversees operational compliance and service-level agreements.'
    },
    {
      id: 'finance_admin',
      roleName: 'Finance Admin (Financial Controller)',
      badge: 'Escrow Guardian',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
      accessMethod: 'Financial controller role credentials. Access restricted to transaction ledgers, memo quality audits, and withdrawal gateways.',
      whatTheySee: [
        'Teardown Memo Audit Queue: Reviews submitted 3-point memos for substance and actionable depth',
        'Provider Withdrawal Approvals: Clears pending UPI / NEFT payouts against bank verification',
        'Double-Entry Escrow Ledger: Real-time tracking of Escrow Inflow, Released Funds, and YANC Credits',
        'Refund Audit Log: Audits 48-hour SLA expiry auto-reversals and founder dispute refunds'
      ],
      actionsAndLimits: [
        'Mandatory Gatekeeper: Escrow CANNOT be credited to provider wallet without Finance Admin memo sign-off',
        'Can reject low-effort memos and request provider revision before escrow release',
        'Approves and dispatches batch withdrawal transfers to provider bank accounts'
      ],
      financialRules: 'Controls release of all escrowed capital and bank payout transfers.'
    },
    {
      id: 'super_admin',
      roleName: 'Super Administrator',
      badge: 'Root Authority',
      badgeColor: 'bg-purple-200 text-purple-950 border-purple-400',
      accessMethod: 'Full root access credentials with global oversight.',
      whatTheySee: [
        'Consolidated High-Level Platform Health: Session volume, escrow velocity, provider retention',
        'All Ops Admin queues (Applications, Advisory Boards, Swaps, Sessions Queue)',
        'All Finance Admin queues (Memos, Ledger, Withdrawal approvals)',
        'Direct User Role Override Console: Instant promotion/demotion between any user role'
      ],
      actionsAndLimits: [
        'Can execute any administrative, financial, or operational action',
        'Can override dispute outcomes, modify platform commission rates, or reassign boards',
        'Complete visibility into system database and event streams'
      ],
      financialRules: 'Unrestricted administrative authority across all platform transactions.'
    }
  ];

  const currentPersonaData = personas.find(p => p.id === selectedPersona) || personas[0];

  const fullArchitectureSpec = `
# YANC Connect — End-to-End System & Workflow Architecture Specification

## 1. User Personas & Access Matrix
1. **YANC Member (Founder)**: Whitelist Email/Phone OTP verified. Sees Mentors, Tier 1-3 Investors, Credit Balance (1 Credit = ₹100 INR), Sessions, Pitch Upload, 3-Person Advisory Board Builder.
2. **Non-Member (External Founder)**: Phone/Email OTP sign-up. Pays per session via Razorpay Escrow. Sees Directories, Slot Booking, and Teardown Memos.
3. **Verified Mentor**: Vetted via application. Sets availability slots (Max fee cap ₹15,000). Must write 3-Point Teardown Memo (Next Steps, Moat, Risk) to unlock escrow.
4. **Angel/VC Investor**: Tier 1 (Cap ₹15k), Tier 2 (Cap ₹25k), Tier 3 (Cap ₹50k). Reviews pitch decks, conducts 1:1 pitches, submits teardown thesis.
5. **Startup Board Advisor**: Dual-role verified mentor/investor with >4.5 rating. Sits on 3-person curated boards with FAST equity vesting.
6. **Operations Admin**: Approves provider applications, sets investor tiers, curates 3-person advisory boards, manages swap requests.
7. **Finance Admin**: Audits 3-point teardown memos before releasing escrow, approves UPI/bank withdrawals, oversees double-entry ledger.
8. **Super Admin**: Master control over all ops, finance queues, analytics, and user role overrides.

## 2. Core Operational Rules & Financial Safeguards
- **100% Escrow Protection**: All booking fees locked in escrow at reservation time.
- **48-Hour Response SLA**: Providers have 48h to accept, propose alternate time, or decline. If inactive, fee automatically reverses to founder.
- **Mandatory 3-Point Teardown Memo**:
  1. Actionable Next Steps (3-5 items)
  2. Competitive Moat & Unfair Advantage Assessment
  3. #1 Existential Risk to Mitigate
- **Finance Gatekeeper**: Escrow is NEVER released automatically upon call completion. Finance Admin must review and approve memo quality first.
- **FAST Advisory Board Governance**: 3 advisors per startup; 90-day swap window if misaligned.
  `.trim();

  const handleCopySpec = () => {
    navigator.clipboard.writeText(fullArchitectureSpec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div 
        className="relative bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                YANC Connect — End-to-End System Architecture
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                  Interactive Blueprint
                </span>
              </h2>
              <p className="text-xs text-gray-500 hidden sm:block">
                Comprehensive multi-persona access matrix, visual flowchart diagrams, and operational safeguards
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <a
              href={activeDiagram === 'architecture' ? '/architecture_flowchart.png' : '/entire_ui_flow.png'}
              download={activeDiagram === 'architecture' ? 'yanc_architecture_flowchart.png' : 'yanc_ui_flow.png'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition"
              title="Download High-Res PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PNG</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-5 border-b border-gray-100 flex items-center justify-between gap-2 overflow-x-auto bg-gray-50/50">
          <div className="flex items-center gap-1 sm:gap-2 py-2">
            <button
              onClick={() => setActiveTab('diagram')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'diagram'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visual Flowchart (PNG)</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Personas & Access Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('lifecycle')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'lifecycle'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>End-to-End Lifecycle Stages</span>
            </button>

            <button
              onClick={() => setActiveTab('spec')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'spec'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Architecture Spec</span>
            </button>
          </div>

          <div className="text-[11px] text-gray-500 font-medium hidden md:flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Escrow & 48h SLA Active</span>
          </div>
        </div>

        {/* Modal Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: VISUAL FLOWCHART (PNG) */}
          {activeTab === 'diagram' && (
            <div className="space-y-4">
              {/* Diagram Switcher Pill */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="inline-flex p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setActiveDiagram('architecture')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      activeDiagram === 'architecture'
                        ? 'bg-white text-purple-900 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    1. System Architecture & Personas Blueprint
                  </button>
                  <button
                    onClick={() => setActiveDiagram('user_flow')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      activeDiagram === 'user_flow'
                        ? 'bg-white text-purple-900 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    2. User Journey UI Flow
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={activeDiagram === 'architecture' ? '/architecture_flowchart.png' : '/entire_ui_flow.png'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 px-3 py-1 rounded-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Full High-Res in New Tab
                  </a>
                </div>
              </div>

              {/* Blueprint Display Canvas */}
              <div className="rounded-2xl border border-gray-200 bg-[#0B0F19] p-2 sm:p-3 shadow-inner overflow-hidden group relative">
                <img
                  src={activeDiagram === 'architecture' ? '/architecture_flowchart.png' : '/entire_ui_flow.png'}
                  alt="Architecture Blueprint Diagram"
                  className="w-full h-auto rounded-xl object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
                  referrerPolicy="no-referrer"
                  onClick={() => window.open(activeDiagram === 'architecture' ? '/architecture_flowchart.png' : '/entire_ui_flow.png', '_blank')}
                />
                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-xs text-white text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 pointer-events-none opacity-80 group-hover:opacity-100 transition">
                  <ExternalLink className="w-3.5 h-3.5 text-pink-300" />
                  <span>Click diagram to inspect at full 1376×768 resolution</span>
                </div>
              </div>

              {/* Architecture Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1">
                  <span className="text-[10px] font-black text-purple-800 uppercase tracking-wider">Multi-Persona Security</span>
                  <p className="text-xs font-bold text-gray-900">8 Role Contexts with Instant Switcher</p>
                  <p className="text-[11px] text-gray-600">Strict RBAC segregation between Founder, Mentor, Investor, Board Advisor, and Admin.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                  <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider">Zero-Risk Escrow Engine</span>
                  <p className="text-xs font-bold text-gray-900">100% Locked Pre-Session Settlement</p>
                  <p className="text-[11px] text-gray-600">1 Credit = ₹100 INR. Funds only release when Finance Admin audits the 3-point teardown memo.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">FAST Governance</span>
                  <p className="text-xs font-bold text-gray-900">Curated 3-Person Advisory Boards</p>
                  <p className="text-[11px] text-gray-600">Standardized FAST equity vesting contracts with 90-day swap safety guarantee.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER PERSONAS & ACCESS MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 flex items-center justify-between">
                <span>Select a user persona below to inspect their onboarding access pathway, what they see in the interface, and key limits:</span>
                <span className="font-bold text-[11px]">8 Platform Personas</span>
              </div>

              {/* Persona Selector Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {personas.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersona(p.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      selectedPersona === p.id
                        ? 'bg-purple-50 border-purple-500 shadow-xs'
                        : 'bg-white border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                    <p className="text-xs font-bold text-gray-900 mt-1.5 truncate">{p.roleName}</p>
                  </button>
                ))}
              </div>

              {/* Selected Persona Detail Dossier */}
              <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div>
                    <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                      {currentPersonaData.roleName}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentPersonaData.badgeColor}`}>
                        {currentPersonaData.badge}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{currentPersonaData.financialRules}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* How They Get Access */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-900">
                      <KeyRound className="w-4 h-4 text-purple-700" />
                      <span>HOW THEY GET ACCESS & VERIFICATION</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 leading-relaxed shadow-2xs">
                      {currentPersonaData.accessMethod}
                    </div>

                    {/* Actions & Limits */}
                    <div className="pt-2">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-900 mb-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-700" />
                        <span>PERMISSIONS, LIMITS & FINANCIAL CAPS</span>
                      </div>
                      <div className="space-y-1.5">
                        {currentPersonaData.actionsAndLimits.map((act, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* What They See */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-900">
                      <Eye className="w-4 h-4 text-purple-700" />
                      <span>WHAT THEY SEE (UI VIEWS & WIDGETS)</span>
                    </div>
                    <div className="space-y-1.5">
                      {currentPersonaData.whatTheySee.map((view, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 shadow-2xs">
                          <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{view}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: END-TO-END LIFECYCLE STAGES */}
          {activeTab === 'lifecycle' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
                The full 8-step journey from onboarding and discovery through 100% escrow booking, meeting execution, teardown audit, and advisory board formation:
              </div>

              <div className="space-y-3">
                {[
                  {
                    step: '01',
                    phase: 'Identity & Access Gate',
                    actors: 'All Users',
                    desc: 'Founder / Provider logs in via OTP. System matches credentials against YANC Member directory. Providers verify LinkedIn / credentials; Admins have elevated permission queues.',
                    tags: ['OTP Simulation', 'Whitelist Check', 'RBAC View Assignment']
                  },
                  {
                    step: '02',
                    phase: 'Smart Discovery & Pitch Preparation',
                    actors: 'Founders',
                    desc: 'Founders browse verified Mentors & Tier 1-3 Investors with domain tags (Fintech, SaaS, AI, D2C), fee ceilings, and review ratings. Founder prepares 50+ char executive pitch summary.',
                    tags: ['Dynamic Search', 'Fee Ceilings', 'Deck Upload (PDF/PPT up to 15MB)']
                  },
                  {
                    step: '03',
                    phase: '100% Escrow Locking Checkout',
                    actors: 'Founders & Escrow Ledger',
                    desc: 'Founder selects provider availability slot and locks session fee via YANC Credits (1 Credit = ₹100 INR) or Razorpay Escrow. Funds are placed into held escrow status.',
                    tags: ['100% Escrow Protection', 'Credits Ledger', 'Instant Confirmation Receipt']
                  },
                  {
                    step: '04',
                    phase: '48-Hour Response SLA Window',
                    actors: 'Mentors & Investors',
                    desc: 'Provider receives incoming pitch alert with 48h countdown clock. Provider can Accept, propose alternate online slot, or decline. If inactive at 48 hours, system auto-refunds founder in full.',
                    tags: ['48h Countdown Timer', 'Alternate Slot Negotiation', 'Auto-Refund Engine']
                  },
                  {
                    step: '05',
                    phase: 'Meeting Execution & Live Agenda',
                    actors: 'Founder & Provider',
                    desc: 'Confirmed session unlocks meeting venue / Google Meet / Zoom link, shared agenda checklist, and collaborative session notes. Provider initiates prep review.',
                    tags: ['Meeting Link Direct Launch', 'Add to Calendar', 'Shared Agenda']
                  },
                  {
                    step: '06',
                    phase: 'Mandatory 3-Point Teardown Memo',
                    actors: 'Mentors & Investors',
                    desc: 'Immediately following the call, provider must submit the structured 3-point memo: (1) Immediate 3-5 Next Steps, (2) Defensible Moat Assessment, (3) #1 Existential Risk to Mitigate.',
                    tags: ['Next Steps (3-5)', 'Competitive Moat', 'Biggest Risk']
                  },
                  {
                    step: '07',
                    phase: 'Finance Admin Escrow Audit',
                    actors: 'Finance Controller',
                    desc: 'Finance Admin inspects submitted teardown memo for quality and actionable depth. If approved, escrow status moves from Held to Released. If subpar, returned to provider for revision.',
                    tags: ['Quality Gatekeeper', 'Escrow Release Sign-off', 'Double-Entry Ledger']
                  },
                  {
                    step: '08',
                    phase: 'Wallet Settlement & Advisory Boards',
                    actors: 'Providers & Operations Admin',
                    desc: 'Provider balance becomes withdrawable to UPI / Bank Account. Highly rated mentors are eligible for curated 3-person Startup Advisory Boards governed by FAST equity contracts.',
                    tags: ['UPI / Bank Payouts', '3-Person Advisory Board', 'FAST Equity Vesting']
                  }
                ].map((s, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-purple-300 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                          {s.step}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-gray-900">{s.phase}</h4>
                          <p className="text-[11px] text-purple-700 font-semibold">Primary Actors: {s.actors}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {s.tags.map((t, i) => (
                          <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE SPEC */}
          {activeTab === 'spec' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Complete Lovable Build Specification & Backend Questions
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Production-ready schema, RBAC rules, dynamic formulas, zero dummy data, and backend integration questionnaire.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    id="btn-download-spec-modal"
                    href="/LOVABLE_SPEC.md"
                    download="YANC_CONNECT_LOVABLE_SPEC.md"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Spec (.md)</span>
                  </a>
                  <button
                    onClick={handleCopySpec}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition shadow-2xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto leading-relaxed max-h-[500px]">
                {fullArchitectureSpec}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Sticky Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Engineered for Zero Founder Risk & Verified Governance</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              id="btn-download-spec-footer"
              href="/LOVABLE_SPEC.md"
              download="YANC_CONNECT_LOVABLE_SPEC.md"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download Lovable Spec (.md)
            </a>
            <a
              href="/architecture_flowchart.png"
              download="yanc_architecture_blueprint.png"
              className="inline-flex items-center gap-1.5 font-bold text-purple-700 hover:text-purple-900 underline"
            >
              <Download className="w-3.5 h-3.5" />
              Blueprint (PNG)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
