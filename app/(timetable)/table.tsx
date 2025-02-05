import React, { useCallback, useEffect, useState } from 'react';
import { CalendarBody, CalendarContainer, CalendarHeader, DraggingEvent, DraggingEventProps, OnCreateEventResponse } from '@howljs/calendar-kit';
import { View, Modal, TextInput, Button, SafeAreaView, Pressable, Text } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { collection, addDoc, getFirestore, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { router } from 'expo-router';

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
  const [open, setOpen] = useState(false);

  const [eventType, setEventType] = useState('academic'); 
  const [items, setItems] = useState([
    { label: 'Academic', value: 'academic' },
    { label: 'Personal', value: 'personal' }
  ]);


  const handleDragCreateStart = (start: OnCreateEventResponse) => {
    console.log("Started creating event at:", start);
  };

  const handleDragCreateEnd = (event: OnCreateEventResponse) => {

    setNewEventDetails(event); 
    setModalVisible(true); 
  };

  

  const getRandomColor = () => {
    return eventType === 'academic' ? '#4285F4' : '#34A853'; 
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

  const addEvent = async () => {
    if (!newEventDetails) return;
  
    const auth = getAuth();
    const user = auth.currentUser; 
  
    if (!user) {
      console.error("User not authenticated");
      return;
    }

  const newEventId = new Date().toISOString();
    

  
    const newEvent = {
      id: newEventId, 
      title: newEventTitle || 'Untitled Event',
      start: newEventDetails.start,
      end: newEventDetails.end,
      color: getRandomColor(),
      type: eventType, 

    };

    const db = getFirestore();
    
    try {
      await addDoc(collection(db, 'users', user.uid, 'events'), newEvent);
  
      setEvents((prevEvents) => [...prevEvents, newEvent]); 
      setNewEventTitle('');
      setNewEventDetails(null);
      setEventType('academic'); 
      setModalVisible(false);
    } catch (error) {
      console.error("Error saving event to Firestore:", error);
    } 
  };
  const fetchEvents = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
  
    if (!user) {
      console.error("User not authenticated");
      return;
    }
  
    const db = getFirestore();
    try {
      const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'events'));
      const userEvents = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          start: data.start,
          end: data.end,
          color: data.color,
        };
      });
  
      setEvents(userEvents); 
    } catch (error) {
      console.error("Error fetching events from Firestore:", error);
    }
  };
  
  useEffect(() => {
    fetchEvents();
  }, []);

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

          <DropDownPicker
            open={open}
            value={eventType}
            items={items}
            setOpen={setOpen}
            setValue={setEventType}
            setItems={setItems}
            containerStyle={{ height: 40, marginBottom: 20 }}
            dropDownContainerStyle={{ backgroundColor: '#fafafa' }}
          />


          <Button title="Create Event" onPress={addEvent} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} />

        </View>
      </View>
    </Modal>
  );


  return (
    <SafeAreaView style={{ flex: 1 }}>
  <Pressable onPress={()=> router.back()}><Text>Go Back</Text></Pressable>

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
    </SafeAreaView>

    
    
  );
};

export default Calendar;