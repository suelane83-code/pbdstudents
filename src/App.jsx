import React, { useState, useMemo, useEffect, useContext } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, onSnapshot, addDoc } from "firebase/firestore";
import { 
  Users, BookOpen, PenTool, BarChart2, Settings, LogOut, 
  Globe, Plus, Trash2, FileText, CheckCircle, XCircle, Flower,
  Edit2, Save, X, Calendar, ClipboardList, Loader2, Download, Smile, Copy,
  History, Clock, AlertCircle, Award
} from 'lucide-react';

/* Tailwind Safelist for dynamic themes:
  bg-pink-50 bg-pink-100 bg-pink-500 bg-pink-600 text-pink-400 text-pink-500 text-pink-600 text-pink-700 text-pink-900 border-pink-50 border-pink-100 border-pink-200 border-pink-500 focus:ring-pink-200 shadow-pink-200 shadow-pink-500 from-pink-50 from-pink-500 to-pink-400
  bg-yellow-50 bg-yellow-100 bg-yellow-500 bg-yellow-600 text-yellow-400 text-yellow-500 text-yellow-600 text-yellow-700 text-yellow-900 border-yellow-50 border-yellow-100 border-yellow-200 border-yellow-500 focus:ring-yellow-200 shadow-yellow-200 shadow-yellow-500 from-yellow-50 from-yellow-500 to-yellow-400
  bg-purple-50 bg-purple-100 bg-purple-500 bg-purple-600 text-purple-400 text-purple-500 text-purple-600 text-purple-700 text-purple-900 border-purple-50 border-purple-100 border-purple-200 border-purple-500 focus:ring-purple-200 shadow-purple-200 shadow-purple-500 from-purple-50 from-purple-500 to-purple-400
  bg-blue-50 bg-blue-100 bg-blue-500 bg-blue-600 text-blue-400 text-blue-500 text-blue-600 text-blue-700 text-blue-900 border-blue-50 border-blue-100 border-blue-200 border-blue-500 focus:ring-blue-200 shadow-blue-200 shadow-blue-500 from-blue-50 from-blue-500 to-blue-400
*/

// ==========================================
// 1. Firebase 配置与初始化 (支持 Canvas 环境规范)
// ==========================================
const userFirebaseConfig = {
  apiKey: "AIzaSyDYgQmxMcDQdnhw5IEMMdFpkff7SUN5L9M",
  authDomain: "pbd-sek-f0cbc.firebaseapp.com",
  projectId: "pbd-sek-f0cbc",
  storageBucket: "pbd-sek-f0cbc.firebasestorage.app",
  messagingSenderId: "736112610562",
  appId: "1:736112610562:web:bff35c152edd89eb12061b",
  measurementId: "G-E4TXVG1X3Y"
};

// 优先使用环境注入的配置，否则使用用户提供的测试配置
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : userFirebaseConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestoreDb = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ==========================================
// 2. 基础配置与翻译
// ==========================================
const SEMESTERS = ['第一学期', '第二学期', '第三学期'];

const THEME_CONFIG = {
  pink: { color: 'pink', icon: '🌸', name: '樱花粉' },
  yellow: { color: 'yellow', icon: '🌻', name: '向日葵黄' },
  purple: { color: 'purple', icon: '🪻', name: '薰衣草紫' },
  blue: { color: 'blue', icon: '💠', name: '绣球蓝' }
};

const ThemeContext = React.createContext({ tc: 'pink', icon: '🌸', changeTheme: () => {} });

// 品行与态度特征配置 (+10 与 -5)
const CONDUCT_TRAITS = {
  positive: [
    { id: 'obedient', label: '乖巧听话', score: 10, ms: 'Mendengar kata' },
    { id: 'active', label: '活泼', score: 10, ms: 'Aktif' },
    { id: 'hardworking', label: '勤劳', score: 10, ms: 'Rajin' },
    { id: 'careful', label: '细心', score: 10, ms: 'Teliti' },
    { id: 'loving', label: '有爱心', score: 10, ms: 'Penyayang' }
  ],
  negative: [
    { id: 'naughty', label: '顽皮', score: -5, ms: 'Nakal' },
    { id: 'lazy', label: '懒惰', score: -5, ms: 'Malas' },
    { id: 'absent', label: '常缺席', score: -5, ms: 'Sering tidak hadir' },
    { id: 'rude', label: '没礼貌', score: -5, ms: 'Kurang sopan' }
  ]
};

const translations = {
  zh: {
    systemName: '学生评估与进度跟踪系统 (云端版)',
    login: '老师登录',
    enterRoom: '进入房间',
    createRoom: '注册新房间',
    teacherName: '您的姓名 (第一次注册需填)',
    roomCode: '房号 (班级/特定代号)',
    forgotRoom: '忘记房号？请联系 Admin',
    students: '学生管理',
    subjects: '科目管理',
    conduct: '品行态度',
    homeworkEntry: '功课登记',
    homeworkHistory: '功课历史',
    skills: '技能评估',
    exam: '考试成绩',
    analysis: '分析 & TP',
    adminPanel: '管理后台',
    logout: '退出',
    addStudent: '添加学生',
    batchImport: '从 Excel 批量导入',
    importDesc: '按此顺序复制粘贴：学号, 马来名, 中文名, 性别',
    targetClass: '导入至班级：',
    importBtn: '确认导入',
    className: '班级',
    malayName: '马来文姓名',
    chineseName: '中文姓名',
    gender: '性别',
    studentId: '学号',
    action: '操作',
    edit: '编辑',
    save: '保存',
    cancel: '取消',
    addSubject: '添加科目',
    subjectName: '科目名称',
    selectSubject: '选择科目',
    selectClass: '筛选班级',
    allClasses: '所有班级',
    date: '日期',
    hwStatus: '功课状态',
    hwBlue: '非常优秀',
    hwGreen: '达标',
    hwYellow: '还可以',
    hwRed: '不达标',
    hwBlack: '缺席',
    hwGray: '没有做',
    addExam: '添加考试',
    examType: '考试类型 (如: 年中考)',
    examParts: '考试部分 (逗号分隔, 如: PartA, PartB)',
    deduction: '扣错字分',
    total50: '总分 (/50)',
    total100: '百分比 (/100)',
    grade: '等级',
    compareByStudent: '按学生综合分析',
    roomList: '房间列表 (所有者)',
    loginLogs: '登录日志',
    noData: '暂无数据',
  }
};

const tpColorStyles = {
  1: 'bg-red-100 text-red-700 border border-red-200',
  2: 'bg-red-100 text-red-700 border border-red-200',
  3: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  4: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  5: 'bg-green-100 text-green-700 border border-green-200',
  6: 'bg-green-100 text-green-700 border border-green-200'
};

const exportToXlsWithStyles = (htmlTable, filename) => {
  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <meta charset="UTF-8">
    <style>
      table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
      td, th { border: 1px solid #cbd5e1; padding: 8px; text-align: center; vertical-align: middle; }
      th { background-color: #f8fafc; font-weight: bold; }
    </style>
    </head>
    <body>
      ${htmlTable}
    </body>
    </html>
  `;
  const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename + '.xls');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const calculateGradeAndTP = (percentage) => {
  if (percentage >= 80) return { grade: 'A', tp: 6 };
  if (percentage >= 65) return { grade: 'B', tp: 5 };
  if (percentage >= 50) return { grade: 'C', tp: 4 };
  if (percentage >= 40) return { grade: 'D', tp: 3 };
  if (percentage >= 20) return { grade: 'E', tp: 2 };
  return { grade: 'F', tp: 1 };
};

// ==========================================
// 动态漂浮背景组件
// ==========================================
function FloatingBackground() {
  const { icon } = useContext(ThemeContext);
  const [elements, setElements] = useState([]);

  useEffect(() => {
    const arr = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 20,
      duration: 12 + Math.random() * 20,
      size: 1 + Math.random() * 2,
    }));
    setElements(arr);
  }, [icon]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[0]">
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(110vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {elements.map(el => (
        <div key={el.id} className="absolute" style={{
          left: `${el.left}%`,
          bottom: '-10%',
          animation: `floatUp ${el.duration}s linear ${el.delay}s infinite`,
          fontSize: `${el.size}rem`,
          opacity: 0,
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
        }}>
          {icon}
        </div>
      ))}
    </div>
  );
}


export default function App() {
  const [lang, setLang] = useState('zh');
  const t = translations[lang] || translations['zh'];

  // Auth state
  const [user, setUser] = useState(null);
  
  const [authState, setAuthState] = useState('login');
  const [currentRoom, setCurrentRoom] = useState('');
  const [loadingDb, setLoadingDb] = useState(true);
  const [localTheme, setLocalTheme] = useState('pink');
  
  const [db, setDb] = useState({ rooms: {}, logs: [], roomData: {} });

  // 1. Initialize Auth FIRST (Mandatory Canvas Firebase Rule)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data ONLY after Auth is successful
  useEffect(() => {
    if (!user) return; // Guard clause

    // Canvas environment mandatory paths for public collaborative data
    const roomsColRef = collection(firestoreDb, 'artifacts', appId, 'public', 'data', 'rooms');
    const logsColRef = collection(firestoreDb, 'artifacts', appId, 'public', 'data', 'logs');

    const unsubRooms = onSnapshot(roomsColRef, (snapshot) => {
      const newRooms = {};
      const newRoomData = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        newRooms[docSnap.id] = { owner: data.owner, theme: data.theme || 'pink' };
        newRoomData[docSnap.id] = data.roomData || {};
      });
      setDb(prev => ({ ...prev, rooms: newRooms, roomData: newRoomData }));
      setLoadingDb(false);
    }, (error) => {
      console.error("Firebase read error (rooms):", error);
      setLoadingDb(false);
    });

    const unsubLogs = onSnapshot(logsColRef, (snapshot) => {
      const newLogs = [];
      snapshot.forEach(docSnap => newLogs.push({ id: docSnap.id, ...docSnap.data() }));
      newLogs.sort((a, b) => new Date(b.time) - new Date(a.time));
      setDb(prev => ({ ...prev, logs: newLogs }));
    }, (error) => {
      console.error("Firebase read error (logs):", error);
    });

    return () => { unsubRooms(); unsubLogs(); };
  }, [user]); // Re-run when auth state changes

  const rawCurrentData = db.roomData[currentRoom] || {};
  
  // 兼容旧版本的纯文本数据格式
  const normalizedSubjects = (rawCurrentData.subjects || []).map(s => {
    if (typeof s === 'string') return { id: s, name: s };
    return s;
  });

  const currentData = { 
    students: rawCurrentData.students || [], 
    subjects: normalizedSubjects, 
    conducts: rawCurrentData.conducts || {}, 
    homeworks: rawCurrentData.homeworks || {}, 
    homeworkTitles: rawCurrentData.homeworkTitles || {},
    skillsConfig: rawCurrentData.skillsConfig || {},     
    skillRecords: rawCurrentData.skillRecords || {},     
    examsConfig: rawCurrentData.examsConfig || {}, 
    examRecords: rawCurrentData.examRecords || {}, 
    finalTPs: rawCurrentData.finalTPs || {}
  };

  const activeThemeKey = (currentRoom && db.rooms[currentRoom]?.theme) ? db.rooms[currentRoom].theme : localTheme;
  const currentThemeConfig = THEME_CONFIG[activeThemeKey] || THEME_CONFIG['pink'];
  const tc = currentThemeConfig.color;

  const changeTheme = async (newThemeKey) => {
    if (currentRoom && user) {
      const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'rooms', currentRoom);
      await setDoc(roomRef, { theme: newThemeKey }, { merge: true });
    }
    setLocalTheme(newThemeKey);
  };

  const handleLogin = async (code, teacherName) => {
    if (!code || !user) return; // Guard
    const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'rooms', code);
    
    if (!db.rooms[code]) {
      if (!teacherName) return; 
      const initialData = { students: [], subjects: [], conducts: {}, homeworks: {}, homeworkTitles: {}, skillsConfig: {}, skillRecords: {}, examsConfig: {}, examRecords: {}, finalTPs: {} };
      setDb(prev => ({
        ...prev,
        rooms: { ...prev.rooms, [code]: { owner: teacherName, theme: localTheme } },
        roomData: { ...prev.roomData, [code]: initialData }
      }));
      await setDoc(roomRef, {
        owner: teacherName,
        theme: localTheme,
        roomData: initialData
      });
    }

    await addDoc(collection(firestoreDb, 'artifacts', appId, 'public', 'data', 'logs'), {
      time: new Date().toISOString(),
      room: code,
      owner: db.rooms[code]?.owner || teacherName
    });
    
    setCurrentRoom(code);
    setAuthState('teacher');
  };

  const handleAdminLogin = () => setAuthState('admin');

  const updateRoomData = async (newData) => {
    if (!user) return;
    const updatedData = { ...currentData, ...newData };
    setDb(prev => ({
      ...prev,
      roomData: { ...prev.roomData, [currentRoom]: updatedData }
    }));
    const roomRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'rooms', currentRoom);
    await setDoc(roomRef, { roomData: updatedData }, { merge: true });
  };

  if (loadingDb || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
        <Loader2 className="w-10 h-10 text-slate-400 animate-spin mb-4 relative z-10" />
        <h2 className="text-xl font-bold text-slate-700 relative z-10">萌花系统加载中...</h2>
        <p className="text-sm text-slate-500 mt-2 z-10">{!user ? "正在安全连接..." : "读取数据..."}</p>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ tc, icon: currentThemeConfig.icon, changeTheme }}>
      <div className={`min-h-screen bg-gradient-to-br from-${tc}-50 to-white text-slate-800 font-sans relative overflow-x-hidden transition-colors duration-500`}>
        <FloatingBackground />
        
        <header className={`bg-white/70 backdrop-blur-md shadow-sm px-6 py-4 flex flex-col md:flex-row justify-between items-center relative z-20 border-b border-${tc}-100 gap-4`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentThemeConfig.icon}</span>
            <h1 className={`text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-${tc}-500 to-${tc}-400 tracking-wide`}>{t.systemName}</h1>
            {currentRoom && authState === 'teacher' && (
              <span className={`ml-4 px-4 py-1.5 bg-${tc}-50 text-${tc}-700 border border-${tc}-200 rounded-full text-sm font-bold flex items-center gap-2 shadow-inner`}>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                房号: {currentRoom} ({db.rooms[currentRoom]?.owner || '加载中...'})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* 主题选择器 */}
            <div className="flex gap-2 bg-white/50 p-1.5 rounded-full border border-white shadow-sm">
              {Object.values(THEME_CONFIG).map(themeOpt => (
                <button 
                  key={themeOpt.color} 
                  onClick={() => changeTheme(themeOpt.color)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-transform ${tc === themeOpt.color ? 'scale-125 shadow-md bg-white' : 'hover:scale-110 opacity-70 grayscale'}`}
                  title={themeOpt.name}
                >
                  {themeOpt.icon}
                </button>
              ))}
            </div>

            {authState !== 'login' && (
              <button onClick={() => {setAuthState('login'); setCurrentRoom('');}} className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition px-4 py-2 rounded-xl hover:bg-red-50 font-bold bg-white/80">
                <LogOut className="w-4 h-4" />
                <span>{t.logout}</span>
              </button>
            )}
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-[1500px] mx-auto relative z-10">
          {authState === 'login' && <LoginView t={t} db={db} onLogin={handleLogin} onAdminLogin={handleAdminLogin} />}
          {authState === 'admin' && <AdminView t={t} db={db} />}
          {authState === 'teacher' && <TeacherDashboard t={t} data={currentData} updateData={updateRoomData} />}
        </main>
      </div>
    </ThemeContext.Provider>
  );
}

function LoginView({ t, db, onLogin, onAdminLogin }) {
  const { tc } = useContext(ThemeContext);
  const [code, setCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  const [adminErrorMsg, setAdminErrorMsg] = useState('');
  
  const isNewRoom = code.length > 0 && !db.rooms[code];

  const handleLoginSubmit = () => {
    if (isNewRoom && !teacherName.trim()) {
      setErrorMsg("第一次注册请填写您的姓名！");
      return;
    }
    setErrorMsg('');
    onLogin(code, teacherName);
  };

  const handleAdminSubmit = () => {
    if (adminPwd === 'XCC6027@km') {
      onAdminLogin();
    } else {
      setAdminErrorMsg('Admin 密码错误！');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className={`bg-white/80 backdrop-blur p-8 rounded-3xl shadow-xl shadow-${tc}-200/50 w-full md:w-96 border-2 border-${tc}-100 transition-colors duration-500`}>
        <div className="flex items-center justify-center gap-3 mb-8">
          <Users className={`w-8 h-8 text-${tc}-500`} />
          <h2 className="text-2xl font-extrabold text-slate-800">{t.login}</h2>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">{t.roomCode}</label>
            <input type="text" value={code} onChange={(e) => {setCode(e.target.value); setErrorMsg('');}} className={`w-full px-4 py-3 bg-white/50 border-2 border-${tc}-100 rounded-2xl focus:ring-4 focus:ring-${tc}-200 focus:bg-white outline-none transition-all font-bold text-slate-700`} placeholder="输入房号进入或创建" />
          </div>
          
          {isNewRoom && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-emerald-600 mb-1.5">检测到新房号，{t.teacherName}</label>
              <input type="text" value={teacherName} onChange={(e) => {setTeacherName(e.target.value); setErrorMsg('');}} className={`w-full px-4 py-3 bg-emerald-50/50 border-2 rounded-2xl focus:ring-4 focus:ring-emerald-200 focus:bg-white outline-none transition-all font-bold text-slate-700 ${errorMsg ? 'border-red-400' : 'border-emerald-200'}`} placeholder="例如: 林老师 (Mr. Lim)" />
              {errorMsg && <p className="text-xs text-red-500 font-bold mt-2">{errorMsg}</p>}
            </div>
          )}

          <button onClick={handleLoginSubmit} className={`w-full bg-gradient-to-r from-${tc}-500 to-${tc}-400 text-white py-3.5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all font-extrabold text-lg shadow-lg shadow-${tc}-200 mt-4`}>
            {isNewRoom ? t.createRoom : t.enterRoom}
          </button>
        </div>
      </div>
      
      {!showAdminInput ? (
        <button onClick={() => setShowAdminInput(true)} className="mt-16 text-[10px] text-slate-300 hover:text-slate-500 transition-colors tracking-widest uppercase font-bold">
          admin
        </button>
      ) : (
        <div className="mt-12 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 bg-white/60 p-4 rounded-3xl border border-white">
          <input type="password" value={adminPwd} onChange={(e) => {setAdminPwd(e.target.value); setAdminErrorMsg('');}} placeholder="输入 Admin 密码" className={`px-4 py-2 bg-white border-2 rounded-xl text-center text-sm font-bold focus:ring-2 focus:ring-slate-400 outline-none transition-all shadow-sm ${adminErrorMsg ? 'border-red-400' : 'border-slate-200'}`} />
          <div className="flex gap-2">
            <button onClick={handleAdminSubmit} className="px-4 py-1.5 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700 shadow-md">登录后台</button>
            <button onClick={() => {setShowAdminInput(false); setAdminPwd(''); setAdminErrorMsg('');}} className="px-4 py-1.5 bg-white text-slate-600 text-sm font-bold border border-slate-200 rounded-lg hover:bg-slate-50">取消</button>
          </div>
          {adminErrorMsg && <p className="text-xs text-red-500 font-bold">{adminErrorMsg}</p>}
        </div>
      )}
    </div>
  );
}

function AdminView({ t, db }) {
  const { tc } = useContext(ThemeContext);
  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return isNaN(d.getTime()) ? isoString : d.toLocaleString();
    } catch { return isoString; }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-extrabold flex items-center gap-2 text-slate-800"><Settings className="w-6 h-6" /> {t.adminPanel}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur p-6 rounded-3xl shadow-sm border-2 border-white">
          <h3 className="font-extrabold text-lg mb-4 text-slate-700">{t.roomList}</h3>
          <ul className="space-y-3">
            {Object.entries(db.rooms).map(([code, info]) => (
              <li key={code} className="px-5 py-4 bg-white rounded-2xl border border-slate-100 flex flex-col shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-mono text-${tc}-600 font-black text-xl`}>{code}</span>
                  <span className="px-3 py-1 bg-slate-50 rounded-lg text-xs font-bold text-slate-500 border">
                    {db.roomData[code]?.students?.length || 0} 学生
                  </span>
                </div>
                <span className="text-sm text-slate-600 font-bold">老师: {info.owner} <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full ml-2">Theme: {info.theme || 'pink'}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white/80 backdrop-blur p-6 rounded-3xl shadow-sm border-2 border-white">
          <h3 className="font-extrabold text-lg mb-4 text-slate-700">{t.loginLogs}</h3>
          <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
            {db.logs.map((log) => (
              <li key={log.id} className="text-sm flex flex-col bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between mb-1">
                  <span className={`font-mono text-${tc}-600 font-bold`}>{log.room}</span>
                  <span className="text-xs text-slate-400 font-bold">{formatDate(log.time)}</span>
                </div>
                <span className="text-slate-600 font-bold">登入者: {log.owner}</span>
              </li>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 底部带总人数的统计表
function StatTable({ title, columns, stats }) {
  const { tc } = useContext(ThemeContext);
  const maleTotal = columns.reduce((acc, col) => acc + (stats.male[col.key] || 0), 0);
  const femaleTotal = columns.reduce((acc, col) => acc + (stats.female[col.key] || 0), 0);
  const grandTotal = maleTotal + femaleTotal;

  return (
    <div className={`mt-6 bg-white p-5 rounded-3xl border border-${tc}-100 shadow-sm shrink-0 transition-colors duration-500`}>
      <h3 className="text-md font-extrabold text-slate-800 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-sm">
          <thead>
            <tr className={`bg-${tc}-50 border-b border-${tc}-100`}>
              <th className={`py-3 px-4 font-bold text-slate-600 border-r border-${tc}-100 text-left rounded-tl-xl`}>性别</th>
              {columns.map(col => <th key={col.key} className="py-3 px-3 font-bold text-slate-600">{col.label}</th>)}
              <th className={`py-3 px-4 font-extrabold text-${tc}-700 border-l border-${tc}-100 bg-${tc}-100 rounded-tr-xl`}>合计人数</th>
            </tr>
          </thead>
          <tbody>
            <tr className={`border-b border-${tc}-50 hover:bg-slate-50`}>
              <td className={`py-3 px-4 font-bold text-blue-600 border-r border-${tc}-50 text-left`}>男生 (L)</td>
              {columns.map(col => <td key={col.key} className="py-3 px-3 text-slate-700 font-bold">{stats.male[col.key]}</td>)}
              <td className={`py-3 px-4 font-bold text-blue-700 border-l border-${tc}-50 bg-${tc}-50/50`}>{maleTotal}</td>
            </tr>
            <tr className={`border-b border-${tc}-50 hover:bg-slate-50`}>
              <td className={`py-3 px-4 font-bold text-pink-600 border-r border-${tc}-50 text-left`}>女生 (P)</td>
              {columns.map(col => <td key={col.key} className="py-3 px-3 text-slate-700 font-bold">{stats.female[col.key]}</td>)}
              <td className={`py-3 px-4 font-bold text-pink-700 border-l border-${tc}-50 bg-${tc}-50/50`}>{femaleTotal}</td>
            </tr>
            <tr className={`bg-${tc}-50/50`}>
              <td className={`py-3 px-4 font-extrabold text-slate-800 border-r border-${tc}-100 text-left rounded-bl-xl`}>横向总计</td>
              {columns.map(col => <td key={col.key} className="py-3 px-3 font-extrabold text-slate-800">{stats.total[col.key]}</td>)}
              <td className={`py-3 px-4 font-black text-${tc}-700 border-l border-${tc}-100 bg-${tc}-100 text-lg rounded-br-xl`}>{grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeacherDashboard({ t, data, updateData }) {
  const { tc } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('students');
  const [currentSemester, setCurrentSemester] = useState(SEMESTERS[0]); // 新增：全局学期状态

  const tabs = [
    { id: 'students', icon: Users, label: t.students },
    { id: 'subjects', icon: BookOpen, label: t.subjects },
    { id: 'conduct', icon: Smile, label: t.conduct },
    { id: 'homeworkEntry', icon: PenTool, label: t.homeworkEntry },
    { id: 'homeworkHistory', icon: History, label: t.homeworkHistory },
    { id: 'skills', icon: Award, label: t.skills },
    { id: 'exams', icon: ClipboardList, label: t.exam },
    { id: 'analysis', icon: BarChart2, label: t.analysis },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-56 shrink-0 flex flex-row lg:flex-col gap-3 overflow-x-auto pb-2 lg:pb-0">
        
        {/* 新增: 学期选择器 */}
        <div className="mb-2 p-2 bg-white/60 backdrop-blur rounded-[1.5rem] border-2 border-white shadow-sm shrink-0">
          <label className="block text-[10px] font-black text-slate-400 mb-1.5 ml-2 mt-1 uppercase tracking-widest flex items-center gap-1">
             <Calendar className="w-3 h-3"/> 设定当前学期
          </label>
          <select 
            value={currentSemester} 
            onChange={e => setCurrentSemester(e.target.value)}
            className={`w-full p-3 bg-${tc}-100 text-${tc}-800 font-black rounded-xl outline-none text-center cursor-pointer shadow-inner appearance-none transition-colors hover:bg-${tc}-200`}
          >
            {SEMESTERS.map(sem => <option key={sem} value={sem}>{sem}</option>)}
          </select>
        </div>

        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-5 py-4 rounded-[1.5rem] transition-all font-extrabold whitespace-nowrap ${
                isActive 
                  ? `bg-${tc}-500 text-white shadow-lg shadow-${tc}-200 translate-x-0 lg:translate-x-3 scale-105` 
                  : `bg-white/80 backdrop-blur text-slate-600 hover:bg-${tc}-50 hover:text-${tc}-600 border-2 border-white`
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur rounded-[2.5rem] shadow-xl border-2 border-white min-h-[750px] overflow-hidden flex flex-col p-2 md:p-4">
        {/* 学生与科目不受学期影响 (全局通用) */}
        {activeTab === 'students' && <StudentsTab t={t} data={data} updateData={updateData} />}
        {activeTab === 'subjects' && <SubjectsTab t={t} data={data} updateData={updateData} />}
        
        {/* 以下评估类 Tab 均传入 currentSemester 以隔离数据 */}
        {activeTab === 'conduct' && <ConductTab t={t} data={data} updateData={updateData} currentSemester={currentSemester} />}
        {activeTab === 'homeworkEntry' && <HomeworkEntryTab t={t} data={data} updateData={updateData} currentSemester={currentSemester} />}
        {activeTab === 'homeworkHistory' && <HomeworkHistoryTab t={t} data={data} currentSemester={currentSemester} />}
        {activeTab === 'skills' && <SkillsTab t={t} data={data} updateData={updateData} currentSemester={currentSemester} />}
        {activeTab === 'exams' && <ExamsTab t={t} data={data} updateData={updateData} currentSemester={currentSemester} />}
        {activeTab === 'analysis' && <AnalysisTab t={t} data={data} updateData={updateData} currentSemester={currentSemester} />}
      </div>
    </div>
  );
}

function StudentsTab({ t, data, updateData }) {
  const { tc } = useContext(ThemeContext);
  const [importText, setImportText] = useState('');
  const [importClass, setImportClass] = useState('1A');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  // 新增学生单独表单状态
  const [newStudent, setNewStudent] = useState({ className: '', stdId: '', malayName: '', chineseName: '', gender: '' });

  const handleImport = () => {
    if (!importText.trim()) return;
    const lines = importText.split('\n');
    const newStudents = [];
    lines.forEach(line => {
      const parts = line.split(/[\t,]/).map(s => s.trim()).filter(s => s);
      if (parts.length >= 2) { 
        newStudents.push({
          id: Date.now() + Math.random().toString(),
          stdId: parts[0] || '-',
          malayName: parts[1] || '-',
          chineseName: parts[2] || '-',
          gender: parts[3] || '-',
          className: importClass || '未分配'
        });
      }
    });
    if (newStudents.length > 0) {
      updateData({ students: [...data.students, ...newStudents] });
      setImportText('');
    }
  };

  const addSingleStudent = () => {
    if (!newStudent.malayName.trim() && !newStudent.chineseName.trim()) return;
    const student = { ...newStudent, id: Date.now() + Math.random().toString() };
    updateData({ students: [...data.students, student] });
    setNewStudent({ className: newStudent.className, stdId: '', malayName: '', chineseName: '', gender: '' });
  };

  const removeStudent = (id) => {
    if (confirmDeleteId === id) {
      updateData({ students: data.students.filter(s => s.id !== id) });
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const startEdit = (stu) => {
    setEditingId(stu.id);
    setEditForm({...stu});
  };

  const saveEdit = () => {
    updateData({ students: data.students.map(s => s.id === editingId ? editForm : s) });
    setEditingId(null);
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><Users className={`text-${tc}-500`}/> {t.students}</h2>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="xl:col-span-2 flex flex-col gap-4">
          
          <div className="bg-white/60 p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-2 items-center">
             <input placeholder={t.className} className="w-20 p-2 border rounded-xl outline-none text-sm" value={newStudent.className} onChange={e=>setNewStudent({...newStudent, className: e.target.value})} />
             <input placeholder={t.studentId} className="w-24 p-2 border rounded-xl outline-none text-sm" value={newStudent.stdId} onChange={e=>setNewStudent({...newStudent, stdId: e.target.value})} />
             <input placeholder={t.malayName} className="flex-1 min-w-[120px] p-2 border rounded-xl outline-none text-sm" value={newStudent.malayName} onChange={e=>setNewStudent({...newStudent, malayName: e.target.value})} />
             <input placeholder={t.chineseName} className="flex-1 min-w-[100px] p-2 border rounded-xl outline-none text-sm" value={newStudent.chineseName} onChange={e=>setNewStudent({...newStudent, chineseName: e.target.value})} />
             <select className="w-20 p-2 border rounded-xl outline-none text-sm" value={newStudent.gender} onChange={e=>setNewStudent({...newStudent, gender: e.target.value})}>
               <option value="">性别</option>
               <option value="L">男 (L)</option>
               <option value="P">女 (P)</option>
             </select>
             <button onClick={addSingleStudent} className={`bg-${tc}-500 text-white p-2 rounded-xl hover:bg-${tc}-600 font-bold flex items-center gap-1`}><Plus className="w-4 h-4"/> 添加</button>
          </div>

          <div className="overflow-y-auto border-2 border-white rounded-[2rem] bg-white/60 relative shadow-inner flex-1 min-h-0">
            <table className="w-full text-left border-collapse text-sm md:text-base">
              <thead className={`sticky top-0 bg-${tc}-50/90 backdrop-blur-md z-10 shadow-sm transition-colors duration-500`}>
                <tr>
                  <th className="py-4 px-3 md:px-5 font-extrabold text-slate-700 border-b border-white">{t.className}</th>
                  <th className="py-4 px-3 md:px-5 font-extrabold text-slate-700 border-b border-white">{t.studentId}</th>
                  <th className="py-4 px-3 md:px-5 font-extrabold text-slate-700 border-b border-white">{t.malayName}</th>
                  <th className="py-4 px-3 md:px-5 font-extrabold text-slate-700 border-b border-white">{t.chineseName}</th>
                  <th className="py-4 px-3 md:px-5 font-extrabold text-slate-700 border-b border-white">{t.gender}</th>
                  <th className="py-4 px-3 md:px-5 font-extrabold text-slate-700 border-b border-white text-right">{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {data.students.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-bold">{t.noData}</td></tr>
                )}
                {data.students.map(s => (
                  <tr key={s.id} className={`border-b border-white hover:bg-${tc}-50/50 transition-colors group`}>
                    {editingId === s.id ? (
                      <td colSpan="6" className={`p-3 bg-${tc}-50/50`}>
                        <div className="flex flex-wrap gap-2 items-center">
                          <input className="w-16 p-2 border-2 rounded-xl outline-none font-bold" value={editForm.className} onChange={e=>setEditForm({...editForm, className: e.target.value})} />
                          <input className="w-20 p-2 border-2 rounded-xl outline-none font-bold" value={editForm.stdId} onChange={e=>setEditForm({...editForm, stdId: e.target.value})} />
                          <input className="flex-1 p-2 border-2 rounded-xl outline-none font-bold" value={editForm.malayName} onChange={e=>setEditForm({...editForm, malayName: e.target.value})} />
                          <input className="flex-1 p-2 border-2 rounded-xl outline-none font-bold" value={editForm.chineseName} onChange={e=>setEditForm({...editForm, chineseName: e.target.value})} />
                          <input className="w-16 p-2 border-2 rounded-xl outline-none font-bold" value={editForm.gender} onChange={e=>setEditForm({...editForm, gender: e.target.value})} />
                          <button onClick={saveEdit} className="p-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200"><CheckCircle className="w-5 h-5"/></button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"><XCircle className="w-5 h-5"/></button>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="py-3 px-3 md:px-5 font-bold text-slate-600">{s.className}</td>
                        <td className="py-3 px-3 md:px-5 font-mono text-slate-500">{s.stdId}</td>
                        <td className="py-3 px-3 md:px-5 font-bold">{s.malayName}</td>
                        <td className="py-3 px-3 md:px-5 font-bold text-slate-700">{s.chineseName}</td>
                        <td className="py-3 px-3 md:px-5 font-bold">
                           <span className={`px-2 py-1 rounded-lg text-xs ${s.gender === 'L' ? 'bg-blue-100 text-blue-700' : (s.gender === 'P' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-700')}`}>
                             {s.gender}
                           </span>
                        </td>
                        <td className="py-3 px-3 md:px-5 text-right">
                           <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                             <button onClick={() => startEdit(s)} className={`p-2 text-${tc}-600 bg-${tc}-50 hover:bg-${tc}-100 rounded-xl`}><Edit2 className="w-4 h-4"/></button>
                             <button onClick={() => removeStudent(s.id)} className={`p-2 rounded-xl ${confirmDeleteId === s.id ? 'bg-red-500 text-white animate-pulse' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}>
                               {confirmDeleteId === s.id ? <AlertCircle className="w-4 h-4" /> : <Trash2 className="w-4 h-4"/>}
                             </button>
                           </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white/60 p-6 rounded-[2rem] border-2 border-white shadow-sm flex flex-col gap-4">
          <h3 className="font-extrabold flex items-center gap-2 text-slate-700"><FileText className="w-5 h-5"/> {t.batchImport}</h3>
          <p className="text-xs font-bold text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">{t.importDesc}</p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-600">{t.targetClass}</span>
            <input type="text" value={importClass} onChange={e => setImportClass(e.target.value)} className="flex-1 p-2 border-2 rounded-xl outline-none font-bold" />
          </div>
          <textarea 
            value={importText} 
            onChange={e => setImportText(e.target.value)} 
            placeholder="0123	Ahmad	阿里	L&#10;0124	Siti	西蒂	P"
            className={`w-full flex-1 p-4 border-2 border-slate-100 rounded-xl resize-none focus:ring-4 focus:ring-${tc}-100 focus:border-${tc}-300 outline-none font-mono text-sm shadow-inner min-h-[150px]`}
          />
          <button onClick={handleImport} className={`w-full py-3 bg-gradient-to-r from-${tc}-500 to-${tc}-400 text-white rounded-xl font-extrabold shadow-md hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2`}>
             <Download className="w-5 h-5"/> {t.importBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubjectsTab({ t, data, updateData }) {
  const { tc } = useContext(ThemeContext);
  const [newSubject, posNewSubject] = useState('');

  const addSubject = () => {
    if (!newSubject.trim()) return;
    const subject = { id: Date.now().toString(), name: newSubject.trim() };
    updateData({ subjects: [...data.subjects, subject] });
    posNewSubject('');
  };

  const deleteSubject = (id) => {
    updateData({ subjects: data.subjects.filter(s => s.id !== id) });
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
       <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><BookOpen className={`text-${tc}-500`}/> {t.subjects}</h2>
       
       <div className="max-w-2xl bg-white/60 p-6 rounded-[2rem] border-2 border-white shadow-sm flex flex-col gap-6">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newSubject} 
              onChange={e => posNewSubject(e.target.value)} 
              placeholder={t.subjectName} 
              className={`flex-1 px-4 py-3 border-2 border-slate-100 rounded-2xl outline-none focus:border-${tc}-400 focus:ring-4 focus:ring-${tc}-100 font-bold`}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
            />
            <button onClick={addSubject} className={`px-6 py-3 bg-${tc}-500 text-white rounded-2xl font-extrabold shadow-md hover:bg-${tc}-600 transition-colors flex items-center gap-2`}>
              <Plus className="w-5 h-5"/> {t.addSubject}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
             {data.subjects.length === 0 && <p className="text-slate-400 font-bold col-span-full">{t.noData}</p>}
             {data.subjects.map((sub, index) => (
               <div key={sub.id || `subject-${index}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-slate-300 transition-colors">
                  <span className="font-extrabold text-slate-700">{sub.name}</span>
                  <button onClick={() => deleteSubject(sub.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
               </div>
             ))}
          </div>
       </div>
    </div>
  );
}

function ConductTab({ t, data, updateData, currentSemester }) {
  const { tc } = useContext(ThemeContext);
  const classes = useMemo(() => [...new Set(data.students.map(s => s.className))], [data.students]);
  const [selectedClass, setSelectedClass] = useState(classes[0] || '');

  useEffect(() => {
    if (!selectedClass && classes.length > 0) setSelectedClass(classes[0]);
  }, [classes, selectedClass]);

  const filteredStudents = data.students.filter(s => s.className === selectedClass);

  // 向后兼容：如果选择第一学期，使用纯 studentId 作为键；否则加上学期前缀。
  const getConductKey = (studentId) => currentSemester === '第一学期' ? studentId : `${currentSemester}_${studentId}`;

  const toggleTrait = (studentId, traitId, type) => {
    const conductKey = getConductKey(studentId);
    const studentConduct = data.conducts[conductKey] || { positive: [], negative: [] };
    const currentTraits = studentConduct[type] || [];
    
    let newTraits;
    if (currentTraits.includes(traitId)) {
      newTraits = currentTraits.filter(id => id !== traitId);
    } else {
      newTraits = [...currentTraits, traitId];
    }

    const newConduct = { ...studentConduct, [type]: newTraits };
    
    // 计算总分
    let score = 0;
    newConduct.positive.forEach(id => {
      const trait = CONDUCT_TRAITS.positive.find(t => t.id === id);
      if (trait) score += trait.score;
    });
    newConduct.negative.forEach(id => {
      const trait = CONDUCT_TRAITS.negative.find(t => t.id === id);
      if (trait) score += trait.score;
    });
    newConduct.score = score;

    updateData({ conducts: { ...data.conducts, [conductKey]: newConduct } });
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Smile className={`text-${tc}-500`}/> {t.conduct} ({currentSemester})</h2>
         <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-4 py-2 border-2 border-white rounded-xl outline-none font-bold bg-white/80 shadow-sm">
            {classes.map((c, idx) => <option key={c || `class-${idx}`} value={c}>{c}</option>)}
         </select>
       </div>

       <div className="overflow-y-auto border-2 border-white rounded-[2rem] bg-white/60 relative shadow-inner flex-1 min-h-0">
          <table className="w-full text-left border-collapse text-sm">
            <thead className={`sticky top-0 bg-${tc}-50/90 backdrop-blur-md z-10 shadow-sm transition-colors duration-500`}>
              <tr>
                <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white min-w-[150px]">姓名</th>
                <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white">优良表现 (+10分)</th>
                <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white">需改善表现 (-5分)</th>
                <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white text-center">总分</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 && (
                <tr><td colSpan="4" className="text-center py-12 text-slate-400 font-bold">请先选择班级或添加学生</td></tr>
              )}
              {filteredStudents.map(student => {
                const conductKey = getConductKey(student.id);
                const conduct = data.conducts[conductKey] || { positive: [], negative: [], score: 0 };
                return (
                  <tr key={student.id} className={`border-b border-white hover:bg-${tc}-50/30 transition-colors`}>
                    <td className="py-4 px-5 font-bold text-slate-700">
                      {student.chineseName} <br/><span className="text-xs text-slate-400">{student.malayName}</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex flex-wrap gap-2">
                        {CONDUCT_TRAITS.positive.map(trait => {
                           const active = conduct.positive?.includes(trait.id);
                           return (
                             <button key={trait.id} onClick={() => toggleTrait(student.id, trait.id, 'positive')}
                               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${active ? 'bg-green-500 text-white border-green-500 shadow-md scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-green-300'}`}
                             >
                               {trait.label}
                             </button>
                           )
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex flex-wrap gap-2">
                        {CONDUCT_TRAITS.negative.map(trait => {
                           const active = conduct.negative?.includes(trait.id);
                           return (
                             <button key={trait.id} onClick={() => toggleTrait(student.id, trait.id, 'negative')}
                               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${active ? 'bg-red-500 text-white border-red-500 shadow-md scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-red-300'}`}
                             >
                               {trait.label}
                             </button>
                           )
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                       <span className={`inline-block w-12 py-1.5 rounded-xl font-black text-sm ${conduct.score > 0 ? 'bg-green-100 text-green-700' : (conduct.score < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700')}`}>
                         {conduct.score > 0 ? `+${conduct.score}` : conduct.score}
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
       </div>
    </div>
  );
}

function HomeworkEntryTab({ t, data, updateData, currentSemester }) {
  const { tc } = useContext(ThemeContext);
  const classes = useMemo(() => [...new Set(data.students.map(s => s.className))], [data.students]);
  const [selectedClass, setSelectedClass] = useState(classes[0] || '');
  const [selectedSubject, setSelectedSubject] = useState(data.subjects[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [hwTitle, setHwTitle] = useState('');

  useEffect(() => {
    if (!selectedClass && classes.length > 0) setSelectedClass(classes[0]);
  }, [classes, selectedClass]);

  useEffect(() => {
    if (!selectedSubject && data.subjects.length > 0) setSelectedSubject(data.subjects[0].id);
  }, [data.subjects, selectedSubject]);

  // 向后兼容设计：第一学期依然使用旧Key结构
  const hwRecordKey = currentSemester === '第一学期' 
    ? `${selectedClass}_${selectedSubject}_${selectedDate}` 
    : `${currentSemester}_${selectedClass}_${selectedSubject}_${selectedDate}`;
    
  const currentRecord = data.homeworks[hwRecordKey] || {};
  const filteredStudents = data.students.filter(s => s.className === selectedClass);

  const statuses = [
    { id: 'blue', label: t.hwBlue, color: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { id: 'green', label: t.hwGreen, color: 'bg-green-500 hover:bg-green-600 text-white' },
    { id: 'yellow', label: t.hwYellow, color: 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' },
    { id: 'red', label: t.hwRed, color: 'bg-red-500 hover:bg-red-600 text-white' },
    { id: 'black', label: t.hwBlack, color: 'bg-slate-800 hover:bg-slate-900 text-white' },
    { id: 'gray', label: t.hwGray, color: 'bg-slate-300 hover:bg-slate-400 text-slate-700' }
  ];

  const markHomework = (studentId, statusId) => {
    const newRecord = { ...currentRecord };
    if (newRecord[studentId] === statusId) {
      delete newRecord[studentId]; // toggle off
    } else {
      newRecord[studentId] = statusId;
    }
    updateData({ 
      homeworks: { ...data.homeworks, [hwRecordKey]: newRecord },
      homeworkTitles: { ...data.homeworkTitles, [hwRecordKey]: hwTitle || '日常功课' }
    });
  };

  const markAll = (statusId) => {
    const newRecord = {};
    filteredStudents.forEach(s => newRecord[s.id] = statusId);
    updateData({ 
      homeworks: { ...data.homeworks, [hwRecordKey]: newRecord },
      homeworkTitles: { ...data.homeworkTitles, [hwRecordKey]: hwTitle || '日常功课' }
    });
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
       <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><PenTool className={`text-${tc}-500`}/> {t.homeworkEntry} ({currentSemester})</h2>
       
       <div className="bg-white/60 p-4 rounded-2xl shadow-sm border border-white mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.date}</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="p-2 border rounded-xl outline-none font-bold text-sm bg-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.className}</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="p-2 border rounded-xl outline-none font-bold text-sm bg-white min-w-[100px]">
              {classes.map((c, idx) => <option key={c || `class-${idx}`} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.selectSubject}</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="p-2 border rounded-xl outline-none font-bold text-sm bg-white min-w-[120px]">
              {data.subjects.length === 0 && <option key="empty" value="">(请先添加科目)</option>}
              {data.subjects.map((s, idx) => <option key={s.id || `sub-${idx}`} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
             <label className="block text-xs font-bold text-slate-500 mb-1">功课名称/标题</label>
             <input type="text" value={hwTitle} onChange={e => setHwTitle(e.target.value)} placeholder="例如: 练习本A / 造句" className="w-full p-2 border rounded-xl outline-none font-bold text-sm bg-white" />
          </div>
       </div>

       <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
          <span className="text-sm font-bold text-slate-600 flex items-center mr-2">批量标记:</span>
          {statuses.map(stat => (
            <button key={stat.id} onClick={() => markAll(stat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-sm ${stat.color}`}>
               全部 {stat.label}
            </button>
          ))}
       </div>

       <div className="overflow-y-auto border-2 border-white rounded-[2rem] bg-white/60 relative shadow-inner flex-1 min-h-0">
          <table className="w-full text-left border-collapse text-sm">
             <thead className={`sticky top-0 bg-${tc}-50/90 backdrop-blur-md z-10 shadow-sm transition-colors duration-500`}>
                <tr>
                   <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white min-w-[120px]">姓名</th>
                   <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white text-center">状态选择</th>
                </tr>
             </thead>
             <tbody>
                {filteredStudents.length === 0 ? (
                   <tr><td colSpan="2" className="text-center py-12 text-slate-400 font-bold">请选择班级或添加学生</td></tr>
                ) : (
                   filteredStudents.map(student => (
                      <tr key={student.id} className={`border-b border-white hover:bg-${tc}-50/30 transition-colors`}>
                         <td className="py-3 px-5 font-bold text-slate-700">
                           {student.chineseName} <br/><span className="text-xs text-slate-400">{student.malayName}</span>
                         </td>
                         <td className="py-3 px-5">
                            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                               {statuses.map(stat => {
                                  const isActive = currentRecord[student.id] === stat.id;
                                  return (
                                     <button 
                                        key={stat.id} 
                                        onClick={() => markHomework(student.id, stat.id)}
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-[3px] flex items-center justify-center transition-all ${isActive ? `${stat.color} border-white shadow-lg scale-110 ring-4 ring-${tc}-200` : 'bg-white border-slate-200 hover:border-slate-400'}`}
                                        title={stat.label}
                                     >
                                        {isActive && <CheckCircle className="w-5 h-5 text-current opacity-80" />}
                                     </button>
                                  )
                               })}
                            </div>
                         </td>
                      </tr>
                   ))
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
}

function HomeworkHistoryTab({ t, data, currentSemester }) {
  const { tc } = useContext(ThemeContext);
  const classes = useMemo(() => [...new Set(data.students.map(s => s.className))], [data.students]);
  const [selectedClass, setSelectedClass] = useState(classes[0] || '');
  const [selectedSubject, setSelectedSubject] = useState(data.subjects[0]?.id || '');

  useEffect(() => {
    if (!selectedClass && classes.length > 0) setSelectedClass(classes[0]);
  }, [classes, selectedClass]);

  useEffect(() => {
    if (!selectedSubject && data.subjects.length > 0) setSelectedSubject(data.subjects[0].id);
  }, [data.subjects, selectedSubject]);
  
  const filteredStudents = data.students.filter(s => s.className === selectedClass);
  
  // 基于学期严格过滤记录
  const prefix = currentSemester === '第一学期' 
    ? `${selectedClass}_${selectedSubject}_` 
    : `${currentSemester}_${selectedClass}_${selectedSubject}_`;
    
  const historyKeys = Object.keys(data.homeworks).filter(k => k.startsWith(prefix));
  
  const dates = historyKeys.map(k => {
    const parts = k.split('_');
    // 如果是第一学期，日期在索引2；如果是第二/三学期，带有前缀，日期在索引3
    return currentSemester === '第一学期' ? parts.slice(2).join('_') : parts.slice(3).join('_');
  }).sort((a,b) => new Date(b) - new Date(a)); // 倒序排列日期

  const statusMap = {
    blue: '非常优秀', green: '达标', yellow: '还可以', red: '不达标', black: '缺席', gray: '没有做'
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
       <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><History className={`text-${tc}-500`}/> {t.homeworkHistory} ({currentSemester})</h2>
       
       <div className="bg-white/60 p-4 rounded-2xl shadow-sm border border-white mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.className}</label>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="p-2 border rounded-xl outline-none font-bold text-sm bg-white min-w-[100px]">
              {classes.map((c, idx) => <option key={c || `class-${idx}`} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">{t.selectSubject}</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="p-2 border rounded-xl outline-none font-bold text-sm bg-white min-w-[120px]">
              {data.subjects.length === 0 && <option key="empty" value="">(请先添加科目)</option>}
              {data.subjects.map((s, idx) => <option key={s.id || `sub-${idx}`} value={s.id}>{s.name}</option>)}
            </select>
          </div>
       </div>

       <div className="overflow-auto border-2 border-white rounded-[2rem] bg-white/60 relative shadow-inner flex-1 min-h-0">
          <table className="w-full text-left border-collapse text-sm">
             <thead className={`sticky top-0 bg-${tc}-50/90 backdrop-blur-md z-10 shadow-sm transition-colors duration-500`}>
                <tr>
                   <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white min-w-[150px] sticky left-0 bg-inherit z-20">姓名</th>
                   {dates.length === 0 && <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white">无记录</th>}
                   {dates.map(date => {
                      const key = currentSemester === '第一学期' 
                         ? `${selectedClass}_${selectedSubject}_${date}` 
                         : `${currentSemester}_${selectedClass}_${selectedSubject}_${date}`;
                      const title = data.homeworkTitles[key] || '日常功课';
                      return (
                        <th key={date} className="py-2 px-3 font-extrabold text-slate-700 border-b border-white border-l text-center min-w-[100px]">
                           <div className="text-xs text-slate-400 font-mono mb-1">{date}</div>
                           <div className="truncate text-xs bg-white px-2 py-1 rounded-md border border-slate-100" title={title}>{title}</div>
                        </th>
                      )
                   })}
                </tr>
             </thead>
             <tbody>
                {filteredStudents.length === 0 ? (
                   <tr><td colSpan={dates.length + 1} className="text-center py-12 text-slate-400 font-bold">请选择班级或添加学生</td></tr>
                ) : (
                   filteredStudents.map(student => (
                      <tr key={student.id} className={`border-b border-white hover:bg-${tc}-50/30 transition-colors`}>
                         <td className="py-3 px-5 font-bold text-slate-700 sticky left-0 bg-white/80 backdrop-blur-sm z-10 border-r border-slate-100">
                           {student.chineseName} <br/><span className="text-xs text-slate-400 font-normal">{student.malayName}</span>
                         </td>
                         {dates.length === 0 && <td className="py-3 px-5"></td>}
                         {dates.map(date => {
                            const key = currentSemester === '第一学期' 
                               ? `${selectedClass}_${selectedSubject}_${date}` 
                               : `${currentSemester}_${selectedClass}_${selectedSubject}_${date}`;
                            const status = data.homeworks[key]?.[student.id];
                            return (
                               <td key={date} className="py-3 px-3 border-l border-white text-center">
                                  {status ? (
                                    <span className="inline-block w-full py-1.5 rounded-lg text-xs font-bold" style={{...getHwStyleObj(status)}}>
                                       {statusMap[status] || status}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                               </td>
                            )
                         })}
                      </tr>
                   ))
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
}

function getHwStyleObj(status) {
  if (status === 'blue') return { backgroundColor: '#3b82f6', color: 'white' };
  if (status === 'green') return { backgroundColor: '#22c55e', color: 'white' };
  if (status === 'yellow') return { backgroundColor: '#facc15', color: '#854d0e' };
  if (status === 'red') return { backgroundColor: '#ef4444', color: 'white' };
  if (status === 'black') return { backgroundColor: '#1e293b', color: 'white' };
  if (status === 'gray') return { backgroundColor: '#e2e8f0', color: '#475569' };
  return {};
}

function SkillsTab({ t, data, updateData, currentSemester }) {
  const { tc } = useContext(ThemeContext);
  const classes = useMemo(() => [...new Set(data.students.map(s => s.className))], [data.students]);
  const [selectedClass, setSelectedClass] = useState(classes[0] || '');
  const [selectedSubject, setSelectedSubject] = useState(data.subjects[0]?.id || '');
  const [newSkillName, setNewSkillName] = useState('');

  useEffect(() => {
    if (!selectedClass && classes.length > 0) setSelectedClass(classes[0]);
  }, [classes, selectedClass]);

  useEffect(() => {
    if (!selectedSubject && data.subjects.length > 0) setSelectedSubject(data.subjects[0].id);
  }, [data.subjects, selectedSubject]);

  const configKey = currentSemester === '第一学期' 
    ? `${selectedClass}_${selectedSubject}` 
    : `${currentSemester}_${selectedClass}_${selectedSubject}`;
    
  const currentSkills = data.skillsConfig[configKey] || [];
  const records = data.skillRecords[configKey] || {};
  const filteredStudents = data.students.filter(s => s.className === selectedClass);

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    if (currentSkills.includes(newSkillName.trim())) return alert("此技能名称已存在");
    
    updateData({
       skillsConfig: { ...data.skillsConfig, [configKey]: [...currentSkills, newSkillName.trim()] }
    });
    setNewSkillName('');
  };

  const removeSkill = (skill) => {
    if(!window.confirm(`确定要删除技能「${skill}」吗？相关的学生评估记录也会被隐藏。`)) return;
    updateData({
       skillsConfig: { ...data.skillsConfig, [configKey]: currentSkills.filter(s => s !== skill) }
    });
  };

  const handleTPChange = (studentId, skill, val) => {
    const studentRecord = { ...(records[studentId] || {}) };
    if (val) {
      studentRecord[skill] = Number(val);
    } else {
      delete studentRecord[skill];
    }

    updateData({
       skillRecords: {
          ...data.skillRecords,
          [configKey]: { ...records, [studentId]: studentRecord }
       }
    });
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Award className={`text-${tc}-500`}/> {t.skills} ({currentSemester})</h2>
          <div className="flex gap-4 items-center">
             <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="p-2 border border-white rounded-xl outline-none font-bold text-sm bg-white/80 shadow-sm min-w-[100px]">
               {classes.map((c, idx) => <option key={c || `class-${idx}`} value={c}>{c}</option>)}
             </select>
             <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="p-2 border border-white rounded-xl outline-none font-bold text-sm bg-white/80 shadow-sm min-w-[120px]">
               {data.subjects.length === 0 && <option key="empty" value="">(请先添加科目)</option>}
               {data.subjects.map((s, idx) => <option key={s.id || `sub-${idx}`} value={s.id}>{s.name}</option>)}
             </select>
          </div>
       </div>

       <div className="bg-white/60 p-4 rounded-2xl shadow-sm border-2 border-white mb-6 flex flex-wrap gap-4 items-center">
          <span className="text-sm font-bold text-slate-600">添加所评估的技能：</span>
          <input 
             type="text" 
             value={newSkillName} 
             onChange={e => setNewSkillName(e.target.value)} 
             placeholder="如: 阅读, 书写, 听力 (Membaca)" 
             className="flex-1 min-w-[150px] p-2 border-2 border-slate-100 rounded-xl outline-none font-bold text-sm focus:border-blue-400"
             onKeyDown={(e) => e.key === 'Enter' && addSkill()}
          />
          <button onClick={addSkill} className={`px-4 py-2 bg-${tc}-500 text-white rounded-xl font-bold hover:bg-${tc}-600 shadow flex items-center gap-1`}>
             <Plus className="w-4 h-4"/> 添加
          </button>
       </div>

       <div className="overflow-auto border-2 border-white rounded-[2rem] bg-white/60 relative shadow-inner flex-1 min-h-0">
          <table className="w-full text-center border-collapse text-sm">
             <thead className={`sticky top-0 bg-${tc}-50/90 backdrop-blur-md z-10 shadow-sm transition-colors duration-500`}>
                <tr>
                   <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white min-w-[150px] text-left">姓名</th>
                   {currentSkills.map(skill => (
                      <th key={skill} className="py-4 px-3 font-extrabold text-slate-700 border-b border-white group relative">
                         <div className="flex items-center justify-center gap-1">
                            {skill}
                            <button onClick={() => removeSkill(skill)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
                         </div>
                      </th>
                   ))}
                   <th className="py-4 px-5 font-extrabold text-blue-700 border-b border-white border-l bg-blue-50/50">技能平均 TP</th>
                </tr>
             </thead>
             <tbody>
                {filteredStudents.length === 0 ? (
                   <tr><td colSpan={currentSkills.length + 2} className="text-center py-12 text-slate-400 font-bold">请选择班级或添加学生</td></tr>
                ) : currentSkills.length === 0 ? (
                   <tr><td colSpan="2" className="text-center py-12 text-slate-400 font-bold">上方未设置任何技能项目</td></tr>
                ) : (
                   filteredStudents.map(student => {
                      const studentRecord = records[student.id] || {};
                      
                      // 计算平均TP
                      const tpValues = currentSkills.map(s => studentRecord[s]).filter(v => v);
                      const avgTp = tpValues.length > 0 ? (tpValues.reduce((a,b)=>a+b,0) / tpValues.length).toFixed(1) : '-';

                      return (
                         <tr key={student.id} className={`border-b border-white hover:bg-${tc}-50/30 transition-colors`}>
                            <td className="py-3 px-5 font-bold text-slate-700 text-left border-r border-slate-100">
                               {student.chineseName} <br/><span className="text-[10px] text-slate-400">{student.malayName}</span>
                            </td>
                            {currentSkills.map(skill => (
                               <td key={skill} className="py-3 px-3">
                                  <select 
                                     value={studentRecord[skill] || ''}
                                     onChange={e => handleTPChange(student.id, skill, e.target.value)}
                                     className={`w-full max-w-[80px] p-1.5 rounded-lg outline-none font-bold text-center border cursor-pointer ${studentRecord[skill] ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                                  >
                                     <option value="">-</option>
                                     {[1,2,3,4,5,6].map(v => <option key={v} value={v}>TP {v}</option>)}
                                  </select>
                               </td>
                            ))}
                            <td className="py-3 px-5 font-black text-blue-700 border-l border-white bg-blue-50/30">
                               {avgTp}
                            </td>
                         </tr>
                      )
                   })
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
}

function ExamsTab({ t, data, updateData, currentSemester }) {
  const { tc } = useContext(ThemeContext);
  const classes = useMemo(() => [...new Set(data.students.map(s => s.className))], [data.students]);
  const [selectedClass, setSelectedClass] = useState(classes[0] || '');
  const [selectedSubject, setSelectedSubject] = useState(data.subjects[0]?.id || '');

  useEffect(() => {
    if (!selectedClass && classes.length > 0) setSelectedClass(classes[0]);
  }, [classes, selectedClass]);

  useEffect(() => {
    if (!selectedSubject && data.subjects.length > 0) setSelectedSubject(data.subjects[0].id);
  }, [data.subjects, selectedSubject]);
  
  // 考试配置表单
  const [examName, setExamName] = useState('');
  const [partsInput, setPartsInput] = useState('PartA, PartB');
  const [maxTotal, setMaxTotal] = useState(50);
  
  const prefix = currentSemester === '第一学期' 
    ? `${selectedClass}_${selectedSubject}_` 
    : `${currentSemester}_${selectedClass}_${selectedSubject}_`;
    
  const examId = `${prefix}${examName}`;
  const config = data.examsConfig[examId];
  const records = data.examRecords[examId] || {};

  const filteredStudents = data.students.filter(s => s.className === selectedClass);

  const createExam = () => {
    if (!examName.trim()) return alert("请输入考试名称");
    const parts = partsInput.split(',').map(s => s.trim()).filter(s => s);
    if (parts.length === 0) parts.push('总分');
    
    updateData({
      examsConfig: {
        ...data.examsConfig,
        [examId]: { parts, maxTotal: Number(maxTotal) || 100 }
      }
    });
  };

  const handleMarkChange = (studentId, field, value) => {
    if (!config) return;
    const numValue = Number(value);
    
    const studentRecord = { ...(records[studentId] || { marks: {}, deduction: 0 }) };
    
    if (field === 'deduction') {
      studentRecord.deduction = numValue;
    } else {
      studentRecord.marks[field] = numValue;
    }
    
    // 重新计算
    let totalMarks = 0;
    config.parts.forEach(p => {
      totalMarks += (studentRecord.marks[p] || 0);
    });
    totalMarks -= (studentRecord.deduction || 0);
    if (totalMarks < 0) totalMarks = 0;
    
    const percentage = Math.round((totalMarks / config.maxTotal) * 100);
    const { grade, tp } = calculateGradeAndTP(percentage);
    
    studentRecord.total = totalMarks;
    studentRecord.percentage = percentage;
    studentRecord.grade = grade;
    studentRecord.tp = tp;

    updateData({
      examRecords: {
        ...data.examRecords,
        [examId]: { ...records, [studentId]: studentRecord }
      }
    });
  };

  const currentExamKeys = Object.keys(data.examsConfig).filter(k => k.startsWith(prefix));

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
       <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><ClipboardList className={`text-${tc}-500`}/> {t.exam} ({currentSemester})</h2>
       
       <div className="bg-white/60 p-5 rounded-3xl shadow-sm border-2 border-white mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">{t.className}</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="p-2 border rounded-xl outline-none font-bold text-sm bg-white min-w-[100px]">
                {classes.map((c, idx) => <option key={c || `class-${idx}`} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">{t.selectSubject}</label>
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="p-2 border rounded-xl outline-none font-bold text-sm bg-white min-w-[120px]">
                {data.subjects.length === 0 && <option key="empty" value="">(请先添加科目)</option>}
                {data.subjects.map((s, idx) => <option key={s.id || `sub-${idx}`} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
               <label className="block text-xs font-bold text-slate-500 mb-1">选择已有考试</label>
               <select value={examName} onChange={e => setExamName(e.target.value)} className="w-full p-2 border rounded-xl outline-none font-bold text-sm bg-white">
                 <option value="">-- 新建考试 --</option>
                 {currentExamKeys.map((k, idx) => {
                   const parts = k.split('_');
                   const name = currentSemester === '第一学期' ? parts.slice(2).join('_') : parts.slice(3).join('_');
                   return <option key={k || `exam-${idx}`} value={name}>{name}</option>
                 })}
               </select>
            </div>
          </div>

          {!data.examsConfig[examId] && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 items-end">
               <div className="flex-1 min-w-[150px]">
                 <label className="block text-xs font-bold text-slate-500 mb-1">{t.examType}</label>
                 <input type="text" value={examName} onChange={e => setExamName(e.target.value)} placeholder="例如: 年中考、Ujian 1" className="w-full p-2 border rounded-xl outline-none font-bold text-sm bg-white" />
               </div>
               <div className="flex-2 min-w-[200px]">
                 <label className="block text-xs font-bold text-slate-500 mb-1">{t.examParts}</label>
                 <input type="text" value={partsInput} onChange={e => setPartsInput(e.target.value)} placeholder="PartA, PartB" className="w-full p-2 border rounded-xl outline-none font-bold text-sm bg-white" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1">满分</label>
                 <input type="number" value={maxTotal} onChange={e => setMaxTotal(e.target.value)} className="w-20 p-2 border rounded-xl outline-none font-bold text-sm bg-white" />
               </div>
               <button onClick={createExam} className={`px-5 py-2.5 bg-${tc}-500 text-white rounded-xl font-bold hover:bg-${tc}-600 transition-colors`}>
                  创建配置
               </button>
            </div>
          )}
       </div>

       {config ? (
         <div className="overflow-y-auto border-2 border-white rounded-[2rem] bg-white/60 relative shadow-inner flex-1 min-h-0">
            <table className="w-full text-center border-collapse text-sm">
               <thead className={`sticky top-0 bg-${tc}-50/90 backdrop-blur-md z-10 shadow-sm transition-colors duration-500`}>
                  <tr>
                     <th className="py-4 px-3 font-extrabold text-slate-700 border-b border-white text-left min-w-[120px]">姓名</th>
                     {config.parts.map(p => (
                       <th key={p} className="py-4 px-2 font-extrabold text-slate-600 border-b border-white">{p}</th>
                     ))}
                     <th className="py-4 px-2 font-extrabold text-slate-600 border-b border-white text-red-500">{t.deduction}</th>
                     <th className="py-4 px-2 font-black text-slate-800 border-b border-white bg-slate-100/50">总分 (/{config.maxTotal})</th>
                     <th className="py-4 px-2 font-black text-slate-800 border-b border-white bg-slate-100/50">百分比 (%)</th>
                     <th className="py-4 px-2 font-black text-slate-800 border-b border-white">{t.grade}</th>
                     <th className="py-4 px-3 font-black text-slate-800 border-b border-white">TP</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredStudents.length === 0 ? (
                     <tr><td colSpan={config.parts.length + 6} className="text-center py-12 text-slate-400 font-bold">无学生记录</td></tr>
                  ) : (
                     filteredStudents.map(student => {
                        const rec = records[student.id] || { marks: {}, deduction: 0, total: 0, percentage: 0, grade: '-', tp: '-' };
                        return (
                           <tr key={student.id} className={`border-b border-white hover:bg-${tc}-50/30 transition-colors`}>
                              <td className="py-2 px-3 font-bold text-slate-700 text-left">
                                {student.chineseName} <br/><span className="text-[10px] text-slate-400">{student.malayName}</span>
                              </td>
                              {config.parts.map(p => (
                                 <td key={p} className="py-2 px-2">
                                    <input 
                                      type="number" 
                                      min="0"
                                      value={rec.marks[p] || ''} 
                                      onChange={e => handleMarkChange(student.id, p, e.target.value)}
                                      className="w-16 p-1.5 text-center border rounded outline-none font-mono text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400" 
                                    />
                                 </td>
                              ))}
                              <td className="py-2 px-2">
                                 <input 
                                    type="number" 
                                    min="0"
                                    value={rec.deduction || ''} 
                                    onChange={e => handleMarkChange(student.id, 'deduction', e.target.value)}
                                    className="w-16 p-1.5 text-center border border-red-200 text-red-600 rounded outline-none font-mono text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-red-50" 
                                 />
                              </td>
                              <td className="py-2 px-2 font-black text-slate-700 bg-slate-50/50">{rec.total}</td>
                              <td className="py-2 px-2 font-black text-slate-700 bg-slate-50/50">{rec.percentage}%</td>
                              <td className="py-2 px-2">
                                 <span className={`inline-block w-8 py-1 rounded font-black text-sm ${
                                   rec.grade === 'A' ? 'bg-green-100 text-green-700' :
                                   (rec.grade === 'B' || rec.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                   (rec.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'))
                                 }`}>{rec.grade}</span>
                              </td>
                              <td className="py-2 px-3">
                                 <span className={`inline-block w-8 py-1 rounded font-black text-sm ${tpColorStyles[rec.tp] || 'bg-slate-100 text-slate-500'}`}>
                                   {rec.tp}
                                 </span>
                              </td>
                           </tr>
                        )
                     })
                  )}
               </tbody>
            </table>
         </div>
       ) : (
         <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/30 text-slate-400 font-bold">
            请先在上方配置或选择一场考试
         </div>
       )}
    </div>
  );
}

function AnalysisTab({ t, data, updateData, currentSemester }) {
  const { tc } = useContext(ThemeContext);
  const classes = useMemo(() => [...new Set(data.students.map(s => s.className))], [data.students]);
  const [selectedClass, setSelectedClass] = useState(classes[0] || '');
  const [selectedSubject, setSelectedSubject] = useState(data.subjects[0]?.id || '');

  useEffect(() => {
    if (!selectedClass && classes.length > 0) setSelectedClass(classes[0]);
  }, [classes, selectedClass]);

  useEffect(() => {
    if (!selectedSubject && data.subjects.length > 0) setSelectedSubject(data.subjects[0].id);
  }, [data.subjects, selectedSubject]);
  
  const filteredStudents = data.students.filter(s => s.className === selectedClass);
  
  // 最终TP录入与分析逻辑，按学期隔离
  const tpKey = currentSemester === '第一学期' 
    ? `${selectedClass}_${selectedSubject}_final` 
    : `${currentSemester}_${selectedClass}_${selectedSubject}_final`;
    
  const currentFinalTPs = data.finalTPs[tpKey] || {};

  const handleFinalTPChange = (studentId, val) => {
    updateData({
      finalTPs: {
        ...data.finalTPs,
        [tpKey]: { ...currentFinalTPs, [studentId]: Number(val) || '' }
      }
    });
  };

  const handleApplySuggestedTP = (studentId, suggestedTp) => {
    if (!suggestedTp || suggestedTp === '-') return;
    handleFinalTPChange(studentId, suggestedTp);
  };

  const handleApplyAllSuggested = (studentAnalysisArray) => {
    const updates = {};
    studentAnalysisArray.forEach(s => {
       if(s.suggestedTP !== '-') updates[s.id] = s.suggestedTP;
    });
    updateData({
      finalTPs: { ...data.finalTPs, [tpKey]: { ...currentFinalTPs, ...updates } }
    });
  };

  const exportData = () => {
    let html = `<table><tr><th colspan="7">${selectedClass} - ${selectedSubject} - ${currentSemester} 综合分析报告</th></tr>`;
    html += '<tr><th>姓名</th><th>性别</th><th>技能得分 (40%)</th><th>考试得分 (60%)</th><th>综合百分比</th><th>建议TP</th><th>最终TP</th></tr>';
    filteredStudents.forEach(s => {
       const info = getStudentAnalysisInfo(s.id);
       const tp = currentFinalTPs[s.id] || '-';
       let colorStyle = tp >= 5 ? 'background-color:#dcfce7;color:#15803d;' : (tp >= 3 ? 'background-color:#fef9c3;color:#a16207;' : 'background-color:#fee2e2;color:#b91c1c;');
       if(tp === '-') colorStyle = '';
       html += `<tr>
         <td>${s.chineseName}</td>
         <td>${s.gender}</td>
         <td>${info.skillPct > 0 ? info.skillPct.toFixed(1) + '%' : '-'}</td>
         <td>${info.examPct > 0 ? info.examPct.toFixed(1) + '%' : '-'}</td>
         <td>${info.finalPct > 0 ? info.finalPct.toFixed(1) + '%' : '-'}</td>
         <td>${info.suggestedTP}</td>
         <td style="${colorStyle}">${tp}</td>
       </tr>`;
    });
    html += '</table>';
    exportToXlsWithStyles(html, `综合分析_${selectedClass}_${currentSemester}`);
  };

  // --------------------------------------------------------------------------
  // 核心计算逻辑：严格抽离当前学期的 技能百分比 与 考试百分比 并加权计算。
  // --------------------------------------------------------------------------
  const getStudentAnalysisInfo = (studentId) => {
     // 1. 获取技能评估 (40%) - 严格读取当前学期
     const configKey = currentSemester === '第一学期' 
        ? `${selectedClass}_${selectedSubject}` 
        : `${currentSemester}_${selectedClass}_${selectedSubject}`;
        
     const studentSkills = data.skillRecords[configKey]?.[studentId] || {};
     const skillTps = Object.values(studentSkills).map(Number).filter(n => !isNaN(n));
     const avgSkillTP = skillTps.length ? skillTps.reduce((a,b)=>a+b,0) / skillTps.length : 0;
     const skillPct = avgSkillTP ? (avgSkillTP / 6) * 100 : 0; // 把平均TP转换为百分制

     // 2. 获取考试评估 (60%) - 严格读取当前学期
     const prefix = currentSemester === '第一学期' 
        ? `${selectedClass}_${selectedSubject}_` 
        : `${currentSemester}_${selectedClass}_${selectedSubject}_`;
        
     const examKeys = Object.keys(data.examsConfig).filter(k => k.startsWith(prefix));
     let totalExamPct = 0;
     let examCount = 0;
     examKeys.forEach(k => {
        const rec = data.examRecords[k]?.[studentId];
        if (rec && rec.percentage !== undefined && !isNaN(rec.percentage)) {
           totalExamPct += rec.percentage;
           examCount++;
        }
     });
     const examPct = examCount ? (totalExamPct / examCount) : 0;

     // 3. 计算最终百分比与建议TP
     let finalPct = 0;
     if (skillTps.length > 0 && examCount > 0) {
         finalPct = (skillPct * 0.4) + (examPct * 0.6); // 严格的 4/6 开
     } else if (skillTps.length > 0) {
         finalPct = skillPct; // 仅有技能数据时
     } else if (examCount > 0) {
         finalPct = examPct; // 仅有考试数据时
     }

     const { tp: suggestedTP, grade: suggestedGrade } = finalPct > 0 ? calculateGradeAndTP(finalPct) : { tp: '-', grade: '-' };

     return {
        skillPct,
        examPct,
        finalPct,
        suggestedTP,
        suggestedGrade
     };
  };

  // 计算统计数据用于 StatTable (基于老师**最终确定**的TP)
  const stats = {
    male: { tp1:0, tp2:0, tp3:0, tp4:0, tp5:0, tp6:0 },
    female: { tp1:0, tp2:0, tp3:0, tp4:0, tp5:0, tp6:0 },
    total: { tp1:0, tp2:0, tp3:0, tp4:0, tp5:0, tp6:0 }
  };

  const analysisArray = filteredStudents.map(s => {
     const info = getStudentAnalysisInfo(s.id);
     
     // 更新统计
     const tp = currentFinalTPs[s.id];
     if (tp >= 1 && tp <= 6) {
       const key = `tp${tp}`;
       if (s.gender === 'L') stats.male[key]++;
       else if (s.gender === 'P') stats.female[key]++;
       stats.total[key]++;
     }

     return { ...s, ...info };
  });

  const columns = [
    { key: 'tp1', label: 'TP 1' },
    { key: 'tp2', label: 'TP 2' },
    { key: 'tp3', label: 'TP 3' },
    { key: 'tp4', label: 'TP 4' },
    { key: 'tp5', label: 'TP 5' },
    { key: 'tp6', label: 'TP 6' }
  ];

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
       <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><BarChart2 className={`text-${tc}-500`}/> {t.analysis} ({currentSemester})</h2>
       
       <div className="bg-white/60 p-4 rounded-2xl shadow-sm border border-white mb-6 flex flex-wrap gap-4 items-end justify-between">
          <div className="flex gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">{t.className}</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="p-2 border rounded-xl outline-none font-bold text-sm bg-white min-w-[100px]">
                {classes.map((c, idx) => <option key={c || `class-${idx}`} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">{t.selectSubject}</label>
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="p-2 border rounded-xl outline-none font-bold text-sm bg-white min-w-[120px]">
                {data.subjects.length === 0 && <option key="empty" value="">(请先添加科目)</option>}
                {data.subjects.map((s, idx) => <option key={s.id || `sub-${idx}`} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button onClick={() => handleApplyAllSuggested(analysisArray)} className="px-5 py-2.5 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-md flex items-center gap-2">
               <Copy className="w-5 h-5"/> 采用全部建议TP
             </button>
             <button onClick={exportData} className="px-5 py-2.5 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-md flex items-center gap-2">
               <Download className="w-5 h-5"/> 导出 Excel
             </button>
          </div>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="overflow-y-auto border-2 border-white rounded-[2rem] bg-white/60 relative shadow-inner">
            <table className="w-full text-center border-collapse text-xs md:text-sm">
               <thead className={`sticky top-0 bg-${tc}-50/90 backdrop-blur-md z-10 shadow-sm transition-colors duration-500`}>
                  <tr>
                     <th className="py-4 px-4 font-extrabold text-slate-700 border-b border-white text-left min-w-[100px]">姓名</th>
                     <th className="py-4 px-2 font-extrabold text-indigo-700 border-b border-white bg-indigo-50/50">技能平均 (40%)</th>
                     <th className="py-4 px-2 font-extrabold text-orange-700 border-b border-white bg-orange-50/50">考试总计 (60%)</th>
                     <th className="py-4 px-2 font-extrabold text-slate-700 border-b border-white border-l">综合百分比</th>
                     <th className="py-4 px-3 font-extrabold text-slate-700 border-b border-white bg-slate-100">建议 TP</th>
                     <th className="py-4 px-4 font-extrabold text-slate-700 border-b border-white border-l-2 border-l-white bg-slate-50">最终决定 TP</th>
                  </tr>
               </thead>
               <tbody>
                  {analysisArray.length === 0 ? (
                     <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-bold">无数据</td></tr>
                  ) : (
                     analysisArray.map(student => {
                        const finalTp = currentFinalTPs[student.id] || '';
                        return (
                           <tr key={student.id} className={`border-b border-white hover:bg-${tc}-50/30 transition-colors`}>
                              <td className="py-3 px-4 font-bold text-slate-700 text-left border-r border-slate-100">
                                 {student.chineseName}
                              </td>
                              <td className="py-3 px-2 font-mono text-indigo-600 bg-indigo-50/30">
                                 {student.skillPct > 0 ? `${student.skillPct.toFixed(1)}%` : '-'}
                              </td>
                              <td className="py-3 px-2 font-mono text-orange-600 bg-orange-50/30">
                                 {student.examPct > 0 ? `${student.examPct.toFixed(1)}%` : '-'}
                              </td>
                              <td className="py-3 px-2 font-black text-slate-700 border-l border-white">
                                 {student.finalPct > 0 ? `${student.finalPct.toFixed(1)}%` : '-'}
                              </td>
                              <td className="py-3 px-3 bg-slate-50 border-r border-white">
                                 <button 
                                    onClick={() => handleApplySuggestedTP(student.id, student.suggestedTP)}
                                    title="点击应用此建议值"
                                    className={`px-3 py-1 rounded-md font-black text-sm hover:ring-2 ring-blue-300 transition-all ${tpColorStyles[student.suggestedTP] || 'bg-slate-100 text-slate-400'}`}
                                 >
                                   {student.suggestedTP}
                                 </button>
                              </td>
                              <td className="py-3 px-4 bg-slate-50/50">
                                 <select 
                                   value={finalTp} 
                                   onChange={e => handleFinalTPChange(student.id, e.target.value)}
                                   className={`w-full max-w-[100px] p-2 rounded-xl outline-none font-black text-center ${finalTp ? tpColorStyles[finalTp] : 'bg-white border border-slate-200 shadow-sm'}`}
                                 >
                                    <option value="">- 请选择 -</option>
                                    {[1,2,3,4,5,6].map(v => <option key={v} value={v}>TP {v}</option>)}
                                 </select>
                              </td>
                           </tr>
                        )
                     })
                  )}
               </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-6 overflow-y-auto pr-2">
            <StatTable title={`${selectedClass} (${currentSemester}) - 最终决定 TP 统计`} columns={columns} stats={stats} />
            
            <div className={`bg-${tc}-50 p-6 rounded-[2rem] border-2 border-${tc}-100 shadow-inner flex flex-col gap-3`}>
              <h3 className="font-extrabold text-slate-700">评分机制说明 ({currentSemester})</h3>
              <p className="text-sm font-bold text-slate-600"><strong>• 学期隔离：</strong>现在的综合建议及最终决定 TP 将仅限当前【{currentSemester}】的数据进行计算，不影响其他学期。</p>
              <p className="text-sm font-bold text-slate-600"><strong>• 技能评估 (40%)：</strong>提取「技能评估Tab」中该学生的所有TP，计算平均值后折算为 100分制。</p>
              <p className="text-sm font-bold text-slate-600"><strong>• 考试成绩 (60%)：</strong>提取「考试成绩Tab」中该学生在本科目的所有考试记录，计算其平均百分比。</p>
              <p className="text-sm font-bold text-blue-700"><strong>• 快捷操作：</strong>您可以点击中间的“建议TP”方块，将其直接填入右侧；或者点击上方的“采用全部建议TP”按钮一键录入。</p>
            </div>
          </div>
       </div>
    </div>
  );
}
