import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { serverTimestamp, getFirestore, addDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
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
const db = getFirestore();

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
        document.getElementById('bottom-nav').style.display = 'flex';
        showView("record");
    } else {
        // 未ログイン
        showView("first-settings")
        document.getElementById('bottom-nav').style.display = 'none';
    }
});

function logout() {
    signOut(auth)
      .then(() => {
        console.log("ログアウト成功");
      })
      .catch((error) => {
        console.error(error);
      });
}

async function commitMemory(){
    // 実行した瞬間のログインユーザーを取得
    const user = auth.currentUser;
    try {
        await addDoc(collection(db, "memories"), {
            text: document.getElementById("memory-input").value,
            userId: user.uid,   // 自分一人のプロジェクトでも、セキュリティのために必須！
            createdAt: serverTimestamp() // new Date() よりこちらが安全
        });
    } catch (e) {
        console.error("保存失敗:", e);
    }
}

window.login = login;
window.logout = logout;
window.showView = showView;
window.commitMemory = commitMemory;