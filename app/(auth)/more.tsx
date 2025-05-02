import React from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth } from '@/FirebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BackButton from '@/components/BackButton';
import FancyTile from '@/components/FancyTile';
import FancyCard from '@/components/FancyCard';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/colors';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import Ionicons from '@expo/vector-icons/Ionicons'; 


const MoreScreen = () => {
  const router = useRouter();
  const [displayName, setDisplayName] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    const fetchName = async () => {
      const user = auth.currentUser;
      if (!user) return;
  
      const db = getFirestore();
      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setDisplayName(data.name || null);
      }
    };
  
    fetchName();
  }, []);

  const items: { label: string; icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name']; customIcon?: JSX.Element; route?: string; action?: () => void }[] = [
    {
      label: 'Connect Email',
      customIcon: <Ionicons name="logo-microsoft" size={32} color="#0078D4" />, 
      route: '/connectEmail',
    },
    { label: 'Chatrooms', icon: 'chat', route: '/(chatroom)/chatRoomList' },
    {
      label: 'Library Rooms',
      icon: 'book-open-page-variant',
      route: '/libraryAvailability',
    },
    
    { label: 'Sign Out', icon: 'logout', action: handleSignOut },
  ];

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <BackButton />
        <FancyCard title="More" icon="cog-outline" style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 }}>
          Logged in as: <Text style={{ color: colors.primary }}>{displayName || auth.currentUser?.email}</Text>
          </Text>
      <View style={styles.tileGrid}>
        {items.map((item, index) => (
          <FancyTile
            key={index}
            label={item.label}
            icon={item.icon || 'blank'}
            customIcon={item.customIcon}
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
    </FancyCard>
    </SafeAreaView>
   </LinearGradient>
  );
};

export default MoreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});
