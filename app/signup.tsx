import { Text, View, StyleSheet, KeyboardAvoidingView, TextInput, Button, ActivityIndicator, Pressable,Image } from "react-native";
import { useState } from "react";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/FirebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import React from "react";
import GradientBackground from '@/components/GradientBackground';
import colors from "@/colors";
const appLogo = require('../assets/images/appLogo.png');




export default function Index() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');


  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;
  const db = FIREBASE_DB;
  const router = useRouter();

  const signUp = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      console.log(response);
      await setDoc(doc(db, "users", response.user.uid), {
        name: name,
        email: email,
        createdAt: new Date()
      });
      alert('User created');
    } catch (e: any) {
      alert('Registration Failed: ' + e.message);    
    } finally {
      setLoading(false);
    }
  };

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

    <View style={styles.container}>
    <KeyboardAvoidingView behavior="padding">
    <Image source={appLogo} style={styles.logo} />

    <Text style={styles.title}>Create Account</Text>
    <Text style={styles.subtitle}>Start your wellness journey </Text>
    <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor="#000"
        />
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor="#000"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor="#000"
      />
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Confirm Password"
          placeholderTextColor="#000"
        />

      {loading ? (
        <ActivityIndicator size="small" style={{ margin: 28 }} />
      ) : (
        <>
          <Pressable style={styles.button} onPress={signUp}>
            <Text style={styles.buttonText}>Create Account</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>Already have an account? Log in</Text>
          </Pressable>
        </>
      )}
    </KeyboardAvoidingView>
  </View>
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
