import { Stack } from "expo-router";
const Layout = () => {
    return (
        <Stack>
            <Stack.Screen name="moodLog" options={{ headerShown: false }} />
            <Stack.Screen name="moodHistory" options={{ headerShown: false }} />
            
        </Stack>
    );
};

export default Layout;