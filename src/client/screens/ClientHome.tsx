import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Sparkles, Scissors, Palette, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useClient } from '../context/ClientContext';
import { getMyProfile, type Profile } from '../../api/profile';
import { SettingsDropdown } from '../../components/SettingsDropdown';
import { AvatarDropdown } from '../../components/AvatarDropdown';
import type { Service } from '../types';

interface ClientHomeProps {
  onSelectService: (service: Service) => void;
  onViewAllServices: () => void;
  onViewSchedule: () => void;
  onViewProfile: () => void;
  onLogout: () => void;
}

export function ClientHome({ onSelectService, onViewAllServices, onViewSchedule, onViewProfile, onLogout }: ClientHomeProps) {
  const { session } = useAuth();
  const { services, bookings, upcomingBookings, loading } = useClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await getMyProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, []);

  const categories = [
    { id: 'haircut', name: 'Haircut', icon: Scissors, color: '#e91e8c' },
    { id: 'styling', name: 'Styling', icon: Sparkles, color: '#f06292' },
    { id: 'coloring', name: 'Coloring', icon: Palette, color: '#ff6b9d' },
  ];

  const featuredServices = services.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hi, {session?.user?.email?.split('@')[0] || 'Guest'}!
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-pink-500" />
                <span className="text-sm text-gray-600">Manila, Philippines</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SettingsDropdown onLogout={onLogout} role="client" />
              <div className="h-8 w-px bg-gray-200"></div>
              <AvatarDropdown 
                profile={profile} 
                onLogout={onLogout} 
                role="client"
                onViewProfile={onViewProfile}
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for services, salons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Booking History Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Booking History</h2>
            <button
              onClick={onViewAllServices}
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all"
            >
              + Book New Service
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading your bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-20 h-20 mx-auto bg-pink-50 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-10 h-10 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                <p className="text-gray-500 mb-4">You haven't made any bookings. Start exploring our services!</p>
                <button
                  onClick={onViewAllServices}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  Browse Services
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Service</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Salon</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Date & Time</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Price</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-50">
                    {bookings.map((booking) => {
                      const bookingDate = new Date(booking.date_time);
                      const isPast = bookingDate < new Date();
                      
                      const getStatusIcon = (status: string) => {
                        switch (status.toLowerCase()) {
                          case 'completed':
                            return <CheckCircle className="w-4 h-4 text-green-500" />;
                          case 'cancelled':
                            return <XCircle className="w-4 h-4 text-red-500" />;
                          case 'pending':
                            return <Clock className="w-4 h-4 text-yellow-500" />;
                          case 'confirmed':
                            return <CheckCircle className="w-4 h-4 text-blue-500" />;
                          default:
                            return <AlertCircle className="w-4 h-4 text-gray-500" />;
                        }
                      };
                      
                      const getStatusStyle = (status: string) => {
                        switch (status.toLowerCase()) {
                          case 'completed':
                            return 'bg-green-100 text-green-700 border-green-200';
                          case 'cancelled':
                            return 'bg-red-100 text-red-700 border-red-200';
                          case 'pending':
                            return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                          case 'confirmed':
                            return 'bg-blue-100 text-blue-700 border-blue-200';
                          default:
                            return 'bg-gray-100 text-gray-700 border-gray-200';
                        }
                      };
                      
                      return (
                        <tr 
                          key={booking.id} 
                          className={`hover:bg-pink-50/50 transition-colors ${isPast ? 'bg-gray-50/50' : ''}`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Scissors className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{booking.service?.name || 'Service'}</p>
                                <p className="text-sm text-gray-500">{booking.service?.duration || 0} min</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-gray-700">{booking.shop?.name || 'Salon'}</p>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-medium text-gray-900">
                                {bookingDate.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className="text-sm text-gray-500">
                                {bookingDate.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-semibold text-pink-600">₱{booking.service?.price || 0}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusStyle(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Appointments</h2>
              <button
                onClick={onViewSchedule}
                className="text-pink-600 hover:text-pink-700 font-medium text-sm"
              >
                View All
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4">
              {upcomingBookings.slice(0, 2).map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl mb-3 last:mb-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{booking.service?.name}</h3>
                    <p className="text-sm text-gray-600">{booking.shop?.name}</p>
                    <p className="text-sm text-pink-600 font-medium mt-1">
                      {new Date(booking.date_time).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Categories</h2>
          <div className="grid grid-cols-3 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100 hover:shadow-md hover:border-pink-300 transition-all text-center group"
                >
                  <div
                    className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)` }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                </button>
              );
            })}
          </div>
        </section>

        {/* Promo Banner */}
        <section>
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">Special Offer!</h2>
              <p className="text-pink-100 mb-4">Get 20% off on your first booking</p>
              <button className="bg-white text-pink-600 px-6 py-2 rounded-lg font-semibold hover:bg-pink-50 transition-colors">
                Book Now
              </button>
            </div>
            <div className="absolute right-0 top-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute right-10 bottom-0 w-32 h-32 bg-white opacity-10 rounded-full -mb-16"></div>
          </div>
        </section>

        {/* Featured Services */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Popular Services</h2>
            <button
              onClick={onViewAllServices}
              className="text-pink-600 hover:text-pink-700 font-medium text-sm"
            >
              See All
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-md hover:border-pink-300 transition-all cursor-pointer group flex flex-col"
                  onClick={() => onSelectService(service)}
                >
                  <div className="h-48 bg-gradient-to-br from-pink-400 to-purple-500 relative overflow-hidden">
                    {service.image_url ? (
                      <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="w-20 h-20 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full">
                      <span className="text-pink-600 font-bold">₱{service.price}</span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{service.description}</p>
                    
                    {/* Spacer to push footer to bottom */}
                    <div className="flex-grow"></div>
                    
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 mt-auto">
                      <span className="text-gray-500">{service.duration} min</span>
                      <span className="text-pink-600 font-medium">{service.shop_name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

