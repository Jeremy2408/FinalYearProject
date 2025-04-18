import React, { useEffect, useState, useCallback } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { auth } from '@/FirebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import BackButton from '@/components/BackButton';

const GroupChatRoom = () => {
  const { roomId } = useLocalSearchParams();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [roomName, setRoomName] = useState('');
  const user = auth.currentUser;
  const db = getFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!roomId || typeof roomId !== 'string') return;

    const fetchRoomName = async () => {
      const roomRef = doc(db, `group_chatrooms/${roomId}`);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const data = roomSnap.data();
        setRoomName(data.name || 'Group Chat');
      }
    };

    fetchRoomName();

    const messagesRef = collection(db, `group_chatrooms/${roomId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userId = user?.uid;

    const messagesFirestore = snapshot.docs
      .map(doc => {
    const firebaseData = doc.data();

    const message: IMessage = {
      _id: doc.id,
      text: firebaseData.text,
      createdAt: firebaseData.createdAt?.toDate() || new Date(),
      user: firebaseData.user,
    };

    if (firebaseData.hiddenFrom) {
      (message as any).hiddenFrom = firebaseData.hiddenFrom;
    }

    return message;
    })
    .filter(msg => !(msg as any).hiddenFrom?.includes(userId));

    setMessages(messagesFirestore);

    });

    return () => unsubscribe();
  }, [roomId]);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    if (!roomId || typeof roomId !== 'string') return;
  
    const msg = newMessages[0];
    const messageText = msg.text.trim();
  
    if (
      messageText.trim().toLowerCase().startsWith("/wellness") ||
      messageText.trim().toLowerCase() === "/resources"
        ) {
          const prompt = messageText.trim();
  
      await fetch("https://finalyearproject-production-ddac.up.railway.app/smart-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          roomId,
          roomType: "group", 
        }),
      });
  
      return; 
    }
  
    const messagesRef = collection(db, `group_chatrooms/${roomId}/messages`);
    await addDoc(messagesRef, {
      text: messageText,
      createdAt: serverTimestamp(),
      user: {
        _id: user?.uid,
        name: user?.email || 'Anonymous',
      },
    });
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, [
        {
          _id: uuidv4(),
          text: messageText,
          createdAt: new Date(),
          user: {
            _id: user?.uid || 'anonymous',
            name: user?.email || 'You',
          },
        }
      ])
    );
    
  }, [roomId, user]);
  

  return (
    <SafeAreaView style={styles.container}>
       <BackButton />

      <View style={styles.header}>
      <Text style={styles.title}>{roomName}</Text>

      </View>
      
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{ _id: user?.uid || '', name: user?.email || 'Anonymous' }}
        renderUsernameOnMessage
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  back: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GroupChatRoom;
