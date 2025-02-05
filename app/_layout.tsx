import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { auth } from '@/FirebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const segments = useSegments();
    
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (user) => {
      console.log('onAuthStateChanged', user);
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return () => subscriber();
  }, [initializing]);

  useEffect(() => {
    if(initializing) return;

    const inAuthGroup = segments[0]?.includes('(auth)');

    if (user && !inAuthGroup) {
      router.replace('/(auth)/home');
    } else if (!user && inAuthGroup) {
      router.replace('/');
    }


  },[user,initializing]);

  if (initializing) 
    return (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
    <ActivityIndicator size="large" />
  </View>
  
    );

  return (
    <Stack>
      <Stack.Screen name="index"  options={{headerShown:false}} />
      <Stack.Screen name="(auth)" options={{headerShown:false}} />
      <Stack.Screen name="(chatroom)/chatRoom" options={{headerShown:false}} />
      <Stack.Screen name="(log)" options={{ headerShown: false }} />
      <Stack.Screen name="(timetable)" options={{ headerShown: false }} />
      <Stack.Screen name="(chatbot)" options={{ headerShown: false }} />
    </Stack>
  );
}
