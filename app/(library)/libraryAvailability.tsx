import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { getFirestore, collection, query, where, getDocs, onSnapshot, orderBy, limit, setDoc, doc, getDoc } from "firebase/firestore";
import FancyCard from '@/components/FancyCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/colors';
import BackButton from '@/components/BackButton';


const LibraryAvailabilityScreen = () => {
  const [rooms, setRooms] = useState<{ room: string; times: string[] }[]>([]);
  const [loading, setLoading] = useState(true);

  const lid = '3086'; // Aungier campus
  const date = new Date().toISOString().split('T')[0];
  const docId = `${lid}_${date}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = getFirestore();
        const docRef = doc(collection(db, 'libraryAvailability'), docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setRooms(data.rooms || []);
        } else {
          console.log('No availability data for today.');
          setRooms([]);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [docId]);
  const handleBookRoom = () => {
    Linking.openURL(`https://tudublin.libcal.com/spaces?lid=${lid}&gid=0`);
  };


  if (loading) {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
          <BackButton />
          <View className="flex-1 items-center justify-center">
            <Text className="text-base text-gray-100">Loading library availability...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (rooms.length === 0) {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
          <BackButton />
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-center text-base text-gray-100">
              No availability data found for today. Please check back later.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, padding: 16 }}>
        <BackButton />
        <ScrollView>
  
      {rooms.map((room, index) => (
        <FancyCard
        key={index}
        title={room.room}
        icon="book-open-page-variant"
        style={{ marginBottom: 16 }}
      >
        <Text style={{ color: '#555' }}>
          Available times: {room.times.join(', ')}
        </Text>
      </FancyCard>

      ))}

        <TouchableOpacity
          onPress={handleBookRoom}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 10,
          }}
        >
          <Text style={{ textAlign: 'center', color: 'white', fontWeight: '600', fontSize: 16 }}>
            Book a Room
          </Text>
        </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  </LinearGradient>
  );
};

export default LibraryAvailabilityScreen;
