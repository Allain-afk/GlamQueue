import { useState } from 'react';
import {
  Send,
  Mail,
  MessageSquare,
  Gift,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Zap,
  Star,
  Heart,
  Award,
} from 'lucide-react';
import { NewCampaignModal } from '../components/NewCampaignModal';

export function MarketingScreen() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'loyalty' | 'promotions'>('campaigns');
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);

  const campaigns = [
    {
      id: 1,
      name: 'Summer Special Discount',
      type: 'Email',
      status: 'Active',
      sent: 1240,
      opened: 856,
      clicked: 342,
      revenue: 18500,
    },
    {
      id: 2,
      name: 'New Customer Welcome',
      type: 'SMS',
      status: 'Active',
      sent: 320,
      opened: 298,
      clicked: 156,
      revenue: 7800,
    },
    {
      id: 3,
      name: 'Birthday Rewards',
      type: 'Email',
      status: 'Scheduled',
      sent: 0,
      opened: 0,
      clicked: 0,
      revenue: 0,
    },
  ];

  const loyaltyTiers = [
    { name: 'Bronze', members: 142, color: 'orange', icon: Award },
    { name: 'Silver', members: 89, color: 'gray', icon: Star },
    { name: 'Gold', members: 45, color: 'yellow', icon: Star },
    { name: 'Platinum', members: 12, color: 'purple', icon: Award },
  ];

  const promotions = [
    {
      id: 1,
      title: '20% Off First Visit',
      type: 'Discount',
      used: 45,
      remaining: 55,
      expiry: '2024-12-31',
      status: 'Active',
    },
    {
      id: 2,
      title: 'Refer a Friend',
      type: 'Referral',
      used: 23,
      remaining: 77,
      expiry: '2024-12-31',
      status: 'Active',
    },
    {
      id: 3,
      title: 'Holiday Special',
      type: 'Seasonal',
      used: 0,
      remaining: 100,
      expiry: '2024-12-25',
      status: 'Scheduled',
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Completed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <p className="text-sm text-gray-500 mt-1">Manage campaigns, promotions, and loyalty programs</p>
        </div>
        <button 
          onClick={() => setShowNewCampaignModal(true)}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Zap className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pink-100 rounded-lg">
              <Send className="w-6 h-6 text-pink-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+12%</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Active Campaigns</p>
          <p className="text-3xl font-bold text-gray-900">8</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+8%</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Reach</p>
          <p className="text-3xl font-bold text-gray-900">2,450</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+15%</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
          <p className="text-3xl font-bold text-gray-900">24.5%</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+22%</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Revenue Generated</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(45600)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'campaigns'
                ? 'bg-pink-100 text-pink-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Campaigns</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'loyalty'
                ? 'bg-pink-100 text-pink-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Loyalty Program</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'promotions'
                ? 'bg-pink-100 text-pink-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Gift className="w-4 h-4" />
              <span>Promotions</span>
            </div>
          </button>
        </div>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Campaign Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Sent
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Open Rate
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Click Rate
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Revenue
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {campaign.type === 'Email' ? (
                            <Mail className="w-4 h-4 text-blue-500" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-green-500" />
                          )}
                          <span className="text-sm text-gray-600">{campaign.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            campaign.status
                          )}`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{campaign.sent}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[60px]">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${campaign.sent > 0 ? (campaign.opened / campaign.sent) * 100 : 0}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">
                            {campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[60px]">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${campaign.opened > 0 ? (campaign.clicked / campaign.opened) * 100 : 0}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">
                            {campaign.opened > 0 ? ((campaign.clicked / campaign.opened) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(campaign.revenue)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Loyalty Program Tab */}
      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loyaltyTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={`bg-white rounded-xl p-6 border-2 border-${tier.color}-200 hover:shadow-lg transition-shadow`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-${tier.color}-100 rounded-lg`}>
                      <Icon className={`w-6 h-6 text-${tier.color}-600`} />
                    </div>
                    <span className={`text-2xl font-bold text-${tier.color}-600`}>{tier.members}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">Members</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• 5% discount on services</p>
                    <p>• Priority booking</p>
                    <p>• Birthday rewards</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loyalty Program Performance</h3>
                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Members</p>
                    <p className="text-3xl font-bold text-gray-900">{loyaltyTiers.reduce((sum, t) => sum + t.members, 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Rewards Redeemed</p>
                    <p className="text-3xl font-bold text-gray-900">1,234</p>
                  </div>
                </div>
              </div>
              <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors">
                Manage Program
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promotions Tab */}
      {activeTab === 'promotions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {promotions.map((promo) => (
              <div key={promo.id} className="bg-white rounded-xl p-6 border border-gray-100 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{promo.title}</h3>
                    <p className="text-sm text-gray-600">{promo.type}</p>
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      promo.status
                    )}`}
                  >
                    {promo.status}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Usage</span>
                    <span>
                      {promo.used}/{promo.used + promo.remaining}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-pink-500 h-2 rounded-full"
                      style={{
                        width: `${((promo.used / (promo.used + promo.remaining)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Spacer to push button to bottom */}
                <div className="flex-grow"></div>

                {/* Actions - Always at bottom */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Expires: {promo.expiry}</span>
                  </div>
                  <button className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Promotion</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-pink-400 hover:bg-pink-50 transition-all text-center group">
                <Gift className="w-8 h-8 text-gray-400 group-hover:text-pink-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Discount Code</p>
                <p className="text-xs text-gray-500 mt-1">Create percentage or fixed discount</p>
              </button>
              <button className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-center group">
                <Users className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Referral Program</p>
                <p className="text-xs text-gray-500 mt-1">Reward clients for referrals</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      <NewCampaignModal
        isOpen={showNewCampaignModal}
        onClose={() => setShowNewCampaignModal(false)}
        onCampaignCreated={() => {
          // Refresh campaigns if needed
        }}
      />
    </div>
  );
}


