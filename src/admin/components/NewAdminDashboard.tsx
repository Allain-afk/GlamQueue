import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getMyProfile, type Profile } from '../../api/profile';
import { AdminDataProvider } from '../context/AdminDataContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { StaffScreen } from '../screens/StaffScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { MarketingScreen } from '../screens/MarketingScreen';
import { ServicesScreen } from '../screens/ServicesScreen';
import { BranchesScreen } from '../screens/BranchesScreen';
import { NotificationDropdown } from '../../components/NotificationDropdown';
import { SettingsDropdown } from '../../components/SettingsDropdown';
import { AvatarDropdown } from '../../components/AvatarDropdown';
import { EditProfile } from '../../components/EditProfile';
import { AdminBottomNav, type AdminNavItem } from '../../components/mobile';

interface NewAdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'dashboard' | 'appointments' | 'clients' | 'staff' | 'analytics' | 'marketing' | 'services' | 'branches';

// Map TabType to AdminNavItem for mobile navigation
const tabToNavItem: Record<TabType, AdminNavItem> = {
  dashboard: 'dashboard',
  appointments: 'appointments',
  clients: 'clients',
  staff: 'more',
  analytics: 'analytics',
  marketing: 'more',
  services: 'more',
  branches: 'more',
};

export function NewAdminDashboard({ onLogout }: NewAdminDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);

  // Get active tab from URL path
  const getActiveTabFromPath = (): TabType => {
    const path = location.pathname;
    if (path.includes('/appointments')) return 'appointments';
    if (path.includes('/clients')) return 'clients';
    if (path.includes('/staff')) return 'staff';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/marketing')) return 'marketing';
    if (path.includes('/services')) return 'services';
    if (path.includes('/branches')) return 'branches';
    return 'dashboard';
  };

  const activeTab = getActiveTabFromPath();

  // Handle tab navigation
  const handleTabChange = (tab: TabType) => {
    if (tab === 'dashboard') {
      navigate('/admin-dashboard');
    } else {
      navigate(`/admin-dashboard/${tab}`);
    }
  };

  // Handle mobile navigation
  const handleMobileNavigate = (item: AdminNavItem) => {
    setShowMobileMoreMenu(false);
    switch (item) {
      case 'dashboard':
        navigate('/admin-dashboard');
        break;
      case 'appointments':
        navigate('/admin-dashboard/appointments');
        break;
      case 'clients':
        navigate('/admin-dashboard/clients');
        break;
      case 'analytics':
        navigate('/admin-dashboard/analytics');
        break;
      case 'more':
        setShowMobileMoreMenu(true);
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
    { id: 'services' as TabType, label: 'Services' },
    { id: 'branches' as TabType, label: 'Branches' },
  ];


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
              <NotificationDropdown 
                role="admin" 
                onNotificationClick={(_appointmentId) => {
                  navigate('/admin-dashboard/appointments');
                  // Optionally scroll to the appointment or highlight it
                  // You can add more logic here if needed
                }}
              />
              
              <SettingsDropdown 
                onLogout={onLogout} 
                onEditProfile={() => setShowEditProfile(true)}
                role="admin" 
              />

              <div className="h-8 w-px bg-gray-200"></div>

              {/* User Profile */}
              <AvatarDropdown 
                profile={profile} 
                onLogout={onLogout} 
                onEditProfile={() => setShowEditProfile(true)}
                role="admin" 
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Desktop Only (mobile uses bottom nav) */}
        <div className="max-w-[1600px] mx-auto px-6 desktop-only">
          <nav className="flex space-x-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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

        {/* Mobile Tabs (so all screens are reachable on phones) */}
        <div className="mobile-only px-4 py-2 border-t border-gray-100">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

        {/* Main Content */}
        <main className="max-w-[1600px] mx-auto px-6 py-8">
          <Routes>
            <Route index element={<DashboardScreen />} />
            <Route path="appointments" element={<AppointmentsScreen />} />
            <Route path="clients" element={<ClientsScreen />} />
            <Route path="staff" element={<StaffScreen />} />
            <Route path="analytics" element={<AnalyticsScreen />} />
            <Route path="marketing" element={<MarketingScreen />} />
            <Route path="services" element={<ServicesScreen />} />
            <Route path="branches" element={<BranchesScreen />} />
            <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
          </Routes>
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

        {/* Mobile More Menu (Admin) */}
        {showMobileMoreMenu && (
          <div className="mobile-only fixed inset-0 z-[1100]">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close"
              onClick={() => setShowMobileMoreMenu(false)}
            />
            <div className="absolute left-0 right-0 bottom-[64px] px-4 pb-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">More</p>
                  <p className="text-xs text-gray-500">Admin shortcuts</p>
                </div>
                <div className="p-2">
                  {[
                    { id: 'staff' as const, label: 'Staff' },
                    { id: 'marketing' as const, label: 'Marketing' },
                    { id: 'services' as const, label: 'Services' },
                    { id: 'branches' as const, label: 'Branches' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        handleTabChange(item.id);
                        setShowMobileMoreMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        activeTab === item.id
                          ? 'bg-pink-50 text-pink-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
    </AdminDataProvider>
  );
}