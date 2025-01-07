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
      <Stack />
    </KeyboardAvoidingView>
  );
};

export default Layout;