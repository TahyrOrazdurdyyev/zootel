import React, { useState, useEffect, useCallback } from 'react';
import './CompanyManagement.css';

const CompanyManagement = () => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    verified: '',
    page: 1,
    limit: 10
  });
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = await user.getIdToken?.();
      
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://zootel.shop'}/api/superadmin/companies?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCompanies(result.data);
        setPagination(result.pagination);
      } else {
        console.error('Failed to fetch companies');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit]);

  const applyFilters = useCallback(() => {
    let filtered = [...companies];

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(company => company.status === filters.status);
    }

    // Apply verification filter
    if (filters.verified) {
      if (filters.verified === 'verified') {
        filtered = filtered.filter(company => company.verified);
      } else if (filters.verified === 'unverified') {
        filtered = filtered.filter(company => !company.verified);
      }
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchLower) ||
        company.email.toLowerCase().includes(searchLower) ||
        company.address.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCompanies(filtered);
  }, [companies, filters.status, filters.search, filters.verified]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };

  const viewCompanyDetails = (company) => {
    setSelectedCompany(company);
    setShowCompanyModal(true);
  };

  const updateCompanyVerification = async (companyId, verified) => {
    try {
      setActionLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = await user.getIdToken?.();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://zootel.shop'}/api/superadmin/companies/${companyId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verified })
      });

      if (response.ok) {
        // Update local state
        setCompanies(prev => prev.map(c => 
          c.id === companyId ? { ...c, verified } : c
        ));
        if (selectedCompany && selectedCompany.id === companyId) {
          setSelectedCompany(prev => ({ ...prev, verified }));
        }
        alert(`Company ${verified ? 'verified' : 'unverified'} successfully`);
      } else {
        const error = await response.json();
        alert(`Failed to update verification: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating company verification:', error);
      alert('Failed to update company verification');
    } finally {
      setActionLoading(false);
    }
  };

  const updateCompanyStatus = async (companyId, status) => {
    try {
      setActionLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = await user.getIdToken?.();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://zootel.shop'}/api/superadmin/companies/${companyId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Update local state
        setCompanies(prev => prev.map(c => 
          c.id === companyId ? { ...c, status } : c
        ));
        if (selectedCompany && selectedCompany.id === companyId) {
          setSelectedCompany(prev => ({ ...prev, status }));
        }
        alert(`Company status updated to ${status} successfully`);
      } else {
        const error = await response.json();
        alert(`Failed to update status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating company status:', error);
      alert('Failed to update company status');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '✅';
      case 'pending': return '⏳';
      case 'suspended': return '⚠️';
      case 'rejected': return '❌';
      default: return '❔';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'pending': return 'status-pending';
      case 'suspended': return 'status-suspended';
      case 'rejected': return 'status-rejected';
      default: return 'status-default';
    }
  };

  const getVerificationBadgeClass = (verified) => {
    return verified ? 'verification-verified' : 'verification-unverified';
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('⭐');
    }
    return stars.join('');
  };

  if (loading) {
    return (
      <div className="company-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading companies...</p>
      </div>
    );
  }

  return (
    <div className="company-management">
      {/* Header */}
      <div className="company-management-header">
        <div className="header-info">
          <h2>Company Management</h2>
          <p>Manage pet service companies, verification, and platform access</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">{companies.length}</span>
            <span className="stat-label">Total Companies</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{companies.filter(c => c.verified).length}</span>
            <span className="stat-label">Verified</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{companies.filter(c => c.status === 'active').length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{companies.filter(c => c.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="company-filters">
        <div className="filter-group">
          <label>Search Companies</label>
          <input
            type="text"
            placeholder="Search by name, email, or address..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Verification</label>
          <select
            value={filters.verified}
            onChange={(e) => handleFilterChange('verified', e.target.value)}
            className="filter-select"
          >
            <option value="">All Companies</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Show</label>
          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="filter-select"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="companies-grid">
        {filteredCompanies.map((company) => (
          <div key={company.id} className="company-card">
            <div className="company-header">
              <div className="company-name-section">
                <h3 className="company-name">{company.name}</h3>
                <div className="company-badges">
                  <span className={`status-badge ${getStatusBadgeClass(company.status)}`}>
                    <span className="status-icon">{getStatusIcon(company.status)}</span>
                    {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                  </span>
                  <span className={`verification-badge ${getVerificationBadgeClass(company.verified)}`}>
                    {company.verified ? '✅ Verified' : '❌ Unverified'}
                  </span>
                </div>
              </div>
              <div className="company-rating">
                <span className="rating-stars">{getRatingStars(company.rating)}</span>
                <span className="rating-value">{company.rating}/5.0</span>
              </div>
            </div>

            <div className="company-content">
              <div className="company-info">
                <div className="info-item">
                  <span className="info-icon">📧</span>
                  <span className="info-text">{company.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">📞</span>
                  <span className="info-text">{company.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">📍</span>
                  <span className="info-text">{company.address}</span>
                </div>
              </div>

              <div className="company-description">
                <p>{company.description}</p>
              </div>

              <div className="company-metrics">
                <div className="metric">
                  <span className="metric-value">{company.totalServices}</span>
                  <span className="metric-label">Services</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{company.totalBookings}</span>
                  <span className="metric-label">Bookings</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{formatCurrency(company.totalRevenue)}</span>
                  <span className="metric-label">Revenue</span>
                </div>
              </div>

              <div className="company-dates">
                <div className="date-item">
                  <span className="date-label">Joined:</span>
                  <span className="date-value">{formatDate(company.joinedDate)}</span>
                </div>
                <div className="date-item">
                  <span className="date-label">Last Active:</span>
                  <span className="date-value">{formatDate(company.lastActiveDate)}</span>
                </div>
              </div>
            </div>

            <div className="company-actions">
              <button
                className="action-btn view"
                onClick={() => viewCompanyDetails(company)}
                title="View Details"
              >
                👁️ View Details
              </button>
              
              <select
                className="status-selector"
                value={company.status}
                onChange={(e) => updateCompanyStatus(company.id, e.target.value)}
                disabled={actionLoading}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                className={`action-btn ${company.verified ? 'unverify' : 'verify'}`}
                onClick={() => updateCompanyVerification(company.id, !company.verified)}
                disabled={actionLoading}
                title={company.verified ? 'Remove Verification' : 'Verify Company'}
              >
                {company.verified ? '❌ Unverify' : '✅ Verify'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="no-companies">
          <div className="no-companies-icon">🏢</div>
          <h3>No Companies Found</h3>
          <p>Try adjusting your search criteria or filters.</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={pagination.currentPage === 1}
            onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
          >
            Previous
          </button>
          
          <div className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
            <span className="total-count">({pagination.totalCompanies} total companies)</span>
          </div>
          
          <button
            className="pagination-btn"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Company Details Modal */}
      {showCompanyModal && selectedCompany && (
        <div className="modal-overlay" onClick={() => setShowCompanyModal(false)}>
          <div className="company-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Company Details</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCompanyModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="company-profile">
                <div className="profile-header">
                  <h4>{selectedCompany.name}</h4>
                  <div className="profile-badges">
                    <span className={`status-badge ${getStatusBadgeClass(selectedCompany.status)}`}>
                      <span className="status-icon">{getStatusIcon(selectedCompany.status)}</span>
                      {selectedCompany.status.charAt(0).toUpperCase() + selectedCompany.status.slice(1)}
                    </span>
                    <span className={`verification-badge ${getVerificationBadgeClass(selectedCompany.verified)}`}>
                      {selectedCompany.verified ? '✅ Verified' : '❌ Unverified'}
                    </span>
                  </div>
                </div>
                <div className="profile-rating">
                  <span className="rating-stars">{getRatingStars(selectedCompany.rating)}</span>
                  <span className="rating-value">{selectedCompany.rating}/5.0</span>
                </div>
              </div>

              <div className="company-details-grid">
                <div className="detail-section">
                  <h5>Contact Information</h5>
                  <div className="detail-item">
                    <label>Email</label>
                    <span>{selectedCompany.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone</label>
                    <span>{selectedCompany.phone}</span>
                  </div>
                  <div className="detail-item">
                    <label>Address</label>
                    <span>{selectedCompany.address}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h5>Business Metrics</h5>
                  <div className="detail-item">
                    <label>Total Services</label>
                    <span>{selectedCompany.totalServices}</span>
                  </div>
                  <div className="detail-item">
                    <label>Total Bookings</label>
                    <span>{selectedCompany.totalBookings}</span>
                  </div>
                  <div className="detail-item">
                    <label>Total Revenue</label>
                    <span>{formatCurrency(selectedCompany.totalRevenue)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h5>Account Information</h5>
                  <div className="detail-item">
                    <label>User ID</label>
                    <span>{selectedCompany.userId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Joined Date</label>
                    <span>{formatDate(selectedCompany.joinedDate)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Last Active</label>
                    <span>{formatDate(selectedCompany.lastActiveDate)}</span>
                  </div>
                </div>

                <div className="detail-section full-width">
                  <h5>Description</h5>
                  <p>{selectedCompany.description}</p>
                </div>
              </div>

              <div className="modal-actions">
                <select
                  className="status-selector large"
                  value={selectedCompany.status}
                  onChange={(e) => updateCompanyStatus(selectedCompany.id, e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                </select>
                
                <button
                  className={`action-btn large ${selectedCompany.verified ? 'unverify' : 'verify'}`}
                  onClick={() => updateCompanyVerification(selectedCompany.id, !selectedCompany.verified)}
                  disabled={actionLoading}
                >
                  {selectedCompany.verified ? '❌ Remove Verification' : '✅ Verify Company'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement; 