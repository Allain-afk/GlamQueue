import { useState, useEffect, useMemo } from 'react';
import { Search, Bell, Settings, LogOut } from 'lucide-react';
import { getMyProfile, type Profile } from '../../api/profile';
import { AdminDataProvider } from '../context/AdminDataContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { StaffScreen } from '../screens/StaffScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { MarketingScreen } from '../screens/MarketingScreen';

interface NewAdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'dashboard' | 'appointments' | 'clients' | 'staff' | 'analytics' | 'marketing';

export function NewAdminDashboard({ onLogout }: NewAdminDashboardProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
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
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
              </button>
              
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>

              <div className="h-8 w-px bg-gray-200"></div>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{profile?.email?.split('@')[0] || 'Admin'}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {profile?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-[1600px] mx-auto px-6">
          <nav className="flex space-x-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-600 bg-pink-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

        {/* Main Content */}
        <main className="max-w-[1600px] mx-auto px-6 py-8">
          {ActiveScreen}
        </main>

        {/* Footer */}
        <footer className="max-w-[1600px] mx-auto px-6 py-6 mt-12 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2024 GlamQueue. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-pink-600 transition-colors">Help</a>
              <a href="#" className="hover:text-pink-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-pink-600 transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    </AdminDataProvider>
  );
}

