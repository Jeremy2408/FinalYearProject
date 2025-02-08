import { View, Text, Button } from "react-native";
import { auth } from '@/FirebaseConfig';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { Card } from 'react-native-paper'; 


interface Event {
    id: string;
    title: string;
    type: string; 
    start: { dateTime: string };
}

const Page = () => {
    const [reminders, setReminders] = useState<Event[]>([]);
    const [quote, setQuote] = useState("Fetching your daily quote...");
    const user = auth.currentUser;
    const router = useRouter();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    useEffect(() => {
        const fetchUpcomingEvents = async () => {
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

            const querySnapshot = await getDocs(q);
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
        };

        fetchUpcomingEvents();
    }, []);

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

                <Button title="Go to Mood Log" onPress={() => router.push('/(log)/moodLog')} />
                <Button title="Timetable" onPress={() => router.push('/(timetable)/table')} />
                <Button title="Chatbot" onPress={() => router.push('/(chatbot)/chat')} />
                <Button title="Go to Chatroom" onPress={() => router.push('/(chatroom)/chatRoom')} />
                <Button title="Sign Out" onPress={() => auth.signOut()} />
            </View>
        </SafeAreaView>
    );
};

export default Page;
