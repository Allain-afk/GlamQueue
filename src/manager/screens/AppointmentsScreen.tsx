import { useState, useEffect } from 'react';
import { Calendar, Clock, Search, Filter, Check, X } from 'lucide-react';
import { getManagerAppointments } from '../../api/manager';
import { adminUpdateBookingStatus } from '../../api/bookings';
import { supabase } from '../../lib/supabase';
import type { AppointmentWithDetails } from '../../api/admin';

export function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadAppointments();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('manager-appointments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          loadAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await getManagerAppointments(100);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: AppointmentWithDetails['status']) => {
    try {
      await adminUpdateBookingStatus(id, status);
      setAppointments(prev =>
        prev.map(apt => apt.id === id ? { ...apt, status } : apt)
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.client_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.service_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage all shop appointments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredAppointments.map((apt) => (
            <div key={apt.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{apt.client_name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{apt.service_name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(apt.start_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(apt.start_at)}
                    </span>
                    <span>{formatCurrency(apt.service_price || 500)}</span>
                  </div>
                  {apt.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">"{apt.notes}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {apt.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        title="Confirm"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {apt.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(apt.id, 'completed')}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      Mark as Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredAppointments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No appointments found
          </div>
        )}
      </div>
    </div>
  );
}

