import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '@/FirebaseConfig';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

interface Invite {
  id: string;
  roomName: string;
  from: string;
  canInvite: boolean;
  status: string;
}

const GroupInvites = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const user = auth.currentUser;
  const db = getFirestore();
  const router = useRouter();

  useEffect(() => {
    const fetchInvites = async () => {
      if (!user) return;
      const snapshot = await getDocs(collection(db, `users/${user.uid}/invitations`));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invite));
      setInvites(data.filter(invite => invite.status === 'pending'));
    };

    fetchInvites();
  }, [user]);

  const handleAccept = async (invite: Invite) => {
    const groupId = invite.id;
    const roomName = invite.roomName;

    await setDoc(doc(db, `group_chatrooms/${groupId}/members/${user?.uid}`), {
      canInvite: invite.canInvite || false,
    });

    await setDoc(doc(db, `users/${user?.uid}/joinedGroupChats/${groupId}`), {
      name: roomName,
    });

    await setDoc(doc(db, `users/${user?.uid}/invitations/${groupId}`), {
      ...invite,
      status: 'accepted',
    });

    Alert.alert('You have joined the group!');
    setInvites(current => current.filter(i => i.id !== groupId));
    router.push({ pathname: '/(chatroom)/groupChatRoom', params: { roomId: groupId } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📨 Group Invitations</Text>
      {invites.length === 0 ? (
        <Text style={styles.empty}>You have no pending invites.</Text>
      ) : (
        <FlatList
          data={invites}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.roomName}>{item.roomName}</Text>
              <Text style={styles.fromText}>Invited by: {item.from}</Text>
              <Pressable style={styles.acceptButton} onPress={() => handleAccept(item)}>
                <Text style={styles.acceptText}>Accept</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  empty: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#f0f4ff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
  },
  fromText: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
  acceptButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default GroupInvites;
