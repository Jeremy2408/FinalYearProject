import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchOpenAIResponse } from '../../services/openaiService';
import { getFirestore, collection, addDoc, setDoc, doc, orderBy, getDocs, query } from 'firebase/firestore';
import { FIREBASE_APP } from '@/FirebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { Menu, Divider, Button, IconButton } from 'react-native-paper';
import { Modal, TouchableOpacity } from 'react-native';
import BackButton from '@/components/BackButton';


const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);


  const db = getFirestore(FIREBASE_APP);
  const auth = getAuth(FIREBASE_APP);
  const user = auth.currentUser;

  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;
  
      try {
        const db = getFirestore(FIREBASE_APP);
        const chatsRef = collection(db, `users/${user.uid}/chats`);
        const q = query(chatsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
  
        const formatted = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            _id: data._id || data.id,
            text: data.text,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            user: {
              _id: data.user?._id || 2,
              name: data.user?.name || 'AI Assistant',
              avatar: data.user?.avatar || 'https://placeimg.com/140/140/any',
            },
          };
        });
  
        setMessages(formatted);
      } catch (error) {
        console.error("Error loading messages from Firestore:", error);
      }
    };
  
    loadMessages();
  }, []);
  

  const clearChatCache = async () => {
    try {
      await AsyncStorage.removeItem('chat_messages');
      setMessages([
        {
          _id: 1,
          text: 'Hello! How are you feeling today?',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'AI Assistant',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
      ]);
    } catch (error) {
      console.error('Error clearing chat cache:', error);
    }
  };

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, newMessages)
    );

    const userMessage = newMessages[0]?.text;
    if (!userMessage) return;

    try {
      setTyping(true);

      const timestamp = new Date();
      const timestampStr = timestamp.toISOString().replace(/[-:.TZ]/g, '');
      const messageId = `${user.uid}_${timestampStr}`;

      await setDoc(doc(db, `users/${user.uid}/chats`, messageId), {
        id: messageId,
        text: newMessages[0].text,
        createdAt: timestamp,
        user: {
          _id: 1,
          name: 'You',
          avatar: '', 
        },
      });
      

      const botResponse = await fetchOpenAIResponse(userMessage);
      const botMessage: IMessage = {
        _id: `${user.uid}_bot_${timestampStr}`,
        text: botResponse,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Assistant',
          avatar: 'https://placeimg.com/140/140/any',
        },
      };

      setMessages((previousMessages) => {
        const updatedMessages = GiftedChat.append(previousMessages, [botMessage]);
        AsyncStorage.setItem('chat_messages', JSON.stringify(updatedMessages)).catch((error) =>
          console.error('Error saving messages to AsyncStorage:', error)
        );
        return updatedMessages;
      });

      await setDoc(doc(db, `users/${user.uid}/chats`, `${user.uid}_bot_${timestampStr}`), {
        id: `${user.uid}_bot_${timestampStr}`,
        text: botResponse,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Assistant',
          avatar: 'https://placeimg.com/140/140/any',
        },
      });
      

      AsyncStorage.setItem('chat_messages', JSON.stringify([...messages, botMessage])).catch(error =>
        console.error('Error saving messages to AsyncStorage:', error)
      );
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setTyping(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 }}>
        <BackButton />

          <IconButton
      icon="dots-vertical"
      size={30}
      iconColor="#007AFF"
      onPress={() => setOptionsVisible(true)}
    />
  
          <Modal
  visible={optionsVisible}
  animationType="fade"
  transparent
  onRequestClose={() => setOptionsVisible(false)}
>
  <TouchableOpacity
    style={{
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.3)',
    }}
    onPress={() => setOptionsVisible(false)}
    activeOpacity={1}
  >
    <View style={{
      backgroundColor: '#fff',
      paddingVertical: 16,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    }}>
      <Pressable onPress={clearChatCache} style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '500' }}> Clear Chat</Text>
      </Pressable>
      <Pressable onPress={() => {
        setOptionsVisible(false);
        router.push('/(chatbot)/chatHistory');
      }} style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '500' }}> View Chat History</Text>
      </Pressable>
    </View>
  </TouchableOpacity>
</Modal>
        </View>
      </SafeAreaView>
  
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{ _id: 1 }}
        isTyping={typing}
        keyboardShouldPersistTaps="handled"
        placeholder="Type a message..."
      />
    </View>
  );
}  

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default Chatbot;
