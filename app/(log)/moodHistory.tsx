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

const getRelativeTime = (timestamp: { seconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    const diff = (Date.now() - date.getTime()) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
};

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
            <Text style={styles.moodText}>Mood: {item.mood}</Text>
            <Text style={styles.timestamp}>{getRelativeTime(item.timestamp)}</Text>
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
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    logItem: {
        padding: 16,
        marginVertical: 8,
        backgroundColor: '#ffffff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    moodText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    timestamp: {
        fontSize: 14,
        color: '#777',
        marginTop: 4,
    },
});

export default MoodHistory;