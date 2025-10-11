import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  LogOut, 
  Award, 
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import CertificateCard from '../components/CertificateCard';
import StatsCards from '../components/StatsCards';
import SyncButton from '../components/SyncButton';
import SearchAndFilter from '../components/SearchAndFilter';

const Dashboard = ({ user, onLogout }) => {
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const loadCertificates = useCallback(async () => {
    try {
      const response = await apiService.getCertificates(user.email);
      if (response.success) {
        setCertificates(response.certificates || []);
      } else {
        throw new Error(response.message || 'Failed to load certificates');
      }
    } catch (error) {
      console.error('Error loading certificates:', error);
      if (apiService.isAuthError(error)) {
        toast.error('Please log in again');
        onLogout();
      } else {
        toast.error(error.message || 'Failed to load certificates');
      }
    }
  }, [user.email, onLogout]);

  const loadStats = useCallback(async () => {
    try {
      const response = await apiService.getStats(user.email);
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Don't show error for stats failure
    }
  }, [user.email]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCertificates(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [loadCertificates, loadStats]);

  useEffect(() => {
    if (user && user.email) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      console.log('Starting sync for user:', user.email);
      const response = await apiService.syncCertificates(user.email);
      console.log('Sync response:', response);
      
      if (response.success) {
        // Handle different response formats
        let newCertificates, duplicates, errors;
        
        if (response.summary) {
          // Standard response with summary object
          ({ new_certificates: newCertificates, duplicates, errors } = response.summary);
          console.log('Extracted from summary:', { newCertificates, duplicates, errors });
        } else {
          // Fallback for direct properties (no certificates found case)
          newCertificates = response.new_certificates || 0;
          duplicates = response.duplicates || 0;
          errors = response.errors || 0;
          console.log('Extracted from direct properties:', { newCertificates, duplicates, errors });
        }
        
        if (newCertificates > 0) {
          toast.success(`Found ${newCertificates} new certificates!`);
          await loadDashboardData(); // Reload data
        } else if (duplicates > 0) {
          toast.success('No new certificates found');
        } else {
          toast.success('Sync completed - no certificates found');
        }

        if (errors > 0) {
          toast.error(`${errors} errors occurred during sync`);
        }
      } else {
        console.error('Sync failed:', response);
        throw new Error(response.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      if (apiService.isAuthError(error)) {
        toast.error('Please log in again to sync');
        onLogout();
      } else {
        toast.error(error.message || 'Sync failed');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await onLogout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  // Filter and sort certificates
  const filteredAndSortedCertificates = certificates
    .filter(cert => {
      const matchesSearch = searchTerm === '' || 
        cert.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.skills.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.platform.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlatform = selectedPlatform === 'all' || 
        cert.platform.toLowerCase() === selectedPlatform.toLowerCase();
      
      return matchesSearch && matchesPlatform;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.issue_date) - new Date(a.issue_date);
        case 'platform':
          return a.platform.localeCompare(b.platform);
        case 'name':
          return a.course_name.localeCompare(b.course_name);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading your certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Credential Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <SyncButton onSync={handleSync} syncing={syncing} />
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && <StatsCards stats={stats} />}

        {/* Search and Filter */}
        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedPlatform={selectedPlatform}
          onPlatformChange={setSelectedPlatform}
          sortBy={sortBy}
          onSortChange={setSortBy}
          certificates={certificates}
        />

        {/* Certificates List */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Your Certificates ({filteredAndSortedCertificates.length})
            </h2>
          </div>

          {filteredAndSortedCertificates.length === 0 ? (
            <div className="text-center py-12">
              {certificates.length === 0 ? (
                <div>
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No certificates found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Click "Sync Now" to scan your Gmail for certificates
                  </p>
                  <SyncButton onSync={handleSync} syncing={syncing} />
                </div>
              ) : (
                <div>
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No matching certificates
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedCertificates.map((certificate) => (
                <CertificateCard
                  key={certificate.id}
                  certificate={certificate}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;