import React from 'react';
import { ExternalLink, Download, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const CertificateCard = ({ certificate }) => {
  const {
    platform,
    course_name,
    skills,
    issue_date,
    download_link,
    created_at
  } = certificate;

  // Get platform-specific styling
  const getPlatformStyle = (platform) => {
    const styles = {
      'Coursera': 'platform-coursera border-blue-500',
      'edX': 'platform-edx border-purple-500',
      'Udemy': 'platform-udemy border-orange-500',
      'Infosys Springboard': 'platform-infosys border-green-500',
      'Udacity': 'platform-udacity border-teal-500',
      'LinkedIn Learning': 'platform-linkedin border-indigo-500'
    };
    return styles[platform] || 'border-gray-500';
  };

  const getPlatformBadgeColor = (platform) => {
    const colors = {
      'Coursera': 'badge-primary',
      'edX': 'bg-purple-100 text-purple-800',
      'Udemy': 'bg-orange-100 text-orange-800',
      'Infosys Springboard': 'badge-success',
      'Udacity': 'bg-teal-100 text-teal-800',
      'LinkedIn Learning': 'bg-indigo-100 text-indigo-800'
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className={`card certificate-card ${getPlatformStyle(platform)}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <span className={`badge ${getPlatformBadgeColor(platform)}`}>
          {platform}
        </span>
        {download_link && (
          <a
            href={download_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="View Certificate"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Course Name */}
      <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[3rem]">
        {course_name}
      </h3>

      {/* Skills */}
      {skills && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Sparkles className="w-4 h-4 text-gray-500 mr-1" />
            <span className="text-sm font-medium text-gray-700">Skills</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {skills.split(',').slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
              >
                {skill.trim()}
              </span>
            ))}
            {skills.split(',').length > 4 && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                +{skills.split(',').length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Date */}
      <div className="flex items-center text-sm text-gray-500 mt-auto">
        <Calendar className="w-4 h-4 mr-1" />
        <span>Issued: {formatDate(issue_date)}</span>
      </div>

      {/* Footer with actions */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          Added {formatDate(created_at)}
        </span>
        {download_link && (
          <a
            href={download_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Download className="w-3 h-3 mr-1" />
            View
          </a>
        )}
      </div>
    </div>
  );
};

export default CertificateCard;