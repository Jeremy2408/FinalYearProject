import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Pressable } from 'react-native';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { FIREBASE_APP } from '@/FirebaseConfig';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const MoodLog = () => {
    const [mood, setMood] = useState('');
    const [submittedMood, setSubmittedMood] = useState(''); 

    const [submittedEmotion, setSubmittedEmotion] = useState('');

    const db = getFirestore(FIREBASE_APP);
    const auth = getAuth();
    const user = auth.currentUser;
    const router = useRouter();

    const getCurrentDay = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    };

    const handleSubmit = async () => {
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }
    
        if (!mood.trim()) {
            Alert.alert('Error', 'Please enter how you feel.');
            return;
        }
    
        try {
            const response = await fetch("http://localhost:8000/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: mood }),
            });
    
            const data = await response.json();
            const emotion = data.emotion || "unknown";
            setSubmittedMood(mood); 
            setSubmittedEmotion(emotion);
            setMood('');



    
            const moodDocRef = doc(
                db,
                `users/${user.uid}/moods`,
                new Date().toISOString().split("T")[0]
            );
    
            await setDoc(moodDocRef, {
                mood: mood,
                emotion: emotion,
                day: getCurrentDay(),
                timestamp: new Date(),
            });
    
            Alert.alert("Success", `Mood submitted.`);
            setMood('');
        } catch (error) {
            console.error("Error adding document: ", error);
            Alert.alert("Error", "Failed to submit mood");
        }
    };
    

    return (
        <SafeAreaView style={styles.container}>
            <Pressable onPress={() => router.back()}><Text>Go Back</Text></Pressable>
            
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

            {submittedEmotion !== '' && (
                <View style={styles.resultBox}>
                    <Text style={styles.resultText}>Submitted Mood: {submittedMood}</Text>
                    <Text style={styles.resultText}>Detected Emotion: {submittedEmotion}</Text>
                </View>
            )}

            <Button title="Submit" onPress={handleSubmit} />
            <Button title="View Mood History" onPress={() => router.push('/(log)/moodHistory')} />
        </SafeAreaView>
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
    resultBox: {
        marginVertical: 16,
        padding: 16,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
    },
    resultText: {
        fontSize: 16,
        marginBottom: 4,
    },
});

export default MoodLog;
