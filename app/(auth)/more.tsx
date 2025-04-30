import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth } from '@/FirebaseConfig';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import BackButton from '@/components/BackButton';
import Animated, { FadeInUp } from 'react-native-reanimated';
import FancyTile from '@/components/FancyTile';

const MoreScreen = () => {
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => auth.signOut(),
      },
    ]);
  };

  const items: { label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; route?: string; action?: () => void }[] = [
    { label: 'Connect Email', icon: 'email', route: '/connectEmail' },
    { label: 'Chatrooms', icon: 'chat', route: '/(chatroom)/chatRoomList' },
    { label: 'Sign Out', icon: 'logout', action: handleSignOut },
  ];

  return (
    <SafeAreaView style={styles.container}>
        <BackButton />
      <Text style={styles.heading}>⚙️ More</Text>
      <View style={styles.tileGrid}>
        {items.map((item, index) => (
          <FancyTile
            key={index}
            label={item.label}
            icon={item.icon}
            iconSize={32}
            fontSize={16} 
            allowWrap={false} 
            onPress={() =>
              item.route
                ? router.push(item.route as typeof router.push extends (path: infer P) => any ? P : never)
                : item.action?.()
            }
          />
        ))}
        <FancyTile
          label="Mood Analytics"
          icon="chart-line"
          iconSize={32} 
          fontSize={16} 
          allowWrap={true}
          onPress={() => router.push('/(analytics)/moodAnalytics')}
        />
      </View>
    </SafeAreaView>
  );
};

export default MoreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  menu: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  tile: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#e0e7ff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tileLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  
});
