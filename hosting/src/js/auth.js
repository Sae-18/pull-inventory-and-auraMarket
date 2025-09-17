
import { initializeApp } from "firebase/app";
import { getAuth, signOut, connectAuthEmulator, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, connectFirestoreEmulator } from "firebase/firestore";

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

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
connectFirestoreEmulator(db, "127.0.0.1", 8080);
connectAuthEmulator(auth, "http://127.0.0.1:9099");
const provider = new GoogleAuthProvider();





document.getElementById("googleLogin").addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then(async (result) => {
      console.log("Google signed in:", result.user);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          displayName: user.displayName || "Unnamed Beast",
          email: user.email || null,
          createdAt: new Date(),
          Aura: 0,
        });
        console.log("🔥 New user doc created immediately:", user.uid);
      }

      window.location.href = "http://localhost:5173/pull.html";
    })
    .catch(err => console.error(err));
});


const btnLogout = document.getElementById("logout-btn");

const logout = async () => {
  await signOut(auth);
  alert("User logged out")
}

btnLogout.addEventListener("click", logout);