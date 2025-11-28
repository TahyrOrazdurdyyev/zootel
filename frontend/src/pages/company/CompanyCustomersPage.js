import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  XMarkIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const CompanyCustomersPage = () => {
  const { user, apiCall } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/companies/${user?.company_id}/customers`);
      if (response.success) {
        setCustomers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerHistory = async (customerId) => {
    try {
      setHistoryLoading(true);
      const response = await apiCall(`/companies/${user?.company_id}/customers/${customerId}/history`);
      if (response.success) {
        setCustomerHistory(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching customer history:', error);
      setCustomerHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
    await fetchCustomerHistory(customer.user_id);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedCustomer(null);
    setCustomerHistory([]);
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UsersIcon className="h-8 w-8 mr-3 text-blue-600" />
              Customers
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your customers and view their booking history
            </p>
            <p className="text-sm text-gray-500">
              Total customers: {customers.length} | Showing: {filteredCustomers.length}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Customer List</h3>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'You don\'t have any customers yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emergency Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserCircleIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.gender && (
                                <span className="capitalize">{customer.gender}</span>
                              )}
                              {customer.date_of_birth && (
                                <span className="ml-2">• Born {formatDate(customer.date_of_birth)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.email}
                          </div>
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                              {customer.address && (
                                <div>{customer.address} {customer.apartment_number}</div>
                              )}
                              <div>{customer.city}, {customer.state}</div>
                              <div>{customer.country} {customer.postal_code}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.emergency_contact_name && (
                            <>
                              <div className="font-medium">{customer.emergency_contact_name}</div>
                              <div className="text-gray-500">
                                {customer.emergency_contact_relation && (
                                  <span className="capitalize">{customer.emergency_contact_relation}</span>
                                )}
                              </div>
                              <div className="text-gray-500">{customer.emergency_contact_phone}</div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Customer Details: {selectedCustomer.first_name} {selectedCustomer.last_name}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedCustomer.first_name} {selectedCustomer.last_name}</div>
                  <div><span className="font-medium">Email:</span> {selectedCustomer.email}</div>
                  <div><span className="font-medium">Phone:</span> {selectedCustomer.phone}</div>
                  {selectedCustomer.gender && (
                    <div><span className="font-medium">Gender:</span> <span className="capitalize">{selectedCustomer.gender}</span></div>
                  )}
                  {selectedCustomer.date_of_birth && (
                    <div><span className="font-medium">Date of Birth:</span> {formatDate(selectedCustomer.date_of_birth)}</div>
                  )}
                  <div><span className="font-medium">Address:</span> {selectedCustomer.address} {selectedCustomer.apartment_number}</div>
                  <div><span className="font-medium">City:</span> {selectedCustomer.city}, {selectedCustomer.state}</div>
                  <div><span className="font-medium">Country:</span> {selectedCustomer.country} {selectedCustomer.postal_code}</div>
                  {selectedCustomer.emergency_contact_name && (
                    <>
                      <div className="pt-2 border-t">
                        <span className="font-medium">Emergency Contact:</span> {selectedCustomer.emergency_contact_name}
                      </div>
                      <div><span className="font-medium">Relation:</span> <span className="capitalize">{selectedCustomer.emergency_contact_relation}</span></div>
                      <div><span className="font-medium">Phone:</span> {selectedCustomer.emergency_contact_phone}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Booking History */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Booking History ({customerHistory.length} bookings)
                </h4>
                
                {historyLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : customerHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">No booking history found.</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {customerHistory.map((booking) => (
                      <div key={booking.id} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(booking.date_time)}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Service: {booking.service_name || 'N/A'}</div>
                          <div>Pet: {booking.pet_name || 'N/A'}</div>
                          <div>Price: {formatCurrency(booking.price)}</div>
                          {booking.notes && (
                            <div className="mt-1 text-xs text-gray-500">Notes: {booking.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyCustomersPage;
