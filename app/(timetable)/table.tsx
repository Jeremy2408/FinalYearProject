import React, { useCallback, useEffect, useState } from 'react';
import { CalendarBody, CalendarContainer, CalendarHeader, DraggingEvent, DraggingEventProps, OnCreateEventResponse, PackedEvent, SizeAnimation } from '@howljs/calendar-kit';
import { View, Modal, TextInput, Button, SafeAreaView, Pressable, Text, Alert, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { collection, addDoc, getFirestore, getDocs, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { router } from 'expo-router';
import { RRule } from 'rrule';
import { configureReanimatedLogger } from 'react-native-reanimated';
import { IconButton } from 'react-native-paper';
import BackButton from '@/components/BackButton';

configureReanimatedLogger({
  // Removed invalid property 'disableForMessage' as it does not exist in 'LoggerConfig'
});

const Calendar = () => {

  const [events, setEvents] = useState<any[]>([]);


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

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const weekDays = [
    { label: 'Mon', value: 'MO' },
    { label: 'Tue', value: 'TU' },
    { label: 'Wed', value: 'WE' },
    { label: 'Thu', value: 'TH' },
    { label: 'Fri', value: 'FR' },
    { label: 'Sat', value: 'SA' },
    { label: 'Sun', value: 'SU' },
  ];

  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<any[]>([]);

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventGroup, setEventGroup] = useState('');
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);



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

    const groupInfo = eventGroup ? groupChats.find(g => g.value === eventGroup) : null;

    const recurrenceRule = selectedDays.length > 0
      ? `RRULE:FREQ=WEEKLY;BYDAY=${selectedDays.join(',')}`
      : '';

    const newEvent = {
      id: newEventId,
      title: newEventTitle || 'Untitled Event',
      start: newEventDetails.start,
      end: newEventDetails.end,
      color: getRandomColor(),
      type: eventType,
      ...(recurrenceRule && { recurrenceRule }),
      ...(groupInfo && {
        linkedGroupChatId: eventGroup,
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
      setSelectedDays([]);
      setModalVisible(false);
    } catch (error) {
      console.error("Error saving event to Firestore:", error);
    }
  };

  const fetchEvents = async (): Promise<any[] | undefined> => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated");
      return;
    }
    const db = getFirestore();
    try {
      const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'events'));
      const userEvents: any[] = [];

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const baseEvent = {
          title: data.title,
          color: data.color,
          type: data.type,
          location: data.location || '',
          originalId: doc.id,
          linkedGroupChatId: data.linkedGroupChatId || '',
          linkedGroupChatName: data.linkedGroupChatName || '',
        };

        if (data.recurrenceRule) {
          const startDate = new Date(data.start.dateTime);
          const endDate = new Date(data.end.dateTime);
          const durationMs = endDate.getTime() - startDate.getTime();

          const rule = RRule.fromString(data.recurrenceRule);
          const occurrences = rule.between(new Date(), new Date(Date.now() + 1000 * 60 * 60 * 24 * 30));

          occurrences.forEach((occurrence, idx) => {
            userEvents.push({
              ...baseEvent,
              id: `${doc.id}_${idx}`,
              start: { dateTime: occurrence.toISOString() },
              end: { dateTime: new Date(occurrence.getTime() + durationMs).toISOString() },
              location: data.location || '',

            });
          });
        } else {
          userEvents.push({
            id: doc.id,
            title: data.title,
            start: data.start,
            end: data.end,
            color: data.color,
            location: data.location || '',
            linkedGroupChatId: data.linkedGroupChatId || '',
            linkedGroupChatName: data.linkedGroupChatName || '',

          });
        }
      });
      setEvents(userEvents);
      return userEvents;

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

  const handleTypeOpen = (o: React.SetStateAction<boolean>) => {
    const value = typeof o === 'function' ? o(false) : o;
    setOpen(o);
    if (value) setGroupOpen(false);
  };

  const handleGroupOpen = (g: React.SetStateAction<boolean>) => {
    const value = typeof g === 'function' ? g(false) : g;
    setGroupOpen(g);
    if (value) setOpen(false);
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
    const baseId = eventId.includes('_') ? eventId.split('_')[0] : eventId;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'events', baseId));
      setEvents((prevEvents) => prevEvents.filter(event => !event.id.startsWith(baseId)));
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
  const handleLinkSave = async () => {
    console.log(" handleLinkSave triggered");

    if (!selectedEvent) {
      console.log(" No selectedEvent");
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.log(" No user");
      return;
    }

    const db = getFirestore();
    const groupInfo = groupChats.find((g) => g.value === eventGroup);

    const updatePayload = {
      linkedGroupChatId: eventGroup,
      linkedGroupChatName: groupInfo?.label || '',
    };

    try {
      const eventsRef = collection(db, 'users', user.uid, 'events');
      const snapshot = await getDocs(eventsRef);

      const batch = writeBatch(db);
      const affectedIds: string[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.title === selectedEvent.title) {
          const docRef = doc(db, 'users', user.uid, 'events', docSnap.id);
          batch.update(docRef, updatePayload);
          affectedIds.push(docSnap.id);
        }
      });

      await batch.commit();
      console.log(" Firestore update successful for:", affectedIds);

      setEvents((prevEvents) =>
        prevEvents.map((ev) => {
          const baseId = ev.originalId || ev.id.split('_')[0];
          return affectedIds.includes(baseId)
            ? { ...ev, ...updatePayload }
            : ev;
        })
      );

      setSelectedEvent((prev: any) => ({
        ...prev,
        ...updatePayload,
      }));

      setGroupOpen(false);
      setShowSaveButton(false);
      setShowEventModal(false);
    } catch (error) {
      console.error(" Firestore update failed:", error);
    }
  };





  const handleEventPress = (event: PackedEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const renderEvent = (event: PackedEvent, size: SizeAnimation) => {
    return (
      <TouchableOpacity
        onPress={() => handleEventPress(event)}
        onLongPress={() => handleLongPress(event.id)}
      >
        <View style={{
          padding: 3,
          backgroundColor: event.color,
          borderRadius: 5,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: 12
            }}
            numberOfLines={2}
          >
            {event.title}
          </Text>
          {event.linkedGroupChatName && (
            <Text
              style={{
                color: 'white',
                fontSize: 10,
                textAlign: 'center',
                marginTop: 2
              }}
              numberOfLines={1}
            >
              {event.linkedGroupChatName}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };



  const handleCourseSearch = async () => {
    setLoadingResults(true);
    try {
      const response = await fetch('https://us-central1-final-year-project-2bae1.cloudfunctions.net/importTimetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: searchQuery,

        }),
      });

      const data = await response.json();

      if (data.searchResults) {
        setSearchResults(data.searchResults);
      } else if (data.events) {
        await saveEventsToFirestore(data.events);
        fetchEvents();
        setShowImportModal(false);
      }
    } catch (err) {
      console.error("Error searching:", err);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleCourseSelect = async (course: any) => {
    try {
      const response = await fetch('https://us-central1-final-year-project-2bae1.cloudfunctions.net/fetchTimetableByIdentity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: course.identity,
          categoryTypeIdentity: course.categoryTypeIdentity,

        }),
      });

      const data = await response.json();
      if (data.events) {
        setPreviewEvents(data.events);
      }
    } catch (err) {
      console.error("Error fetching timetable:", err);
    }
  };

  const saveEventsToFirestore = async (eventList: any[]) => {
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore();

    if (!user) return;

    for (const event of eventList) {
      await addDoc(collection(db, 'users', user.uid, 'events'), {
        ...event,
        color: '#4285F4',
      });
    }
  };

  const handleSavePreview = async () => {
    await saveEventsToFirestore(previewEvents);
    fetchEvents();
    setPreviewEvents([]);
    setSearchResults([]);
    setShowImportModal(false);
  };

  const clearAcademicTimetable = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const db = getFirestore();

    try {
      const snapshot = await getDocs(collection(db, 'users', user.uid, 'events'));
      const deletions = snapshot.docs.filter(doc => doc.data().type === 'academic');

      await Promise.all(deletions.map(docSnap => {
        return deleteDoc(doc(db, 'users', user.uid, 'events', docSnap.id));
      }));

      fetchEvents();
      Alert.alert("Timetable cleared", "All academic events have been deleted.");
    } catch (error) {
      console.error("Error clearing timetable:", error);
      Alert.alert("Error", "Something went wrong while clearing timetable.");
    }
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
              value={eventGroup}
              items={groupChats}
              setOpen={setGroupOpen}
              setValue={setEventGroup}
              placeholder="Select a group"
              containerStyle={{ marginBottom: 10 }}
              dropDownContainerStyle={{ backgroundColor: '#fafafa' }}
              onChangeValue={() => {
                console.log("Group selected");
                setShowSaveButton(true);
              }}
            />

          </View>

          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Repeat Weekly On:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            {weekDays.map((day) => (
              <TouchableOpacity
                key={day.value}
                onPress={() => {
                  setSelectedDays((prev) =>
                    prev.includes(day.value)
                      ? prev.filter((d) => d !== day.value)
                      : [...prev, day.value]
                  );
                }}
                style={{
                  backgroundColor: selectedDays.includes(day.value) ? '#4285F4' : '#ccc',
                  borderRadius: 20,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  margin: 4,
                }}
              >
                <Text style={{ color: 'white' }}>{day.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button title="Create Event" onPress={addEvent} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} />
        </View>
      </View>
    </Modal>

  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 }}>
      <BackButton />


  <IconButton
    icon="dots-vertical"
    size={28}
    iconColor="#007AFF"
    onPress={() => setMenuVisible(true)}
  />
</View>

<Modal
  visible={menuVisible}
  animationType="fade"
  transparent
  onRequestClose={() => setMenuVisible(false)}
>
  <TouchableOpacity
    style={{
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.3)',
    }}
    onPress={() => setMenuVisible(false)}
    activeOpacity={1}
  >
    <View style={{
      backgroundColor: '#fff',
      paddingVertical: 16,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    }}>
      <Pressable
        onPress={() => {
          setMenuVisible(false);
          setShowImportModal(true);
        }}
        style={{ padding: 16 }}
      >
        <Text style={{ fontSize: 16, fontWeight: '500' }}> Import Timetable</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          setMenuVisible(false);
          Alert.alert(
            "Clear Timetable?",
            "This will delete all academic events.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: clearAcademicTimetable }
            ]
          );
        }}
        style={{ padding: 16 }}
      >
        <Text style={{ fontSize: 16, fontWeight: '500' }}> Clear Timetable</Text>
      </Pressable>
    </View>
  </TouchableOpacity>
</Modal>


        <Modal visible={showImportModal} animationType="slide" transparent>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          >
            <View
              style={{
                width: '80%',
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 10,
              }}
            >
              <TextInput
                placeholder="Enter course code (e.g. TU914)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ borderBottomWidth: 1, marginBottom: 10 }}
              />
              <Button
                title="Search"
                onPress={handleCourseSearch}
                disabled={loadingResults}
              />

              <ScrollView style={{ maxHeight: 200 }}>
                {searchResults.map((result, index) => (
                  <TouchableOpacity key={index} onPress={() => handleCourseSelect(result)}>
                    <Text style={{ padding: 8 }}>{result.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>


              {previewEvents.length > 0 && (
                <ScrollView style={{ maxHeight: 200, marginTop: 10 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
                    Timetable Preview:
                  </Text>
                  {[...new Set(previewEvents.map((e) => e.title))].map((title, index) => (
                    <Text key={index}> {title}</Text>
                  ))}

                  <Button title="Save to Calendar" onPress={handleSavePreview} />
                </ScrollView>
              )}

              <Button title="Close" onPress={() => setShowImportModal(false)} />
            </View>
          </View>
        </Modal>

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

        <Modal visible={showEventModal} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, flexShrink: 1 }}>
                  {selectedEvent?.title}
                </Text>


              </View>

              <Text>🕒 {new Date(selectedEvent?.start?.dateTime).toLocaleString()} → {new Date(selectedEvent?.end?.dateTime).toLocaleString()}</Text>
              {selectedEvent?.location && (
                <Text>🏫 Room: {selectedEvent.location}</Text>
              )}

              {selectedEvent?.linkedGroupChatId ? (
                <>
                  <Text style={{ marginTop: 10, fontStyle: 'italic' }}>
                    Linked to: {selectedEvent.linkedGroupChatName || 'Unknown group'}
                  </Text>
                  <Button title="Change Group Link" onPress={() => setGroupOpen(true)} />
                </>
              ) : (
                <Button title="Link to Group Chat" onPress={() => setGroupOpen(true)} />
              )}

              {groupOpen && (
                <>
                  <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Select a Group:</Text>
                  <FlatList
                    data={groupChats}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setEventGroup(item.value);
                          setShowSaveButton(true);
                        }}
                        style={{
                          padding: 10,
                          backgroundColor: eventGroup === item.value ? '#ddd' : '#f9f9f9',
                          marginBottom: 5,
                          borderRadius: 5,
                        }}
                      >
                        <Text>{item.label}</Text>
                      </TouchableOpacity>
                    )}
                  />

                  {showSaveButton && (
                    <>
                      <Button title="Save Link" onPress={handleLinkSave} />
                      <Button
                        title="Cancel"
                        onPress={() => {
                          setGroupOpen(false);
                          setShowSaveButton(false);
                        }}
                      />
                    </>
                  )}
                </>
              )}





              <Button title="Close" onPress={() => setShowEventModal(false)} />
            </View>
          </View>
        </Modal>



      </>
    </SafeAreaView>
  );
};

export default Calendar;
