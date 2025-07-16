import React, { useState, useEffect, useCallback } from 'react';
import './UserManagement.css';

const UserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    status: '',
    page: 1,
    limit: 20
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = await user.getIdToken?.();
      
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/superadmin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setUsers(result.data);
        setPagination(result.pagination);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit]);

  const applyFilters = useCallback(() => {
    let filtered = [...users];

    // Apply role filter
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Apply status filter
    if (filters.status) {
      if (filters.status === 'active') {
        filtered = filtered.filter(user => !user.disabled);
      } else if (filters.status === 'disabled') {
        filtered = filtered.filter(user => user.disabled);
      } else if (filters.status === 'verified') {
        filtered = filtered.filter(user => user.emailVerified);
      } else if (filters.status === 'unverified') {
        filtered = filtered.filter(user => !user.emailVerified);
      }
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchLower)) ||
        user.uid.toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsers(filtered);
  }, [users, filters.role, filters.search, filters.status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const getUserDetails = async (uid) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = await user.getIdToken?.();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/superadmin/users/${uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedUser(result.data);
        setShowUserModal(true);
      } else {
        console.error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const updateUserRole = async (uid, newRole) => {
    try {
      setActionLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = await user.getIdToken?.();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/superadmin/users/${uid}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.uid === uid ? { ...u, role: newRole } : u
        ));
        if (selectedUser && selectedUser.uid === uid) {
          setSelectedUser(prev => ({ ...prev, role: newRole }));
        }
        alert(`User role updated to ${newRole} successfully`);
      } else {
        const error = await response.json();
        alert(`Failed to update role: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserStatus = async (uid, currentlyDisabled) => {
    try {
      setActionLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = await user.getIdToken?.();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/superadmin/users/${uid}/disable`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ disabled: !currentlyDisabled })
      });

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.uid === uid ? { ...u, disabled: !currentlyDisabled } : u
        ));
        if (selectedUser && selectedUser.uid === uid) {
          setSelectedUser(prev => ({ ...prev, disabled: !currentlyDisabled }));
        }
        alert(`User ${!currentlyDisabled ? 'disabled' : 'enabled'} successfully`);
      } else {
        const error = await response.json();
        alert(`Failed to update user status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'superadmin': return '👑';
      case 'pet_company': return '🏢';
      case 'pet_owner': return '🐾';
      default: return '👤';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'superadmin': return 'role-superadmin';
      case 'pet_company': return 'role-company';
      case 'pet_owner': return 'role-owner';
      default: return 'role-default';
    }
  };

  const getStatusBadgeClass = (user) => {
    if (user.disabled) return 'status-disabled';
    if (!user.emailVerified) return 'status-unverified';
    return 'status-active';
  };

  const getStatusText = (user) => {
    if (user.disabled) return 'Disabled';
    if (!user.emailVerified) return 'Unverified';
    return 'Active';
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Header */}
      <div className="user-management-header">
        <div className="header-info">
          <h2>User Management</h2>
          <p>Manage all platform users, roles, and permissions</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">{users.length}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{users.filter(u => !u.disabled).length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{users.filter(u => u.disabled).length}</span>
            <span className="stat-label">Disabled</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="user-filters">
        <div className="filter-group">
          <label>Search Users</label>
          <input
            type="text"
            placeholder="Search by email, name, or ID..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label>Role</label>
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="pet_owner">Pet Owners</option>
            <option value="pet_company">Pet Companies</option>
            <option value="superadmin">Super Admins</option>
          </select>
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
            <option value="disabled">Disabled</option>
            <option value="verified">Email Verified</option>
            <option value="unverified">Email Unverified</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Show</label>
          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="filter-select"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.uid} className="user-row">
                <td className="user-info">
                  <div className="user-avatar">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" />
                    ) : (
                      <span>{(user.displayName || user.email).charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      {user.displayName || 'No Display Name'}
                    </div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-id">ID: {user.uid.substring(0, 8)}...</div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    <span className="role-icon">{getRoleIcon(user.role)}</span>
                    {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(user)}`}>
                    {getStatusText(user)}
                  </span>
                  {user.emailVerified && (
                    <span className="verified-icon" title="Email Verified">✅</span>
                  )}
                </td>
                <td className="date-cell">
                  {user.lastSignInTime ? formatDate(user.lastSignInTime) : 'Never'}
                </td>
                <td className="date-cell">
                  {formatDate(user.creationTime)}
                </td>
                <td className="actions-cell">
                  <button
                    className="action-btn view"
                    onClick={() => getUserDetails(user.uid)}
                    title="View Details"
                  >
                    👁️
                  </button>
                  <select
                    className="role-selector"
                    value={user.role}
                    onChange={(e) => updateUserRole(user.uid, e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="pet_owner">Pet Owner</option>
                    <option value="pet_company">Pet Company</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                  <button
                    className={`action-btn ${user.disabled ? 'enable' : 'disable'}`}
                    onClick={() => toggleUserStatus(user.uid, user.disabled)}
                    disabled={actionLoading}
                    title={user.disabled ? 'Enable User' : 'Disable User'}
                  >
                    {user.disabled ? '✅' : '❌'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="no-users">
            <div className="no-users-icon">🔍</div>
            <h3>No Users Found</h3>
            <p>Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>

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
            <span className="total-count">({pagination.totalUsers} total users)</span>
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

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button 
                className="close-btn"
                onClick={() => setShowUserModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="user-profile">
                <div className="profile-avatar">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt="Avatar" />
                  ) : (
                    <span>{(selectedUser.displayName || selectedUser.email).charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="profile-info">
                  <h4>{selectedUser.displayName || 'No Display Name'}</h4>
                  <p>{selectedUser.email}</p>
                  <span className={`role-badge ${getRoleBadgeClass(selectedUser.role)}`}>
                    <span className="role-icon">{getRoleIcon(selectedUser.role)}</span>
                    {selectedUser.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>

              <div className="user-details-grid">
                <div className="detail-item">
                  <label>User ID</label>
                  <span>{selectedUser.uid}</span>
                </div>
                <div className="detail-item">
                  <label>Phone Number</label>
                  <span>{selectedUser.phoneNumber || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <label>Email Verified</label>
                  <span className={selectedUser.emailVerified ? 'verified' : 'unverified'}>
                    {selectedUser.emailVerified ? '✅ Verified' : '❌ Unverified'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Account Status</label>
                  <span className={selectedUser.disabled ? 'disabled' : 'active'}>
                    {selectedUser.disabled ? '❌ Disabled' : '✅ Active'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Created At</label>
                  <span>{formatDate(selectedUser.creationTime)}</span>
                </div>
                <div className="detail-item">
                  <label>Last Sign In</label>
                  <span>{selectedUser.lastSignInTime ? formatDate(selectedUser.lastSignInTime) : 'Never'}</span>
                </div>
              </div>

              <div className="modal-actions">
                <select
                  className="role-selector large"
                  value={selectedUser.role}
                  onChange={(e) => updateUserRole(selectedUser.uid, e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="pet_owner">Pet Owner</option>
                  <option value="pet_company">Pet Company</option>
                  <option value="superadmin">Super Admin</option>
                </select>
                
                <button
                  className={`action-btn large ${selectedUser.disabled ? 'enable' : 'disable'}`}
                  onClick={() => toggleUserStatus(selectedUser.uid, selectedUser.disabled)}
                  disabled={actionLoading}
                >
                  {selectedUser.disabled ? '✅ Enable User' : '❌ Disable User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 