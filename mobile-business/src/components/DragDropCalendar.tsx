import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { CalendarEvent } from '../types';

const { width } = Dimensions.get('window');
const HOUR_HEIGHT = 60;
const SIDE_WIDTH = 60;
const CONTENT_WIDTH = width - SIDE_WIDTH - 32;

interface DragDropCalendarProps {
  events: CalendarEvent[];
  onEventUpdate: (eventId: string, newStartTime: string, newEndTime: string) => void;
  selectedDate: string;
  workingHours: { start: number; end: number };
}

const DragDropCalendar: React.FC<DragDropCalendarProps> = ({
  events,
  onEventUpdate,
  selectedDate,
  workingHours = { start: 8, end: 20 },
}) => {
  const [draggingEvent, setDraggingEvent] = useState<string | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;

  const hours = Array.from(
    { length: workingHours.end - workingHours.start },
    (_, i) => workingHours.start + i
  );

  const getEventPosition = (event: CalendarEvent) => {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();

    const top = (startHour - workingHours.start) * HOUR_HEIGHT + (startMinute / 60) * HOUR_HEIGHT;
    const height = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * HOUR_HEIGHT;

    return { top, height };
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      booking: '#007bff',
      break: '#28a745',
      unavailable: '#dc3545',
    };
    return colors[type] || '#6c757d';
  };

  const handleGestureEvent = (eventId: string) =>
    Animated.event(
      [{ nativeEvent: { translationY: dragY } }],
      { useNativeDriver: false }
    );

  const handleStateChange = (eventId: string, event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      setDraggingEvent(eventId);
    } else if (event.nativeEvent.state === State.END) {
      const translationY = event.nativeEvent.translationY;
      const hoursMoved = Math.round(translationY / HOUR_HEIGHT);
      
      if (Math.abs(hoursMoved) > 0) {
        const originalEvent = events.find(e => e.id === eventId);
        if (originalEvent) {
          const startDate = new Date(originalEvent.startTime);
          const endDate = new Date(originalEvent.endTime);
          
          startDate.setHours(startDate.getHours() + hoursMoved);
          endDate.setHours(endDate.getHours() + hoursMoved);
          
          onEventUpdate(eventId, startDate.toISOString(), endDate.toISOString());
        }
      }

      setDraggingEvent(null);
      dragY.setValue(0);
    }
  };

  const renderEvent = (event: CalendarEvent) => {
    const { top, height } = getEventPosition(event);
    const isDragging = draggingEvent === event.id;
    
    const animatedStyle = isDragging
      ? {
          transform: [{ translateY: dragY }],
          zIndex: 1000,
          elevation: 8,
        }
      : {};

    return (
      <PanGestureHandler
        key={event.id}
        onGestureEvent={handleGestureEvent(event.id)}
        onHandlerStateChange={(e) => handleStateChange(event.id, e)}
      >
        <Animated.View
          style={[
            styles.eventCard,
            {
              top,
              height: Math.max(height, 30),
              backgroundColor: getEventColor(event.type),
              opacity: isDragging ? 0.8 : 1,
            },
            animatedStyle,
          ]}
        >
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={styles.eventTime}>
              {new Date(event.startTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {event.type === 'booking' && (
              <Ionicons name="calendar" size={12} color="white" style={styles.eventIcon} />
            )}
          </View>
          
          {/* Drag Handle */}
          <View style={styles.dragHandle}>
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
          </View>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  const renderTimeSlots = () => {
    return hours.map((hour) => (
      <View key={hour} style={styles.timeSlot}>
        <View style={styles.timeLabel}>
          <Text style={styles.timeText}>
            {hour.toString().padStart(2, '0')}:00
          </Text>
        </View>
        <View style={styles.timeContent}>
          <View style={styles.timeLine} />
          {/* Half hour line */}
          <View style={[styles.timeLine, styles.halfHourLine]} />
        </View>
      </View>
    ));
  };

  const dayEvents = events.filter(event => 
    event.startTime.split('T')[0] === selectedDate
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateTitle}>
          {new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.calendar}>
        {/* Time Slots */}
        {renderTimeSlots()}
        
        {/* Events */}
        <View style={styles.eventsContainer}>
          {dayEvents.map(renderEvent)}
        </View>

        {/* Current Time Indicator */}
        <CurrentTimeIndicator workingHours={workingHours} />
      </View>
      
      {draggingEvent && (
        <View style={styles.dragFeedback}>
          <Text style={styles.dragFeedbackText}>
            Drag to reschedule • Release to confirm
          </Text>
        </View>
      )}
    </View>
  );
};

const CurrentTimeIndicator: React.FC<{ workingHours: { start: number; end: number } }> = ({ workingHours }) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Only show if within working hours
  if (currentHour < workingHours.start || currentHour >= workingHours.end) {
    return null;
  }

  const top = (currentHour - workingHours.start) * HOUR_HEIGHT + (currentMinute / 60) * HOUR_HEIGHT;

  return (
    <View style={[styles.currentTimeLine, { top }]}>
      <View style={styles.currentTimeDot} />
      <View style={styles.currentTimeLineBar} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  calendar: {
    flex: 1,
    position: 'relative',
  },
  timeSlot: {
    flexDirection: 'row',
    height: HOUR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  timeLabel: {
    width: SIDE_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  timeText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  timeContent: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#fafafa',
  },
  timeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e9ecef',
    top: 0,
  },
  halfHourLine: {
    top: HOUR_HEIGHT / 2,
    backgroundColor: '#f1f3f4',
  },
  eventsContainer: {
    position: 'absolute',
    left: SIDE_WIDTH,
    right: 16,
    top: 0,
    bottom: 0,
  },
  eventCard: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventTime: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
  },
  eventIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  dragHandle: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'white',
    marginVertical: 1,
    opacity: 0.7,
  },
  currentTimeLine: {
    position: 'absolute',
    left: SIDE_WIDTH,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  currentTimeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff4500',
    marginLeft: -6,
  },
  currentTimeLineBar: {
    flex: 1,
    height: 2,
    backgroundColor: '#ff4500',
  },
  dragFeedback: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dragFeedbackText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DragDropCalendar; 