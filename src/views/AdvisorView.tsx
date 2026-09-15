import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Award, 
  Calendar, 
  Mail, 
  FileText, 
  Sparkles, 
  Clock, 
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { User, AdvisoryBoardRequest, InvestorMentorProfile } from '../types';
import { db } from '../services/db';

interface AdvisorViewProps {
  currentUser: User;
  activeTab: string;
}

export const AdvisorView: React.FC<AdvisorViewProps> = ({ currentUser, activeTab }) => {
  const [boards, setBoards] = useState<AdvisoryBoardRequest[]>([]);
  const [advisorProfile, setAdvisorProfile] = useState<InvestorMentorProfile | null>(null);

  useEffect(() => {
    // Find advisor profile
    const unsubProfile = db.subscribe<InvestorMentorProfile>('investorMentorProfiles', (all) => {
      const p = all.find(prof => prof.userId === currentUser.uid || prof.email === currentUser.email);
      setAdvisorProfile(p || null);
    });

    // Find advisory boards assigned to this advisor
    const unsubBoards = db.subscribe<AdvisoryBoardRequest>('advisoryBoardRequests', (all) => {
      const assigned = all.filter(b => 
        b.status === 'active' && 
        b.finalAdvisors.some(adv => adv.advisorEmail === currentUser.email || adv.advisorId === currentUser.uid)
      );
      setBoards(assigned);
    });

    return () => {
      unsubProfile();
      unsubBoards();
    };
  }, [currentUser]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">{currentUser.name}</h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/40 text-purple-200 border border-purple-400/30">
              Active Board Advisor
            </span>
          </div>
          <p className="text-xs text-purple-200 mt-1 max-w-xl">
            Strategic board seats, equity allocations, governance, and quarterly syncs with YANC Connect portfolio startups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right px-4 py-2 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
            <span className="text-[10px] text-purple-200 uppercase font-semibold block">Active Board Seats</span>
            <span className="text-lg font-black text-amber-300">{boards.length} Startups</span>
          </div>
        </div>
      </div>

      {/* Boards Overview */}
      <div className="space-y-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Your Portfolio Startup Advisory Boards</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Review company roadmap milestones, fellow board advisors, and equity agreements.
            </p>
          </div>
        </div>

        {boards.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-700">No active advisory boards currently assigned</h4>
            <p className="text-xs text-gray-400 mt-1">
              Operations Admin matches your expertise with new founder board requests algorithmically.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {boards.map(board => {
              const myAdvisorEntry = board.finalAdvisors.find(a => 
                a.advisorEmail === currentUser.email || a.advisorId === currentUser.uid
              );

              return (
                <div
                  key={board.id}
                  id={`advisor-board-card-${board.id}`}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-gray-900">{board.founderName}'s Venture Board</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Active Mandate
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Founder Contact: <a href={`mailto:${board.founderEmail}`} className="text-purple-700 font-semibold underline">{board.founderEmail}</a>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase block">Your Equity Stake</span>
                      <span className="text-lg font-black text-purple-700">
                        {myAdvisorEntry?.equityPercent || 1.5}% Advisory Equity
                      </span>
                    </div>
                  </div>

                  {/* Company Pitch Summary */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                    <span className="font-bold text-gray-900 block">Venture Pitch & Strategic Focus:</span>
                    <p className="text-gray-700 leading-relaxed">{board.pitchSummary}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {board.industryTags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-semibold text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Board Members Roster */}
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
                      Co-Advisors on this Board ({board.finalAdvisors.length})
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {board.finalAdvisors.map(adv => (
                        <div key={adv.advisorId} className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">{adv.advisorName}</span>
                            <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                              {adv.equityPercent}%
                            </span>
                          </div>
                          <p className="text-gray-500 text-[11px] truncate">{adv.advisorEmail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meeting Schedule Placeholder */}
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Next Quarterly Board Sync: <strong className="font-bold">Last Thursday of Month, 5:00 PM IST</strong></span>
                    </div>
                    <span className="text-[11px] text-blue-700 font-semibold">Calendar invite active</span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
