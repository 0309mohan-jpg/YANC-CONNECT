import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  User,
  Briefcase,
  Layers,
  Phone
} from 'lucide-react';
import { User as UserType, UserRole, YancMember, InvestorMentorProfile, AdminUser } from '../types';
import { db } from '../services/db';
import { authService } from '../services/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
}

type AuthStep = 
  | 'email_entry'
  | 'otp_entry'
  | 'non_member_signup'
  | 'provider_application'
  | 'under_review';

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

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialRole }) => {
  const [activeTab, setActiveTab] = useState<'founder' | 'provider' | 'admin'>('founder');
  const [step, setStep] = useState<AuthStep>('email_entry');

  // Fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Non-member signup fields
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [whatYouDo, setWhatYouDo] = useState('');
  const [whatYouPlan, setWhatYouPlan] = useState('');
  const [signupError, setSignupError] = useState('');

  // Provider application fields
  const [providerType, setProviderType] = useState<'investor' | 'mentor'>('investor');
  const [providerName, setProviderName] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [investmentHistory, setInvestmentHistory] = useState('');
  const [typicalTicketSize, setTypicalTicketSize] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [providerError, setProviderError] = useState('');

  // Submitted profile for "under review"
  const [submittedProfile, setSubmittedProfile] = useState<any>(null);

  // Target user payload to log in after OTP
  const [pendingUserToLogin, setPendingUserToLogin] = useState<UserType | null>(null);

  // Email format validator
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isValidPhone = (val: string) => !val || /^\d{10}$/.test(val.replace(/\D/g, ''));

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const t = setTimeout(() => setLockoutTime(prev => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [lockoutTime]);

  // Resend OTP cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleEmailContinue = () => {
    setOtpError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setOtpError('Please enter a valid email address.');
      return;
    }

    if (activeTab === 'founder') {
      // Check yancMembers
      const yancMember = db.get<YancMember>('yancMembers').find(m => m.email.toLowerCase() === cleanEmail);
      if (yancMember) {
        // Existing YANC member
        let existingUser = db.get<UserType>('users').find(u => u.email.toLowerCase() === cleanEmail);
        if (!existingUser) {
          existingUser = db.add<UserType>('users', {
            uid: `user_${Date.now()}`,
            email: cleanEmail,
            role: 'yanc_member',
            name: yancMember.name,
            createdAt: new Date().toISOString()
          });
        }
        setPendingUserToLogin(existingUser);
        setStep('otp_entry');
        setResendCooldown(30);
      } else {
        // Check if existing non-member
        const existingNonMember = db.get<UserType>('users').find(u => u.email.toLowerCase() === cleanEmail);
        if (existingNonMember) {
          setPendingUserToLogin(existingNonMember);
          setStep('otp_entry');
          setResendCooldown(30);
        } else {
          // No match: Go to signup form
          setStep('non_member_signup');
        }
      }
    } else if (activeTab === 'provider') {
      // Check if existing profile in investorMentorProfiles
      const profile = db.get<InvestorMentorProfile>('investorMentorProfiles').find(p => p.email.toLowerCase() === cleanEmail);
      if (profile) {
        if (profile.applicationStatus === 'pending') {
          setSubmittedProfile(profile);
          setStep('under_review');
          return;
        }
        let existingUser = db.get<UserType>('users').find(u => u.email.toLowerCase() === cleanEmail);
        if (!existingUser) {
          existingUser = db.add<UserType>('users', {
            uid: profile.userId || `user_${Date.now()}`,
            email: cleanEmail,
            role: profile.type,
            name: profile.name,
            createdAt: new Date().toISOString()
          });
        }
        setPendingUserToLogin(existingUser);
        setStep('otp_entry');
        setResendCooldown(30);
      } else {
        // Prompt new application
        setStep('provider_application');
      }
    } else if (activeTab === 'admin') {
      const admin = db.get<AdminUser>('adminUsers').find(a => a.email.toLowerCase() === cleanEmail);
      if (!admin) {
        setOtpError('Email not found in authorized administrators registry.');
        return;
      }
      let existingUser = db.get<UserType>('users').find(u => u.email.toLowerCase() === cleanEmail);
      if (!existingUser) {
        existingUser = db.add<UserType>('users', {
          uid: `user_${admin.role}`,
          email: cleanEmail,
          role: admin.role,
          name: admin.name,
          createdAt: new Date().toISOString()
        });
      }
      setPendingUserToLogin(existingUser);
      setStep('otp_entry');
      setResendCooldown(30);
    }
  };

  const handleNonMemberSignup = () => {
    setSignupError('');
    if (!signupName.trim()) {
      setSignupError('Name is required.');
      return;
    }
    if (signupPhone && !isValidPhone(signupPhone)) {
      setSignupError('Phone must be a valid 10-digit number.');
      return;
    }
    if (!whatYouDo.trim() || !whatYouPlan.trim()) {
      setSignupError('"What you do" and "What you plan to do" are required.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const newUser = db.add<UserType>('users', {
      uid: `user_${Date.now()}`,
      email: cleanEmail,
      role: 'non_member',
      name: signupName.trim(),
      phone: signupPhone.trim(),
      bio: `${whatYouDo.trim()} | Goal: ${whatYouPlan.trim()}`,
      createdAt: new Date().toISOString()
    });

    setPendingUserToLogin(newUser);
    setStep('otp_entry');
    setResendCooldown(30);
  };

  const handleProviderApplication = () => {
    setProviderError('');
    if (!providerName.trim()) {
      setProviderError('Full Name is required.');
      return;
    }
    if (providerPhone && !isValidPhone(providerPhone)) {
      setProviderError('Phone must be a valid 10-digit number.');
      return;
    }
    if (selectedSectors.length === 0) {
      setProviderError('Please select at least 1 sector or expertise tag.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = `user_${Date.now()}`;

    let initialTier: any = undefined;
    let maxCap = 3000;
    const ticketNum = parseFloat(typicalTicketSize) || 0;

    if (providerType === 'investor') {
      if (ticketNum < 500000) initialTier = 1;
      else if (ticketNum < 2000000) initialTier = 2;
      else if (ticketNum < 10000000) initialTier = 3;
      else initialTier = 4;
      const caps = { 1: 5000, 2: 15000, 3: 40000, 4: 100000 };
      maxCap = caps[initialTier as 1 | 2 | 3 | 4];
    }

    const newProfile = db.add<InvestorMentorProfile>('investorMentorProfiles', {
      id: `imp_${Date.now()}`,
      userId,
      name: providerName.trim(),
      email: cleanEmail,
      type: providerType,
      applicationStatus: 'pending',
      tier: initialTier,
      minTicketPrice: ticketNum,
      typicalTicketSize: ticketNum,
      pastInvestmentHistory: investmentHistory.trim(),
      maxChargeCap: maxCap,
      sectorsOrExpertiseTags: selectedSectors,
      sessionsCompleted: 0,
      creditsEarnedFromTransfers: 0,
      availabilitySlots: [],
      walletBalance: 0,
      lifetimeEarnings: 0,
      averageRating: 5.0,
      totalRatings: 0,
      portfolioUrl: portfolioLink.trim(),
      yearsOfExperience: parseInt(yearsExperience) || 5,
      bio: `${providerType === 'investor' ? 'Investor' : 'Mentor'} passionate about ${selectedSectors.join(', ')}.`
    });

    const newUser = db.add<UserType>('users', {
      uid: userId,
      email: cleanEmail,
      role: providerType,
      name: providerName.trim(),
      phone: providerPhone.trim(),
      createdAt: new Date().toISOString()
    });

    setPendingUserToLogin(newUser);
    setSubmittedProfile(newProfile);
    setStep('otp_entry');
    setResendCooldown(30);
  };

  const handleVerifyOtp = () => {
    if (lockoutTime > 0) return;

    if (otp.trim() !== '180825') {
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockoutTime(60);
        setOtpAttempts(0);
        setOtpError('Too many failed attempts. Security lockout active for 60 seconds.');
      } else {
        setOtpError(`Invalid OTP code. (Attempts remaining: ${5 - newAttempts}). Hint: Code is always 180825.`);
      }
      return;
    }

    // OTP Verified!
    if (submittedProfile && submittedProfile.applicationStatus === 'pending') {
      setStep('under_review');
      return;
    }

    if (pendingUserToLogin) {
      authService.setCurrentUser(pendingUserToLogin);
      onClose();
    }
  };

  const quickFill = (accEmail: string, tab: 'founder' | 'provider' | 'admin') => {
    setActiveTab(tab);
    setEmail(accEmail);
    setOtp('180825');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 relative">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#7C3AED] to-[#D946EF] p-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Sign In to YANC Connect</h3>
            <p className="text-xs text-purple-100">Access sessions, mentors, investors & advisory boards</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          
          {/* Quick Fill Demo Bar */}
          <div className="mb-4 p-2.5 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-[11px] font-bold text-purple-900 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Quick Fill Sample Accounts (OTP: 180825)
            </p>
            <div className="flex flex-wrap gap-1 text-[10px]">
              <button 
                onClick={() => quickFill('member@yanc.in', 'founder')}
                className="px-2 py-0.5 rounded bg-white text-purple-700 font-semibold border border-purple-200 hover:bg-purple-100"
              >
                Member (Aarav)
              </button>
              <button 
                onClick={() => quickFill('nonmember@gmail.com', 'founder')}
                className="px-2 py-0.5 rounded bg-white text-gray-700 font-semibold border border-gray-200 hover:bg-gray-100"
              >
                Non-Member (Rohan)
              </button>
              <button 
                onClick={() => quickFill('investor@yanc.in', 'provider')}
                className="px-2 py-0.5 rounded bg-white text-blue-700 font-semibold border border-blue-200 hover:bg-blue-100"
              >
                Investor (Vikram)
              </button>
              <button 
                onClick={() => quickFill('mentor@yanc.in', 'provider')}
                className="px-2 py-0.5 rounded bg-white text-teal-700 font-semibold border border-teal-200 hover:bg-teal-100"
              >
                Mentor / Advisor (Devraj)
              </button>
              <button 
                onClick={() => quickFill('ops@yanc.in', 'admin')}
                className="px-2 py-0.5 rounded bg-white text-amber-800 font-semibold border border-amber-200 hover:bg-amber-100"
              >
                Ops Admin
              </button>
              <button 
                onClick={() => quickFill('finance@yanc.in', 'admin')}
                className="px-2 py-0.5 rounded bg-white text-green-800 font-semibold border border-green-200 hover:bg-green-100"
              >
                Finance Admin
              </button>
              <button 
                onClick={() => quickFill('admin@yanc.in', 'admin')}
                className="px-2 py-0.5 rounded bg-white text-rose-800 font-semibold border border-rose-200 hover:bg-rose-100"
              >
                Super Admin
              </button>
            </div>
          </div>

          {/* Role Tabs */}
          {step === 'email_entry' && (
            <div className="flex border-b border-gray-200 mb-5">
              <button
                onClick={() => { setActiveTab('founder'); setOtpError(''); }}
                className={`flex-1 pb-2.5 text-xs font-bold transition border-b-2 ${
                  activeTab === 'founder' 
                    ? 'border-[#7C3AED] text-[#7C3AED]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Founder / Member
              </button>
              <button
                onClick={() => { setActiveTab('provider'); setOtpError(''); }}
                className={`flex-1 pb-2.5 text-xs font-bold transition border-b-2 ${
                  activeTab === 'provider' 
                    ? 'border-[#7C3AED] text-[#7C3AED]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Investor / Mentor
              </button>
              <button
                onClick={() => { setActiveTab('admin'); setOtpError(''); }}
                className={`flex-1 pb-2.5 text-xs font-bold transition border-b-2 ${
                  activeTab === 'admin' 
                    ? 'border-[#7C3AED] text-[#7C3AED]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Admin Suite
              </button>
            </div>
          )}

          {/* STEP 1: EMAIL ENTRY */}
          {step === 'email_entry' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="input-auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. founder@yanc.in"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
                  />
                </div>
              </div>

              {otpError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <button
                id="btn-auth-continue"
                onClick={handleEmailContinue}
                className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-gray-500 text-center">
                {activeTab === 'founder' && 'YANC members are recognized automatically; non-members will be prompted to set up a basic profile.'}
                {activeTab === 'provider' && 'Approved mentors and investors log in with OTP; new applicants will submit credentials.'}
                {activeTab === 'admin' && 'Authorized administrators only. No self-registration.'}
              </div>
            </div>
          )}

          {/* STEP 2: NON-MEMBER SIGNUP FORM */}
          {step === 'non_member_signup' && (
            <div className="space-y-3">
              <div className="bg-purple-50 p-2.5 rounded-lg text-xs text-purple-800">
                You are not registered as a YANC Member yet. Please provide a few quick details to set up your Founder account.
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Locked)</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  id="input-signup-name"
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Rohan Gupta"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number (Optional 10-digit)</label>
                <input
                  id="input-signup-phone"
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">What do you do? *</label>
                <input
                  id="input-signup-what-do"
                  type="text"
                  value={whatYouDo}
                  onChange={(e) => setWhatYouDo(e.target.value)}
                  placeholder="e.g. Software developer building autonomous hydroponic systems"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">What do you plan to do? *</label>
                <input
                  id="input-signup-what-plan"
                  type="text"
                  value={whatYouPlan}
                  onChange={(e) => setWhatYouPlan(e.target.value)}
                  placeholder="e.g. Raise angel capital and pilot with 10 commercial warehouses"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {signupError && (
                <div className="p-2 rounded bg-red-50 text-red-700 text-xs">
                  {signupError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep('email_entry')}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  id="btn-signup-submit"
                  onClick={handleNonMemberSignup}
                  className="flex-1 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Sign Up & Send OTP
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PROVIDER NEW APPLICATION FORM */}
          {step === 'provider_application' && (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              <div className="bg-purple-50 p-2 rounded-lg text-xs text-purple-900">
                No approved account found for <span className="font-semibold">{email}</span>. Fill out this brief application to join our verified mentor/investor network.
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Application Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProviderType('investor')}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      providerType === 'investor' 
                        ? 'bg-purple-600 text-white border-purple-600' 
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Investor
                  </button>
                  <button
                    type="button"
                    onClick={() => setProviderType('mentor')}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      providerType === 'mentor' 
                        ? 'bg-purple-600 text-white border-purple-600' 
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Mentor
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  id="input-provider-name"
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="e.g. Sanya Kapoor"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number (10 digits)</label>
                <input
                  id="input-provider-phone"
                  type="tel"
                  value={providerPhone}
                  onChange={(e) => setProviderPhone(e.target.value)}
                  placeholder="e.g. 9811223344"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {providerType === 'investor' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Typical Ticket Size (₹ numeric) *</label>
                    <input
                      id="input-provider-ticket"
                      type="number"
                      value={typicalTicketSize}
                      onChange={(e) => setTypicalTicketSize(e.target.value)}
                      placeholder="e.g. 2500000 (drives initial tier)"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">₹2.5L=Tier 1 (cap ₹5k), ₹10L=Tier 2 (cap ₹15k), ₹25L=Tier 3 (cap ₹40k), ₹1Cr+=Tier 4 (cap ₹1L)</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Past Investment History</label>
                    <textarea
                      id="input-provider-history"
                      rows={2}
                      value={investmentHistory}
                      onChange={(e) => setInvestmentHistory(e.target.value)}
                      placeholder="e.g. Backed 4 consumer D2C startups; angel cheque lead in NuGlow..."
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Years of Experience *</label>
                    <input
                      id="input-provider-exp"
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">LinkedIn / Portfolio Link</label>
                    <input
                      id="input-provider-linkedin"
                      type="url"
                      value={portfolioLink}
                      onChange={(e) => setPortfolioLink(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sectors & Expertise Tags *
                </label>
                <div className="flex flex-wrap gap-1">
                  {SECTORS_LIST.map(sector => {
                    const isSelected = selectedSectors.includes(sector);
                    return (
                      <button
                        key={sector}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSectors(selectedSectors.filter(s => s !== sector));
                          } else {
                            setSelectedSectors([...selectedSectors, sector]);
                          }
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                          isSelected 
                            ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold' 
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {sector}
                      </button>
                    );
                  })}
                </div>
              </div>

              {providerError && (
                <div className="p-2 rounded bg-red-50 text-red-700 text-xs">
                  {providerError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep('email_entry')}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  id="btn-provider-submit"
                  onClick={handleProviderApplication}
                  className="flex-1 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Submit Application
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: OTP ENTRY */}
          {step === 'otp_entry' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Enter Verification Code</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Code sent to <span className="font-semibold text-gray-800">{email}</span>
                </p>
                <p className="text-[11px] text-purple-700 font-medium mt-1">
                  (Standard Test Code: <span className="font-bold underline">180825</span>)
                </p>
              </div>

              <div>
                <input
                  id="input-auth-otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="180825"
                  disabled={lockoutTime > 0}
                  className="w-full text-center tracking-widest text-xl font-bold py-2.5 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                />
              </div>

              {otpError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {lockoutTime > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs flex items-center justify-center gap-2 font-semibold">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Security Lockout: Retry in {lockoutTime}s</span>
                </div>
              )}

              <button
                id="btn-auth-verify-otp"
                onClick={handleVerifyOtp}
                disabled={lockoutTime > 0 || otp.length === 0}
                className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Verify & Sign In
              </button>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <button
                  onClick={() => setStep('email_entry')}
                  className="hover:text-gray-800"
                >
                  Change Email
                </button>

                <button
                  id="btn-resend-otp"
                  disabled={resendCooldown > 0}
                  onClick={() => {
                    setResendCooldown(30);
                    setOtp('180825');
                    setOtpError('');
                  }}
                  className="text-purple-600 hover:text-purple-800 disabled:text-gray-400 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: APPLICATION UNDER REVIEW */}
          {step === 'under_review' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Application Under Review</h4>
              <p className="text-xs text-gray-600">
                Thank you for applying to YANC Connect as a verified {submittedProfile?.type}. Our Operations Admin team is reviewing your profile credentials.
              </p>

              {submittedProfile && (
                <div className="p-3 bg-gray-50 rounded-xl text-left text-xs text-gray-700 space-y-1.5 border border-gray-200">
                  <p><span className="font-semibold">Applicant Name:</span> {submittedProfile.name}</p>
                  <p><span className="font-semibold">Role:</span> {submittedProfile.type}</p>
                  <p><span className="font-semibold">Sectors:</span> {submittedProfile.sectorsOrExpertiseTags?.join(', ')}</p>
                  <p><span className="font-semibold">Status:</span> <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">Pending Review</span></p>
                </div>
              )}

              <p className="text-[11px] text-gray-500">
                You will be notified once your profile has been approved. You can check back anytime.
              </p>

              <button
                onClick={onClose}
                className="w-full py-2 bg-gray-800 text-white font-semibold text-xs rounded-xl hover:bg-gray-900"
              >
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
