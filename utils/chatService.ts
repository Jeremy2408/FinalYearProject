import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { IMessage } from 'react-native-gifted-chat';
import { FIREBASE_APP } from '@/FirebaseConfig';

const db = getFirestore(FIREBASE_APP);

export const fetchMessages = (setMessages: (messages: IMessage[]) => void) => {
  const chatRef = collection(db, 'chatroom/room1/messages');
  const q = query(chatRef, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      _id: doc.id,
      text: doc.data().text,
      createdAt: doc.data().timestamp.toDate(),
      user: {
        _id: doc.data().userId,
        name: doc.data().userId,
        avatar: `https://robohash.org/${doc.data().userId}.png`

        
      },
    }));
    setMessages(messages);
  });
};

export const sendMessage = async (message: IMessage, userId: string) => {
  const chatRef = collection(db, 'chatroom/room1/messages');

  try {
    await addDoc(chatRef, {
      text: message.text,
      userId: userId,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
