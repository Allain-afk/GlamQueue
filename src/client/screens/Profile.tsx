import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Calendar, LogOut, Edit2 } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { getMyProfile, type Profile } from '../../api/profile';
import { EditProfile } from '../../components/EditProfile';

interface ProfileProps {
  onBack: () => void;
  onLogout: () => void;
}

export function Profile({ onBack, onLogout }: ProfileProps) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-100/50 sticky top-0 z-50 safe-area-top shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-pink-50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card - Enhanced with depth and shadows */}
        <div className="bg-white rounded-3xl shadow-xl border border-pink-100/50 p-8 mb-6 transform transition-all hover:shadow-2xl">
          {/* Profile Header with gradient background */}
          <div className="relative -m-8 mb-6 rounded-t-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-pink-600 p-8 pb-16">
            <div className="flex flex-col items-center">
              {/* Avatar with enhanced shadow and border */}
              <div className="relative mb-4">
                <div className="w-28 h-28 bg-white rounded-full p-1 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                    {profile?.profile_picture ? (
                      <img 
                        src={profile.profile_picture} 
                        alt={profile?.name || 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile?.name?.charAt(0).toUpperCase() || session?.user?.email?.[0].toUpperCase() || 'U'
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 border-2 border-pink-200"
                  title="Edit Profile"
                >
                  <Edit2 className="w-4 h-4 text-pink-500" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-white">
                  {profile?.name || session?.user?.email?.split('@')[0] || 'User'}
                </h2>
              </div>
              <span className="mt-3 px-5 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold capitalize border border-white/30">
                {profile?.role || 'client'}
              </span>
            </div>
          </div>

          {/* Profile Information with card-style design */}
          <div className="space-y-3 mt-8">
            <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-pink-100/50 shadow-sm hover:shadow-md transition-all">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <User className="w-5 h-5 text-pink-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Name</p>
                <p className="text-gray-900 font-semibold text-lg">{profile?.name || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-pink-100/50 shadow-sm hover:shadow-md transition-all">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Mail className="w-5 h-5 text-pink-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Email</p>
                <p className="text-gray-900 font-semibold text-lg">{session?.user?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-pink-100/50 shadow-sm hover:shadow-md transition-all">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <User className="w-5 h-5 text-pink-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Role</p>
                <p className="text-gray-900 font-semibold text-lg capitalize">{profile?.role || 'client'}</p>
              </div>
            </div>

            {profile?.created_at && (
              <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-pink-100/50 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Calendar className="w-5 h-5 text-pink-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Member Since</p>
                  <p className="text-gray-900 font-semibold text-lg">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && profile && (
        <EditProfile
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updatedProfile) => {
            setProfile(updatedProfile);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

