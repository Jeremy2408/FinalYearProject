import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet,Alert, FlatList } from 'react-native';
import { getFirestore, collection, addDoc,getDocs,updateDoc,deleteDoc,doc,query,where } from 'firebase/firestore';
import { FIREBASE_APP } from '@/FirebaseConfig';
import { FIREBASE_DB } from '@/FirebaseConfig';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';

const MoodLog = () => {
    const [mood, setMood] = useState('');
    const db = getFirestore(FIREBASE_APP);
    const auth = getAuth();
    const user = auth.currentUser;
    const moodCollection = collection(db, 'moods');
    const router = useRouter();


   

    const handleSubmit = async () => {
        try {
            await addDoc(collection(db, 'Moods'), {
                mood: mood,
                timestamp: new Date(),
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
            <TextInput
                style={styles.input}
                multiline
                placeholder="How are you feeling today?"
                placeholderTextColor="#000"
                value={mood}
                onChangeText={setMood}
            />
            <Button title="Submit" onPress={handleSubmit} />
            <Button title="View Mood History" onPress={() => router.push('moodHistory')} />

          
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
        height: 100,
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 8,
        marginBottom: 16,
        textAlignVertical: 'top',
    },
    moodItem: {
        padding: 8,
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
    },
});

export default MoodLog;