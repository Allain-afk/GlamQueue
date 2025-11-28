import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getStaffSchedule } from '../../api/staffSchedule';
import type { AppointmentWithDetails } from '../../api/admin';
import type { StaffMember } from '../../api/admin';

interface StaffScheduleModalProps {
  staff: StaffMember;
  isOpen: boolean;
  onClose: () => void;
}

export function StaffScheduleModal({ staff, isOpen, onClose }: StaffScheduleModalProps) {
  const [appointments, setAppointments] = useState<(AppointmentWithDetails & { shop_name?: string; shop_address?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'week'>('week');

  useEffect(() => {
    if (isOpen && staff) {
      loadSchedule();
    }
  }, [isOpen, staff, filter]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const data = await getStaffSchedule(staff.id);
      
      // Filter based on selected filter
      const now = new Date();
      const filtered = filter === 'today' 
        ? data.filter(apt => {
            const aptDate = new Date(apt.start_at);
            return aptDate.toDateString() === now.toDateString();
          })
        : data;
      
      setAppointments(filtered);
    } catch (error) {
      console.error('Error loading staff schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
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

  const getCurrentStatus = () => {
    const now = new Date();
    const currentAppointment = appointments.find(apt => {
      const start = new Date(apt.start_at);
      const end = apt.end_at ? new Date(apt.end_at) : new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour
      return now >= start && now <= end && apt.status === 'confirmed';
    });
    return currentAppointment ? 'busy' : 'available';
  };

  if (!isOpen) return null;

  const currentStatus = getCurrentStatus();
  const todayCount = appointments.filter(apt => {
    const aptDate = new Date(apt.start_at);
    return aptDate.toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {staff.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{staff.name}</h2>
              <p className="text-sm text-gray-600">{staff.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500">Current Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-3 h-3 rounded-full ${
                    currentStatus === 'busy' ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{currentStatus}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Today's Appointments</p>
                <p className="text-sm font-semibold text-gray-900">{todayCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">This Week</p>
                <p className="text-sm font-semibold text-gray-900">{appointments.length}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('today')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'today'
                    ? 'bg-pink-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilter('week')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'week'
                    ? 'bg-pink-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                This Week
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments</h3>
              <p className="text-gray-500">
                {filter === 'today' 
                  ? 'No appointments scheduled for today.'
                  : 'No appointments scheduled for this week.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {appointment.client_name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.client_name}
                          </h3>
                          <p className="text-sm text-gray-600">{appointment.service_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="capitalize">{appointment.status}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-pink-600">
                        {formatCurrency(appointment.service_price || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(appointment.start_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{formatTime(appointment.start_at)}</span>
                    </div>
                    {(appointment as any).shop_name && (
                      <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{(appointment as any).shop_name}</span>
                        {(appointment as any).shop_address && (
                          <span className="text-gray-400">- {(appointment as any).shop_address}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {appointment.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600 italic">"{appointment.notes}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{appointments.length}</span> appointments
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

