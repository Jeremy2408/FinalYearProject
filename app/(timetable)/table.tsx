import React, { useCallback, useEffect, useState } from 'react';
import { CalendarBody, CalendarContainer, CalendarHeader, DraggingEvent, DraggingEventProps, OnCreateEventResponse, PackedEvent, SizeAnimation } from '@howljs/calendar-kit';
import { View, Modal, TextInput, Button, SafeAreaView, Pressable, Text, Alert, TouchableOpacity } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { collection, addDoc, getFirestore, getDocs, deleteDoc, doc } from 'firebase/firestore';
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

  const [groupChats, setGroupChats] = useState<{ label: string; value: string }[]>([]);
  const [linkedGroup, setLinkedGroup] = useState<string>('');
  const [groupOpen, setGroupOpen] = useState(false);

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
        TopEdgeComponent={<View style={{ height: 10, width: '100%', backgroundColor: 'red', position: 'absolute' }} />}
        BottomEdgeComponent={<View style={{ height: 10, width: '100%', backgroundColor: 'red', bottom: 0, position: 'absolute' }} />}
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
    const db = getFirestore();

    const groupInfo = linkedGroup ? groupChats.find(g => g.value === linkedGroup) : null;

    const newEvent = {
      id: newEventId,
      title: newEventTitle || 'Untitled Event',
      start: newEventDetails.start,
      end: newEventDetails.end,
      color: getRandomColor(),
      type: eventType,
      ...(groupInfo && {
        linkedGroupChatId: linkedGroup,
        linkedGroupChatName: groupInfo.label,
      })
    };

    try {
      await addDoc(collection(db, 'users', user.uid, 'events'), newEvent);
      setEvents((prevEvents) => [...prevEvents, newEvent]);
      setNewEventTitle('');
      setNewEventDetails(null);
      setEventType('academic');
      setLinkedGroup('');
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

  const fetchGroupChats = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const db = getFirestore();

    const privateSnap = await getDocs(collection(db, `users/${user.uid}/joinedGroupChats`));
    const moduleSnap = await getDocs(collection(db, `module_chatrooms`));

    const privateRooms = privateSnap.docs.map(doc => ({ label: doc.data().name, value: doc.id }));
    const moduleRooms = moduleSnap.docs.map(doc => ({ label: `${doc.data().name} (Module)`, value: doc.id }));

    const options = [{ label: 'None', value: '' }, ...privateRooms, ...moduleRooms];
    setGroupChats(options);
  };

  const handleTypeOpen: React.Dispatch<React.SetStateAction<boolean>> = (o) => {
    setOpen(o);
    if (o) setGroupOpen(false);
  };
  
  const handleGroupOpen: React.Dispatch<React.SetStateAction<boolean>> = (g) => {
    setGroupOpen(g);
    if (g) setOpen(false);
  };
  

  useEffect(() => {
    fetchEvents();
    fetchGroupChats();
  }, []);

  const deleteEvent = async (eventId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated");
      return;
    }
    const db = getFirestore();
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'events', eventId));
      setEvents((prevEvents) => prevEvents.filter(event => event.id !== eventId));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleLongPress = (eventId: string) => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteEvent(eventId) }
      ],
      { cancelable: true }
    );
  };

  const renderEvent = (event: PackedEvent, size: SizeAnimation) => {
    return (
      <TouchableOpacity onLongPress={() => handleLongPress(event.id)}>
        <View style={{ padding: 3, backgroundColor: event.color, borderRadius: 5, width: '100%' }}>
          <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center', flexWrap: 'nowrap' }}>{event.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTitleModal = () => (
    <Modal visible={isModalVisible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ width: '80%', backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
          <TextInput
            placeholder="Enter event title"
            value={newEventTitle}
            onChangeText={setNewEventTitle}
            style={{ borderBottomWidth: 1, marginBottom: 20 }}
          />
          <View style={{ zIndex: 10 }}>
            <DropDownPicker
              open={open}
              value={eventType}
              items={items}
              setOpen={handleTypeOpen}
              setValue={setEventType}
              setItems={setItems}
              containerStyle={{ height: 40, marginBottom: 30 }}
              dropDownContainerStyle={{ backgroundColor: '#fafafa' }}
            />
          </View>
          <View style={{ zIndex: 5 }}>
            <DropDownPicker
              open={groupOpen}
              value={linkedGroup}
              items={groupChats}
              setOpen={handleGroupOpen}
              setValue={setLinkedGroup}
              placeholder="Link to Group Chat (optional)"
              containerStyle={{ height: 40, marginBottom: 20 }}
              dropDownContainerStyle={{ backgroundColor: '#fafafa' }}
            />
          </View>
          <Button title="Create Event" onPress={addEvent} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} />
        </View>
      </View>
    </Modal>
  );
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Pressable onPress={() => router.back()}><Text>Go Back</Text></Pressable>
      <>
        <CalendarContainer
          allowDragToEdit={false}
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
          <CalendarBody renderDraggingEvent={renderDraggingEvent} renderEvent={renderEvent} />
        </CalendarContainer>
        {renderTitleModal()}
      </>
    </SafeAreaView>
  );
};

export default Calendar;
