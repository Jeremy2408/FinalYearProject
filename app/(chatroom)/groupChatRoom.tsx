import { router } from 'expo-router';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

const GroupChatRoom = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Pressable onPress={()=> router.back()}><Text>Go Back</Text></Pressable>
        
      <Text> Group Chatroom Placeholder</Text>
    </View>
  );
};

export default GroupChatRoom;
