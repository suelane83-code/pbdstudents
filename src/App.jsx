import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

// ==========================================
// 内置 SVG 图标
// ==========================================
const Search = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>);
const LogOut = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>);
const Download = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>);
const Upload = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>);
const Trash2 = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>);
const Edit = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const ChevronRight = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"/></svg>);
const UserCheck = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>);
const Settings = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>);
const BookOpen = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>);
const AlertCircle = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>);
const RefreshCw = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>);
const ClipboardList = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>);
const ImageIcon = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>);
const Users = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>);
const FileText = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>);
const BarChart = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>);
const CreditCard = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>);
const CheckCircle = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>);
const Undo = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>);

// 新增点赞与留言图标
const Heart = ({ size = 20, className = "", filled = false }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>);
const MessageCircle = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>);
const Smile = ({ size = 20, className = "" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>);

// ==========================================
// 1. Firebase 设定与初始化
// ==========================================
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyBRbfRCs0Eqn5SWB34Ip2VDzA8k4G9JmvM",
      authDomain: "sjk-delima.firebaseapp.com",
      projectId: "sjk-delima",
      storageBucket: "sjk-delima.firebasestorage.app",
      messagingSenderId: "616642054550",
      appId: "1:616642054550:web:abcdef123456"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const getCollectionPath = (collectionName) => {
  if (typeof __app_id !== 'undefined') {
    return `artifacts/${appId}/public/data/${collectionName}`;
  }
  return collectionName; 
};

// ==========================================
// 2. 主应用程序 (App Component)
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [authRole, setAuthRole] = useState(''); 
  
  // 数据状态
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [logs, setLogs] = useState([]);
  const [schoolReports, setSchoolReports] = useState([]); 
  const [adminNotes, setAdminNotes] = useState([]); 
  const [cardRequests, setCardRequests] = useState([]);
  
  // 弹窗与加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState(null);

  useEffect(() => {
    const faviconSvg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#9333ea"/><g transform="translate(20, 20) scale(2.5)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></g></svg>');
    let iconLink = document.querySelector("link[rel~='icon']");
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.type = 'image/svg+xml';
    iconLink.href = `data:image/svg+xml,${faviconSvg}`;

    let appleIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = `data:image/svg+xml,${faviconSvg}`;
    
    document.title = "SJKC Kung Ming Delima";

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
        setIsLoading(false);
        setModalMessage({ title: "连接配置异常", text: `无法连接至 Firebase 账户。\n详细错误: ${err.message}` });
      }
    };
    initAuth();

    const logAction = async (role, action, details) => {
      try {
        const newRef = doc(collection(db, getCollectionPath('logs')));
        await setDoc(newRef, { role, action, details, timestamp: new Date().toISOString() });
      } catch (e) {
        console.error("Failed to log action:", e);
      }
    };
    window.logSystemAction = logAction;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      unsubscribe();
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // 抓取数据
  useEffect(() => {
    if (!user) return;

    const handleFirestoreError = (error) => {
      console.error("Firestore error:", error);
      if (error.code === 'permission-denied' || (error.message && error.message.includes('Missing or insufficient permissions'))) {
         setModalMessage({ title: "数据库读写被拦截", text: "系统无法读取或写入数据。\n请前往 Firebase Console 更新 Rules 设置。" });
      }
    };

    const studentsRef = collection(db, getCollectionPath('students'));
    const unsubscribeStudents = onSnapshot(query(studentsRef), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, handleFirestoreError);

    const announcementsRef = collection(db, getCollectionPath('announcements'));
    const unsubscribeAnnouncements = onSnapshot(query(announcementsRef), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnouncements(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }, handleFirestoreError);

    const logsRef = collection(db, getCollectionPath('logs'));
    const unsubscribeLogs = onSnapshot(query(logsRef), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    }, handleFirestoreError);

    const reportsRef = collection(db, getCollectionPath('schoolReports'));
    const unsubscribeReports = onSnapshot(query(reportsRef), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchoolReports(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    }, handleFirestoreError);

    const notesRef = collection(db, getCollectionPath('adminNotes'));
    const unsubscribeNotes = onSnapshot(query(notesRef), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminNotes(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    }, handleFirestoreError);

    const cardsRef = collection(db, getCollectionPath('cardRequests'));
    const unsubscribeCards = onSnapshot(query(cardsRef), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCardRequests(data.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)));
    }, handleFirestoreError);

    return () => {
      unsubscribeStudents();
      unsubscribeAnnouncements();
      unsubscribeLogs();
      unsubscribeReports();
      unsubscribeNotes();
      unsubscribeCards();
    };
  }, [user]);

  const showMessage = (title, text) => setModalMessage({ title, text });

  const handleLogout = () => {
    if (authRole) window.logSystemAction(authRole, '退出系统', '用户安全登出');
    setAuthRole('');
    setActiveTab('home');
    showMessage("成功", "已安全退出账户。");
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <RefreshCw className="animate-spin text-purple-500" size={40} />
          <div className="text-xl text-purple-600 font-semibold animate-pulse">正在安全连接系统...</div>
        </div>
      );
    }

    if (activeTab === 'home') {
      return <HomeView students={students} announcements={announcements} schoolReports={schoolReports} db={db} getCollectionPath={getCollectionPath} showMessage={showMessage} authRole={authRole} currentUser={user} setActiveTab={setActiveTab} />;
    } else if (activeTab === 'teacher') {
      if (authRole === 'teacher' || authRole === 'admin') {
        return <TeacherPortal students={students} db={db} getCollectionPath={getCollectionPath} showMessage={showMessage} />;
      } else {
        return <LoginView roleTarget="teacher" setAuthRole={setAuthRole} showMessage={showMessage} />;
      }
    } else if (activeTab === 'admin') {
      if (authRole === 'admin') {
        return <AdminPortal students={students} announcements={announcements} logs={logs} schoolReports={schoolReports} adminNotes={adminNotes} cardRequests={cardRequests} db={db} getCollectionPath={getCollectionPath} showMessage={showMessage} />;
      } else {
        return <LoginView roleTarget="admin" setAuthRole={setAuthRole} showMessage={showMessage} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF9FF] text-gray-800 font-sans selection:bg-purple-200">
      <header className="bg-white shadow-md rounded-b-3xl pb-8 pt-6 px-4 mx-auto max-w-5xl mb-8 relative border-b-4 border-purple-600">
        <div className="flex flex-col items-center text-center">
          <img 
            src="delima.jpg" 
            alt="DELIMA SJKC KUNG MING" 
            className="h-24 mb-4 object-contain drop-shadow-sm"
            onError={(e) => { e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_Kementerian_Pendidikan_Malaysia.png/250px-Logo_Kementerian_Pendidikan_Malaysia.png"; }}
          />
          <h2 className="text-lg md:text-xl font-bold tracking-widest text-gray-700 uppercase mt-1 mb-1">
            SJKC KUNG MING, BEAUFORT, SABAH.
          </h2>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-800 to-purple-500 my-2 py-1">
            保佛公民小学 Delima 账户查询
          </h1>
        </div>

        <div className="flex justify-center gap-4 mt-6 flex-wrap">
          {activeTab !== 'home' && (
            <button 
              onClick={() => setActiveTab('home')}
              className="px-6 py-2 rounded-full text-base font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all shadow-sm"
            >
              返回首页 (Kembali)
            </button>
          )}
          {authRole !== '' && (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-2 rounded-full text-base font-bold bg-red-50 text-red-600 hover:bg-red-100 shadow-sm transition-all"
            >
              <LogOut size={18} /> 登出
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-16">
        {renderContent()}
      </main>

      <footer className="text-center py-8 mt-8 text-purple-400">
        <p className="text-sm mb-2">© {new Date().getFullYear()} SJKC KUNG MING. Hak Cipta Terpelihara.</p>
        <div className="flex justify-center items-center gap-4 text-xs mt-2 opacity-60 hover:opacity-100 transition-opacity">
          <button onClick={() => setActiveTab('teacher')} className="hover:text-amber-600 transition-colors">panel guru</button>
          <span>|</span>
          <button onClick={() => setActiveTab('admin')} className="hover:text-purple-700 transition-colors">admin access</button>
        </div>
      </footer>

      {modalMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-bounce-in transform transition-all">
            <div className="flex items-center justify-center mb-4">
              {modalMessage.title.includes('异常') || modalMessage.title.includes('被拦截') || modalMessage.title === '错误' || modalMessage.title.includes('失败') ? (
                 <AlertCircle size={40} className="text-red-500" />
              ) : (
                 <UserCheck size={40} className="text-purple-500" />
              )}
            </div>
            <h3 className={`text-2xl font-bold mb-4 text-center ${modalMessage.title.includes('异常') || modalMessage.title.includes('被拦截') || modalMessage.title === '错误' ? 'text-red-600' : 'text-purple-700'}`}>
              {modalMessage.title}
            </h3>
            <p className="text-base text-gray-700 leading-relaxed text-center whitespace-pre-line">{modalMessage.text}</p>
            <button 
              onClick={() => setModalMessage(null)}
              className="mt-6 w-full bg-purple-600 text-white rounded-xl py-3 text-lg font-bold hover:bg-purple-700 transition-colors"
            >
              确定 (Tutup)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Emoji Picker Component
// ==========================================
const EmojiPicker = ({ onSelect, onClose }) => {
  const emojis = ['👍', '❤️', '😀', '👏', '🎉', '🔥', '🙌', '💯', '🤔', '👀', '😊', '🥳', '💪', '🙏', '✨', '🌟'];
  return (
    <div className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-xl p-2 w-48 mt-1">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-xs font-bold text-gray-500">Pilih Emoji</span>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {emojis.map(emoji => (
          <button
            key={emoji}
            type="button"
            className="text-xl p-1 hover:bg-gray-100 rounded transition-colors"
            onClick={() => onSelect(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 3. 首页视图
// ==========================================
function HomeView({ students, announcements, schoolReports, db, getCollectionPath, showMessage, authRole, currentUser, setActiveTab }) {
  const [icNumber, setIcNumber] = useState('');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  // 留言相关状态
  const [commentInputs, setCommentInputs] = useState({});
  const [commentNames, setCommentNames] = useState({});
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // 记录哪个项正在显示 emoji 选择器

  // 获取动态问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Selamat Pagi! 早上好 👋", sub: "Semoga hari anda ceria." };
    if (hour < 18) return { text: "Selamat Petang! 下午好 ☀️", sub: "Teruskan usaha cemerlang." };
    return { text: "Selamat Malam! 晚上好 🌙", sub: "Berehatlah dengan tenang." };
  };
  const greeting = useMemo(() => getGreeting(), []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!icNumber.trim()) return;
    
    const cleanInput = icNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    const student = students.find(s => {
      const cleanIC = (s.ic || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanBC = (s.birthCert || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return cleanIC === cleanInput || cleanBC === cleanInput;
    });
    
    setResult(student || null);
    setSearched(true);

    if (window.logSystemAction) {
      if (student) window.logSystemAction('visitor', '成功查询资料', `家长/学生成功进入，输入的身份证/报生纸: ${icNumber} (学生: ${student.name}, 班级: ${student.classYear}${student.classColor})`);
      else window.logSystemAction('visitor', '查询失败', `家长/学生尝试进入但失败，输入的号码: ${icNumber}`);
    }
  };

  // ----- 点赞与留言交互逻辑 (无需登录) -----
  const handleLike = async (item, collectionName) => {
    const visitorId = authRole ? `role_${authRole}` : (currentUser?.uid || 'anonymous');
    const isLiked = (item.likes || []).includes(visitorId);
    let newLikes = item.likes || [];
    
    if (isLiked) {
      newLikes = newLikes.filter(id => id !== visitorId);
    } else {
      newLikes.push(visitorId);
    }

    try {
      await updateDoc(doc(db, getCollectionPath(collectionName), item.id), { likes: newLikes });
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const handleCommentInputChange = (itemId, value) => {
    setCommentInputs(prev => ({ ...prev, [itemId]: value }));
  };

  const handleCommentNameChange = (itemId, value) => {
    setCommentNames(prev => ({ ...prev, [itemId]: value }));
  };

  const insertEmoji = (itemId, emoji) => {
    const currentInput = commentInputs[itemId] || '';
    setCommentInputs(prev => ({ ...prev, [itemId]: currentInput + emoji }));
    setShowEmojiPicker(null);
  };

  const handleAddComment = async (item, collectionName, e) => {
    e.preventDefault();
    const input = commentInputs[item.id];
    const name = commentNames[item.id];

    if (!input || !input.trim()) return;
    if (!authRole && (!name || !name.trim())) {
      showMessage("提示 (Perhatian)", "Sila masukkan nama anda.\n请输入您的名字。");
      return;
    }

    const finalName = authRole === 'admin' ? 'Admin' : (authRole === 'teacher' ? 'Cikgu (老师)' : name.trim());

    const newComment = {
      id: Date.now().toString(),
      text: input,
      authorId: authRole ? `role_${authRole}` : (currentUser?.uid || 'anonymous'),
      authorName: finalName,
      timestamp: new Date().toISOString()
    };

    const newComments = [...(item.comments || []), newComment];

    try {
      await updateDoc(doc(db, getCollectionPath(collectionName), item.id), { comments: newComments });
      // 清空当前项的输入状态
      setCommentInputs(prev => { const next = {...prev}; delete next[item.id]; return next; });
      setCommentNames(prev => { const next = {...prev}; delete next[item.id]; return next; });
      setActiveCommentId(null);
      showMessage("成功 (Berjaya)", "Komen anda telah dihantar.\n您的留言已发布！");
    } catch (err) {
      showMessage("错误 (Ralat)", "Gagal menghantar komen: " + err.message);
    }
  };

  const handleEditComment = async (item, collectionName, commentId) => {
    if (!editCommentText.trim()) return;
    const updatedComments = item.comments.map(c => c.id === commentId ? { ...c, text: editCommentText, edited: true } : c);
    try {
      await updateDoc(doc(db, getCollectionPath(collectionName), item.id), { comments: updatedComments });
      setActiveCommentId(null);
      setEditCommentText('');
    } catch (err) {
      showMessage("错误 (Ralat)", "Gagal mengemas kini komen: " + err.message);
    }
  };

  const handleDeleteComment = async (item, collectionName, commentId) => {
    if (!window.confirm("Adakah anda pasti untuk memadam komen ini?\n确定要删除这条留言吗？")) return;
    const updatedComments = item.comments.filter(c => c.id !== commentId);
    try {
      await updateDoc(doc(db, getCollectionPath(collectionName), item.id), { comments: updatedComments });
    } catch (err) {
      showMessage("错误 (Ralat)", "Gagal memadam komen: " + err.message);
    }
  };

  const canEditOrDelete = (comment) => {
    if (authRole === 'admin') return true;
    const currentId = authRole ? `role_${authRole}` : (currentUser?.uid || 'anonymous');
    if (comment.authorId !== currentId) return false;
    const commentDate = new Date(comment.timestamp);
    const now = new Date();
    const hoursDiff = (now - commentDate) / (1000 * 60 * 60);
    return hoursDiff <= 24; // 24小时内可修改
  };

  // ----- 渲染交互区 (点赞与留言) -----
  const renderInteractionArea = (item, collectionName) => {
    const visitorId = authRole ? `role_${authRole}` : (currentUser?.uid || 'anonymous');
    const isLiked = (item.likes || []).includes(visitorId);
    
    return (
      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={(e) => { e.preventDefault(); handleLike(item, collectionName); }}
            className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'}`}
          >
            <Heart size={20} filled={isLiked} /> 
            <span>Like ({item.likes?.length || 0})</span>
          </button>
          <button 
            onClick={(e) => { 
              e.preventDefault(); 
              setActiveCommentId(activeCommentId === `new-${item.id}` ? null : `new-${item.id}`); 
            }}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-blue-500 transition-colors"
          >
            <MessageCircle size={20} />
            <span>Komen ({(item.comments || []).length})</span>
          </button>
        </div>

        {/* 留言列表 */}
        {(item.comments || []).length > 0 && (
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
            {item.comments.map(c => (
              <div key={c.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-gray-800">{c.authorName}</span>
                  <span className="text-xs text-gray-400">{new Date(c.timestamp).toLocaleString()} {c.edited && '(Edited)'}</span>
                </div>
                
                {activeCommentId === c.id ? (
                  <div className="mt-2">
                    <textarea 
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      rows="2"
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button onClick={(e) => {e.preventDefault(); setActiveCommentId(null);}} className="text-xs text-gray-500 hover:text-gray-700 font-bold px-2 py-1">Batal (取消)</button>
                      <button onClick={(e) => {e.preventDefault(); handleEditComment(item, collectionName, c.id);}} className="text-xs bg-blue-500 text-white rounded px-3 py-1 font-bold hover:bg-blue-600">Simpan (保存)</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{c.text}</p>
                )}

                {canEditOrDelete(c) && activeCommentId !== c.id && (
                  <div className="flex justify-end gap-3 mt-2 text-xs font-bold">
                    <button onClick={(e) => {e.preventDefault(); setEditCommentText(c.text); setActiveCommentId(c.id);}} className="text-blue-500 hover:text-blue-600 flex items-center gap-1"><Edit size={12}/> Edit</button>
                    <button onClick={(e) => {e.preventDefault(); handleDeleteComment(item, collectionName, c.id);}} className="text-red-500 hover:text-red-600 flex items-center gap-1"><Trash2 size={12}/> Padam</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 发表留言框 */}
        {activeCommentId === `new-${item.id}` && (
          <form onSubmit={(e) => handleAddComment(item, collectionName, e)} className="flex flex-col gap-2 mt-2 relative z-20">
            <div className="relative">
              <textarea 
                placeholder="Tulis komen anda... (写下您的留言...)"
                className="w-full p-3 border border-gray-300 rounded-2xl text-sm outline-none focus:border-blue-500 shadow-inner resize-none pr-10"
                value={commentInputs[item.id] || ''}
                onChange={(e) => handleCommentInputChange(item.id, e.target.value)}
                rows="2"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(showEmojiPicker === item.id ? null : item.id)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Smile size={20} />
              </button>
              {showEmojiPicker === item.id && (
                <EmojiPicker onSelect={(emoji) => insertEmoji(item.id, emoji)} onClose={() => setShowEmojiPicker(null)} />
              )}
            </div>
            <div className="flex gap-2">
              {!authRole && (
                <input 
                  type="text" 
                  placeholder="Nama Anda (您的名字)"
                  className="flex-1 p-3 border border-gray-300 rounded-2xl text-sm outline-none focus:border-blue-500 shadow-inner"
                  value={commentNames[item.id] || ''}
                  onChange={(e) => handleCommentNameChange(item.id, e.target.value)}
                  required
                />
              )}
              <button 
                type="submit" 
                className="px-6 py-2 rounded-2xl font-bold text-sm text-white transition-colors bg-blue-500 hover:bg-blue-600 shadow-md"
              >
                Hantar
              </button>
            </div>
          </form>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* 问候语 */}
      <div className="px-4 text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-extrabold text-purple-800">{greeting.text}</h2>
        <p className="text-lg text-purple-600 mt-2 font-medium">{greeting.sub} ✨</p>
      </div>

      {/* 搜索区块 */}
      <section className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-purple-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="mb-6 relative z-10 flex items-start gap-3">
          <Search size={32} className="text-purple-600 shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-purple-800">
              查询学生 Delima 资料
            </h2>
            <h3 className="text-lg md:text-xl font-bold text-purple-600 mt-1">
              Semakan email Delima Murid-murid
            </h3>
            <p className="text-sm md:text-base text-gray-600 mt-2 font-medium">
              Sila masukkan No. K/P atau Surat Beranak Murid untuk menyemak emel Delima Murid.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 relative z-10">
          <input 
            type="text" 
            placeholder="请输入学生IC或报生纸号码 (No.K/P atau Surat Beranak)" 
            className="flex-1 text-lg p-4 border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all shadow-inner"
            value={icNumber}
            onChange={(e) => setIcNumber(e.target.value)}
          />
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2">
            查询 (Cari)
          </button>
        </form>

        {/* 刚进入且未搜索时显示的提示信息 */}
        {!searched && (
           <div className="mt-8 pt-8 border-t border-purple-50 text-center text-gray-500">
             <p>Masukkan nombor pendaftaran untuk bermula.</p>
             <p className="text-sm mt-1">开始使用前，请在上方输入号码进行查询。</p>
           </div>
        )}

        {searched && (
          <div className="mt-8 border-t-2 border-purple-50 pt-8 animate-slide-up">
            {result ? (
              <div className="bg-purple-50 rounded-2xl p-6 md:p-8 border border-purple-200 shadow-sm">
                <h3 className="text-2xl font-bold text-purple-900 mb-6 border-b-2 border-purple-200 pb-3">学生资料 (Maklumat Murid)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
                  <InfoItem label="姓名 (NAMA MURID)" value={result.name} />
                  <InfoItem label="班级 (KELAS)" value={formatSimpleClassName(result.classYear, result.classColor)} />
                  <InfoItem label="IC 号码 (IC MURID)" value={result.ic} />
                  <InfoItem label="性别 (JANTINA)" value={result.gender} />
                  <InfoItem label="DELIMA ID (EMAIL)" value={result.delimaId} isHighlight />
                  
                  <div className="flex flex-col">
                    <InfoItem label="密码 (PASSWORD)" value={result.password} isHighlight />
                    <span className="text-red-500 font-bold text-xs md:text-sm mt-2 px-1 leading-tight">
                      * Sila hubungi Guru Penyelaras Delima Sekolah jika ingin menukar kata laluan.
                    </span>
                  </div>
                  
                  <InfoItem label="学号 (NO RUJ SEK)" value={result.studentId} />
                  <InfoItem label="IDME (NO.RUJ IDME)" value={result.idme} />
                  <InfoItem label="报生纸 (SURAT BERANAK)" value={result.birthCert} />
                  <InfoItem label="运动队伍 (RUMAH SUKAN)" value={result.sportsHouse} />
                  
                  {result.classYear === '19' && (
                    <>
                      <InfoItem label="状态 (Status)" value="已转校 (Pindah)" isAlert />
                      <InfoItem label="转校学校名称" value={result.transferSchool || '-'} />
                    </>
                  )}
                  {result.classYear === '20' && (
                    <>
                      <InfoItem label="状态 (Status)" value="已毕业 (Tamat)" isAlert />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-lg text-center font-bold border border-red-100 flex items-center justify-center gap-3">
                <AlertCircle size={24} /> 找不到该学生的资料，请检查输入的号码是否正确。
              </div>
            )}
          </div>
        )}
      </section>

      {/* 学校报告和使用率展示区 */}
      {schoolReports.length > 0 && (
        <section className="animate-slide-up">
          <h2 className="text-2xl md:text-3xl font-extrabold text-blue-800 mb-6 flex items-center gap-3 pl-4 border-l-8 border-blue-500 rounded-l-md">
            <FileText size={28} className="text-blue-500" /> Laporan & Penggunaan Sekolah (学校重要信息与使用率)
          </h2>
          <div className="space-y-6">
            {/* 只显示第一篇 (最新的) 报告 */}
            {schoolReports.slice(0, 1).map(rep => (
              <div key={rep.id} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-blue-100">
                {rep.image && (
                  <div className="w-full bg-gray-50 flex justify-center border-b border-gray-100">
                    <img src={rep.image} alt={rep.title} className="w-full h-auto max-h-[400px] object-contain" />
                  </div>
                )}
                <div className="p-6 md:p-8">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider">
                      Laporan Rasmi (官方通告)
                    </span>
                    <span className="text-gray-400 text-sm">{rep.date}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-blue-900 mb-4">{rep.title}</h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed whitespace-pre-line mb-6">
                    {rep.content}
                  </p>
                  
                  {/* 使用率进度条 */}
                  {(rep.studentUsage || rep.teacherUsage) && (
                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {rep.studentUsage && (
                        <div>
                          <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                            <span className="flex items-center gap-1"><Users size={16}/> 学生使用率 (Murid)</span>
                            <span className="text-blue-600">{rep.studentUsage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${Math.min(100, rep.studentUsage)}%` }}></div>
                          </div>
                        </div>
                      )}
                      {rep.teacherUsage && (
                        <div>
                          <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                            <span className="flex items-center gap-1"><UserCheck size={16}/> 老师使用率 (Guru)</span>
                            <span className="text-green-600">{rep.teacherUsage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-green-500 h-3 rounded-full" style={{ width: `${Math.min(100, rep.teacherUsage)}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 font-medium text-right mt-2 pt-3">
                    Tarikh Kemaskini: {new Date(rep.timestamp).toLocaleString()}
                  </div>

                  {/* 交互区：点赞与留言 */}
                  {renderInteractionArea(rep, 'schoolReports')}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DELIMA Login Button */}
      <section className="animate-slide-up">
        <a 
          href="https://d2.delima.edu.my/login" 
          target="_blank" 
          rel="noreferrer"
          className="group block w-full bg-white border-4 border-purple-500 rounded-3xl p-6 md:p-10 text-center shadow-xl hover:shadow-2xl hover:bg-purple-50 transition-all active:scale-95"
        >
          <div className="flex flex-col items-center justify-center gap-1 md:gap-2">
            <h3 className="text-sm md:text-lg font-bold text-purple-600 uppercase tracking-widest opacity-90">
              Click here for login
            </h3>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-purple-800 leading-tight group-hover:scale-[1.02] transition-transform">
              Digital Educational Learning Initiative Malaysia
            </h2>
          </div>
        </a>
      </section>

      {/* 公告区 */}
      <section>
        <h2 className="text-2xl md:text-3xl font-extrabold text-purple-800 mb-6 flex items-center gap-3 pl-4 border-l-8 border-amber-400 rounded-l-md">
          <BookOpen size={28} className="text-amber-500" /> Hebahan & Aktiviti DELIMA (最新活动)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.length === 0 ? (
            <p className="text-base text-gray-500 p-8 col-span-2 text-center bg-white rounded-2xl shadow-sm border border-purple-50">暂无最新活动公告。</p>
          ) : (
            announcements.map((ann) => (
              <div 
                key={ann.id} 
                className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all border border-purple-50 flex flex-col justify-between overflow-hidden"
              >
                {/* 完整显示照片，不裁剪 */}
                {ann.image && (
                  <div className="-mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6 bg-gray-50 flex items-center justify-center border-b border-gray-100">
                    <img src={ann.image} alt={ann.title} className="w-full h-auto max-h-80 object-contain" />
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${ann.type === 'App' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                      {ann.type}
                    </span>
                    <span className="text-gray-400 text-sm">{ann.date}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">{ann.title}</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                </div>
                {ann.link && (
                  <a 
                    href={ann.link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="mt-4 flex items-center text-purple-600 font-bold text-sm hover:translate-x-2 transition-transform w-fit"
                  >
                    点击前往 (Klik Sini) <ChevronRight size={18} />
                  </a>
                )}

                {/* 交互区：点赞与留言 */}
                {renderInteractionArea(ann, 'announcements')}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value, isHighlight, isAlert, className = "" }) {
  const displayValue = (!value || String(value).trim() === '' || value === '-') ? 'Sedang dikemaskini' : value;
  return (
    <div className={`p-4 rounded-xl border border-transparent ${isHighlight ? 'bg-purple-600 text-white shadow-sm' : isAlert ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-white border-gray-100'} ${className}`}>
      <div className={`text-xs md:text-sm font-semibold mb-1 opacity-80`}>{label}</div>
      <div className={`text-lg md:text-xl font-bold break-all ${displayValue === 'Sedang dikemaskini' ? 'italic opacity-60 font-normal text-base' : ''}`}>{displayValue}</div>
    </div>
  );
}

// ==========================================
// 4. 登录视图 (Login Modal)
// ==========================================
function LoginView({ roleTarget, setAuthRole, showMessage }) {
  const [pin, setPin] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (roleTarget === 'teacher' && pin === 'xcc6027@km') {
      setAuthRole('teacher');
      showMessage("登录成功", "欢迎进入教师控制台。");
      if (window.logSystemAction) window.logSystemAction('teacher', '系统登录', '教师成功登录系统');
    } else if (roleTarget === 'admin' && pin === 'XCC6027@km') {
      setAuthRole('admin');
      showMessage("登录成功", "欢迎进入系统后台。");
      if (window.logSystemAction) window.logSystemAction('admin', '系统登录', '管理员成功登录后台');
    } else {
      showMessage("错误", "密码不正确，请重试。");
      if (window.logSystemAction) window.logSystemAction('visitor', '登录失败', `尝试进入 ${roleTarget === 'admin' ? '管理员' : '教师'} 后台时密码错误`);
      setPin('');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 max-w-sm mx-auto shadow-xl text-center border-t-4 border-purple-600 animate-fade-in">
      <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        {roleTarget === 'admin' ? <Settings size={36} className="text-purple-700" /> : <UserCheck size={36} className="text-purple-700" />}
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">安全登录</h2>
      <p className="text-sm text-gray-500 mb-6">
        {roleTarget === 'admin' ? "请输入管理员密码" : "请输入教师专属密码 (Kata Laluan Guru)"}
      </p>
      <form onSubmit={handleLogin} className="space-y-6">
        <input 
          type="password" 
          placeholder="请输入密码" 
          className="w-full text-center text-xl tracking-[0.5em] p-4 border-2 border-purple-100 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg py-3 rounded-xl transition-all shadow-md">
          Log Masuk (登录)
        </button>
      </form>
    </div>
  );
}

// ==========================================
// 5. 教师控制台
// ==========================================
function TeacherPortal({ students, db, getCollectionPath, showMessage }) {
  const [selectedYear, setSelectedYear] = useState('1');
  const [selectedColor, setSelectedColor] = useState('H');
  const [transferModal, setTransferModal] = useState(null);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  
  const [selectedForCardReq, setSelectedForCardReq] = useState([]);
  const [cardReqModal, setCardReqModal] = useState(false);
  const [cardReqReason, setCardReqReason] = useState('遗失 (Hilang)');

  const reasonOptions = ['遗失 (Hilang)', '替换 (Ganti)', '修改 (Pindaan)', '损坏 (Rosak)', '更新 (Kemas Kini)', '新生 (Murid Baru)', '其他 (Lain-lain)'];

  const years = [
    { val: '1', label: '一年级 (Tahun 1)' },
    { val: '2', label: '二年级 (Tahun 2)' },
    { val: '3', label: '三年级 (Tahun 3)' },
    { val: '4', label: '四年级 (Tahun 4)' },
    { val: '5', label: '五年级 (Tahun 5)' },
    { val: '6', label: '六年级 (Tahun 6)' },
    { val: '19', label: '第19班: 转校生 (Pindah)' },
    { val: '20', label: '第20班: 毕业生 (Tamat)' }
  ];

  const colors = useMemo(() => {
    const cls = new Set([...students.map(s => s.classColor).filter(Boolean), 'H', 'M', 'K']);
    return Array.from(cls).sort();
  }, [students]);

  const classStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedYear === '19' || selectedYear === '20') return s.classYear === selectedYear;
      return s.classYear === selectedYear && s.classColor === selectedColor;
    });
  }, [students, selectedYear, selectedColor]);

  const displayedStudents = useMemo(() => {
    if (teacherSearchTerm.trim() !== '') {
      const lower = teacherSearchTerm.toLowerCase();
      return students.filter(s =>
        s.name.toLowerCase().includes(lower) ||
        (s.ic && s.ic.toLowerCase().includes(lower)) ||
        formatSimpleClassName(s.classYear, s.classColor).toLowerCase().includes(lower)
      );
    }
    return classStudents;
  }, [students, classStudents, teacherSearchTerm]);

  const exportToExcel = () => {
    if (typeof window.XLSX === 'undefined') { showMessage("错误", "Excel导出工具尚未加载，请稍等。"); return; }
    const exportData = displayedStudents.map(s => ({
      "KELAS": `${s.classYear}${s.classColor}`, "TARIKH MASUK": s.admissionDate || '', "NO.RUJ IDME": s.idme || '', "NO RUJ SEK": s.studentId || '', "NAMA MURID": s.name.includes('(') ? s.name.split('(')[0].trim() : s.name, "姓名": s.name.includes('(') ? s.name.split('(')[1].replace(')', '').trim() : '', "JANTINA": s.gender || '', "RUMAH SUKAN": s.sportsHouse || '', "SURAT BERANAK": s.birthCert || '', "TARIKH LAHIR": s.dob || '', "ic": s.rawIc || '', "IC MURID": s.ic, "EMAIL DELIMA": s.delimaId, "PASSWORD": s.password
    }));
    const ws = window.XLSX.utils.json_to_sheet(exportData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Students");
    window.XLSX.writeFile(wb, `Senarai_Kelas_${selectedYear}${selectedColor}.xlsx`);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const date = fd.get('transferDate');
    const school = fd.get('transferSchool');
    try {
      await updateDoc(doc(db, getCollectionPath('students'), transferModal.id), { classYear: '19', transferDate: date, transferSchool: school });
      showMessage("成功", "学生已成功标记为转校。");
      if (window.logSystemAction) window.logSystemAction('teacher', '办理转校', `将学生 [${transferModal.name}] 标记为转校至 ${school}`);
      setTransferModal(null);
    } catch (error) { showMessage("错误", "更新失败: " + error.message); }
  };

  const toggleStudentCardSelect = (s) => {
    if (selectedForCardReq.find(sel => sel.ic === s.ic)) {
      setSelectedForCardReq(selectedForCardReq.filter(sel => sel.ic !== s.ic));
    } else {
      setSelectedForCardReq([...selectedForCardReq, s]);
    }
  };

  const toggleAllCardSelect = () => {
    if (selectedForCardReq.length === displayedStudents.length) {
      setSelectedForCardReq([]);
    } else {
      setSelectedForCardReq([...displayedStudents]);
    }
  };

  const submitCardRequests = async () => {
    setCardReqModal(false);
    try {
      let count = 0;
      for (const s of selectedForCardReq) {
        const newRef = doc(collection(db, getCollectionPath('cardRequests')));
        await setDoc(newRef, {
          studentIc: s.ic,
          studentName: s.name,
          classYear: s.classYear,
          classColor: s.classColor,
          reason: cardReqReason,
          status: 'pending',
          requestedAt: new Date().toISOString(),
        });
        count++;
      }
      showMessage("成功", `已成功提交 ${count} 位学生的制卡申请至 Admin 后台。`);
      if (window.logSystemAction) window.logSystemAction('teacher', '申请制卡', `教师批量申请了 ${count} 张 DELIMA 卡 (原因: ${cardReqReason})`);
      setSelectedForCardReq([]);
      setCardReqReason('遗失 (Hilang)');
    } catch(err) {
      showMessage("错误", "申请提交失败: " + err.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-purple-50 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 border-b border-purple-100 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-amber-600 flex items-center gap-3"><UserCheck size={28} /> 教师控制台 (Panel Guru)</h2>
          <p className="text-sm md:text-base text-gray-500 mt-2">请选择您的班级以查看和整理资料，或直接搜索全校学生。</p>
        </div>
        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input type="text" placeholder="输入姓名或IC搜索全校..." className="w-full p-2.5 pl-10 border border-amber-200 rounded-xl text-sm outline-none focus:border-amber-500" value={teacherSearchTerm} onChange={(e) => setTeacherSearchTerm(e.target.value)} />
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="flex flex-wrap gap-3 bg-purple-50 p-3 rounded-2xl w-full justify-end">
            <select className="text-base p-2 rounded-xl border border-purple-200 outline-none focus:border-purple-400" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {years.map(y => <option key={y.val} value={y.val}>{y.label}</option>)}
            </select>
            {selectedYear !== '19' && selectedYear !== '20' && (
              <select className="text-base p-2 rounded-xl border border-purple-200 outline-none focus:border-purple-400" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
                {colors.map(c => <option key={c} value={c}>{c} 班</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h3 className="text-xl font-bold text-gray-800">学生列表 ({displayedStudents.length} 人) {teacherSearchTerm && <span className="text-amber-500 text-sm">(全校搜索结果)</span>}</h3>
        <div className="flex gap-2">
          {selectedForCardReq.length > 0 && (
            <button onClick={() => setCardReqModal(true)} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-sm transition-all">
              <CreditCard size={18} /> 申请制卡 ({selectedForCardReq.length})
            </button>
          )}
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-sm transition-all"><Download size={18} /> 导出 Excel</button>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
              <th className="p-4 w-12 text-center">
                <input type="checkbox" className="w-4 h-4 cursor-pointer" 
                  checked={displayedStudents.length > 0 && selectedForCardReq.length === displayedStudents.length} 
                  onChange={toggleAllCardSelect} 
                />
              </th>
              <th className="p-4 font-semibold">姓名</th><th className="p-4 font-semibold">班级</th><th className="p-4 font-semibold">IC 号码</th><th className="p-4 font-semibold">DELIMA ID</th><th className="p-4 font-semibold">密码</th><th className="p-4 font-semibold text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {displayedStudents.map((s, idx) => (
              <tr key={s.id} className={`text-sm border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'} hover:bg-purple-50 transition-colors`}>
                <td className="p-4 text-center">
                  <input type="checkbox" className="w-4 h-4 cursor-pointer" 
                    checked={!!selectedForCardReq.find(sel => sel.ic === s.ic)} 
                    onChange={() => toggleStudentCardSelect(s)} 
                  />
                </td>
                <td className="p-4 font-bold text-gray-800">{s.name}</td><td className="p-4 font-semibold text-amber-600">{formatSimpleClassName(s.classYear, s.classColor)}</td><td className="p-4 font-mono text-gray-600">{s.ic}</td><td className="p-4 font-mono text-purple-600">{s.delimaId}</td><td className="p-4 font-mono text-gray-600">{s.password}</td>
                <td className="p-4 text-center">
                  {selectedYear !== '19' && selectedYear !== '20' && (
                    <button onClick={() => setTransferModal(s)} className="bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors">标为转校</button>
                  )}
                </td>
              </tr>
            ))}
            {displayedStudents.length === 0 && (<tr><td colSpan="7" className="p-8 text-center text-gray-500 text-base">未找到符合条件的学生数据。</td></tr>)}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {displayedStudents.map(s => (
          <div key={s.id} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm relative">
            <div className="absolute top-5 right-5">
               <input type="checkbox" className="w-5 h-5 cursor-pointer" checked={!!selectedForCardReq.find(sel => sel.ic === s.ic)} onChange={() => toggleStudentCardSelect(s)} />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-1 pr-8">{s.name}</h4>
            <div className="text-xs font-bold text-amber-600 mb-2 bg-amber-50 inline-block px-2 py-1 rounded">{formatClassName(s.classYear, s.classColor)}</div>
            <div className="space-y-1 text-sm text-gray-600 mb-4"><p>IC: <span className="font-mono text-gray-800">{s.ic}</span></p><p>DELIMA: <span className="font-mono text-purple-600 font-bold">{s.delimaId}</span></p><p>Pwd: <span className="font-mono text-gray-800">{s.password}</span></p></div>
            {selectedYear !== '19' && selectedYear !== '20' && (<button onClick={() => setTransferModal(s)} className="w-full bg-amber-50 border border-amber-200 text-amber-700 py-2.5 rounded-xl font-bold text-sm transition-colors">标为转校 (Pindah Sekolah)</button>)}
          </div>
        ))}
        {displayedStudents.length === 0 && (<div className="p-6 text-center text-gray-500 text-sm border border-gray-200 rounded-2xl">未找到符合条件的学生数据。</div>)}
      </div>

      {transferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-slide-up">
            <h3 className="text-2xl font-bold text-amber-600 mb-2">处理转校</h3>
            <p className="text-base text-gray-600 mb-6">学生: <strong className="text-gray-800">{transferModal.name}</strong></p>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div><label className="block text-sm font-bold text-gray-700 mb-2">转校日期</label><input type="date" name="transferDate" required className="w-full p-3 border border-gray-300 rounded-xl text-base focus:border-amber-500 focus:outline-none transition-colors" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">新学校名称</label><input type="text" name="transferSchool" required placeholder="如: SJKC HWA SHIONG" className="w-full p-3 border border-gray-300 rounded-xl text-base focus:border-amber-500 focus:outline-none transition-colors" /></div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setTransferModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-base transition-colors">取消 (Batal)</button>
                <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-base transition-colors">确认 (Sahkan)</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cardReqModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-slide-up">
            <h3 className="text-2xl font-bold text-indigo-600 mb-2 flex items-center gap-2"><CreditCard size={24}/> 批量申请制卡</h3>
            <p className="text-sm text-gray-600 mb-6">您已选择了 <strong className="text-indigo-600 text-lg">{selectedForCardReq.length}</strong> 位学生，请选择制卡原因并提交给 Admin 处理。</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">制卡原因 (Sebab Mohon Kad)</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-xl text-base focus:border-indigo-500 focus:outline-none"
                  value={cardReqReason}
                  onChange={(e) => setCardReqReason(e.target.value)}
                >
                  {reasonOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setCardReqModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-base transition-colors">取消</button>
                <button onClick={submitCardRequests} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-base transition-colors">提交申请</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. 管理员后台 (Admin Portal)
// ==========================================
function AdminPortal({ students, announcements, logs, schoolReports, adminNotes, cardRequests, db, getCollectionPath, showMessage }) {
  const [adminMainTab, setAdminMainTab] = useState('card_requests'); 
  const [confirmModal, setConfirmModal] = useState(null);
  
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({ name: '', ic: '', classYear: '1', classColor: 'H', delimaId: '', password: '', gender: 'L', studentId: '', idme: '', birthCert: '', dob: '', sportsHouse: '' });
  
  const compressImage = (file, callback) => {
    if (!file.type.startsWith('image/')) { showMessage("错误", "请上传图片文件"); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; const MAX_HEIGHT = 1200;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ---------- 标签 1：学生综合管理 ----------
  const [editStudent, setEditStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [promoMode, setPromoMode] = useState('auto'); 
  const [promoSearchTerm, setPromoSearchTerm] = useState('');
  const [promoEdits, setPromoEdits] = useState({});
  const years = [
    { val: '1', label: '一年级' }, { val: '2', label: '二年级' }, { val: '3', label: '三年级' },
    { val: '4', label: '四年级' }, { val: '5', label: '五年级' }, { val: '6', label: '六年级' },
    { val: '19', label: '19班 (转校)' }, { val: '20', label: '20班 (毕业)' }
  ];

  const filteredAllStudents = useMemo(() => {
    if (!searchTerm) return students;
    const lower = searchTerm.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(lower) || s.ic.toLowerCase().includes(lower) || formatClassName(s.classYear, s.classColor).toLowerCase().includes(lower));
  }, [students, searchTerm]);

  const filteredPromoStudents = useMemo(() => {
    if (!promoSearchTerm) return students;
    const lower = promoSearchTerm.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(lower) || s.ic.toLowerCase().includes(lower));
  }, [students, promoSearchTerm]);

  const downloadTemplate = () => {
    if (typeof window.XLSX === 'undefined') return showMessage("错误", "组件未加载");
    const headers = ["KELAS", "TARIKH MASUK", "NO.RUJ IDME", "NO RUJ SEK", "NAMA MURID", "姓名", "JANTINA", "RUMAH SUKAN", "SURAT BERANAK", "TARIKH LAHIR", "ic", "IC MURID", "EMAIL DELIMA", "PASSWORD"];
    const dummyData = [["1H", "12/1/2026", "231203013003", "2026001", "ABNERCHRIS ARAPOC NICHOLAS", "艾纳士", "L", "H", "SC 055497", "16/11/2019", "191116-12-0253", "191116-12-0253", "abnerchrisarapocnicholas@moe-dl.edu.my", "Kmbft@0253"]];
    const ws = window.XLSX.utils.aoa_to_sheet([headers, ...dummyData]);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Template");
    window.XLSX.writeFile(wb, "Template_Data_Murid_SJKC.xlsx");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || typeof window.XLSX === 'undefined') return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = window.XLSX.read(evt.target.result, { type: 'binary' });
        const data = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false });
        let successCount = 0;
        for (const row of data) {
          let sName = String(row['NAMA MURID'] || '').trim();
          const cName = String(row['姓名'] || '').trim();
          if (sName && cName) sName = `${sName} (${cName})`; else if (!sName && cName) sName = cName;
          let cVal = String(row['KELAS'] || row['NO'] || '').trim(), pYear = '1', pColor = 'H';
          if (cVal) { const match = cVal.match(/^(\d+)(.*)$/); if (match) { pYear = match[1]; pColor = match[2].trim().toUpperCase() || 'H'; } else pYear = cVal; }
          const ns = {
            ic: String(row['IC MURID'] || row['IC号码'] || '').trim(), rawIc: String(row['ic'] || '').trim(),
            name: sName, studentId: String(row['NO RUJ SEK'] || row['ID MURID'] || ''), delimaId: String(row['EMAIL DELIMA'] || row['MOE EMAIL'] || ''),
            password: String(row['PASSWORD'] || row['MOE PASSWORD'] || ''), idme: String(row['NO.RUJ IDME'] || row['IDME'] || ''),
            admissionDate: String(row['TARIKH MASUK'] || ''), sportsHouse: String(row['RUMAH SUKAN'] || ''), gender: String(row['JANTINA'] || ''),
            birthCert: String(row['SURAT BERANAK'] || ''), dob: String(row['TARIKH LAHIR'] || ''), classYear: pYear, classColor: pColor, status: 'Active'
          };
          if (ns.ic && ns.name) { await setDoc(doc(db, getCollectionPath('students'), ns.ic), ns); successCount++; }
        }
        showMessage("导入成功", `成功读取并存入 ${successCount} 名学生资料。`);
        if (window.logSystemAction) window.logSystemAction('admin', '批量导入', `通过 Excel 成功导入/更新了 ${successCount} 名学生资料`);
      } catch (err) { showMessage("导入失败", err.message); }
    };
    reader.readAsBinaryString(file);
  };

  const promptYearlyPromotion = () => {
    setConfirmModal({
      message: "确定要进行年度升学操作吗？\n六年级将移至毕业班，其余年级将自动升一级。此操作不可逆！",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          let count = 0;
          for (const s of students) {
            let nYear = s.classYear;
            if (nYear === '19' || nYear === '20') continue;
            const yInt = parseInt(nYear, 10);
            if (yInt === 6) nYear = '20'; else if (yInt >= 1 && yInt <= 5) nYear = String(yInt + 1);
            if (nYear !== s.classYear) { await updateDoc(doc(db, getCollectionPath('students'), s.id), { classYear: nYear, graduationDate: nYear === '20' ? new Date().toISOString().split('T')[0] : null }); count++; }
          }
          showMessage("操作成功", `已成功调整 ${count} 名学生的班级。`);
          if (window.logSystemAction) window.logSystemAction('admin', '年度升学', `自动升学调整，变动 ${count} 人`);
        } catch (err) { showMessage("错误", "升学处理失败: " + err.message); }
      }
    });
  };

  const handlePromoEditChange = (id, field, value) => setPromoEdits(p => ({ ...p, [id]: { ...(p[id] || {}), [field]: value } }));
  const saveManualPromo = async (id, os) => {
    const upd = promoEdits[id]; if (!upd) return;
    try {
      const nYear = upd.classYear !== undefined ? upd.classYear : os.classYear;
      const nColor = upd.classColor !== undefined ? upd.classColor : os.classColor;
      await updateDoc(doc(db, getCollectionPath('students'), id), { classYear: nYear, classColor: nColor, graduationDate: nYear === '20' ? new Date().toISOString().split('T')[0] : os.graduationDate });
      showMessage("成功", `成功更新 ${os.name} 的班级。`);
      setPromoEdits(p => { const next = { ...p }; delete next[id]; return next; });
    } catch (err) { showMessage("错误", "更新失败: " + err.message); }
  };

  const promptDeleteStudent = (student) => {
    setConfirmModal({
      message: `确认要彻底删除学生 [${student.name}] 吗？此操作无法恢复！`,
      onConfirm: async () => {
        setConfirmModal(null);
        try { await deleteDoc(doc(db, getCollectionPath('students'), student.id)); showMessage("成功", "已删除。"); } catch (err) { showMessage("错误", err.message); }
      }
    });
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try { await updateDoc(doc(db, getCollectionPath('students'), editStudent.id), editStudent); showMessage("成功", "更新成功。"); setEditStudent(null); } 
    catch (err) { showMessage("错误", err.message); }
  };

  const handleAddSingleStudent = async (e) => {
    e.preventDefault();
    try {
      if (!newStudentForm.ic || !newStudentForm.name) { showMessage("错误", "姓名和IC号码为必填项。"); return; }
      const ns = { ...newStudentForm, rawIc: newStudentForm.ic, status: 'Active' };
      await setDoc(doc(db, getCollectionPath('students'), ns.ic), ns);
      showMessage("成功", `已成功添加学生 [${ns.name}]。`);
      if (window.logSystemAction) window.logSystemAction('admin', '手动新增学生', `手动新增了新生 [${ns.name}]`);
      setIsAddingStudent(false);
      setNewStudentForm({ name: '', ic: '', classYear: '1', classColor: 'H', delimaId: '', password: '', gender: 'L', studentId: '', idme: '', birthCert: '', dob: '', sportsHouse: '' });
    } catch (err) { showMessage("错误", err.message); }
  };

  // ---------- 标签 2：通告与活动管理 ----------
  const [annForm, setAnnForm] = useState({ title: '', content: '', type: 'App', link: '', image: '' });
  const [editAnn, setEditAnn] = useState(null); 

  const handleAnnImage = (e) => compressImage(e.target.files[0], (data) => setAnnForm({...annForm, image: data}));
  const handleEditAnnImage = (e) => compressImage(e.target.files[0], (data) => setEditAnn({...editAnn, image: data}));

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(collection(db, getCollectionPath('announcements'))), { ...annForm, date: new Date().toISOString().split('T')[0] });
      showMessage("成功", "已发布最新公告。"); setAnnForm({ title: '', content: '', type: 'App', link: '', image: '' });
    } catch (err) { showMessage("错误", err.message); }
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, getCollectionPath('announcements'), editAnn.id), {
        title: editAnn.title,
        type: editAnn.type,
        content: editAnn.content,
        link: editAnn.link,
        image: editAnn.image || ''
      });
      showMessage("成功", "公告已成功更新。");
      if (window.logSystemAction) window.logSystemAction('admin', '修改通告', `更新了通告 [${editAnn.title}]`);
      setEditAnn(null);
    } catch (err) {
      showMessage("错误", "更新失败: " + err.message);
    }
  };

  const promptDeleteAnnouncement = (id) => {
    setConfirmModal({ message: "确定要删除这条公告吗？", onConfirm: async () => { setConfirmModal(null); await deleteDoc(doc(db, getCollectionPath('announcements'), id)); } });
  };

  // ---------- 标签 3：访客与系统日志 ----------
  const exportLogsToExcel = () => {
    if (typeof window.XLSX === 'undefined') { showMessage("错误", "Excel导出工具尚未加载，请稍等。"); return; }
    const exportData = logs.map(l => ({
      "时间 (Masa)": new Date(l.timestamp).toLocaleString(),
      "身份 (Peranan)": l.role === 'admin' ? '管理员 (Admin)' : l.role === 'teacher' ? '教师 (Guru)' : '访客/家长 (Pelawat)',
      "操作类别 (Tindakan)": l.action,
      "详细内容 (Butiran)": l.details
    }));
    const ws = window.XLSX.utils.json_to_sheet(exportData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "System_Logs");
    window.XLSX.writeFile(wb, `System_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ---------- 标签 4：学校报告与数据管理 ----------
  const [reportForm, setReportForm] = useState({ title: '', content: '', image: '', studentUsage: '', teacherUsage: '' });
  const [editReport, setEditReport] = useState(null); 

  const handleReportImage = (e) => compressImage(e.target.files[0], (data) => setReportForm({...reportForm, image: data}));
  const handleEditReportImage = (e) => compressImage(e.target.files[0], (data) => setEditReport({...editReport, image: data}));

  const handleAddReport = async (e) => {
    e.preventDefault();
    try {
      const newRef = doc(collection(db, getCollectionPath('schoolReports')));
      await setDoc(newRef, { 
        ...reportForm, 
        studentUsage: reportForm.studentUsage ? Number(reportForm.studentUsage) : null,
        teacherUsage: reportForm.teacherUsage ? Number(reportForm.teacherUsage) : null,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      });
      showMessage("成功", "学校报告已成功保存并在首页展示。");
      if (window.logSystemAction) window.logSystemAction('admin', '发布报告', `发布了官方报告 [${reportForm.title}]`);
      setReportForm({ title: '', content: '', image: '', studentUsage: '', teacherUsage: '' });
      const f = document.getElementById('report-image-upload'); if (f) f.value = '';
    } catch (err) { showMessage("错误", "保存失败: " + err.message); }
  };

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, getCollectionPath('schoolReports'), editReport.id), {
        title: editReport.title,
        content: editReport.content,
        studentUsage: editReport.studentUsage ? Number(editReport.studentUsage) : null,
        teacherUsage: editReport.teacherUsage ? Number(editReport.teacherUsage) : null,
        image: editReport.image || '',
        timestamp: new Date().toISOString() 
      });
      showMessage("成功", "学校报告资料已成功更新。");
      if (window.logSystemAction) window.logSystemAction('admin', '修改报告', `更新了官方报告 [${editReport.title}]`);
      setEditReport(null);
    } catch (err) {
      showMessage("错误", "更新失败: " + err.message);
    }
  };

  const promptDeleteReport = (id, title) => {
    setConfirmModal({ 
      message: "确定要彻底删除这篇官方报告吗？首页将不再显示。", 
      onConfirm: async () => { 
        setConfirmModal(null); 
        await deleteDoc(doc(db, getCollectionPath('schoolReports'), id)); 
        if (window.logSystemAction) window.logSystemAction('admin', '删除报告', `删除了官方报告 [${title}]`);
      } 
    });
  };

  // ---------- 标签 5：Admin 备注记录 (私密) ----------
  const [noteForm, setNoteForm] = useState({ title: '', content: '', link: '', image: '' });
  const handleNoteImage = (e) => compressImage(e.target.files[0], (data) => setNoteForm({...noteForm, image: data}));

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      const newRef = doc(collection(db, getCollectionPath('adminNotes')));
      await setDoc(newRef, { 
        ...noteForm, 
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      });
      showMessage("成功", "私密备注已保存。");
      setNoteForm({ title: '', content: '', link: '', image: '' });
      const f = document.getElementById('note-image-upload'); if (f) f.value = '';
    } catch (err) { showMessage("错误", "保存失败: " + err.message); }
  };

  const promptDeleteNote = (id) => {
    setConfirmModal({ message: "确定要删除这条私密备注吗？", onConfirm: async () => { setConfirmModal(null); await deleteDoc(doc(db, getCollectionPath('adminNotes'), id)); } });
  };

  // ---------- 新增标签：DELIMA 制卡申请管理 ----------
  const reasonOptions = ['遗失 (Hilang)', '替换 (Ganti)', '修改 (Pindaan)', '损坏 (Rosak)', '更新 (Kemas Kini)', '新生 (Murid Baru)', '其他 (Lain-lain)'];
  const [cardReason, setCardReason] = useState(reasonOptions[0]);
  const [cardSearchTerm, setCardSearchTerm] = useState('');
  const [selectedForCard, setSelectedForCard] = useState([]);

  const cardStudentOptions = useMemo(() => {
    if (!cardSearchTerm) return [];
    const lower = cardSearchTerm.toLowerCase();
    return students.filter(s => 
      (s.name.toLowerCase().includes(lower) || s.ic.toLowerCase().includes(lower)) 
      && !selectedForCard.find(sel => sel.ic === s.ic)
    ).slice(0, 5); 
  }, [students, cardSearchTerm, selectedForCard]);

  const handleSelectForCard = (student) => {
    setSelectedForCard([...selectedForCard, student]);
    setCardSearchTerm('');
  };

  const handleRemoveFromCard = (ic) => {
    setSelectedForCard(selectedForCard.filter(s => s.ic !== ic));
  };

  const handleAddCardRequests = async (e) => {
    e.preventDefault();
    if (selectedForCard.length === 0) return showMessage("提示", "请先在上方搜索并选择需要制卡的学生。");
    try {
      let count = 0;
      for (const s of selectedForCard) {
        const newRef = doc(collection(db, getCollectionPath('cardRequests')));
        await setDoc(newRef, {
          studentIc: s.ic,
          studentName: s.name,
          classYear: s.classYear,
          classColor: s.classColor,
          reason: cardReason,
          status: 'pending',
          requestedAt: new Date().toISOString(),
        });
        count++;
      }
      showMessage("成功", `已成功加入 ${count} 位学生的制卡要求。`);
      if (window.logSystemAction) window.logSystemAction('admin', '新增制卡', `批量加入了 ${count} 个制卡申请`);
      setSelectedForCard([]);
      setCardReason(reasonOptions[0]);
    } catch(err) {
      showMessage("错误", "添加失败: " + err.message);
    }
  };

  const toggleCardStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
      const updateData = { status: newStatus };
      if (newStatus === 'completed') updateData.completedAt = new Date().toISOString();
      else updateData.completedAt = null;
      await updateDoc(doc(db, getCollectionPath('cardRequests'), id), updateData);
    } catch(err) {
      showMessage("错误", "状态更新失败: " + err.message);
    }
  };

  const deleteCardRequest = (id) => {
    setConfirmModal({
      message: "确定要彻底删除这条制卡记录吗？",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteDoc(doc(db, getCollectionPath('cardRequests'), id));
        } catch(err) {
          showMessage("错误", "删除失败: " + err.message);
        }
      }
    });
  };

  const exportCardRequestsToExcel = (statusFilter) => {
    if (typeof window.XLSX === 'undefined') return showMessage("错误", "组件未加载");
    
    const filteredRequests = statusFilter ? cardRequests.filter(r => r.status === statusFilter) : cardRequests;
    
    if (filteredRequests.length === 0) {
      return showMessage("提示", "当前没有符合条件的数据可供导出。");
    }

    const exportData = filteredRequests.map(r => {
      const studentInfo = students.find(s => s.ic === r.studentIc) || {};
      const malayName = studentInfo.name?.includes('(') ? studentInfo.name.split('(')[0].trim() : (studentInfo.name || r.studentName);
      const chineseName = studentInfo.name?.includes('(') ? studentInfo.name.split('(')[1].replace(')', '').trim() : '';

      return {
        "NO": formatSimpleClassName(studentInfo.classYear || r.classYear, studentInfo.classColor || r.classColor),
        "NO.RUJ IDME": studentInfo.idme || '',
        "NO RUJ SEK": studentInfo.studentId || '',
        "NAMA MURID": malayName,
        "姓名": chineseName,
        "性别": studentInfo.gender || '',
        "RUMAH SUKAN": studentInfo.sportsHouse || '',
        "SURAT BERANAK": studentInfo.birthCert || '',
        "TARIKH LAHIR": studentInfo.dob || '',
        "IC": r.studentIc,
        "EMAL DELIMA": studentInfo.delimaId || '',
        "PASSWORD": studentInfo.password || ''
      };
    });

    const ws = window.XLSX.utils.json_to_sheet(exportData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "MailMergeData");
    const fileNameStatus = statusFilter === 'pending' ? 'Menunggu' : (statusFilter === 'completed' ? 'Selesai' : 'Semua');
    window.XLSX.writeFile(wb, `MailMerge_Kad_${fileNameStatus}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    showMessage("导出成功", `Excel 文件已下载！\n\n此 Excel 格式已完全适配您的 TEMPLETE.docx。\n\n请打开 Word 文档，点击顶部的【邮件(Mailings)】->【选择收件人(Select Recipients)】->【使用现有列表(Use an Existing List)】，然后载入此 Excel，即可一键完成 Mail Merge 制卡！`);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border-t-8 border-purple-800 animate-fade-in relative">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-purple-900 flex items-center gap-3">
          <Settings size={32} className="text-purple-600" /> Admin 控制台
        </h2>
        <div className="bg-purple-50 border border-purple-100 text-purple-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm">
          全校已录入: <span className="text-purple-900 text-base">{students.length}</span> 人
        </div>
      </div>
      
      {/* 顶部主导航菜单 */}
      <div className="flex flex-wrap gap-3 mb-8 border-b-2 border-gray-100 pb-4">
        <button onClick={() => setAdminMainTab('students_mgmt')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${adminMainTab === 'students_mgmt' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-purple-100'}`}>
          <UserCheck size={18} /> 学生综合管理
        </button>
        <button onClick={() => setAdminMainTab('announcements')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${adminMainTab === 'announcements' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-purple-100'}`}>
          <BookOpen size={18} /> 通告与活动管理
        </button>
        <button onClick={() => setAdminMainTab('card_requests')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${adminMainTab === 'card_requests' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-indigo-100'}`}>
          <CreditCard size={18} /> DELIMA 制卡管理
        </button>
        <button onClick={() => setAdminMainTab('school_reports')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${adminMainTab === 'school_reports' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-blue-100'}`}>
          <BarChart size={18} /> 学校报告与数据
        </button>
        <button onClick={() => setAdminMainTab('sys_logs')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${adminMainTab === 'sys_logs' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-green-100'}`}>
          <ClipboardList size={18} /> 访客与系统日志
        </button>
        <button onClick={() => setAdminMainTab('admin_notes')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${adminMainTab === 'admin_notes' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-red-100'}`}>
          <Edit size={18} /> Admin 备注
        </button>
      </div>

      {/* ======================= 新增模块：DELIMA 制卡申请管理 ======================= */}
      {adminMainTab === 'card_requests' && (
        <div className="space-y-8 animate-slide-up">
          {/* Admin 批量添加区 */}
          <div className="bg-indigo-50/50 border border-indigo-100 p-6 md:p-8 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-indigo-900 mb-2 flex items-center gap-2"><CreditCard size={24}/> 新增制卡申请</h3>
            <p className="text-sm text-gray-600 mb-6">可同时搜索并选择多位学生，选定原因后一键加入待处理列表。（教师端提交的申请也会显示在下方）</p>
            
            <form onSubmit={handleAddCardRequests} className="space-y-5">
              <div className="relative z-20">
                <label className="block text-sm font-bold text-gray-700 mb-2">1. 搜索并选择学生 (可多选)</label>
                <div className="relative">
                  <input type="text" placeholder="输入姓名或 IC..." value={cardSearchTerm} onChange={(e) => setCardSearchTerm(e.target.value)} className="w-full p-3 pl-10 border border-indigo-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
                  <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
                {cardStudentOptions.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden">
                    {cardStudentOptions.map(s => (
                      <div key={s.id} onClick={() => handleSelectForCard(s)} className="p-3 hover:bg-indigo-50 cursor-pointer border-b last:border-b-0 text-sm flex justify-between">
                        <span className="font-bold">{s.name}</span>
                        <span className="text-gray-500">{formatSimpleClassName(s.classYear, s.classColor)} | {s.ic}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedForCard.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-white border border-indigo-100 rounded-xl min-h-[60px]">
                  {selectedForCard.map(s => (
                    <div key={s.ic} className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 font-semibold shadow-sm">
                      {s.name} ({formatSimpleClassName(s.classYear, s.classColor)})
                      <button type="button" onClick={() => handleRemoveFromCard(s.ic)} className="text-indigo-400 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">2. 选择制卡原因</label>
                  <select value={cardReason} onChange={(e) => setCardReason(e.target.value)} className="w-full p-3 border border-indigo-200 rounded-xl text-base outline-none focus:border-indigo-500 bg-white">
                    {reasonOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full md:w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md">
                  3. 提交制卡申请
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-3 mb-2 mt-4">
            <button onClick={() => exportCardRequestsToExcel('pending')} className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all">
              <Download size={18} /> 导出待处理 (用于 Mail Merge 制卡)
            </button>
            <button onClick={() => exportCardRequestsToExcel('completed')} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all">
              <Download size={18} /> 导出已完成 (存档备份)
            </button>
          </div>

          {/* 待处理列表 */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-sm">待处理 (Menunggu)</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="bg-gray-50"><tr className="text-gray-600 text-sm border-b"><th className="p-3 w-16 text-center">完成</th><th className="p-3">要求时间</th><th className="p-3">姓名</th><th className="p-3">班级</th><th className="p-3">IC</th><th className="p-3">原因</th><th className="p-3 text-center">操作</th></tr></thead>
                <tbody>
                  {cardRequests.filter(r => r.status === 'pending').map((r, idx) => (
                    <tr key={r.id} className={`text-sm border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
                      <td className="p-3 text-center">
                        <button onClick={() => toggleCardStatus(r.id, r.status)} className="text-gray-300 hover:text-green-500 transition-colors" title="打钩标记为已完成">
                          <CheckCircle size={28} />
                        </button>
                      </td>
                      <td className="p-3 text-gray-500">{new Date(r.requestedAt).toLocaleString()}</td>
                      <td className="p-3 font-bold">{r.studentName}</td>
                      <td className="p-3">{formatClassName(r.classYear, r.classColor)}</td>
                      <td className="p-3 font-mono">{r.studentIc}</td>
                      <td className="p-3"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-semibold text-xs">{r.reason}</span></td>
                      <td className="p-3 text-center"><button onClick={() => deleteCardRequest(r.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                  {cardRequests.filter(r => r.status === 'pending').length === 0 && <tr><td colSpan="7" className="p-6 text-center text-gray-500">目前没有待处理的制卡申请。</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* 已完成列表 */}
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-sm">已完成 (Selesai)</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="bg-gray-50"><tr className="text-gray-600 text-sm border-b"><th className="p-3 w-16 text-center">撤销</th><th className="p-3">完成时间</th><th className="p-3">姓名</th><th className="p-3">班级</th><th className="p-3">IC</th><th className="p-3">原因</th><th className="p-3 text-center">操作</th></tr></thead>
                <tbody>
                  {cardRequests.filter(r => r.status === 'completed').map((r, idx) => (
                    <tr key={r.id} className={`text-sm border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
                      <td className="p-3 text-center">
                        <button onClick={() => toggleCardStatus(r.id, r.status)} className="text-amber-500 hover:text-amber-700 transition-colors" title="撤销回待处理状态">
                          <Undo size={20} />
                        </button>
                      </td>
                      <td className="p-3 text-green-600 font-semibold">{r.completedAt ? new Date(r.completedAt).toLocaleString() : '-'}</td>
                      <td className="p-3 font-bold">{r.studentName}</td>
                      <td className="p-3">{formatClassName(r.classYear, r.classColor)}</td>
                      <td className="p-3 font-mono">{r.studentIc}</td>
                      <td className="p-3 text-gray-500">{r.reason}</td>
                      <td className="p-3 text-center"><button onClick={() => deleteCardRequest(r.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                  {cardRequests.filter(r => r.status === 'completed').length === 0 && <tr><td colSpan="7" className="p-6 text-center text-gray-500">目前没有已完成的制卡记录。</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= 模块 1：学生综合管理 ======================= */}
      {adminMainTab === 'students_mgmt' && (
        <div className="space-y-12 animate-slide-up">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h3 className="text-lg md:text-xl font-bold text-purple-800">全校学生名单管理</h3>
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <button onClick={() => setIsAddingStudent(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all whitespace-nowrap">
                  ➕ 新增一位学生
                </button>
                <div className="relative w-full md:w-64">
                  <input type="text" placeholder="搜索姓名、IC 或 班级..." className="w-full p-2.5 pl-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-purple-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="sticky top-0 bg-gray-50 shadow-sm z-10"><tr className="text-gray-600 text-sm border-b border-gray-200"><th className="p-4">姓名</th><th className="p-4">班级</th><th className="p-4">IC MURID</th><th className="p-4">ic (小写)</th><th className="p-4">性别</th><th className="p-4">DELIMA Email</th><th className="p-4">密码</th><th className="p-4">学号</th><th className="p-4">IDME</th><th className="p-4">出生日期</th><th className="p-4">报生纸</th><th className="p-4">入学日期</th><th className="p-4">运动队伍</th><th className="p-4 text-center sticky right-0 bg-gray-50">操作</th></tr></thead>
                <tbody>
                  {filteredAllStudents.map((s, idx) => (
                    <tr key={s.id} className={`text-sm border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'} hover:bg-purple-50`}><td className="p-4 font-bold">{s.name}</td><td className="p-4">{formatClassName(s.classYear, s.classColor)}</td><td className="p-4 font-mono">{s.ic}</td><td className="p-4 font-mono text-gray-500">{s.rawIc}</td><td className="p-4">{s.gender}</td><td className="p-4 font-mono text-purple-600">{s.delimaId}</td><td className="p-4 font-mono">{s.password}</td><td className="p-4 font-mono">{s.studentId}</td><td className="p-4 font-mono">{s.idme}</td><td className="p-4">{s.dob}</td><td className="p-4 font-mono">{s.birthCert}</td><td className="p-4">{s.admissionDate}</td><td className="p-4">{s.sportsHouse}</td><td className="p-4 flex gap-2 sticky right-0" style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}><button onClick={() => setEditStudent({ ...s })} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold"><Edit size={16} /> 编辑</button><button onClick={() => promptDeleteStudent(s)} className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold"><Trash2 size={16} /> 删除</button></td></tr>
                  ))}
                  {filteredAllStudents.length === 0 && (<tr><td colSpan="14" className="p-8 text-center text-gray-500">未找到符合条件的学生</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-purple-50/50 p-6 md:p-8 rounded-2xl border border-purple-100">
            <div className="flex justify-between items-center mb-6 gap-4">
              <div><h3 className="text-lg font-bold text-purple-800 mb-1">批量导入学生数据</h3><p className="text-xs text-gray-600">请下载模板，系统会以 `IC MURID` 作为唯一识别，自动更新或新增。</p></div>
              <button onClick={downloadTemplate} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"><Download size={20} /> 下载模板</button>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-purple-300 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-purple-50"><Upload size={36} className="text-purple-400 mb-2" /><p className="font-bold text-gray-700">点击或拖拽上传填写好的 Excel 文件</p><input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} /></label>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h3 className="text-xl font-bold text-amber-800 flex items-center gap-2"><RefreshCw size={24}/> 升学与班级管理</h3>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setPromoMode('auto')} className={`px-4 py-2 rounded-lg font-bold text-sm ${promoMode === 'auto' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500'}`}>一键升学</button>
                <button onClick={() => setPromoMode('manual')} className={`px-4 py-2 rounded-lg font-bold text-sm ${promoMode === 'manual' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500'}`}>手动调班</button>
              </div>
            </div>
            {promoMode === 'auto' ? (
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 text-center">
                <p className="text-gray-700 mb-4">自动把一年级升至二年级，依此类推。六年级将被移入毕业班 (第20班)。</p>
                <button onClick={promptYearlyPromotion} className="bg-amber-500 hover:bg-amber-600 text-white text-base font-bold px-8 py-3 rounded-xl shadow-md">执行一键升学</button>
              </div>
            ) : (
              <div>
                <input type="text" placeholder="搜索学生..." className="w-full md:w-1/3 p-2.5 border rounded-xl text-sm mb-4" value={promoSearchTerm} onChange={(e) => setPromoSearchTerm(e.target.value)} />
                <div className="overflow-x-auto rounded-xl border max-h-[400px]">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead className="sticky top-0 bg-gray-50 z-10"><tr className="text-gray-600 text-sm border-b"><th className="p-3">姓名</th><th className="p-3">IC</th><th className="p-3">原班级</th><th className="p-3">修改年级</th><th className="p-3">修改班名</th><th className="p-3 text-center">操作</th></tr></thead>
                    <tbody>
                      {filteredPromoStudents.map((s, idx) => {
                        const ey = promoEdits[s.id]?.classYear !== undefined ? promoEdits[s.id].classYear : s.classYear;
                        const ec = promoEdits[s.id]?.classColor !== undefined ? promoEdits[s.id].classColor : s.classColor;
                        const hc = ey !== s.classYear || ec !== s.classColor;
                        return (
                          <tr key={s.id} className={`text-sm border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
                            <td className="p-3 font-bold">{s.name}</td><td className="p-3 font-mono">{s.ic}</td><td className="p-3">{formatClassName(s.classYear, s.classColor)}</td>
                            <td className="p-3"><select className="p-1.5 border rounded-md" value={ey} onChange={e => handlePromoEditChange(s.id, 'classYear', e.target.value)}>{years.map(y => <option key={y.val} value={y.val}>{y.label}</option>)}</select></td>
                            <td className="p-3"><input type="text" className="p-1.5 border rounded-md w-16 text-center" value={ec} onChange={e => handlePromoEditChange(s.id, 'classColor', e.target.value.toUpperCase())} /></td>
                            <td className="p-3 text-center"><button disabled={!hc} onClick={() => saveManualPromo(s.id, s)} className={`px-3 py-1.5 rounded-lg font-bold text-xs ${hc ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>保存</button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= 模块 2：通告与活动管理 ======================= */}
      {adminMainTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-5 flex items-center gap-2"><BookOpen size={24}/> 发布新通告/App介绍</h3>
            <form onSubmit={handleAddAnnouncement} className="space-y-4">
              <input required type="text" placeholder="通告标题" value={annForm.title} onChange={e=>setAnnForm({...annForm, title: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-4">
                <select value={annForm.type} onChange={e=>setAnnForm({...annForm, type: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm"><option value="App">App 推荐</option><option value="Activity">活动通告</option></select>
                <input type="url" placeholder="附加链接 https://" value={annForm.link} onChange={e=>setAnnForm({...annForm, link: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" />
              </div>
              <textarea required rows="4" placeholder="内容描述..." value={annForm.content} onChange={e=>setAnnForm({...annForm, content: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm"></textarea>
              <div>
                <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed rounded-lg bg-gray-50 cursor-pointer text-sm text-gray-600"><ImageIcon size={18} /> 附加宣传照片<input type="file" id="announcement-image-upload" accept="image/*" onChange={handleAnnImage} className="hidden" /></label>
                {annForm.image && <div className="relative mt-2"><img src={annForm.image} alt="预览" className="h-20 w-auto rounded border" /><button type="button" onClick={() => {setAnnForm({...annForm, image: ''}); document.getElementById('announcement-image-upload').value='';}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><Trash2 size={12}/></button></div>}
              </div>
              <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg">发布通告</button>
            </form>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl h-[480px] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-5">已发布通告</h3>
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                  {a.image && <img src={a.image} alt="" className="w-12 h-12 object-cover rounded" />}
                  <div className="flex-1"><span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">{a.type}</span><h4 className="font-bold mt-1 text-sm">{a.title}</h4></div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditAnn({...a})} className="text-blue-500 p-2 hover:bg-blue-50 rounded"><Edit size={18} /></button>
                    <button onClick={() => promptDeleteAnnouncement(a.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-center text-gray-400 mt-10">暂无发布的公告。</p>}
            </div>
          </div>
        </div>
      )}

      {/* ======================= 新增模块：访客与系统操作记录 ======================= */}
      {adminMainTab === 'sys_logs' && (
        <div className="space-y-8 animate-slide-up">
          <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
              <div>
                <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <ClipboardList size={28}/> 系统访客与操作记录 (Log Sistem)
                </h3>
                <p className="text-sm text-gray-600">
                  记录系统内所有的登入、资料修改、人员调动以及家长/学生的查询记录（共 {logs.length} 条记录）。
                </p>
              </div>
              <button 
                onClick={exportLogsToExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all whitespace-nowrap"
              >
                <Download size={20} /> 导出日志为 Excel
              </button>
            </div>
            
            <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3">
              {logs.map(log => {
                let isFail = log.action.includes('失败') || log.details.includes('失败') || log.details.includes('错误');
                let isSuccess = log.action.includes('成功') || log.details.includes('成功');
                let rowColorClass = "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700";
                
                if (isFail) {
                  rowColorClass = "bg-red-50 hover:bg-red-100 border-red-200 text-red-800";
                } else if (isSuccess) {
                  rowColorClass = "bg-green-50 hover:bg-green-100 border-green-200 text-green-800";
                }

                return (
                  <div key={log.id} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center gap-3 transition-colors ${rowColorClass}`}>
                    <span className="text-gray-500 text-xs md:text-sm font-mono md:w-48 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${
                      log.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                      log.role === 'teacher' ? 'bg-amber-100 text-amber-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {log.role === 'admin' ? '管理员' : log.role === 'teacher' ? '教师' : '访客/家长'}
                    </span>
                    <span className="font-bold text-sm md:w-32">{log.action}</span>
                    <span className="text-sm flex-1 leading-relaxed opacity-90">{log.details}</span>
                  </div>
                );
              })}
              {logs.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-2xl">
                  当前系统还没有任何操作记录。
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================= 模块 4：学校报告与数据管理 ======================= */}
      {adminMainTab === 'school_reports' && (
        <div className="space-y-8 animate-slide-up">
          <div className="bg-blue-50/50 p-6 md:p-8 rounded-2xl border border-blue-200 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-2 flex items-center gap-2"><FileText size={24} /> 记录官方报告与使用率</h3>
              <p className="text-sm text-gray-600 mb-6">这里填写的报告和使用率会自动展示在家长首页的横幅区域，供全校及教育局视察查阅。</p>
              
              <form onSubmit={handleAddReport} className="space-y-4">
                <input required type="text" placeholder="报告标题 (如: Laporan Penggunaan DELIMA Bulan Ini)" value={reportForm.title} onChange={e=>setReportForm({...reportForm, title: e.target.value})} className="w-full p-3 border border-blue-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                <textarea required rows="4" placeholder="详细报告内容说明..." value={reportForm.content} onChange={e=>setReportForm({...reportForm, content: e.target.value})} className="w-full p-3 border border-blue-200 rounded-xl text-sm outline-none focus:border-blue-500"></textarea>
                
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-gray-500 mb-1 block">学生使用率 (%)</label><input type="number" min="0" max="100" placeholder="例如: 85" value={reportForm.studentUsage} onChange={e=>setReportForm({...reportForm, studentUsage: e.target.value})} className="w-full p-3 border border-blue-200 rounded-xl text-sm" /></div>
                  <div><label className="text-xs font-bold text-gray-500 mb-1 block">老师使用率 (%)</label><input type="number" min="0" max="100" placeholder="例如: 90" value={reportForm.teacherUsage} onChange={e=>setReportForm({...reportForm, teacherUsage: e.target.value})} className="w-full p-3 border border-blue-200 rounded-xl text-sm" /></div>
                </div>

                <div>
                  <label className="flex items-center justify-center gap-2 p-3 border-2 border-blue-200 border-dashed rounded-xl bg-white cursor-pointer text-sm text-blue-600 hover:bg-blue-50 transition-colors font-bold"><ImageIcon size={18} /> 附带报告照片证据<input type="file" id="report-image-upload" accept="image/*" onChange={handleReportImage} className="hidden" /></label>
                  {reportForm.image && <div className="relative mt-3"><img src={reportForm.image} alt="预览" className="h-32 w-auto object-contain rounded-lg border border-blue-100 bg-white" /><button type="button" onClick={() => {setReportForm({...reportForm, image: ''}); document.getElementById('report-image-upload').value='';}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5"><Trash2 size={14}/></button></div>}
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-lg mt-4 transition-colors shadow-md">发布学校官方报告</button>
              </form>
            </div>

            <div className="bg-white border border-blue-100 p-6 rounded-2xl shadow-sm h-[550px] overflow-y-auto">
              <h3 className="text-lg font-bold text-blue-900 mb-5">已发布的学校报告</h3>
              <div className="space-y-4">
                {schoolReports.map(rep => (
                  <div key={rep.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 shadow-sm relative overflow-hidden group">
                    <p className="text-xs text-blue-500 font-bold mb-1">{rep.date}</p>
                    <h4 className="font-bold text-gray-800 text-base mb-2 pr-8">{rep.title}</h4>
                    {rep.image && <img src={rep.image} alt="report" className="w-full h-24 object-cover rounded-md mb-2" />}
                    <div className="flex gap-4 text-xs font-bold text-gray-600 mt-2">
                      {rep.studentUsage && <span>学生: <span className="text-blue-600">{rep.studentUsage}%</span></span>}
                      {rep.teacherUsage && <span>老师: <span className="text-green-600">{rep.teacherUsage}%</span></span>}
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
                      <button onClick={() => setEditReport({ ...rep })} className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"><Edit size={14} /> 编辑</button>
                      <button onClick={() => promptDeleteReport(rep.id, rep.title)} className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"><Trash2 size={14} /> 删除</button>
                    </div>
                  </div>
                ))}
                {schoolReports.length === 0 && <p className="text-center text-gray-400 mt-10">暂无学校报告记录。</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= 模块 5：Admin 备注记录 (新增，私密) ======================= */}
      {adminMainTab === 'admin_notes' && (
        <div className="space-y-8 animate-slide-up">
          <div className="bg-red-50/30 p-6 md:p-8 rounded-2xl border border-red-100 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-red-800 mb-2 flex items-center gap-2"><ClipboardList size={24} /> Admin 专属私密备注 (Nota Peribadi)</h3>
              <p className="text-sm text-gray-600 mb-6">这里的内容绝对不会显示在首页。仅供管理员个人记录重要事项、网址或存底照片。</p>
              
              <form onSubmit={handleAddNote} className="space-y-4">
                <input required type="text" placeholder="备注标题..." value={noteForm.title} onChange={e=>setNoteForm({...noteForm, title: e.target.value})} className="w-full p-3 border border-red-200 rounded-xl text-sm outline-none focus:border-red-400" />
                <textarea required rows="5" placeholder="写下重要记录或备忘录..." value={noteForm.content} onChange={e=>setNoteForm({...noteForm, content: e.target.value})} className="w-full p-3 border border-red-200 rounded-xl text-sm outline-none focus:border-red-400"></textarea>
                <input type="url" placeholder="保存重要网址 (可选)..." value={noteForm.link} onChange={e=>setNoteForm({...noteForm, link: e.target.value})} className="w-full p-3 border border-red-200 rounded-xl text-sm outline-none focus:border-red-400" />
                
                <div>
                  <label className="flex items-center justify-center gap-2 p-3 border-2 border-red-200 border-dashed rounded-xl bg-white cursor-pointer text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"><ImageIcon size={18} /> 存底照片<input type="file" id="note-image-upload" accept="image/*" onChange={handleNoteImage} className="hidden" /></label>
                  {noteForm.image && <div className="relative mt-3"><img src={noteForm.image} alt="预览" className="h-32 w-auto object-contain rounded-lg border border-red-100 bg-white" /><button type="button" onClick={() => {setNoteForm({...noteForm, image: ''}); document.getElementById('note-image-upload').value='';}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5"><Trash2 size={14}/></button></div>}
                </div>
                
                <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl text-lg mt-4 transition-colors shadow-md">保存私密备注</button>
              </form>
            </div>

            <div className="bg-white border border-red-100 p-6 rounded-2xl shadow-sm h-[550px] overflow-y-auto">
              <h3 className="text-lg font-bold text-red-800 mb-5">我的备忘录档案</h3>
              <div className="space-y-4">
                {adminNotes.map(note => (
                  <div key={note.id} className="p-5 rounded-xl border border-red-100 bg-red-50/50 shadow-sm relative overflow-hidden group">
                    <button onClick={() => promptDeleteNote(note.id)} className="absolute top-2 right-2 text-red-500 bg-white p-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                    <h4 className="font-bold text-red-900 text-lg mb-2 pr-8">{note.title}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-3">{note.content}</p>
                    {note.link && <a href={note.link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline block mb-3 break-all">{note.link}</a>}
                    {note.image && <img src={note.image} alt="note" className="w-full h-auto max-h-48 object-cover rounded-md mb-2" />}
                    <div className="text-xs text-gray-400 font-medium text-right mt-3 border-t border-red-100 pt-2">
                      {new Date(note.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
                {adminNotes.length === 0 && <p className="text-center text-gray-400 mt-10">暂无任何私密备注。</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 各种独立弹窗区域 ================= */}

      {/* 编辑学生的独立弹窗 (针对模块 1) */}
      {editStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[105]">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <h3 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-2"><Edit size={24} /> 编辑学生资料</h3>
            <form onSubmit={handleUpdateStudent}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-1">姓名 (NAMA MURID)</label><input required type="text" value={editStudent.name} onChange={(e) => setEditStudent({...editStudent, name: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">IC 号码 <span className="text-red-500 text-xs">不可改</span></label><input disabled type="text" value={editStudent.ic} className="w-full p-2.5 border bg-gray-100 text-gray-500 rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">年级编号 (1~6 或 19, 20)</label><input required type="text" value={editStudent.classYear} onChange={(e) => setEditStudent({...editStudent, classYear: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">班级 (如 H, M)</label><input type="text" value={editStudent.classColor} onChange={(e) => setEditStudent({...editStudent, classColor: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">DELIMA ID</label><input type="text" value={editStudent.delimaId} onChange={(e) => setEditStudent({...editStudent, delimaId: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">密码</label><input type="text" value={editStudent.password} onChange={(e) => setEditStudent({...editStudent, password: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">性别</label><input type="text" value={editStudent.gender} onChange={(e) => setEditStudent({...editStudent, gender: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">学号 (NO RUJ SEK)</label><input type="text" value={editStudent.studentId} onChange={(e) => setEditStudent({...editStudent, studentId: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">IDME</label><input type="text" value={editStudent.idme} onChange={(e) => setEditStudent({...editStudent, idme: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">报生纸 (SURAT BERANAK)</label><input type="text" value={editStudent.birthCert} onChange={(e) => setEditStudent({...editStudent, birthCert: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">出生日期</label><input type="text" value={editStudent.dob} onChange={(e) => setEditStudent({...editStudent, dob: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">运动队伍 (RUMAH SUKAN)</label><input type="text" value={editStudent.sportsHouse} onChange={(e) => setEditStudent({...editStudent, sportsHouse: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
              </div>
              <div className="flex gap-4 mt-8"><button type="button" onClick={() => setEditStudent(null)} className="flex-1 bg-gray-100 font-bold py-3 rounded-xl">取消</button><button type="submit" className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-xl">保存修改</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 新增单名学生的独立弹窗 (针对模块 1) */}
      {isAddingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[105]">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <h3 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-2"><UserCheck size={24} /> 新增一位学生 (Murid Baru)</h3>
            <form onSubmit={handleAddSingleStudent}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-1">姓名 (NAMA MURID)</label><input required type="text" value={newStudentForm.name} onChange={(e) => setNewStudentForm({...newStudentForm, name: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" placeholder="如: AHMAD (阿末)" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">IC 号码 (必填)</label><input required type="text" value={newStudentForm.ic} onChange={(e) => setNewStudentForm({...newStudentForm, ic: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-purple-500" placeholder="如: 140101-12-1234" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">年级编号 (1~6 或 19, 20)</label><input required type="text" value={newStudentForm.classYear} onChange={(e) => setNewStudentForm({...newStudentForm, classYear: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">班级 (如 H, M)</label><input type="text" value={newStudentForm.classColor} onChange={(e) => setNewStudentForm({...newStudentForm, classColor: e.target.value.toUpperCase()})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">DELIMA ID</label><input type="text" value={newStudentForm.delimaId} onChange={(e) => setNewStudentForm({...newStudentForm, delimaId: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">密码</label><input type="text" value={newStudentForm.password} onChange={(e) => setNewStudentForm({...newStudentForm, password: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">性别</label><input type="text" value={newStudentForm.gender} onChange={(e) => setNewStudentForm({...newStudentForm, gender: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" placeholder="如: L/P" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">学号 (NO RUJ SEK)</label><input type="text" value={newStudentForm.studentId} onChange={(e) => setNewStudentForm({...newStudentForm, studentId: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">IDME</label><input type="text" value={newStudentForm.idme} onChange={(e) => setNewStudentForm({...newStudentForm, idme: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">报生纸 (SURAT BERANAK)</label><input type="text" value={newStudentForm.birthCert} onChange={(e) => setNewStudentForm({...newStudentForm, birthCert: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">出生日期</label><input type="text" value={newStudentForm.dob} onChange={(e) => setNewStudentForm({...newStudentForm, dob: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" placeholder="如: 01/01/2014" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">运动队伍 (RUMAH SUKAN)</label><input type="text" value={newStudentForm.sportsHouse} onChange={(e) => setNewStudentForm({...newStudentForm, sportsHouse: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" /></div>
              </div>
              <div className="flex gap-4 mt-8"><button type="button" onClick={() => setIsAddingStudent(false)} className="flex-1 bg-gray-100 font-bold py-3 rounded-xl">取消</button><button type="submit" className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-xl">确认新增</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑通告的独立弹窗 (针对模块 2) */}
      {editAnn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[105]">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <h3 className="text-2xl font-bold text-purple-900 mb-6 flex items-center gap-2"><Edit size={24} /> 编辑通告内容</h3>
            <form onSubmit={handleUpdateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">标题</label>
                <input required type="text" value={editAnn.title} onChange={e=>setEditAnn({...editAnn, title: e.target.value})} className="w-full p-2.5 border border-purple-200 rounded-lg text-sm outline-none focus:border-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">类型</label>
                  <select value={editAnn.type} onChange={e=>setEditAnn({...editAnn, type: e.target.value})} className="w-full p-2.5 border border-purple-200 rounded-lg text-sm outline-none focus:border-purple-500">
                    <option value="App">App 推荐</option><option value="Activity">活动通告</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">附加链接 (可选)</label>
                  <input type="url" value={editAnn.link} onChange={e=>setEditAnn({...editAnn, link: e.target.value})} className="w-full p-2.5 border border-purple-200 rounded-lg text-sm outline-none focus:border-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">内容描述</label>
                <textarea required rows="4" value={editAnn.content} onChange={e=>setEditAnn({...editAnn, content: e.target.value})} className="w-full p-2.5 border border-purple-200 rounded-lg text-sm outline-none focus:border-purple-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">更换宣传照片</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 p-2.5 border border-purple-200 border-dashed rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors text-sm text-purple-700 font-bold">
                    <ImageIcon size={18} /> 上传新照片
                    <input type="file" accept="image/*" onChange={handleEditAnnImage} className="hidden" />
                  </label>
                </div>
                {editAnn.image && (
                  <div className="relative inline-block mt-3">
                    <img src={editAnn.image} alt="预览" className="h-32 w-auto object-contain rounded-lg border border-purple-100 bg-white" />
                    <button 
                      type="button" 
                      onClick={() => setEditAnn({...editAnn, image: ''})} 
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600"
                    >
                       <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setEditAnn(null)} className="flex-1 bg-gray-100 font-bold py-3 rounded-xl">取消</button>
                <button type="submit" className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-xl">保存修改</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑官方报告的独立弹窗 (针对模块 4) */}
      {editReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[105]">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2"><Edit size={24} /> 编辑官方报告</h3>
            <form onSubmit={handleUpdateReport} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">报告标题</label>
                <input required type="text" value={editReport.title} onChange={(e) => setEditReport({...editReport, title: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">详细说明</label>
                <textarea required rows="4" value={editReport.content} onChange={(e) => setEditReport({...editReport, content: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">学生使用率 (%)</label>
                  <input type="number" min="0" max="100" value={editReport.studentUsage || ''} onChange={(e) => setEditReport({...editReport, studentUsage: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">老师使用率 (%)</label>
                  <input type="number" min="0" max="100" value={editReport.teacherUsage || ''} onChange={(e) => setEditReport({...editReport, teacherUsage: e.target.value})} className="w-full p-2.5 border border-blue-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">更换照片证据</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 p-2.5 border border-blue-200 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors text-sm text-blue-600">
                    <ImageIcon size={18} /> 上传新照片
                    <input type="file" accept="image/*" onChange={handleEditReportImage} className="hidden" />
                  </label>
                </div>
                {editReport.image && (
                  <div className="relative inline-block mt-3">
                    <img src={editReport.image} alt="预览" className="h-32 w-auto object-contain rounded-lg border border-blue-100 bg-white" />
                    <button 
                      type="button" 
                      onClick={() => setEditReport({...editReport, image: ''})} 
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors"
                      title="移除照片"
                    >
                       <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setEditReport(null)} className="flex-1 bg-gray-100 font-bold py-3 rounded-xl">取消</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl">保存修改</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 确认操作统一弹窗 */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[110]"><div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center"><AlertCircle size={48} className="text-amber-500 mx-auto mb-4" /><h3 className="text-xl font-bold mb-2">确认操作</h3><p className="text-sm text-gray-600 mb-6">{confirmModal.message}</p><div className="flex gap-4"><button onClick={() => setConfirmModal(null)} className="flex-1 bg-gray-100 font-bold py-2 rounded-lg">取消</button><button onClick={confirmModal.onConfirm} className="flex-1 bg-amber-500 text-white font-bold py-2 rounded-lg">确认</button></div></div></div>
      )}
    </div>
  );
}

function formatSimpleClassName(year, color) { if (year === '19') return '19 (转校)'; if (year === '20') return '20 (毕业)'; return `${year}${color}`; }
function formatClassName(year, color) { if (year === '19') return '第19班 (转校)'; if (year === '20') return '第20班 (毕业)'; return `${year} 年级 ${color} 班`; }
