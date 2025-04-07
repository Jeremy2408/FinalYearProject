import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, Alert, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp, getDoc, query, where } from 'firebase/firestore';
import { auth } from '@/FirebaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const GroupChatList = () => {
  const [groups, setGroups] = useState<{ id: string; name: string; canInvite: boolean }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCanInvite, setInviteCanInvite] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const [pendingInviteCount, setPendingInviteCount] = useState(0);
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

    const fetchInvites = async () => {
      if (!user) return;
      const snapshot = await getDocs(collection(db, `users/${user.uid}/invitations`));
      const pending = snapshot.docs.filter(doc => doc.data().status === 'pending');
      setPendingInviteCount(pending.length);
    };

    fetchUserGroups();
    fetchInvites();
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

  const openInviteModal = (groupId: string, groupName: string) => {
    setSelectedGroupId(groupId);
    setSelectedGroupName(groupName);
    setInviteModalVisible(true);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Please enter an email.');
      return;
    }

    const userQuery = query(collection(db, 'users'), where('email', '==', inviteEmail.trim().toLowerCase()));
    const snapshot = await getDocs(userQuery);

    if (snapshot.empty) {
      Alert.alert('No user found with that email.');
      return;
    }

    const inviteeDoc = snapshot.docs[0];
    const inviteeUid = inviteeDoc.id;

    await setDoc(doc(db, `users/${inviteeUid}/invitations/${selectedGroupId}`), {
      from: user?.email,
      roomName: selectedGroupName,
      canInvite: inviteCanInvite,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    setInviteModalVisible(false);
    setInviteEmail('');
    setInviteCanInvite(false);
    Alert.alert('Invite sent!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()}><Text>Go Back</Text></Pressable>
      
      <View style={styles.headerRow}>
        
        <Text style={styles.title}> Group Chatrooms</Text>
        <Pressable onPress={() => router.push('/(chatroom)/groupInvites')}>
          <Text style={styles.inviteLink}>View Invitations{pendingInviteCount > 0 ? ` (${pendingInviteCount})` : ''}</Text>
        </Pressable>
      </View>

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
              <Pressable style={styles.inviteIcon} onPress={() => openInviteModal(item.id, item.name)}>
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

      <Modal visible={inviteModalVisible} transparent animationType="slide">
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Invite to {selectedGroupName}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter user email"
            value={inviteEmail}
            onChangeText={setInviteEmail}
          />
          <View style={styles.switchRow}>
            <Text>Allow this user to invite others</Text>
            <Switch value={inviteCanInvite} onValueChange={setInviteCanInvite} />
          </View>
          <Pressable style={styles.modalButton} onPress={handleSendInvite}>
            <Text style={styles.modalButtonText}>Send Invite</Text>
          </Pressable>
          <Pressable onPress={() => setInviteModalVisible(false)}>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inviteLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 16,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
