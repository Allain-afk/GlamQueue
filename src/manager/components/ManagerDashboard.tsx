import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getMyProfile, type Profile } from '../../api/profile';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { StaffScreen } from '../screens/StaffScreen';
import { NotificationDropdown } from '../../components/NotificationDropdown';
import { SettingsDropdown } from '../../components/SettingsDropdown';
import { AvatarDropdown } from '../../components/AvatarDropdown';
import { EditProfile } from '../../components/EditProfile';
import { ManagerBottomNav, type ManagerNavItem } from '../../components/mobile';

interface ManagerDashboardProps {
  onLogout: () => void;
}

type TabType = 'dashboard' | 'appointments' | 'clients' | 'staff';

// Map TabType to ManagerNavItem
const tabToNavItem: Record<TabType, ManagerNavItem> = {
  dashboard: 'dashboard',
  appointments: 'dashboard',
  clients: 'team',
  staff: 'team',
};

export function ManagerDashboard({ onLogout }: ManagerDashboardProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);

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
      
      if (userProfile.role !== 'manager') {
        setError('Access denied. Manager role required.');
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

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard' },
    { id: 'appointments' as TabType, label: 'Appointments' },
    { id: 'clients' as TabType, label: 'Clients' },
    { id: 'staff' as TabType, label: 'Staff' },
  ];

  // Handle mobile navigation
  const handleMobileNavigate = (item: ManagerNavItem) => {
    switch (item) {
      case 'dashboard':
        setActiveTab('dashboard');
        break;
      case 'team':
        setActiveTab('staff');
        break;
      case 'reports':
        setActiveTab('appointments');
        break;
      case 'more':
        setActiveTab('clients');
        break;
    }
  };

  const ActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardScreen />;
      case 'appointments': return <AppointmentsScreen />;
      case 'clients': return <ClientsScreen />;
      case 'staff': return <StaffScreen />;
      default: return <DashboardScreen />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading manager dashboard...</p>
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
                <p className="text-xs text-gray-500">Manager Dashboard</p>
              </div>
            </div>

            {/* Search Bar - Desktop only */}
            <div className="hidden md:block flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search appointments, clients, staff..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 md:space-x-3">
              <NotificationDropdown role="manager" />
              
              <SettingsDropdown 
                onLogout={onLogout} 
                onEditProfile={() => setShowEditProfile(true)}
                role="manager" 
              />

              <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

              {/* User Profile */}
              <AvatarDropdown 
                profile={profile} 
                onLogout={onLogout} 
                onEditProfile={() => setShowEditProfile(true)}
                role="manager" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Tabs - Desktop only */}
      <div className="bg-white border-b border-gray-200 desktop-only">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium text-sm transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-[#FF5A5F]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5A5F]"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Tab Title */}
      <div className="mobile-only bg-white border-b border-gray-100 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900 capitalize">{activeTab}</h2>
      </div>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 md:py-8">
        <ActiveScreen />
      </main>

      {/* Mobile Bottom Navigation */}
      <ManagerBottomNav 
        activeItem={tabToNavItem[activeTab]} 
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

