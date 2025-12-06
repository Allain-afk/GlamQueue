import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { getMyProfile, type Profile } from '../../api/profile';

interface ProfileProps {
  onBack: () => void;
  onLogout: () => void;
}

export function Profile({ onBack, onLogout }: ProfileProps) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      <div className="bg-white border-b border-pink-100 sticky top-0 z-50 safe-area-top">
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
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-8 mb-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
              {session?.user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {session?.user?.email?.split('@')[0] || 'User'}
            </h2>
            <span className="mt-2 px-4 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium capitalize">
              {profile?.role || 'client'}
            </span>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <Mail className="w-5 h-5 text-pink-500 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-900 font-medium">{session?.user?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <User className="w-5 h-5 text-pink-500 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-gray-900 font-medium capitalize">{profile?.role || 'client'}</p>
              </div>
            </div>

            {profile?.created_at && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-pink-500 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="text-gray-900 font-medium">
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
            className="w-full flex items-center justify-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-4 px-6 rounded-xl transition-colors border border-red-200"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

