import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, onSnapshot, addDoc } from "firebase/firestore";
import { 
  Users, BookOpen, PenTool, BarChart2, Settings, LogOut, 
  Globe, Plus, Trash2, FileText, CheckCircle, XCircle, Award,
  Edit2, Save, X, Calendar, ClipboardList, Loader2, Download
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

// ==========================================
// 2. 翻译与多语言
// ==========================================
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
    compareByStudent: '按学生分析',
    roomList: '房间列表 (所有者)',
    loginLogs: '登录日志',
    noData: '暂无数据',
  }
};

export default function App() {
  const [lang, setLang] = useState('zh');
  const t = translations[lang] || translations['zh'];

  const [authState, setAuthState] = useState('login');
  const [currentRoom, setCurrentRoom] = useState('');
  const [loadingDb, setLoadingDb] = useState(true);
  
  // 云端数据本地映射
  const [db, setDb] = useState({ rooms: {}, logs: [], roomData: {} });

  // 监听云端数据库
  useEffect(() => {
    // 监听所有房间
    const unsubRooms = onSnapshot(collection(firestoreDb, 'rooms'), (snapshot) => {
      const newRooms = {};
      const newRoomData = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        newRooms[docSnap.id] = { owner: data.owner };
        newRoomData[docSnap.id] = data.roomData || { students: [], subjects: [], homeworks: {}, examsConfig: {}, examRecords: {} };
      });
      setDb(prev => ({ ...prev, rooms: newRooms, roomData: newRoomData }));
      setLoadingDb(false);
    }, (error) => {
      console.error("Firebase read error (rooms):", error);
      setLoadingDb(false);
    });

    // 监听所有登录日志
    const unsubLogs = onSnapshot(collection(firestoreDb, 'logs'), (snapshot) => {
      const newLogs = [];
      snapshot.forEach(docSnap => newLogs.push({ id: docSnap.id, ...docSnap.data() }));
      // 客户端内存排序 (最新时间在前)
      newLogs.sort((a, b) => new Date(b.time) - new Date(a.time));
      setDb(prev => ({ ...prev, logs: newLogs }));
    }, (error) => {
      console.error("Firebase read error (logs):", error);
    });

    return () => { unsubRooms(); unsubLogs(); };
  }, []);

  const currentData = db.roomData[currentRoom] || { 
    students: [], subjects: [], homeworks: {}, examsConfig: {}, examRecords: {} 
  };

  const handleLogin = async (code, teacherName) => {
    if (!code) return;
    
    const roomRef = doc(firestoreDb, 'rooms', code);
    
    if (!db.rooms[code]) {
      if (!teacherName) return; // UI层面已经拦截了，这里做安全校验
      // 注册新房间并写入云端
      await setDoc(roomRef, {
        owner: teacherName,
        roomData: { students: [], subjects: [], homeworks: {}, examsConfig: {}, examRecords: {} }
      });
    }

    // 写入登录日志到云端
    await addDoc(collection(firestoreDb, 'logs'), {
      time: new Date().toISOString(),
      room: code,
      owner: db.rooms[code]?.owner || teacherName
    });
    
    setCurrentRoom(code);
    setAuthState('teacher');
  };

  const handleAdminLogin = () => {
    setAuthState('admin');
  };

  const updateRoomData = async (newData) => {
    const updatedData = { ...currentData, ...newData };
    
    // 1. 乐观更新 (本地立刻变，不等网络，体验更好)
    setDb(prev => ({
      ...prev,
      roomData: { ...prev.roomData, [currentRoom]: updatedData }
    }));

    // 2. 静默同步到 Firebase
    const roomRef = doc(firestoreDb, 'rooms', currentRoom);
    await setDoc(roomRef, { roomData: updatedData }, { merge: true });
  };

  if (loadingDb) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-700">正在连接 Firebase 云端...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <Award className="text-indigo-600 w-8 h-8" />
          <h1 className="text-xl font-bold text-slate-800">{t.systemName}</h1>
          {currentRoom && authState === 'teacher' && (
            <span className="ml-4 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              房号: {currentRoom} ({db.rooms[currentRoom]?.owner})
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {authState !== 'login' && (
            <button onClick={() => {setAuthState('login'); setCurrentRoom('');}} className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition px-3 py-1.5 rounded-lg hover:bg-red-50">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">{t.logout}</span>
            </button>
          )}
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-[1400px] mx-auto">
        {authState === 'login' && <LoginView t={t} db={db} onLogin={handleLogin} onAdminLogin={handleAdminLogin} />}
        {authState === 'admin' && <AdminView t={t} db={db} />}
        {authState === 'teacher' && (
          <TeacherDashboard t={t} data={currentData} updateData={updateRoomData} />
        )}
      </main>
    </div>
  );
}

function LoginView({ t, db, onLogin, onAdminLogin }) {
  const [code, setCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Admin 登录状态
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
      <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 w-full md:w-96 border border-slate-100">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Users className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-slate-800">{t.login}</h2>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">{t.roomCode}</label>
            <input 
              type="text" 
              value={code} 
              onChange={(e) => {setCode(e.target.value); setErrorMsg('');}}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              placeholder="输入房号进入或创建"
            />
          </div>
          
          {isNewRoom && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-emerald-600 mb-1.5">检测到新房号，{t.teacherName}</label>
              <input 
                type="text" 
                value={teacherName} 
                onChange={(e) => {setTeacherName(e.target.value); setErrorMsg('');}}
                className={`w-full px-4 py-2.5 bg-emerald-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all ${errorMsg ? 'border-red-400' : 'border-emerald-200'}`}
                placeholder="例如: 林老师 (Mr. Lim)"
              />
              {errorMsg && <p className="text-xs text-red-500 font-bold mt-2">{errorMsg}</p>}
            </div>
          )}

          <button 
            onClick={handleLoginSubmit}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-md shadow-indigo-200 mt-2"
          >
            {isNewRoom ? t.createRoom : t.enterRoom}
          </button>
        </div>
      </div>
      
      {/* Admin 登录入口与输入框 */}
      {!showAdminInput ? (
        <button 
          onClick={() => setShowAdminInput(true)}
          className="mt-16 text-[10px] text-slate-300 hover:text-slate-500 transition-colors tracking-widest uppercase"
        >
          admin
        </button>
      ) : (
        <div className="mt-12 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <input
            type="password"
            value={adminPwd}
            onChange={(e) => {setAdminPwd(e.target.value); setAdminErrorMsg('');}}
            placeholder="输入 Admin 密码"
            className={`px-4 py-2 bg-white border rounded-xl text-center text-sm font-medium focus:ring-2 focus:ring-slate-400 outline-none transition-all shadow-sm ${adminErrorMsg ? 'border-red-400' : 'border-slate-200'}`}
          />
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
  // 格式化 ISO 日期
  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return isNaN(d.getTime()) ? isoString : d.toLocaleString();
    } catch { return isoString; }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
        <Settings className="w-6 h-6" /> {t.adminPanel}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4 text-slate-700">{t.roomList}</h3>
          <ul className="space-y-3">
            {Object.entries(db.rooms).map(([code, info]) => (
              <li key={code} className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-indigo-600 font-bold text-lg">{code}</span>
                  <span className="px-2 py-1 bg-white rounded text-xs font-medium text-slate-500 border">
                    {db.roomData[code]?.students?.length || 0} 学生
                  </span>
                </div>
                <span className="text-sm text-slate-600 font-medium">老师: {info.owner}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4 text-slate-700">{t.loginLogs}</h3>
          <div className="max-h-[500px] overflow-y-auto pr-2">
            <ul className="space-y-3">
              {db.logs.map((log) => (
                <li key={log.id} className="text-sm flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-indigo-600 font-bold">{log.room}</span>
                    <span className="text-xs text-slate-400">{formatDate(log.time)}</span>
                  </div>
                  <span className="text-slate-600">登入者: {log.owner}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// 底部统一分析表格组件
function StatTable({ title, columns, stats }) {
  return (
    <div className="mt-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
      <h3 className="text-md font-bold text-slate-800 mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-2 px-4 font-bold text-slate-600 border-r border-slate-200">性别</th>
              {columns.map(col => <th key={col.key} className="py-2 px-3 font-bold text-slate-600">{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-2 px-4 font-bold text-blue-600 border-r border-slate-100">男生</td>
              {columns.map(col => <td key={col.key} className="py-2 px-3 text-slate-700">{stats.male[col.key]}</td>)}
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-2 px-4 font-bold text-pink-600 border-r border-slate-100">女生</td>
              {columns.map(col => <td key={col.key} className="py-2 px-3 text-slate-700">{stats.female[col.key]}</td>)}
            </tr>
            <tr className="bg-slate-50">
              <td className="py-2 px-4 font-extrabold text-slate-800 border-r border-slate-200">总计</td>
              {columns.map(col => <td key={col.key} className="py-2 px-3 font-bold text-slate-800">{stats.total[col.key]}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeacherDashboard({ t, data, updateData }) {
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
      <div className="w-full lg:w-56 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold whitespace-nowrap ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 translate-x-0 lg:translate-x-2' 
                  : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[700px] overflow-hidden flex flex-col">
        {activeTab === 'students' && <StudentsTab t={t} data={data} updateData={updateData} />}
        {activeTab === 'subjects' && <SubjectsTab t={t} data={data} updateData={updateData} />}
        {activeTab === 'homework' && <HomeworkTab t={t} data={data} updateData={updateData} />}
        {activeTab === 'exams' && <ExamsTab t={t} data={data} updateData={updateData} />}
        {activeTab === 'analysis' && <AnalysisTab t={t} data={data} />}
      </div>
    </div>
  );
}

function StudentsTab({ t, data, updateData }) {
  const [importText, setImportText] = useState('');
  const [importClass, setImportClass] = useState('1A');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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
    updateData({
      students: data.students.map(s => s.id === editingId ? editForm : s)
    });
    setEditingId(null);
  };

  return (
    <div className="p-6 md:p-8 h-full flex flex-col">
      <h2 className="text-2xl font-extrabold text-slate-800 mb-8">{t.students}</h2>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 min-h-0">
        <div className="xl:col-span-2 overflow-y-auto border border-slate-200 rounded-2xl bg-white relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
              <tr>
                <th className="py-4 px-4 font-bold text-slate-600 border-b">{t.className}</th>
                <th className="py-4 px-4 font-bold text-slate-600 border-b">{t.studentId}</th>
                <th className="py-4 px-4 font-bold text-slate-600 border-b">{t.malayName}</th>
                <th className="py-4 px-4 font-bold text-slate-600 border-b">{t.chineseName}</th>
                <th className="py-4 px-4 font-bold text-slate-600 border-b">{t.gender}</th>
                <th className="py-4 px-4 font-bold text-slate-600 border-b">{t.action}</th>
              </tr>
            </thead>
            <tbody>
              {data.students.length === 0 && (
                <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-medium">{t.noData}</td></tr>
              )}
              {data.students.map(s => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-indigo-50/50 transition-colors group">
                  {editingId === s.id ? (
                    <td colSpan="6" className="p-3 bg-indigo-50/50">
                      <div className="flex gap-2 items-center">
                        <input className="w-16 p-2 border rounded" value={editForm.className} onChange={e=>setEditForm({...editForm, className: e.target.value})} />
                        <input className="w-20 p-2 border rounded" value={editForm.stdId} onChange={e=>setEditForm({...editForm, stdId: e.target.value})} />
                        <input className="flex-1 p-2 border rounded" value={editForm.malayName} onChange={e=>setEditForm({...editForm, malayName: e.target.value})} />
                        <input className="flex-1 p-2 border rounded" value={editForm.chineseName} onChange={e=>setEditForm({...editForm, chineseName: e.target.value})} />
                        <input className="w-16 p-2 border rounded" value={editForm.gender} onChange={e=>setEditForm({...editForm, gender: e.target.value})} />
                        <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-100 rounded-lg"><Save className="w-5 h-5"/></button>
                        <button onClick={()=>setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5"/></button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="py-3 px-4 font-bold text-indigo-600">{s.className}</td>
                      <td className="py-3 px-4 font-mono text-sm text-slate-500">{s.stdId}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{s.malayName}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{s.chineseName}</td>
                      <td className="py-3 px-4 text-slate-500">{s.gender}</td>
                      <td className="py-3 px-4 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(s)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-md">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeStudent(s.id)} 
                          className={`p-1.5 rounded-md text-sm font-bold transition-all ${confirmDeleteId === s.id ? 'bg-red-500 text-white px-3' : 'text-slate-400 hover:text-red-600 hover:bg-red-100'}`}
                        >
                          {confirmDeleteId === s.id ? "确认删除?" : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 h-fit">
          <h3 className="font-bold text-indigo-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t.batchImport}
          </h3>
          <div className="mb-4">
            <label className="block text-sm font-bold text-indigo-700 mb-1">{t.targetClass}</label>
            <input 
              type="text" 
              value={importClass}
              onChange={e => setImportClass(e.target.value)}
              className="w-full px-3 py-2 border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
              placeholder="e.g. 1A, 2B"
            />
          </div>
          <p className="text-xs text-indigo-600/70 mb-2 font-medium">{t.importDesc}</p>
          <p className="text-xs font-mono text-slate-500 bg-white p-2 rounded border border-indigo-100 mb-4">
            A001, Ali bin Abu, 阿里, 男<br/>A002, Siti Nurhaliza, 茜蒂, 女
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full h-40 p-3 border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-4 resize-none shadow-inner"
            placeholder="在此处粘贴 Excel 内容..."
          />
          <button 
            onClick={handleImport}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all"
          >
            {t.importBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubjectsTab({ t, data, updateData }) {
  const [newSub, setNewSub] = useState('');

  const addSubject = () => {
    if (newSub.trim() && !data.subjects.includes(newSub.trim())) {
      updateData({ subjects: [...data.subjects, newSub.trim()] });
      setNewSub('');
    }
  };

  const removeSubject = (sub) => {
    updateData({ subjects: data.subjects.filter(s => s !== sub) });
  };

  return (
    <div className="p-6 md:p-8 flex-1">
      <h2 className="text-2xl font-extrabold text-slate-800 mb-8">{t.subjects}</h2>
      
      <div className="flex gap-3 mb-10 max-w-md">
        <input 
          type="text" 
          value={newSub}
          onChange={(e) => setNewSub(e.target.value)}
          placeholder={t.subjectName}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        />
        <button onClick={addSubject} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 transition-all">
          <Plus className="w-5 h-5" /> 添加
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.subjects.map(sub => (
          <div key={sub} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 p-5 rounded-2xl flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
            <span className="font-bold text-slate-700 text-lg">{sub}</span>
            <button onClick={() => removeSubject(sub)} className="p-2 bg-white rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeworkTab({ t, data, updateData }) {
  const [selSub, setSelSub] = useState('');
  const [selClass, setSelClass] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);

  const classes = useMemo(() => {
    const cls = new Set(data.students.map(s => s.className));
    return Array.from(cls).sort();
  }, [data.students]);

  const filteredStudents = useMemo(() => {
    if(!selClass) return data.students;
    return data.students.filter(s => s.className === selClass);
  }, [data.students, selClass]);

  const recordStatus = (studentId, statusColor) => {
    if (!selSub || !dateStr) return;
    const newHw = { ...data.homeworks };
    if (!newHw[selSub]) newHw[selSub] = {};
    if (!newHw[selSub][dateStr]) newHw[selSub][dateStr] = {};
    
    // 如果点击同一个状态，则清除（实现删除功能）
    if (newHw[selSub][dateStr][studentId] === statusColor) {
      delete newHw[selSub][dateStr][studentId];
    } else {
      newHw[selSub][dateStr][studentId] = statusColor;
    }
    
    updateData({ homeworks: newHw });
  };

  const statusConfig = [
    { color: 'green', label: t.hwGreen, bg: 'bg-green-500 hover:bg-green-600', text: 'text-white' },
    { color: 'yellow', label: t.hwYellow, bg: 'bg-yellow-400 hover:bg-yellow-500', text: 'text-yellow-900' },
    { color: 'red', label: t.hwRed, bg: 'bg-red-500 hover:bg-red-600', text: 'text-white' },
    { color: 'black', label: t.hwBlack, bg: 'bg-slate-800 hover:bg-slate-900', text: 'text-white' },
    { color: 'gray', label: t.hwGray, bg: 'bg-slate-200 hover:bg-slate-300', text: 'text-slate-600' },
  ];

  // 功课导出功能
  const exportHomeworkToCSV = () => {
    if (!selSub || !dateStr) return;
    const headers = ['班级', '中文姓名', '马来文姓名', `功课状态 (${dateStr})`];
    const rows = filteredStudents.map(s => {
      const st = data.homeworks[selSub]?.[dateStr]?.[s.id];
      const label = statusConfig.find(sc => sc.color === st)?.label || '-';
      return [s.className, s.chineseName, s.malayName, label].map(val => `"${val}"`).join(',');
    });
    
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const fileNameClass = selClass || '所有班级';
    link.setAttribute('download', `${fileNameClass}_${selSub}_${dateStr}_功课.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 底部统计计算
  const hwCols = statusConfig.map(sc => ({ key: sc.color, label: sc.label }));
  hwCols.push({ key: 'none', label: '无记录' });

  const hwStats = { male: {}, female: {}, total: {} };
  hwCols.forEach(c => { hwStats.male[c.key]=0; hwStats.female[c.key]=0; hwStats.total[c.key]=0; });

  if (selSub) {
    filteredStudents.forEach(s => {
      const st = data.homeworks[selSub]?.[dateStr]?.[s.id] || 'none';
      const isM = s.gender.includes('男') || s.gender.toLowerCase() === 'm';
      const isF = s.gender.includes('女') || s.gender.toLowerCase() === 'f';

      if (hwStats.total[st] !== undefined) {
         if (isM) hwStats.male[st]++;
         else if (isF) hwStats.female[st]++;
         hwStats.total[st]++;
      }
    });
  }

  return (
    <div className="p-6 md:p-8 h-full flex flex-col">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-8 border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">{t.homework}</h2>
        <div className="flex flex-wrap gap-3">
          <select value={selClass} onChange={e=>setSelClass(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none">
            <option value="">{t.allClasses}</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={selSub} onChange={e=>setSelSub(e.target.value)} className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-700 outline-none">
            <option value="">-- {t.selectSubject} --</option>
            {data.subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={dateStr} onChange={e=>setDateStr(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"/>
          
          {selSub && (
            <button 
              onClick={exportHomeworkToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all ml-2"
            >
              <Download className="w-4 h-4" /> 导出 Excel
            </button>
          )}
        </div>
      </div>

      {!selSub ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
          <p className="text-slate-400 font-bold text-lg">请先在右上角选择科目和日期</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 bg-white z-10 shadow-sm border-b border-slate-200">
                <tr>
                  <th className="py-4 px-4 font-bold text-slate-600 bg-slate-50">{t.className}</th>
                  <th className="py-4 px-4 font-bold text-slate-600 bg-slate-50">{t.chineseName} ({t.malayName})</th>
                  <th className="py-4 px-4 font-bold text-slate-600 bg-slate-50">当前选择日期状态 ({dateStr})</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => {
                  const currentStatus = data.homeworks[selSub]?.[dateStr]?.[s.id];
                  return (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-indigo-600">{s.className}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{s.chineseName}</div>
                        <div className="text-xs text-slate-500 font-medium">{s.malayName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {statusConfig.map(sc => (
                            <button
                              key={sc.color}
                              onClick={() => recordStatus(s.id, sc.color)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${
                                currentStatus === sc.color 
                                  ? `${sc.bg} ${sc.text} shadow-md border-transparent scale-105` 
                                  : `bg-white border-slate-200 text-slate-400 hover:border-slate-300`
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
          
          {/* 底部统计表格 */}
          <StatTable title={`功课状态统计 (${dateStr})`} columns={hwCols} stats={hwStats} />
        </div>
      )}
    </div>
  );
}

function ExamsTab({ t, data, updateData }) {
  const [selSub, setSelSub] = useState('');
  const [selClass, setSelClass] = useState('');
  const [selExamId, setSelExamId] = useState('');
  
  const [newExamName, setNewExamName] = useState('');
  const [newExamParts, setNewExamParts] = useState('');
  
  const [confirmDeleteExam, setConfirmDeleteExam] = useState(false);

  const classes = useMemo(() => Array.from(new Set(data.students.map(s => s.className))).sort(), [data.students]);
  const filteredStudents = useMemo(() => (!selClass ? data.students : data.students.filter(s => s.className === selClass)), [data.students, selClass]);

  const examsForSub = data.examsConfig[selSub] || [];
  const currentExam = examsForSub.find(e => e.id === selExamId);

  const createExam = () => {
    if(!selSub || !newExamName.trim() || !newExamParts.trim()) return;
    const parts = newExamParts.split(/[,，]/).map(p => p.trim()).filter(p => p);
    if(parts.length === 0) return;

    const newExam = { id: Date.now().toString(), name: newExamName.trim(), parts };
    const newConfig = { ...data.examsConfig };
    newConfig[selSub] = [...(newConfig[selSub] || []), newExam];
    
    updateData({ examsConfig: newConfig });
    setNewExamName('');
    setNewExamParts('');
    setSelExamId(newExam.id);
  };

  // 删除当前选择的考试
  const deleteCurrentExam = () => {
    if (confirmDeleteExam) {
      const newConfig = { ...data.examsConfig };
      newConfig[selSub] = newConfig[selSub].filter(e => e.id !== selExamId);
      
      const newRecords = { ...data.examRecords };
      if (newRecords[selSub]) {
        delete newRecords[selSub][currentExam.id];
      }
      
      updateData({ examsConfig: newConfig, examRecords: newRecords });
      setSelExamId('');
      setConfirmDeleteExam(false);
    } else {
      setConfirmDeleteExam(true);
      setTimeout(() => setConfirmDeleteExam(false), 3000);
    }
  };

  const updateScore = (studentId, partIndex, valStr) => {
    if(!selSub || !currentExam) return;
    const val = parseFloat(valStr) || 0;
    
    const newRecords = { ...data.examRecords };
    if(!newRecords[selSub]) newRecords[selSub] = {};
    if(!newRecords[selSub][currentExam.id]) newRecords[selSub][currentExam.id] = {};
    
    const studentRec = newRecords[selSub][currentExam.id][studentId] || { parts: Array(currentExam.parts.length).fill(0), deduct: 0 };
    studentRec.parts[partIndex] = val;
    
    newRecords[selSub][currentExam.id][studentId] = studentRec;
    updateData({ examRecords: newRecords });
  };

  const updateDeduct = (studentId, valStr) => {
    if(!selSub || !currentExam) return;
    const val = parseFloat(valStr) || 0;
    
    const newRecords = { ...data.examRecords };
    if(!newRecords[selSub]) newRecords[selSub] = {};
    if(!newRecords[selSub][currentExam.id]) newRecords[selSub][currentExam.id] = {};
    
    const studentRec = newRecords[selSub][currentExam.id][studentId] || { parts: Array(currentExam.parts.length).fill(0), deduct: 0 };
    studentRec.deduct = val;
    
    newRecords[selSub][currentExam.id][studentId] = studentRec;
    updateData({ examRecords: newRecords });
  };

  const getGradeInfo = (rec) => {
    if(!rec) return { raw: 0, pct: 0, grade: '-', color: 'text-slate-400' };
    const sum = rec.parts.reduce((a,b)=>a+b, 0);
    const raw = Math.max(0, sum - rec.deduct);
    const pct = Math.min(100, raw * 2);
    
    let grade = 'F';
    let color = 'text-red-500 font-extrabold';
    if(pct >= 82) { grade = 'A'; color = 'text-emerald-500 font-extrabold'; }
    else if(pct >= 66) { grade = 'B'; color = 'text-blue-500 font-extrabold'; }
    else if(pct >= 50) { grade = 'C'; color = 'text-yellow-600 font-extrabold'; }
    else if(pct >= 35) { grade = 'D'; color = 'text-orange-500 font-bold'; }
    else if(pct >= 20) { grade = 'E'; color = 'text-red-400 font-bold'; }

    return { raw, pct, grade, color };
  };

  // 导出为 CSV 功能
  const exportToCSV = () => {
    if (!selSub || !currentExam) return;

    // 1. 准备表头
    const headers = ['班级', '中文姓名', '马来文姓名', ...currentExam.parts, '扣错字分', '总分(/50)', '百分比(/100)', '等级'];

    // 2. 准备数据行
    const rows = filteredStudents.map(s => {
      const rec = data.examRecords[selSub]?.[currentExam.id]?.[s.id] || { parts: Array(currentExam.parts.length).fill(0), deduct: 0 };
      const gradeInfo = getGradeInfo(rec);

      // 将每一列数据用引号包裹，防止名字里带逗号破坏格式
      return [
        s.className,
        s.chineseName,
        s.malayName,
        ...rec.parts,
        rec.deduct,
        gradeInfo.raw,
        `${gradeInfo.pct}%`,
        gradeInfo.grade
      ].map(val => `"${val}"`).join(',');
    });

    // 3. 组合并添加 UTF-8 BOM 签名（防止 Excel 中文乱码）
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    
    // 4. 创建文件并触发下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // 生成文件名 (例如: 4M_华文_年中考_成绩.csv)
    const fileNameClass = selClass || '所有班级';
    link.setAttribute('download', `${fileNameClass}_${selSub}_${currentExam.name}_成绩.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 底部成绩统计计算
  const examCols = [
    { key: 'A', label: 'A' }, { key: 'B', label: 'B' }, { key: 'C', label: 'C' },
    { key: 'D', label: 'D' }, { key: 'E', label: 'E' }, { key: 'F', label: 'F' }
  ];
  const gradeStats = { male: {}, female: {}, total: {} };
  examCols.forEach(c => { gradeStats.male[c.key]=0; gradeStats.female[c.key]=0; gradeStats.total[c.key]=0; });

  if (selSub && currentExam) {
    filteredStudents.forEach(s => {
      const rec = data.examRecords[selSub]?.[currentExam.id]?.[s.id];
      const info = getGradeInfo(rec);
      if (info && info.grade !== '-') {
        const isM = s.gender.includes('男') || s.gender.toLowerCase() === 'm';
        const isF = s.gender.includes('女') || s.gender.toLowerCase() === 'f';
        if (gradeStats.total[info.grade] !== undefined) {
           if (isM) gradeStats.male[info.grade]++;
           else if (isF) gradeStats.female[info.grade]++;
           gradeStats.total[info.grade]++;
        }
      }
    });
  }

  return (
    <div className="p-6 md:p-8 h-full flex flex-col">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-8 border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">{t.exam}</h2>
        <div className="flex flex-wrap gap-3">
          <select value={selClass} onChange={e=>setSelClass(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none">
            <option value="">{t.allClasses}</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={selSub} onChange={e=>{setSelSub(e.target.value); setSelExamId('');}} className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-700 outline-none">
            <option value="">-- {t.selectSubject} --</option>
            {data.subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {selSub && (
            <select value={selExamId} onChange={e=>setSelExamId(e.target.value)} className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl font-bold text-rose-700 outline-none">
              <option value="">-- 选择考试 --</option>
              {examsForSub.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          )}
          {currentExam && (
            <div className="flex gap-2 ml-2">
              <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all"
              >
                <Download className="w-4 h-4" /> 导出 Excel
              </button>
              <button 
                onClick={deleteCurrentExam}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${confirmDeleteExam ? 'bg-red-600 text-white shadow-md shadow-red-200' : 'bg-white text-red-500 border border-red-200 hover:bg-red-50'}`}
              >
                <Trash2 className="w-4 h-4" /> {confirmDeleteExam ? '确认删除?' : '删除考试'}
              </button>
            </div>
          )}
        </div>
      </div>

      {!selSub ? (
         <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
           <p className="text-slate-400 font-bold text-lg">请先选择科目进行管理</p>
         </div>
      ) : !currentExam ? (
        <div className="bg-white p-8 border border-slate-200 rounded-3xl shadow-sm max-w-xl mx-auto mt-10">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Plus className="w-6 h-6 text-indigo-500"/> {t.addExam}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t.examType}</label>
              <input type="text" value={newExamName} onChange={e=>setNewExamName(e.target.value)} placeholder="如: 年中考、大考" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"/>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t.examParts}</label>
              <input type="text" value={newExamParts} onChange={e=>setNewExamParts(e.target.value)} placeholder="如: 甲组, 乙组, 丙组 (逗号分隔)" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"/>
              <p className="text-xs text-slate-400 mt-2">提示：系统会自动增加一个“扣错字分”的栏位，并将各部分总分减去扣分后，乘以2换算为100分制。</p>
            </div>
            <button onClick={createExam} className="w-full py-3 mt-4 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700">创建新考试配置</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-inner">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-10 shadow-sm border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="py-4 px-4 font-bold text-slate-600 border-r border-slate-200 w-32">{t.className}</th>
                  <th className="py-4 px-4 font-bold text-slate-600 border-r border-slate-200 w-48">姓名</th>
                  {currentExam.parts.map((pName, i) => (
                    <th key={i} className="py-4 px-2 font-bold text-indigo-700 bg-indigo-50/50 text-center text-sm">{pName}</th>
                  ))}
                  <th className="py-4 px-2 font-bold text-rose-700 bg-rose-50/50 text-center text-sm">{t.deduction}</th>
                  <th className="py-4 px-3 font-bold text-slate-800 text-center bg-slate-100">{t.total50}</th>
                  <th className="py-4 px-3 font-bold text-slate-800 text-center bg-slate-200">{t.total100}</th>
                  <th className="py-4 px-4 font-bold text-slate-800 text-center">{t.grade}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => {
                  const rec = data.examRecords[selSub]?.[currentExam.id]?.[s.id] || { parts: Array(currentExam.parts.length).fill(0), deduct: 0 };
                  const gradeInfo = getGradeInfo(data.examRecords[selSub]?.[currentExam.id]?.[s.id]);
                  
                  return (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-4 font-bold text-indigo-600 border-r border-slate-100">{s.className}</td>
                      <td className="py-2 px-4 border-r border-slate-100">
                        <div className="font-bold text-slate-800 truncate">{s.chineseName}</div>
                        <div className="text-xs text-slate-500 font-medium truncate w-40">{s.malayName}</div>
                      </td>
                      {currentExam.parts.map((pName, i) => (
                        <td key={i} className="py-2 px-1 text-center">
                          <input 
                            type="number" min="0"
                            value={rec.parts[i] === 0 ? '' : rec.parts[i]} 
                            onChange={(e)=>updateScore(s.id, i, e.target.value)}
                            className="w-16 px-2 py-1.5 border border-indigo-100 rounded bg-white text-center font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-1 text-center bg-rose-50/30">
                        <input 
                          type="number" min="0"
                          value={rec.deduct === 0 ? '' : rec.deduct} 
                          onChange={(e)=>updateDeduct(s.id, e.target.value)}
                          className="w-16 px-2 py-1.5 border border-rose-200 rounded bg-white text-center font-bold text-rose-700 focus:ring-2 focus:ring-rose-500 outline-none"
                          placeholder="-0"
                        />
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-600 bg-slate-50">
                        {gradeInfo.raw}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-lg bg-slate-100">
                        {gradeInfo.pct}%
                      </td>
                      <td className={`py-2 px-4 text-center text-xl ${gradeInfo.color}`}>
                        {gradeInfo.grade}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 底部统计表格 */}
          <StatTable title={`${currentExam.name} - 成绩统计`} columns={examCols} stats={gradeStats} />
        </div>
      )}
    </div>
  );
}

function AnalysisTab({ t, data }) {
  const [selClass, setSelClass] = useState('');
  const classes = useMemo(() => Array.from(new Set(data.students.map(s => s.className))).sort(), [data.students]);
  const filteredStudents = useMemo(() => (!selClass ? data.students : data.students.filter(s => s.className === selClass)), [data.students, selClass]);

  const calcSubjectTP = (subject, studentId) => {
    const exams = data.examsConfig[subject] || [];
    if (exams.length === 0) return 0;

    let totalPct = 0;
    let validExams = 0;

    exams.forEach(ex => {
      const rec = data.examRecords[subject]?.[ex.id]?.[studentId];
      if (rec) {
        const sum = rec.parts.reduce((a,b)=>a+b, 0);
        const raw = Math.max(0, sum - rec.deduct);
        const pct = Math.min(100, raw * 2);
        totalPct += pct;
        validExams++;
      }
    });

    if (validExams === 0) return 0;
    const avgPct = totalPct / validExams;

    if(avgPct >= 82) return 6;
    if(avgPct >= 66) return 5;
    if(avgPct >= 50) return 4;
    if(avgPct >= 35) return 3;
    if(avgPct >= 20) return 2;
    return 1;
  };

  const tpColors = {
    1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500',
    4: 'bg-green-500', 5: 'bg-blue-500', 6: 'bg-indigo-600', 0: 'bg-slate-200'
  };

  // 核心改动：自动过滤出“有输入数据的学生”以及“有数据的科目”
  const studentsWithData = useMemo(() => {
    return filteredStudents.map(stu => {
      // 找出这个学生所有有成绩 (TP > 0) 的科目
      const activeSubjects = data.subjects.map(sub => {
        return { subName: sub, tp: calcSubjectTP(sub, stu.id) };
      }).filter(item => item.tp > 0);

      // 将有成绩的科目附加到学生对象上
      return { ...stu, activeSubjects };
    }).filter(stu => stu.activeSubjects.length > 0); // 如果学生没有任何科目的成绩，就不显示该学生
  }, [filteredStudents, data.subjects, data.examsConfig, data.examRecords]);

  // 导出分析页面的 Excel 数据
  const exportAnalysisToCSV = () => {
    if (studentsWithData.length === 0) return;
    
    // 表头：包含动态的所有科目名称
    const headers = ['班级', '中文姓名', '马来文姓名', ...data.subjects];
    
    const rows = studentsWithData.map(s => {
      const row = [s.className, s.chineseName, s.malayName];
      // 对应每个科目的位置，如果有成绩填 TP，没成绩填 -
      data.subjects.forEach(sub => {
        const found = s.activeSubjects.find(as => as.subName === sub);
        row.push(found && found.tp > 0 ? `TP${found.tp}` : '-');
      });
      return row.map(val => `"${val}"`).join(',');
    });

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    link.setAttribute('download', `${selClass || '所有班级'}_TP评级分析.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 底部 TP 统计计算
  const tpCols = [6,5,4,3,2,1].map(tp => ({ key: tp, label: `TP${tp}` }));
  const tpStats = { male: {}, female: {}, total: {} };
  tpCols.forEach(c => { tpStats.male[c.key]=0; tpStats.female[c.key]=0; tpStats.total[c.key]=0; });

  studentsWithData.forEach(s => {
     const isM = s.gender.includes('男') || s.gender.toLowerCase() === 'm';
     const isF = s.gender.includes('女') || s.gender.toLowerCase() === 'f';

     s.activeSubjects.forEach(sub => {
        if (tpStats.total[sub.tp] !== undefined) {
           if (isM) tpStats.male[sub.tp]++;
           else if (isF) tpStats.female[sub.tp]++;
           tpStats.total[sub.tp]++;
        }
     });
  });

  return (
    <div className="p-6 md:p-8 flex-1 flex flex-col min-h-0">
      <div className="flex flex-wrap justify-between items-center mb-8 border-b border-slate-100 pb-6 gap-4 shrink-0">
        <h2 className="text-2xl font-extrabold text-slate-800">{t.compareByStudent} (TP评级)</h2>
        <div className="flex gap-3">
          <select value={selClass} onChange={e=>setSelClass(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none">
            <option value="">{t.allClasses}</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {studentsWithData.length > 0 && (
            <button 
              onClick={exportAnalysisToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all"
            >
              <Download className="w-4 h-4" /> 导出 Excel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold shrink-0">
        <div className="flex items-center gap-2 text-slate-700"><div className="w-3 h-3 bg-red-500 rounded-full"></div>TP1 (F)</div>
        <div className="flex items-center gap-2 text-slate-700"><div className="w-3 h-3 bg-orange-500 rounded-full"></div>TP2 (E)</div>
        <div className="flex items-center gap-2 text-slate-700"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div>TP3 (D)</div>
        <div className="flex items-center gap-2 text-slate-700"><div className="w-3 h-3 bg-green-500 rounded-full"></div>TP4 (C)</div>
        <div className="flex items-center gap-2 text-slate-700"><div className="w-3 h-3 bg-blue-500 rounded-full"></div>TP5 (B)</div>
        <div className="flex items-center gap-2 text-slate-700"><div className="w-3 h-3 bg-indigo-600 rounded-full"></div>TP6 (A)</div>
      </div>

      {studentsWithData.length === 0 ? (
        <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 p-16">
          <p className="text-slate-400 font-bold text-lg">当前过滤条件下没有有效的 TP 评级数据</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-auto content-start pb-4">
            {studentsWithData.map(stu => (
              <div key={stu.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800">{stu.chineseName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{stu.malayName}</p>
                  </div>
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold border border-indigo-100">{stu.className}</span>
                </div>
                
                <div className="space-y-4">
                  {/* 仅循环渲染此学生拥有 TP 分数的有效科目 */}
                  {stu.activeSubjects.map(({subName, tp}) => {
                    const widthPct = (tp / 6) * 100;
                    return (
                      <div key={subName} className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-slate-600">{subName}</span>
                          <span className="text-slate-800">{`TP${tp}`}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${tpColors[tp]} transition-all duration-1000 ease-out`}
                            style={{ width: `${widthPct}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 底部统计表格 */}
          <StatTable title="TP 评级分布统计 (按累计获得人次)" columns={tpCols} stats={tpStats} />
        </>
      )}
    </div>
  );
}
