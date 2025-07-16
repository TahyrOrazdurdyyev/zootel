import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedApiCall } from '../../utils/api';
import './CustomerManagement.css';

const CustomerManagement = () => {
  const { currentUser } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Form states
  const [formLoading, setFormLoading] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const customersPerPage = 10;

  const fetchCustomers = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: customersPerPage,
        sortBy,
        sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await authenticatedApiCall(currentUser, `/api/customers?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data);
        setFilteredCustomers(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentPage, sortBy, sortOrder, statusFilter, searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerClick = async (customer) => {
    try {
      const response = await authenticatedApiCall(currentUser, `/api/customers/${customer.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedCustomer(data.data);
        setShowCustomerModal(true);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedCustomer) return;

    try {
      setFormLoading(true);
      const response = await authenticatedApiCall(currentUser, `/api/customers/${selectedCustomer.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCustomer(prev => ({
          ...prev,
          notes: data.data.notes
        }));
        setNewNote('');
        setShowNotesModal(false);
        fetchCustomers(); // Refresh the list
      } else {
        throw new Error('Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      setError('Failed to add note');
    } finally {
      setFormLoading(false);
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

  if (loading) {
    return (
      <div className="customer-loading">
        <div className="loading-spinner"></div>
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="customer-management">
      <div className="customer-header">
        <div className="header-content">
          <h2>Customer Management</h2>
          <p>Manage your customer relationships and track interactions</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="customer-controls">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="sort-section">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Name</option>
            <option value="joinDate">Join Date</option>
            <option value="lastBooking">Last Booking</option>
            <option value="totalSpent">Total Spent</option>
          </select>
          
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="customer-list">
        {filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No customers found</h3>
            <p>No customers match your current filters.</p>
          </div>
        ) : (
          <>
            <div className="customer-grid">
              {filteredCustomers.map((customer) => (
                <div 
                  key={customer.id} 
                  className="customer-card"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <div className="customer-avatar">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="customer-info">
                    <h3 className="customer-name">{customer.name}</h3>
                    <p className="customer-email">{customer.email}</p>
                    <p className="customer-phone">{customer.phone}</p>
                  </div>
                  
                  <div className="customer-stats">
                    <div className="stat">
                      <span className="stat-value">{customer.totalBookings}</span>
                      <span className="stat-label">Bookings</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{formatCurrency(customer.totalSpent)}</span>
                      <span className="stat-label">Spent</span>
                    </div>
                  </div>
                  
                  <div className="customer-meta">
                    <span className={`status-badge ${customer.status}`}>
                      {customer.status}
                    </span>
                    <span className="last-booking">
                      Last: {formatDate(customer.lastBooking)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                
                <span className="pagination-info">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                
                <button 
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Details Modal */}
      {showCustomerModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Customer Details</h3>
              <button 
                onClick={() => setShowCustomerModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="customer-details">
                <div className="detail-section">
                  <h4>Contact Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedCustomer.name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="detail-item">
                      <label>Phone:</label>
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="detail-item">
                      <label>Address:</label>
                      <span>{selectedCustomer.address}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Emergency Contact</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedCustomer.emergencyContact?.name || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Phone:</label>
                      <span>{selectedCustomer.emergencyContact?.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Relationship:</label>
                      <span>{selectedCustomer.emergencyContact?.relationship || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Pets</h4>
                  <div className="pets-list">
                    {selectedCustomer.pets?.map((pet, index) => (
                      <div key={index} className="pet-item">
                        <div className="pet-info">
                          <h5>{pet.name}</h5>
                          <p>{pet.breed} • {pet.age} • {pet.weight}</p>
                          {pet.notes && <p className="pet-notes">{pet.notes}</p>}
                        </div>
                      </div>
                    )) || <p>No pets registered</p>}
                  </div>
                </div>

                <div className="detail-section">
                  <div className="section-header">
                    <h4>Notes</h4>
                    <button 
                      onClick={() => setShowNotesModal(true)}
                      className="add-note-btn"
                    >
                      Add Note
                    </button>
                  </div>
                  <div className="notes-content">
                    {selectedCustomer.notes ? (
                      <pre className="notes-text">{selectedCustomer.notes}</pre>
                    ) : (
                      <p className="no-notes">No notes available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNotesModal && (
        <div className="modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Note</h3>
              <button 
                onClick={() => setShowNotesModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Note:</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note..."
                  rows={4}
                  className="note-textarea"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setShowNotesModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddNote}
                disabled={!newNote.trim() || formLoading}
                className="btn btn-primary"
              >
                {formLoading ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement; 