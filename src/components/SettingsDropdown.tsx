import { useState, useRef, useEffect } from 'react';
import { Settings, User, Bell, Shield, Palette, HelpCircle, LogOut } from 'lucide-react';

interface SettingsDropdownProps {
  onLogout?: () => void;
  role?: 'admin' | 'manager' | 'staff' | 'client';
}

export function SettingsDropdown({ onLogout, role = 'admin' }: SettingsDropdownProps) {
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

  const handleProfileSettings = () => {
    alert('Profile Settings: This feature allows you to update your profile information, change your password, and manage your account preferences.');
  };

  const handleNotificationPreferences = () => {
    alert('Notification Preferences: Configure how and when you receive notifications about appointments, bookings, and system updates.');
  };

  const handleAppearance = () => {
    const theme = localStorage.getItem('theme') || 'light';
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    alert(`Appearance: Theme switched to ${newTheme} mode.`);
  };

  const handlePrivacySecurity = () => {
    alert('Privacy & Security: Manage your privacy settings, view login history, enable two-factor authentication, and control data sharing preferences.');
  };

  const handleHelpSupport = () => {
    alert('Help & Support: Access documentation, contact support, view FAQs, or report issues. Email: support@glamqueue.com');
  };

  const settingsItems = [
    { icon: User, label: 'Profile Settings', onClick: handleProfileSettings },
    { icon: Bell, label: 'Notification Preferences', onClick: handleNotificationPreferences },
    { icon: Palette, label: 'Appearance', onClick: handleAppearance },
    { icon: Shield, label: 'Privacy & Security', onClick: handlePrivacySecurity },
    { icon: HelpCircle, label: 'Help & Support', onClick: handleHelpSupport },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Settings className="w-5 h-5 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">Settings</p>
            <p className="text-xs text-gray-500 capitalize">{role} Dashboard</p>
          </div>
          
          <div className="py-2">
            {settingsItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <item.icon className="w-4 h-4 text-gray-500" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {onLogout && (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

