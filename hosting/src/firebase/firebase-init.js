import { initializeApp } from "firebase/app";
import { getAuth, signOut, connectAuthEmulator, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDytcogmq5L0UO9k59A5bamvdir23rQAJY",
  authDomain: "egokaisaesultimatetcg.firebaseapp.com",
  projectId: "egokaisaesultimatetcg",
  storageBucket: "egokaisaesultimatetcg.firebasestorage.app",
  messagingSenderId: "251217603044",
  appId: "1:251217603044:web:7b655a1d68a4488f063ff1"
};

