import { initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDPWe9AaeetXYz8xLXOEMrOPAHrYlkPjF8",
    authDomain: "final-year-project-2bae1.firebaseapp.com",
    projectId: "final-year-project-2bae1",
    storageBucket: "final-year-project-2bae1.firebasestorage.app",
    messagingSenderId: "635808749527",
    appId: "1:635808749527:web:f9e33ccf69035cfd219d92"
  };

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);


export const auth: Auth = getAuth(FIREBASE_APP);

