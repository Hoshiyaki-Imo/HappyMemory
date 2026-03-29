import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA4aHmGvuWDL9tqxPw3iuOyZ3IerFymTQk",
  authDomain: "happy-memory-hoshiyakiimo.firebaseapp.com",
  projectId: "happy-memory-hoshiyakiimo",
  storageBucket: "happy-memory-hoshiyakiimo.firebasestorage.app",
  messagingSenderId: "124207373230",
  appId: "1:124207373230:web:33d690a72a7c938f4ec63f",
  measurementId: "G-38QTBYLGNK"
};

// サーバー側で複数回実行されるのを防ぐおまじない
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };