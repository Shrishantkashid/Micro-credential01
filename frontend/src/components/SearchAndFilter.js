import React from 'react';
import { Search, Filter, SortAsc } from 'lucide-react';

const SearchAndFilter = ({
  searchTerm,
  onSearchChange,
  selectedPlatform,
  onPlatformChange,
  sortBy,
  onSortChange,
  certificates
}) => {
  // Get unique platforms from certificates
  const platforms = [...new Set(certificates.map(cert => cert.platform))].sort();

  return (
    <div className="card">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search certificates, skills, or platforms..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Platform Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={selectedPlatform}
            onChange={(e) => onPlatformChange(e.target.value)}
            className="input-field pl-10 appearance-none"
          >
            <option value="all">All Platforms</option>
            {platforms.map(platform => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="relative">
          <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="input-field pl-10 appearance-none"
          >
            <option value="date">Sort by Date</option>
            <option value="platform">Sort by Platform</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilter;