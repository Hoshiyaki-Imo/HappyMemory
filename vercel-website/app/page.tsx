'use client';

import { useState, useEffect } from 'react';
import { auth, provider, db } from '@/lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export default function HappyMemoryApp() {
  // 画面の切り替えを管理する「状態（State）」
  const [currentView, setCurrentView] = useState('first-settings');
  const [user, setUser] = useState<User | null>(null);
  const [inputText, setInputText] = useState('');
  const [message, setMessage] = useState('');
  const [memories, setMemories] = useState<any[]>([]);

  // ログイン状態の監視（起動時に1回だけ実行）
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setCurrentView('record');
      } else {
        setCurrentView('first-settings');
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 機能（関数）---
  const login = () => signInWithPopup(auth, provider);
  
  const logout = async () => {
    await signOut(auth);
    console.log("ログアウト成功");
  };

  const commitMemory = async () => {
    if (!user || !inputText) return;
    try {
      await addDoc(collection(db, "memories"), {
        text: inputText,
        userId: user.uid,
        createdAt: serverTimestamp(),
        randomCode: Math.random()
      });
      setMessage("送信完了");
      setInputText('');
    } catch (e) {
      setMessage("保存失敗: " + e);
    }
  };

  const renderListList = async () => {
    if (!user) return;
    setCurrentView('list');
    setMemories([{ text: '読み込み中...' }]);
    try {
      const q = query(
        collection(db, "memories"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const fetchedMemories = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text,
          date: data.createdAt ? data.createdAt.toDate().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "保存中..."
        };
      });
      setMemories(fetchedMemories.length > 0 ? fetchedMemories : [{ text: 'データがありません' }]);
    } catch (e) {
      setMemories([{ text: '読み込みに失敗しました' }]);
    }
  };

  const renderListRandom = async () => {
    if (!user) return;
    setCurrentView('list');
    setMemories([{ text: '読み込み中...' }]);
    const luckyNum = Math.random();
    try {
      const q = query(
        collection(db, "memories"),
        where("userId", "==", user.uid),
        where("randomCode", ">=", luckyNum),
        orderBy("randomCode", "asc"),
        limit(1)
      );
      let snapshot = await getDocs(q);
      if (snapshot.empty) {
        const qRetry = query(collection(db, "memories"), where("userId", "==", user.uid), orderBy("randomCode", "asc"), limit(1));
        snapshot = await getDocs(qRetry);
      }
      if (snapshot.empty) {
        setMemories([{ text: 'データがありません' }]);
        return;
      }
      const data = snapshot.docs[0].data();
      setMemories([{
        id: snapshot.docs[0].id,
        text: data.text,
        date: data.createdAt ? data.createdAt.toDate().toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "保存中..."
      }]);
    } catch (e) {
      setMemories([{ text: '読み込みに失敗しました' }]);
    }
  };

  // --- 見た目（HTML）の部分 ---
  return (
    <div id="app">
      <h1 id="title">ハッピーメモリー</h1>

      {/* 条件に合わせて表示する画面を切り替える */}
      {currentView === 'first-settings' && (
        <section className="view">
          <h2>初期設定</h2>
          <p>ログイン</p>
          <button onClick={login}>ログイン</button>
        </section>
      )}

      {currentView === 'record' && (
        <section className="view">
          <h2>記録</h2>
          <textarea 
            id="memory-input" 
            placeholder="ハッピーな内容"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button onClick={commitMemory} disabled={inputText.trim().length === 0} className='commit-button'>コミット</button>
          <p id="sended">{message}</p>
        </section>
      )}

      {currentView === 'list' && (
        <section className="view">
          <h2>ハッピーリスト</h2>
          <div className="button-group">
            <button className="happy-list" onClick={renderListList}>リスト</button>
            <button className="happy-list" onClick={renderListRandom}>ランダム</button>
          </div>
          <div id="list-container">
            <ul id="memory-list">
              {memories.map((mem, index) => (
                <li key={mem.id || index} className="memory-item">
                  {mem.date && <div className="memory-date">{mem.date}</div>}
                  <div className="memory-text">{mem.text}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {currentView === 'settings' && (
        <section className="view">
          <h2>設定</h2>
          <button id="logout" onClick={logout}>ログアウト</button>
        </section>
      )}

      {/* ログインしている時だけ下のナビゲーションを表示 */}
      {user && (
        <nav id="bottom-nav">
          <button onClick={() => setCurrentView('record')}><span className="material-symbols-outlined">add_notes</span>記録</button>
          <button onClick={renderListList}><span className="material-symbols-outlined">list</span>閲覧</button>
          <button onClick={() => setCurrentView('settings')}><span className="material-symbols-outlined">settings</span>設定</button>
        </nav>
      )}
    </div>
  );
}