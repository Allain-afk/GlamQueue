import { useMemo } from 'react';
import { Sparkles, Lightbulb, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '../../api/admin';
import type { AppointmentWithDetails } from '../../api/admin';

interface AIInsightsCardProps {
  dashboardStats?: DashboardStats;
  appointments?: AppointmentWithDetails[];
}

interface Insight {
  id: string;
  title: string;
  description: string;
  category: 'revenue' | 'efficiency' | 'growth' | 'customer' | 'operations';
  priority: 'high' | 'medium' | 'low';
}

export function AIInsightsCard({ dashboardStats, appointments = [] }: AIInsightsCardProps) {
  // Generate hardcoded insights based on current metrics
  const insights = useMemo<Insight[]>(() => {
    const insightsList: Insight[] = [];
    
    // Insight 1: Revenue-based
    if (dashboardStats) {
      if (dashboardStats.todayRevenue === 0) {
        insightsList.push({
          id: 'insight-1',
          title: 'Focus on Converting Pending Appointments',
          description: `You have ${dashboardStats.totalAppointments} appointments today but no completed revenue yet. Follow up with pending appointments to confirm and convert them into completed bookings.`,
          category: 'revenue',
          priority: 'high',
        });
      } else if (dashboardStats.revenueChange < 0) {
        insightsList.push({
          id: 'insight-1',
          title: 'Revenue Decline Detected',
          description: `Your revenue is down ${Math.abs(dashboardStats.revenueChange)}% from yesterday. Consider implementing promotional offers or upselling strategies to boost sales.`,
          category: 'revenue',
          priority: 'high',
        });
      } else {
        insightsList.push({
          id: 'insight-1',
          title: 'Revenue Growth Opportunity',
          description: `Great job on today's revenue! Consider implementing bundle packages and loyalty programs to increase average transaction value and customer retention.`,
          category: 'revenue',
          priority: 'medium',
        });
      }

      // Insight 2: Based on appointments or staff utilization
      const pendingCount = appointments.filter(a => a.status === 'pending').length;
      if (pendingCount > 0) {
        insightsList.push({
          id: 'insight-2',
          title: 'Follow Up on Pending Appointments',
          description: `You have ${pendingCount} pending appointment${pendingCount > 1 ? 's' : ''}. Send confirmation reminders to reduce no-shows and increase conversion rates.`,
          category: 'operations',
          priority: 'high',
        });
      } else if (dashboardStats.staffUtilization < 50) {
        insightsList.push({
          id: 'insight-2',
          title: 'Optimize Staff Scheduling',
          description: `Staff utilization is at ${dashboardStats.staffUtilization}%. Consider adjusting schedules or promoting services during off-peak hours to maximize productivity.`,
          category: 'efficiency',
          priority: 'medium',
        });
      } else if (dashboardStats.activeClients < 5) {
        insightsList.push({
          id: 'insight-2',
          title: 'Build Customer Base',
          description: `You have ${dashboardStats.activeClients} active clients. Implement referral programs and social media marketing to attract new customers and grow your client base.`,
          category: 'growth',
          priority: 'high',
        });
      } else {
        insightsList.push({
          id: 'insight-2',
          title: 'Maintain Customer Relationships',
          description: `You have ${dashboardStats.activeClients} active clients. Send personalized follow-ups and special offers to maintain engagement and encourage repeat visits.`,
          category: 'customer',
          priority: 'medium',
        });
      }
    } else {
      // Default insights when no data available
      insightsList.push(
        {
          id: 'insight-1',
          title: 'Focus on Revenue Growth',
          description: 'Consider implementing bundle packages and loyalty programs to increase average transaction value and customer retention.',
          category: 'revenue',
          priority: 'high',
        },
        {
          id: 'insight-2',
          title: 'Optimize Staff Scheduling',
          description: 'Analyze peak hours and ensure adequate staff coverage during busy periods to maximize revenue potential.',
          category: 'efficiency',
          priority: 'medium',
        }
      );
    }

    return insightsList.slice(0, 2);
  }, [dashboardStats, appointments]);

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
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Insights</h3>
            <p className="text-sm text-white/90">Today's Optimization Suggestions</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
            View All
          </button>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="bg-white/10 rounded-xl p-6 text-center">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 text-white/80" />
          <p className="text-sm text-white/90">No insights available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-1.5 rounded-lg ${getCategoryColor(insight.category)} mt-0.5`}>
                    {getCategoryIcon(insight.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                    <p className="text-sm text-white/90 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ml-2 flex-shrink-0 ${getPriorityColor(insight.priority)}`}>
                  {insight.priority}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${getCategoryColor(insight.category)}`}>
                  {insight.category}
                </span>
                <span className="text-xs text-white/70">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

