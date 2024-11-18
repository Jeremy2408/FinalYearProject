import { View,Text, Button } from "react-native";
import { auth } from '@/FirebaseConfig';

const Page = () => {
    const user = auth.currentUser;
    return (
        <View>
            <Text>Welcome {user?.email}</Text>
            <Button title="Sign Out" onPress={() => auth.signOut()} />
        </View>
    );
    };
    export default Page;