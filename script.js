import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {getFirestore, addDoc, collection, serverTimestamp, query, where, orderBy, limit, getDocs} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
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
    if(viewName == "list"){
        renderListList();
    }
}

async function renderListList() {
    const user = auth.currentUser;
    if (!user) return;

    const listContainer = document.getElementById("memory-list");
    listContainer.innerHTML = "<li>読み込み中</li>";

    try {
        // クエリを作成（自分のデータ、新しい順、最大20件など）
        const q = query(
            collection(db, "memories"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(20)
        );

        const querySnapshot = await getDocs(q);
        listContainer.innerHTML = ""; // 読み込み中表示を消す

        if (querySnapshot.empty) {
            listContainer.innerHTML = "<li>データがありません</li>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // 日付を読みやすい形式に変換
            const date = data.createdAt ? data.createdAt.toDate().toLocaleString('ja-JP', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : "保存中...";

            // <li>要素を作成
            const li = document.createElement("li");
            li.className = "memory-item"; // CSSでデザインしやすくするためにクラスを付ける
            li.innerHTML = `
                <div class="memory-date">${date}</div>
                <div class="memory-text">${data.text}</div>
            `;
            listContainer.appendChild(li);
        });
    } catch (e) {
        console.error("読み取りエラー:", e);
        listContainer.innerHTML = "<li>読み込みに失敗しました。</li>";
    }
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
            createdAt: serverTimestamp(), // new Date() よりこちらが安全
            randomCode: Math.random()
        });
        document.getElementById("sended").textContent = "送信完了";
        document.getElementById("memory-input").value = "";
    } catch (e) {
        document.getElementById("sended").textContent = "保存失敗:" + e;
    }
}

async function renderListRandom() {
    const user = auth.currentUser;
    if (!user) return;

    const listContainer = document.getElementById("memory-list");
    listContainer.innerHTML = "<li>読み込み中</li>";

    const luckyNum = Math.random()

    try {
        // クエリを作成（自分のデータ、新しい順、最大20件など）
        const q = query(
            collection(db, "memories"),
            where("userId", "==", user.uid),
            where("randomCode", ">=", luckyNum),
            orderBy("randomCode", "asc"), // 小さい順に並べて
            limit(1)                      // その先頭を取る
        );

    const snapshot = await getDocs(q);
    // もし当たり番号より上がいなければ、一番小さいやつを1件取る（円環構造にするため）
    let targetDoc = snapshot.docs[0];
    if (!targetDoc) {
        const qRetry = query(
            collection(db, "memories"),
            where("userId", "==", user.uid),
            orderBy("randomCode", "asc"),
            limit(1)
        );
        const retrySnapshot = await getDocs(qRetry);
        targetDoc = retrySnapshot.docs[0];
    }

        if (!targetDoc) {
            listContainer.innerHTML = "<li>データがありません</li>";
            return;
        }
        listContainer.innerHTML = "";

        const data = targetDoc.data();
        
        // 日付を読みやすい形式に変換
        const date = data.createdAt ? data.createdAt.toDate().toLocaleString('ja-JP', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : "保存中...";

        // <li>要素を作成
        const li = document.createElement("li");
        li.className = "memory-item"; // CSSでデザインしやすくするためにクラスを付ける
        li.innerHTML = `
            <div class="memory-date">${date}</div>
            <div class="memory-text">${data.text}</div>
        `;
        listContainer.appendChild(li);
    } catch (e) {
        console.error("読み取りエラー:", e);
        listContainer.innerHTML = "<li>読み込みに失敗しました。</li>";
    }
}

window.login = login;
window.logout = logout;
window.showView = showView;
window.commitMemory = commitMemory;
window.renderListList = renderListList;
window.renderListRandom = renderListRandom;