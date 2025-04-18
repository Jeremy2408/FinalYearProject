import React, { useEffect, useState, useCallback } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { auth } from '@/FirebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import BackButton from '@/components/BackButton';


const ModuleChatRoom = () => {
  const { roomId } = useLocalSearchParams();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const user = auth.currentUser;
  const db = getFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!roomId || typeof roomId !== 'string') return;

    const messagesRef = collection(db, `module_chatrooms/${roomId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: IMessage[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          _id: doc.id,
          text: data.text,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          user: data.user,
        };
      });
      setMessages(loadedMessages);
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
          roomType: "module",
        }),
      });
  
      return;
    }
  
    const messagesRef = collection(db, `module_chatrooms/${roomId}/messages`);
  
    await addDoc(messagesRef, {
      text: messageText,
      createdAt: serverTimestamp(),
      user: {
        _id: user?.uid || 'anonymous',
        name: user?.email || 'Student',
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

      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{ _id: user?.uid || 'anonymous', name: user?.email || 'Student' }}
        placeholder="Type your message..."
        showUserAvatar={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
      }, 
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  back: {
    fontSize: 16,
    color: '#007AFF',
  },
});

export default ModuleChatRoom;
