import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const OAuthRedirect = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log("OAuth Redirect Params:", params);
    setTimeout(() => {
      router.replace('/connectEmail');
    }, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirecting back to app...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18 }
});

export default OAuthRedirect;
