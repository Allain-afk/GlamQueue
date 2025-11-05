import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  getDashboardStats,
  getTodayAppointments,
  getAllAppointments,
  getStaffMembers,
  getTopClients,
  getAllClients,
  getWeeklyRevenue,
  getAnalyticsData,
  type DashboardStats,
  type AppointmentWithDetails,
  type StaffMember,
  type TopClient,
  type Client,
  type RevenueData,
  type AnalyticsData,
} from '../../api/admin';

interface CachedData {
  data: any;
  timestamp: number;
}

interface AdminDataContextType {
  // Cached data
  dashboardStats: DashboardStats | null;
  todayAppointments: AppointmentWithDetails[];
  allAppointments: AppointmentWithDetails[];
  staffMembers: StaffMember[];
  topClients: TopClient[];
  allClients: Client[];
  revenueData: RevenueData[];
  analyticsData: AnalyticsData | null;
  
  // Loading states
  loading: {
    dashboard: boolean;
    appointments: boolean;
    staff: boolean;
    clients: boolean;
    analytics: boolean;
  };
  
  // Fetch functions with caching
  fetchDashboardStats: (forceRefresh?: boolean) => Promise<void>;
  fetchTodayAppointments: (forceRefresh?: boolean) => Promise<void>;
  fetchAllAppointments: (forceRefresh?: boolean) => Promise<void>;
  fetchStaffMembers: (forceRefresh?: boolean) => Promise<void>;
  fetchTopClients: (forceRefresh?: boolean) => Promise<void>;
  fetchAllClients: (forceRefresh?: boolean) => Promise<void>;
  fetchRevenueData: (forceRefresh?: boolean) => Promise<void>;
  fetchAnalyticsData: (forceRefresh?: boolean) => Promise<void>;
  
  // Utility
  clearCache: () => void;
  refreshAll: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function AdminDataProvider({ children }: { children: ReactNode }) {
  // Data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentWithDetails[]>([]);
  const [allAppointments, setAllAppointments] = useState<AppointmentWithDetails[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Cache timestamps
  const [cache, setCache] = useState<Record<string, CachedData>>({});

  // Loading states
  const [loading, setLoading] = useState({
    dashboard: false,
    appointments: false,
    staff: false,
    clients: false,
    analytics: false,
  });

  const isCacheValid = (key: string): boolean => {
    const cached = cache[key];
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  };

  const updateCache = (key: string, data: any) => {
    setCache(prev => ({
      ...prev,
      [key]: { data, timestamp: Date.now() }
    }));
  };

  const fetchDashboardStats = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('dashboardStats') && dashboardStats) return;
    
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const data = await getDashboardStats();
      setDashboardStats(data);
      updateCache('dashboardStats', data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, [dashboardStats, cache]);

  const fetchTodayAppointments = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('todayAppointments') && todayAppointments.length > 0) return;
    
    setLoading(prev => ({ ...prev, appointments: true }));
    try {
      const data = await getTodayAppointments();
      setTodayAppointments(data);
      updateCache('todayAppointments', data);
    } catch (error) {
      console.error('Error fetching today appointments:', error);
    } finally {
      setLoading(prev => ({ ...prev, appointments: false }));
    }
  }, [todayAppointments, cache]);

  const fetchAllAppointments = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('allAppointments') && allAppointments.length > 0) return;
    
    setLoading(prev => ({ ...prev, appointments: true }));
    try {
      const data = await getAllAppointments(100);
      setAllAppointments(data);
      updateCache('allAppointments', data);
    } catch (error) {
      console.error('Error fetching all appointments:', error);
    } finally {
      setLoading(prev => ({ ...prev, appointments: false }));
    }
  }, [allAppointments, cache]);

  const fetchStaffMembers = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('staffMembers') && staffMembers.length > 0) return;
    
    setLoading(prev => ({ ...prev, staff: true }));
    try {
      const data = await getStaffMembers();
      setStaffMembers(data);
      updateCache('staffMembers', data);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    } finally {
      setLoading(prev => ({ ...prev, staff: false }));
    }
  }, [staffMembers, cache]);

  const fetchTopClients = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('topClients') && topClients.length > 0) return;
    
    setLoading(prev => ({ ...prev, clients: true }));
    try {
      const data = await getTopClients(4);
      setTopClients(data);
      updateCache('topClients', data);
    } catch (error) {
      console.error('Error fetching top clients:', error);
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }
  }, [topClients, cache]);

  const fetchAllClients = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('allClients') && allClients.length > 0) return;
    
    setLoading(prev => ({ ...prev, clients: true }));
    try {
      const data = await getAllClients();
      setAllClients(data);
      updateCache('allClients', data);
    } catch (error) {
      console.error('Error fetching all clients:', error);
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }
  }, [allClients, cache]);

  const fetchRevenueData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('revenueData') && revenueData.length > 0) return;
    
    setLoading(prev => ({ ...prev, dashboard: true }));
    try {
      const data = await getWeeklyRevenue();
      setRevenueData(data);
      updateCache('revenueData', data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, [revenueData, cache]);

  const fetchAnalyticsData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid('analyticsData') && analyticsData) return;
    
    setLoading(prev => ({ ...prev, analytics: true }));
    try {
      const data = await getAnalyticsData();
      setAnalyticsData(data);
      updateCache('analyticsData', data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  }, [analyticsData, cache]);

  const clearCache = useCallback(() => {
    setCache({});
    setDashboardStats(null);
    setTodayAppointments([]);
    setAllAppointments([]);
    setStaffMembers([]);
    setTopClients([]);
    setAllClients([]);
    setRevenueData([]);
    setAnalyticsData(null);
  }, []);

  const refreshAll = useCallback(async () => {
    clearCache();
    await Promise.all([
      fetchDashboardStats(true),
      fetchTodayAppointments(true),
      fetchAllAppointments(true),
      fetchStaffMembers(true),
      fetchTopClients(true),
      fetchAllClients(true),
      fetchRevenueData(true),
      fetchAnalyticsData(true),
    ]);
  }, []);

  const value: AdminDataContextType = {
    dashboardStats,
    todayAppointments,
    allAppointments,
    staffMembers,
    topClients,
    allClients,
    revenueData,
    analyticsData,
    loading,
    fetchDashboardStats,
    fetchTodayAppointments,
    fetchAllAppointments,
    fetchStaffMembers,
    fetchTopClients,
    fetchAllClients,
    fetchRevenueData,
    fetchAnalyticsData,
    clearCache,
    refreshAll,
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
}


