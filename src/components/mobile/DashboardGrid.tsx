import { 
  CreditCard, 
  Package, 
  BookOpen, 
  ShoppingBag, 
  Users, 
  BarChart2, 
  Settings, 
  MoreHorizontal,
  Calendar,
  TrendingUp,
  Bell,
  MessageSquare
} from 'lucide-react';

interface DashboardAction {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  badge?: number;
}

interface DashboardGridProps {
  onActionSelect?: (actionId: string) => void;
  actions?: DashboardAction[];
  title?: string;
}

const defaultActions: DashboardAction[] = [
  { id: 'billing', name: 'Billing', icon: CreditCard, color: '#FF5A5F' },
  { id: 'inventory', name: 'Inventory', icon: Package, color: '#8B5CF6' },
  { id: 'khata', name: 'Khata', icon: BookOpen, color: '#06B6D4' },
  { id: 'estore', name: 'eStore', icon: ShoppingBag, color: '#EC4899' },
  { id: 'customers', name: 'Customers', icon: Users, color: '#10B981' },
  { id: 'reports', name: 'Reports', icon: BarChart2, color: '#F59E0B' },
  { id: 'setup', name: 'Setup', icon: Settings, color: '#6366F1' },
  { id: 'more', name: 'More', icon: MoreHorizontal, color: '#64748B' },
];

const quickActions: DashboardAction[] = [
  { id: 'appointments', name: 'Appointments', icon: Calendar, color: '#FF5A5F', badge: 5 },
  { id: 'analytics', name: 'Analytics', icon: TrendingUp, color: '#10B981' },
  { id: 'notifications', name: 'Alerts', icon: Bell, color: '#F59E0B', badge: 3 },
  { id: 'messages', name: 'Messages', icon: MessageSquare, color: '#8B5CF6', badge: 12 },
];

export function DashboardGrid({ 
  onActionSelect, 
  actions = defaultActions,
  title = "Quick Actions"
}: DashboardGridProps) {
  return (
    <section className="dashboard-grid-section">
      <h2 className="dashboard-grid-title">{title}</h2>
      
      <div className="dashboard-grid">
        {actions.map((action) => {
          const Icon = action.icon;
          
          return (
            <button
              key={action.id}
              onClick={() => onActionSelect?.(action.id)}
              className="dashboard-grid-item"
              style={{
                '--action-color': action.color,
                '--action-color-light': `${action.color}15`,
              } as React.CSSProperties}
            >
              <div className="dashboard-grid-icon-wrapper">
                <Icon className="dashboard-grid-icon" size={24} />
                {action.badge && action.badge > 0 && (
                  <span className="dashboard-grid-badge">{action.badge > 9 ? '9+' : action.badge}</span>
                )}
              </div>
              <span className="dashboard-grid-label">{action.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function QuickActionsGrid({ onActionSelect }: { onActionSelect?: (actionId: string) => void }) {
  return (
    <DashboardGrid 
      onActionSelect={onActionSelect}
      actions={quickActions}
      title="Quick Actions"
    />
  );
}

export function BusinessActionsGrid({ onActionSelect }: { onActionSelect?: (actionId: string) => void }) {
  return (
    <DashboardGrid 
      onActionSelect={onActionSelect}
      actions={defaultActions}
      title="Business Tools"
    />
  );
}

