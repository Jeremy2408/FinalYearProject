import React, { useCallback, useState } from 'react';
import { CalendarBody, CalendarContainer, CalendarHeader, DraggingEvent, DraggingEventProps, OnCreateEventResponse } from '@howljs/calendar-kit';
import { View } from 'react-native';

const Calendar = () => {
  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'Meeting with Team',
      start: { dateTime: '2025-01-15T10:00:00Z' },
      end: { dateTime: '2025-01-15T11:00:00Z' },
      color: '#4285F4',
    },
    
  ]);

  const handleDragCreateStart = (start: OnCreateEventResponse) => {
    console.log("Started creating event at:", start);
  };

  const handleDragCreateEnd = (event: OnCreateEventResponse) => {
    console.log("New event:", event);
    
    const newEvent = {
      id: (events.length + 1).toString(),
      title: 'New Event', 
      start: event.start,
      end: event.end,
      color: getRandomColor(),
    };

    setEvents((prevEvents) => [...prevEvents, newEvent]);
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const renderDraggingEvent = useCallback((props: DraggingEventProps) => {
    return (
      <DraggingEvent
        {...props}
        TopEdgeComponent={
          <View
            style={{
              height: 10,
              width: '100%',
              backgroundColor: 'red',
              position: 'absolute',
            }}
          />
        }
        BottomEdgeComponent={
          <View
            style={{
              height: 10,
              width: '100%',
              backgroundColor: 'red',
              bottom: 0,
              position: 'absolute',
            }}
          />
        }
      />
    );
  }, []);

  return (
    <CalendarContainer
      allowDragToCreate={true}
      onDragCreateEventStart={handleDragCreateStart}
      onDragCreateEventEnd={handleDragCreateEnd}
      events={events}
      defaultDuration={60} 
      dragStep={15} 
    >
      <CalendarHeader />
      <CalendarBody renderDraggingEvent={renderDraggingEvent} />
    </CalendarContainer>
  );
};

export default Calendar;