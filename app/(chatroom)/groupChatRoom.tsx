import React, { useEffect, useState, useCallback } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, getDocs } from 'firebase/firestore';
import { auth } from '@/FirebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import BackButton from '@/components/BackButton';

const GroupChatRoom = () => {
  const { roomId } = useLocalSearchParams();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [roomName, setRoomName] = useState('');
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const user = auth.currentUser;
  const db = getFirestore();
  const router = useRouter();
  const [userNameMap, setUserNameMap] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!roomId || typeof roomId !== 'string') return;

    const fetchRoomName = async () => {
      const roomRef = doc(db, `group_chatrooms/${roomId}`);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const data = roomSnap.data();
        setRoomName(data.name || 'Group Chat');
      }
    };
    const fetchMembers = async () => {
      const membersRef = collection(db, `group_chatrooms/${roomId}/members`);
      const snapshot = await getDocs(membersRef);

      const memberList = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const uid = docSnap.id;
        const userRef = doc(db, `users/${uid}`);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : null;

        return {
          id: uid,
          name: userData?.name || userData?.email || 'Unnamed User',
        };
      }));

      const nameMap = memberList.reduce((acc, member) => {
        acc[member.id] = member.name;
        return acc;
      }, {} as { [key: string]: string });

      setUserNameMap(nameMap);
      setMembers(memberList);
    };

    fetchRoomName();
    fetchMembers();

    const messagesRef = collection(db, `group_chatrooms/${roomId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userId = user?.uid;

    const messagesFirestore = snapshot.docs
      .map(doc => {
    const firebaseData = doc.data();
          const senderId = firebaseData.user?._id || 'unknown';

    const message: IMessage = {
      _id: doc.id,
      text: firebaseData.text,
      createdAt: firebaseData.createdAt?.toDate() || new Date(),
      user: {
              _id: senderId,
              name: userNameMap[senderId] || firebaseData.user?.name || 'System',
            },
    };

    if (firebaseData.hiddenFrom) {
      (message as any).hiddenFrom = firebaseData.hiddenFrom;
    }

    return message;
    })
    .filter(msg => !(msg as any).hiddenFrom?.includes(userId));

    setMessages(messagesFirestore);
    });

    return () => unsubscribe();
  }, [roomId, userNameMap]);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    if (!roomId || typeof roomId !== 'string') return;
  
    const msg = newMessages[0];
    const messageText = msg.text.trim();

  
    if (
      messageText.trim().toLowerCase().startsWith("/wellness") ||
      messageText.trim().toLowerCase() === "/resources"
        ) {
          const prompt = messageText.trim();
  
      await fetch("https://finalyearproject-production-ddac.up.railway.app/smart-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          roomId,
          roomType: "group", 
        }),
      });
  
      return; 
    }

    const messagesRef = collection(db, `group_chatrooms/${roomId}/messages`);
    await addDoc(messagesRef, {
      text: messageText,
      createdAt: serverTimestamp(),
      user: {
        _id: user?.uid || 'anonymous',
        name: user?.email || 'Anonymous',
      },
    });
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, [
        {
          _id: uuidv4(),
          text: messageText,
          createdAt: new Date(),
          user: {
            _id: user?.uid || 'anonymous',
            name: user?.email || 'You',
          },
        }
      ])
    );
  }, [roomId, user]);
  

  return (
    <SafeAreaView style={styles.container}>
       <BackButton />

      <View style={styles.header}>
      <Text style={styles.title}>{roomName}</Text>

        {members.length > 0 && (
          <Pressable onPress={() => setShowMemberModal(true)}>
            <Text style={styles.memberList}>
              {members.slice(0, 3).map(m => m.name).join(', ')}
              {members.length > 3 ? ` +${members.length - 3} more` : ''}
            </Text>
          </Pressable>
        )}
      </View>

      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{ _id: user?.uid || '', name: user?.email || 'Anonymous' }}
        renderUsernameOnMessage
      />

      {showMemberModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Group Members</Text>
            {members.map((m, idx) => (
              <Text key={idx} style={styles.modalItem}>{m.name}</Text>
            ))}
            <Pressable onPress={() => setShowMemberModal(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  back: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberList: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalItem: {
    fontSize: 16,
    marginBottom: 6,
  },
  modalClose: {
    marginTop: 15,
    color: 'red',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default GroupChatRoom;
