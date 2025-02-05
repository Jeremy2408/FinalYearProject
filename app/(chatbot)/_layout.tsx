import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack } from 'expo-router';

const Layout = () => {
  return (
    
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <Stack>
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        
      </Stack>
    </KeyboardAvoidingView>
  );
};

export default Layout;