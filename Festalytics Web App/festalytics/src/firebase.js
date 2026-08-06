// Import required Firebase functions
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkIPEnO-REY3QyXlrPZF5NZBKl6cVsBfI",
  authDomain: "festalytics-1940a.firebaseapp.com",
  projectId: "festalytics-1940a",
  // Use canonical bucket name for Firebase Web SDK uploads.
  storageBucket: "festalytics-1940a.appspot.com",
  messagingSenderId: "36603711850",
  appId: "1:36603711850:web:da23fd8ec9009fe2a01513"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
// Initialize Authentication
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
