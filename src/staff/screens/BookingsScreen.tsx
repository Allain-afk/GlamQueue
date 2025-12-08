import { useState, useEffect } from 'react';
import { Calendar, Clock, Check, X, Search } from 'lucide-react';
import { getStaffTodayAppointments, getStaffAppointments, updateBookingStatus } from '../../api/staff';
import { supabase } from '../../lib/supabase';
import type { AppointmentWithDetails } from '../../api/admin';

export function BookingsScreen() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAppointments();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('staff-bookings-changes')
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
  }, [filter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = filter === 'today' 
        ? await getStaffTodayAppointments()
        : await getStaffAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: AppointmentWithDetails['status']) => {
    try {
      await updateBookingStatus(id, status);
      setAppointments(prev =>
        prev.map(apt => apt.id === id ? { ...apt, status } : apt)
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update appointment status');
    }
  };

  const filteredAppointments = appointments.filter(apt =>
    apt.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.service_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;

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
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-1">Manage your assigned appointments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-pink-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
            </div>
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'today'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </button>
        </div>
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
      </div>

      {/* Appointments List - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden">
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
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  {apt.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(apt.id, 'completed')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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

      {/* Mobile Agenda List */}
      <div className="md:hidden space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-pink-100">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No appointments found</p>
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden">
              {/* Time Header */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-2 border-b border-pink-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#FF5A5F]" />
                    <span className="font-bold text-gray-900">{formatTime(apt.start_at)}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(apt.start_at)}</span>
                </div>
              </div>
              
              {/* Card Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {apt.client_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{apt.client_name}</h3>
                      <p className="text-sm text-gray-600">{apt.service_name}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span>{formatCurrency(apt.service_price || 500)}</span>
                </div>

                {apt.notes && (
                  <p className="text-sm text-gray-500 italic mb-3 text-left">"{apt.notes}"</p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {apt.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                        className="flex-1 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                        className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                  {apt.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(apt.id, 'completed')}
                      className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                      Mark as Done
                    </button>
                  )}
                  {(apt.status === 'completed' || apt.status === 'cancelled') && (
                    <div className="w-full py-2.5 text-center text-gray-400 text-sm">
                      No actions available
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

