import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const BackButton = () => (
  <View style={styles.container}>
    <Pressable onPress={() => router.back()}>
      <Text style={styles.text}>← Back</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  text: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default BackButton;
