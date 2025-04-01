import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

const Layout = () => {
  return (
<SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
    
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <Stack>
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="chatHistory" options={{ headerShown: false }} />
        <Stack.Screen name="chatHistoryView" options={{ headerShown: false }} />

      </Stack>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Layout;