import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Pressable } from 'react-native';
import { getFirestore, collection, addDoc, doc, setDoc, query, getDocs, where } from 'firebase/firestore';
import { FIREBASE_APP } from '@/FirebaseConfig';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/colors';
import FancyCard from '@/components/FancyCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';


const MoodLog = () => {
    const [mood, setMood] = useState('');
    const [submittedMood, setSubmittedMood] = useState(''); 
    const [numericScore, setNumericScore] = useState<number>(0);


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
          const db = getFirestore();
          const uid = user.uid;
      
          const memberships: { id: string; type: string }[] = [];
      
          const groupQuery = query(collection(db, 'group_chatrooms'), where('members', 'array-contains', uid));
          const groupSnap = await getDocs(groupQuery);
          groupSnap.forEach(doc => memberships.push({ id: doc.id, type: 'group' }));
      
          const moduleQuery = query(collection(db, 'module_chatrooms'), where('members', 'array-contains', uid));
          const moduleSnap = await getDocs(moduleQuery);
          moduleSnap.forEach(doc => memberships.push({ id: doc.id, type: 'module' }));
      
          const response = await fetch("http://finalyearproject-production-ddac.up.railway.app/predict", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: mood,
              linkedGroupMemberships: memberships,
              userId: uid 
            }),
          });
      
          const data = await response.json();
          const emotion = data.emotion || "unknown";
          const numericScore = data.numeric_sentiment_score || 0;
      
          setSubmittedMood(mood);
          setSubmittedEmotion(emotion);
          setMood('');
          setNumericScore(numericScore);
      
          const moodDocRef = doc(
            db,
            `users/${user.uid}/moods`,
            new Date().toISOString().split("T")[0]
          );
      
          await setDoc(moodDocRef, {
            mood: mood,
            emotion: emotion,
            numericSentimentScore: numericScore,
            day: getCurrentDay(),
            timestamp: new Date(),
          });
      
          Alert.alert("Success", `Mood submitted.`);
        } catch (error) {
          console.error("Error adding document: ", error);
          Alert.alert("Error", "Failed to submit mood");
        }
      };
      
    

    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.container}>
          <BackButton />

          <View style={{ marginBottom: 16, alignItems: 'center' }}>
            <MaterialCommunityIcons name="notebook-outline" size={32} color={colors.primary} />
            <Text style={styles.title}>Log Your Mood</Text>
            <Text style={styles.subtitle}>🗓️ Today is {getCurrentDay()}</Text>
          </View>

            <TextInput
                style={styles.input}
                multiline
                placeholder="How are you feeling today?"
                placeholderTextColor="#000"
                value={mood}
                onChangeText={setMood}
            />

            {submittedEmotion !== '' && (
          <FancyCard title="Mood Submitted" icon="emoticon-outline" style={{ marginVertical: 16 }}>
            <Text style={styles.resultText}>Submitted Mood: {submittedMood}</Text>
            <Text style={styles.resultText}>Detected Emotion: {submittedEmotion}</Text>
            <Text style={styles.resultText}>Sentiment Score: {numericScore > 0 ? '+' : ''}{numericScore}</Text>
          </FancyCard>

        )}

        <Pressable style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/(log)/moodHistory')}>
          <Text style={styles.secondaryButtonText}>View Mood History</Text>
        </Pressable>

      </SafeAreaView>
    </LinearGradient>

  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
      marginTop: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.muted,
      marginTop: 4,
      textAlign: 'center',
    },
    
    input: {
      minHeight: 100,
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
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
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 10,
    },
    
    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    
    secondaryButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    
});

export default MoodLog;





