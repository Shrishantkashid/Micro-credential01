import React from 'react';
import { Award, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const StatsCards = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Certificates',
      value: stats.total_certificates,
      icon: <Award className="w-6 h-6 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'Platforms',
      value: Object.keys(stats.platforms || {}).length,
      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      title: 'Recent (30 days)',
      value: stats.recent_certificates,
      icon: <Calendar className="w-6 h-6 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200'
    },
    {
      title: 'Unique Skills',
      value: Object.keys(stats.skills_summary || {}).length,
      icon: <Sparkles className="w-6 h-6 text-orange-600" />,
      color: 'bg-orange-50 border-orange-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => (
        <div
          key={index}
          className={`card ${card.color} transition-all duration-200 hover:shadow-md`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
            <div className="flex-shrink-0">
              {card.icon}
            </div>
          </div>
        </div>
      ))}

      {/* Latest Certificate Card */}
      {stats.latest_certificate && (
        <div className="col-span-full">
          <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Latest Certificate</p>
                <h3 className="font-semibold text-gray-900">{stats.latest_certificate.course_name}</h3>
                <p className="text-sm text-gray-600">
                  {stats.latest_certificate.platform} • {format(new Date(stats.latest_certificate.issue_date), 'MMM dd, yyyy')}
                </p>
              </div>
              <Award className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Platform Breakdown */}
      {stats.platforms && Object.keys(stats.platforms).length > 0 && (
        <div className="col-span-full">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Platform Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(stats.platforms).map(([platform, count]) => (
                <div key={platform} className="text-center">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold ${getPlatformColor(platform)}`}>
                    {count}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{platform}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Skills */}
      {stats.skills_summary && Object.keys(stats.skills_summary).length > 0 && (
        <div className="col-span-full">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Top Skills</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.skills_summary)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 12)
                .map(([skill, count]) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {skill} ({count})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get platform colors
const getPlatformColor = (platform) => {
  const colors = {
    'Coursera': 'bg-blue-500',
    'edX': 'bg-purple-500',
    'Udemy': 'bg-orange-500',
    'Infosys Springboard': 'bg-green-500',
    'Udacity': 'bg-teal-500',
    'LinkedIn Learning': 'bg-indigo-500'
  };
  return colors[platform] || 'bg-gray-500';
};

export default StatsCards;