import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const EmployeeSchedule = ({ employeeId, onClose }) => {
  const { apiCall } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  useEffect(() => {
    if (employeeId) {
      loadEmployeeData();
      loadEmployeeSchedule();
      loadEmployeeBookings();
    }
  }, [employeeId, selectedDate]);

  const loadEmployeeData = async () => {
    try {
      const response = await apiCall(`/employees/manage/${employeeId}`);
      if (response.success) {
        setEmployee(response.employee);
      }
    } catch (error) {
      console.error('Failed to load employee:', error);
    }
  };

  const loadEmployeeSchedule = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall(`/employees/${employeeId}/schedule`);
      if (response.success) {
        setSchedule(response.schedule || {});
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
      // Mock schedule for demonstration
      setSchedule({
        monday: { start: '09:00', end: '17:00', isWorking: true },
        tuesday: { start: '09:00', end: '17:00', isWorking: true },
        wednesday: { start: '09:00', end: '17:00', isWorking: true },
        thursday: { start: '09:00', end: '17:00', isWorking: true },
        friday: { start: '09:00', end: '17:00', isWorking: true },
        saturday: { start: '10:00', end: '14:00', isWorking: true },
        sunday: { start: '00:00', end: '00:00', isWorking: false }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployeeBookings = async () => {
    try {
      const response = await apiCall(`/employees/${employeeId}/bookings?date=${selectedDate}`);
      if (response.success) {
        setBookings(response.bookings || []);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
      // Mock bookings for demonstration
      setBookings([
        {
          id: '1',
          service_name: 'Dog Grooming',
          customer_name: 'John Doe',
          pet_name: 'Buddy',
          start_time: '10:00',
          end_time: '11:30',
          status: 'confirmed'
        },
        {
          id: '2',
          service_name: 'Vet Consultation',
          customer_name: 'Jane Smith',
          pet_name: 'Fluffy',
          start_time: '14:00',
          end_time: '15:00',
          status: 'pending'
        },
        {
          id: '3',
          service_name: 'Pet Bath',
          customer_name: 'Mike Johnson',
          pet_name: 'Max',
          start_time: '16:00',
          end_time: '16:45',
          status: 'completed'
        }
      ]);
    }
  };

  const updateSchedule = async (daySchedule) => {
    try {
      const response = await apiCall(`/employees/${employeeId}/schedule`, 'PUT', {
        schedule: daySchedule
      });
      if (response.success) {
        setSchedule(daySchedule);
        alert('Schedule updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
      alert('Failed to update schedule. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return CheckCircleIcon;
      case 'pending': return ExclamationTriangleIcon;
      case 'completed': return CheckCircleIcon;
      case 'cancelled': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateWorkingHours = (daySchedule) => {
    if (!daySchedule.isWorking) return 0;
    const start = new Date(`2000-01-01T${daySchedule.start}`);
    const end = new Date(`2000-01-01T${daySchedule.end}`);
    return (end - start) / (1000 * 60 * 60); // hours
  };

  const getTotalWeeklyHours = () => {
    return daysOfWeek.reduce((total, day) => {
      const daySchedule = schedule[day.key];
      return total + (daySchedule ? calculateWorkingHours(daySchedule) : 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CalendarDaysIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Employee Schedule</h3>
              {employee && (
                <p className="text-sm text-gray-600">
                  {employee.first_name} {employee.last_name} - {employee.role}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Schedule */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Weekly Schedule</h4>
              <div className="text-sm text-gray-600">
                Total: {getTotalWeeklyHours().toFixed(1)} hours/week
              </div>
            </div>

            <div className="space-y-3">
              {daysOfWeek.map((day) => {
                const daySchedule = schedule[day.key] || { isWorking: false };
                return (
                  <div key={day.key} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center">
                      <div className="w-20 text-sm font-medium text-gray-900">
                        {day.label}
                      </div>
                      {daySchedule.isWorking ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {formatTime(daySchedule.start)} - {formatTime(daySchedule.end)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-500">
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm">Not working</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {daySchedule.isWorking ? `${calculateWorkingHours(daySchedule)}h` : '0h'}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowScheduleForm(true)}
              className="mt-4 w-full px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
            >
              <PencilIcon className="h-4 w-4 inline mr-2" />
              Edit Schedule
            </button>
          </div>

          {/* Daily Bookings */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Daily Bookings</h4>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No bookings for this date</p>
                </div>
              ) : (
                bookings.map((booking) => {
                  const StatusIcon = getStatusIcon(booking.status);
                  return (
                    <div key={booking.id} className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          {booking.service_name}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-2" />
                          {booking.customer_name} - {booking.pet_name}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Schedule Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">Weekly Hours</p>
                <p className="text-2xl font-bold text-blue-600">{getTotalWeeklyHours().toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-900">Today's Bookings</p>
                <p className="text-2xl font-bold text-green-600">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-900">Utilization</p>
                <p className="text-2xl font-bold text-purple-600">
                  {bookings.length > 0 ? Math.round((bookings.length / 8) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h5 className="text-lg font-semibold text-gray-900 mb-4">Edit Weekly Schedule</h5>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {daysOfWeek.map((day) => {
                const daySchedule = schedule[day.key] || { isWorking: false, start: '09:00', end: '17:00' };
                return (
                  <div key={day.key} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-gray-900">{day.label}</label>
                      <input
                        type="checkbox"
                        checked={daySchedule.isWorking}
                        onChange={(e) => {
                          setSchedule(prev => ({
                            ...prev,
                            [day.key]: {
                              ...daySchedule,
                              isWorking: e.target.checked
                            }
                          }));
                        }}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                    </div>
                    
                    {daySchedule.isWorking && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Start</label>
                          <input
                            type="time"
                            value={daySchedule.start}
                            onChange={(e) => {
                              setSchedule(prev => ({
                                ...prev,
                                [day.key]: {
                                  ...daySchedule,
                                  start: e.target.value
                                }
                              }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">End</label>
                          <input
                            type="time"
                            value={daySchedule.end}
                            onChange={(e) => {
                              setSchedule(prev => ({
                                ...prev,
                                [day.key]: {
                                  ...daySchedule,
                                  end: e.target.value
                                }
                              }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowScheduleForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateSchedule(schedule);
                  setShowScheduleForm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSchedule;
