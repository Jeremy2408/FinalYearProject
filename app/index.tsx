import { Text, View, StyleSheet, KeyboardAvoidingView, TextInput, Button, ActivityIndicator, Pressable } from "react-native";
import { useState } from "react";
import { FIREBASE_AUTH, FIREBASE_DB } from "@/FirebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import React from "react";

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

    <View style={styles.container}>
    <KeyboardAvoidingView behavior="padding">
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
          <Button onPress={signUp} title="Create account" />
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>Already have an account? Log in</Text>
          </Pressable>
        </>
      )}
    </KeyboardAvoidingView>
  </View>
  );
}

const styles = StyleSheet.create({
container: {
marginHorizontal: 20,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
  marginVertical: 4,
  height: 50,
  borderWidth: 1,
  borderRadius: 4,
  padding: 10,
  backgroundColor: '#fff',
  },
  loginLink: {
    marginTop: 15,
    textAlign: 'center',
    color: '#007AFF',
    textDecorationLine: 'underline',
  }
});
