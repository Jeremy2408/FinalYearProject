import { View, Text, Button, Pressable, FlexAlignType, FlatList, Dimensions } from "react-native";
import { auth } from '@/FirebaseConfig';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFirestore, collection, query, where, getDocs, onSnapshot, orderBy, limit, setDoc, doc, getDoc } from "firebase/firestore";
import { Card } from 'react-native-paper'; 
import useLiveWeeklyMoodData from '../hooks/useLiveWeeklyMoodData';
import { ScrollView } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { StyleSheet } from 'react-native';
import colors from '@/colors';
import { LinearGradient } from 'expo-linear-gradient';
import FancyTile from '@/components/FancyTile';
import FancyCard from '@/components/FancyCard';

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

const screenWidth = Dimensions.get('window').width;

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
    const [isInfoVisible, setInfoVisible] = useState(false);
    const [isEsiInfoVisible, setEsiInfoVisible] = useState(false);
    const [displayName, setDisplayName] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchDisplayName = async () => {
            if (!user) return;
    
            const db = getFirestore();
            const docRef = doc(db, "users", user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setDisplayName(data.name || null);
            }
        };
    
        fetchDisplayName();
    }, [user]);
    

    return (
        <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
                    <View>
                        <Text style={styles.greeting}>
                            {getGreeting()},{" "}
                            <Text style={styles.greetingName}>
                                {displayName || user?.email?.split('@')[0]}
                            </Text>
                        </Text>

                        <FancyCard title="Daily Motivation" icon="lightbulb-outline" style={{ marginTop: 10, marginBottom: 16 }}>
                            <Text style={{ fontStyle: 'italic', fontSize: 15, color: colors.text }}>
                                💡 {quote}
                            </Text>
                        </FancyCard>
                        
                        <View style={{ marginBottom: 10 }}>
                            <FancyCard title="Upcoming Events" icon="calendar">
                                {reminders.length > 0 ? (
                                    <FlatList
                                        data={reminders}
                                        keyExtractor={(item) => item.id}
                                        horizontal
                                        pagingEnabled
                                        showsHorizontalScrollIndicator={false}
                                        renderItem={({ item }) => {
                                            const eventDate = new Date(item.start.dateTime);
                                            return (
                                                <View style={{
                                                    width: screenWidth * 0.9,
                                                    marginHorizontal: screenWidth * 0.05,
                                                    padding: 16,
                                                    backgroundColor: item.type === "exam" ? "#ffcccc" :
                                                                    item.type === "lecture" ? "#ccffcc" : "#cce5ff",
                                                    borderRadius: 12,
                                                }}>
                                                    <Text style={{ fontWeight: "bold", fontSize: 16 }}>{item.title} ({item.type})</Text>
                                                    <Text>{eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString()}</Text>
                                                </View>
                                            );
                                        }}
                                    />
                                ) : (
                                    <Text>No upcoming events in the next 5 days.</Text>
                                )}
                            </FancyCard>
                        </View>

                        {recentMood && (
                            <FancyCard title="Most Recent Mood" icon="emoticon-happy-outline">
                                <Text>Mood: {recentMood.mood}</Text>
                                <Text>Emotion: {recentMood.emotion}</Text>
                                <Text>
                                    Score: {recentMood.numericSentimentScore > 0 ? '+' : ''}
                                    {recentMood.numericSentimentScore.toFixed(2)}
                                </Text>
                            </FancyCard>
                        )}

                        {!esiLoading && stabilityData && (
                            <FancyCard title="Emotion Stability Index" icon="brain">
                                <Pressable
                                    onPress={() => setEsiInfoVisible(true)}
                                    style={{ alignSelf: 'flex-start', marginBottom: 6 }}
                                >
                                    <MaterialIcons name="info-outline" size={18} color="gray" />
                                </Pressable>

                                <Text>Stability Score: {stabilityData.stability_index.toFixed(2)}</Text>
                                <Text>Burnout Risk: {stabilityData.burnout_risk}</Text>

                                {stabilityData.burnout_risk === "High" && (
                                    <Text style={{ color: 'red', fontWeight: 'bold', marginTop: 4 }}>
                                        High risk of burnout — take a break or reflect today.
                                    </Text>
                                )}
                            </FancyCard>
                        )}

                        <Modal isVisible={isEsiInfoVisible} onBackdropPress={() => setEsiInfoVisible(false)}>
                            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>
                                    What is the Emotion Stability Index?
                                </Text>
                                <Text style={{ fontSize: 14, marginBottom: 10 }}>
                                    The Emotion Stability Index (ESI) measures how emotionally consistent you've been over the past week.
                                    A high score means your emotions have been fluctuating a lot — which can be a sign of stress or burnout risk.
                                    Lower scores suggest more emotional balance.
                                </Text>
                                <Text style={{ fontSize: 14, marginBottom: 10 }}>
                                    This is calculated using a weighted mix of emotion variation and how frequently your mood shifts. Based on this score, the app also estimates your risk of burnout.
                                </Text>
                                <Button title="Got it" onPress={() => setEsiInfoVisible(false)} />
                            </View>
                        </Modal>

                        <FancyCard
                            title="Weekly Mood Summary (Past 7 Days)"
                            icon="calendar-outline"
                            style={{ marginBottom: 10 }}
                        >
                            <Pressable onPress={() => setInfoVisible(true)} style={{ alignSelf: 'flex-start', marginBottom: 6 }}>
                                <MaterialIcons name="info-outline" size={18} color="gray" />
                            </Pressable>

                            {averageScore !== null ? (
                                <Text style={{ fontSize: 16 }}>
                                    This week: Average Score {averageScore > 0 ? '+' : ''}{averageScore} — {moodLabel}
                                </Text>
                            ) : (
                                <Text style={{ fontSize: 16 }}>No mood data yet this week.</Text>
                            )}
                        </FancyCard>

                        <Modal isVisible={isInfoVisible} onBackdropPress={() => setInfoVisible(false)}>
                            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>
                                    What's this?
                                </Text>
                                <Text style={{ fontSize: 14 }}>
                                    This summary shows your average mood score from the last 7 calendar days. It’s a quick emotional snapshot for recent days.
                                </Text>
                                <Button title="Got it" onPress={() => setInfoVisible(false)} />
                            </View>
                        </Modal>

                        <View style={styles.tileGrid}>
                            {[
                                { label: 'Mood Log', icon: 'emoticon-outline' as const, route: '/(log)/moodLog' },
                                { label: 'Playlist', icon: 'music' as const, route: '/(relax)/RelaxPlaylistScreen' },
                                { label: 'Chatbot', icon: 'chat-outline' as const, route: '/(chatbot)/chat' },
                                { label: 'Timetable', icon: 'calendar-outline' as const, route: '/(timetable)/table' },
                                { label: 'Wellness', icon: 'heart-outline' as const, route: '/(resources)/wellnessResources' },
                                { label: 'More', icon: 'dots-horizontal' as const, route: '/more' },
                            ].map((item, index) => (
                                <FancyTile
                                    key={index}
                                    label={item.label}
                                    icon={item.icon}
                                    onPress={() => router.push(item.route as typeof router.push extends (path: infer P) => any ? P : never)}
                                />
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    tileGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    tile: {
        width: '47%',
        aspectRatio: 1,
        backgroundColor: '#d6e0ff', 
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    tileLabel: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
        
    },
    greeting: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
      },
      
      greetingName: {
        color: colors.primary,
        fontWeight: '700',
      },
      
});

export default Page;
