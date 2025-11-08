import { useState, useEffect } from 'react';
import { Search, Bell, LogOut } from 'lucide-react';
import { getMyProfile, type Profile } from '../../api/profile';
import { BookingsScreen } from '../screens/BookingsScreen';

interface StaffDashboardProps {
  onLogout: () => void;
}

export function StaffDashboard({ onLogout }: StaffDashboardProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await getMyProfile();
      
      if (!userProfile) {
        setError('No profile found');
        return;
      }
      
      if (userProfile.role !== 'staff') {
        setError('Access denied. Staff role required.');
        return;
      }

      setProfile(userProfile);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading staff dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onLogout}
            className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">GQ</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Glam Queue
                </h1>
                <p className="text-xs text-gray-500">Staff Dashboard</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
              </button>

              <div className="h-8 w-px bg-gray-200"></div>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{profile?.email?.split('@')[0] || 'Staff'}</p>
                  <p className="text-xs text-gray-500">Staff</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {profile?.email?.charAt(0).toUpperCase() || 'S'}
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <BookingsScreen />
      </main>
    </div>
  );
}

