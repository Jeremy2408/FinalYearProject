import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getFirestore, collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { auth } from '@/FirebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/colors';

const ChatHistoryView = () => {
  const { date } = useLocalSearchParams();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !date || typeof date !== 'string') return;

      const db = getFirestore();
      const chatsRef = collection(db, `users/${user.uid}/chats`);
      const q = query(chatsRef, orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);

      const filteredMessages: IMessage[] = snapshot.docs
        .map(doc => {
          const msg = doc.data();
          return {
            _id: msg._id || msg.id || doc.id,
            text: msg.text,
            createdAt: msg.createdAt instanceof Timestamp
              ? msg.createdAt.toDate()
              : new Date(msg.createdAt),
            user: msg.user || { _id: 'unknown', name: 'Unknown' }, 
          } as IMessage;
        })
        .filter(msg => {
          const created = msg.createdAt;
          return (created instanceof Date ? created.toLocaleDateString() : new Date(created).toLocaleDateString()) === date;
        });

      setMessages(filteredMessages.reverse());
    };

    fetchMessages();
  }, [date, user]);

  return (
    <LinearGradient
    colors={[colors.gradientStart, colors.gradientEnd]}
    style={{ flex: 1 }}
>
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView style={styles.container}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <BackButton />

        </View>
        <GiftedChat
          messages={messages}
          user={{ _id: 1 }}
          onSend={() => {}}
          renderInputToolbar={() => null}
          isTyping={false}
        />
      </SafeAreaView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default ChatHistoryView;
