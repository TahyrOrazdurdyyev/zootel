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
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Statistics
  const [stats, setStats] = useState(null);

  // Available options
  const [roles, setRoles] = useState([]);
  const [skills, setSkills] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    skills: [],
    specializations: [],
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '', end: '', available: false },
      sunday: { start: '', end: '', available: false }
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
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
        const rolesResponse = await fetch(`${baseUrl}/api/employees/roles/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          console.log('Roles fetched successfully:', rolesData);
          setRoles(rolesData.data || []);
        } else {
          const errorText = await rolesResponse.text();
          console.error('Roles fetch failed:', rolesResponse.status, errorText);
        }
      } catch (rolesError) {
        console.error('Error fetching roles:', rolesError);
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
      filtered = filtered.filter(employee => employee.status === statusFilter);
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(employee => 
        employee.role.toLowerCase().includes(roleFilter.toLowerCase())
      );
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchLower) ||
        employee.email.toLowerCase().includes(searchLower) ||
        employee.role.toLowerCase().includes(searchLower)
      );
    }

    setFilteredEmployees(filtered);
  }, [employees, statusFilter, roleFilter, searchTerm]);

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
      role: '',
      skills: [],
      specializations: [],
      availability: {
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '17:00', available: true },
        saturday: { start: '', end: '', available: false },
        sunday: { start: '', end: '', available: false }
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
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
      role: employee.role,
      skills: employee.skills || [],
      specializations: employee.specializations || [],
      availability: employee.availability || formData.availability,
      emergencyContact: employee.emergencyContact || formData.emergencyContact,
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

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
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
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
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
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Roles</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Employee Cards */}
              <div className="employees-grid">
                {filteredEmployees.map(employee => (
                  <div key={employee.id} className="employee-card">
                    <div className="employee-avatar">
                      <img 
                        src={employee.profileImage} 
                        alt={employee.name}
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/150?text=${employee.name.split(' ').map(n => n[0]).join('')}`;
                        }}
                      />
                      <div className={`status-indicator ${employee.status}`}></div>
                    </div>

                    <div className="employee-info">
                      <h3 className="employee-name">{employee.name}</h3>
                      <p className="employee-role">{employee.role}</p>
                      <p className="employee-contact">{employee.email}</p>
                      
                      <div className="employee-meta">
                        <span className={`status-badge ${getStatusBadgeClass(employee.status)}`}>
                          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                        </span>
                        <span className="hire-date">
                          Hired: {formatDate(employee.hireDate)}
                        </span>
                      </div>

                      {employee.performance && (
                        <div className="performance-summary">
                          <div className="performance-item">
                            <span className="perf-label">Rating:</span>
                            <span className="perf-value">⭐ {employee.performance.rating}</span>
                          </div>
                          <div className="performance-item">
                            <span className="perf-label">Completed:</span>
                            <span className="perf-value">{employee.performance.completedAppointments}</span>
                          </div>
                        </div>
                      )}

                      <div className="employee-skills">
                        {employee.skills?.slice(0, 3).map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))}
                        {employee.skills?.length > 3 && (
                          <span className="skill-tag more">+{employee.skills.length - 3}</span>
                        )}
                      </div>
                    </div>

                    <div className="employee-actions">
                      <button 
                        className="action-btn edit"
                        onClick={() => handleEdit(employee)}
                        title="Edit Employee"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-btn assign"
                        onClick={() => setSelectedEmployee(employee)}
                        title="Assign to Appointment"
                      >
                        📋
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(employee)}
                        title="Remove Employee"
                      >
                        🗑️
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
                          <p>{employee.role}</p>
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
                              {employee.availability?.[day.key]?.available ? (
                                <span className="hours-text">
                                  {employee.availability[day.key].start} - {employee.availability[day.key].end}
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
                        <label>Role *</label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={(e) => handleInputChange('role', e.target.value)}
                          required={showAddModal || showEditModal}
                        >
                          <option value="">Select Role</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.name}>{role.name}</option>
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
                                checked={formData.availability[day.key]?.available || false}
                                onChange={(e) => handleAvailabilityChange(day.key, 'available', e.target.checked)}
                              />
                              <span className="day-name">{day.label}</span>
                            </label>
                          </div>
                          
                          {formData.availability[day.key]?.available && (
                            <div className="time-inputs">
                              <input
                                type="time"
                                value={formData.availability[day.key]?.start || '09:00'}
                                onChange={(e) => handleAvailabilityChange(day.key, 'start', e.target.value)}
                              />
                              <span>to</span>
                              <input
                                type="time"
                                value={formData.availability[day.key]?.end || '17:00'}
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
                          value={formData.emergencyContact.name}
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
                          value={formData.emergencyContact.phone}
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