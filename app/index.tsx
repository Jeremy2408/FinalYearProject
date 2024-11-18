import { Text, View,StyleSheet, KeyboardAvoidingView,TextInput,Button,ActivityIndicator } from "react-native";
import { useState } from "react";
import { FIREBASE_AUTH } from "@/FirebaseConfig"; 
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth= FIREBASE_AUTH;
  

  const signUp = async () => {
    setLoading(true);
    try {
      const response =await createUserWithEmailAndPassword(auth,email, password);
      console.log(response);
      alert('User created');
  } catch (e: any) {
    const error = e as FirebaseError;
    alert('Registration Failed' + error.message);
  } finally {
    setLoading(false);
  }
  };

  const signIn = async () => {
    setLoading(true);
    try {
      const response =await signInWithEmailAndPassword(auth,email, password);
      console.log(response);
  } catch (e: any) {
    const error = e as FirebaseError;
    alert('Sign In Failed' + error.message);
  } finally {
    setLoading(false);
  }

  };

  return (

    <View style={styles.container}>
    <KeyboardAvoidingView behavior="padding">
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
      {loading ? (
        <ActivityIndicator size={'small'} style={{ margin: 28 }} />
      ) : (
        <>
          <Button onPress={signIn} title="Login" />
          <Button onPress={signUp} title="Create account" />		
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
		justifyContent: 'center'
	},
	input: {
		marginVertical: 4,
		height: 50,
		borderWidth: 1,
		borderRadius: 4,
		padding: 10,
		backgroundColor: '#fff'
	}
});
