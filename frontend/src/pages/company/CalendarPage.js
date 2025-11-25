import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BookingCalendar from '../../components/ui/BookingCalendar';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const CalendarPage = () => {
  const { apiCall } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('week');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeCalendar = async () => {
      try {
        console.log('🚀 Initializing calendar page...');
        setError(null);
        await Promise.all([loadBookings(), loadEmployees(), loadServices()]);
        console.log('✅ Calendar initialized successfully');
      } catch (err) {
        console.error('❌ Calendar initialization failed:', err);
        setError(err.message || 'Failed to initialize calendar');
      }
    };
    
    initializeCalendar();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      console.log('📅 Loading bookings...');
      const response = await apiCall('/companies/bookings');
      console.log('📅 Bookings response:', response);
      
      if (response && Array.isArray(response.bookings)) {
        console.log('📅 Loaded bookings:', response.bookings.length);
        setBookings(response.bookings);
      } else {
        console.error('❌ Invalid bookings response:', response);
        setBookings([]);
      }
    } catch (error) {
      console.error('❌ Failed to load bookings:', error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      console.log('👥 Loading employees...');
      const response = await apiCall('/companies/employees');
      console.log('👥 Employees response:', response);
      
      if (response && Array.isArray(response.employees)) {
        console.log('👥 Loaded employees:', response.employees.length);
        setEmployees(response.employees);
      }
    } catch (error) {
      console.error('❌ Failed to load employees:', error);
    }
  };

  const loadServices = async () => {
    try {
      console.log('🔧 Loading services...');
      const response = await apiCall('/companies/services');
      console.log('🔧 Services response:', response);
      
      if (response && Array.isArray(response.services)) {
        console.log('🔧 Loaded services:', response.services.length);
        // Only include active services for booking
        const activeServices = response.services.filter(service => service.is_active);
        setServices(activeServices);
      }
    } catch (error) {
      console.error('❌ Failed to load services:', error);
    }
  };

  const handleBookingSelect = (booking) => {
    console.log('Selected booking:', booking);
    // TODO: Open booking details modal
  };

  const handleSlotSelect = (slotInfo) => {
    console.log('Selected slot:', slotInfo);
    // TODO: Open create booking modal
  };

  const handleBookingCreate = async (bookingData) => {
    try {
      console.log('Creating booking:', bookingData);
      const response = await apiCall('/companies/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
      console.log('Booking created:', response);
      loadBookings(); // Reload bookings
      alert('Booking created successfully!');
    } catch (error) {
      console.error('Failed to create booking:', error);
      throw error;
    }
  };

  const handleBookingUpdate = async (bookingId, updates) => {
    try {
      await apiCall(`/companies/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      loadBookings(); // Reload bookings
    } catch (error) {
      console.error('Failed to update booking:', error);
    }
  };

  const filteredBookings = selectedEmployee === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.employee_id === selectedEmployee);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Ошибка загрузки календаря</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Загрузка календаря...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CalendarIcon className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600">Manage your bookings and schedule</p>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-4">
            {/* Employee Filter */}
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="w-5 h-5 text-gray-500" />
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Employees</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            {/* View Selector */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="month">Month</option>
                <option value="week">Week</option>
                <option value="day">Day</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Bookings
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredBookings.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Bookings
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredBookings.filter(booking => {
                      const today = new Date().toDateString();
                      const bookingDate = new Date(booking.booking_date).toDateString();
                      return today === bookingDate;
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredBookings.filter(booking => booking.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Confirmed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredBookings.filter(booking => booking.status === 'confirmed').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white shadow rounded-lg p-6">
        <BookingCalendar
          bookings={filteredBookings}
          services={services}
          employees={employees}
          onBookingSelect={handleBookingSelect}
          onSlotSelect={handleSlotSelect}
          onBookingCreate={handleBookingCreate}
          onBookingUpdate={handleBookingUpdate}
          view={selectedView}
          className="h-96"
        />
      </div>
    </div>
  );
};

export default CalendarPage;
