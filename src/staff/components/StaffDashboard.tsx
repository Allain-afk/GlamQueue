import { useState, useEffect } from 'react';
import { getMyProfile, type Profile } from '../../api/profile';
import { BookingsScreen } from '../screens/BookingsScreen';
import { NotificationDropdown } from '../../components/NotificationDropdown';
import { SettingsDropdown } from '../../components/SettingsDropdown';
import { AvatarDropdown } from '../../components/AvatarDropdown';
import { EditProfile } from '../../components/EditProfile';
import { StaffBottomNav, type StaffNavItem } from '../../components/mobile';

interface StaffDashboardProps {
  onLogout: () => void;
}

type StaffView = 'schedule' | 'clients' | 'profile';

export function StaffDashboard({ onLogout }: StaffDashboardProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<StaffView>('schedule');
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Handle mobile navigation
  const handleMobileNavigate = (item: StaffNavItem) => {
    setActiveView(item as StaffView);
  };

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

  // Render view content
  const renderContent = () => {
    switch (activeView) {
      case 'schedule':
        return <BookingsScreen />;
      case 'clients':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">My Clients</h2>
            <p className="text-gray-600">Client list coming soon...</p>
          </div>
        );
      case 'profile': {
        const displayName = profile?.email?.split('@')[0] || 'Staff Member';
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
                <p className="text-gray-600">{profile?.email}</p>
                <span className="inline-block mt-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium capitalize">
                  {profile?.role}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        );
      }
      default:
        return <BookingsScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 mobile-layout">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm safe-area-top">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4">
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
            <div className="flex items-center space-x-2 md:space-x-3">
              <NotificationDropdown role="staff" />
              
              <SettingsDropdown 
                onLogout={onLogout} 
                onEditProfile={() => setShowEditProfile(true)}
                role="staff" 
              />

              <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

              {/* User Profile */}
              <AvatarDropdown 
                profile={profile} 
                onLogout={onLogout} 
                onEditProfile={() => setShowEditProfile(true)}
                role="staff" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="mobile-only bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'schedule' as const, label: 'My Schedule' },
            { id: 'clients' as const, label: 'Clients' },
            { id: 'profile' as const, label: 'Profile' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeView === tab.id
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 md:py-8">
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <StaffBottomNav 
        activeItem={activeView} 
        onNavigate={handleMobileNavigate} 
      />

      {/* Edit Profile Modal */}
      {showEditProfile && profile && (
        <EditProfile
          profile={profile}
          onClose={() => setShowEditProfile(false)}
          onUpdate={(updatedProfile) => {
            setProfile(updatedProfile);
            setShowEditProfile(false);
          }}
        />
      )}
    </div>
  );
}

