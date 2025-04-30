import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { auth } from '@/FirebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { View, ActivityIndicator } from "react-native";
import { Provider as PaperProvider } from 'react-native-paper';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import TrackPlayer from 'react-native-track-player';
import trackPlayerService from '../services/trackPlayerService';
import { LogBox } from 'react-native';



export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
  TrackPlayer.registerPlaybackService(() => trackPlayerService);
}, []);

useEffect(() => {
  LogBox.ignoreLogs([
    'defaultProps will be removed from function components',
    'IMGElement: Support for defaultProps',
    'TNodeChildrenRenderer: Support for defaultProps',
    ' MemoizedTNodeRenderer: Support for defaultProps',
  ]);
}, []);

    
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (user) => {
      console.log('onAuthStateChanged', user);
      setUser(user);

      if (user?.email) {
        const db = getFirestore();
        const userRef = doc(db, `users/${user.uid}`);
        setDoc(userRef, { email: user.email }, { merge: true });

      }

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
    <PaperProvider>
    <Stack>
      <Stack.Screen name="index"  options={{headerShown:false}} />
      <Stack.Screen name="(auth)" options={{headerShown:false}} />
      <Stack.Screen name="(chatroom)/chatRoom" options={{headerShown:false}} />
      <Stack.Screen name="(chatroom)/chatRoomList" options={{headerShown:false}} />
      <Stack.Screen name="(chatroom)/moduleChatList" options={{headerShown:false}} />
      <Stack.Screen name="(chatroom)/moduleChatRoom" options={{headerShown:false}} />
      <Stack.Screen name="(chatroom)/groupChatList" options={{headerShown:false}} />
      <Stack.Screen name="(chatroom)/groupChatRoom" options={{headerShown:false}} />
      <Stack.Screen name="(chatroom)/groupInvites" options={{headerShown:false}} />
      <Stack.Screen name="(log)" options={{ headerShown: false }} />
      <Stack.Screen name="(timetable)" options={{ headerShown: false }} />
      <Stack.Screen name="(chatbot)" options={{ headerShown: false }} />
      <Stack.Screen name="(analytics)/moodAnalytics" options={{ headerShown: false }} />
      <Stack.Screen name="oauthRedirect" options={{ headerShown: false }} />
      <Stack.Screen name="connectEmail" options={{ headerShown: false }} />
      <Stack.Screen name="(resources)/wellnessResources" options={{ headerShown: false }} />
      <Stack.Screen name="(relax)/RelaxPlaylistScreen" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(emailview)/viewEmail" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      


    </Stack>
    </PaperProvider>
  
  );
}
