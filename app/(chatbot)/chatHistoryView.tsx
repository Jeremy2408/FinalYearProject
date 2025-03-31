import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { auth } from '@/FirebaseConfig';

interface ChatMessage {
  _id: string;
  text: string;
  createdAt: { seconds: number };
  user: { _id: string; name: string };
}

const ChatHistoryView = () => {
  const { date } = useLocalSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !date || typeof date !== 'string') return;

      const db = getFirestore();
      const chatsRef = collection(db, `users/${user.uid}/chats`);
      const q = query(chatsRef, orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);

      const filteredMessages: ChatMessage[] = snapshot.docs
        .map(doc => doc.data() as ChatMessage)
        .filter(msg => {
          const msgDate = new Date(msg.createdAt.seconds * 1000).toLocaleDateString();
          return msgDate === date;
        });

      setMessages(filteredMessages);
    };

    fetchMessages();
  }, [date, user]);

  return (
    <View style={styles.container}>
        <Pressable onPress={() => router.back()}>
        <Text>Go Back</Text>
        </Pressable>
      <Text style={styles.title}>Chat from {date}</Text>
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.message, item.user._id === 'AI' ? styles.aiMessage : styles.userMessage]}>
            <Text style={styles.sender}>{item.user.name}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  userMessage: {
    backgroundColor: '#d0f0fd',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  sender: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  text: {
    fontSize: 15,
  },
});

export default ChatHistoryView;
