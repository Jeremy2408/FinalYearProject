import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { FIREBASE_APP } from '@/FirebaseConfig';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';

const MoodLog = () => {
    const [mood, setMood] = useState('');
    const db = getFirestore(FIREBASE_APP);
    const auth = getAuth();
    const user = auth.currentUser;
    const router = useRouter();

    const getCurrentDay = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    };

    const handleSubmit = async () => {
        try {
            await addDoc(collection(db, 'Moods'), {
                mood: mood,
                day: getCurrentDay(), 
                timestamp: new Date(),
                userId: user?.uid,
            });
            Alert.alert('Success', 'Mood submitted successfully');
            setMood(''); 
        } catch (error) {
            console.error('Error adding document: ', error);
            Alert.alert('Error', 'Failed to submit mood');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Log Your Mood</Text>
            <Text style={styles.subtitle}>Today is {getCurrentDay()}</Text>
            <TextInput
                style={styles.input}
                multiline
                placeholder="How are you feeling today?"
                placeholderTextColor="#000"
                value={mood}
                onChangeText={setMood}
            />
            
            <Button title="Submit" onPress={handleSubmit} />
            <Button title="View Mood History" onPress={() => router.push('/(log)/moodHistory')} />
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 16,
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 8,
        marginBottom: 16,
    },
});

export default MoodLog;
