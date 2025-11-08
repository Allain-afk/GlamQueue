import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getManagerStaff } from '../../api/manager';
import type { StaffMember } from '../../api/admin';

export function StaffScreen() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await getManagerStaff();
      setStaff(data);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'break': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-1">Manage shop staff members</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <div key={member.id} className="bg-white rounded-xl shadow-sm border border-pink-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(member.status)}`} title={member.status}></div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">{member.email}</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Rating</span>
                <span className="font-medium">{member.rating.toFixed(1)} ⭐</span>
              </div>
              {member.next_appointment && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Next Appointment</span>
                  <span className="font-medium">{member.next_appointment}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {filteredStaff.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
          No staff members found
        </div>
      )}
    </div>
  );
}

