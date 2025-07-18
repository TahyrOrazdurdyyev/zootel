import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import FeatureGate, { UsageLimitGate } from '../FeatureGate';
import './EmployeeManagement.css';

const EmployeeManagement = () => {
  const { currentUser } = useAuth();
  const { getFeatureLimit } = useSubscription();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('list');

  // Modals and forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Statistics
  const [stats, setStats] = useState(null);

  // Available options
  const [positions, setPositions] = useState([]);
  const [skills, setSkills] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    skills: [],
    workingHours: {},
    emergencyContact: {
      name: '',
      phone: ''
    },
    notes: ''
  });

  const tabs = [
    { id: 'list', name: 'Employee List', icon: '📋' },
    { id: 'stats', name: 'Performance', icon: '📊' },
    { id: 'schedule', name: 'Schedules', icon: '📅' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Employees', color: '#6c757d' },
    { value: 'active', label: 'Active', color: '#28a745' },
    { value: 'inactive', label: 'Inactive', color: '#dc3545' },
    { value: 'on_leave', label: 'On Leave', color: '#ffc107' }
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const maxEmployees = getFeatureLimit('maxEmployees');

  const clearModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteConfirm(false);
    setSelectedEmployee(null);
    setError('');
    setSuccess('');
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const baseUrl = import.meta.env.VITE_API_URL || 'https://zootel.shop';
      const response = await fetch(`${baseUrl}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data || []);
      } else {
        setError('Failed to load employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Error loading employees');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchEmployeeOptions = useCallback(async () => {
    if (!currentUser) {
      console.log('No current user, skipping employee options fetch');
      return;
    }
    
    try {
      const token = await currentUser.getIdToken();
      const baseUrl = import.meta.env.VITE_API_URL || 'https://zootel.shop';
      
      console.log('Fetching employee options with token:', token ? 'Present' : 'Missing');
      
      // Fetch roles and skills separately with individual error handling
      try {
        const positionsResponse = await fetch(`${baseUrl}/api/employees/positions/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json();
          console.log('Positions fetched successfully:', positionsData);
          setPositions(positionsData.data || []);
        } else {
          const errorText = await positionsResponse.text();
          console.error('Positions fetch failed:', positionsResponse.status, errorText);
        }
      } catch (positionsError) {
        console.error('Error fetching positions:', positionsError);
      }

      try {
        const skillsResponse = await fetch(`${baseUrl}/api/employees/skills/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          console.log('Skills fetched successfully:', skillsData);
          setSkills(skillsData.data || []);
        } else {
          const errorText = await skillsResponse.text();
          console.error('Skills fetch failed:', skillsResponse.status, errorText);
        }
      } catch (skillsError) {
        console.error('Error fetching skills:', skillsError);
      }
      
    } catch (error) {
      console.error('Error in fetchEmployeeOptions:', error);
    }
  }, [currentUser]);

  const fetchStats = useCallback(async () => {
    if (!currentUser) {
      console.log('No current user, skipping stats fetch');
      return;
    }
    
    try {
      const token = await currentUser.getIdToken();
      const baseUrl = import.meta.env.VITE_API_URL || 'https://zootel.shop';
      const response = await fetch(`${baseUrl}/api/employees/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        const errorText = await response.text();
        console.error('Stats fetch failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    }
  }, [currentUser]);

  const filterEmployees = useCallback(() => {
    let filtered = employees;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(employee => (employee.status || 'inactive') === statusFilter);
    }

    // Filter by position
    if (positionFilter !== 'all') {
      filtered = filtered.filter(employee => 
        (employee.position || '').toLowerCase().includes(positionFilter.toLowerCase())
      );
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(employee =>
        (employee.name || '').toLowerCase().includes(searchLower) ||
        (employee.email || '').toLowerCase().includes(searchLower) ||
        (employee.position || '').toLowerCase().includes(searchLower)
      );
    }

    setFilteredEmployees(filtered);
  }, [employees, statusFilter, positionFilter, searchTerm]);

  useEffect(() => {
    if (currentUser) {
      console.log('User authenticated, fetching employee data');
      fetchEmployees();
      fetchEmployeeOptions();
      fetchStats();
    } else {
      console.log('No user authenticated, waiting...');
    }
  }, [currentUser, fetchEmployees, fetchEmployeeOptions, fetchStats]);

  useEffect(() => {
    filterEmployees();
  }, [filterEmployees]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      skills: [],
      workingHours: {},
      emergencyContact: {
        name: '',
        phone: ''
      },
      notes: ''
    });
  };

  const handleAdd = () => {
    resetForm();
    setSelectedEmployee(null);
    setShowAddModal(true);
  };

  const handleEdit = (employee) => {
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      skills: employee.specialties || employee.skills || [], // Map specialties to skills for frontend
      workingHours: employee.workingHours || {},
      emergencyContact: employee.emergencyContact || {
        name: '',
        phone: ''
      },
      notes: employee.notes || ''
    });
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDelete = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteConfirm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = await currentUser.getIdToken();
      const baseUrl = import.meta.env.VITE_API_URL || 'https://zootel.shop';
      
      const url = selectedEmployee 
        ? `${baseUrl}/api/employees/${selectedEmployee.id}`
        : `${baseUrl}/api/employees`;
      
      const method = selectedEmployee ? 'PUT' : 'POST';

      // Map frontend field names to backend field names
      const backendData = {
        ...formData,
        specialties: formData.skills, // Map skills to specialties for backend
      };
      delete backendData.skills; // Remove the frontend field

      console.log('Employee save data being sent:', backendData);
      console.log('FormData skills:', formData.skills);
      console.log('FormData workingHours:', formData.workingHours);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendData)
      });

      if (response.ok) {
        await fetchEmployees();
        await fetchStats();
        setSuccess(selectedEmployee ? 'Employee updated successfully!' : 'Employee added successfully!');
        clearModals();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save employee');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      setError('Error saving employee');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    setFormLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const baseUrl = import.meta.env.VITE_API_URL || 'https://zootel.shop';
      const response = await fetch(`${baseUrl}/api/employees/${selectedEmployee.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchEmployees();
        await fetchStats();
        setSuccess('Employee removed successfully!');
        clearModals();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to remove employee');
      }
    } catch (error) {
      console.error('Error removing employee:', error);
      setError('Error removing employee');
    } finally {
      setFormLoading(false);
    }
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteConfirm(false);
    setSelectedEmployee(null);
    setError('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'on_leave': return 'status-leave';
      default: return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="employee-loading">
        <div className="loading-spinner"></div>
        <p>Loading employees...</p>
      </div>
    );
  }

  return (
    <FeatureGate
      feature="employeeManagement"
      fallback={
        <div className="feature-locked">
          <div className="lock-icon">🔒</div>
          <h3>Employee Management</h3>
          <p>Upgrade your plan to manage employees, assign tasks, and track performance</p>
          <button className="upgrade-btn">Upgrade Now</button>
        </div>
      }
    >
      <div className="employee-management">
        <div className="employee-header">
          <div className="header-info">
            <h2>Employee Management</h2>
            <p>Manage your team, track performance, and assign appointments</p>
          </div>

          <div className="header-actions">
            <UsageLimitGate
              feature="maxEmployees"
              currentUsage={employees.length}
              fallback={
                <button className="add-btn disabled" disabled>
                  Employee Limit Reached ({employees.length}/{maxEmployees})
                </button>
              }
            >
              <button className="add-btn" onClick={handleAdd}>
                <span className="btn-icon">➕</span>
                Add Employee
              </button>
            </UsageLimitGate>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="employee-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="employee-content">
          {activeTab === 'list' && (
            <div className="employee-list-tab">
              {/* Filters */}
              <div className="employee-controls">
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <span className="search-icon">🔍</span>
                </div>

                <div className="filter-row">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Positions</option>
                    {positions.map(position => (
                      <option key={position.id} value={position.name}>{position.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modern Employee Cards */}
              <div className="employees-grid modern-grid">
                {filteredEmployees.map(employee => (
                  <div key={employee.id} className="employee-card modern-employee-card">
                    <div className="card-border-accent"></div>
                    
                    <div className="employee-header">
                      <div className="employee-avatar-section">
                        <div className={`employee-avatar modern-avatar ${employee.status || 'inactive'}`}>
                          <span className="avatar-initials">
                            {(employee.name || 'Employee').split(' ').map(n => n[0] || '').join('').slice(0, 2).toUpperCase()}
                          </span>
                          <div className={`status-indicator ${employee.status || 'inactive'}`}></div>
                        </div>
                        <div className="employee-basic-info">
                          <h3 className="employee-name">{employee.name || 'No Name'}</h3>
                          <p className="employee-role">{employee.position || 'No Position'}</p>
                          <div className={`status-badge modern-status ${getStatusBadgeClass(employee.status || 'inactive')}`}>
                            <span className="status-icon">
                              {employee.status === 'active' ? '✅' : employee.status === 'on_leave' ? '🏖️' : '⏸️'}
                            </span>
                            <span className="status-text">
                              {(employee.status || 'inactive').charAt(0).toUpperCase() + (employee.status || 'inactive').slice(1).replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="employee-content">
                      <div className="contact-section">
                        <div className="contact-item">
                          <div className="contact-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                              <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </div>
                          <span className="contact-text">{employee.email || 'No Email'}</span>
                        </div>
                        
                        {employee.phone && (
                          <div className="contact-item">
                            <div className="contact-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M22 16.92V19.92C22 20.92 21.11 21.92 19.95 21.92C8.91 21.92 2 14.92 2 3.92C2 2.76 3 1.92 4 1.92H7C8.1 1.92 9 2.82 9 3.92V6.92C9 7.92 8.1 8.92 7 8.92H5C5 12.92 8.13 16.92 12 16.92V14.92C12 13.82 12.9 12.92 14 12.92H17C18.1 12.92 19 13.82 19 14.92V16.92H22Z" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </div>
                            <span className="contact-text">{employee.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="employee-details">
                        <div className="detail-item">
                          <div className="detail-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </div>
                          <div className="detail-content">
                            <span className="detail-label">Hired</span>
                            <span className="detail-value">{formatDate(employee.hireDate || employee.createdAt)}</span>
                          </div>
                        </div>

                        {employee.performance && (
                          <div className="performance-section">
                            <div className="performance-grid">
                              <div className="perf-item">
                                <div className="perf-icon">⭐</div>
                                <div className="perf-content">
                                  <span className="perf-label">Rating</span>
                                  <span className="perf-value">{employee.performance.rating || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="perf-item">
                                <div className="perf-icon">✅</div>
                                <div className="perf-content">
                                  <span className="perf-label">Completed</span>
                                  <span className="perf-value">{employee.performance.completedAppointments || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {employee.skills?.length > 0 && (
                          <div className="skills-section">
                            <div className="skills-header">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <polygon points="12 2 15.09 8.26 22 9 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9 8.91 8.26 12 2" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              <span>Skills</span>
                            </div>
                            <div className="employee-skills">
                              {employee.skills.slice(0, 3).map((skill, index) => (
                                <span key={index} className="skill-tag modern-skill">{skill}</span>
                              ))}
                              {employee.skills.length > 3 && (
                                <span className="skill-tag modern-skill more">+{employee.skills.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="employee-actions modern-actions">
                      <button 
                        className="action-btn edit-action"
                        onClick={() => handleEdit(employee)}
                        title="Edit Employee"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H16C17.1 20 18 19.1 18 18V13" stroke="currentColor" strokeWidth="2"/>
                          <path d="M18.5 2.5C19.3 1.7 20.7 1.7 21.5 2.5C22.3 3.3 22.3 4.7 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Edit
                      </button>
                      <button 
                        className="action-btn assign-action"
                        onClick={() => setSelectedEmployee(employee)}
                        title="Assign to Appointment"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                          <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Assign
                      </button>
                      <button 
                        className="action-btn delete-action"
                        onClick={() => handleDelete(employee)}
                        title="Remove Employee"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2"/>
                          <path d="M19 6V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6" stroke="currentColor" strokeWidth="2"/>
                          <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2"/>
                          <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredEmployees.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h3>No employees found</h3>
                  <p>
                    {employees.length === 0 
                      ? "Start by adding your first team member"
                      : "Try adjusting your search or filters"
                    }
                  </p>
                  {employees.length === 0 && (
                    <button className="add-btn" onClick={handleAdd}>
                      Add First Employee
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="stats-tab">
              {stats && (
                <div className="stats-overview">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">👥</div>
                      <div className="stat-content">
                        <div className="stat-value">{stats.totalEmployees}</div>
                        <div className="stat-label">Total Employees</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">✅</div>
                      <div className="stat-content">
                        <div className="stat-value">{stats.activeEmployees}</div>
                        <div className="stat-label">Active</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">⭐</div>
                      <div className="stat-content">
                        <div className="stat-value">{stats.averageRating}</div>
                        <div className="stat-label">Avg Rating</div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">📅</div>
                      <div className="stat-content">
                        <div className="stat-value">{stats.totalCompletedAppointments}</div>
                        <div className="stat-label">Completed</div>
                      </div>
                    </div>
                  </div>

                  {stats.topPerformers?.length > 0 && (
                    <div className="top-performers">
                      <h3>Top Performers</h3>
                      <div className="performers-list">
                        {stats.topPerformers.map((performer, index) => (
                          <div key={performer.id} className="performer-item">
                            <div className="performer-rank">#{index + 1}</div>
                            <div className="performer-info">
                              <div className="performer-name">{performer.name}</div>
                              <div className="performer-role">{performer.role}</div>
                            </div>
                            <div className="performer-stats">
                              <div className="performer-rating">⭐ {performer.rating}</div>
                              <div className="performer-completed">{performer.completedAppointments} jobs</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="schedule-tab">
              <div className="schedule-overview">
                <h3>Employee Schedules</h3>
                <p>View and manage employee availability</p>
                
                <div className="schedule-grid">
                  {filteredEmployees.map(employee => (
                    <div key={employee.id} className="schedule-card">
                      <div className="schedule-header">
                        <div className="employee-info">
                          <h4>{employee.name}</h4>
                          <p>{employee.position}</p>
                        </div>
                        <div className={`status-badge ${getStatusBadgeClass(employee.status)}`}>
                          {employee.status}
                        </div>
                      </div>
                      
                      <div className="schedule-days">
                        {daysOfWeek.map(day => (
                          <div key={day.key} className="schedule-day">
                            <div className="day-name">{day.label.slice(0, 3)}</div>
                            <div className="day-hours">
                              {employee.workingHours?.[day.key]?.available ? (
                                <span className="hours-text">
                                  {employee.workingHours[day.key].start} - {employee.workingHours[day.key].end}
                                </span>
                              ) : (
                                <span className="hours-off">Off</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal employee-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
                <button className="close-btn" onClick={closeModals}>×</button>
              </div>

              <form onSubmit={handleSave} className="modal-content">
                <div className="form-sections">
                  {/* Basic Info */}
                  <div className="form-section">
                    <h4>Basic Information</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required={showAddModal || showEditModal}
                        />
                      </div>

                      <div className="form-group">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required={showAddModal || showEditModal}
                        />
                      </div>

                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          required={showAddModal || showEditModal}
                        />
                      </div>

                      <div className="form-group">
                        <label>Position *</label>
                        <select
                          name="position"
                          value={formData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          required={showAddModal || showEditModal}
                        >
                          <option value="">Select Position</option>
                          {positions.map(position => (
                            <option key={position.id} value={position.name}>{position.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="form-section">
                    <h4>Skills & Specializations</h4>
                    <div className="skills-grid">
                      {skills.map(skill => (
                        <label key={skill.id} className="skill-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.skills.includes(skill.name)}
                            onChange={() => handleSkillToggle(skill.name)}
                          />
                          <span className="skill-name">{skill.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="form-section">
                    <h4>Availability</h4>
                    <div className="availability-grid">
                      {daysOfWeek.map(day => (
                        <div key={day.key} className="availability-row">
                          <div className="day-control">
                            <label className="day-checkbox">
                              <input
                                type="checkbox"
                                checked={formData.workingHours[day.key]?.available || false}
                                onChange={(e) => handleAvailabilityChange(day.key, 'available', e.target.checked)}
                              />
                              <span className="day-name">{day.label}</span>
                            </label>
                          </div>
                          
                          {formData.workingHours[day.key]?.available && (
                            <div className="time-inputs">
                              <input
                                type="time"
                                value={formData.workingHours[day.key]?.start || '09:00'}
                                onChange={(e) => handleAvailabilityChange(day.key, 'start', e.target.value)}
                              />
                              <span>to</span>
                              <input
                                type="time"
                                value={formData.workingHours[day.key]?.end || '17:00'}
                                onChange={(e) => handleAvailabilityChange(day.key, 'end', e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Contact & Notes */}
                  <div className="form-section">
                    <h4>Additional Information</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Emergency Contact Name</label>
                        <input
                          type="text"
                          value={formData.emergencyContact?.name}
                          onChange={(e) => handleInputChange('emergencyContact', {
                            ...formData.emergencyContact,
                            name: e.target.value
                          })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Emergency Contact Phone</label>
                        <input
                          type="tel"
                          value={formData.emergencyContact?.phone}
                          onChange={(e) => handleInputChange('emergencyContact', {
                            ...formData.emergencyContact,
                            phone: e.target.value
                          })}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label>Notes</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          rows="3"
                          placeholder="Additional notes about the employee..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={closeModals}>
                    Cancel
                  </button>
                  <button type="submit" className="save-btn" disabled={formLoading}>
                    {formLoading ? 'Saving...' : (selectedEmployee ? 'Update Employee' : 'Add Employee')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedEmployee && (
          <div className="modal-overlay" onClick={closeModals}>
            <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Confirm Deletion</h3>
                <button className="close-btn" onClick={closeModals}>×</button>
              </div>

              <div className="modal-content">
                <div className="confirm-message">
                  <div className="warning-icon">⚠️</div>
                  <p>Are you sure you want to remove <strong>{selectedEmployee.name}</strong> from your team?</p>
                  <p className="warning-text">This action cannot be undone.</p>
                </div>

                <div className="modal-actions">
                  <button className="cancel-btn" onClick={closeModals}>
                    Cancel
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={confirmDelete}
                    disabled={formLoading}
                  >
                    {formLoading ? 'Removing...' : 'Remove Employee'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

export default EmployeeManagement; 