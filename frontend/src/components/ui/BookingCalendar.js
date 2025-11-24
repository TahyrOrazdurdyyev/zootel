import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  Dialog,
  Transition
} from '@headlessui/react';
import {
  ClockIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Configure moment localizer
moment.locale('ru');
const localizer = momentLocalizer(moment);

const BookingCalendar = ({ 
  bookings = [], 
  availability = [], 
  onBookingSelect,
  onSlotSelect,
  onBookingCreate,
  onBookingUpdate,
  onBookingDelete,
  readOnly = false,
  view = 'week',
  className = ''
}) => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentView, setCurrentView] = useState(view);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Transform bookings for calendar
  const calendarEvents = useMemo(() => {
    if (!Array.isArray(bookings)) {
      console.warn('Bookings is not an array:', bookings);
      return [];
    }
    
    return bookings.map(booking => {
      try {
        const startDate = new Date(booking.date_time || booking.booking_date);
        const duration = booking.duration || 60; // Default 1 hour
        const endDate = new Date(startDate.getTime() + duration * 60000);
        
        return {
          id: booking.id,
          title: `${booking.service_name || 'Service'} - ${booking.client_name || booking.customer_name || 'Client'}`,
          start: startDate,
          end: endDate,
          resource: booking,
          status: booking.status
        };
      } catch (error) {
        console.error('Error processing booking:', booking, error);
        return null;
      }
    }).filter(Boolean);
  }, [bookings]);

  // Event style getter
  const eventStyleGetter = useCallback((event) => {
    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';
    
    switch (event.status) {
      case 'confirmed':
        backgroundColor = '#10b981';
        borderColor = '#059669';
        break;
      case 'pending':
        backgroundColor = '#f59e0b';
        borderColor = '#d97706';
        break;
      case 'cancelled':
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
        break;
      case 'completed':
        backgroundColor = '#6366f1';
        borderColor = '#4f46e5';
        break;
      default:
        backgroundColor = '#6b7280';
        borderColor = '#4b5563';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: `1px solid ${borderColor}`,
        borderRadius: '4px'
      }
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event) => {
    console.log('Selected event:', event);
    setSelectedBooking(event.resource);
    setShowBookingModal(true);
    if (onBookingSelect) {
      onBookingSelect(event.resource);
    }
  }, [onBookingSelect]);

  // Handle slot selection
  const handleSelectSlot = useCallback((slotInfo) => {
    console.log('Selected slot:', slotInfo);
    if (!readOnly) {
      setSelectedSlot(slotInfo);
      setShowCreateModal(true);
      if (onSlotSelect) {
        onSlotSelect(slotInfo);
      }
    }
  }, [readOnly, onSlotSelect]);

  // Get status color for modal
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className={`booking-calendar ${className}`}>
      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={!readOnly}
          eventPropGetter={eventStyleGetter}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          views={['month', 'week', 'day', 'agenda']}
          messages={{
            next: "Next",
            previous: "Previous",
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
            agenda: "Agenda",
            date: "Date",
            time: "Time",
            event: "Event",
            noEventsInRange: "No events in this range.",
            showMore: total => `+ ${total} more`
          }}
        />
      </div>

      {/* Booking Details Modal */}
      <Transition appear show={showBookingModal} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowBookingModal(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
                  {selectedBooking && (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <Dialog.Title className="text-lg font-semibold">
                          Booking Details
                        </Dialog.Title>
                        <button
                          onClick={() => setShowBookingModal(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                            {getStatusLabel(selectedBooking.status)}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <CalendarIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">Service</p>
                              <p className="text-sm text-gray-600">{selectedBooking.service_name || 'Not specified'}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <UserIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">Client</p>
                              <p className="text-sm text-gray-600">{selectedBooking.client_name || selectedBooking.customer_name || 'Not specified'}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <ClockIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">Time</p>
                              <p className="text-sm text-gray-600">
                                {new Date(selectedBooking.date_time || selectedBooking.booking_date).toLocaleString('en-US')}
                              </p>
                            </div>
                          </div>

                          {selectedBooking.phone && (
                            <div className="flex items-center space-x-3">
                              <PhoneIcon className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">Phone</p>
                                <p className="text-sm text-gray-600">{selectedBooking.phone}</p>
                              </div>
                            </div>
                          )}

                          {selectedBooking.notes && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Notes</p>
                              <p className="text-sm text-gray-600">{selectedBooking.notes}</p>
                            </div>
                          )}
                        </div>

                        {!readOnly && onBookingUpdate && (
                          <div className="flex space-x-2 pt-4">
                            {selectedBooking.status === 'pending' && (
                              <button
                                onClick={() => {
                                  onBookingUpdate(selectedBooking.id, { status: 'confirmed' });
                                  setShowBookingModal(false);
                                }}
                                className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                              >
                                <CheckIcon className="w-4 h-4 inline mr-1" />
                                Confirm
                              </button>
                            )}
                            
                            {selectedBooking.status !== 'cancelled' && (
                              <button
                                onClick={() => {
                                  onBookingUpdate(selectedBooking.id, { status: 'cancelled' });
                                  setShowBookingModal(false);
                                }}
                                className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                              >
                                <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Create Booking Modal */}
      <Transition appear show={showCreateModal} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowCreateModal(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <Dialog.Title className="text-lg font-semibold">
                      Create Booking
                    </Dialog.Title>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {selectedSlot && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Selected Time</p>
                          <p className="text-sm text-gray-600">
                            {selectedSlot.start.toLocaleString('en-US')} - {selectedSlot.end.toLocaleString('en-US')}
                          </p>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-4">
                          Booking creation functionality will be added later
                        </p>
                        <button
                          onClick={() => setShowCreateModal(false)}
                          className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default BookingCalendar;