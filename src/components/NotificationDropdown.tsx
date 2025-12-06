import { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AppointmentWithDetails } from '../api/admin';

interface NotificationDropdownProps {
  role?: 'admin' | 'manager' | 'staff' | 'client';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NotificationDropdown({ role: _role = 'admin' }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppointmentWithDetails[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    
    // Set up realtime subscription for new bookings
    const channel = supabase
      .channel('notifications-bookings')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      // Get recent appointments (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!bookings || bookings.length === 0) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // Fetch related data
      const clientIds = [...new Set(bookings.map(b => b.client_id))];
      const serviceIds = [...new Set(bookings.map(b => b.service_id))];
      const shopIds = [...new Set(bookings.map(b => b.shop_id || b.salon_id).filter(Boolean))];
      
      const [profilesResult, servicesResult, shopsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email')
          .in('id', clientIds),
        supabase
          .from('services')
          .select('id, name, price')
          .in('id', serviceIds),
        shopIds.length > 0 ? supabase
          .from('shops')
          .select('id, name, address')
          .in('id', shopIds) : Promise.resolve({ data: [], error: null })
      ]);

      const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p.email]));
      const serviceMap = new Map((servicesResult.data || []).map(s => [s.id, s]));
      const shopMap = new Map((shopsResult.data || []).map(s => [s.id, s]));

      const notificationsData = bookings.map(booking => {
        const clientEmail = profileMap.get(booking.client_id) || 'Unknown';
        const service = serviceMap.get(booking.service_id);
        const shopId = booking.shop_id || booking.salon_id;
        const shop = shopId ? shopMap.get(shopId) : null;
        
        return {
          ...booking,
          client_email: clientEmail,
          client_name: clientEmail.split('@')[0] || 'Client',
          service_name: service?.name || `Service #${booking.service_id}`,
          service_price: service?.price || 500,
          shop_name: shop?.name || (shopId ? `Salon #${shopId}` : 'Unknown Location'),
          shop_address: shop?.address || '',
        } as AppointmentWithDetails & { shop_name?: string; shop_address?: string };
      });

      setNotifications(notificationsData);
      setUnreadCount(notificationsData.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-pink-50 to-purple-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-pink-500 text-white text-xs rounded-full font-medium">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No new appointments</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {notification.client_name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            <span className="font-semibold">{notification.client_name}</span> booked an appointment
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTimeAgo(notification.created_at || notification.start_at)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(notification.start_at)}</span>
                            <Clock className="w-3 h-3 ml-2" />
                            <span>{formatTime(notification.start_at)}</span>
                          </div>
                          <p className="text-xs text-gray-700 font-medium">
                            Service: {notification.service_name}
                          </p>
                          {(notification as AppointmentWithDetails & { shop_name?: string; shop_address?: string }).shop_name && (
                            <p className="text-xs text-gray-500">
                              Location: {(notification as AppointmentWithDetails & { shop_name?: string; shop_address?: string }).shop_name}
                              {(notification as AppointmentWithDetails & { shop_name?: string; shop_address?: string }).shop_address && ` - ${(notification as AppointmentWithDetails & { shop_name?: string; shop_address?: string }).shop_address}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setUnreadCount(0);
                  setIsOpen(false);
                }}
                className="w-full text-xs text-pink-600 hover:text-pink-700 font-medium text-center py-1"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

