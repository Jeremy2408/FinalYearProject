import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Text, FlatList } from 'react-native';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { auth } from '@/FirebaseConfig';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';

interface ChatMessage {
  _id: string;
  text: string;
  createdAt: { seconds: number };
  user: { _id: string; name: string };
}

interface ChatGroup {
  date: string;
  messages: ChatMessage[];
}

const ChatHistory = () => {
  const [groupedChats, setGroupedChats] = useState<ChatGroup[]>([]);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;

      const db = getFirestore();
      const chatsRef = collection(db, `users/${user.uid}/chats`);
      const q = query(chatsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const chats: ChatMessage[] = snapshot.docs.map(doc => doc.data() as ChatMessage);

      const groups: { [key: string]: ChatMessage[] } = {};
      chats.forEach(msg => {
        const date = new Date(msg.createdAt.seconds * 1000).toLocaleDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
      });

      const sortedGroups: ChatGroup[] = Object.entries(groups)
        .map(([date, messages]) => ({ date, messages }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setGroupedChats(sortedGroups);
    };

    fetchChats();
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
      <BackButton />

        <Text style={styles.title}>Chat History</Text>
      </View>

      <FlatList
        data={groupedChats}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <Pressable
            style={styles.chatCard}
            onPress={() =>
              router.push({
                pathname: '/(chatbot)/chatHistoryView',
                params: { date: item.date as string }
              })
            }
          >
            <Text style={styles.chatDate}>{item.date}</Text>
            <Text numberOfLines={1} style={styles.preview}>{item.messages[0]?.text}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  chatCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f0f4ff',
    marginBottom: 12,
  },
  chatDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  preview: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
});

export default ChatHistory;
