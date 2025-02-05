import { View, Text, Button } from "react-native";
import { auth } from '@/FirebaseConfig';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

const Page = () => {
    const [quote, setQuote] = useState("Fetching your daily quote...");
    const user = auth.currentUser;
    const router = useRouter();

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
