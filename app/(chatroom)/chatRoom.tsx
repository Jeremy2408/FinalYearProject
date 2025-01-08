import React, { useState, useEffect, useCallback } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { getAnonymousIdentifier } from '@/utils/anonymousIdentifier';
import { fetchMessages, sendMessage } from '@/utils/chatService';

const ChatroomScreen: React.FC = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [anonymousId, setAnonymousId] = useState<string>('');

  useEffect(() => {
    try {
      const id = getAnonymousIdentifier();
      setAnonymousId(id);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to generate anonymous ID:', error.message);
      }
    }

    const unsubscribe = fetchMessages(setMessages);
    return () => unsubscribe();
  }, []);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    const message = {
      ...newMessages[0],
      user: { _id: anonymousId, name: anonymousId , avatar: `https://robohash.org/${anonymousId}.png`, 
    },
    };

    await sendMessage(message, anonymousId);
  }, [anonymousId]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0} 
    >
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{ _id: anonymousId, name: anonymousId }}
        keyboardShouldPersistTaps="handled" 
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ChatroomScreen;
