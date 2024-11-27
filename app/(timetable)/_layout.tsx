import { Stack } from "expo-router";

const Layout = () => {
    return (
        <Stack>
            <Stack.Screen name="table" options={{ headerShown: false }} />
        </Stack>
    );
};

export default Layout;