import { View,Text, Button } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { auth } from '@/FirebaseConfig';
import { useRouter } from "expo-router";



const Page = () => {
    const user = auth.currentUser;
    const router = useRouter();

    return (
        <View>
            <Text>Welcome {user?.email}</Text>
            <Button title="Sign Out" onPress={() => auth.signOut()} />
            <Button title="Go to Mood Log" onPress={() => router.push('moodLog')} />
    
    
        </View>
    );
    };
    export default Page;