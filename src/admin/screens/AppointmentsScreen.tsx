import { useState, useEffect } from 'react';
import { Calendar, Clock, Search, Filter, Eye, Check, X, MoreHorizontal } from 'lucide-react';
import { getAllAppointments, type AppointmentWithDetails } from '../../api/admin';
import { adminUpdateBookingStatus } from '../../api/bookings';
import { supabase } from '../../lib/supabase';
import { AdminBookingModal } from '../components/AdminBookingModal';
import { AppointmentDetailsModal } from '../../components/AppointmentDetailsModal';
import { glamConfirm, glamError, glamSuccess } from '../../lib/glamAlerts';

export function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadAppointments();
    
    // Set up realtime subscription for bookings
    const channel = supabase
      .channel('admin-appointments-changes')
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
      const data = await getAllAppointments(100);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: AppointmentWithDetails['status']) => {
    try {
      setUpdatingIds(prev => ({ ...prev, [id]: true }));
      await adminUpdateBookingStatus(id, status);
      setAppointments(prev =>
        prev.map(apt => apt.id === id ? { ...apt, status } : apt)
      );

      // Keep modal in sync if it's open
      setSelectedAppointment(prev => (prev && prev.id === id ? { ...prev, status } : prev));

      if (status === 'confirmed') glamSuccess('Appointment confirmed');
      else if (status === 'completed') glamSuccess('Appointment marked as completed');
      else if (status === 'cancelled') glamSuccess('Appointment cancelled');
      else glamSuccess('Appointment updated');
    } catch (error) {
      console.error('Error updating status:', error);
      glamError(error instanceof Error ? error.message : 'Failed to update appointment status');
    }
    finally {
      setUpdatingIds(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const requestStatusUpdate = async (id: number, status: AppointmentWithDetails['status']) => {
    const apt = appointments.find(a => a.id === id);
    const confirmText = status === 'confirmed'
      ? 'Yes, confirm'
      : status === 'completed'
        ? 'Yes, mark complete'
        : status === 'cancelled'
          ? 'Yes, cancel'
          : 'Confirm';

    const title = status === 'confirmed'
      ? 'Confirm this appointment?'
      : status === 'completed'
        ? 'Mark this appointment as completed?'
        : status === 'cancelled'
          ? 'Cancel this appointment?'
          : 'Update this appointment?';

    const text = apt
      ? `${apt.client_name || 'Client'} • ${apt.service_name || 'Service'} • ${new Date(apt.start_at).toLocaleString()}`
      : 'Please confirm you want to proceed.';

    const ok = await glamConfirm({ title, text, confirmText });
    if (!ok) return;

    await handleStatusUpdate(id, status);
  };

  const openDetails = (apt: AppointmentWithDetails) => {
    setSelectedAppointment(apt);
    setShowDetailsModal(true);
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

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
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
          <p className="text-sm text-gray-500 mt-1">Manage and track all salon bookings</p>
        </div>
        <button 
          onClick={() => setShowBookingModal(true)}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Calendar className="w-4 h-4" />
          <span>New Booking</span>
        </button>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-sm text-yellow-700 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-700 mb-1">Confirmed</p>
          <p className="text-2xl font-bold text-green-900">{stats.confirmed}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Completed</p>
          <p className="text-2xl font-bold text-blue-900">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by client name, email, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No appointments have been created yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">#{apt.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {apt.client_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{apt.client_name}</p>
                          <p className="text-xs text-gray-500">{apt.client_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{apt.service_name}</p>
                      <p className="text-xs text-gray-500">ID: {apt.service_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{formatDate(apt.start_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(apt.start_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(apt.service_price || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {apt.status === 'pending' && (
                          <>
                            <button
                              onClick={() => void requestStatusUpdate(apt.id, 'confirmed')}
                              disabled={!!updatingIds[apt.id]}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Confirm"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => void requestStatusUpdate(apt.id, 'cancelled')}
                              disabled={!!updatingIds[apt.id]}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <button
                            onClick={() => void requestStatusUpdate(apt.id, 'completed')}
                            disabled={!!updatingIds[apt.id]}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark Complete"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openDetails(apt)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDetails(apt)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="More"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredAppointments.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredAppointments.length}</span> of{' '}
            <span className="font-semibold">{appointments.length}</span> appointments
          </p>
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              Previous
            </button>
            <button className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Admin Booking Modal */}
      <AdminBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onBookingComplete={() => {
          loadAppointments();
        }}
      />

      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        appointment={selectedAppointment}
        onClose={() => setShowDetailsModal(false)}
        onUpdateStatus={async (id, status) => {
          await requestStatusUpdate(id, status);
        }}
      />
    </div>
  );
}


