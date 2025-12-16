import { useState, useRef, useEffect } from 'react';
import { Settings, User, Bell, Shield, Palette, HelpCircle, LogOut } from 'lucide-react';
import Swal from 'sweetalert2';

interface SettingsDropdownProps {
  onLogout?: () => void;
  onEditProfile?: () => void;
  role?: 'admin' | 'manager' | 'staff' | 'client';
}

export function SettingsDropdown({ onLogout, onEditProfile, role = 'admin' }: SettingsDropdownProps) {
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
    if (onEditProfile) {
      onEditProfile();
    } else {
      Swal.fire({
        title: '<span class="text-gray-800">Profile Settings</span>',
        html: `
          <div class="text-left space-y-4 py-2">
            <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div class="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div>
                <h4 class="font-medium text-gray-800">Personal Information</h4>
                <p class="text-sm text-gray-600">Update your name, email, phone number, and profile photo</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div class="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                </svg>
              </div>
              <div>
                <h4 class="font-medium text-gray-800">Change Password</h4>
                <p class="text-sm text-gray-600">Update your password to keep your account secure</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div class="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <div>
                <h4 class="font-medium text-gray-800">Business Details</h4>
                <p class="text-sm text-gray-600">Manage your salon/business information and branding</p>
              </div>
            </div>
          </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-2xl',
          htmlContainer: 'px-2',
        },
      });
    }
  };

  const handleNotificationPreferences = () => {
    Swal.fire({
      title: '<span class="text-gray-800">Notification Preferences</span>',
      html: `
        <div class="text-left space-y-4 py-2">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div>
                <h4 class="font-medium text-gray-800">Email Notifications</h4>
                <p class="text-xs text-gray-600">Booking confirmations, reminders</p>
              </div>
            </div>
            <div class="w-10 h-6 bg-pink-500 rounded-full relative cursor-pointer">
              <div class="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div>
                <h4 class="font-medium text-gray-800">Push Notifications</h4>
                <p class="text-xs text-gray-600">Real-time alerts on your device</p>
              </div>
            </div>
            <div class="w-10 h-6 bg-pink-500 rounded-full relative cursor-pointer">
              <div class="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div>
                <h4 class="font-medium text-gray-800">Appointment Reminders</h4>
                <p class="text-xs text-gray-600">24hr & 1hr before appointments</p>
              </div>
            </div>
            <div class="w-10 h-6 bg-pink-500 rounded-full relative cursor-pointer">
              <div class="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                </svg>
              </div>
              <div>
                <h4 class="font-medium text-gray-800">Marketing Updates</h4>
                <p class="text-xs text-gray-600">Promotions and new features</p>
              </div>
            </div>
            <div class="w-10 h-6 bg-gray-300 rounded-full relative cursor-pointer">
              <div class="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div>
            </div>
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-2xl',
        htmlContainer: 'px-2',
      },
    });
  };

  const handleAppearance = () => {
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    Swal.fire({
      title: '<span class="text-gray-800">Appearance</span>',
      html: `
        <div class="text-left space-y-4 py-2">
          <p class="text-sm text-gray-600 mb-4">Customize how GlamQueue looks on your device</p>
          
          <div class="space-y-3">
            <label class="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
                <div>
                  <h4 class="font-medium text-gray-800">Light Mode</h4>
                  <p class="text-xs text-gray-500">Bright and clean interface</p>
                </div>
              </div>
              <input type="radio" name="theme" value="light" ${currentTheme === 'light' ? 'checked' : ''} class="w-4 h-4 text-pink-600">
            </label>
            
            <label class="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                  </svg>
                </div>
                <div>
                  <h4 class="font-medium text-gray-800">Dark Mode</h4>
                  <p class="text-xs text-gray-500">Easy on the eyes</p>
                </div>
              </div>
              <input type="radio" name="theme" value="dark" ${currentTheme === 'dark' ? 'checked' : ''} class="w-4 h-4 text-pink-600">
            </label>
            
            <label class="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-gradient-to-r from-yellow-200 to-gray-700 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div>
                  <h4 class="font-medium text-gray-800">System Default</h4>
                  <p class="text-xs text-gray-500">Match your device settings</p>
                </div>
              </div>
              <input type="radio" name="theme" value="system" ${currentTheme === 'system' ? 'checked' : ''} class="w-4 h-4 text-pink-600">
            </label>
          </div>
        </div>
      `,
      showCloseButton: true,
      confirmButtonText: 'Apply',
      confirmButtonColor: '#ec4899',
      customClass: {
        popup: 'rounded-2xl',
        htmlContainer: 'px-2',
        confirmButton: 'rounded-lg',
      },
      preConfirm: () => {
        const selectedTheme = (document.querySelector('input[name="theme"]:checked') as HTMLInputElement)?.value || 'light';
        return selectedTheme;
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newTheme = result.value as string;
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle('dark', prefersDark);
        } else {
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
        }
        Swal.fire({
          icon: 'success',
          title: 'Theme Updated',
          text: `Theme set to ${newTheme} mode`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const handlePrivacySecurity = () => {
    Swal.fire({
      title: '<span class="text-gray-800">Privacy & Security</span>',
      html: `
        <div class="text-left space-y-4 py-2">
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <div>
              <h4 class="font-medium text-gray-800">Two-Factor Authentication</h4>
              <p class="text-sm text-gray-600">Add an extra layer of security to your account</p>
              <span class="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Not enabled</span>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <div>
              <h4 class="font-medium text-gray-800">Active Sessions</h4>
              <p class="text-sm text-gray-600">View and manage devices logged into your account</p>
              <span class="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">1 active session</span>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h4 class="font-medium text-gray-800">Data Privacy</h4>
              <p class="text-sm text-gray-600">Control how your data is used and shared</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </div>
            <div>
              <h4 class="font-medium text-red-800">Delete Account</h4>
              <p class="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-2xl',
        htmlContainer: 'px-2',
      },
    });
  };

  const handleHelpSupport = () => {
    Swal.fire({
      title: '<span class="text-gray-800">Help & Support</span>',
      html: `
        <div class="text-left space-y-4 py-2">
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <div>
              <h4 class="font-medium text-gray-800">Documentation</h4>
              <p class="text-sm text-gray-600">Learn how to use all features</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h4 class="font-medium text-gray-800">FAQs</h4>
              <p class="text-sm text-gray-600">Frequently asked questions</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <h4 class="font-medium text-gray-800">Contact Support</h4>
              <p class="text-sm text-gray-600">support@glamqueue.com</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div>
              <h4 class="font-medium text-gray-800">Report an Issue</h4>
              <p class="text-sm text-gray-600">Let us know about bugs or problems</p>
            </div>
          </div>
          
          <div class="mt-4 p-3 bg-pink-50 rounded-lg border border-pink-200 text-center">
            <p class="text-sm text-pink-700 font-medium">GlamQueue v1.0.0</p>
            <p class="text-xs text-pink-600">© 2025 GlamQueue. All rights reserved.</p>
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-2xl',
        htmlContainer: 'px-2',
      },
    });
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

