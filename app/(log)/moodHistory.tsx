import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { FIREBASE_APP } from '@/FirebaseConfig';
import { getAuth } from 'firebase/auth';

interface MoodLog {
    id: string;
    day: string;
    mood: string;
    timestamp: {
        seconds: number;
        nanoseconds: number;
    };
}

const MoodHistory = () => {
    const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
    const db = getFirestore(FIREBASE_APP);
    const auth = getAuth();
    const user = auth.currentUser;

    useEffect(() => {
        const fetchMoodLogs = async () => {
            if (user) {
                const q = query(collection(db, 'Moods'), where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);
                const logs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as MoodLog[];
                setMoodLogs(logs);
            }
        };

        fetchMoodLogs();
    }, [user]);

    const renderItem: ListRenderItem<MoodLog> = ({ item }) => (
        <View style={styles.logItem}>
            <Text style={styles.logText}>Day: {item.day}</Text>
            <Text style={styles.logText}>Mood: {item.mood}</Text>
            <Text style={styles.logText}>Timestamp: {new Date(item.timestamp.seconds * 1000).toLocaleString()}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mood History</Text>
            <FlatList
                data={moodLogs}
                renderItem={renderItem}
                keyExtractor={item => item.id}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        marginBottom: 16,
    },
    logItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    logText: {
        fontSize: 16,
    },
});

export default MoodHistory;