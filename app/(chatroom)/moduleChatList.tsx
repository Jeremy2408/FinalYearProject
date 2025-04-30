import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, FlatList } from 'react-native';
import { getFirestore, collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { auth } from '@/FirebaseConfig';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/colors';
import FancyCard from '@/components/FancyCard';

const ModuleChatList = () => {
  const [moduleName, setModuleName] = useState('');
  const [existingRooms, setExistingRooms] = useState<{ id: string; name: string }[]>([]);
  const router = useRouter();
  const db = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchModules = async () => {
      const snapshot = await getDocs(collection(db, 'module_chatrooms'));
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.id, 
      }));
            setExistingRooms(rooms);
    };

    fetchModules();
  }, []);

  const handleJoinOrCreate = async () => {
    if (!moduleName.trim()) {
      Alert.alert('Please enter a module name.');
      return;
    }

    const normalizedName = moduleName.trim().toUpperCase();
    const roomRef = doc(db, 'module_chatrooms', normalizedName);
    const existing = await getDoc(roomRef);

    if (existing.exists()) {
      router.push({ pathname: '/(chatroom)/moduleChatRoom', params: { roomId: normalizedName } });
    } else {
      await setDoc(roomRef, {
        name: normalizedName,
        createdBy: user?.uid,
        createdAt: new Date(),
      });
      router.push({ pathname: '/(chatroom)/moduleChatRoom', params: { roomId: normalizedName } });
    }
  };

  return (
    <LinearGradient
    colors={[colors.gradientStart, colors.gradientEnd]}
    style={{ flex: 1 }}
  >
    <SafeAreaView style={styles.container}>
       <BackButton />
        
      <Text style={styles.title}> Module Chatrooms</Text>

        <TextInput
          style={{
            backgroundColor: '#fff',
            padding: 14,
            fontSize: 16,
            borderRadius: 12,
            elevation: 2,
            shadowColor: colors.black,
            shadowOpacity: 0.05,
            shadowRadius: 4,
            marginBottom: 12,
          }}
          placeholder="Enter module name"
          value={moduleName}
          onChangeText={setModuleName}
          autoCapitalize="characters"
        />

        <Pressable style={styles.button} onPress={handleJoinOrCreate}>
          <Text style={styles.buttonText}>Join / Create</Text>
        </Pressable>


        <Text style={styles.subtitle}>Active Module Chatrooms:</Text>
        <FlatList
          data={existingRooms}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <FancyCard title={item.name} icon="book-open-outline" style={{ marginBottom: 12 }}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/(chatroom)/moduleChatRoom', params: { roomId: item.id } })
                }
              >
                <Text style={{ color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' }}>
                  Enter Chat
                </Text>
              </Pressable>
            </FancyCard> 
        )}
      />
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  roomCard: {
    backgroundColor: '#f0f4ff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ModuleChatList;
