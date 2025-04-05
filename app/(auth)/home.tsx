import { View, Text, Button } from "react-native";
import { auth } from '@/FirebaseConfig';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFirestore, collection, query, where, getDocs, onSnapshot, orderBy, limit, setDoc, doc, getDoc } from "firebase/firestore";
import { Card } from 'react-native-paper'; 
import useLiveWeeklyMoodData from '../hooks/useLiveWeeklyMoodData';


interface Event {
    id: string;
    title: string;
    type: string; 
    start: { dateTime: string };
}
interface MoodLog {
    mood: string;
    emotion: string;
    numericSentimentScore: number;
    timestamp: { seconds: number; nanoseconds: number; };
}

const Page = () => {
    const [reminders, setReminders] = useState<Event[]>([]);
    const [quote, setQuote] = useState("Fetching your daily quote...");
    const user = auth.currentUser;
    const router = useRouter();
    const [averageScore, setAverageScore] = useState<number | null>(null);
    const [moodLabel, setMoodLabel] = useState('');
    const [recentMood, setRecentMood] = useState<MoodLog | null>(null);
    const weeklyData = useLiveWeeklyMoodData();
    const [stabilityData, setStabilityData] = useState<{ stability_index: number, burnout_risk: string } | null>(null);
    const [esiLoading, setEsiLoading] = useState(true);


    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };
    useEffect(() => {
        if (!user) return;
      
        const db = getFirestore();
        const moodsRef = collection(db, `users/${user.uid}/moods`);
        const q = query(moodsRef, orderBy("timestamp", "desc"), limit(7));
      
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const emotions = snapshot.docs
            .map(doc => doc.data().emotion)
            .filter(Boolean);
      
          if (emotions.length < 2) {
            console.warn("Not enough valid emotion entries for ESI.");
            setStabilityData(null);
            setEsiLoading(false);
            return;
          }
      
          try {
            const response = await fetch("http://finalyearproject-production-ddac.up.railway.app/stability-index", {
                method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ emotions }),
            });
      
            const data = await response.json();
      
            if (
              data.stability_index !== undefined &&
              data.burnout_risk !== undefined
            ) {
              setStabilityData(data);
      
              const todayId = new Date().toISOString().split("T")[0];
              const esiRef = doc(db, `users/${user.uid}/esi_history/${todayId}`);
      
              await setDoc(esiRef, {
                stability_index: data.stability_index,
                burnout_risk: data.burnout_risk,
                calculated_at: new Date().toISOString(),
              });
            } else {
              console.warn("Invalid ESI response:", data);
            }
          } catch (err) {
            console.error("ESI fetch/store failed:", err);
          } finally {
            setEsiLoading(false);
          }
        });
      
        return () => unsubscribe();
      }, [user]);
      
         

    useEffect(() => {
        if (weeklyData.length > 0) {
            const scores = weeklyData.map(item => item.score);
            const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
            setAverageScore(parseFloat(avg.toFixed(2)));

            if (avg > 0.2) setMoodLabel('Mostly Positive');
            else if (avg < -0.2) setMoodLabel('Mostly Negative');
            else setMoodLabel('Neutral');
        }
    }, [weeklyData]);

    useEffect(() => {
        if (!user) return;

        const db = getFirestore();
        const moodsRef = collection(db, `users/${user.uid}/moods`);
        const q = query(moodsRef, orderBy("timestamp", "desc"), limit(1));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data() as MoodLog;
                setRecentMood(data);
            }
        });

        return () => unsubscribe();
    }, [user]);


    useEffect(() => {
        
            if (!user) return;

            const db = getFirestore();
            const now = new Date();
            const fiveDaysLater = new Date();
            fiveDaysLater.setDate(now.getDate() + 5); 

            const q = query(
                collection(db, "users", user.uid, "events"),
                where("start.dateTime", ">=", now.toISOString()), 
                where("start.dateTime", "<=", fiveDaysLater.toISOString())
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const upcomingEvents: Event[] = querySnapshot.docs.map(doc => {
                    const data = doc.data() as Event;
                    return {
                        id: doc.id,
                        title: data.title,
                        type: data.type || "Event",
                        start: data.start
                    };
                });
    
                setReminders(upcomingEvents);
            });
    
            return () => unsubscribe(); 
        }, [user]);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const response = await fetch('https://zenquotes.io/api/random');
                const data = await response.json();
                setQuote(data[0].q);
            } catch (error) {
                console.error("Error fetching quote:", error);
                setQuote("Stay positive and keep moving forward!");
            }
        };
        fetchQuote();
    }, []);

    return (
        <SafeAreaView>
            <View>
                <Text>{getGreeting()}, {user?.email}</Text>

                <Text style={{ fontStyle: 'italic', marginVertical: 10 }}>💡 {quote}</Text>
                

                <Text style={{ fontWeight: "bold", fontSize: 18, marginTop: 10 }}>🔔 Upcoming Events:</Text>
                {reminders.length > 0 ? (
                    reminders.map((event) => {
                        const eventDate = new Date(event.start.dateTime);
                        return (
                            <Card key={event.id} style={{ margin: 10, padding: 10, backgroundColor: event.type === "exam" ? "#ffcccc" : event.type === "lecture" ? "#ccffcc" : "#cce5ff" }}>
                            <Text style={{ fontWeight: "bold", fontSize: 16 }}>{event.title} ({event.type})</Text>
                            <Text>{eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString()}</Text>
                        </Card>
                        );
                    })
                ) : (
                    <Text>No upcoming events in the next 5 days.</Text>
                )}

                {recentMood && (
                    <View style={{ backgroundColor: '#e0f7fa', padding: 14, borderRadius: 12, marginBottom: 10 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}> Most Recent Mood</Text>
                        <Text>Mood: {recentMood.mood}</Text>
                        <Text>Emotion: {recentMood.emotion}</Text>
                        <Text>Score: {recentMood.numericSentimentScore > 0 ? '+' : ''}{recentMood.numericSentimentScore.toFixed(2)}</Text>
                    </View>
                )}
                {!esiLoading && stabilityData && (
                    <View style={{ backgroundColor: '#fff3e0', padding: 16, borderRadius: 12, marginBottom: 10 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}> Emotion Stability Index</Text>
                        <Text>Stability Score: {stabilityData.stability_index.toFixed(2)}</Text>
                        <Text>Burnout Risk: {stabilityData.burnout_risk}</Text>

                        {stabilityData.burnout_risk === "High" && (
                        <Text style={{ color: 'red', fontWeight: 'bold', marginTop: 4 }}>
                        High risk of burnout — take a break or reflect today.
                        </Text>
                        )}
                    </View>     
                    )}


                <View style={{ backgroundColor: '#f0f4ff', padding: 16, borderRadius: 12, marginBottom: 10 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}> Weekly Mood Summary</Text>
                    {averageScore !== null ? (
                        <Text style={{ fontSize: 16 }}>
                            This week: Average Score {averageScore > 0 ? '+' : ''}{averageScore} — {moodLabel}
                        </Text>
                    ) : (
                        <Text style={{ fontSize: 16 }}>No mood data yet this week.</Text>
                    )}
                </View>

                <Button title="Go to Mood Log" onPress={() => router.push('/(log)/moodLog')} />
                <Button title="View Mood Analytics" onPress={() => router.push('/(analytics)/moodAnalytics')} />
                <Button title="Timetable" onPress={() => router.push('/(timetable)/table')} />
                <Button title="Chatbot" onPress={() => router.push('/(chatbot)/chat')} />
                <Button title="Go to Chatrooms" onPress={() => router.push('/(chatroom)/chatRoomList')} />
                <Button title="Sign Out" onPress={() => auth.signOut()} />
            </View>
        </SafeAreaView>
    );
};

export default Page;
