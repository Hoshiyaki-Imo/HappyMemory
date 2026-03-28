import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyA4aHmGvuWDL9tqxPw3iuOyZ3IerFymTQk",
  authDomain: "happy-memory-hoshiyakiimo.firebaseapp.com",
  projectId: "happy-memory-hoshiyakiimo",
  storageBucket: "happy-memory-hoshiyakiimo.firebasestorage.app",
  messagingSenderId: "124207373230",
  appId: "1:124207373230:web:33d690a72a7c938f4ec63f",
  measurementId: "G-38QTBYLGNK"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const provider = new GoogleAuthProvider();

function showView(viewName) {
    // すべてのviewを一旦非表示にする
    const views = document.querySelectorAll('.view');
    views.forEach(v => v.style.display = 'none');

    // 指定されたviewだけ表示する
    document.getElementById(`view-${viewName}`).style.display = 'block';
}

function login() {
    signInWithPopup(auth, provider);
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        // ログイン済み
        document.getElementById('first-settings').style.display = 'none';
        document.getElementById('bottom-nav').style.display = 'flex';
        showView("record");
    } else {
        // 未ログイン
        document.getElementById('first-settings').style.display = 'block';
        document.getElementById('bottom-nav').style.display = 'none';
    }
});

window.login = login;
window.showView = showView;