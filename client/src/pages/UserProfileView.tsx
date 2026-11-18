import React, { useState } from 'react';
import { AppUser } from '../types';
import { api } from '../services/api';
import { User, Shield, Key, Building, Phone, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface UserProfileViewProps {
  currentUser: AppUser;
  onUserUpdated: (updatedUser: AppUser) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ currentUser, onUserUpdated }) => {
  const [name, setName] = useState(currentUser.name || currentUser.username);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [department, setDepartment] = useState(currentUser.department || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await api.updateProfile({ name, phone, department });
      if (res.success) {
        setProfileSuccess('Profile details saved successfully.');
        const updated = { ...currentUser, name, phone, department };
        localStorage.setItem('zenlyft_user', JSON.stringify(updated));
        onUserUpdated(updated);
      } else {
        setProfileError(res.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setProfileError(err.message || 'Network error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess(null);
    setPassError(null);

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPassSuccess('Password updated successfully. Please use it for your next login.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassError(res.error || 'Failed to change password');
      }
    } catch (err: any) {
      setPassError(err.message || 'Network error');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Account Profile & Security</h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Manage your personal operator details, view role permissions, and maintain credential security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Identity Summary Card */}
        <div className="bg-white rounded-xl border border-subtle-border p-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-forest-100 border border-forest-500/30 flex items-center justify-center text-forest-700 font-bold text-2xl mb-4">
            {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.username[0].toUpperCase()}
          </div>
          <h2 className="text-lg font-bold text-charcoal-900">{currentUser.name || currentUser.username}</h2>
          <p className="text-xs font-mono text-charcoal-500 mt-0.5">@{currentUser.username}</p>

          <div className="mt-4 pt-4 border-t border-subtle-divider space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-charcoal-500 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-forest-500" />
                <span>Assigned Role</span>
              </span>
              <span className="font-semibold text-forest-700 uppercase bg-forest-100 px-2 py-0.5 rounded text-[10px]">
                {currentUser.role}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-charcoal-500 flex items-center space-x-1.5">
                <Building className="w-3.5 h-3.5 text-forest-500" />
                <span>Department</span>
              </span>
              <span className="font-medium text-charcoal-900">
                {currentUser.department || 'General'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-charcoal-500 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-forest-500" />
                <span>Branch</span>
              </span>
              <span className="font-medium text-charcoal-900 text-right">
                {currentUser.branch || 'Main Plant - Tiruchirappalli'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Edit & Password Change Columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Form 1: Profile Details */}
          <div className="bg-white rounded-xl border border-subtle-border p-6 shadow-sm">
            <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-subtle-divider">
              <User className="w-4 h-4 text-forest-700" />
              <h3 className="font-bold text-sm text-charcoal-900">Contact & Identity Information</h3>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-forest-100 border border-forest-500/30 text-forest-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Official Mobile / Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Operational Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Manufacturing, Route Sales, Executive"
                  className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving Details...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Form 2: Password Update */}
          <div className="bg-white rounded-xl border border-subtle-border p-6 shadow-sm">
            <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-subtle-divider">
              <Key className="w-4 h-4 text-forest-700" />
              <h3 className="font-bold text-sm text-charcoal-900">Change Password</h3>
            </div>

            {passSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-forest-100 border border-forest-500/30 text-forest-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}
            {passError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">New Password (min 6 characters)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-cream-50 border border-subtle-border rounded-lg text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {isChangingPass ? 'Updating Security...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
