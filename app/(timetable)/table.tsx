import React, { useCallback, useState } from 'react';
import { CalendarBody, CalendarContainer, CalendarHeader, DraggingEvent, DraggingEventProps, OnCreateEventResponse } from '@howljs/calendar-kit';
import { View, Modal, TextInput, Button } from 'react-native';

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

  const [isModalVisible, setModalVisible] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDetails, setNewEventDetails] = useState<OnCreateEventResponse | null>(null);

  const handleDragCreateStart = (start: OnCreateEventResponse) => {
    console.log("Started creating event at:", start);
  };

  const handleDragCreateEnd = (event: OnCreateEventResponse) => {

    setNewEventDetails(event); 
    setModalVisible(true); 
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

  const addEvent = () => {
    if (!newEventDetails) return;

    const newEvent = {
      id: (events.length + 1).toString(),
      title: newEventTitle || 'Untitled Event',
      start: newEventDetails.start,
      end: newEventDetails.end,
      color: getRandomColor(),
    };

    setEvents((prevEvents) => [...prevEvents, newEvent]);
    setNewEventTitle(''); 
    setNewEventDetails(null); 
    setModalVisible(false); 
  };

  const renderTitleModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ width: '80%', backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
          <TextInput
            placeholder="Enter event title"
            value={newEventTitle}
            onChangeText={setNewEventTitle}
            style={{ borderBottomWidth: 1, marginBottom: 20 }}
          />
          <Button title="Create Event" onPress={addEvent} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} />

        </View>
      </View>
    </Modal>
  );


  return (
    <>
      <CalendarContainer
        allowDragToEdit={true}
        allowPinchToZoom={true}
        minTimeIntervalHeight={30}
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
      {renderTitleModal()}
    </>
    
    
  );
};

export default Calendar;