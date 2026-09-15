import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Award, Coins, Star, ShieldCheck, Check } from 'lucide-react';
import { User as UserType, YancMember, InvestorMentorProfile } from '../types';
import { db } from '../services/db';
import { authService } from '../services/auth';

interface ProfileModalProps {
  currentUser: UserType | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ currentUser, isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const [yancMember, setYancMember] = useState<YancMember | null>(null);
  const [providerProfile, setProviderProfile] = useState<InvestorMentorProfile | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name || '');
    setPhone(currentUser.phone || '');
    setBio(currentUser.bio || '');

    // Check YancMember data
    const member = db.get<YancMember>('yancMembers').find(m => m.email === currentUser.email);
    setYancMember(member || null);

    // Check Investor/Mentor Profile
    const profile = db.get<InvestorMentorProfile>('investorMentorProfiles').find(p => p.userId === currentUser.uid || p.email === currentUser.email);
    setProviderProfile(profile || null);
  }, [currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSave = () => {
    db.update<UserType>('users', currentUser.uid, {
      name: name.trim(),
      phone: phone.trim(),
      bio: bio.trim()
    }, 'uid');

    // Also update current user in session
    authService.setCurrentUser({
      ...currentUser,
      name: name.trim(),
      phone: phone.trim(),
      bio: bio.trim()
    });

    setIsEditing(false);
    setSavedMessage('Profile details successfully updated in database!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7C3AED] to-[#D946EF] p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xl font-black">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold">{currentUser.name}</h3>
              <p className="text-xs text-purple-100 capitalize">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {savedMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedMessage}</span>
            </div>
          )}

          {/* Member / Role Status Badges */}
          {yancMember && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-purple-700 tracking-wider">YANC Membership</span>
                <p className="text-sm font-black text-gray-900">{yancMember.membershipTier} Member</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Credit Balance</span>
                <p className="text-sm font-extrabold text-purple-700 flex items-center gap-1 justify-end">
                  <Coins className="w-4 h-4 text-amber-500" />
                  {yancMember.creditBalance} Credits (₹{(yancMember.creditBalance * 100).toLocaleString('en-IN')})
                </p>
              </div>
            </div>
          )}

          {/* Investor / Mentor Auto-Calculated Stats */}
          {providerProfile && (
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Auto-Computed Status</span>
                  <p className="text-xs font-bold text-gray-800 capitalize">
                    {providerProfile.type === 'investor' ? `Investor Tier ${providerProfile.tier}` : 'Verified Mentor'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Session Charge Cap</span>
                  <p className="text-xs font-extrabold text-purple-700">₹{providerProfile.maxChargeCap.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200 text-gray-600">
                <span>Sessions Completed: <strong className="text-gray-900">{providerProfile.sessionsCompleted}</strong></span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <strong>{providerProfile.averageRating}</strong> ({providerProfile.totalRatings} ratings)
                </span>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Read Only)</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-xs text-gray-600 border border-gray-200">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span className="truncate">{currentUser.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                disabled={!isEditing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                disabled={!isEditing}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bio / Profile Summary</label>
              <textarea
                rows={3}
                disabled={!isEditing}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about your venture, vision, or background..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-profile"
                  onClick={handleSave}
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <button
                id="btn-edit-profile"
                onClick={() => setIsEditing(true)}
                className="w-full py-2 text-xs font-bold text-purple-700 border border-purple-200 bg-purple-50/50 hover:bg-purple-100 rounded-xl transition"
              >
                Edit Profile
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
