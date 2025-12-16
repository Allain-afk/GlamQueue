import { X, Sparkles, TrendingUp, Lightbulb } from 'lucide-react';
import type { DashboardStats } from '../../api/admin';
import type { AppointmentWithDetails } from '../../api/admin';

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardStats?: DashboardStats;
  appointments?: AppointmentWithDetails[];
}

interface Insight {
  id: string;
  title: string;
  description: string;
  category: 'revenue' | 'efficiency' | 'growth' | 'customer' | 'operations';
  priority: 'high' | 'medium' | 'low';
  date: string;
}

export function AIInsightsModal({ isOpen, onClose, dashboardStats, appointments = [] }: AIInsightsModalProps) {
  if (!isOpen) return null;

  // Generate comprehensive insights
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];
    
    if (dashboardStats) {
      // Revenue insights
      if (dashboardStats.revenueChange < 0) {
        insights.push({
          id: 'rev-1',
          title: 'Revenue Decline Detected',
          description: `Your revenue is down ${Math.abs(dashboardStats.revenueChange)}% from yesterday. Consider implementing promotional offers or upselling strategies to boost sales.`,
          category: 'revenue',
          priority: 'high',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      } else if (dashboardStats.revenueChange > 0) {
        insights.push({
          id: 'rev-2',
          title: 'Revenue Growth Opportunity',
          description: `Great job on today's revenue! Consider implementing bundle packages and loyalty programs to increase average transaction value and customer retention.`,
          category: 'revenue',
          priority: 'medium',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      }

      // Staff utilization insights
      if (dashboardStats.staffUtilization < 50) {
        insights.push({
          id: 'eff-1',
          title: 'Optimize Staff Scheduling',
          description: `Staff utilization is at ${dashboardStats.staffUtilization}%. Consider adjusting schedules or promoting services during off-peak hours to maximize productivity.`,
          category: 'efficiency',
          priority: 'medium',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      }

      // Client growth insights
      if (dashboardStats.activeClients < 5) {
        insights.push({
          id: 'growth-1',
          title: 'Build Customer Base',
          description: `You have ${dashboardStats.activeClients} active clients. Implement referral programs and social media marketing to attract new customers and grow your client base.`,
          category: 'growth',
          priority: 'high',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      }
    }

    // Appointment insights
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    if (pendingCount > 0) {
      insights.push({
        id: 'ops-1',
        title: 'Follow Up on Pending Appointments',
        description: `You have ${pendingCount} pending appointment${pendingCount > 1 ? 's' : ''}. Send confirmation reminders to reduce no-shows and increase conversion rates.`,
        category: 'operations',
        priority: 'high',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }

    // Add more default insights
    insights.push({
      id: 'cust-1',
      title: 'Enhance Customer Experience',
      description: 'Consider implementing a feedback system to gather customer reviews and improve service quality based on client preferences.',
      category: 'customer',
      priority: 'medium',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });

    return insights;
  };

  const insights = generateInsights();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue': return <TrendingUp className="w-5 h-5" />;
      case 'efficiency': return <Sparkles className="w-5 h-5" />;
      case 'growth': return <TrendingUp className="w-5 h-5" />;
      case 'customer': return <Sparkles className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'revenue': return 'text-green-600 bg-green-100';
      case 'efficiency': return 'text-blue-600 bg-blue-100';
      case 'growth': return 'text-purple-600 bg-purple-100';
      case 'customer': return 'text-pink-600 bg-pink-100';
      default: return 'text-orange-600 bg-orange-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 sm:p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">AI Insights</h2>
                <p className="text-xs sm:text-sm text-white/90">Comprehensive optimization suggestions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {insights.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No insights available at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${getCategoryColor(insight.category)}`}>
                        {getCategoryIcon(insight.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 text-lg">{insight.title}</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ml-2 flex-shrink-0 ${getPriorityColor(insight.priority)}`}>
                      {insight.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-200">
                    <span className={`text-xs px-3 py-1 rounded-full capitalize ${getCategoryColor(insight.category)}`}>
                      {insight.category}
                    </span>
                    <span className="text-xs text-gray-500">{insight.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

