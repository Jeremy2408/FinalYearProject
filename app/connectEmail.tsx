
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Linking, ScrollView, StyleSheet, ActivityIndicator, Alert, Pressable, Modal, TouchableOpacity } from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import BackButton from '@/components/BackButton';

const BASE_URL = 'https://us-central1-final-year-project-2bae1.cloudfunctions.net';

export default function ConnectEmail() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);

  const db = getFirestore();

  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      if (url.startsWith("myapp://oauth")) {
        console.log("Redirected back from Microsoft:", url);
      }
    };
    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) setUid(user.uid);
    });
    return unsubscribe;
  }, []);

  const checkToken = async () => {
    if (!uid) return;
    const tokenDoc = await getDoc(doc(db, `users/${uid}/tokens/outlook`));
    if (tokenDoc.exists()) {
      const { expiresOn } = tokenDoc.data();
      const now = Date.now();
      if (expiresOn && now >= expiresOn) {
        setExpired(true);
        setConnected(false);
        setEmails([]);
      } else {
        setExpired(false);
        setConnected(true);
        fetchEmails();
      }
    } else {
      setConnected(false);
      setEmails([]);
    }
  };

  useFocusEffect(useCallback(() => { checkToken(); }, [uid]));

  const handleConnect = () => {
    const url = `${BASE_URL}/authOutlook?uid=${uid}&prompt=login`;
    Linking.openURL(url);
  };

  const fetchEmails = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/getOutlookEmails?uid=${uid}`);
      const data = await res.json();
      if (res.ok && data.value) {
        setEmails(data.value);
        setConnected(true);
      } else {
        console.log('No email data:', data);
        setConnected(false);
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.error("User not authenticated");
        return;
      }
      const tokenRef = doc(db, `users/${user.uid}/tokens/outlook`);
      await deleteDoc(tokenRef);
      setEmails([]);
      setConnected(false);
      setExpired(false);
      Alert.alert("Disconnected", "Outlook access has been revoked.");
    } catch (error) {
      console.error("Failed to disconnect Outlook:", error);
      Alert.alert("Error", "Something went wrong while disconnecting.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={styles.header}>
        <BackButton />

          <IconButton
            icon="dots-vertical"
            size={30}
            iconColor="#007AFF"
            onPress={() => setOptionsVisible(true)}
          />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.container}>
        {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}
        {!connected && !expired && (
          <Text style={styles.infoText}>No Outlook account connected.</Text>
        )}
        {expired && (
          <Text style={styles.warningText}>Token expired. Please reconnect Outlook.</Text>
        )}
        {connected && emails.length > 0 && (
          <View style={{ marginTop: 30 }}>
            <Text style={styles.subheading}>Latest Emails</Text>
            {emails.map((email, idx) => (
              <View key={idx} style={styles.emailCard}>
                <Text style={styles.subject}>{email.subject || '(No Subject)'}</Text>
                <Text>{email.from?.emailAddress?.name || 'Unknown sender'}</Text>
                <Text style={styles.preview}>{email.bodyPreview?.slice(0, 100)}...</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={optionsVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setOptionsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setOptionsVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <Pressable onPress={() => { setOptionsVisible(false); handleConnect(); }} style={styles.modalItem}>
              <Text style={styles.modalText}>Connect Outlook</Text>
            </Pressable>
            {connected && (
              <Pressable onPress={() => { setOptionsVisible(false); fetchEmails(); }} style={styles.modalItem}>
                <Text style={styles.modalText}>View Inbox</Text>
              </Pressable>
            )}
            <Pressable onPress={() => { setOptionsVisible(false); handleDisconnect(); }} style={styles.modalItem}>
              <Text style={styles.modalText}>Disconnect</Text>
            </Pressable>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    marginTop: 30,
    color: '#555',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    marginTop: 30,
    color: '#B00020',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emailCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  subject: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  preview: {
    color: '#555',
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalItem: {
    padding: 16,
  },
  modalText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
