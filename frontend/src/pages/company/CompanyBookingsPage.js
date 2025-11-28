import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const CompanyBookingsPage = () => {
  const { apiCall } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Booking statuses with colors and icons
  const statusConfig = {
    pending: { 
      label: 'Pending', 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: ClockIcon,
      actions: ['confirmed', 'cancelled', 'rejected']
    },
    confirmed: { 
      label: 'Confirmed', 
      color: 'bg-blue-100 text-blue-800', 
      icon: CheckCircleIcon,
      actions: ['in_progress', 'cancelled', 'rescheduled']
    },
    in_progress: { 
      label: 'In Progress', 
      color: 'bg-purple-100 text-purple-800', 
      icon: ClockIcon,
      actions: ['completed', 'cancelled']
    },
    completed: { 
      label: 'Completed', 
      color: 'bg-green-100 text-green-800', 
      icon: CheckCircleIcon,
      actions: []
    },
    cancelled: { 
      label: 'Cancelled', 
      color: 'bg-red-100 text-red-800', 
      icon: XCircleIcon,
      actions: []
    },
    rejected: { 
      label: 'Rejected', 
      color: 'bg-gray-100 text-gray-800', 
      icon: ExclamationTriangleIcon,
      actions: []
    },
    rescheduled: { 
      label: 'Rescheduled', 
      color: 'bg-orange-100 text-orange-800', 
      icon: CalendarDaysIcon,
      actions: ['confirmed', 'cancelled']
    }
  };

  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'past', label: 'Past Bookings' }
  ];

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, dateFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      // Add date filtering
      const now = new Date();
      let startDate, endDate;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'tomorrow':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'week':
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case 'past':
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
      }
      
      if (startDate) {
        params.append('start_date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        params.append('end_date', endDate.toISOString().split('T')[0]);
      }

      const queryString = params.toString();
      const endpoint = `/companies/bookings${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiCall(endpoint);
      
      if (response.success) {
        setBookings(response.bookings || response.data || []);
      } else {
        console.error('Failed to fetch bookings:', response);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus, notes = '') => {
    try {
      setUpdating(true);
      
      const response = await apiCall(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          notes: notes
        })
      });

      if (response.success) {
        // Refresh bookings list
        await fetchBookings();
        
        // Update selected booking if it's open
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking({
            ...selectedBooking,
            status: newStatus,
            notes: notes || selectedBooking.notes
          });
        }

        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successDiv.textContent = `Booking status updated to ${statusConfig[newStatus]?.label}`;
        document.body.appendChild(successDiv);
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 3000);
      } else {
        throw new Error(response.message || 'Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'Failed to update booking status';
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 3000);
    } finally {
      setUpdating(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.client_name?.toLowerCase().includes(searchLower) ||
      booking.service_name?.toLowerCase().includes(searchLower) ||
      booking.employee_name?.toLowerCase().includes(searchLower) ||
      booking.customer_info?.email?.toLowerCase().includes(searchLower) ||
      booking.customer_info?.phone?.includes(searchTerm) ||
      booking.id?.toLowerCase().includes(searchLower)
    );
  });

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusCounts = () => {
    const counts = {};
    Object.keys(statusConfig).forEach(status => {
      counts[status] = bookings.filter(b => b.status === status).length;
    });
    counts.all = bookings.length;
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-gray-600">Manage and track all your bookings</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Total: </span>
            <span className="font-semibold text-gray-900">{bookings.length}</span>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-lg border text-center transition-colors ${
            statusFilter === 'all' 
              ? 'border-orange-500 bg-orange-50 text-orange-700' 
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <div className="text-lg font-semibold">{statusCounts.all}</div>
          <div className="text-xs text-gray-600">All</div>
        </button>
        
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`p-3 rounded-lg border text-center transition-colors ${
              statusFilter === status 
                ? 'border-orange-500 bg-orange-50 text-orange-700' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="text-lg font-semibold">{statusCounts[status] || 0}</div>
            <div className="text-xs text-gray-600">{config.label}</div>
          </button>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client name, service, employee, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {dateFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No bookings have been made yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client & Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => {
                  const dateTime = formatDateTime(booking.date_time);
                  const status = statusConfig[booking.status] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.client_name || `${booking.customer_info?.first_name} ${booking.customer_info?.last_name}` || 'Unknown Client'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.service_name || 'Unknown Service'}
                            </div>
                            {booking.pet_info?.pet_name && (
                              <div className="text-xs text-gray-400">
                                Pet: {booking.pet_info.pet_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{dateTime.date}</div>
                        <div className="text-sm text-gray-500">{dateTime.time}</div>
                        <div className="text-xs text-gray-400">{booking.duration} min</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking.employee_name || 'Not assigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(booking.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          {status.actions.length > 0 && (
                            <div className="relative group">
                              <button className="text-blue-600 hover:text-blue-900">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <div className="absolute right-0 top-6 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <div className="py-1">
                                  {status.actions.map(action => (
                                    <button
                                      key={action}
                                      onClick={() => updateBookingStatus(booking.id, action)}
                                      disabled={updating}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                      Mark as {statusConfig[action]?.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedBooking.status]?.color}`}>
                    {React.createElement(statusConfig[selectedBooking.status]?.icon, { className: "h-4 w-4 mr-1" })}
                    {statusConfig[selectedBooking.status]?.label}
                  </span>
                </div>
                
                {statusConfig[selectedBooking.status]?.actions.length > 0 && (
                  <div className="flex space-x-2">
                    {statusConfig[selectedBooking.status].actions.map(action => (
                      <button
                        key={action}
                        onClick={() => updateBookingStatus(selectedBooking.id, action)}
                        disabled={updating}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {statusConfig[action]?.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Booking Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Booking Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Service:</span> {selectedBooking.service_name}</div>
                    <div><span className="text-gray-600">Date:</span> {formatDateTime(selectedBooking.date_time).date}</div>
                    <div><span className="text-gray-600">Time:</span> {formatDateTime(selectedBooking.date_time).time}</div>
                    <div><span className="text-gray-600">Duration:</span> {selectedBooking.duration} minutes</div>
                    <div><span className="text-gray-600">Price:</span> {formatCurrency(selectedBooking.price)}</div>
                    <div><span className="text-gray-600">Employee:</span> {selectedBooking.employee_name || 'Not assigned'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      {selectedBooking.client_name || `${selectedBooking.customer_info?.first_name} ${selectedBooking.customer_info?.last_name}`}
                    </div>
                    {selectedBooking.customer_info?.email && (
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {selectedBooking.customer_info.email}
                      </div>
                    )}
                    {selectedBooking.customer_info?.phone && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {selectedBooking.customer_info.phone}
                      </div>
                    )}
                    {selectedBooking.customer_info?.address && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {selectedBooking.customer_info.address}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pet Information */}
              {selectedBooking.pet_info && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Pet Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-600">Name:</span> {selectedBooking.pet_info.pet_name}</div>
                    <div><span className="text-gray-600">Type:</span> {selectedBooking.pet_info.pet_type_name}</div>
                    <div><span className="text-gray-600">Breed:</span> {selectedBooking.pet_info.breed_name}</div>
                    <div><span className="text-gray-600">Weight:</span> {selectedBooking.pet_info.pet_weight} kg</div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedBooking.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyBookingsPage;
