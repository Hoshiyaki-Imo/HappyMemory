'use client';

import { useState, useEffect } from 'react';
import { auth, provider, db } from '@/lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Swal from 'sweetalert2';

export default function HappyMemoryApp() {
  // 画面の切り替えを管理する「状態（State）」
  const [currentView, setCurrentView] = useState('first-settings');
  const [user, setUser] = useState<User | null>(null);
  const [inputText, setInputText] = useState('');
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
  const toast = Swal.mixin({
    confirmButtonColor: '#7d6b5d', // アプリのアクセントカラーに合わせる
    cancelButtonColor: '#d33',
    background: '#f9f8f6', // アプリの背景色に合わせる
    color: '#2c3e50'       // 文字色
  })

  const login = () => signInWithPopup(auth, provider);
  
  const logout = async () => {
    await signOut(auth);
    toast.fire({
      title: 'ログアウト',
      text: 'ログアウトしました',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
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
      setInputText('');
      toast.fire({
        title: 'コミット完了',
        text: '送信されました',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (e) {
      toast.fire({
        title: 'エラー',
        text: 'エラーが起きました\n${e}',
        icon: 'error',
        timer: 1500,
        showConfirmButton: false
      })
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

  const deleteCommit = async (id: string) => {
    // 1. 確認ダイアログを表示
    const result = await toast.fire({
      title: '削除しますか？',
      text: "このコミットを削除します（復元不可）",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '削除する',
      cancelButtonText: 'やめておく',
    });

    // 2. 「削除する」が押された場合のみ実行
    if (result.isConfirmed) {
      try {
        const docRef = doc(db, "memories", id);
        await deleteDoc(docRef);

        // Stateを更新して画面から消す
        setMemories(prev => prev.filter(mem => mem.id !== id));

        // 完了通知（これもSweetAlert2でおしゃれに）
        toast.fire({
          title: '削除完了',
          text: '完全に削除されました',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

      } catch (e) {
        Swal.fire('エラー', '削除に失敗しました', 'error');
      }
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
                  <div style={{ textAlign: 'right' }}><button className='delete-btn' onClick={() => deleteCommit(mem.id)}><span className="material-symbols-outlined">delete_forever</span></button></div>
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