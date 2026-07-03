import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, onSnapshot, addDoc } from "firebase/firestore";
import { 
  Users, BookOpen, PenTool, BarChart2, Settings, LogOut, 
  Globe, Plus, Trash2, FileText, CheckCircle, XCircle, Flower,
  Edit2, Save, X, Calendar, ClipboardList, Loader2, Download, Palette
} from 'lucide-react';

// ==========================================
// 1. 你的专属 Firebase 配置
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDYgQmxMcDQdnhw5IEMMdFpkff7SUN5L9M",
  authDomain: "pbd-sek-f0cbc.firebaseapp.com",
  projectId: "pbd-sek-f0cbc",
  storageBucket: "pbd-sek-f0cbc.firebasestorage.app",
  messagingSenderId: "736112610562",
  appId: "1:736112610562:web:bff35c152edd89eb12061b",
  measurementId: "G-E4TXVG1X3Y"
};

const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app);

const SEMESTERS = ['第一学期', '第二学期', '第三学期'];

const translations = {
  zh: {
    systemName: '萌花评估系统 (云端版)',
    login: '老师登录',
    enterRoom: '进入房间',
    createRoom: '注册新房间',
    teacherName: '您的姓名 (第一次注册需填)',
    roomCode: '房号 (班级/特定代号)',
    forgotRoom: '忘记房号？请联系 Admin',
    students: '学生管理',
    subjects: '科目管理',
    homework: '功课记录',
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

// ==========================================
// 2. 可爱花朵主题配置 (Cute Themes)
// ==========================================
const THEMES = {
  sakura: {
    id: 'sakura', name: '樱花粉', icon: '🌸',
    main: 'bg-pink-500', hover: 'hover:bg-pink-600', text: 'text-pink-600',
    light: 'bg-pink-50', border: 'border-pink-200', ring: 'focus:ring-pink-400',
    shadow: 'shadow-pink-200', gradient: 'from-pink-100 to-pink-50',
    tableHead: 'bg-pink-100/50'
  },
  sunflower: {
    id: 'sunflower', name: '向日葵黄', icon: '🌻',
    main: 'bg-amber-500', hover: 'hover:bg-amber-600', text: 'text-amber-600',
    light: 'bg-amber-50', border: 'border-amber-200', ring: 'focus:ring-amber-400',
    shadow: 'shadow-amber-200', gradient: 'from-amber-100 to-amber-50',
    tableHead: 'bg-amber-100/50'
  },
  lavender: {
    id: 'lavender', name: '薰衣草紫', icon: '🪻',
    main: 'bg-purple-500', hover: 'hover:bg-purple-600', text: 'text-purple-600',
    light: 'bg-purple-50', border: 'border-purple-200', ring: 'focus:ring-purple-400',
    shadow: 'shadow-purple-200', gradient: 'from-purple-100 to-purple-50',
    tableHead: 'bg-purple-100/50'
  },
  hydrangea: {
    id: 'hydrangea', name: '绣球蓝', icon: '💠',
    main: 'bg-blue-400', hover: 'hover:bg-blue-500', text: 'text-blue-600',
    light: 'bg-blue-50', border: 'border-blue-200', ring: 'focus:ring-blue-400',
    shadow: 'shadow-blue-200', gradient: 'from-blue-100 to-blue-50',
    tableHead: 'bg-blue-100/50'
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

const getHwColorStyle = (status) => {
   if (status === 'blue') return 'background-color: #3b82f6; color: white; font-weight: bold;';
   if (status === 'green') return 'background-color: #22c55e; color: white; font-weight: bold;';
   if (status === 'yellow') return 'background-color: #facc15; color: #854d0e; font-weight: bold;';
   if (status === 'red') return 'background-color: #ef4444; color: white; font-weight: bold;';
   if (status === 'black') return 'background-color: #1e293b; color: white; font-weight: bold;';
   if (status === 'gray') return 'background-color: #e2e8f0; color: #475569; font-weight: bold;';
   return '';
};

const getGradeColorStyle = (grade) => {
   if (grade === 'A') return 'background-color: #dcfce7; color: #16a34a; font-weight: bold;';
   if (grade === 'B' || grade === 'C' || grade === 'D' || grade === 'E') return 'background-color: #fef08a; color: #ca8a04; font-weight: bold;';
   if (grade === 'F') return 'background-color: #fee2e2; color: #dc2626; font-weight: bold;';
   return '';
};

const getTpColorStyle = (tp) => {
   if (tp == 6 || tp == 5) return 'background-color: #dcfce7; color: #16a34a; font-weight: bold;';
   if (tp == 4 || tp == 3) return 'background-color: #fef08a; color: #ca8a04; font-weight: bold;';
   if (tp == 2 || tp == 1) return 'background-color: #fee2e2; color: #dc2626; font-weight: bold;';
   return '';
};

// ==========================================
// 3. Excel 彩色导出引擎
// ==========================================
const exportToXlsWithStyles = (htmlTable, filename) => {
  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <meta charset="UTF-8">
    <style>
      table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
      td, th { border: 1px solid #cbd5e1; padding: 8px; text-align: center; }
      th { background-color: #f8fafc; font-weight: bold; }
    </style>
    </head>
    <body>${htmlTable}</body>
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

// 注入漂浮动画 CSS
const GlobalStyles = () => (
  <style>{`
    @keyframes float-up {
      0% { transform: translateY(100vh) rotate(0deg) scale(0.8); opacity: 0; }
      10% { opacity: 0.8; }
      80% { opacity: 0.8; }
      100% { transform: translateY(-20vh) rotate(360deg) scale(1.2); opacity: 0; }
    }
    .flower-flake {
      position: fixed;
      bottom: -10%;
      animation-name: float-up;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
      z-index: 0;
      pointer-events: none;
      user-select: none;
    }
    .glass-panel {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
  `}</style>
);

// 漂浮背景组件
const FloatingFlowers = ({ theme }) => {
  const flakes = Array.from({ length: 18 });
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-br from-white to-slate-50">
      <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${theme.gradient}`}></div>
      {flakes.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 20;
        const duration = 12 + Math.random() * 15;
        const size = 1.5 + Math.random() * 2;
        return (
          <div key={i} className="flower-flake drop-shadow-sm" style={{
            left: `${left}%`, animationDuration: `${duration}s`, animationDelay: `-${delay}s`, fontSize: `${size}rem`
          }}>
            {theme.icon}
          </div>
        );
      })}
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState('zh');
  const t = translations[lang] || translations['zh'];

  const [authState, setAuthState] = useState('login');
  const [currentRoom, setCurrentRoom] = useState('');
  const [loadingDb, setLoadingDb] = useState(true);
  
  const [db, setDb] = useState({ rooms: {}, logs: [], roomData: {} });

  useEffect(() => {
    const unsubRooms = onSnapshot(collection(firestoreDb, 'rooms'), (snapshot) => {
      const newRooms = {};
      const newRoomData = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        newRooms[docSnap.id] = { owner: data.owner };
        newRoomData[docSnap.id] = data.roomData || {};
      });
      setDb(prev => ({ ...prev, rooms: newRooms, roomData: newRoomData }));
      setLoadingDb(false);
    }, (error) => {
      console.error("Firebase read error (rooms):", error);
      setLoadingDb(false);
    });

    const unsubLogs = onSnapshot(collection(firestoreDb, 'logs'), (snapshot) => {
      const newLogs = [];
      snapshot.forEach(docSnap => newLogs.push({ id: docSnap.id, ...docSnap.data() }));
      newLogs.sort((a, b) => new Date(b.time) - new Date(a.time));
      setDb(prev => ({ ...prev, logs: newLogs }));
    }, (error) => {
      console.error("Firebase read error (logs):", error);
    });

    return () => { unsubRooms(); unsubLogs(); };
  }, []);

  const rawCurrentData = db.roomData[currentRoom] || {};
  const currentData = { 
    themeId: rawCurrentData.themeId || 'sakura',
    students: rawCurrentData.students || [], 
    subjects: rawCurrentData.subjects || [], 
    homeworks: rawCurrentData.homeworks || {}, 
    examsConfig: rawCurrentData.examsConfig || {}, 
    examRecords: rawCurrentData.examRecords || {}, 
    finalTPs: rawCurrentData.finalTPs || {}, 
    homeworkTitles: rawCurrentData.homeworkTitles || {} 
  };

  const activeTheme = THEMES[currentData.themeId] || THEMES.sakura;

  const handleLogin = async (code, teacherName) => {
    if (!code) return;
    const roomRef = doc(firestoreDb, 'rooms', code);
    
    if (!db.rooms[code]) {
      if (!teacherName) return; 
      setDb(prev => ({
        ...prev,
        rooms: { ...prev.rooms, [code]: { owner: teacherName } },
        roomData: { ...prev.roomData, [code]: { themeId: 'sakura', students: [], subjects: [], homeworks: {}, examsConfig: {}, examRecords: {}, finalTPs: {}, homeworkTitles: {} } }
      }));
      await setDoc(roomRef, {
        owner: teacherName,
        roomData: { themeId: 'sakura', students: [], subjects: [], homeworks: {}, examsConfig: {}, examRecords: {}, finalTPs: {}, homeworkTitles: {} }
      });
    }

    await addDoc(collection(firestoreDb, 'logs'), {
      time: new Date().toISOString(),
      room: code,
      owner: db.rooms[code]?.owner || teacherName
    });
    
    setCurrentRoom(code);
    setAuthState('teacher');
  };

  const handleAdminLogin = () => setAuthState('admin');

  const updateRoomData = async (newData) => {
    const updatedData = { ...currentData, ...newData };
    setDb(prev => ({
      ...prev,
      roomData: { ...prev.roomData, [currentRoom]: updatedData }
    }));
    const roomRef = doc(firestoreDb, 'rooms', currentRoom);
    await setDoc(roomRef, { roomData: updatedData }, { merge: true });
  };

  if (loadingDb) {
    return (
      <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-pink-400 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-600">正在进入萌花系统...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-800 font-sans relative overflow-x-hidden">
      <GlobalStyles />
      <FloatingFlowers theme={activeTheme} />

      <header className="glass-panel shadow-sm px-6 py-4 flex justify-between items-center relative z-20 border-b border-white/40">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-2xl ${activeTheme.light} border ${activeTheme.border} shadow-sm`}>
            <span className="text-2xl leading-none">{activeTheme.icon}</span>
          </div>
          <h1 className={`text-xl font-extrabold ${activeTheme.text} tracking-wide`}>{t.systemName}</h1>
          {currentRoom && authState === 'teacher' && (
            <span className={`ml-4 px-4 py-1.5 ${activeTheme.light} ${activeTheme.text} border ${activeTheme.border} rounded-full text-sm font-bold flex items-center gap-2 shadow-inner`}>
              <span className={`w-2 h-2 rounded-full ${activeTheme.main} animate-pulse`}></span>
              房号: {currentRoom} ({db.rooms[currentRoom]?.owner || '加载中...'})
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {authState === 'teacher' && (
            <div className="flex items-center gap-2 mr-4 bg-white/60 px-3 py-1.5 rounded-full border border-white/80 shadow-sm">
              <Palette className={`w-4 h-4 ${activeTheme.text}`} />
              <select 
                value={currentData.themeId} 
                onChange={e => updateRoomData({ themeId: e.target.value })}
                className={`bg-transparent outline-none font-bold text-sm cursor-pointer ${activeTheme.text}`}
              >
                {Object.values(THEMES).map(th => (
                  <option key={th.id} value={th.id}>{th.icon} {th.name}</option>
                ))}
              </select>
            </div>
          )}
          {authState !== 'login' && (
            <button onClick={() => {setAuthState('login'); setCurrentRoom('');}} className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition px-3 py-1.5 rounded-xl hover:bg-red-50 font-bold">
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          )}
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-[1400px] mx-auto relative z-10">
        {authState === 'login' && <LoginView t={t} db={db} th={activeTheme} onLogin={handleLogin} onAdminLogin={handleAdminLogin} />}
        {authState === 'admin' && <AdminView t={t} db={db} th={activeTheme} />}
        {authState === 'teacher' && <TeacherDashboard t={t} data={currentData} th={activeTheme} updateData={updateRoomData} />}
      </main>
    </div>
  );
}

function LoginView({ t, db, th, onLogin, onAdminLogin }) {
  const [code, setCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  
  const isNewRoom = code.length > 0 && !db.rooms[code];

  const handleLoginSubmit = () => {
    if (isNewRoom && !teacherName.trim()) {
      setErrorMsg("第一次注册请填写您的姓名！");
      return;
    }
    setErrorMsg('');
    onLogin(code, teacherName);
  };

  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className={`glass-panel p-8 rounded-[2rem] shadow-2xl w-full md:w-[400px] border-2 border-white/80`}>
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`text-4xl animate-bounce`}>{th.icon}</div>
          <h2 className={`text-2xl font-extrabold ${th.text}`}>{t.login}</h2>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className={`block text-sm font-bold text-slate-600 mb-2 ml-2`}>{t.roomCode}</label>
            <input type="text" value={code} onChange={(e) => {setCode(e.target.value); setErrorMsg('');}} className={`w-full px-5 py-3 bg-white/80 border-2 ${th.border} rounded-2xl ${th.ring} focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner`} placeholder="输入特定房号进入" />
          </div>
          
          {isNewRoom && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-emerald-600 mb-2 ml-2">🌸 检测到新房号，{t.teacherName}</label>
              <input type="text" value={teacherName} onChange={(e) => {setTeacherName(e.target.value); setErrorMsg('');}} className={`w-full px-5 py-3 bg-white/80 border-2 rounded-2xl focus:ring-2 focus:ring-emerald-400 outline-none transition-all font-bold text-slate-700 shadow-inner ${errorMsg ? 'border-red-400' : 'border-emerald-200'}`} placeholder="例如: 林老师" />
              {errorMsg && <p className="text-xs text-red-500 font-bold mt-2 ml-2">{errorMsg}</p>}
            </div>
          )}

          <button onClick={handleLoginSubmit} className={`w-full ${th.main} text-white py-3.5 rounded-2xl ${th.hover} transition-all font-extrabold text-lg shadow-lg ${th.shadow} mt-4 transform hover:scale-[1.02] active:scale-95`}>
            {isNewRoom ? t.createRoom : t.enterRoom}
          </button>
        </div>
      </div>
      
      {!showAdminInput ? (
        <button onClick={() => setShowAdminInput(true)} className="mt-16 text-[10px] text-slate-400/50 hover:text-slate-500 transition-colors tracking-widest uppercase font-bold">
          admin
        </button>
      ) : (
        <div className="mt-12 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 glass-panel p-4 rounded-3xl border border-white/60">
          <input type="password" value={adminPwd} onChange={(e) => setAdminPwd(e.target.value)} placeholder="输入 Admin 密码" className={`px-4 py-2 bg-white/80 border rounded-2xl text-center text-sm font-bold focus:ring-2 outline-none transition-all shadow-inner`} />
          <div className="flex gap-2">
            <button onClick={() => adminPwd==='XCC6027@km' ? onAdminLogin() : alert('密码错误')} className="px-4 py-1.5 bg-slate-700 text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800">登录后台</button>
            <button onClick={() => setShowAdminInput(false)} className="px-4 py-1.5 bg-white text-slate-500 text-sm font-bold rounded-xl hover:bg-slate-50 shadow-sm">取消</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminView({ t, db, th }) {
  const formatDate = (iso) => { try { const d=new Date(iso); return isNaN(d.getTime())?iso:d.toLocaleString(); }catch{return iso;} };
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className={`text-2xl font-extrabold flex items-center gap-2 ${th.text}`}><Settings className="w-7 h-7" /> {t.adminPanel}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-[2rem] shadow-sm border-2 border-white/60">
          <h3 className="font-extrabold text-lg mb-4 text-slate-700">{t.roomList}</h3>
          <ul className="space-y-3">
            {Object.entries(db.rooms).map(([code, info]) => (
              <li key={code} className={`px-4 py-3 bg-white/70 rounded-2xl border ${th.border} flex flex-col shadow-sm`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-mono ${th.text} font-black text-xl`}>{code}</span>
                  <span className={`px-2 py-1 bg-white rounded-lg text-xs font-bold text-slate-500 border ${th.border}`}>
                    {db.roomData[code]?.students?.length || 0} 学生
                  </span>
                </div>
                <span className="text-sm text-slate-600 font-bold">老师: {info.owner}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-panel p-6 rounded-[2rem] shadow-sm border-2 border-white/60">
          <h3 className="font-extrabold text-lg mb-4 text-slate-700">{t.loginLogs}</h3>
          <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
            {db.logs.map((log) => (
              <li key={log.id} className="text-sm flex flex-col bg-white/70 p-3 rounded-2xl border border-white shadow-sm">
                <div className="flex justify-between mb-1">
                  <span className={`font-mono ${th.text} font-extrabold`}>{log.room}</span>
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

function TeacherDashboard({ t, data, th, updateData }) {
  const [activeTab, setActiveTab] = useState('students');

  const tabs = [
    { id: 'students', icon: Users, label: t.students },
    { id: 'subjects', icon: BookOpen, label: t.subjects },
    { id: 'homework', icon: Calendar, label: t.homework },
    { id: 'exams', icon: ClipboardList, label: t.exam },
    { id: 'analysis', icon: BarChart2, label: t.analysis },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-56 shrink-0 flex flex-row lg:flex-col gap-3 overflow-x-auto pb-2 lg:pb-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-5 py-4 rounded-[1.5rem] transition-all font-extrabold whitespace-nowrap shadow-sm border-2 ${
                isActive 
                  ? `${th.main} text-white ${th.shadow} border-transparent lg:translate-x-3 scale-105` 
                  : `glass-panel text-slate-600 hover:${th.text} hover:${th.light} border-white/60`
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="flex-1 glass-panel rounded-[2.5rem] shadow-xl border-2 border-white/60 min-h-[700px] overflow-hidden flex flex-col p-2 md:p-4">
        {activeTab === 'students' && <StudentsTab t={t} data={data} th={th} updateData={updateData} />}
        {activeTab === 'subjects' && <SubjectsTab t={t} data={data} th={th} updateData={updateData} />}
        {activeTab === 'homework' && <HomeworkTab t={t} data={data} th={th} updateData={updateData} />}
        {activeTab === 'exams' && <ExamsTab t={t} data={data} th={th} updateData={updateData} />}
        {activeTab === 'analysis' && <AnalysisTab t={t} data={data} th={th} updateData={updateData} />}
      </div>
    </div>
  );
}

function StudentsTab({ t, data, th, updateData }) {
  const [importText, setImportText] = useState('');
  const [importClass, setImportClass] = useState('1A');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  const removeStudent = (id) => updateData({ students: data.students.filter(s => s.id !== id) });

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <h2 className={`text-2xl font-black ${th.text} mb-6 flex items-center gap-2`}><Users/> {t.students}</h2>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="xl:col-span-2 overflow-y-auto bg-white/70 rounded-[2rem] border-2 border-white/80 shadow-inner relative">
          <table className="w-full text-left border-collapse">
            <thead className={`sticky top-0 ${th.tableHead} z-10 backdrop-blur-md`}>
              <tr>
                <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white/50">{t.className}</th>
                <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white/50">{t.studentId}</th>
                <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white/50">{t.malayName}</th>
                <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white/50">{t.chineseName}</th>
                <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white/50">{t.gender}</th>
                <th className="py-4 px-5 font-extrabold text-slate-700 border-b border-white/50">{t.action}</th>
              </tr>
            </thead>
            <tbody>
              {data.students.length === 0 && (
                <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-bold">{t.noData}</td></tr>
              )}
              {data.students.map(s => (
                <tr key={s.id} className={`border-b border-white/40 hover:${th.light} transition-colors group`}>
                  {editingId === s.id ? (
                    <td colSpan="6" className={`p-3 ${th.light}`}>
                      <div className="flex gap-2 items-center">
                        <input className="w-16 p-2 border-2 rounded-xl outline-none font-bold" value={editForm.className} onChange={e=>setEditForm({...editForm, className: e.target.value})} />
                        <input className="w-20 p-2 border-2 rounded-xl outline-none font-bold" value={editForm.stdId} onChange={e=>setEditForm({...editForm, stdId: e.target.value})} />
                        <input className="flex-1 p-2 border-2 rounded-xl outline-none font-bold" value={editForm.malayName} onChange={e=>setEditForm({...editForm, malayName: e.target.value})} />
                        <input className="flex-1 p-2 border-2 rounded-xl outline-none font-bold" value={editForm.chineseName} onChange={e=>setEditForm({...editForm, chineseName: e.target.value})} />
                        <input className="w-16 p-2 border-2 rounded-xl outline-none font-bold" value={editForm.gender} onChange={e=>setEditForm({...editForm, gender: e.target.value})} />
                        <button onClick={()=>{updateData({students:data.students.map(st=>st.id===editingId?editForm:st)});setEditingId(null);}} className="p-2 text-green-600 bg-green-100 hover:bg-green-200 rounded-xl font-bold">保存</button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className={`py-3 px-5 font-black ${th.text}`}>{s.className}</td>
                      <td className="py-3 px-5 font-mono text-sm font-bold text-slate-500">{s.stdId}</td>
                      <td className="py-3 px-5 font-bold text-slate-700">{s.malayName}</td>
                      <td className="py-3 px-5 font-bold text-slate-700">{s.chineseName}</td>
                      <td className="py-3 px-5 text-slate-500 font-bold">{s.gender}</td>
                      <td className="py-3 px-5 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {setEditingId(s.id); setEditForm({...s});}} className={`p-2 ${th.text} ${th.light} hover:${th.main} hover:text-white rounded-xl transition-colors`}><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => removeStudent(s.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`${th.light} p-6 rounded-[2rem] border-2 ${th.border} h-fit shadow-sm`}>
          <h3 className={`font-black ${th.text} mb-4 flex items-center gap-2`}><FileText className="w-5 h-5" /> {t.batchImport}</h3>
          <div className="mb-4">
            <label className={`block text-sm font-bold ${th.text} mb-2`}>{t.targetClass}</label>
            <input type="text" value={importClass} onChange={e => setImportClass(e.target.value)} className={`w-full px-4 py-3 bg-white/80 border-2 ${th.border} rounded-2xl outline-none ${th.ring} font-bold text-slate-700`} placeholder="例如: 1A" />
          </div>
          <p className={`text-xs ${th.text} opacity-80 mb-2 font-bold`}>{t.importDesc}</p>
          <p className={`text-xs font-mono font-bold text-slate-500 bg-white/80 p-3 rounded-xl border-2 ${th.border} mb-4 shadow-inner`}>A001, Ali bin Abu, 阿里, L</p>
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)} className={`w-full h-32 p-4 bg-white/80 border-2 ${th.border} rounded-2xl text-sm font-bold ${th.ring} outline-none mb-4 resize-none shadow-inner`} placeholder="在此处粘贴 Excel 内容..." />
          <button onClick={handleImport} className={`w-full ${th.main} text-white py-3.5 rounded-2xl font-black shadow-md ${th.shadow} ${th.hover} transition-all transform hover:scale-[1.02]`}>{t.importBtn}</button>
        </div>
      </div>
    </div>
  );
}

function SubjectsTab({ t, data, th, updateData }) {
  const [newSub, setNewSub] = useState('');
  const addSubject = () => { if (newSub.trim() && !data.subjects.includes(newSub.trim())) { updateData({ subjects: [...data.subjects, newSub.trim()] }); setNewSub(''); } };

  return (
    <div className="p-4 md:p-6 flex-1">
      <h2 className={`text-2xl font-black ${th.text} mb-8 flex items-center gap-2`}><BookOpen/> {t.subjects}</h2>
      <div className="flex gap-3 mb-10 max-w-md">
        <input type="text" value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder={t.subjectName} className={`flex-1 px-5 py-3 bg-white/80 border-2 border-white rounded-2xl outline-none ${th.ring} font-bold shadow-inner`} />
        <button onClick={addSubject} className={`${th.main} text-white px-6 py-3 rounded-2xl font-black ${th.hover} flex items-center gap-2 shadow-lg ${th.shadow} transition-all transform hover:scale-105`}><Plus className="w-5 h-5" /> 添加</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {data.subjects.map(sub => (
          <div key={sub} className={`bg-white/80 border-2 ${th.border} p-6 rounded-[2rem] flex justify-between items-center group shadow-sm hover:shadow-md transition-all hover:-translate-y-1`}>
            <span className={`font-black text-slate-700 text-xl`}>{sub}</span>
            <button onClick={() => updateData({ subjects: data.subjects.filter(s => s !== sub) })} className={`p-2.5 bg-red-50 rounded-xl text-red-400 hover:text-white hover:bg-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all font-bold`}>
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 状态配置：蓝色为非常优秀（计100），绿色达标（计80），黄色还可以（计60），红色不达标和灰色没有做（计0），黑色缺席（不计入总数）
const hwStatusConfig = [
  { color: 'blue', label: '非常优秀', bg: 'bg-blue-500 hover:bg-blue-600', text: 'text-white border-blue-600' },
  { color: 'green', label: '达标', bg: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-white border-emerald-600' },
  { color: 'yellow', label: '还可以', bg: 'bg-amber-400 hover:bg-amber-500', text: 'text-amber-900 border-amber-500' },
  { color: 'red', label: '不达标', bg: 'bg-rose-500 hover:bg-rose-600', text: 'text-white border-rose-600' },
  { color: 'black', label: '缺席', bg: 'bg-slate-800 hover:bg-slate-900', text: 'text-white border-slate-900' },
  { color: 'gray', label: '没有做', bg: 'bg-slate-200 hover:bg-slate-300', text: 'text-slate-600 border-slate-300' },
];

function StatTable({ title, columns, stats, th }) {
  const mTotal = columns.reduce((a, c) => a + (stats.male[c.key] || 0), 0);
  const fTotal = columns.reduce((a, c) => a + (stats.female[c.key] || 0), 0);
  return (
    <div className={`mt-6 bg-white/80 p-5 rounded-[2rem] border-2 ${th.border} shadow-sm shrink-0`}>
      <h3 className={`text-lg font-black ${th.text} mb-4`}>{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-sm font-bold">
          <thead>
            <tr className={`${th.tableHead} border-b-2 border-white`}>
              <th className="py-3 px-4 text-slate-700 text-left rounded-tl-xl">性别</th>
              {columns.map(col => <th key={col.key} className="py-3 px-3 text-slate-700">{col.label}</th>)}
              <th className={`py-3 px-4 ${th.text} rounded-tr-xl`}>合计</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b-2 border-white hover:bg-white/50">
              <td className="py-3 px-4 text-blue-600 text-left">男生 (L)</td>
              {columns.map(col => <td key={col.key} className="py-3 px-3 text-slate-600">{stats.male[col.key]}</td>)}
              <td className="py-3 px-4 text-blue-700">{mTotal}</td>
            </tr>
            <tr className="border-b-2 border-white hover:bg-white/50">
              <td className="py-3 px-4 text-pink-600 text-left">女生 (P)</td>
              {columns.map(col => <td key={col.key} className="py-3 px-3 text-slate-600">{stats.female[col.key]}</td>)}
              <td className="py-3 px-4 text-pink-700">{fTotal}</td>
            </tr>
            <tr className={`${th.light}`}>
              <td className="py-3 px-4 text-slate-800 text-left rounded-bl-xl">横向总计</td>
              {columns.map(col => <td key={col.key} className="py-3 px-3 text-slate-800">{stats.total[col.key]}</td>)}
              <td className={`py-3 px-4 ${th.text} text-lg rounded-br-xl`}>{mTotal + fTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HomeworkTab({ t, data, th, updateData }) {
  const [selTerm, setSelTerm] = useState(SEMESTERS[0]);
  const [selSub, setSelSub] = useState('');
  const [selClass, setSelClass] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);

  const classes = useMemo(() => Array.from(new Set(data.students.map(s => s.className))).sort(), [data.students]);
  const filteredStudents = useMemo(() => (!selClass ? data.students : data.students.filter(s => s.className === selClass)), [data.students, selClass]);
  const currentHwTitle = data.homeworkTitles?.[selTerm]?.[selSub]?.[dateStr] || '';

  const recordStatus = (studentId, statusColor) => {
    if (!selSub || !dateStr) return;
    const newHw = { ...data.homeworks };
    if (!newHw[selTerm]) newHw[selTerm] = {};
    if (!newHw[selTerm][selSub]) newHw[selTerm][selSub] = {};
    if (!newHw[selTerm][selSub][dateStr]) newHw[selTerm][selSub][dateStr] = {};
    if (newHw[selTerm][selSub][dateStr][studentId] === statusColor) delete newHw[selTerm][selSub][dateStr][studentId];
    else newHw[selTerm][selSub][dateStr][studentId] = statusColor;
    updateData({ homeworks: newHw });
  };

  const exportHwToExcel = () => {
    if (!selSub || !dateStr) return;
    let html = `<table><thead><tr><th>学期</th><th>班级</th><th>中文姓名</th><th>马来文姓名</th><th>功课状态 (${dateStr})</th></tr></thead><tbody>`;
    filteredStudents.forEach(s => {
      const st = data.homeworks?.[selTerm]?.[selSub]?.[dateStr]?.[s.id];
      const label = hwStatusConfig.find(sc => sc.color === st)?.label || '-';
      html += `<tr><td>${selTerm}</td><td>${s.className}</td><td>${s.chineseName}</td><td>${s.malayName}</td><td style="${getHwColorStyle(st)}">${label}</td></tr>`;
    });
    html += `</tbody></table>`;
    exportToXlsWithStyles(html, `${selTerm}_${selClass||'全班'}_${selSub}_功课`);
  };

  const hwCols = hwStatusConfig.map(sc => ({ key: sc.color, label: sc.label }));
  hwCols.push({ key: 'none', label: '无记录' });
  const hwStats = { male: {}, female: {}, total: {} };
  hwCols.forEach(c => { hwStats.male[c.key]=0; hwStats.female[c.key]=0; hwStats.total[c.key]=0; });

  if (selSub) {
    filteredStudents.forEach(s => {
      const st = data.homeworks?.[selTerm]?.[selSub]?.[dateStr]?.[s.id] || 'none';
      const g = (s.gender || '').toUpperCase();
      const isM = g.includes('男') || g==='M' || g==='L';
      const isF = g.includes('女') || g==='F' || g==='P';
      if (hwStats.total[st] !== undefined) {
         if (isM) hwStats.male[st]++; else if (isF) hwStats.female[st]++;
         hwStats.total[st]++;
      }
    });
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-col gap-4 mb-6 pb-6 border-b-2 border-white/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className={`text-2xl font-black ${th.text} flex items-center gap-2`}><Calendar/> {t.homework}</h2>
          <div className="flex flex-wrap gap-3">
            <select value={selTerm} onChange={e=>setSelTerm(e.target.value)} className={`px-4 py-2 ${th.main} text-white rounded-2xl font-black outline-none shadow-md cursor-pointer`}>{SEMESTERS.map(sm => <option key={sm} value={sm}>{sm}</option>)}</select>
            <select value={selClass} onChange={e=>setSelClass(e.target.value)} className="px-4 py-2 bg-white/80 rounded-2xl font-black text-slate-700 outline-none"><option value="">{t.allClasses}</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select value={selSub} onChange={e=>setSelSub(e.target.value)} className={`px-4 py-2 ${th.light} ${th.text} rounded-2xl font-black outline-none`}><option value="">-- {t.selectSubject} --</option>{data.subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
            <input type="date" value={dateStr} onChange={e=>setDateStr(e.target.value)} className="px-4 py-2 bg-white/80 rounded-2xl font-black text-slate-700 outline-none"/>
            {selSub && <button onClick={exportHwToExcel} className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-2xl font-black shadow-md hover:bg-emerald-600 transition-all transform hover:scale-105"><Download className="w-4 h-4" /> 导出彩色 Excel</button>}
          </div>
        </div>
        {selSub && (
          <div className={`w-full ${th.light} px-5 py-3.5 rounded-2xl border-2 ${th.border} flex items-center gap-3 shadow-inner`}>
            <PenTool className={`w-6 h-6 ${th.text}`} />
            <input type="text" value={currentHwTitle} onChange={e => {
                const newT = { ...(data.homeworkTitles || {}) };
                if (!newT[selTerm]) newT[selTerm] = {}; if (!newT[selTerm][selSub]) newT[selTerm][selSub] = {};
                newT[selTerm][selSub][dateStr] = e.target.value; updateData({ homeworkTitles: newT });
              }}
              placeholder="在这里填写今日功课标题 (例如: 单元一练习)..."
              className={`flex-1 bg-transparent border-none outline-none font-black ${th.text} placeholder-${th.text}/50 text-lg`}
            />
          </div>
        )}
      </div>

      {!selSub ? (
        <div className="flex-1 flex items-center justify-center border-4 border-dashed border-white/60 rounded-[3rem] bg-white/40"><p className="text-slate-400 font-black text-xl tracking-wider">🌸 请先在上方选择学科</p></div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto rounded-[2rem] border-2 border-white/80 bg-white/70 shadow-inner">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className={`sticky top-0 ${th.tableHead} z-10 backdrop-blur-md border-b-2 border-white`}>
                <tr>
                  <th className="py-4 px-5 font-black text-slate-700 w-24">{t.className}</th>
                  <th className="py-4 px-5 font-black text-slate-700 w-48">姓名</th>
                  <th className="py-4 px-5 font-black text-slate-700">状态 ({dateStr}) {currentHwTitle && <span className={`${th.text}`}> - {currentHwTitle}</span>}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => {
                  const currentStatus = data.homeworks?.[selTerm]?.[selSub]?.[dateStr]?.[s.id];
                  return (
                    <tr key={s.id} className="border-b-2 border-white/40 hover:bg-white/60 transition-colors">
                      <td className={`py-4 px-5 font-black ${th.text} text-lg`}>{s.className}</td>
                      <td className="py-4 px-5"><div className="font-black text-slate-800 text-lg">{s.chineseName}</div><div className="text-xs text-slate-500 font-bold">{s.malayName}</div></td>
                      <td className="py-4 px-5">
                        <div className="flex gap-2.5 flex-wrap">
                          {hwStatusConfig.map(sc => (
                            <button key={sc.color} onClick={() => recordStatus(s.id, sc.color)}
                              className={`px-4 py-2 rounded-2xl text-sm font-black border-2 transition-all transform active:scale-90 ${
                                currentStatus === sc.color ? `${sc.bg} ${sc.text} shadow-lg scale-105` : `bg-white/80 border-white text-slate-500 hover:${th.light}`
                              }`}
                            >
                              {sc.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <StatTable title={`📊 功课状态统计 (${selTerm} - ${dateStr})`} columns={hwCols} stats={hwStats} th={th} />
        </div>
      )}
    </div>
  );
}

function ExamsTab({ t, data, th, updateData }) {
  const [selTerm, setSelTerm] = useState(SEMESTERS[0]);
  const [selSub, setSelSub] = useState('');
  const [selClass, setSelClass] = useState('');
  const [selExamId, setSelExamId] = useState('');
  const [newExamName, setNewExamName] = useState('');
  const [newExamParts, setNewExamParts] = useState('');

  const classes = useMemo(() => Array.from(new Set(data.students.map(s => s.className))).sort(), [data.students]);
  const filteredStudents = useMemo(() => (!selClass ? data.students : data.students.filter(s => s.className === selClass)), [data.students, selClass]);

  const examsForSub = data.examsConfig?.[selTerm]?.[selSub] || [];
  const currentExam = examsForSub.find(e => e.id === selExamId);

  const createExam = () => {
    if(!selSub || !newExamName.trim() || !newExamParts.trim()) return;
    const parts = newExamParts.split(/[,，]/).map(p => p.trim()).filter(p => p);
    if(parts.length === 0) return;
    const newExam = { id: Date.now().toString(), name: newExamName.trim(), parts };
    const newConfig = { ...(data.examsConfig || {}) };
    if (!newConfig[selTerm]) newConfig[selTerm] = {};
    newConfig[selTerm][selSub] = [...(newConfig[selTerm][selSub] || []), newExam];
    updateData({ examsConfig: newConfig });
    setNewExamName(''); setNewExamParts(''); setSelExamId(newExam.id);
  };

  const updateVal = (sId, field, valStr) => {
    const val = parseFloat(valStr) || 0;
    const newR = { ...data.examRecords };
    if(!newR[selTerm]) newR[selTerm] = {}; if(!newR[selTerm][selSub]) newR[selTerm][selSub] = {}; if(!newR[selTerm][selSub][currentExam.id]) newR[selTerm][selSub][currentExam.id] = {};
    const rec = newR[selTerm][selSub][currentExam.id][sId] || { parts: Array(currentExam.parts.length).fill(0), deduct: 0 };
    if(field==='deduct') rec.deduct = val; else rec.parts[field] = val;
    newR[selTerm][selSub][currentExam.id][sId] = rec;
    updateData({ examRecords: newR });
  };

  const getGradeInfo = (rec) => {
    if(!rec) return { raw: 0, pct: 0, grade: '-', color: 'text-slate-400' };
    const raw = Math.max(0, (rec.parts||[]).reduce((a,b)=>a+b,0) - (rec.deduct||0));
    const pct = Math.min(100, raw * 2);
    let grade = 'F', color = 'text-red-500 font-black';
    if(pct>=82){grade='A'; color='text-green-500 font-black';} else if(pct>=66){grade='B'; color='text-yellow-500 font-black';} else if(pct>=50){grade='C'; color='text-yellow-500 font-black';} else if(pct>=35){grade='D'; color='text-yellow-500 font-black';} else if(pct>=20){grade='E'; color='text-yellow-500 font-black';}
    return { raw, pct, grade, color };
  };

  const exportExamsToExcel = () => {
    if (!selSub || !currentExam) return;
    let html = `<table><thead><tr><th>学期</th><th>班级</th><th>姓名</th>${currentExam.parts.map(p=>`<th>${p}</th>`).join('')}<th>扣分</th><th>/50</th><th>/100</th><th>等级</th></tr></thead><tbody>`;
    filteredStudents.forEach(s => {
      const rec = data.examRecords?.[selTerm]?.[selSub]?.[currentExam.id]?.[s.id];
      const info = getGradeInfo(rec);
      const parts = rec?.parts || Array(currentExam.parts.length).fill(0);
      html += `<tr><td>${selTerm}</td><td>${s.className}</td><td>${s.chineseName}</td>${parts.map(p=>`<td>${p}</td>`).join('')}<td>${rec?.deduct||0}</td><td>${info.raw}</td><td>${info.pct}%</td><td style="${getGradeColorStyle(info.grade)}">${info.grade}</td></tr>`;
    });
    html += `</tbody></table>`;
    exportToXlsWithStyles(html, `${selTerm}_${selClass||'全班'}_${selSub}_${currentExam.name}`);
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6 pb-6 border-b-2 border-white/60">
        <h2 className={`text-2xl font-black ${th.text} flex items-center gap-2`}><ClipboardList/> {t.exam}</h2>
        <div className="flex flex-wrap gap-3">
          <select value={selTerm} onChange={e=>setSelTerm(e.target.value)} className={`px-4 py-2 ${th.main} text-white rounded-2xl font-black outline-none shadow-md cursor-pointer`}>{SEMESTERS.map(sm => <option key={sm} value={sm}>{sm}</option>)}</select>
          <select value={selClass} onChange={e=>setSelClass(e.target.value)} className="px-4 py-2 bg-white/80 rounded-2xl font-black text-slate-700 outline-none"><option value="">{t.allClasses}</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <select value={selSub} onChange={e=>{setSelSub(e.target.value); setSelExamId('');}} className={`px-4 py-2 ${th.light} ${th.text} rounded-2xl font-black outline-none`}><option value="">-- {t.selectSubject} --</option>{data.subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
          {selSub && (
            <select value={selExamId} onChange={e=>setSelExamId(e.target.value)} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-2xl font-black outline-none"><option value="">-- 选择考试 --</option>{examsForSub.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          )}
          {currentExam && <button onClick={exportExamsToExcel} className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-2xl font-black shadow-md hover:bg-emerald-600 transition-all transform hover:scale-105"><Download className="w-4 h-4" /> 导出彩色</button>}
        </div>
      </div>

      {!selSub ? (
        <div className="flex-1 flex items-center justify-center border-4 border-dashed border-white/60 rounded-[3rem] bg-white/40"><p className="text-slate-400 font-black text-xl tracking-wider">🌸 请先在上方选择科目和考试</p></div>
      ) : !currentExam ? (
        <div className="bg-white/80 p-8 border-2 border-white rounded-[2.5rem] shadow-lg max-w-xl mx-auto mt-10 backdrop-blur-md">
          <h3 className={`text-xl font-black ${th.text} mb-6 flex items-center gap-2`}><Plus className="w-6 h-6"/> 添加新考试配置</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-black text-slate-700 mb-2">考试类型 (如: 年中考)</label><input type="text" value={newExamName} onChange={e=>setNewExamName(e.target.value)} className={`w-full p-4 border-2 border-white rounded-2xl outline-none ${th.ring} font-bold shadow-inner`} /></div>
            <div><label className="block text-sm font-black text-slate-700 mb-2">包含的部分 (逗号分隔, 如: 甲组, 乙组)</label><input type="text" value={newExamParts} onChange={e=>setNewExamParts(e.target.value)} className={`w-full p-4 border-2 border-white rounded-2xl outline-none ${th.ring} font-bold shadow-inner`} /></div>
            <button onClick={createExam} className={`w-full py-4 mt-2 ${th.main} text-white rounded-2xl font-black shadow-lg ${th.hover} transform transition-all hover:scale-[1.02]`}>创建配置</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto rounded-[2rem] border-2 border-white/80 bg-white/70 shadow-inner">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className={`sticky top-0 ${th.tableHead} z-10 backdrop-blur-md border-b-2 border-white`}>
                <tr>
                  <th className="py-4 px-5 font-black text-slate-700">{t.className}</th>
                  <th className="py-4 px-5 font-black text-slate-700">姓名</th>
                  {currentExam.parts.map((p,i)=><th key={i} className={`py-4 px-2 font-black ${th.text} text-center`}>{p}</th>)}
                  <th className="py-4 px-2 font-black text-rose-600 text-center">{t.deduction}</th>
                  <th className="py-4 px-2 font-black text-slate-800 text-center">/50</th>
                  <th className="py-4 px-2 font-black text-slate-800 text-center">/100</th>
                  <th className="py-4 px-4 font-black text-slate-800 text-center">TP 等级</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => {
                  const rec = data.examRecords?.[selTerm]?.[selSub]?.[currentExam.id]?.[s.id] || {};
                  const info = getGradeInfo(rec);
                  const safeParts = rec.parts || Array(currentExam.parts.length).fill(0);
                  return (
                    <tr key={s.id} className="border-b-2 border-white/40 hover:bg-white/60 transition-colors">
                      <td className={`py-3 px-5 font-black ${th.text}`}>{s.className}</td>
                      <td className="py-3 px-5"><div className="font-black text-slate-800">{s.chineseName}</div><div className="text-xs text-slate-500 font-bold">{s.malayName}</div></td>
                      {currentExam.parts.map((p,i) => (
                        <td key={i} className="py-3 px-2 text-center"><input type="number" min="0" value={safeParts[i]||''} onChange={(e)=>updateVal(s.id, i, e.target.value)} className={`w-16 p-2 rounded-xl text-center font-black ${th.text} shadow-inner outline-none ${th.ring}`} placeholder="0"/></td>
                      ))}
                      <td className="py-3 px-2 text-center"><input type="number" min="0" value={rec.deduct||''} onChange={(e)=>updateVal(s.id, 'deduct', e.target.value)} className="w-16 p-2 rounded-xl text-center font-black text-rose-600 shadow-inner outline-none focus:ring-2 focus:ring-rose-400 bg-rose-50" placeholder="-0"/></td>
                      <td className="py-3 px-2 text-center font-mono font-black text-lg text-slate-600">{info.raw}</td>
                      <td className="py-3 px-2 text-center font-mono font-black text-xl text-slate-800 bg-white/50">{info.pct}%</td>
                      <td className={`py-3 px-4 text-center text-2xl ${info.color}`}>{info.grade}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisTab({ t, data, th, updateData }) {
  const [selTerm, setSelTerm] = useState(SEMESTERS[0]);
  const [selSub, setSelSub] = useState('');
  const [selClass, setSelClass] = useState('');

  const classes = useMemo(() => Array.from(new Set(data.students.map(s => s.className))).sort(), [data.students]);
  const classFilteredStudents = useMemo(() => (!selClass ? data.students : data.students.filter(s => s.className === selClass)), [data.students, selClass]);

  const getTermSummary = (term, subject, studentId) => {
    const hws = data.homeworks?.[term]?.[subject] || {};
    let bl=0, g=0, y=0, r=0, b=0, gr=0, hwScore=0, hwCount=0;
    
    // 全新的功课积分与权重算法
    Object.values(hws).forEach(day => {
      const st = day[studentId];
      if(st) {
         if(st === 'blue') { bl++; hwCount++; hwScore += 100; }
         else if(st === 'green') { g++; hwCount++; hwScore += 80; }
         else if(st === 'yellow') { y++; hwCount++; hwScore += 60; }
         else if(st === 'red') { r++; hwCount++; hwScore += 0; }
         else if(st === 'gray') { gr++; hwCount++; hwScore += 0; }
         else if(st === 'black') { b++; } // 缺席完全不计入表现基数
      }
    });
    const hwPct = hwCount > 0 ? Math.round(hwScore / hwCount) : null;
    const hwTP = hwPct !== null ? (hwPct>=82?6:hwPct>=66?5:hwPct>=50?4:hwPct>=35?3:hwPct>=20?2:1) : null;

    let parts = [];
    if(bl>0) parts.push(`优:${bl}`);
    if(g>0) parts.push(`达标:${g}`);
    if(y>0) parts.push(`尚可:${y}`);
    if(r>0) parts.push(`未达:${r}`);
    if(b>0) parts.push(`缺席:${b}`);
    if(gr>0) parts.push(`没做:${gr}`);

    const hwNode = hwCount === 0 ? <span className="text-slate-400 font-bold">无记录</span> : (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
           <span className={`px-3 py-1 rounded-xl text-xs font-black shadow-sm ${tpColorStyles[hwTP]}`}>TP {hwTP}</span>
           <span className="text-sm font-black text-slate-500">{hwPct}%</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black bg-white/60 p-2 rounded-xl shadow-inner border border-white">
          {bl > 0 && <span className="text-blue-600">优:{bl}</span>}
          {g > 0 && <span className="text-emerald-600">达标:{g}</span>}
          {y > 0 && <span className="text-amber-600">尚可:{y}</span>}
          {r > 0 && <span className="text-rose-500">未达:{r}</span>}
          {b > 0 && <span className="text-slate-600">缺席:{b}</span>}
          {gr > 0 && <span className="text-slate-400">没做:{gr}</span>}
        </div>
      </div>
    );

    const exams = data.examsConfig?.[term]?.[subject] || [];
    let exScore = 0, exCount = 0;
    exams.forEach(ex => {
      const rec = data.examRecords?.[term]?.[subject]?.[ex.id]?.[studentId];
      if(rec) {
        const sum = (rec.parts||[]).reduce((a,v)=>a+v,0);
        if(sum > 0 || rec.deduct > 0) { exScore += Math.min(100, Math.max(0, sum - (rec.deduct||0)) * 2); exCount++; }
      }
    });
    const exPct = exCount > 0 ? Math.round(exScore / exCount) : null;

    let prevTerm = term === '第二学期' ? '第一学期' : term === '第三学期' ? '第二学期' : null;
    const prevTP = prevTerm ? Number(data.finalTPs?.[subject]?.[prevTerm]?.[studentId]) || null : null;

    // 动态权重: 功课50%, 考试30%, 上学期TP 20%
    let totalWeight = 0, totalScore = 0;
    if (hwPct !== null) { totalWeight += 0.5; totalScore += hwPct * 0.5; }
    if (exPct !== null) { totalWeight += 0.3; totalScore += exPct * 0.3; }
    if (prevTP !== null) { totalWeight += 0.2; totalScore += ({6:95,5:80,4:65,3:50,2:30,1:15}[prevTP]||0) * 0.2; }

    let overallPct = totalWeight > 0 ? Math.round(totalScore / totalWeight) : null;
    const suggestedTP = overallPct !== null ? (overallPct>=82?6:overallPct>=66?5:overallPct>=50?4:overallPct>=35?3:overallPct>=20?2:1) : null;

    return { hasData: totalWeight > 0, hwPct, exPct, overallPct, suggestedTP, prevTPText: prevTP ? `TP${prevTP}` : '-', hwText: hwCount>0 ? `TP${hwTP} (${hwPct}%) [${parts.join(',')}]` : '-', hwNode };
  };

  const studentsWithData = useMemo(() => {
    if (!selSub) return [];
    return classFilteredStudents.map(stu => {
      const summary = getTermSummary(selTerm, selSub, stu.id);
      if (!summary.hasData && !data.finalTPs?.[selSub]?.[selTerm]?.[stu.id]) return null;
      return { ...stu, summary };
    }).filter(Boolean);
  }, [classFilteredStudents, selSub, selTerm, data.examRecords, data.finalTPs, data.homeworks, data.examsConfig]);

  const exportAnalysisToExcel = () => {
    if (studentsWithData.length === 0) return;
    let html = `<table><thead><tr><th>班级</th><th>姓名</th><th>功课表现(50%)</th><th>考试平均(30%)</th><th>上学期TP(20%)</th><th>建议TP</th><th>第一学期最终TP</th><th>第二学期最终TP</th><th>第三学期最终TP</th></tr></thead><tbody>`;
    studentsWithData.forEach(s => {
      const suggText = s.summary.suggestedTP ? `TP${s.summary.suggestedTP} (${s.summary.overallPct}%)` : '-';
      html += `<tr><td>${s.className}</td><td>${s.chineseName}</td><td>${s.summary.hwText}</td><td>${s.summary.exPct||'-'}%</td><td>${s.summary.prevTPText}</td><td style="${getTpColorStyle(s.summary.suggestedTP)}">${suggText}</td>`;
      SEMESTERS.forEach(term => {
        const finalTP = data.finalTPs?.[selSub]?.[term]?.[s.id];
        html += `<td style="${getTpColorStyle(finalTP)}">${finalTP ? `TP${finalTP}` : '-'}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table>`;
    exportToXlsWithStyles(html, `${selTerm}_${selClass||'全班'}_${selSub}_TP综合`);
  };

  const tpCols = [6,5,4,3,2,1].map(tp => ({ key: tp.toString(), label: `TP ${tp}` }));
  const tpStats = { male: {}, female: {}, total: {} };
  tpCols.forEach(c => { tpStats.male[c.key]=0; tpStats.female[c.key]=0; tpStats.total[c.key]=0; });

  studentsWithData.forEach(s => {
     const activeTP = Number(data.finalTPs?.[selSub]?.[selTerm]?.[s.id]) || s.summary.suggestedTP;
     if (activeTP && tpStats.total[activeTP] !== undefined) {
        const isM = (s.gender||'').toUpperCase().match(/[男ML]/);
        if (isM) tpStats.male[activeTP]++; else tpStats.female[activeTP]++;
        tpStats.total[activeTP]++;
     }
  });

  return (
    <div className="p-4 md:p-6 flex-1 flex flex-col min-h-0">
      <div className="flex flex-wrap justify-between items-center mb-6 pb-6 border-b-2 border-white/60 gap-4 shrink-0">
        <h2 className={`text-2xl font-black ${th.text} flex items-center gap-2`}><BarChart2/> {t.compareByStudent}</h2>
        <div className="flex flex-wrap gap-3">
          <select value={selTerm} onChange={e=>setSelTerm(e.target.value)} className={`px-4 py-2 ${th.main} text-white rounded-2xl font-black outline-none shadow-md cursor-pointer`}>{SEMESTERS.map(sm => <option key={sm} value={sm}>{sm}</option>)}</select>
          <select value={selClass} onChange={e=>setSelClass(e.target.value)} className="px-4 py-2 bg-white/80 rounded-2xl font-black text-slate-700 outline-none"><option value="">{t.allClasses}</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <select value={selSub} onChange={e=>setSelSub(e.target.value)} className={`px-4 py-2 ${th.light} ${th.text} rounded-2xl font-black outline-none`}><option value="">-- {t.selectSubject} --</option>{data.subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
          {selSub && studentsWithData.length > 0 && <button onClick={exportAnalysisToExcel} className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-2xl font-black shadow-md hover:bg-emerald-600 transition-all transform hover:scale-105"><Download className="w-4 h-4" /> 导出彩色分析</button>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 bg-white/60 p-4 rounded-3xl border-2 border-white shadow-inner font-black shrink-0 justify-center">
        <div className="flex items-center gap-2 text-green-700"><div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>TP6 (A) & TP5 (B)</div>
        <div className="flex items-center gap-2 text-amber-700 ml-4"><div className="w-4 h-4 bg-amber-400 rounded-full shadow-sm"></div>TP4 (C) & TP3 (D)</div>
        <div className="flex items-center gap-2 text-rose-700 ml-4"><div className="w-4 h-4 bg-rose-500 rounded-full shadow-sm"></div>TP2 (E) & TP1 (F)</div>
      </div>

      {!selSub ? (
        <div className="flex-1 flex items-center justify-center border-4 border-dashed border-white/60 rounded-[3rem] bg-white/40"><p className="text-slate-400 font-black text-xl">🌸 请在上方选择学科生成系统报告</p></div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto rounded-[2rem] border-2 border-white/80 bg-white/70 shadow-inner">
            <table className="w-full text-left border-collapse min-w-[1300px]">
              <thead className={`sticky top-0 ${th.tableHead} z-10 backdrop-blur-md border-b-2 border-white`}>
                <tr>
                  <th className="py-4 px-5 font-black text-slate-700 w-24">{t.className}</th>
                  <th className="py-4 px-5 font-black text-slate-700 w-48">姓名</th>
                  <th className="py-4 px-5 font-black text-slate-700"><div className={`${th.text}`}>{selTerm}</div>功课累计 (50%)</th>
                  <th className="py-4 px-5 font-black text-slate-700 text-center w-32"><div className={`${th.text}`}>{selTerm}</div>考试平均 (30%)</th>
                  <th className="py-4 px-5 font-black text-slate-700 text-center w-36 bg-white/40"><div className={`${th.text}`}>{selTerm}</div>系统建议 TP<br/><span className="text-[10px] text-slate-500">*(含20%上学期)*</span></th>
                  {SEMESTERS.map(term => <th key={term} className={`py-4 px-3 font-black text-center w-36 border-l-2 border-white/60 ${term===selTerm?`${th.light} ${th.text}`:'text-slate-500'}`}>👨‍🏫 {term}<br/>最终核定</th>)}
                </tr>
              </thead>
              <tbody>
                {studentsWithData.map(s => {
                  const activeFinalTP = data.finalTPs?.[selSub]?.[selTerm]?.[s.id];
                  return (
                    <tr key={s.id} className={`border-b-2 border-white/40 transition-colors ${activeFinalTP ? `${th.light} bg-opacity-40` : 'hover:bg-white/60'}`}>
                      <td className={`py-4 px-5 font-black ${th.text} text-lg`}>{s.className}</td>
                      <td className="py-4 px-5"><div className="font-black text-slate-800 text-lg">{s.chineseName}</div><div className="text-xs text-slate-500 font-bold">{s.malayName}</div></td>
                      <td className="py-4 px-5">{s.summary.hwNode}</td>
                      <td className="py-4 px-5 text-center font-mono font-black text-xl text-slate-600">{s.summary.exPct !== null ? `${s.summary.exPct}%` : <span className="text-sm text-slate-400">-</span>}</td>
                      <td className="py-4 px-5 text-center bg-white/40">
                        {s.summary.suggestedTP ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`px-4 py-1.5 rounded-2xl font-black shadow-sm ${tpColorStyles[s.summary.suggestedTP]}`}>TP {s.summary.suggestedTP}</span>
                            <span className="text-[11px] text-slate-500 font-bold bg-white/80 px-2 py-1 rounded-xl shadow-inner">综合 {s.summary.overallPct}%</span>
                          </div>
                        ) : <span className="text-sm text-slate-400">-</span>}
                      </td>
                      {SEMESTERS.map(term => {
                        const termFinalTP = data.finalTPs?.[selSub]?.[term]?.[s.id] || '';
                        let sc = 'bg-white/80 border-white text-slate-500';
                        if(termFinalTP=='6'||termFinalTP=='5') sc = 'bg-green-500 text-white border-green-400 shadow-md';
                        if(termFinalTP=='4'||termFinalTP=='3') sc = 'bg-amber-400 text-white border-amber-300 shadow-md';
                        if(termFinalTP=='2'||termFinalTP=='1') sc = 'bg-rose-500 text-white border-rose-400 shadow-md';
                        return (
                          <td key={term} className={`py-4 px-3 text-center border-l-2 border-white/60 ${term===selTerm?th.light:''}`}>
                            <select
                              value={termFinalTP} onChange={(e)=>{
                                const newF={...(data.finalTPs||{})}; if(!newF[selSub])newF[selSub]={}; if(!newF[selSub][term])newF[selSub][term]={};
                                if(e.target.value==='') delete newF[selSub][term][s.id]; else newF[selSub][term][s.id]=e.target.value;
                                updateData({finalTPs:newF});
                              }}
                              className={`w-full px-2 py-3 border-2 rounded-2xl font-black text-sm outline-none cursor-pointer text-center transition-all ${sc}`}
                            >
                              <option value="" className="text-slate-800 bg-white">{term===selTerm?'自动建议':'未评'}</option>
                              <option value="6" className="text-green-700 bg-green-50">TP 6</option><option value="5" className="text-green-700 bg-green-50">TP 5</option>
                              <option value="4" className="text-amber-700 bg-amber-50">TP 4</option><option value="3" className="text-amber-700 bg-amber-50">TP 3</option>
                              <option value="2" className="text-rose-700 bg-rose-50">TP 2</option><option value="1" className="text-rose-700 bg-rose-50">TP 1</option>
                            </select>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <StatTable title={`🏆 【${selTerm}】最终核定 TP 分布`} columns={tpCols} stats={tpStats} th={th} />
        </div>
      )}
    </div>
  );
}
