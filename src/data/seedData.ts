import {
  User,
  YancMember,
  InvestorMentorProfile,
  Session,
  WithdrawalRequest,
  AdvisoryBoardRequest,
  AdvisorSwapRequest,
  AdvisorApplication,
  Notification,
  Broadcast,
  AdminUser,
  CreditLedgerEntry
} from '../types';

export const SEED_USERS: User[] = [
  // YANC Members
  {
    uid: 'user_member_1',
    email: 'member@yanc.in',
    role: 'yanc_member',
    name: 'Aarav Patel',
    phone: '9876543210',
    bio: 'Founder of BioDrop — developing portable solar-powered water purification units for semi-urban communities.',
    createdAt: '2026-08-01T09:00:00Z'
  },
  {
    uid: 'user_member_2',
    email: 'priya.sharma@yanc.in',
    role: 'yanc_member',
    name: 'Priya Sharma',
    phone: '9811223344',
    bio: 'Building FinPulse — gamified personal finance micro-investing platform for college students.',
    createdAt: '2026-08-10T10:30:00Z'
  },
  {
    uid: 'user_member_3',
    email: 'karan.mehta@yanc.in',
    role: 'yanc_member',
    name: 'Karan Mehta',
    phone: '9822334455',
    bio: 'Building QuickAgri — direct farm-to-cloud B2B grain supply chain analytics.',
    createdAt: '2026-08-15T14:00:00Z'
  },

  // Non-Members
  {
    uid: 'user_nonmember_1',
    email: 'nonmember@gmail.com',
    role: 'non_member',
    name: 'Rohan Gupta',
    phone: '9765432100',
    bio: 'Aspiring founder exploring hardware automation for vertical urban hydroponics.',
    createdAt: '2026-08-20T11:00:00Z'
  },
  {
    uid: 'user_nonmember_2',
    email: 'sneha.reddy@gmail.com',
    role: 'non_member',
    name: 'Sneha Reddy',
    phone: '9744556677',
    bio: 'AI graduate student prototyping automated compliance audit agents for healthcare clinics.',
    createdAt: '2026-08-22T16:20:00Z'
  },

  // Investors
  {
    uid: 'user_investor_1',
    email: 'investor@yanc.in',
    role: 'investor',
    name: 'Vikramaditya Singhania',
    phone: '9900112233',
    bio: 'Managing Partner at Matrix Horizon Ventures. Backed 22 early-stage startups in ClimateTech & DeepTech across India & SEA.',
    createdAt: '2026-07-10T10:00:00Z'
  },
  {
    uid: 'user_investor_2',
    email: 'ananya.venture@yanc.in',
    role: 'investor',
    name: 'Ananya Deshmukh',
    phone: '9922334455',
    bio: 'Angel Investor & ex-Head of Growth at Swiggy. Focused on consumer internet, D2C, and quick commerce.',
    createdAt: '2026-07-15T11:30:00Z'
  },
  {
    uid: 'user_investor_3',
    email: 'raghav.capital@yanc.in',
    role: 'investor',
    name: 'Raghav Aggarwal',
    phone: '9933445566',
    bio: 'Partner at Elevate Bharat Fund. Investing ₹1Cr–₹5Cr in B2B SaaS and Enterprise FinTech.',
    createdAt: '2026-07-20T08:45:00Z'
  },
  {
    uid: 'user_investor_4',
    email: 'harsh.marquee@yanc.in',
    role: 'investor',
    name: 'Harshvardhan Goenka',
    phone: '9944556677',
    bio: 'Marquee Tech Syndicate Lead. 3 Unicorn investments, deep connections across Global VC funds.',
    createdAt: '2026-07-01T09:15:00Z'
  },

  // Mentors
  {
    uid: 'user_mentor_1',
    email: 'mentor@yanc.in',
    role: 'mentor',
    name: 'Devraj Mukherjee',
    phone: '9888776655',
    bio: 'VP Engineering with 14 years architecting resilient distributed systems and enterprise product security.',
    createdAt: '2026-07-12T12:00:00Z'
  },
  {
    uid: 'user_mentor_2',
    email: 'meera.gtm@yanc.in',
    role: 'mentor',
    name: 'Meera Nambiar',
    phone: '9877665544',
    bio: 'Ex-Chief Product Officer at Razorpay. Specialist in 0-to-1 product discovery, unit economics, and PMF.',
    createdAt: '2026-07-18T15:00:00Z'
  },
  {
    uid: 'user_mentor_3',
    email: 'aditya.scale@yanc.in',
    role: 'mentor',
    name: 'Aditya Kapoor',
    phone: '9866554433',
    bio: 'Serial entrepreneur & Growth Architect. Helped 18 D2C brands scale from ₹10L/mo to ₹2Cr/mo ARR.',
    createdAt: '2026-07-25T13:20:00Z'
  },
  {
    uid: 'user_mentor_4',
    email: 'neha.legal@yanc.in',
    role: 'mentor',
    name: 'Neha Chawla',
    phone: '9855443322',
    bio: 'Startup Counsel & IP strategist. Assisted 50+ funding term sheets, cross-border holding flips, and ESOP design.',
    createdAt: '2026-08-01T17:45:00Z'
  },

  // Admins
  {
    uid: 'user_ops_admin',
    email: 'ops@yanc.in',
    role: 'ops_admin',
    name: 'Tanya Sen (Operations)',
    phone: '9800000001',
    bio: 'Lead Operations Administrator at YANC Connect.',
    createdAt: '2026-06-01T00:00:00Z'
  },
  {
    uid: 'user_finance_admin',
    email: 'finance@yanc.in',
    role: 'finance_admin',
    name: 'Suresh Iyer (Finance)',
    phone: '9800000002',
    bio: 'Treasury & Escrow Operations Manager at YANC Connect.',
    createdAt: '2026-06-01T00:00:00Z'
  },
  {
    uid: 'user_super_admin',
    email: 'admin@yanc.in',
    role: 'super_admin',
    name: 'Kabir Malhotra (Super Admin)',
    phone: '9800000003',
    bio: 'Chief Executive Officer & Platform Super Administrator.',
    createdAt: '2026-06-01T00:00:00Z'
  }
];

export const SEED_YANC_MEMBERS: YancMember[] = [
  {
    email: 'member@yanc.in',
    name: 'Aarav Patel',
    isYancMember: true,
    creditBalance: 120, // 120 credits = ₹12,000 equivalent
    membershipTier: 'Gold'
  },
  {
    email: 'priya.sharma@yanc.in',
    name: 'Priya Sharma',
    isYancMember: true,
    creditBalance: 45, // 45 credits = ₹4,500 equivalent
    membershipTier: 'Silver'
  },
  {
    email: 'karan.mehta@yanc.in',
    name: 'Karan Mehta',
    isYancMember: true,
    creditBalance: 250, // 250 credits = ₹25,000 equivalent
    membershipTier: 'Platinum'
  }
];

export const SEED_CREDITS_LEDGER: CreditLedgerEntry[] = [
  {
    id: 'cld_1',
    userId: 'user_member_1',
    amount: 100,
    type: 'earned',
    note: 'Initial Gold membership allocation',
    timestamp: '2026-08-01T09:05:00Z'
  },
  {
    id: 'cld_2',
    userId: 'user_member_1',
    amount: 40,
    type: 'earned',
    note: 'YANC Hackathon 2nd Place bonus',
    timestamp: '2026-08-15T18:00:00Z'
  },
  {
    id: 'cld_3',
    userId: 'user_member_1',
    amount: 20,
    type: 'spent',
    relatedSessionId: 'sess_prev_1',
    note: 'Spent on introductory mentor session',
    timestamp: '2026-08-20T11:00:00Z'
  },
  {
    id: 'cld_4',
    userId: 'user_member_3',
    amount: 300,
    type: 'earned',
    note: 'Platinum tier bonus grant',
    timestamp: '2026-08-15T14:05:00Z'
  },
  {
    id: 'cld_5',
    userId: 'user_member_3',
    amount: 50,
    type: 'transferred_to_investor',
    note: 'Transferred credits to investor tier boost',
    timestamp: '2026-08-25T16:00:00Z'
  }
];

export const SEED_ADMIN_USERS: AdminUser[] = [
  {
    email: 'ops@yanc.in',
    role: 'ops_admin',
    name: 'Tanya Sen'
  },
  {
    email: 'finance@yanc.in',
    role: 'finance_admin',
    name: 'Suresh Iyer'
  },
  {
    email: 'admin@yanc.in',
    role: 'super_admin',
    name: 'Kabir Malhotra'
  }
];

export const SEED_INVESTOR_MENTOR_PROFILES: InvestorMentorProfile[] = [
  // Investors
  {
    id: 'imp_inv_1',
    userId: 'user_investor_1',
    name: 'Vikramaditya Singhania',
    email: 'investor@yanc.in',
    type: 'investor',
    applicationStatus: 'approved',
    tier: 3, // Tier 3 - Established (cap ₹40,000)
    minTicketPrice: 2500000, // ₹25L
    typicalTicketSize: 5000000,
    pastInvestmentHistory: 'Invested in CarbonZero, AquaTech India, and GreenGrid Dynamics.',
    maxChargeCap: 40000,
    sectorsOrExpertiseTags: ['CleanTech', 'DeepTech', 'Hardware', 'Agritech'],
    sessionsCompleted: 14,
    creditsEarnedFromTransfers: 350,
    availabilitySlots: [
      {
        id: 'slot_inv1_1',
        date: '2026-09-12',
        time: '04:00 PM - 05:00 PM',
        mode: 'online',
        isBooked: false
      },
      {
        id: 'slot_inv1_2',
        date: '2026-09-15',
        time: '11:00 AM - 12:00 PM',
        mode: 'offline',
        location: 'WeWork Galaxy, Residency Road, Bangalore',
        isBooked: false
      },
      {
        id: 'slot_inv1_3',
        date: '2026-09-18',
        time: '02:00 PM - 03:00 PM',
        mode: 'online',
        isBooked: true // currently in a pending session
      }
    ],
    walletBalance: 85000,
    lifetimeEarnings: 210000,
    averageRating: 4.9,
    totalRatings: 11,
    reviews: [
      {
        founderName: 'Aarav Patel',
        rating: 5,
        text: 'Invaluable feedback on our thermal pump unit economics. Vikramaditya challenged our distribution model constructively.',
        date: '2026-08-28'
      },
      {
        founderName: 'Sahil Verma',
        rating: 5,
        text: 'Straightforward critique. He connected us directly to two municipal water pilots.',
        date: '2026-08-14'
      }
    ],
    bio: 'Managing Partner at Matrix Horizon Ventures. Backed 22 early-stage startups in ClimateTech & DeepTech across India & SEA.'
  },
  {
    id: 'imp_inv_2',
    userId: 'user_investor_2',
    name: 'Ananya Deshmukh',
    email: 'ananya.venture@yanc.in',
    type: 'investor',
    applicationStatus: 'approved',
    tier: 1, // Tier 1 - Emerging (cap ₹5,000)
    minTicketPrice: 250000, // ₹2.5L
    typicalTicketSize: 500000,
    pastInvestmentHistory: 'Angel cheques in 4 consumer D2C brands including NuGlow and DailyBites.',
    maxChargeCap: 5000,
    sectorsOrExpertiseTags: ['D2C', 'Consumer Tech', 'E-Commerce', 'Quick Commerce'],
    sessionsCompleted: 6,
    creditsEarnedFromTransfers: 180,
    availabilitySlots: [
      {
        id: 'slot_inv2_1',
        date: '2026-09-11',
        time: '03:00 PM - 04:00 PM',
        mode: 'online',
        isBooked: false
      },
      {
        id: 'slot_inv2_2',
        date: '2026-09-14',
        time: '05:00 PM - 06:00 PM',
        mode: 'online',
        isBooked: false
      }
    ],
    walletBalance: 24000,
    lifetimeEarnings: 30000,
    averageRating: 4.8,
    totalRatings: 5,
    reviews: [
      {
        founderName: 'Tanvi Joshi',
        rating: 5,
        text: 'Great advice on our repeat customer CAC and packaging design.',
        date: '2026-08-19'
      }
    ],
    bio: 'Angel Investor & ex-Head of Growth at Swiggy. Focused on consumer internet, D2C, and quick commerce.'
  },
  {
    id: 'imp_inv_3',
    userId: 'user_investor_3',
    name: 'Raghav Aggarwal',
    email: 'raghav.capital@yanc.in',
    type: 'investor',
    applicationStatus: 'approved',
    tier: 2, // Tier 2 - Growth (cap ₹15,000)
    minTicketPrice: 1000000, // ₹10L
    typicalTicketSize: 2500000,
    pastInvestmentHistory: 'Lead investor in B2B SaaS startups SyncFlow and InvoiceGenie.',
    maxChargeCap: 15000,
    sectorsOrExpertiseTags: ['FinTech', 'B2B SaaS', 'Enterprise Tech'],
    sessionsCompleted: 9,
    creditsEarnedFromTransfers: 480, // Very close to 500 threshold!
    availabilitySlots: [
      {
        id: 'slot_inv3_1',
        date: '2026-09-13',
        time: '10:00 AM - 11:00 AM',
        mode: 'online',
        isBooked: false
      },
      {
        id: 'slot_inv3_2',
        date: '2026-09-16',
        time: '02:00 PM - 03:00 PM',
        mode: 'offline',
        location: 'Cyber City Tower B, Gurugram',
        isBooked: false
      }
    ],
    walletBalance: 45000,
    lifetimeEarnings: 105000,
    averageRating: 4.7,
    totalRatings: 7,
    reviews: [
      {
        founderName: 'Deepak Rao',
        rating: 5,
        text: 'Sharpened our SaaS pricing tiers and enterprise pilot contract terms.',
        date: '2026-08-22'
      }
    ],
    bio: 'Partner at Elevate Bharat Fund. Investing ₹1Cr–₹5Cr in B2B SaaS and Enterprise FinTech.'
  },
  {
    id: 'imp_inv_4',
    userId: 'user_investor_4',
    name: 'Harshvardhan Goenka',
    email: 'harsh.marquee@yanc.in',
    type: 'investor',
    applicationStatus: 'approved',
    tier: 4, // Tier 4 - Marquee (cap ₹1,00,000)
    minTicketPrice: 10000000, // ₹1Cr
    typicalTicketSize: 50000000,
    pastInvestmentHistory: 'Founding investor across 3 decacorns in South Asia and US.',
    maxChargeCap: 100000,
    sectorsOrExpertiseTags: ['FinTech', 'AI', 'Global SaaS', 'DeepTech'],
    sessionsCompleted: 28,
    creditsEarnedFromTransfers: 1200,
    availabilitySlots: [
      {
        id: 'slot_inv4_1',
        date: '2026-09-20',
        time: '11:00 AM - 12:00 PM',
        mode: 'online',
        isBooked: false
      }
    ],
    walletBalance: 250000,
    lifetimeEarnings: 890000,
    averageRating: 5.0,
    totalRatings: 18,
    reviews: [
      {
        founderName: 'Aditi Nair',
        rating: 5,
        text: 'A life-changing 60-minute session. Harshvardhan dismantled our global expansion assumptions and provided the exact playbook we needed.',
        date: '2026-08-30'
      }
    ],
    bio: 'Marquee Tech Syndicate Lead. 3 Unicorn investments, deep connections across Global VC funds.'
  },

  // Mentors
  {
    id: 'imp_men_1',
    userId: 'user_mentor_1',
    name: 'Devraj Mukherjee',
    email: 'mentor@yanc.in',
    type: 'mentor',
    applicationStatus: 'approved',
    minTicketPrice: 0,
    // cap = min(3000 + floor(19/5)*500 + floor(320/100)*200, 25000) = 3000 + (3*500) + (3*200) = 3000 + 1500 + 600 = 5100
    // Note: 19 sessions completed is near the 20 breakpoint! (At 20 sessions, floor(20/5)=4, adds another ₹500)
    maxChargeCap: 5100,
    sectorsOrExpertiseTags: ['System Architecture', 'Cloud Infrastructure', 'Cybersecurity', 'AI & ML'],
    sessionsCompleted: 19, // Near breakpoint 20!
    creditsEarnedFromTransfers: 320,
    availabilitySlots: [
      {
        id: 'slot_men1_1',
        date: '2026-09-10',
        time: '06:00 PM - 07:00 PM',
        mode: 'online',
        isBooked: false
      },
      {
        id: 'slot_men1_2',
        date: '2026-09-12',
        time: '07:30 PM - 08:30 PM',
        mode: 'online',
        isBooked: false
      },
      {
        id: 'slot_men1_3',
        date: '2026-09-14',
        time: '04:00 PM - 05:00 PM',
        mode: 'offline',
        location: 'Indiranagar 100ft Rd, Bangalore',
        isBooked: true
      }
    ],
    walletBalance: 32000,
    lifetimeEarnings: 96000,
    averageRating: 4.9,
    totalRatings: 16,
    reviews: [
      {
        founderName: 'Aarav Patel',
        rating: 5,
        text: 'Devraj helped us redesign our IoT telemetry architecture to save 80% on AWS RDS bills.',
        date: '2026-08-26'
      }
    ],
    portfolioUrl: 'https://linkedin.com/in/devraj-mukherjee',
    yearsOfExperience: 14,
    bio: 'VP Engineering with 14 years architecting resilient distributed systems and enterprise product security.'
  },
  {
    id: 'imp_men_2',
    userId: 'user_mentor_2',
    name: 'Meera Nambiar',
    email: 'meera.gtm@yanc.in',
    type: 'mentor',
    applicationStatus: 'approved',
    minTicketPrice: 0,
    // cap = min(3000 + floor(11/5)*500 + floor(150/100)*200, 25000) = 3000 + 1000 + 200 = 4200
    maxChargeCap: 4200,
    sectorsOrExpertiseTags: ['Product Strategy', 'FinTech', 'UX Research', 'Go-To-Market'],
    sessionsCompleted: 11,
    creditsEarnedFromTransfers: 150,
    availabilitySlots: [
      {
        id: 'slot_men2_1',
        date: '2026-09-11',
        time: '11:00 AM - 12:00 PM',
        mode: 'online',
        isBooked: false
      },
      {
        id: 'slot_men2_2',
        date: '2026-09-15',
        time: '03:00 PM - 04:00 PM',
        mode: 'online',
        isBooked: false
      }
    ],
    walletBalance: 18000,
    lifetimeEarnings: 45000,
    averageRating: 4.8,
    totalRatings: 10,
    reviews: [
      {
        founderName: 'Priya Sharma',
        rating: 5,
        text: 'Meera provided crystal clear onboarding friction analysis. She knows fintech product funnels inside out.',
        date: '2026-08-18'
      }
    ],
    portfolioUrl: 'https://linkedin.com/in/meera-nambiar',
    yearsOfExperience: 12,
    bio: 'Ex-Chief Product Officer at Razorpay. Specialist in 0-to-1 product discovery, unit economics, and PMF.'
  },
  {
    id: 'imp_men_3',
    userId: 'user_mentor_3',
    name: 'Aditya Kapoor',
    email: 'aditya.scale@yanc.in',
    type: 'mentor',
    applicationStatus: 'approved',
    minTicketPrice: 0,
    // cap = min(3000 + floor(32/5)*500 + floor(720/100)*200, 25000) = 3000 + 3000 + 1400 = 7400
    maxChargeCap: 7400,
    sectorsOrExpertiseTags: ['D2C', 'Growth Marketing', 'Brand Strategy', 'Performance Ads'],
    sessionsCompleted: 32,
    creditsEarnedFromTransfers: 720,
    availabilitySlots: [
      {
        id: 'slot_men3_1',
        date: '2026-09-13',
        time: '02:00 PM - 03:00 PM',
        mode: 'online',
        isBooked: false
      }
    ],
    walletBalance: 52000,
    lifetimeEarnings: 180000,
    averageRating: 4.9,
    totalRatings: 25,
    reviews: [
      {
        founderName: 'Varun Sethi',
        rating: 5,
        text: 'Transformed our Meta ad ROAS from 1.4x to 3.8x in under three weeks.',
        date: '2026-08-20'
      }
    ],
    portfolioUrl: 'https://linkedin.com/in/aditya-kapoor-scale',
    yearsOfExperience: 10,
    bio: 'Serial entrepreneur & Growth Architect. Helped 18 D2C brands scale from ₹10L/mo to ₹2Cr/mo ARR.'
  },
  {
    id: 'imp_men_4',
    userId: 'user_mentor_4',
    name: 'Neha Chawla',
    email: 'neha.legal@yanc.in',
    type: 'mentor',
    applicationStatus: 'approved',
    minTicketPrice: 0,
    // cap = min(3000 + floor(7/5)*500 + floor(90/100)*200, 25000) = 3000 + 500 + 0 = 3500
    maxChargeCap: 3500,
    sectorsOrExpertiseTags: ['Legal & IP', 'Fundraising Compliance', 'ESOPs', 'Term Sheets'],
    sessionsCompleted: 7,
    creditsEarnedFromTransfers: 90,
    availabilitySlots: [
      {
        id: 'slot_men4_1',
        date: '2026-09-12',
        time: '05:00 PM - 06:00 PM',
        mode: 'online',
        isBooked: false
      },
      {
        id: 'slot_men4_2',
        date: '2026-09-16',
        time: '04:00 PM - 05:00 PM',
        mode: 'offline',
        location: 'Bandra Kurla Complex (BKC), Mumbai',
        isBooked: false
      }
    ],
    walletBalance: 12000,
    lifetimeEarnings: 24500,
    averageRating: 4.9,
    totalRatings: 6,
    reviews: [
      {
        founderName: 'Karan Mehta',
        rating: 5,
        text: 'Saved us from an onerous liquidation preference clause in our seed term sheet.',
        date: '2026-08-29'
      }
    ],
    portfolioUrl: 'https://linkedin.com/in/neha-chawla-law',
    yearsOfExperience: 11,
    bio: 'Startup Counsel & IP strategist. Assisted 50+ funding term sheets, cross-border holding flips, and ESOP design.'
  }
];

// 4 Advisors (Single source of truth is advisorApplications with status: approved)
export const SEED_ADVISOR_APPLICATIONS: AdvisorApplication[] = [
  {
    id: 'adv_app_1',
    userId: 'user_mentor_1', // Devraj Mukherjee (System Architecture, Cloud, AI)
    userName: 'Devraj Mukherjee',
    userEmail: 'mentor@yanc.in',
    questionnaireResponses: {
      whyAdvise: 'Passionate about guiding early-stage technical founders on enterprise architectural roadmap and avoiding technical debt.',
      sectorsOfExpertise: ['System Architecture', 'Cloud Infrastructure', 'AI & ML', 'DeepTech'],
      availability: '4 hours/month for quarterly board meetings & monthly syncs'
    },
    status: 'approved',
    submittedAt: '2026-07-20T10:00:00Z'
  },
  {
    id: 'adv_app_2',
    userId: 'user_mentor_2', // Meera Nambiar (Product, FinTech, GTM)
    userName: 'Meera Nambiar',
    userEmail: 'meera.gtm@yanc.in',
    questionnaireResponses: {
      whyAdvise: 'To help product-led startups establish sustainable retention funnels and clear market positioning.',
      sectorsOfExpertise: ['Product Strategy', 'FinTech', 'Go-To-Market', 'Consumer Tech'],
      availability: '6 hours/month + async strategic advisory'
    },
    status: 'approved',
    submittedAt: '2026-07-22T14:30:00Z'
  },
  {
    id: 'adv_app_3',
    userId: 'user_mentor_3', // Aditya Kapoor (D2C, Growth, Brand)
    userName: 'Aditya Kapoor',
    userEmail: 'aditya.scale@yanc.in',
    questionnaireResponses: {
      whyAdvise: 'Excited to help founders build defensible brand moats and scalable unit economics.',
      sectorsOfExpertise: ['D2C', 'Growth Marketing', 'Brand Strategy', 'E-Commerce'],
      availability: '5 hours/month'
    },
    status: 'approved',
    submittedAt: '2026-07-28T09:15:00Z'
  },
  {
    id: 'adv_app_4',
    userId: 'user_mentor_4', // Neha Chawla (Legal, IP, Governance)
    userName: 'Neha Chawla',
    userEmail: 'neha.legal@yanc.in',
    questionnaireResponses: {
      whyAdvise: 'Ensuring pristine cap table hygiene, governance discipline, and patent readiness for venture funding.',
      sectorsOfExpertise: ['Legal & IP', 'Fundraising Compliance', 'Corporate Governance', 'FinTech'],
      availability: '4 hours/month'
    },
    status: 'approved',
    submittedAt: '2026-08-02T11:00:00Z'
  }
];

// Sample Sessions spread across statuses:
// 1. pending_finance_review (with teardown memo)
// 2. memo_rejected (needs revision)
// 3. completed (with founder rating)
// 4. pending_provider_review (sitting past 48 hours for Needs Attention flag!)
// 5. awaiting_founder_response (offline to online proposed)
// 6. accepted (upcoming scheduled session)
// 7. rejected (with refund confirmed)
export const SEED_SESSIONS: Session[] = [
  {
    id: 'sess_1_finance_review',
    requesterId: 'user_member_1',
    requesterName: 'Aarav Patel',
    requesterEmail: 'member@yanc.in',
    providerId: 'imp_inv_1',
    providerName: 'Vikramaditya Singhania',
    providerRole: 'investor',
    mode: 'online',
    slotId: 'slot_inv1_past_1',
    slotDetails: {
      date: '2026-09-04',
      time: '03:00 PM - 04:00 PM'
    },
    pitchText: 'BioDrop is engineering an ultra-compact solar water desalinator for semi-arid agricultural communities in western Gujarat.',
    pitchDeckUrl: 'https://storage.googleapis.com/yanc-connect/sample-pitch-deck-biodrop.pdf',
    pitchDeckFileName: 'BioDrop_Seed_Pitch_Deck_v2.pdf',
    askAmount: 2500000,
    priceCharged: 35000,
    creditsPaid: 0,
    paymentMethod: 'cash',
    status: 'pending_finance_review',
    escrowAmount: 35000,
    escrowStatus: 'held',
    teardownMemo: {
      nextSteps: 'Founder must conduct 5 on-site stress tests under real solar thermal fluctuations before beginning tooling fabrication.',
      competitiveMoat: 'Proprietary carbon nanotube thermal evaporative membrane that reduces fouling rate by 65% compared to existing reverse osmosis units.',
      biggestRisk: 'Distributor dependency in remote rural panchayats and high upfront replacement membrane costs.',
      submittedAt: '2026-09-05T16:45:00Z'
    },
    createdAt: '2026-09-02T10:00:00Z'
  },
  {
    id: 'sess_2_memo_rejected',
    requesterId: 'user_member_2',
    requesterName: 'Priya Sharma',
    requesterEmail: 'priya.sharma@yanc.in',
    providerId: 'imp_men_2',
    providerName: 'Meera Nambiar',
    providerRole: 'mentor',
    mode: 'online',
    slotId: 'slot_men2_past_1',
    slotDetails: {
      date: '2026-09-03',
      time: '11:00 AM - 12:00 PM'
    },
    pitchText: 'FinPulse is developing a micro-savings round-up UPI app tailored specifically for undergraduate students across India.',
    pitchDeckUrl: 'https://storage.googleapis.com/yanc-connect/finpulse-deck.pdf',
    pitchDeckFileName: 'FinPulse_Deck.pdf',
    askAmount: 1500000,
    priceCharged: 4000,
    creditsPaid: 40,
    paymentMethod: 'credits',
    status: 'memo_rejected',
    escrowAmount: 4000,
    escrowStatus: 'held',
    teardownMemo: {
      nextSteps: 'Build waitlist on campuses.',
      competitiveMoat: 'College ambassadors.',
      biggestRisk: 'SEBI and RBI regulations.',
      submittedAt: '2026-09-04T12:00:00Z'
    },
    financeReviewNote: 'Memo is too brief and lacks concrete regulatory compliance action items for RBI prepaid payment instrument (PPI) guidelines. Please provide specific next steps and risk mitigation steps.',
    createdAt: '2026-09-01T14:30:00Z'
  },
  {
    id: 'sess_3_completed_rated',
    requesterId: 'user_member_1',
    requesterName: 'Aarav Patel',
    requesterEmail: 'member@yanc.in',
    providerId: 'imp_men_1',
    providerName: 'Devraj Mukherjee',
    providerRole: 'mentor',
    mode: 'online',
    slotId: 'slot_men1_past_1',
    slotDetails: {
      date: '2026-08-25',
      time: '06:00 PM - 07:00 PM'
    },
    pitchText: 'Architectural consultation for low-bandwidth cellular telemetry modules embedded into remote solar units.',
    pitchDeckUrl: 'https://storage.googleapis.com/yanc-connect/biodrop-iot-spec.pdf',
    pitchDeckFileName: 'BioDrop_IoT_Architecture.pdf',
    askAmount: 500000,
    priceCharged: 5000,
    creditsPaid: 50,
    paymentMethod: 'credits',
    status: 'completed',
    escrowAmount: 5000,
    escrowStatus: 'released',
    teardownMemo: {
      nextSteps: 'Migrate from raw HTTP polling to MQTT over TLS using AWS IoT Core with aggressive payload compression.',
      competitiveMoat: 'Sub-1KB payload telemetry packet format operating reliably over fragile 2G rural GSM networks.',
      biggestRisk: 'SIM card roaming carrier lockout and firmware updates failing over the air.',
      submittedAt: '2026-08-25T19:30:00Z'
    },
    founderRating: 5,
    founderReviewText: 'Devraj was phenomenal. He saved us months of trial-and-error by providing an exact MQTT message protocol specification.',
    createdAt: '2026-08-22T08:00:00Z'
  },
  {
    // STALE REQUEST SITTING PAST 48 HOURS (Needs Attention!)
    id: 'sess_4_stale_needs_attention',
    requesterId: 'user_nonmember_1',
    requesterName: 'Rohan Gupta',
    requesterEmail: 'nonmember@gmail.com',
    providerId: 'imp_inv_1',
    providerName: 'Vikramaditya Singhania',
    providerRole: 'investor',
    mode: 'online',
    slotId: 'slot_inv1_3',
    slotDetails: {
      date: '2026-09-18',
      time: '02:00 PM - 03:00 PM'
    },
    pitchText: 'HydroSprout is building precision automated nutrient dosing towers for modular hydroponic setups in commercial grocery warehouses.',
    pitchDeckUrl: 'https://storage.googleapis.com/yanc-connect/hydrosprout-deck.pdf',
    pitchDeckFileName: 'HydroSprout_PitchDeck.pdf',
    askAmount: 3000000,
    priceCharged: 35000,
    creditsPaid: 0,
    paymentMethod: 'cash',
    status: 'pending_provider_review',
    escrowAmount: 35000,
    escrowStatus: 'held',
    createdAt: '2026-09-03T09:00:00Z' // Over 96 hours ago (> 48h mark)
  },
  {
    id: 'sess_5_awaiting_founder_online',
    requesterId: 'user_member_3',
    requesterName: 'Karan Mehta',
    requesterEmail: 'karan.mehta@yanc.in',
    providerId: 'imp_men_1',
    providerName: 'Devraj Mukherjee',
    providerRole: 'mentor',
    mode: 'offline', // original requested
    slotId: 'slot_men1_3',
    slotDetails: {
      date: '2026-09-14',
      time: '04:00 PM - 05:00 PM',
      location: 'Indiranagar 100ft Rd, Bangalore'
    },
    pitchText: 'QuickAgri grain supply chain analytics platform seeking architectural audit for real-time truck weighing sensor integration.',
    pitchDeckUrl: 'https://storage.googleapis.com/yanc-connect/quickagri-deck.pdf',
    pitchDeckFileName: 'QuickAgri_Deck.pdf',
    askAmount: 2000000,
    priceCharged: 5000,
    creditsPaid: 50,
    paymentMethod: 'credits',
    status: 'awaiting_founder_response',
    escrowAmount: 5000,
    escrowStatus: 'held',
    createdAt: '2026-09-06T11:00:00Z'
  },
  {
    id: 'sess_6_accepted_upcoming',
    requesterId: 'user_member_1',
    requesterName: 'Aarav Patel',
    requesterEmail: 'member@yanc.in',
    providerId: 'imp_inv_2',
    providerName: 'Ananya Deshmukh',
    providerRole: 'investor',
    mode: 'online',
    slotId: 'slot_inv2_1',
    slotDetails: {
      date: '2026-09-11',
      time: '03:00 PM - 04:00 PM'
    },
    pitchText: 'BioDrop commercial retail pitch — planning to sell consumer-grade water filtration canisters in outdoor adventure stores.',
    pitchDeckUrl: 'https://storage.googleapis.com/yanc-connect/biodrop-consumer.pdf',
    pitchDeckFileName: 'BioDrop_Retail_Deck.pdf',
    askAmount: 500000,
    priceCharged: 5000,
    creditsPaid: 0,
    paymentMethod: 'cash',
    status: 'accepted',
    escrowAmount: 5000,
    escrowStatus: 'held',
    createdAt: '2026-09-05T14:00:00Z'
  },
  {
    id: 'sess_7_rejected_refunded',
    requesterId: 'user_nonmember_2',
    requesterName: 'Sneha Reddy',
    requesterEmail: 'sneha.reddy@gmail.com',
    providerId: 'imp_men_3',
    providerName: 'Aditya Kapoor',
    providerRole: 'mentor',
    mode: 'online',
    slotId: 'slot_men3_old',
    slotDetails: {
      date: '2026-08-30',
      time: '02:00 PM - 03:00 PM'
    },
    pitchText: 'AI health compliance audit tool looking for consumer marketing and lead acquisition strategies.',
    pitchDeckUrl: 'https://storage.googleapis.com/yanc-connect/healthai-audit.pdf',
    pitchDeckFileName: 'HealthAudit_AI_Summary.pdf',
    askAmount: 1000000,
    priceCharged: 7000,
    paymentMethod: 'cash',
    status: 'rejected',
    escrowAmount: 7000,
    escrowStatus: 'refunded',
    providerRejectionReason: 'My expertise is strictly D2C and consumer internet brand scaling; your healthcare B2B regulatory model requires specialized healthcare enterprise sales mentorship.',
    createdAt: '2026-08-28T10:00:00Z'
  }
];

// Active Advisory Board with 3 advisors and a pending swap request
export const SEED_ADVISORY_BOARDS: AdvisoryBoardRequest[] = [
  {
    id: 'adv_board_1',
    founderId: 'user_member_1',
    founderName: 'Aarav Patel',
    founderEmail: 'member@yanc.in',
    pitchSummary: 'BioDrop clean technology board: Scaling manufactured solar water purifiers across municipal government tenders and NGO water infrastructure projects.',
    industryTags: ['CleanTech', 'DeepTech', 'System Architecture', 'Hardware'],
    status: 'active',
    suggestedAdvisorIds: ['adv_app_1', 'adv_app_4', 'adv_app_2', 'adv_app_3'],
    finalAdvisors: [
      {
        advisorId: 'adv_app_1',
        advisorName: 'Devraj Mukherjee',
        advisorEmail: 'mentor@yanc.in',
        equityPercent: 1.0
      },
      {
        advisorId: 'adv_app_4',
        advisorName: 'Neha Chawla',
        advisorEmail: 'neha.legal@yanc.in',
        equityPercent: 0.75
      },
      {
        advisorId: 'adv_app_3',
        advisorName: 'Aditya Kapoor',
        advisorEmail: 'aditya.scale@yanc.in',
        equityPercent: 0.75
      }
    ],
    yearlyPackageCost: 180000, // ₹1,80,000 yearly package
    packagePaymentStatus: 'paid',
    createdAt: '2026-08-10T12:00:00Z'
  }
];

export const SEED_ADVISOR_SWAP_REQUESTS: AdvisorSwapRequest[] = [
  {
    id: 'swap_req_1',
    advisoryBoardRequestId: 'adv_board_1',
    founderId: 'user_member_1',
    founderName: 'Aarav Patel',
    advisorIdToRemove: 'adv_app_3', // Aditya Kapoor (D2C marketing)
    advisorNameToRemove: 'Aditya Kapoor',
    reason: 'Our strategic priority shifted from direct-to-consumer online canister retail to institutional FinTech municipal financing and B2B utility partnerships. We need advisory expertise centered on enterprise finance partnerships rather than consumer social media ad scaling.',
    status: 'pending',
    createdAt: '2026-09-05T15:30:00Z'
  }
];

export const SEED_WITHDRAWAL_REQUESTS: WithdrawalRequest[] = [
  {
    id: 'wdr_1',
    userId: 'user_investor_1',
    userName: 'Vikramaditya Singhania',
    userRole: 'investor',
    amount: 35000,
    bankOrUpiDetails: 'HDFC Bank, A/C: 5010049281928, IFSC: HDFC0000128',
    status: 'pending',
    requestedAt: '2026-09-06T10:30:00Z'
  },
  {
    id: 'wdr_2',
    userId: 'user_mentor_1',
    userName: 'Devraj Mukherjee',
    userRole: 'mentor',
    amount: 15000,
    bankOrUpiDetails: 'devraj@icici (UPI)',
    status: 'pending',
    requestedAt: '2026-09-06T14:15:00Z'
  },
  {
    id: 'wdr_3',
    userId: 'user_investor_2',
    userName: 'Ananya Deshmukh',
    userRole: 'investor',
    amount: 6000,
    bankOrUpiDetails: 'ananya.venture@okhdfcbank',
    status: 'approved',
    requestedAt: '2026-08-20T09:00:00Z',
    processedBy: 'Suresh Iyer (Finance)',
    processedAt: '2026-08-21T11:00:00Z'
  }
];

export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    userId: 'user_investor_1',
    message: 'New session request received from Rohan Gupta (HydroSprout). Escrow held: ₹35,000.',
    read: false,
    sentBy: 'System Escrow',
    relatedId: 'sess_4_stale_needs_attention',
    createdAt: '2026-09-03T09:01:00Z'
  },
  {
    id: 'notif_2',
    userId: 'user_ops_admin',
    message: 'Needs Attention: Session sess_4_stale_needs_attention has been pending provider decision for more than 48 hours.',
    read: false,
    sentBy: 'System Monitor',
    relatedId: 'sess_4_stale_needs_attention',
    createdAt: '2026-09-05T09:01:00Z'
  },
  {
    id: 'notif_3',
    userId: 'user_member_1',
    message: 'Your teardown memo for session sess_3_completed_rated was approved by Finance Admin. Rating is now open!',
    read: true,
    sentBy: 'Finance Admin',
    relatedId: 'sess_3_completed_rated',
    createdAt: '2026-08-26T10:00:00Z'
  },
  {
    id: 'notif_4',
    userId: 'user_mentor_2',
    message: 'Your teardown memo for session sess_2_memo_rejected requires revision. Reason: Memo is too brief and lacks concrete regulatory compliance action items.',
    read: false,
    sentBy: 'Finance Admin',
    relatedId: 'sess_2_memo_rejected',
    createdAt: '2026-09-04T13:00:00Z'
  },
  {
    id: 'notif_5',
    userId: 'user_member_3',
    message: 'Devraj Mukherjee proposed conducting your session online instead of offline due to travel schedule. Please review.',
    read: false,
    sentBy: 'Devraj Mukherjee',
    relatedId: 'sess_5_awaiting_founder_online',
    createdAt: '2026-09-06T11:05:00Z'
  }
];

export const SEED_BROADCASTS: Broadcast[] = [
  {
    id: 'bc_1',
    message: '🚀 Welcome to YANC Connect Season 3! All YANC Gold & Platinum members now receive 10 bonus credits upon booking their first deep-dive advisory board.',
    postedBy: 'Ops Admin (Tanya Sen)',
    createdAt: '2026-09-01T08:00:00Z'
  }
];
