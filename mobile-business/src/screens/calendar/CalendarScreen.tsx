import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import ApiService from '../../services/apiService';
import { CalendarEvent, Booking } from '../../types';

type ViewMode = 'month' | 'week' | 'day';

const CalendarScreen = () => {
  const { employee } = useAuth();
  const { canViewBookings, hasPermission } = usePermissions();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch calendar events
  const {
    data: events,
    isLoading,
    refetch,
  } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events', employee?.companyId, selectedDate],
    queryFn: () => {
      const startDate = viewMode === 'month' 
        ? new Date(selectedDate).toISOString().split('T')[0]
        : selectedDate;
      const endDate = viewMode === 'month'
        ? new Date(new Date(selectedDate).getFullYear(), new Date(selectedDate).getMonth() + 1, 0).toISOString().split('T')[0]
        : selectedDate;
      
      return ApiService.getCalendarEvents(
        employee!.companyId,
        hasPermission('view_all_bookings') ? undefined : employee?.id,
        startDate,
        endDate
      );
    },
    enabled: !!employee?.companyId && canViewBookings,
  });

  // Calendar marking
  const markedDates = events?.reduce((acc, event) => {
    const date = event.start.split('T')[0];
    const eventColor = event.color || '#ff4500';
    
    if (!acc[date]) {
      acc[date] = { 
        marked: true, 
        dots: [{ color: eventColor }],
        selectedColor: eventColor,
      };
    } else {
      acc[date].dots.push({ color: eventColor });
    }
    
    return acc;
  }, {} as any) || {};

  // Add selected date marking
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: '#ff4500',
    };
  }

  const onDayPress = useCallback((day: any) => {
    setSelectedDate(day.dateString);
  }, []);

  const getEventsForDate = (date: string) => {
    return events?.filter(event => 
      event.start.split('T')[0] === date
    ) || [];
  };

  const getTimeFromDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      booking: 'calendar',
      break: 'pause-circle',
      unavailable: 'close-circle'
    };
    return icons[type] || 'help-circle';
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      booking: '#3B82F6',
      break: '#F59E0B', 
      unavailable: '#EF4444'
    };
    return colors[type] || '#6c757d';
  };

  const handleEventPress = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const renderViewModeSelector = () => (
    <View style={styles.viewModeContainer}>
      {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.viewModeButton,
            viewMode === mode && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode(mode)}
        >
          <Text
            style={[
              styles.viewModeText,
              viewMode === mode && styles.viewModeTextActive,
            ]}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMonthView = () => (
    <Calendar
      style={styles.calendar}
      current={selectedDate}
      onDayPress={onDayPress}
      markedDates={markedDates}
      markingType="multi-dot"
      theme={{
        backgroundColor: '#ffffff',
        calendarBackground: '#ffffff',
        textSectionTitleColor: '#b6c1cd',
        selectedDayBackgroundColor: '#ff4500',
        selectedDayTextColor: '#ffffff',
        todayTextColor: '#ff4500',
        dayTextColor: '#2d4150',
        textDisabledColor: '#d9e1e8',
        dotColor: '#ff4500',
        selectedDotColor: '#ffffff',
        arrowColor: '#ff4500',
        disabledArrowColor: '#d9e1e8',
        monthTextColor: '#2d4150',
        indicatorColor: '#ff4500',
        textDayFontFamily: 'System',
        textMonthFontFamily: 'System',
        textDayHeaderFontFamily: 'System',
        textDayFontWeight: '300',
        textMonthFontWeight: 'bold',
        textDayHeaderFontWeight: '300',
        textDayFontSize: 16,
        textMonthFontSize: 16,
        textDayHeaderFontSize: 13,
      }}
    />
  );

  const renderWeekView = () => {
    const weekEvents = getEventsForDate(selectedDate);
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

    return (
      <ScrollView style={styles.weekView}>
        {hours.map((hour) => (
          <View key={hour} style={styles.hourRow}>
            <View style={styles.hourLabel}>
              <Text style={styles.hourText}>
                {hour.toString().padStart(2, '0')}:00
              </Text>
            </View>
            <View style={styles.hourContent}>
              {weekEvents
                .filter(event => {
                  const eventHour = new Date(event.start).getHours();
                  return eventHour === hour;
                })
                .map(event => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.weekEvent,
                      { backgroundColor: getEventColor(event.type) },
                    ]}
                    onPress={() => handleEventPress(event)}
                  >
                    <Text style={styles.weekEventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={styles.weekEventTime}>
                      {getTimeFromDateTime(event.start)} - {getTimeFromDateTime(event.end)}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(selectedDate);

    return (
      <ScrollView style={styles.dayView}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {dayEvents.length > 0 ? (
          <FlatList
            data={dayEvents.sort((a, b) => 
              new Date(a.start).getTime() - new Date(b.start).getTime()
            )}
            keyExtractor={(item) => item.id}
            renderItem={({ item: event }) => (
              <TouchableOpacity
                style={styles.dayEventCard}
                onPress={() => handleEventPress(event)}
              >
                <View style={styles.dayEventHeader}>
                  <View style={styles.dayEventInfo}>
                    <Ionicons
                      name={getEventIcon(event.type) as any}
                      size={20}
                      color={getEventColor(event.type)}
                    />
                    <Text style={styles.dayEventTitle}>{event.title}</Text>
                  </View>
                  <View style={[
                    styles.eventTypeBadge,
                    { backgroundColor: getEventColor(event.type) }
                  ]}>
                    <Text style={styles.eventTypeText}>
                      {event.type.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.dayEventTime}>
                  <Ionicons name="time-outline" size={16} color="#6c757d" />
                  <Text style={styles.dayEventTimeText}>
                    {getTimeFromDateTime(event.start)} - {getTimeFromDateTime(event.end)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyDayContainer}>
            <Ionicons name="calendar-outline" size={64} color="#6c757d" />
            <Text style={styles.emptyDayText}>No events today</Text>
            <Text style={styles.emptyDaySubtext}>Your schedule is clear</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderCurrentView = () => {
    switch (viewMode) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      default:
        return renderMonthView();
    }
  };

  if (!canViewBookings) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="lock-closed" size={64} color="#6c757d" />
        <Text style={styles.permissionText}>
          You don't have permission to view the calendar
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* View Mode Selector */}
      {renderViewModeSelector()}

      {/* Calendar Content */}
      <View style={styles.calendarContainer}>
        {renderCurrentView()}
      </View>

      {/* Event Detail Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Event Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <View style={styles.modalContent}>
                <View style={styles.eventDetailHeader}>
                  <Ionicons
                    name={getEventIcon(selectedEvent.type) as any}
                    size={32}
                    color={getEventColor(selectedEvent.type)}
                  />
                  <View style={styles.eventDetailInfo}>
                    <Text style={styles.eventDetailTitle}>{selectedEvent.title}</Text>
                    <View style={[
                      styles.eventTypeBadge,
                      { backgroundColor: getEventColor(selectedEvent.type) }
                    ]}>
                      <Text style={styles.eventTypeText}>
                        {selectedEvent.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.eventDetailTime}>
                  <Ionicons name="time-outline" size={20} color="#6c757d" />
                  <Text style={styles.eventDetailTimeText}>
                    {getTimeFromDateTime(selectedEvent.start)} - {getTimeFromDateTime(selectedEvent.end)}
                  </Text>
                </View>

                <View style={styles.eventDetailDate}>
                  <Ionicons name="calendar-outline" size={20} color="#6c757d" />
                  <Text style={styles.eventDetailDateText}>
                    {new Date(selectedEvent.start).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>

                {selectedEvent.bookingId && (
                  <TouchableOpacity style={styles.viewBookingButton}>
                    <Text style={styles.viewBookingText}>View Booking Details</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ff4500" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 32,
  },
  permissionText: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
  },
  addButton: {
    backgroundColor: '#ff4500',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  viewModeButtonActive: {
    backgroundColor: '#ff4500',
  },
  viewModeText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  viewModeTextActive: {
    color: 'white',
  },
  calendarContainer: {
    flex: 1,
    marginTop: 16,
  },
  calendar: {
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekView: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hourRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    minHeight: 60,
  },
  hourLabel: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  hourText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  hourContent: {
    flex: 1,
    padding: 8,
  },
  weekEvent: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  weekEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  weekEventTime: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
  },
  dayView: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  dayEventCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dayEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayEventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 8,
    flex: 1,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  dayEventTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayEventTimeText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
  },
  emptyDayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyDayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 16,
  },
  emptyDaySubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  modalContent: {
    padding: 20,
  },
  eventDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventDetailInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  eventDetailTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventDetailTimeText: {
    fontSize: 16,
    color: '#6c757d',
    marginLeft: 8,
  },
  eventDetailDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  eventDetailDateText: {
    fontSize: 16,
    color: '#6c757d',
    marginLeft: 8,
  },
  viewBookingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
  },
  viewBookingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ff4500',
  },
});

export default CalendarScreen; 