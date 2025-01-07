import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchOpenAIResponse } from '../../services/openaiService';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { FIREBASE_APP } from '@/FirebaseConfig';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const db = getFirestore(FIREBASE_APP);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const cachedMessages = await AsyncStorage.getItem('chat_messages');
        if (cachedMessages) {
          setMessages(JSON.parse(cachedMessages));
        } else {
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
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, []);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );

    const userMessage = newMessages[0]?.text;

    if (!userMessage) return;

    try {
      const botResponse = await fetchOpenAIResponse(userMessage);
      const botMessage: IMessage = {
        _id: Math.random().toString(36).substring(7),
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

      const dbPromises = [
        addDoc(collection(db, 'chats'), {
          ...newMessages[0],
          createdAt: new Date(),
        }),
        addDoc(collection(db, 'chats'), {
          ...botMessage,
          createdAt: new Date(),
        }),
      ];
      await Promise.all(dbPromises);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [messages]);

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{
          _id: 1,
        }}
        minComposerHeight={40}
        maxComposerHeight={80}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default Chatbot;
