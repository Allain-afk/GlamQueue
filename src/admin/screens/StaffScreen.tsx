import { useState, useEffect } from 'react';
import { Users, Star, Calendar, Clock, TrendingUp, Award, Plus } from 'lucide-react';
import { getStaffMembers, type StaffMember } from '../../api/admin';

export function StaffScreen() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await getStaffMembers();
      setStaff(data);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'break': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'busy': return 'Busy';
      case 'break': return 'On Break';
      default: return 'Unknown';
    }
  };

  const stats = {
    total: staff.length,
    available: staff.filter(s => s.status === 'available').length,
    busy: staff.filter(s => s.status === 'busy').length,
    onBreak: staff.filter(s => s.status === 'break').length,
    avgRating: staff.length > 0 ? staff.reduce((sum, s) => sum + s.rating, 0) / staff.length : 0,
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
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage team members and their schedules</p>
        </div>
        <button className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Total Staff</p>
          <p className="text-4xl font-bold mb-2">{stats.total}</p>
          <p className="text-sm opacity-75">Team members</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700">Available</p>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.available}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-red-700">Busy</p>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-red-900">{stats.busy}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-yellow-700">Break</p>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-yellow-900">{stats.onBreak}</p>
        </div>
      </div>

      {/* Staff Grid */}
      {staff.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No staff members</h3>
          <p className="text-gray-500">Add your first team member to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header with Status */}
              <div className="relative h-24 bg-gradient-to-br from-pink-400 to-purple-500">
                <div className="absolute -bottom-8 left-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-white rounded-full p-1">
                      <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                    <div className={`absolute bottom-0 right-0 w-5 h-5 ${getStatusColor(member.status)} rounded-full border-2 border-white`}></div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="pt-10 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{member.role}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      member.status === 'available' ? 'bg-green-100 text-green-700' :
                      member.status === 'busy' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {getStatusText(member.status)}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(member.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{member.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">(45 reviews)</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-blue-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium">Today</span>
                    </div>
                    <p className="text-xl font-bold text-blue-900">{Math.floor(Math.random() * 8) + 2}</p>
                    <p className="text-xs text-blue-700">Appointments</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-green-600 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium">This Week</span>
                    </div>
                    <p className="text-xl font-bold text-green-900">{Math.floor(Math.random() * 30) + 20}</p>
                    <p className="text-xs text-green-700">Total</p>
                  </div>
                </div>

                {/* Next Appointment */}
                {member.next_appointment && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2 text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium">Next Appointment</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{member.next_appointment}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <button className="flex-1 px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors">
                    View Schedule
                  </button>
                  <button className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Performance Summary */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
            <p className="text-sm text-gray-600 mt-1">Average Rating</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{Math.floor(Math.random() * 50) + 100}</p>
            <p className="text-sm text-gray-600 mt-1">Total Appointments</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">85%</p>
            <p className="text-sm text-gray-600 mt-1">Utilization Rate</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">98%</p>
            <p className="text-sm text-gray-600 mt-1">Client Satisfaction</p>
          </div>
        </div>
      </div>
    </div>
  );
}


