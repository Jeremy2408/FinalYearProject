import React, { useEffect, useState, useCallback } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { auth } from '@/FirebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet } from 'react-native';

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
    const messagesRef = collection(db, `module_chatrooms/${roomId}/messages`);

    const writes = newMessages.map(msg =>
      addDoc(messagesRef, {
        text: msg.text,
        createdAt: serverTimestamp(),
        user: {
          _id: user?.uid || 'anonymous',
          name: user?.email || 'Student',
        },
      })
    );

    await Promise.all(writes);
  }, [roomId, user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <Pressable onPress={()=> router.back()}><Text>Go Back</Text></Pressable>
        <Text style={styles.title}>{roomId}</Text>
      </View>
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{ _id: user?.uid || 'anonymous', name: user?.email || 'Student' }}
        renderAvatar={null}
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
