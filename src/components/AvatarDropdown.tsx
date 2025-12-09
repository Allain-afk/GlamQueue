import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import type { Profile } from '../api/profile';

interface AvatarDropdownProps {
  profile: Profile | null;
  onLogout: () => void;
  role?: 'admin' | 'manager' | 'staff' | 'client';
  onViewProfile?: () => void;
  onEditProfile?: () => void;
}

export function AvatarDropdown({ profile, onLogout, role = 'admin', onViewProfile, onEditProfile }: AvatarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const roleLabels = {
    admin: 'Administrator',
    manager: 'Manager',
    staff: 'Staff Member',
    client: 'Client',
  };

  // Get display name - prefer name, fallback to email username, then role label
  const displayName = profile?.name || profile?.email?.split('@')[0] || roleLabels[role];
  const displayInitial = profile?.name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || roleLabels[role].charAt(0);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-900">
            {displayName}
          </p>
          <p className="text-xs text-gray-500">{roleLabels[role]}</p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold relative overflow-hidden">
          {profile?.profile_picture ? (
            <img 
              src={profile.profile_picture} 
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            displayInitial
          )}
          <ChevronDown className={`w-3 h-3 absolute -bottom-1 -right-1 bg-white text-gray-600 rounded-full p-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                {profile?.profile_picture ? (
                  <img 
                    src={profile.profile_picture} 
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayInitial
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">{profile?.email || ''}</p>
                <p className="text-xs text-pink-600 font-medium capitalize mt-0.5">{roleLabels[role]}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                if (onViewProfile) {
                  onViewProfile();
                } else {
                  console.log('View profile');
                }
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <User className="w-4 h-4 text-gray-500" />
              <span>View Profile</span>
            </button>
            <button
              onClick={() => {
                if (onEditProfile) {
                  onEditProfile();
                } else {
                  console.log('Settings');
                }
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-500" />
              <span>Settings</span>
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 my-2"></div>
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

