import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { FIREBASE_APP } from '@/FirebaseConfig';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';

const MoodLog = () => {
    const [mood, setMood] = useState('');
    const [day, setDay] = useState('');
    const db = getFirestore(FIREBASE_APP);
    const auth = getAuth();
    const user = auth.currentUser;
    const router = useRouter();

    const handleSubmit = async () => {
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday','Saturday','Sunday'];
        if (!validDays.includes(day)) {
            Alert.alert('Error', 'Please enter a valid day (Monday to Sunday)');
            return;
        }

        try {
            await addDoc(collection(db, 'Moods'), {
                mood: mood,
                day: day,
                timestamp: new Date(),
                userId: user?.uid,
            });
            Alert.alert('Success', 'Mood submitted successfully');
            setMood(''); // Clear the input after submission
            setDay(''); // Clear the day input after submission
        } catch (error) {
            console.error('Error adding document: ', error);
            Alert.alert('Error', 'Failed to submit mood');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Log Your Mood</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter day (Monday to Sunday)"
                placeholderTextColor="#000"
                value={day}
                onChangeText={setDay}
            />
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