import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, Alert, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth } from '@/FirebaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const GroupChatList = () => {
  const [groups, setGroups] = useState<{ id: string; name: string; canInvite: boolean }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [roomName, setRoomName] = useState('');
  const router = useRouter();
  const db = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!user) return;
      const snapshot = await getDocs(collection(db, `users/${user.uid}/joinedGroupChats`));
      const groupList = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const groupId = docSnap.id;
          const groupData = docSnap.data();
          const memberRef = doc(db, `group_chatrooms/${groupId}/members/${user.uid}`);
          const memberSnap = await getDoc(memberRef);
          const canInvite = memberSnap.exists() ? memberSnap.data().canInvite : false;
      
          return {
            id: groupId,
            name: groupData.name,
            canInvite,
          };
        })
      );
            setGroups(groupList);
    };

    fetchUserGroups();
  }, [user]);

  const handleCreateGroup = async () => {
    if (!roomName.trim()) {
      Alert.alert('Please enter a group name.');
      return;
    }

    const newGroupRef = doc(collection(db, 'group_chatrooms'));
    const groupId = newGroupRef.id;

    await setDoc(newGroupRef, {
      name: roomName.trim(),
      createdBy: user?.uid,
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, `group_chatrooms/${groupId}/members/${user?.uid}`), {
      canInvite: true,
    });

    await setDoc(doc(db, `users/${user?.uid}/joinedGroupChats/${groupId}`), {
      name: roomName.trim(),
    });

    setModalVisible(false);
    setRoomName('');
    router.push({ pathname: '/(chatroom)/groupChatRoom', params: { roomId: groupId } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={()=> router.back()}><Text>Go Back</Text></Pressable>
        
      <Text style={styles.title}>Group Chatrooms</Text>

      <Pressable style={styles.createButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.createButtonText}>+ Create New Group</Text>
      </Pressable>

      <FlatList
            data={groups}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
            <View style={styles.groupRow}>
            <Pressable
                style={styles.groupCard}
                onPress={() => router.push({ pathname: '/(chatroom)/groupChatRoom', params: { roomId: item.id } })}
             >
        <Text style={styles.groupName}>{item.name}</Text>
            </Pressable>
      
            {item.canInvite && (
                <Pressable style={styles.inviteIcon} onPress={() => Alert.alert(`Invite to ${item.name}`)}>
                    <Ionicons name="person-add" size={24} color="#007AFF" />
                 </Pressable>
         )}
            </View>
  )}
    />


      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Create Group</Text>
          <TextInput
            style={styles.input}
            placeholder="Group Name"
            value={roomName}
            onChangeText={setRoomName}
          />
          <Pressable style={styles.modalButton} onPress={handleCreateGroup}>
            <Text style={styles.modalButtonText}>Create</Text>
          </Pressable>
          <Pressable onPress={() => setModalVisible(false)}>
            <Text style={{ marginTop: 10, color: 'red' }}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupCard: {
    flex: 1,
    backgroundColor: '#f0f4ff',
    padding: 14,
    borderRadius: 10,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
  },
  inviteIcon: {
    marginLeft: 10,
    padding: 8,
  },
  modalView: {
    marginTop: '40%',
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default GroupChatList;
