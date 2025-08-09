import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
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
import toast from 'react-hot-toast';

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
    return bookings.map(booking => ({
      id: booking.id,
      title: `${booking.service_name || 'Услуга'} - ${booking.client_name || 'Клиент'}`,
      start: new Date(booking.date_time),
      end: new Date(new Date(booking.date_time).getTime() + (booking.duration || 60) * 60000),
      resource: booking,
      status: booking.status
    }));
  }, [bookings]);

  // Event style getter
  const eventStyleGetter = useCallback((event) => {
    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';
    
    switch (event.status) {
      case 'confirmed':
        backgroundColor = '#059669';
        borderColor = '#059669';
        break;
      case 'pending':
        backgroundColor = '#d97706';
        borderColor = '#d97706';
        break;
      case 'cancelled':
        backgroundColor = '#dc2626';
        borderColor = '#dc2626';
        break;
      case 'completed':
        backgroundColor = '#7c3aed';
        borderColor = '#7c3aed';
        break;
      default:
        backgroundColor = '#6b7280';
        borderColor = '#6b7280';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: '0px',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event) => {
    setSelectedBooking(event.resource);
    setShowBookingModal(true);
    
    if (onBookingSelect) {
      onBookingSelect(event.resource);
    }
  }, [onBookingSelect]);

  // Handle slot selection
  const handleSelectSlot = useCallback((slotInfo) => {
    if (readOnly) return;
    
    setSelectedSlot(slotInfo);
    setShowCreateModal(true);
    
    if (onSlotSelect) {
      onSlotSelect(slotInfo);
    }
  }, [readOnly, onSlotSelect]);

  // Check if slot is available
  const isSlotAvailable = useCallback((start, end) => {
    const slotStart = moment(start);
    const slotEnd = moment(end);
    
    // Check against existing bookings
    const hasConflict = calendarEvents.some(event => {
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      
      return (
        (slotStart.isBefore(eventEnd) && slotEnd.isAfter(eventStart)) &&
        event.status !== 'cancelled'
      );
    });
    
    if (hasConflict) return false;
    
    // Check against availability rules
    if (availability.length > 0) {
      const dayOfWeek = slotStart.day();
      const timeSlot = slotStart.format('HH:mm');
      
      return availability.some(avail => {
        return avail.days_of_week.includes(dayOfWeek) &&
               timeSlot >= avail.start_time &&
               timeSlot <= avail.end_time;
      });
    }
    
    return true;
  }, [calendarEvents, availability]);

  // Format status for display
  const getStatusLabel = (status) => {
    const statusLabels = {
      pending: 'Ожидает подтверждения',
      confirmed: 'Подтверждено',
      cancelled: 'Отменено',
      completed: 'Завершено'
    };
    return statusLabels[status] || status;
  };

  // Format status color
  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'text-yellow-700 bg-yellow-100',
      confirmed: 'text-green-700 bg-green-100',
      cancelled: 'text-red-700 bg-red-100',
      completed: 'text-purple-700 bg-purple-100'
    };
    return statusColors[status] || 'text-gray-700 bg-gray-100';
  };

  // Handle booking update
  const handleBookingUpdate = async (bookingId, updates) => {
    try {
      if (onBookingUpdate) {
        await onBookingUpdate(bookingId, updates);
        toast.success('Бронирование обновлено');
        setShowBookingModal(false);
      }
    } catch (error) {
      toast.error('Ошибка при обновлении бронирования');
    }
  };

  // Handle booking creation
  const handleBookingCreate = async (bookingData) => {
    try {
      if (onBookingCreate) {
        await onBookingCreate(bookingData);
        toast.success('Бронирование создано');
        setShowCreateModal(false);
      }
    } catch (error) {
      toast.error('Ошибка при создании бронирования');
    }
  };

  // Handle booking deletion
  const handleBookingDelete = async (bookingId) => {
    try {
      if (onBookingDelete) {
        await onBookingDelete(bookingId);
        toast.success('Бронирование удалено');
        setShowBookingModal(false);
      }
    } catch (error) {
      toast.error('Ошибка при удалении бронирования');
    }
  };

  // Custom calendar components
  const CustomToolbar = ({ label, onNavigate, onView }) => (
    <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-lg shadow">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-2 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Сегодня
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-2 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      <h2 className="text-lg font-semibold text-gray-900">{label}</h2>

      <div className="flex space-x-1">
        {['month', 'week', 'day'].map((viewName) => (
          <button
            key={viewName}
            onClick={() => onView(viewName)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              currentView === viewName
                ? 'bg-primary-500 text-white'
                : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {viewName === 'month' ? 'Месяц' : viewName === 'week' ? 'Неделя' : 'День'}
          </button>
        ))}
      </div>
    </div>
  );

  const ChevronLeftIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );

  const ChevronRightIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div className={`booking-calendar ${className}`}>
      <div className="bg-white rounded-lg shadow">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={!readOnly}
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar
          }}
          messages={{
            next: "Вперед",
            previous: "Назад",
            today: "Сегодня",
            month: "Месяц",
            week: "Неделя",
            day: "День",
            agenda: "Повестка дня",
            date: "Дата",
            time: "Время",
            event: "Событие",
            noEventsInRange: "Нет событий в этом диапазоне",
            showMore: total => `+ ещё ${total}`
          }}
          formats={{
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({ start, end }) => 
              `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
            dayFormat: 'dd DD/MM',
            dayHeaderFormat: 'dddd DD/MM',
            dayRangeHeaderFormat: ({ start, end }) =>
              `${moment(start).format('DD MMMM')} - ${moment(end).format('DD MMMM YYYY')}`
          }}
        />
      </div>

      {/* Booking Details Modal */}
      <Transition show={showBookingModal}>
        <Dialog onClose={() => setShowBookingModal(false)} className="relative z-50">
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
                {selectedBooking && (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <DialogTitle className="text-lg font-semibold">
                        Детали бронирования
                      </DialogTitle>
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
                          <span className="text-sm">
                            {moment(selectedBooking.date_time).format('DD MMMM YYYY, HH:mm')}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <ClockIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-sm">
                            Длительность: {selectedBooking.duration || 60} мин
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-sm">
                            {selectedBooking.client_name || 'Не указано'}
                          </span>
                        </div>

                        {selectedBooking.client_phone && (
                          <div className="flex items-center space-x-3">
                            <PhoneIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-sm">
                              {selectedBooking.client_phone}
                            </span>
                          </div>
                        )}

                        {selectedBooking.notes && (
                          <div className="border-t pt-3">
                            <p className="text-sm text-gray-600">
                              <strong>Примечания:</strong> {selectedBooking.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {!readOnly && (
                        <div className="flex space-x-3 pt-4 border-t">
                          {selectedBooking.status === 'pending' && (
                            <button
                              onClick={() => handleBookingUpdate(selectedBooking.id, { status: 'confirmed' })}
                              className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center justify-center space-x-2"
                            >
                              <CheckIcon className="w-4 h-4" />
                              <span>Подтвердить</span>
                            </button>
                          )}
                          
                          {['pending', 'confirmed'].includes(selectedBooking.status) && (
                            <button
                              onClick={() => handleBookingUpdate(selectedBooking.id, { status: 'cancelled' })}
                              className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 flex items-center justify-center space-x-2"
                            >
                              <XMarkIcon className="w-4 h-4" />
                              <span>Отменить</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* Create Booking Modal */}
      <Transition show={showCreateModal}>
        <Dialog onClose={() => setShowCreateModal(false)} className="relative z-50">
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <DialogTitle className="text-lg font-semibold">
                    Создать бронирование
                  </DialogTitle>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {selectedSlot && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Выбранное время:</strong>
                      </p>
                      <p className="text-sm">
                        {moment(selectedSlot.start).format('DD MMMM YYYY, HH:mm')} - 
                        {moment(selectedSlot.end).format('HH:mm')}
                      </p>
                    </div>

                    {!isSlotAvailable(selectedSlot.start, selectedSlot.end) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center space-x-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          Это время недоступно для бронирования
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                      >
                        Отмена
                      </button>
                      
                      <button
                        onClick={() => handleBookingCreate({
                          start: selectedSlot.start,
                          end: selectedSlot.end,
                          duration: Math.round((selectedSlot.end - selectedSlot.start) / 60000)
                        })}
                        disabled={!isSlotAvailable(selectedSlot.start, selectedSlot.end)}
                        className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Создать
                      </button>
                    </div>
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default BookingCalendar; 