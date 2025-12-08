import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { getMyProfile, type Profile } from '../../api/profile';
import { AdminDataProvider } from '../context/AdminDataContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { StaffScreen } from '../screens/StaffScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { MarketingScreen } from '../screens/MarketingScreen';
import { NotificationDropdown } from '../../components/NotificationDropdown';
import { SettingsDropdown } from '../../components/SettingsDropdown';
import { AvatarDropdown } from '../../components/AvatarDropdown';
import { AdminBottomNav, type AdminNavItem } from '../../components/mobile';

interface NewAdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'dashboard' | 'appointments' | 'clients' | 'staff' | 'analytics' | 'marketing';

// Map TabType to AdminNavItem for mobile navigation
const tabToNavItem: Record<TabType, AdminNavItem> = {
  dashboard: 'dashboard',
  appointments: 'appointments',
  clients: 'clients',
  staff: 'more',
  analytics: 'analytics',
  marketing: 'more',
};

export function NewAdminDashboard({ onLogout }: NewAdminDashboardProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle mobile navigation
  const handleMobileNavigate = (item: AdminNavItem) => {
    switch (item) {
      case 'dashboard':
        setActiveTab('dashboard');
        break;
      case 'appointments':
        setActiveTab('appointments');
        break;
      case 'clients':
        setActiveTab('clients');
        break;
      case 'analytics':
        setActiveTab('analytics');
        break;
      case 'more':
        setActiveTab('staff');
        break;
    }
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
      
      if (userProfile.role !== 'admin') {
        setError('Access denied. Admin role required.');
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
    { id: 'analytics' as TabType, label: 'Analytics' },
    { id: 'marketing' as TabType, label: 'Marketing' },
  ];

  // Memoize the active screen BEFORE early returns (Para optimized ang dashboard every screen render, dli lag HAHAHAH magic!!!)
  const ActiveScreen = useMemo(() => {
    switch (activeTab) {
      case 'dashboard': return <DashboardScreen />;
      case 'appointments': return <AppointmentsScreen />;
      case 'clients': return <ClientsScreen />;
      case 'staff': return <StaffScreen />;
      case 'analytics': return <AnalyticsScreen />;
      case 'marketing': return <MarketingScreen />;
      default: return <DashboardScreen />;
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
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
    <AdminDataProvider>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 mobile-layout">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm safe-area-top">
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
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:block flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search clients, appointments, services..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              <NotificationDropdown role="admin" />
              
              <SettingsDropdown onLogout={onLogout} role="admin" />

              <div className="h-8 w-px bg-gray-200"></div>

              {/* User Profile */}
              <AvatarDropdown profile={profile} onLogout={onLogout} role="admin" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Desktop Only (mobile uses bottom nav) */}
        <div className="max-w-[1600px] mx-auto px-6 desktop-only">
          <nav className="flex space-x-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#FF5A5F] text-[#FF5A5F] bg-red-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Header Title */}
        <div className="mobile-only px-4 py-2 border-t border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 capitalize">{activeTab}</h2>
        </div>
      </header>

        {/* Main Content */}
        <main className="max-w-[1600px] mx-auto px-6 py-8">
          {ActiveScreen}
        </main>

        {/* Footer - Desktop Only */}
        <footer className="max-w-[1600px] mx-auto px-6 py-6 mt-12 border-t border-gray-200 desktop-only">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2024 GlamQueue. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-pink-600 transition-colors">Help</a>
              <a href="#" className="hover:text-pink-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-pink-600 transition-colors">Terms</a>
            </div>
          </div>
        </footer>

        {/* Mobile Bottom Navigation - only visible on mobile */}
        <AdminBottomNav 
          activeItem={tabToNavItem[activeTab]} 
          onNavigate={handleMobileNavigate} 
        />
      </div>
    </AdminDataProvider>
  );
}