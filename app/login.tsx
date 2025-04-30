import { Text, View, StyleSheet, KeyboardAvoidingView, TextInput, ActivityIndicator, Pressable,Image } from "react-native";
import { useState } from "react";
import { FIREBASE_AUTH } from "@/FirebaseConfig";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from "expo-router";
import React from "react";
import GradientBackground from '@/components/GradientBackground';
import colors from '@/colors';
const appLogo = require('../assets/images/appLogo.png');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;
  const router = useRouter();

  const signIn = async () => {
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log(response);
    } catch (e: any) {
      alert('Sign In Failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Image source={appLogo} style={styles.logo} />

        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Welcome back </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={colors.muted}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="small" style={{ marginTop: 20 }} />
        ) : (
          <>
            <Pressable style={styles.button} onPress={signIn}>
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.loginLink}>Don't have an account? Sign up</Text>
            </Pressable>
          </>
        )}
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: colors.muted,
    marginBottom: 20,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    marginTop: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  logo: {
    width: 265,               
    height: 265,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 24,
  },

});
