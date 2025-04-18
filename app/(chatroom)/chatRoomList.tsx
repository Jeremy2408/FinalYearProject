import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';

const ChatRoomList = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
       <BackButton />
        
      <Text style={styles.title}> Chatrooms</Text>

      <Pressable style={styles.card} onPress={() => router.push('/(chatroom)/chatRoom')}>
        <Text style={styles.cardTitle}>General Chatroom</Text>
        <Text style={styles.cardDesc}>Talk with other students in an open, anonymous space.</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push('/(chatroom)/moduleChatList')}>
        <Text style={styles.cardTitle}>Module Chatrooms</Text>
        <Text style={styles.cardDesc}>Join discussions specific to modules you’re taking.</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push('/(chatroom)/groupChatList')}>
        <Text style={styles.cardTitle}>Group Assignment Rooms</Text>
        <Text style={styles.cardDesc}>Private chats for small groups working on shared assignments.</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    padding: 16,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#444',
  },
});

export default ChatRoomList;
