import { Home, Search, Calendar, MoreHorizontal, LayoutGrid, Users, BarChart3, Settings, UserCircle, FileText, UserCheck } from 'lucide-react';

export type MobileNavItem = 'home' | 'explore' | 'schedule' | 'more';
export type AdminNavItem = 'dashboard' | 'appointments' | 'clients' | 'analytics' | 'more';
export type ManagerNavItem = 'dashboard' | 'team' | 'reports' | 'more';
export type StaffNavItem = 'schedule' | 'clients' | 'profile';

interface MobileBottomNavProps {
  activeItem: MobileNavItem;
  onNavigate: (item: MobileNavItem) => void;
}

interface AdminBottomNavProps {
  activeItem: AdminNavItem;
  onNavigate: (item: AdminNavItem) => void;
}

interface ManagerBottomNavProps {
  activeItem: ManagerNavItem;
  onNavigate: (item: ManagerNavItem) => void;
}

interface StaffBottomNavProps {
  activeItem: StaffNavItem;
  onNavigate: (item: StaffNavItem) => void;
}

const clientNavItems = [
  { id: 'home' as MobileNavItem, label: 'Home', icon: Home },
  { id: 'explore' as MobileNavItem, label: 'Explore', icon: Search },
  { id: 'schedule' as MobileNavItem, label: 'Schedule', icon: Calendar },
  { id: 'more' as MobileNavItem, label: 'More', icon: MoreHorizontal },
];

const adminNavItems = [
  { id: 'dashboard' as AdminNavItem, label: 'Dashboard', icon: LayoutGrid },
  { id: 'appointments' as AdminNavItem, label: 'Bookings', icon: Calendar },
  { id: 'clients' as AdminNavItem, label: 'Clients', icon: Users },
  { id: 'analytics' as AdminNavItem, label: 'Analytics', icon: BarChart3 },
  { id: 'more' as AdminNavItem, label: 'More', icon: Settings },
];

const managerNavItems = [
  { id: 'dashboard' as ManagerNavItem, label: 'Home', icon: LayoutGrid },
  { id: 'team' as ManagerNavItem, label: 'Team', icon: Users },
  { id: 'reports' as ManagerNavItem, label: 'Reports', icon: FileText },
  { id: 'more' as ManagerNavItem, label: 'More', icon: MoreHorizontal },
];

const staffNavItems = [
  { id: 'schedule' as StaffNavItem, label: 'My Schedule', icon: Calendar },
  { id: 'clients' as StaffNavItem, label: 'Clients', icon: UserCheck },
  { id: 'profile' as StaffNavItem, label: 'Profile', icon: UserCircle },
];

export function MobileBottomNav({ activeItem, onNavigate }: MobileBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-container">
        {clientNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`mobile-nav-item ${isActive ? 'mobile-nav-item--active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="mobile-nav-icon-wrapper">
                <Icon 
                  className={`mobile-nav-icon ${isActive ? 'mobile-nav-icon--active' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && <div className="mobile-nav-indicator" />}
              </div>
              <span className={`mobile-nav-label ${isActive ? 'mobile-nav-label--active' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminBottomNav({ activeItem, onNavigate }: AdminBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-container mobile-nav-container--admin">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`mobile-nav-item ${isActive ? 'mobile-nav-item--active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="mobile-nav-icon-wrapper">
                <Icon 
                  className={`mobile-nav-icon ${isActive ? 'mobile-nav-icon--active' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && <div className="mobile-nav-indicator" />}
              </div>
              <span className={`mobile-nav-label ${isActive ? 'mobile-nav-label--active' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function ManagerBottomNav({ activeItem, onNavigate }: ManagerBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-container">
        {managerNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`mobile-nav-item ${isActive ? 'mobile-nav-item--active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="mobile-nav-icon-wrapper">
                <Icon 
                  className={`mobile-nav-icon ${isActive ? 'mobile-nav-icon--active' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && <div className="mobile-nav-indicator" />}
              </div>
              <span className={`mobile-nav-label ${isActive ? 'mobile-nav-label--active' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function StaffBottomNav({ activeItem, onNavigate }: StaffBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-container">
        {staffNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`mobile-nav-item ${isActive ? 'mobile-nav-item--active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="mobile-nav-icon-wrapper">
                <Icon 
                  className={`mobile-nav-icon ${isActive ? 'mobile-nav-icon--active' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && <div className="mobile-nav-indicator" />}
              </div>
              <span className={`mobile-nav-label ${isActive ? 'mobile-nav-label--active' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

