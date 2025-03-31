import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';

const Layout = () => {
  return (
<SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    
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