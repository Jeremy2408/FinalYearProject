import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/colors';
import FancyCard from '@/components/FancyCard';


const ChatRoomList = () => {
  const router = useRouter();

  return (
    <LinearGradient
    colors={[colors.gradientStart, colors.gradientEnd]}
    style={{ flex: 1 }}
  >
    <SafeAreaView style={styles.container}>
       <BackButton />
        
      <Text style={styles.title}> Chatrooms</Text>

        <FancyCard title="General Chatroom" icon="account-group-outline" style={{ marginBottom: 16 }}>
          <Pressable onPress={() => router.push('/(chatroom)/chatRoom')}>
            <Text style={styles.cardDesc}>Talk with other students in an open, anonymous space.</Text>
          </Pressable>
        </FancyCard>
        <FancyCard title="Module Chatrooms" icon="book-open-variant" style={{ marginBottom: 16 }}>
          <Pressable onPress={() => router.push('/(chatroom)/moduleChatList')}>
            <Text style={styles.cardDesc}>
              Join discussions specific to modules you’re taking.
            </Text>
          </Pressable>
        </FancyCard>
        <FancyCard title="Group Assignment Rooms" icon="account-multiple-check" style={{ marginBottom: 16 }}>
          <Pressable onPress={() => router.push('/(chatroom)/groupChatList')}>
            <Text style={styles.cardDesc}>
              Private chats for small groups working on shared assignments.
            </Text>
          </Pressable>
        </FancyCard>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
