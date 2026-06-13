import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Activity, Settings, ChevronDown, ChevronRight, LogOut, Shield, User as UserIcon, Menu, X, Lock, Edit, PartyPopper, Upload, Moon, Sun, Eye, EyeOff, AlertTriangle, Plus, KeyRound, Laptop, CalendarDays, ClipboardList, Briefcase, CheckCircle2, Clock, AlertOctagon, Link as LinkIcon, ExternalLink, PlusCircle, Trash2, History, FileText, MessageSquare, BellRing, Check, Play, PauseCircle, FolderOpen, ChevronLeft, PanelLeftClose, Palette, Download, ShieldAlert, MessageCircle, ThumbsUp, ThumbsDown
} from 'lucide-react';

const ROLES = {
  TSS: { id: 'TSS', name: 'TechSupp Supervisor', isAdmin: true },
  LOL: { id: 'LOL', name: 'Live Operator Lead', isAdmin: true },
  LOT: { id: 'LOT', name: 'Live Operator Trainer', isAdmin: true },
  POC: { id: 'POC', name: 'Point of Contact', isAdmin: true },
  LO:  { id: 'LO',  name: 'Live Operator', isAdmin: false },
};

const INITIAL_USERS = [
  { id: 1, username: 'admin', password: '123', fullName: 'System Administrator', birthday: '1990-01-01', roleId: 'TSS', roleName: 'TechSupp Supervisor', isAdmin: true, status: 'Active', theme: 'light', profilePic: null, mustChangePassword: false, assignedBrands: [], handledLOs: [] },
  { id: 2, username: 'Than', password: '123', fullName: 'Jonathan Banton', birthday: '1997-12-16', roleId: 'LOT', roleName: 'Live Operator Trainer', isAdmin: true, status: 'Active', theme: 'light', profilePic: null, mustChangePassword: false, assignedBrands: [], handledLOs: [] },
  { id: 3, username: 'Fred', password: '123', fullName: 'John Rick Dacillo', birthday: '1996-08-24', roleId: 'LO', roleName: 'Live Operator', isAdmin: false, status: 'Active', theme: 'light', profilePic: null, mustChangePassword: false, assignedBrands: [], handledLOs: [] },
  { id: 4, username: 'Rey', password: '123', fullName: 'John Rey Velasco', birthday: '1998-03-12', roleId: 'LO', roleName: 'Live Operator', isAdmin: false, status: 'Active', theme: 'light', profilePic: null, mustChangePassword: false, assignedBrands: [], handledLOs: [] }
];

const INITIAL_BRANDS = [
  { id: 1, name: 'Colgate', contractStatus: 'Active', currentStatus: 'Active', logs: [], campaigns: [] }
];

const INITIAL_MCN_SETTINGS = {
  companies: [
    { id: 1, name: 'MCOM', color: '#F97316' }, 
    { id: 2, name: 'STARTOK', color: '#8B5CF6' }, 
    { id: 3, name: 'SYNC', color: '#000000' } 
  ],
  platforms: [
    { id: 1, name: 'Tiktok' },
    { id: 2, name: 'Shopee' }
  ],
  venues: [
    { id: 1, name: 'Pantry' },
    { id: 2, name: 'Conference' }
  ]
};

const INITIAL_CALLOUT_SETTINGS = {
  roles: ['Executive', 'Supervisor', 'Account Manager', 'Account Lead', 'Quality Assurance', 'Live Host Trainer', 'Live Operator Lead'],
  reporters: [] 
};

const getPHTToday = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })).toLocaleDateString('en-CA');
};

const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'square'; osc.frequency.setValueAtTime(600, ctx.currentTime); 
    gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5); 
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch(e) { console.error("Beep blocked", e); }
};

const getAggregatedStatus = (logs) => {
  let hasIssue = false; let hasPending = false;
  logs.forEach(l => {
    if (l.status === 'Issue') hasIssue = true;
    if (l.status === 'Pending') hasPending = true;
    l.tasks?.forEach(t => {
      if (!t.completed) {
        if (t.status === 'Issue') hasIssue = true;
        if (t.status === 'Pending') hasPending = true;
      }
    });
  });
  if (hasIssue) return 'Issue';
  if (hasPending) return 'Pending';
  return 'Active'; 
};

const getDayOfWeek = (dateString) => {
  if (!dateString) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateString);
  return isNaN(d) ? '' : days[d.getDay()];
};

const ConfirmModal = ({ confirm, onClose, t }) => {
  if (!confirm) return null;
  const theme = t || { card: 'bg-white', text: 'text-slate-800', border: 'border-slate-200', muted: 'text-slate-500' };
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[999999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className={`${theme.card} ${theme.text} rounded-xl shadow-xl max-w-sm w-full p-6 border ${theme.border} animate-in fade-in zoom-in duration-200`}>
        <div className="flex items-center gap-3 mb-4 text-amber-500"><AlertTriangle size={24} /><h3 className="text-lg font-bold">{confirm.title}</h3></div>
        <p className={`mb-6 text-sm ${theme.muted}`}>{confirm.message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium border ${theme.border} hover:bg-slate-500/10 transition-colors`}>Cancel</button>
          <button onClick={() => { confirm.action(); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Proceed</button>
        </div>
      </div>
    </div>
  );
};

const PasswordInput = ({ value, onChange, className, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} required value={value} onChange={onChange} className={className} placeholder={placeholder} />
      <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

const StatusPill = ({ status, size='sm' }) => {
  const map = {
    'Active': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    'Pending': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    'Issue': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    'Done': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    'Task': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    'Confirmed': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
    'Cancelled': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
    'Disputed': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    'Rejected': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    'Accepted': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  };
  return <span className={`border rounded uppercase font-bold flex items-center gap-1 w-fit ${size==='sm'?'px-2 py-0.5 text-[10px]':'px-3 py-1 text-xs'} ${map[status] || map.Active}`}>{status}</span>;
};

const PwdBadge = ({ p, t }) => {
  const [s, setS] = useState(false);
  return (
    <span onClick={()=>setS(!s)} className={`cursor-pointer flex items-center gap-1 font-mono ${t?.bg || 'bg-slate-50 dark:bg-slate-800'} px-1.5 py-0.5 rounded text-[10px] border ${t?.border || 'border-slate-200'} hover:opacity-80 transition-opacity`}>
      {s ? p : '••••••'} {s ? <EyeOff size={10}/> : <Eye size={10}/>}
    </span>
  );
};

const ForcePasswordChange = ({ user, users, setUsers, setCurrentUser }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault(); setError('');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    if (newPassword === user.password) return setError('New password must be different from the default password.');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters long.');
    const updatedUser = { ...user, password: newPassword, mustChangePassword: false };
    setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md"><div className="flex justify-center text-blue-600"><KeyRound size={48} strokeWidth={2.5} /></div><h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">Security Setup</h2><p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">For your safety, please change your default password before continuing.</p></div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-700">
          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2"><AlertTriangle size={18} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
              <div className="mt-1 relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div><PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="appearance-none block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm transition-colors" placeholder="Enter new password" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
              <div className="mt-1 relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div><PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="appearance-none block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm transition-colors" placeholder="Re-enter new password" /></div>
            </div>
            <div><button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Update Password & Continue</button></div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Login = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault(); setError('');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      if (user.status === 'Terminated') setError('Sorry, this account has been terminated and cannot log in.');
      else onLogin(user);
    } else { setError('Invalid username or password.'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md"><div className="flex justify-center text-blue-600"><Laptop size={48} strokeWidth={2.5} /></div><h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">LiveOps Hub</h2><p className="mt-2 text-center text-sm text-slate-600">Sign in to access the system</p></div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2"><AlertTriangle size={18} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
              <div className="mt-1 relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-5 w-5 text-slate-400" /></div><input id="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 sm:text-sm transition-colors text-slate-900" placeholder="Enter your username" /></div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div><input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 sm:text-sm transition-colors text-slate-900" placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            </div>
            <div><button type="submit" className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Sign in to LiveOps Hub</button></div>
          </form>
        </div>
      </div>
    </div>
  );
};

const BlankView = ({ title, user, t }) => {
  const isSuspended = user.status === 'Suspended';
  return (
    <div className={`p-6 h-full flex flex-col ${t.text}`}>
      <div className={`mb-6 flex justify-between items-center pb-4 border-b ${t.border}`}><h1 className="text-2xl font-bold">{title}</h1></div>
      <div className={`flex-1 ${t.card} rounded-xl border ${t.border} shadow-sm flex flex-col items-center justify-center p-8 text-center border-dashed`}>
        <div className={`w-16 h-16 ${user.theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-400'} rounded-full flex items-center justify-center mb-4`}><Laptop size={24} /></div>
        <h3 className="text-lg font-medium mb-1">Coming Soon</h3>
        <p className={`${t.muted} max-w-sm mb-6`}>The {title} module is currently empty and pending implementation.</p>
        <div className={`px-4 py-3 rounded-lg text-sm w-full max-w-md flex items-start gap-3 ${isSuspended ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400' : (user.isAdmin ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400')} border`}>
          {isSuspended ? <Lock size={20} className="shrink-0 mt-0.5" /> : (user.isAdmin ? <Shield size={20} className="shrink-0 mt-0.5" /> : <UserIcon size={20} className="shrink-0 mt-0.5" />)}
          <div className="text-left">
            <span className="font-semibold block">{isSuspended ? 'Account Suspended (View Only)' : (user.isAdmin ? 'Admin Access Granted' : 'Standard Access')}</span>
            {isSuspended ? 'Your account is suspended. You can view but not modify data.' : `As a ${user.roleName}, you have appropriate access to the system.`}
          </div>
        </div>
      </div>
    </div>
  );
};

const GeneralSettingsView = ({ user, users, setUsers, setCurrentUser, t }) => {
  const [f, setF] = useState({ ...user });
  const [msg, setMsg] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const handlePic = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setF({ ...f, profilePic: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const triggerSave = (e) => {
    e.preventDefault();
    setConfirm({ title: 'Save Profile Changes', message: 'Are you sure you want to update your account details? This will immediately apply your settings.', action: () => save() });
  };

  const save = () => {
    if (users.some(u => u.username === f.username && u.id !== user.id)) return setMsg({ err: true, txt: 'The username is already taken by another account.' });
    const updatedUser = { ...user, ...f };
    setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setMsg({ err: false, txt: 'Profile updated successfully!' });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className={`p-6 h-full flex flex-col ${t.text} animate-in fade-in duration-300`}>
      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} t={t} />
      <div className={`mb-6 pb-4 border-b ${t.border}`}><h1 className="text-2xl font-bold">General Settings</h1><p className={`text-sm ${t.muted} mt-1`}>Manage your personal account details and preferences.</p></div>

      <div className={`max-w-2xl ${t.card} rounded-xl border ${t.border} shadow-sm p-6`}>
        {msg && <div className={`mb-6 px-4 py-3 rounded-lg text-sm border ${msg.err ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'}`}>{msg.txt}</div>}
        
        <form className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              {f.profilePic ? <img src={f.profilePic} alt="Profile" className="h-20 w-20 rounded-full object-cover border-2 border-blue-500 shadow-sm" /> : <div className={`h-20 w-20 rounded-full ${user.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'} flex items-center justify-center text-2xl font-bold text-blue-500 shadow-sm`}>{f.username.charAt(0).toUpperCase()}</div>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Profile Picture</label>
              <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 ${user.theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white hover:bg-slate-50'} border ${t.border} rounded-lg text-sm font-medium transition-colors shadow-sm`}>
                <Upload size={16} /> Upload New Image
                <input type="file" accept="image/*" onChange={handlePic} className="hidden" />
              </label>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${t.border} ${user.theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <label className="block text-sm font-semibold mb-3">App Theme Preference</label>
            <div className="grid grid-cols-2 gap-3">
              {[ { id: 'light', icon: Sun }, { id: 'dark', icon: Moon } ].map(th => (
                <button key={th.id} type="button" onClick={() => setF({...f, theme: th.id})} className={`py-3 px-2 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${f.theme === th.id ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-400' : `${t.card} ${t.border} hover:border-slate-400`}`}><th.icon size={20} className={f.theme === th.id ? 'text-blue-600 dark:text-blue-400' : t.muted} /><span className="text-sm font-medium capitalize">{th.id} Mode</span></button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div><label className={`block text-xs font-semibold ${t.muted} mb-1 uppercase tracking-wider`}>Full Name</label><input required value={f.fullName} onChange={e=>setF({...f, fullName: e.target.value})} className={`w-full px-3 py-2 rounded-lg outline-none transition-shadow ${t.input} border focus:ring-2 focus:ring-blue-500`} /></div>
            <div><label className={`block text-xs font-semibold ${t.muted} mb-1 uppercase tracking-wider`}>Birthday</label><input required type="date" value={f.birthday} onChange={e=>setF({...f, birthday: e.target.value})} className={`w-full px-3 py-2 rounded-lg outline-none transition-shadow ${t.input} border focus:ring-2 focus:ring-blue-500`} /></div>
            <div><label className={`block text-xs font-semibold ${t.muted} mb-1 uppercase tracking-wider`}>Username</label><input required value={f.username} onChange={e=>setF({...f, username: e.target.value})} className={`w-full px-3 py-2 rounded-lg outline-none transition-shadow ${t.input} border focus:ring-2 focus:ring-blue-500`} /></div>
            <div><label className={`block text-xs font-semibold ${t.muted} mb-1 uppercase tracking-wider`}>Password</label><PasswordInput value={f.password} onChange={e=>setF({...f, password: e.target.value})} className={`w-full px-3 pr-10 py-2 rounded-lg outline-none transition-shadow ${t.input} border focus:ring-2 focus:ring-blue-500`} /></div>
          </div>

          <div className={`pt-4 border-t ${t.border}`}><button type="button" onClick={triggerSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">Save Changes</button></div>
        </form>
      </div>
    </div>
  );
};

const TSPSettingsView = ({ brands, setBrands, t }) => {
  const [newBrand, setNewBrand] = useState('');
  const [editBrandId, setEditBrandId] = useState(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [confirm, setConfirm] = useState(null);

  const handleAddBrand = (e) => {
    e.preventDefault();
    if (!newBrand.trim()) return;
    if (brands.some(b => b.name.toLowerCase() === newBrand.trim().toLowerCase())) return setConfirm({ title: 'Notice', message: 'Brand already exists!', action: () => {} });
    setBrands([{ id: Date.now(), name: newBrand.trim(), contractStatus: 'Active', currentStatus: 'Active', logs: [], campaigns: [] }, ...brands]);
    setNewBrand('');
  };

  const saveEdit = () => {
    if (!editBrandName.trim()) return;
    if (brands.some(b => b.id !== editBrandId && b.name.toLowerCase() === editBrandName.trim().toLowerCase())) return setConfirm({ title: 'Notice', message: 'Another brand with this name exists!', action: () => {} });
    setBrands(brands.map(b => b.id === editBrandId ? { ...b, name: editBrandName.trim() } : b));
    setEditBrandId(null);
  };

  const toggleContract = (id, currentStatus, name) => {
    const newStatus = currentStatus === 'Active' ? 'End Contract' : 'Active';
    setConfirm({ title: 'Update Contract Status', message: `Change ${name}'s contract status to "${newStatus}"?`, action: () => setBrands(brands.map(b => b.id === id ? { ...b, contractStatus: newStatus } : b)) });
  };

  const deleteBrand = (id, name) => {
    setConfirm({ title: 'Delete Brand', message: `Permanently delete "${name}" and all logs? This cannot be undone.`, action: () => setBrands(brands.filter(b => b.id !== id)) });
  };

  return (
    <div className={`p-6 h-full flex flex-col ${t.text} animate-in fade-in duration-300`}>
      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} t={t} />
      <div className={`mb-6 pb-4 border-b ${t.border}`}><h1 className="text-2xl font-bold">TSP Settings</h1><p className={`text-sm ${t.muted} mt-1`}>Manage TikTok Shop Partner brands.</p></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`md:col-span-1 ${t.card} rounded-xl border ${t.border} shadow-sm p-6 h-fit`}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><PlusCircle size={20} className="text-blue-600" /> Add New Brand</h2>
          <form onSubmit={handleAddBrand}>
            <label className={`block text-xs font-semibold ${t.muted} mb-1 uppercase tracking-wider`}>Brand Name</label>
            <input required placeholder="Enter brand name..." value={newBrand} onChange={e=>setNewBrand(e.target.value)} className={`w-full px-3 py-2 mb-4 rounded-lg outline-none transition-shadow ${t.input} border focus:border-blue-500`} />
            <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">Add Brand</button>
          </form>
        </div>

        <div className={`md:col-span-2 ${t.card} rounded-xl border ${t.border} shadow-sm p-6 flex flex-col max-h-[70vh]`}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Briefcase size={20} className="text-blue-600" /> Brand Directory</h2>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {brands.length === 0 ? <p className={`text-center py-8 ${t.muted}`}>No brands added yet.</p> : (
              <div className="space-y-3">
                {brands.map(b => (
                  <div key={b.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border ${t.border} gap-3 ${b.contractStatus === 'Active' ? t.bg : 'bg-red-50/50 dark:bg-red-900/10'}`}>
                    {editBrandId === b.id ? (
                       <div className="flex-1 flex gap-2">
                         <input autoFocus value={editBrandName} onChange={e=>setEditBrandName(e.target.value)} className={`flex-1 px-3 py-1 text-sm rounded border ${t.input} outline-none`} />
                         <button onClick={saveEdit} className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded">Save</button>
                         <button onClick={()=>setEditBrandId(null)} className={`px-3 py-1 ${t.muted} text-xs font-bold rounded border ${t.border}`}>Cancel</button>
                       </div>
                    ) : (
                       <>
                        <div>
                          <h3 className="font-bold flex items-center gap-2">{b.name} <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${b.contractStatus === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{b.contractStatus}</span></h3>
                          <p className={`text-xs ${t.muted} mt-0.5`}>Logs: {b.logs?.length || 0} entries</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleContract(b.id, b.contractStatus, b.name)} className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${b.contractStatus === 'Active' ? 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' : 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'}`}>{b.contractStatus === 'Active' ? 'Hide' : 'Activate'}</button>
                          <button onClick={()=>{setEditBrandId(b.id); setEditBrandName(b.name);}} className={`p-1.5 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors`}><Edit size={16}/></button>
                          <button onClick={()=>deleteBrand(b.id, b.name)} className={`p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors`}><Trash2 size={16}/></button>
                        </div>
                       </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MCNSettingsView = ({ mcnSettings, setMcnSettings, mcnEvents, t }) => {
  const [activeTab, setActiveTab] = useState('companies');
  const [form, setForm] = useState({ id: null, name: '', color: '#3B82F6' });
  const [confirm, setConfirm] = useState(null);
  const [reportFilter, setReportFilter] = useState({ month: 'ALL', company: 'ALL' });

  const colors = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B', '#000000', '#14B8A6', '#FFFFFF'];

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const list = mcnSettings[activeTab] || [];
    if (list.some(x => x.name.toLowerCase() === form.name.toLowerCase() && x.id !== form.id)) return setConfirm({ title: 'Notice', message: 'This name already exists.', action: () => {} });
    
    const updatedList = form.id 
      ? list.map(x => x.id === form.id ? { ...x, name: form.name.trim(), color: form.color } : x)
      : [...list, { id: Date.now(), name: form.name.trim(), color: form.color }];
    
    setMcnSettings({ ...mcnSettings, [activeTab]: updatedList });
    setForm({ id: null, name: '', color: '#3B82F6' });
  };

  const handleDelete = (id, name) => {
    setConfirm({ title: `Delete ${activeTab.slice(0,-1)}`, message: `Are you sure you want to delete "${name}"?`, action: () => setMcnSettings({ ...mcnSettings, [activeTab]: mcnSettings[activeTab].filter(x => x.id !== id) }) });
  };

  const downloadReport = () => {
    const filtered = mcnEvents.filter(ev => {
      if (reportFilter.month !== 'ALL' && ev.date?.substring(0,7) !== reportFilter.month) return false;
      if (reportFilter.company !== 'ALL' && ev.company !== reportFilter.company) return false;
      return true;
    });
    if(filtered.length === 0) return setConfirm({ title: 'Notice', message: 'No events found for this filter.', action: () => {} });

    let csvContent = "Date,Time,Day,Status,Company,Platform,Brand,Creator,Venue,Setup,In-Charge,Backup\n";
    filtered.forEach(e => {
        let row = [
            e.date, e.time, e.day, e.status, e.company, e.platform, e.brand, e.creator, e.venue, e.setup,
            (e.inCharge||[]).join('; '), (e.backup||[]).join('; ')
        ].map(v => `"${(v||'').toString().replace(/"/g, '""')}"`).join(',');
        csvContent += row + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url); link.setAttribute("download", `MCN_Report_${reportFilter.month}_${reportFilter.company}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const renderList = (key) => {
    if (key === 'reports') {
      return (
        <div className={`mt-6 ${t.card} border ${t.border} rounded-xl shadow-sm p-6 max-w-xl`}>
           <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><FileText className="text-indigo-600"/> Generate Event Report</h2>
           <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Filter by Month</label>
                <select value={reportFilter.month} onChange={e=>setReportFilter({...reportFilter, month:e.target.value})} className={`w-full px-3 py-2 text-sm font-bold rounded-lg border outline-none ${t.input}`}>
                  <option value="ALL">All Time</option>
                  {[...new Set(mcnEvents.map(e=>e.date?.substring(0,7)))].filter(Boolean).sort().reverse().map(m => <option key={m} value={m}>{new Date(m+'-01').toLocaleString('default', {month:'long', year:'numeric'})}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Filter by Company</label>
                <select value={reportFilter.company} onChange={e=>setReportFilter({...reportFilter, company:e.target.value})} className={`w-full px-3 py-2 text-sm font-bold rounded-lg border outline-none ${t.input}`}>
                  <option value="ALL">All Companies</option>
                  {mcnSettings.companies?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="pt-4"><button onClick={downloadReport} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm transition-colors"><Download size={18}/> Download CSV Spreadsheet</button></div>
           </div>
        </div>
      );
    }
    const list = mcnSettings[key] || [];
    return (
      <div className={`mt-6 ${t.card} border ${t.border} rounded-xl shadow-sm overflow-hidden`}>
        <div className={`p-4 border-b ${t.border} bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center`}><h2 className="font-bold capitalize flex items-center gap-2">Manage {key}</h2><span className={`text-xs font-bold ${t.muted}`}>{list.length} Records</span></div>
        <div className="p-4 space-y-4">
          <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className={`block text-xs font-bold uppercase ${t.muted} mb-1`}>Add New {key.slice(0,-1)}</label>
              <input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder={`Enter ${key.slice(0,-1)} name...`} className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${t.input}`} />
            </div>
            {key === 'companies' && (
              <div className="w-full sm:w-auto">
                <label className={`block text-xs font-bold uppercase ${t.muted} mb-1`}>Color</label>
                <div className={`flex flex-wrap gap-1.5 p-1.5 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-full sm:max-w-[220px]`}>
                  {colors.map(c => <button key={c} type="button" onClick={()=>setForm({...form, color: c})} className={`w-6 h-6 rounded border border-slate-300 dark:border-slate-600 shadow-sm transition-all ${form.color===c?'ring-2 ring-offset-1 ring-slate-800 dark:ring-slate-300 scale-110':'ring-transparent hover:scale-110'}`} style={{backgroundColor: c}}></button>)}
                </div>
              </div>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <button type="submit" className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">{form.id ? 'Save' : 'Add'}</button>
              {form.id && <button type="button" onClick={()=>setForm({id:null, name:'', color:'#3B82F6'})} className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg border ${t.border} ${t.muted} hover:bg-slate-100 dark:hover:bg-slate-800`}>Cancel</button>}
            </div>
          </form>
          <div className="divide-y border-t mt-4 border-slate-100 dark:border-slate-800">
            {list.length === 0 ? <p className={`text-sm italic py-4 ${t.muted}`}>No records found.</p> : 
              list.map(item => (
                <div key={item.id} className="py-3 flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    {key === 'companies' && <span className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: item.color || '#3B82F6'}}></span>}
                    <span className="font-semibold">{item.name}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>setForm(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit size={14}/></button>
                    <button onClick={()=>handleDelete(item.id, item.name)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-6 h-full flex flex-col ${t.text} animate-in fade-in duration-300`}>
      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} t={t} />
      <div className={`mb-6 pb-4 border-b ${t.border}`}><h1 className="text-2xl font-bold">MCN Settings</h1><p className={`text-sm ${t.muted} mt-1`}>Manage dropdown options and export reports for MCN Tracker.</p></div>
      <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto custom-scrollbar">
        {['companies', 'platforms', 'venues', 'reports'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setForm({id:null, name:'', color:'#3B82F6'}); }} className={`px-4 py-2 text-sm font-bold capitalize transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600' : `border-transparent ${t.muted} hover:${t.text}`}`}>{tab === 'reports' ? 'Export Reports' : `Manage ${tab}`}</button>
        ))}
      </div>
      <div className="max-w-3xl">{renderList(activeTab)}</div>
    </div>
  );
};

const CalloutSettingsView = ({ calloutSettings, setCalloutSettings, t }) => {
  const [form, setForm] = useState({ id: null, role: calloutSettings.roles[0], name: '' });
  const [confirm, setConfirm] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const newReporter = { id: form.id || Date.now(), role: form.role, name: form.name.trim() };
    const filtered = calloutSettings.reporters.filter(r => r.id !== form.id);
    if (filtered.some(r => r.role === form.role && r.name.toLowerCase() === form.name.toLowerCase())) return setConfirm({ title: 'Notice', message: 'This reporter already exists for this role.', action: () => {} });
    
    setCalloutSettings({ ...calloutSettings, reporters: [...filtered, newReporter] });
    setForm({ id: null, role: form.role, name: '' });
  };

  const handleDelete = (id, name) => {
    setConfirm({ title: `Delete Reporter`, message: `Remove ${name} from settings?`, action: () => setCalloutSettings({ ...calloutSettings, reporters: calloutSettings.reporters.filter(r => r.id !== id) }) });
  };

  return (
    <div className={`p-6 h-full flex flex-col ${t.text} animate-in fade-in duration-300`}>
      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} t={t} />
      <div className={`mb-6 pb-4 border-b ${t.border}`}><h1 className="text-2xl font-bold">Callout Settings</h1><p className={`text-sm ${t.muted} mt-1`}>Manage Reporting Persons by their specific roles.</p></div>

      <div className={`max-w-3xl ${t.card} border ${t.border} rounded-xl shadow-sm p-6`}>
        <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-3 items-end mb-8">
           <div className="w-full sm:w-1/3">
             <label className={`block text-xs font-bold uppercase ${t.muted} mb-1`}>Role</label>
             <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})} className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${t.input}`}>
               {calloutSettings.roles.map(r => <option key={r} value={r}>{r}</option>)}
             </select>
           </div>
           <div className="flex-1 w-full">
             <label className={`block text-xs font-bold uppercase ${t.muted} mb-1`}>Reporter Name</label>
             <input required placeholder="e.g. Jane Doe" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${t.input}`} />
           </div>
           <div className="flex gap-2 w-full sm:w-auto">
              <button type="submit" className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">{form.id ? 'Save Edit' : 'Add Reporter'}</button>
              {form.id && <button type="button" onClick={()=>setForm({id:null, role:calloutSettings.roles[0], name:''})} className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg border ${t.border} ${t.muted} hover:bg-slate-100 dark:hover:bg-slate-800`}>Cancel</button>}
           </div>
        </form>

        <div className="space-y-6">
          {calloutSettings.roles.map(role => {
            const list = calloutSettings.reporters.filter(r => r.role === role);
            if (list.length === 0) return null;
            return (
              <div key={role} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 font-bold text-sm border-b border-slate-200 dark:border-slate-800">{role} <span className={`text-xs font-normal ml-2 ${t.muted}`}>({list.length})</span></div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {list.map(r => (
                    <div key={r.id} className="p-3 flex justify-between items-center group">
                      <span className="text-sm font-medium">{r.name}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>setForm(r)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit size={14}/></button>
                        <button onClick={()=>handleDelete(r.id, r.name)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const UserManagementView = ({ users, setUsers, brands, t }) => {
  const [f, setF] = useState({ id: null, u: '', p: '', n: '', b: '', r: 'LO', aBrands: [], hLOs: [] });
  const [msg, setMsg] = useState(null);
  const [flt, setFlt] = useState({ role: 'ALL', stat: 'ALL' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [brandSearch, setBrandSearch] = useState('');
  const [loSearch, setLoSearch] = useState('');

  const activeBrands = brands.filter(b => b.contractStatus === 'Active');
  const activeLOs = users.filter(u => u.status !== 'Terminated' && u.roleId === 'LO');

  const triggerSubmit = (e) => {
    e.preventDefault();
    setConfirm({ title: f.id ? 'Save Changes' : 'Create User Account', message: `Are you sure you want to ${f.id ? 'update' : 'create'} the account for ${f.u}?`, action: () => submit() });
  };

  const submit = () => {
    if (users.some(x => x.username === f.u && x.id !== f.id)) return setMsg({ err: true, txt: 'The username is already taken.' });
    const rDef = ROLES[f.r];
    const newUserData = { username: f.u, password: f.p, fullName: f.n, birthday: f.b, roleId: rDef.id, roleName: rDef.name, isAdmin: rDef.isAdmin, assignedBrands: f.r==='LO'?f.aBrands:[], handledLOs: f.r==='LOL'?f.hLOs:[] };
    
    if (f.id) {
       setUsers(users.map(u => u.id === f.id ? { ...u, ...newUserData } : u));
       setMsg({ err: false, txt: 'Account updated successfully.' });
    } else {
       setUsers([...users, { id: Date.now(), status: 'Active', theme: 'light', profilePic: null, mustChangePassword: true, ...newUserData }]);
       setMsg({ err: false, txt: 'Account created successfully.' });
    }
    setF({ id: null, u: '', p: '', n: '', b: '', r: 'LO', aBrands: [], hLOs: [] });
    setShowAddModal(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const setStat = (id, s) => setUsers(users.map(x => x.id === id ? { ...x, status: s } : x));
  const deleteUser = (id, username) => setConfirm({ title: 'Delete Account', message: `Permanently delete account for ${username}?`, action: () => setUsers(users.filter(x => x.id !== id)) });

  const grouped = users.filter(x => (flt.role === 'ALL' || (flt.role === 'ADMIN' ? x.isAdmin : !x.isAdmin)) && (flt.stat === 'ALL' || x.status === flt.stat))
    .reduce((acc, x) => { acc[x.roleName] = acc[x.roleName] || { Active: [], Suspended: [], Terminated: [] }; acc[x.roleName][x.status].push(x); return acc; }, {});

  return (
    <div className={`p-6 h-full flex flex-col ${t.text} animate-in fade-in duration-300 relative`}>
      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} t={t} />

      <div className={`mb-6 flex justify-between items-center pb-4 border-b ${t.border}`}><h1 className="text-2xl font-bold">User Management</h1><button onClick={() => { setF({ id: null, u: '', p: '', n: '', b: '', r: 'LO', aBrands: [], hLOs: [] }); setShowAddModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"><Plus size={18} /> Add New User</button></div>
      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.err ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'} border shadow-sm`}>{msg.txt}</div>}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[99999] flex items-start justify-center p-4 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
          <div className={`${t.card} rounded-xl border ${t.border} shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200`}>
            <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-semibold flex items-center gap-2"><UserIcon size={20} className="text-blue-600" /> {f.id ? 'Edit Account' : 'Create Account'}</h2><button onClick={() => setShowAddModal(false)} className={`${t.muted} hover:text-red-500 transition-colors`}><X size={20} /></button></div>
            <form onSubmit={triggerSubmit} className="space-y-4">
              <div><label className={`block text-xs font-semibold ${t.muted} mb-1 uppercase`}>Full Name</label><input required placeholder="Juan Dela Cruz" value={f.n} onChange={e=>setF({...f, n: e.target.value})} className={`w-full px-3 py-2 rounded-lg outline-none border ${t.border} ${t.input}`} /></div>
              <div><label className={`block text-xs font-semibold ${t.muted} mb-1 uppercase`}>Birthday</label><input required type="date" value={f.b} onChange={e=>setF({...f, b: e.target.value})} className={`w-full px-3 py-2 rounded-lg outline-none border ${t.border} ${t.input}`} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={`block text-xs font-semibold ${t.muted} mb-1 uppercase`}>Username</label><input required placeholder="Username" value={f.u} onChange={e=>setF({...f, u: e.target.value})} className={`w-full px-3 py-2 rounded-lg outline-none border ${t.border} ${t.input}`} /></div>
                <div><label className={`block text-xs font-semibold ${t.muted} mb-1 uppercase`}>Password</label><PasswordInput value={f.p} onChange={e=>setF({...f, p: e.target.value})} placeholder="Password" className={`w-full px-3 pr-10 py-2 rounded-lg outline-none border ${t.border} ${t.input}`} /></div>
              </div>
              <div>
                <label className={`block text-xs font-semibold ${t.muted} mb-1 uppercase`}>Assigned Role</label>
                <select value={f.r} onChange={e=>setF({...f, r: e.target.value, aBrands: [], hLOs: []})} className={`w-full px-3 py-2 rounded-lg outline-none border ${t.border} ${t.input}`}>
                  <optgroup label="Admin Roles"><option value="TSS">TechSupp Supervisor (TSS)</option><option value="LOL">Live Operator Lead (LOL)</option><option value="LOT">Live Operator Trainer (LOT)</option><option value="POC">Point of Contact (POC)</option></optgroup>
                  <optgroup label="Normal Roles"><option value="LO">Live Operator (LO)</option></optgroup>
                </select>
              </div>

              {f.r === 'LO' && (
                <div>
                  <div className="flex justify-between items-end mb-1"><label className={`block text-xs font-semibold ${t.muted} uppercase`}>Assigned Brands (For TSP)</label><input type="text" placeholder="Search brands..." value={brandSearch} onChange={e=>setBrandSearch(e.target.value)} className={`text-xs px-2 py-1 rounded border outline-none ${t.border} ${t.input} w-32`} /></div>
                  <div className={`p-2 max-h-40 overflow-y-auto rounded-lg border ${t.border} bg-slate-50 dark:bg-slate-900 grid grid-cols-2 gap-2`}>
                    {activeBrands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase())).map(b => (
                      <label key={b.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input type="checkbox" checked={f.aBrands.includes(b.name)} onChange={(e)=> { const newArr = e.target.checked ? [...f.aBrands, b.name] : f.aBrands.filter(x=>x!==b.name); setF({...f, aBrands: newArr}); }} className="accent-blue-600 rounded" />
                        {b.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {f.r === 'LOL' && (
                <div>
                  <div className="flex justify-between items-end mb-1"><label className={`block text-xs font-semibold ${t.muted} uppercase`}>Handled Live Operators</label><input type="text" placeholder="Search operators..." value={loSearch} onChange={e=>setLoSearch(e.target.value)} className={`text-xs px-2 py-1 rounded border outline-none ${t.border} ${t.input} w-32`} /></div>
                  <div className={`p-2 max-h-40 overflow-y-auto rounded-lg border ${t.border} bg-slate-50 dark:bg-slate-900 grid grid-cols-2 gap-2`}>
                    {activeLOs.filter(u => u.username !== f.u && u.username.toLowerCase().includes(loSearch.toLowerCase())).map(lo => (
                      <label key={lo.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input type="checkbox" checked={f.hLOs.includes(lo.username)} onChange={(e)=> { const newArr = e.target.checked ? [...f.hLOs, lo.username] : f.hLOs.filter(x=>x!==lo.username); setF({...f, hLOs: newArr}); }} className="accent-blue-600 rounded" />
                        {lo.username}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className={`px-4 py-2 rounded-lg text-sm font-medium border ${t.border} hover:bg-slate-500/10`}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">{f.id ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col gap-4">
          <div className={`flex flex-col sm:flex-row gap-3 ${t.card} p-3 rounded-xl border ${t.border} shadow-sm shrink-0`}>
            <div className={`flex ${t.bg} p-1 rounded-lg w-full sm:w-auto`}>{['ALL', 'ADMIN', 'NORMAL'].map(r => <button key={r} onClick={()=>setFlt({...flt, role: r})} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${flt.role === r ? `${t.card} shadow-sm text-blue-600` : `${t.muted} hover:text-blue-500`}`}>{r === 'ALL' ? 'All Roles' : r === 'ADMIN' ? 'Admins' : 'Normals'}</button>)}</div>
            <div className={`flex ${t.bg} p-1 rounded-lg w-full sm:w-auto overflow-x-auto custom-scrollbar`}>{['ALL', 'Active', 'Suspended', 'Terminated'].map(s => <button key={s} onClick={()=>setFlt({...flt, stat: s})} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${flt.stat === s ? `${t.card} shadow-sm text-blue-600` : `${t.muted} hover:text-blue-500`}`}>{s === 'ALL' ? 'All Status' : s}</button>)}</div>
          </div>

          <div className="space-y-4 pb-8 overflow-y-auto">
            {Object.keys(grouped).length === 0 ? <div className={`${t.card} rounded-xl border border-dashed ${t.border} p-12 text-center flex flex-col items-center`}><Users size={32} className={`mb-3 ${t.muted} opacity-50`} /><p className={t.muted}>No user accounts found matching the filter.</p></div> : 
              Object.entries(grouped).sort(([rNameA], [rNameB]) => {
                  const aIsAdmin = ROLES[Object.keys(ROLES).find(k => ROLES[k].name === rNameA)]?.isAdmin ? 1 : 0;
                  const bIsAdmin = ROLES[Object.keys(ROLES).find(k => ROLES[k].name === rNameB)]?.isAdmin ? 1 : 0;
                  return bIsAdmin - aIsAdmin;
              }).map(([rName, stats]) => (
                <div key={rName} className={`${t.card} border ${t.border} rounded-xl overflow-hidden shadow-sm`}>
                  <div className={`${t.bg} px-4 py-3 border-b ${t.border} flex items-center gap-2`}><Shield size={16} className={ROLES[Object.keys(ROLES).find(k => ROLES[k].name === rName)]?.isAdmin ? 'text-indigo-500' : t.muted} /><h3 className={`font-bold ${t.text}`}>{rName}</h3></div>
                  {['Active', 'Suspended', 'Terminated'].map(st => {
                    const list = stats[st];
                    if (!list.length) return null;
                    return (
                      <div key={st}>
                        <div className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider border-y border-black/5 ${st === 'Active' ? 'bg-green-50/50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : st === 'Suspended' ? 'bg-amber-50/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-red-50/50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>{st} ({list.length})</div>
                        <div className={`divide-y ${t.border}`}>
                          {list.map(u => (
                            <div key={u.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 px-4 hover:bg-black/5 transition-colors gap-3`}>
                              <div className="flex items-center gap-3">
                                {u.profilePic ? <img src={u.profilePic} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm border border-slate-200" /> : <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${st === 'Active' ? 'bg-gradient-to-tr from-green-500 to-emerald-400' : st === 'Suspended' ? 'bg-gradient-to-tr from-amber-500 to-orange-400' : 'bg-gradient-to-tr from-red-500 to-rose-400'}`}>{u.username.charAt(0).toUpperCase()}</div>}
                                <div className="min-w-0">
                                  <div className={`font-semibold ${t.text} truncate`}>{u.username}</div>
                                  <div className={`text-xs ${t.muted} flex flex-wrap items-center gap-x-2 mt-0.5`}>
                                    <span className="flex items-center"><UserIcon size={10} className="mr-1 opacity-70"/>{u.fullName}</span><span className="opacity-50">•</span><PwdBadge p={u.password} t={t} /><span className="opacity-50">•</span><span className="whitespace-nowrap">🎂 {u.birthday}</span>
                                  </div>
                                  {(u.assignedBrands?.length > 0 || u.handledLOs?.length > 0) && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {u.assignedBrands?.map(b => <span key={b} className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800 px-1.5 rounded">{b}</span>)}
                                      {u.handledLOs?.map(lo => <span key={lo} className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 px-1.5 rounded">LO: {lo}</span>)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:shrink-0">
                                <select value={u.status} onChange={(e) => { const val = e.target.value; setConfirm({ title: 'Change Status', message: `Change ${u.username} to ${val}?`, action: () => setStat(u.id, val) }); }} disabled={u.id === 1} className={`w-full sm:w-auto text-xs font-bold rounded-lg px-3 py-1.5 border outline-none ${t.input} ${u.id === 1 ? 'opacity-50' : 'cursor-pointer'} ${st === 'Active' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400' : st === 'Suspended' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400'}`}><option value="Active">Active</option><option value="Suspended">Suspended</option><option value="Terminated">Terminated</option></select>
                                {u.id !== 1 && (<><button onClick={()=>{setF({ id: u.id, u: u.username, p: u.password, n: u.fullName, b: u.birthday, r: u.roleId, aBrands: u.assignedBrands||[], hLOs: u.handledLOs||[] }); setShowAddModal(true);}} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit size={14}/></button><button onClick={()=>deleteUser(u.id, u.username)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 size={14}/></button></>)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ user, users, mcnEvents, setMcnEvents, brands, callouts, t, filterMonth, setFilterMonth }) => {
  const todayStr = getPHTToday();
  const allMonths = [...new Set([...mcnEvents.map(e=>e.date?.substring(0,7)), ...callouts.map(c=>c.timestamp?.substring(0,7))])].filter(Boolean).sort().reverse();
  const [dashTab, setDashTab] = useState('tsp');

  // Scoped Data
  const scopedMCN = user.isAdmin ? mcnEvents : mcnEvents.filter(ev => ev.inCharge?.includes(user.username) || ev.backup?.includes(user.username));
  const scopedBrands = user.isAdmin ? brands : brands.filter(b => user.assignedBrands?.includes(b.name));
  const scopedCallouts = user.isAdmin ? callouts : callouts.filter(c => c.assignedOperator === user.username);

  // Filtered by Month Data
  const filteredMCN = filterMonth === 'ALL' ? scopedMCN : scopedMCN.filter(ev => ev.date?.substring(0,7) === filterMonth);
  const filteredCallouts = filterMonth === 'ALL' ? scopedCallouts : scopedCallouts.filter(c => c.timestamp?.substring(0,7) === filterMonth);

  const happeningToday = filteredMCN.filter(ev => ev.date === todayStr && ev.status === 'Confirmed');

  const updateEventStatus = (id, newStatus) => setMcnEvents(mcnEvents.map(e => e.id === id ? { ...e, status: newStatus } : e));

  const activeBrands = scopedBrands.filter(b => b.contractStatus === 'Active');
  const tspMetrics = {
    active: activeBrands.filter(b => b.currentStatus === 'Active').length,
    tasks: activeBrands.filter(b => b.logs.some(l => l.tasks?.some(tk => !tk.completed && (tk.status === 'Task' || tk.status === 'Active')))).length,
    pending: activeBrands.filter(b => b.currentStatus === 'Pending').length,
    issue: activeBrands.filter(b => b.currentStatus === 'Issue').length,
  };
  
  const attentionBrands = activeBrands.filter(b => b.currentStatus === 'Issue' || b.currentStatus === 'Pending').slice(0, 5);

  // Callout Metrics
  const validCallouts = filteredCallouts.filter(c => c.status !== 'Accepted');
  const todaysCallouts = validCallouts.filter(c => c.timestamp?.substring(0,10) === todayStr);
  const brandFlagCounts = validCallouts.reduce((acc, c) => { acc[c.brand] = (acc[c.brand]||0)+1; return acc; }, {});
  const topBrand = Object.entries(brandFlagCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';
  const reporterCounts = validCallouts.reduce((acc, c) => { acc[c.reporterName] = (acc[c.reporterName]||0)+1; return acc; }, {});
  const topReporter = Object.entries(reporterCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';

  // Coaching Priority (LOs sorted by most valid callouts)
  const coachingList = users.filter(u => u.roleId === 'LO' && u.status !== 'Terminated' && (user.isAdmin ? true : user.username === u.username || user.handledLOs?.includes(u.username))).map(u => {
    const cCount = validCallouts.filter(c => c.assignedOperator === u.username).length;
    return { name: u.username, count: cCount };
  }).sort((a,b) => b.count - a.count || a.name.localeCompare(b.name));

  const teamPerf = users.filter(u => u.status !== 'Terminated' && (user.isAdmin ? true : user.username === u.username || user.handledLOs?.includes(u.username))).map(u => {
    const doneEvents = filteredMCN.filter(ev => ev.status === 'Done');
    let dInCharge = 0, dBackup = 0, dComp = {};
    doneEvents.forEach(ev => { if(ev.inCharge?.includes(u.username)) { dInCharge++; dComp[ev.company] = (dComp[ev.company] || 0) + 1; } if(ev.backup?.includes(u.username)) { dBackup++; dComp[ev.company] = (dComp[ev.company] || 0) + 1; } });
    const assignedEvents = filteredMCN.filter(ev => ['Confirmed', 'Pending', 'Done'].includes(ev.status));
    let aInCharge = 0, aBackup = 0, aComp = {};
    assignedEvents.forEach(ev => { if(ev.inCharge?.includes(u.username)) { aInCharge++; aComp[ev.company] = (aComp[ev.company] || 0) + 1; } if(ev.backup?.includes(u.username)) { aBackup++; aComp[ev.company] = (aComp[ev.company] || 0) + 1; } });
    return { name: u.username, dInCharge, dBackup, dComp, aInCharge, aBackup, aComp, assigned: aInCharge + aBackup, totalDone: dInCharge + dBackup };
  }).sort((a,b) => a.name.localeCompare(b.name));

  return (
    <div className={`p-6 h-full flex flex-col ${t.text} animate-in fade-in duration-300`}>
      <div className={`mb-6 pb-4 border-b ${t.border} shrink-0 flex flex-col sm:flex-row justify-between sm:items-end gap-4`}>
        <div><h1 className="text-3xl font-black">Dashboard</h1><p className={`text-sm font-medium ${t.muted} mt-1`}>Welcome back, {user.fullName}! Here's your overall operations summary.</p></div>
        <div>
          <label className={`block text-[10px] font-bold uppercase ${t.muted} mb-1 tracking-wider`}>Global Month Filter</label>
          <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className={`w-full sm:w-48 px-3 py-2 text-sm font-bold rounded-lg border outline-none ${t.input}`}>
            <option value="ALL">All Time</option>
            {allMonths.map(m => <option key={m} value={m}>{new Date(m+'-01').toLocaleString('default', {month:'long', year:'numeric'})}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto custom-scrollbar shrink-0">
        {[{id:'tsp', label:'TikTok Shop Partners'}, {id:'mcn', label:'MCN Tracker'}, {id:'callout', label:'Callout Tracker'}].map(tab => (
          <button key={tab.id} onClick={() => setDashTab(tab.id)} className={`px-4 py-2 text-sm font-bold capitalize transition-colors border-b-[3px] whitespace-nowrap ${dashTab === tab.id ? 'border-blue-600 text-blue-600' : `border-transparent ${t.muted} hover:${t.text}`}`}>{tab.label}</button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-10 pr-2">
        
        {dashTab === 'tsp' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h2 className="text-lg font-bold flex items-center gap-2"><Briefcase className="text-blue-600" size={20}/> {user.isAdmin ? 'TikTok Shop Partners Summary' : 'My Assigned Brands Summary'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`${t.card} border ${t.border} p-4 rounded-xl shadow-sm flex items-center gap-4`}><div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg"><CheckCircle2 size={24} /></div><div><p className={`text-[10px] font-bold ${t.muted} uppercase tracking-wider`}>Active Brands</p><h3 className="text-2xl font-black">{tspMetrics.active}</h3></div></div>
              <div className={`${t.card} border ${t.border} p-4 rounded-xl shadow-sm flex items-center gap-4`}><div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg"><ClipboardList size={24} /></div><div><p className={`text-[10px] font-bold ${t.muted} uppercase tracking-wider`}>Active Tasks</p><h3 className="text-2xl font-black">{tspMetrics.tasks}</h3></div></div>
              <div className={`${t.card} border ${t.border} p-4 rounded-xl shadow-sm flex items-center gap-4`}><div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg"><Clock size={24} /></div><div><p className={`text-[10px] font-bold ${t.muted} uppercase tracking-wider`}>Pending Brands</p><h3 className="text-2xl font-black">{tspMetrics.pending}</h3></div></div>
              <div className={`${t.card} border ${t.border} p-4 rounded-xl shadow-sm flex items-center gap-4`}><div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg"><AlertOctagon size={24} /></div><div><p className={`text-[10px] font-bold ${t.muted} uppercase tracking-wider`}>Brand Issues</p><h3 className="text-2xl font-black">{tspMetrics.issue}</h3></div></div>
          </div>
          
          <div className={`${t.card} border ${t.border} rounded-xl shadow-sm overflow-hidden`}>
             <div className={`p-3 bg-slate-50 dark:bg-slate-900/50 border-b ${t.border} flex items-center gap-2`}><AlertTriangle size={16} className="text-amber-500"/><h3 className="font-bold text-sm">Brands Needing Attention</h3></div>
             <div className="p-4 custom-scrollbar">
                {attentionBrands.length === 0 ? <p className={`text-sm italic ${t.muted}`}>All clear! No brands currently have issues or pending status.</p> : 
                  <div className="space-y-3">
                     {attentionBrands.map(b => (
                        <div key={b.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                           <div className="flex items-center gap-3"><span className="font-bold">{b.name}</span><StatusPill status={b.currentStatus}/></div>
                           <span className="text-xs text-slate-500">Latest Log: {b.logs[0] ? new Date(b.logs[0].date).toLocaleDateString() : '--'}</span>
                        </div>
                     ))}
                  </div>
                }
             </div>
          </div>
        </div>
        )}

        {dashTab === 'mcn' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h2 className="text-lg font-bold flex items-center gap-2"><CalendarDays className="text-indigo-600" size={20}/> {user.isAdmin ? 'MCN Tracker Summary' : 'My MCN Events Summary'}</h2>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${t.card} border ${t.border} p-4 rounded-xl shadow-sm flex items-center gap-4`}><div className="p-3 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-lg"><CalendarDays size={24} /></div><div><p className={`text-[10px] font-bold ${t.muted} uppercase tracking-wider`}>Total Events</p><h3 className="text-2xl font-black">{filteredMCN.length}</h3></div></div>
                <div className={`${t.card} border ${t.border} p-4 rounded-xl shadow-sm flex items-center gap-4`}><div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg"><Clock size={24} /></div><div><p className={`text-[10px] font-bold ${t.muted} uppercase tracking-wider`}>Pending</p><h3 className="text-2xl font-black">{filteredMCN.filter(e=>e.status==='Pending').length}</h3></div></div>
                <div className={`${t.card} border ${t.border} p-4 rounded-xl shadow-sm flex items-center gap-4`}><div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg"><CheckCircle2 size={24} /></div><div><p className={`text-[10px] font-bold ${t.muted} uppercase tracking-wider`}>Confirmed</p><h3 className="text-2xl font-black">{filteredMCN.filter(e=>e.status==='Confirmed').length}</h3></div></div>
                <div className={`${t.card} border ${t.border} p-4 rounded-xl shadow-sm flex items-center gap-4`}><div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg"><History size={24} /></div><div><p className={`text-[10px] font-bold ${t.muted} uppercase tracking-wider`}>Done</p><h3 className="text-2xl font-black">{filteredMCN.filter(e=>e.status==='Done').length}</h3></div></div>
              </div>

              <div className={`${t.card} border ${t.border} rounded-xl shadow-sm overflow-hidden`}>
                <div className={`p-3 bg-slate-50 dark:bg-slate-900/50 border-b ${t.border} flex items-center gap-2`}><Play size={16} className="text-rose-500"/><h3 className="font-bold text-sm">Happening Today ({happeningToday.length})</h3></div>
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {happeningToday.length === 0 ? <p className={`text-sm italic ${t.muted}`}>No confirmed events scheduled for today.</p> : 
                    happeningToday.map(ev => (
                      <div key={ev.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <div>
                          <h4 className="font-bold text-base mb-1">{ev.brand}</h4>
                          <div className={`text-xs ${t.muted} flex flex-wrap gap-2`}><span className="font-bold text-slate-800 dark:text-slate-200">{ev.time}</span> • <span>{ev.company}</span> • <span>Host: {ev.creator}</span></div>
                        </div>
                        <div className="flex items-center gap-3 sm:shrink-0">
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800">{ev.venue}</span>
                          {user.status !== 'Suspended' && (
                            <select value={ev.status} onChange={(e) => updateEventStatus(ev.id, e.target.value)} className={`text-xs font-bold p-1.5 rounded-lg border outline-none ${t.input} cursor-pointer`}>
                              <option value="Confirmed">Confirmed</option><option value="Done">Mark Done</option><option value="Cancelled">Cancel</option><option value="Pending">Pending</option>
                            </select>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            <div className="xl:col-span-1 space-y-6">
              <div className={`${t.card} border ${t.border} rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[400px]`}>
                <div className={`p-3 bg-slate-50 dark:bg-slate-900/50 border-b ${t.border} flex items-center gap-2 shrink-0`}><Shield size={16} className="text-blue-600"/><h3 className="font-bold text-sm">Team Performance (Done Events)</h3></div>
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead><tr className={`border-b ${t.border} text-[10px] font-bold uppercase tracking-wider ${t.muted}`}><th className="pb-3 pr-2">Name</th><th className="pb-3 px-1 text-center">In-Charge</th><th className="pb-3 px-1 text-center">Backup</th><th className="pb-3 px-1 text-center">Total Done</th><th className="pb-3 pl-2">Company</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {teamPerf.map(u => (
                        <tr key={u.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 pr-2 font-bold text-xs">{u.name}</td>
                          <td className="py-3 px-1 text-center"><span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">{u.dInCharge}</span></td>
                          <td className="py-3 px-1 text-center"><span className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-bold">{u.dBackup}</span></td>
                          <td className="py-3 px-1 text-center font-black text-slate-700 dark:text-slate-200">{u.totalDone}</td>
                          <td className="py-3 pl-2 flex flex-wrap gap-1">{Object.entries(u.dComp).map(([comp, count]) => <span key={comp} className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{comp} ({count})</span>)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={`${t.card} border ${t.border} rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[400px]`}>
                <div className={`p-3 bg-slate-50 dark:bg-slate-900/50 border-b ${t.border} flex items-center gap-2 shrink-0`}><Users size={16} className="text-indigo-600"/><h3 className="font-bold text-sm">Assigned Event Counter</h3></div>
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead><tr className={`border-b ${t.border} text-[10px] font-bold uppercase tracking-wider ${t.muted}`}><th className="pb-3 pr-2">Name</th><th className="pb-3 px-1 text-center">In-Charge</th><th className="pb-3 px-1 text-center">Backup</th><th className="pb-3 px-1 text-center">Total Assigned</th><th className="pb-3 pl-2">Company</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {teamPerf.map(u => (
                        <tr key={`assigned-${u.name}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 pr-2 font-bold text-xs">{u.name}</td>
                          <td className="py-3 px-1 text-center text-xs font-semibold">{u.aInCharge}</td>
                          <td className="py-3 px-1 text-center text-xs font-semibold">{u.aBackup}</td>
                          <td className="py-3 px-1 text-center"><span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded text-xs font-bold border border-indigo-100 dark:border-indigo-800">{u.assigned}</span></td>
                          <td className="py-3 pl-2 flex flex-wrap gap-1">{Object.entries(u.aComp).map(([comp, count]) => <span key={comp} className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{comp} ({count})</span>)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {dashTab === 'callout' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h2 className="text-lg font-bold flex items-center gap-2"><ShieldAlert className="text-rose-600" size={20}/> Callout Tracker Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`${t.card} border ${t.border} p-5 rounded-xl shadow-sm flex items-center gap-4 min-h-[100px]`}><div className="p-3 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg"><AlertTriangle size={28} /></div><div className="flex-1 min-w-0"><p className={`text-[10px] font-bold ${t.muted} uppercase tracking-wider`}>Total Callouts</p><h3 className="text-2xl font-black leading-tight truncate">{validCallouts.length}</h3></div></div>
              <div className={`${t.card} border ${t.border} p-5 rounded-xl shadow-sm flex items-center gap-4 min-h-[100px]`}><div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg"><Clock size={28} /></div><div className="flex-1 min-w-0"><p className={`text-[10px] font-bold ${t.muted} uppercase tracking-wider`}>Today's Callouts</p><h3 className="text-2xl font-black leading-tight truncate">{todaysCallouts.length}</h3></div></div>
              <div className={`${t.card} border ${t.border} p-5 rounded-xl shadow-sm flex items-center gap-4 min-h-[100px]`}><div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg"><Briefcase size={28} /></div><div className="flex-1 min-w-0"><p className={`text-[10px] font-bold ${t.muted} uppercase tracking-wider`}>Top Flagged Brand</p><h3 className="text-xl font-black leading-tight break-words whitespace-normal" title={topBrand}>{topBrand}</h3></div></div>
              <div className={`${t.card} border ${t.border} p-5 rounded-xl shadow-sm flex items-center gap-4 min-h-[100px]`}><div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg"><UserIcon size={28} /></div><div className="flex-1 min-w-0"><p className={`text-[10px] font-bold ${t.muted} uppercase tracking-wider`}>Reporter</p><h3 className="text-xl font-black leading-tight break-words whitespace-normal" title={topReporter}>{topReporter}</h3></div></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1">
               <div className={`${t.card} border ${t.border} rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[400px]`}>
                  <div className={`p-3 bg-slate-50 dark:bg-slate-900/50 border-b ${t.border} flex items-center gap-2 shrink-0`}><Activity size={16} className="text-amber-600"/><h3 className="font-bold text-sm">Coaching Priority</h3></div>
                  <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                     <table className="w-full text-left text-sm">
                        <thead><tr className={`border-b ${t.border} text-[10px] font-bold uppercase tracking-wider ${t.muted}`}><th className="pb-3 pr-2">Live Operator</th><th className="pb-3 text-center">Valid Callouts</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {coachingList.map((u, i) => (
                             <tr key={u.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="py-3 pr-2 font-bold text-xs flex items-center gap-2">
                                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] ${i===0?'bg-rose-100 text-rose-700':i===1?'bg-orange-100 text-orange-700':i===2?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-500'}`}>{i+1}</span>
                                  {u.name}
                                </td>
                                <td className="py-3 text-center"><span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-bold border border-slate-200 dark:border-slate-700">{u.count}</span></td>
                             </tr>
                          ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
            <div className="xl:col-span-2">
               <div className={`${t.card} border ${t.border} rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[400px]`}>
                  <div className={`p-3 bg-slate-50 dark:bg-slate-900/50 border-b ${t.border} flex items-center gap-2 shrink-0`}><History size={16} className="text-blue-600"/><h3 className="font-bold text-sm">Recent Callouts</h3></div>
                  <div className="flex-1 overflow-auto p-4 custom-scrollbar space-y-3">
                     {filteredCallouts.length === 0 ? <p className={`text-sm italic ${t.muted}`}>No recent callouts found.</p> : 
                       filteredCallouts.slice(0, 10).map(c => (
                         <div key={c.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                               <div className="flex items-center gap-2"><StatusPill status={c.status}/></div>
                               <span className="text-[10px] font-bold text-slate-400">{new Date(c.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1"><span className="text-sm font-bold">{c.assignedOperator}</span> <span className="text-xs text-blue-600 dark:text-blue-400">@ {c.brand}</span></div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1"><span className="font-semibold">Reason:</span> {c.reason}</p>
                            <p className="text-[10px] text-slate-500 italic">Reported by {c.reporterName} ({c.reporterRole})</p>
                         </div>
                       ))
                     }
                  </div>
               </div>
            </div>
          </div>
        </div>
        )}

      </div>
    </div>
  );
};

const CalloutTrackerView = ({ callouts, setCallouts, calloutSettings, setCalloutSettings, brands, users, user, t, filterMonth }) => {
  const [showModal, setShowModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [f, setF] = useState({ id: null, timestamp: getPHTToday()+'T12:00', brand: brands[0]?.name||'', reporterRole: calloutSettings.roles[0], reporterName: '', assignedOperator: '', reason: '', remarks: '', link: '', author: user.username });
  const [reviewForm, setReviewForm] = useState(null);
  const [disputeText, setDisputeText] = useState('');
  const [commentText, setCommentText] = useState({});

  const [editCmtId, setEditCmtId] = useState(null);
  const [editCmtText, setEditCmtText] = useState('');

  const activeLOs = users.filter(u => u.status !== 'Terminated' && u.roleId === 'LO');
  const filteredCallouts = filterMonth === 'ALL' ? callouts : callouts.filter(c => c.timestamp?.substring(0,7) === filterMonth);
  const scopedCallouts = user.isAdmin ? filteredCallouts : filteredCallouts.filter(c => c.assignedOperator === user.username);

  const handleSave = (e) => {
    e.preventDefault();
    if (!f.reporterName.trim() || !f.reason.trim()) return;

    const existingReporters = calloutSettings.reporters.filter(r => r.role === f.reporterRole);
    if (!existingReporters.some(r => r.name.toLowerCase() === f.reporterName.trim().toLowerCase())) {
        setCalloutSettings(prev => ({...prev, reporters: [...prev.reporters, { id: Date.now(), role: f.reporterRole, name: f.reporterName.trim() }]}));
    }

    const payload = { ...f, author: f.author || user.username };
    if (f.id) {
       setCallouts(callouts.map(c => c.id === f.id ? { ...c, ...payload } : c));
    } else {
       setCallouts([{ ...payload, id: Date.now(), status: 'Active', disputeComment: '', leadReply: '', comments: [] }, ...callouts]);
    }
    setShowModal(false);
  };

  const submitDispute = (id) => {
    if(!disputeText.trim()) return;
    setConfirm({ title: 'Submit Dispute', message: 'Send this dispute for review by a Lead?', action: () => {
      setCallouts(callouts.map(c => c.id === id ? {...c, status: 'Disputed', disputeComment: disputeText} : c));
      setDisputeText('');
      setReviewForm(null);
    }});
  };

  const submitReview = (id, action) => { 
    if(action === 'Rejected' && !reviewForm.text.trim()) return setConfirm({ title: 'Notice', message: 'Please provide a reason for rejecting the dispute.', action: ()=>{} });
    setConfirm({ title: action === 'Accepted' ? 'Accept Dispute' : 'Reject Dispute', message: action === 'Accepted' ? 'Accepting this dispute means the callout will NOT count against the user.' : 'Rejecting this dispute means the callout will COUNT against the user.', action: () => {
      setCallouts(callouts.map(c => c.id === id ? {...c, status: action, leadReply: reviewForm.text} : c));
      setReviewForm(null);
    }});
  };

  const submitCalloutComment = (id) => {
    const txt = commentText[id];
    if(!txt?.trim()) return;
    const newComment = { id: Date.now(), author: user.username, text: txt, date: new Date().toISOString() };
    setCallouts(callouts.map(c => c.id === id ? {...c, comments: [...(c.comments||[]), newComment]} : c));
    setCommentText({...commentText, [id]: ''});
  };

  const startEditComment = (cmt) => { setEditCmtId(cmt.id); setEditCmtText(cmt.text); };
  const saveEditComment = (calloutId) => {
    if(!editCmtText.trim()) return;
    setCallouts(callouts.map(c => c.id === calloutId ? {...c, comments: c.comments.map(cm => cm.id === editCmtId ? {...cm, text: editCmtText} : cm)} : c));
    setEditCmtId(null);
  };
  const deleteComment = (calloutId, cmtId) => {
    setConfirm({title: 'Delete Comment', message: 'Are you sure you want to delete this comment?', action: () => {
      setCallouts(callouts.map(c => c.id === calloutId ? {...c, comments: c.comments.filter(cm => cm.id !== cmtId)} : c));
    }});
  };

  return (
    <div className={`p-6 h-full flex flex-col ${t.text} animate-in fade-in duration-300`}>
      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} t={t} />

      <div className={`mb-6 flex justify-between items-center pb-4 border-b ${t.border} shrink-0`}>
        <div><h1 className="text-3xl font-black flex items-center gap-3"><ShieldAlert className="text-rose-600"/> Callout Tracker</h1><p className={`text-sm font-medium ${t.muted} mt-1`}>Log and manage Live Operator callouts and disputes.</p></div>
        {user.isAdmin && user.status !== 'Suspended' && (
          <button onClick={() => { setF({ id: null, timestamp: getPHTToday()+'T12:00', brand: brands[0]?.name||'', reporterRole: calloutSettings.roles[0], reporterName: '', assignedOperator: activeLOs[0]?.username||'', reason: '', remarks: '', link: '', author: user.username }); setShowModal(true); }} className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-rose-700 transition-colors"><Plus size={18}/> New Callout Log</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-4">
        {scopedCallouts.length === 0 ? <div className={`text-center py-16 ${t.muted} border-2 border-dashed ${t.border} rounded-2xl`}><ShieldAlert size={32} className="mx-auto mb-3 opacity-30"/><p>No callouts found for this period.</p></div> : 
          scopedCallouts.sort((a,b)=>new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(c => (
             <div key={c.id} className={`${t.card} border ${c.status==='Disputed'?'border-orange-400':c.status==='Rejected'?'border-red-400':c.status==='Accepted'?'border-slate-300 opacity-70':t.border} rounded-xl shadow-sm overflow-hidden flex flex-col transition-all`}>
                <div className={`p-4 flex flex-col sm:flex-row justify-between gap-4 border-b ${t.border} ${c.status==='Disputed'?'bg-orange-50 dark:bg-orange-900/10':c.status==='Rejected'?'bg-red-50 dark:bg-red-900/10':c.status==='Accepted'?'bg-slate-50 dark:bg-slate-900/50':'bg-white dark:bg-slate-900'}`}>
                   <div>
                     <div className="flex items-center gap-3 mb-2"><h3 className="text-lg font-bold">Operator: {c.assignedOperator}</h3><StatusPill status={c.status}/></div>
                     <div className={`text-xs font-bold uppercase tracking-wider ${t.muted} flex flex-wrap items-center gap-x-3 gap-y-1`}><span className="text-blue-600 dark:text-blue-400">@ {c.brand}</span><span>{new Date(c.timestamp).toLocaleString()}</span><span>Reported by: {c.reporterName} ({c.reporterRole})</span></div>
                   </div>
                   <div className="flex gap-2 shrink-0">
                     {c.link && <a href={c.link} target="_blank" rel="noopener noreferrer" className="h-8 px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"><LinkIcon size={14}/> Lark Link</a>}
                     {(user.isAdmin || c.author === user.username) && c.status === 'Active' && user.status !== 'Suspended' && <button onClick={()=>{setF(c); setShowModal(true);}} className="h-8 px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"><Edit size={14}/> Edit</button>}
                     {user.isAdmin && c.status === 'Active' && user.status !== 'Suspended' && <button onClick={()=>setConfirm({title:'Delete Callout', message:'Permanently delete this callout log?', action:()=>setCallouts(callouts.filter(x=>x.id!==c.id))})} className="h-8 w-8 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg"><Trash2 size={14}/></button>}
                   </div>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><span className={`text-[10px] font-bold uppercase ${t.muted} block mb-1`}>Incident Reason</span><p className="text-sm font-medium whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">{c.reason}</p></div>
                  <div><span className={`text-[10px] font-bold uppercase ${t.muted} block mb-1`}>Corrective Remarks</span><p className="text-sm font-medium whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">{c.remarks || 'No remarks provided.'}</p></div>
                </div>

                {(c.status === 'Disputed' || c.status === 'Accepted' || c.status === 'Rejected' || reviewForm?.id === c.id) && (
                  <div className={`p-4 border-t ${t.border} bg-slate-50/50 dark:bg-slate-900/30 space-y-4`}>
                    {c.disputeComment && (
                       <div className="pl-4 border-l-2 border-orange-400"><span className={`text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400 block mb-1`}>Dispute Reason (From {c.assignedOperator})</span><p className="text-sm font-medium">{c.disputeComment}</p></div>
                    )}
                    {c.leadReply && (
                       <div className={`pl-4 border-l-2 ${c.status==='Accepted'?'border-green-400':'border-red-400'}`}><span className={`text-[10px] font-bold uppercase ${c.status==='Accepted'?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'} block mb-1`}>Lead Decision ({c.status})</span><p className="text-sm font-medium">{c.leadReply}</p></div>
                    )}

                    {reviewForm?.id === c.id && (c.status === 'Active' || (c.status === 'Disputed' && !user.isAdmin)) && (
                       <div className="pt-2 animate-in fade-in">
                         <label className={`text-[10px] font-bold uppercase ${t.muted} block mb-1`}>Your Dispute Reason</label>
                         <textarea autoFocus value={disputeText} onChange={e=>setDisputeText(e.target.value)} placeholder="Explain why this callout is invalid..." className={`w-full p-3 text-sm rounded-lg border outline-none ${t.input} mb-3`} rows="2"></textarea>
                         <div className="flex gap-2 justify-end"><button onClick={()=>setReviewForm(null)} className={`px-4 py-2 text-xs font-bold rounded-lg border ${t.border} ${t.muted}`}>Cancel</button><button onClick={()=>submitDispute(c.id)} className="px-4 py-2 text-xs font-bold rounded-lg bg-orange-500 text-white shadow-sm hover:bg-orange-600">{c.status === 'Disputed' ? 'Update Dispute' : 'Submit Dispute'}</button></div>
                       </div>
                    )}

                    {reviewForm?.id === c.id && (c.status === 'Disputed' || c.status === 'Accepted' || c.status === 'Rejected') && user.isAdmin && (
                       <div className="pt-2 animate-in fade-in">
                         <label className={`text-[10px] font-bold uppercase ${t.muted} block mb-1`}>Lead Review Remarks</label>
                         <textarea autoFocus value={reviewForm.text} onChange={e=>setReviewForm({...reviewForm, text:e.target.value})} placeholder="Provide explanation (required if rejecting)..." className={`w-full p-3 text-sm rounded-lg border outline-none ${t.input} mb-3`} rows="2"></textarea>
                         <div className="flex gap-2 justify-end"><button onClick={()=>setReviewForm(null)} className={`px-4 py-2 text-xs font-bold rounded-lg border ${t.border} ${t.muted}`}>Cancel</button><button onClick={()=>submitReview(c.id, 'Rejected')} className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-700 flex items-center gap-1"><ThumbsDown size={14}/> Reject Dispute (Keep Callout)</button><button onClick={()=>submitReview(c.id, 'Accepted')} className="px-4 py-2 text-xs font-bold rounded-lg bg-green-600 text-white shadow-sm hover:bg-green-700 flex items-center gap-1"><ThumbsUp size={14}/> Accept Dispute (Forgive)</button></div>
                       </div>
                    )}
                  </div>
                )}

                {user.status !== 'Suspended' && !reviewForm && c.status === 'Active' && user.username === c.assignedOperator && (
                  <div className={`p-3 border-t ${t.border} bg-slate-50 dark:bg-slate-900 flex justify-end`}><button onClick={()=>{setReviewForm({id:c.id}); setDisputeText('');}} className="text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400 border border-orange-200 dark:border-orange-800 px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"><MessageCircle size={14}/> Dispute This Callout</button></div>
                )}
                {user.status !== 'Suspended' && !reviewForm && c.status === 'Disputed' && user.username === c.assignedOperator && (
                  <div className={`p-3 border-t ${t.border} bg-slate-50 dark:bg-slate-900 flex justify-end`}><button onClick={()=>{setReviewForm({id:c.id}); setDisputeText(c.disputeComment);}} className="text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400 border border-orange-200 dark:border-orange-800 px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"><Edit size={14}/> Edit Dispute</button></div>
                )}
                {user.status !== 'Suspended' && !reviewForm && c.status === 'Disputed' && user.isAdmin && (
                  <div className={`p-3 border-t ${t.border} bg-slate-50 dark:bg-slate-900 flex justify-end`}><button onClick={()=>{setReviewForm({id:c.id, text:''});}} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"><Shield size={14}/> Review Dispute</button></div>
                )}
                {user.status !== 'Suspended' && !reviewForm && (c.status === 'Accepted' || c.status === 'Rejected') && user.isAdmin && (
                  <div className={`p-3 border-t ${t.border} bg-slate-50 dark:bg-slate-900 flex justify-end`}><button onClick={()=>{setReviewForm({id:c.id, text:c.leadReply});}} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"><Edit size={14}/> Re-evaluate Decision</button></div>
                )}

                {user.isAdmin && (
                <div className={`p-4 border-t ${t.border} bg-slate-50/30 dark:bg-slate-900/10`}>
                   <h4 className={`text-xs font-bold ${t.muted} mb-2 flex items-center gap-1.5`}><MessageSquare size={12}/> Internal Comments (Admins Only)</h4>
                   {(c.comments||[]).map(cmt => (
                      <div key={cmt.id} className={`mb-2 p-2 bg-white dark:bg-slate-800 rounded border ${t.border} text-xs`}>
                         <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2"><span className="font-bold">{cmt.author}</span><span className={`text-[10px] ${t.muted}`}>{new Date(cmt.date).toLocaleString()}</span></div>
                            {(user.username === cmt.author) && (
                               <div className="flex gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                 <button onClick={()=>startEditComment(cmt)} className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"><Edit size={12}/></button>
                                 <button onClick={()=>deleteComment(c.id, cmt.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400"><Trash2 size={12}/></button>
                               </div>
                            )}
                         </div>
                         {editCmtId === cmt.id ? (
                            <div className="flex gap-2 mt-1">
                              <input value={editCmtText} onChange={e=>setEditCmtText(e.target.value)} className={`flex-1 p-1 rounded border outline-none ${t.input}`}/>
                              <button onClick={()=>saveEditComment(c.id)} className="px-2 bg-blue-500 text-white rounded text-[10px] font-bold">Save</button>
                              <button onClick={()=>setEditCmtId(null)} className={`px-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] font-bold`}>Cancel</button>
                            </div>
                         ) : (
                            <p className="font-medium">{cmt.text}</p>
                         )}
                      </div>
                   ))}
                   <div className="flex gap-2 mt-3">
                      <input value={commentText[c.id]||''} onChange={e=>setCommentText({...commentText, [c.id]: e.target.value})} placeholder="Add a discussion comment..." className={`flex-1 p-2 text-xs font-medium rounded border ${t.border} outline-none ${t.input}`} />
                      <button onClick={()=>submitCalloutComment(c.id)} className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Send</button>
                   </div>
                </div>
                )}
             </div>
          ))
        }
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[99999] flex items-start justify-center p-4 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
          <div className={`${t.card} rounded-2xl shadow-2xl max-w-2xl w-full p-6 border ${t.border} animate-in fade-in zoom-in-95 duration-200 my-8`}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800"><h2 className="text-xl font-black flex items-center gap-2"><ShieldAlert className="text-rose-600"/> {f.id ? 'Edit Callout Log' : 'New Callout Log'}</h2><button onClick={()=>setShowModal(false)} className={`p-2 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors ${t.muted}`}><X size={20}/></button></div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div><label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Timestamp</label><input required type="datetime-local" value={f.timestamp} onChange={e=>setF({...f, timestamp:e.target.value})} className={`w-full p-2.5 text-sm font-bold rounded-xl border outline-none ${t.input}`} /></div>
                 <div>
                    <label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Brand</label>
                    <select required value={f.brand} onChange={e=>setF({...f, brand:e.target.value})} className={`w-full p-2.5 text-sm font-bold rounded-xl border outline-none ${t.input}`}>
                      <option value="" disabled>Select Brand</option>
                      {brands.filter(b=>b.contractStatus==='Active').map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                 <div className="sm:col-span-2"><h4 className={`text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2`}>Reporting Person</h4></div>
                 <div>
                    <label className={`block text-[10px] font-bold uppercase ${t.muted} mb-1`}>Role</label>
                    <select value={f.reporterRole} onChange={e=>{setF({...f, reporterRole:e.target.value, reporterName:''});}} className={`w-full p-2 text-sm font-bold rounded-lg border outline-none ${t.input}`}>
                      {calloutSettings.roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className={`block text-[10px] font-bold uppercase ${t.muted} mb-1`}>Name</label>
                    <input required placeholder="Type or select name" list={`reporters-${f.reporterRole.replace(/\s+/g,'-')}`} value={f.reporterName} onChange={e=>setF({...f, reporterName:e.target.value})} className={`w-full p-2 text-sm font-bold rounded-lg border outline-none ${t.input}`} />
                    <datalist id={`reporters-${f.reporterRole.replace(/\s+/g,'-')}`}>
                       {calloutSettings.reporters.filter(r=>r.role===f.reporterRole).map(r => <option key={r.id} value={r.name}/>)}
                    </datalist>
                 </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Assigned Operator (Callout for)</label>
                <select required value={f.assignedOperator} onChange={e=>setF({...f, assignedOperator:e.target.value})} className={`w-full p-2.5 text-sm font-bold rounded-xl border outline-none ${t.input}`}>
                  <option value="" disabled>Select Operator</option>
                  {activeLOs.map(lo => <option key={lo.id} value={lo.username}>{lo.username} ({lo.fullName})</option>)}
                </select>
              </div>

              <div><label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Incident Reason</label><textarea required rows="3" placeholder="Describe the incident..." value={f.reason} onChange={e=>setF({...f, reason:e.target.value})} className={`w-full p-3 text-sm font-medium rounded-xl border outline-none resize-none ${t.input}`}></textarea></div>
              <div><label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Corrective Remarks</label><textarea rows="2" placeholder="Action taken or coaching applied..." value={f.remarks} onChange={e=>setF({...f, remarks:e.target.value})} className={`w-full p-3 text-sm font-medium rounded-xl border outline-none resize-none ${t.input}`}></textarea></div>
              
              <div>
                <label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Callout Link (Lark)</label>
                <div className="relative"><LinkIcon className={`absolute left-3 top-2.5 h-4 w-4 ${t.muted}`} /><input type="url" placeholder="https://..." value={f.link} onChange={e=>setF({...f, link:e.target.value})} className={`w-full pl-9 pr-3 py-2.5 text-sm font-semibold rounded-xl border outline-none ${t.input}`} /></div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 mt-4"><button type="button" onClick={()=>setShowModal(false)} className={`px-5 py-2.5 rounded-xl text-sm font-bold border ${t.border} hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}>Cancel</button><button type="submit" className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-rose-700 transition-colors">Save Callout Log</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MCNTrackerView = ({ mcnEvents, setMcnEvents, mcnSettings, users, t, user, filterMonth }) => {
  const [showModal, setShowModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [f, setF] = useState({ id: null, date: getPHTToday(), time: '12:00', status: 'Pending', company: mcnSettings.companies[0]?.name || '', platform: mcnSettings.platforms[0]?.name || '', brand: '', creator: '', venue: mcnSettings.venues[0]?.name || '', setup: 'Greenscreen', inCharge: [], backup: [] });
  
  const [filters, setFilters] = useState({ status: ['Confirmed', 'Pending'], company: 'ALL', search: '' });

  const getAssignedCount = (username) => mcnEvents.filter(e => ['Confirmed', 'Pending'].includes(e.status) && (e.inCharge?.includes(username) || e.backup?.includes(username))).length;
  const getBusyUsers = (date, currentEventId) => { let busy = []; mcnEvents.forEach(e => { if (e.date === date && e.id !== currentEventId && ['Confirmed', 'Pending'].includes(e.status)) { if(e.inCharge) busy.push(...e.inCharge); if(e.backup) busy.push(...e.backup); } }); return [...new Set(busy)]; };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = { ...f, day: getDayOfWeek(f.date) };
    if (f.id) setMcnEvents(mcnEvents.map(ev => ev.id === f.id ? payload : ev));
    else setMcnEvents([{ ...payload, id: Date.now() }, ...mcnEvents]);
    setShowModal(false);
  };

  const deleteEvent = (id) => setConfirm({ title: 'Delete Event', message: 'Permanently delete this MCN event?', action: () => setMcnEvents(mcnEvents.filter(e => e.id !== id)) });
  const toggleFilterStatus = (st) => setFilters(prev => ({ ...prev, status: prev.status.includes(st) ? prev.status.filter(s => s !== st) : [...prev.status, st] }));

  const activeUsers = users.filter(u => u.status !== 'Terminated');
  const busyUsernames = getBusyUsers(f.date, f.id);

  const scopedMCN = user.isAdmin ? mcnEvents : mcnEvents.filter(ev => ev.inCharge?.includes(user.username) || ev.backup?.includes(user.username));

  const displayedEvents = scopedMCN.filter(ev => {
    if (filters.status.length > 0 && !filters.status.includes(ev.status)) return false;
    if (filterMonth !== 'ALL' && ev.date?.substring(0,7) !== filterMonth) return false;
    if (filters.company !== 'ALL' && ev.company !== filters.company) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!ev.brand?.toLowerCase().includes(q) && !ev.creator?.toLowerCase().includes(q) && !ev.inCharge?.some(u=>u.toLowerCase().includes(q)) && !ev.backup?.some(u=>u.toLowerCase().includes(q))) return false;
    }
    return true;
  }).sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  return (
    <div className={`p-6 h-full flex flex-col ${t.text} animate-in fade-in duration-300`}>
      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} t={t} />

      <div className={`mb-6 flex justify-between items-center pb-4 border-b ${t.border} shrink-0`}>
        <div><h1 className="text-3xl font-black flex items-center gap-3"><CalendarDays className="text-blue-600"/> MCN Tracker</h1><p className={`text-sm font-medium ${t.muted} mt-1`}>Manage and schedule MCN Live Events.</p></div>
        {user.isAdmin && user.status !== 'Suspended' && (
          <button onClick={() => { setF({ id: null, date: getPHTToday(), time: '12:00', status: 'Pending', company: mcnSettings.companies[0]?.name || '', platform: mcnSettings.platforms[0]?.name || '', brand: '', creator: '', venue: mcnSettings.venues[0]?.name || '', setup: 'Greenscreen', inCharge: [], backup: [] }); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-colors"><Plus size={18}/> Schedule Event</button>
        )}
      </div>

      <div className={`mb-6 flex flex-wrap gap-4 ${t.card} p-4 rounded-xl border ${t.border} shadow-sm shrink-0`}>
        <div className="flex gap-2">
           {['Confirmed', 'Pending', 'Cancelled', 'Done'].map(st => (
             <button key={st} onClick={() => toggleFilterStatus(st)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${filters.status.includes(st) ? (st==='Confirmed'?'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-400':st==='Pending'?'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400':st==='Cancelled'?'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-400':'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-700 dark:text-emerald-200') : `bg-transparent ${t.muted} border-dashed ${t.border} hover:bg-slate-50 dark:hover:bg-slate-800`}`}>{st}</button>
           ))}
        </div>
        <div className="flex gap-2 flex-1">
          <select value={filters.company} onChange={e=>setFilters({...filters, company:e.target.value})} className={`px-3 py-1.5 text-xs font-bold rounded-lg border outline-none ${t.input}`}>
            <option value="ALL">All Companies</option>
            {mcnSettings.companies?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <div className="relative flex-1 max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CalendarDays size={14} className={t.muted}/></div>
            <input placeholder="Search brand, creator, host..." value={filters.search} onChange={e=>setFilters({...filters, search:e.target.value})} className={`w-full pl-9 pr-3 py-1.5 text-xs font-bold rounded-lg border outline-none ${t.input}`} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 space-y-3">
        {displayedEvents.length === 0 ? <div className={`text-center py-16 ${t.muted} border-2 border-dashed ${t.border} rounded-2xl`}><CalendarDays size={32} className="mx-auto mb-3 opacity-30"/><p>No events found for the selected filters.</p></div> : 
          displayedEvents.map(ev => {
            const compColor = mcnSettings.companies?.find(c => c.name === ev.company)?.color || '#3B82F6';
            const isMyEvent = ev.inCharge?.includes(user.username) || ev.backup?.includes(user.username);
            
            return (
              <div key={ev.id} className={`${t.card} border ${isMyEvent ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' : t.border} ${ev.status === 'Cancelled' ? 'border-l-8 border-l-rose-500' : ev.status === 'Done' ? 'border-l-8 border-l-emerald-500' : 'border-l-8'} rounded-xl overflow-hidden flex flex-col sm:flex-row transition-all`} style={{ borderLeftColor: (ev.status!=='Cancelled'&&ev.status!=='Done') ? compColor : undefined }}>
                <div className={`w-full sm:w-32 flex sm:flex-col justify-between sm:justify-center items-center p-4 border-b sm:border-b-0 sm:border-r border-dashed ${t.border} ${ev.status==='Cancelled'?'bg-rose-50/50 dark:bg-rose-900/10':ev.status==='Done'?'bg-emerald-50/50 dark:bg-emerald-900/10':'bg-slate-50/50 dark:bg-slate-900/50'}`}>
                   <div className="text-center"><span className="block text-2xl font-black">{new Date(ev.date).getDate() || '--'}</span><span className={`text-[10px] font-bold uppercase tracking-wider ${t.muted}`}>{new Date(ev.date).toLocaleString('default', {month:'short'})} • {getDayOfWeek(ev.date)?.substring(0,3)}</span></div>
                   <div className="text-center mt-2"><span className={`inline-block px-2 py-1 rounded text-xs font-bold bg-white dark:bg-slate-800 border ${t.border}`}>{ev.time}</span></div>
                </div>
                <div className="flex-1 p-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold truncate flex items-center gap-2"><span className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: compColor}}></span> {ev.brand}</h3>
                      <StatusPill status={ev.status} />
                    </div>
                    <div className={`text-sm font-medium ${t.muted} mb-3 flex items-center gap-1.5`}><UserIcon size={14}/> Creator/Host: <span className={t.text}>{ev.creator}</span></div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700" style={{borderLeft: `4px solid ${compColor}`}}>{ev.company}</span>
                      <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">{ev.platform}</span>
                      <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800">{ev.venue} ({ev.setup})</span>
                    </div>
                  </div>
                  <div className={`w-full sm:w-48 shrink-0 flex flex-col gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l ${t.border} sm:pl-4`}>
                    <div><span className={`text-[9px] font-bold uppercase ${t.muted} block mb-1`}>In-Charge</span><div className="flex flex-wrap gap-1">{ev.inCharge?.length ? ev.inCharge.map(u => <span key={u} className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">{u}</span>) : <span className="text-xs text-slate-400 italic">None</span>}</div></div>
                    <div><span className={`text-[9px] font-bold uppercase ${t.muted} block mb-1`}>Backup</span><div className="flex flex-wrap gap-1">{ev.backup?.length ? ev.backup.map(u => <span key={u} className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">{u}</span>) : <span className="text-xs text-slate-400 italic">None</span>}</div></div>
                  </div>
                </div>
                {user.isAdmin && user.status !== 'Suspended' && (
                  <div className={`p-3 bg-slate-50 dark:bg-slate-900 border-t sm:border-t-0 sm:border-l ${t.border} flex sm:flex-col justify-center gap-2`}>
                    <button onClick={()=>{setF(ev); setShowModal(true);}} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit size={16}/></button>
                    <button onClick={()=>deleteEvent(ev.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </div>
                )}
              </div>
            );
          })
        }
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[99999] flex items-start justify-center p-4 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
          <div className={`${t.card} rounded-2xl shadow-2xl max-w-4xl w-full p-6 border ${t.border} animate-in fade-in zoom-in-95 duration-200 flex flex-col`}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800"><h2 className="text-xl font-black flex items-center gap-2"><CalendarDays className="text-blue-600"/> {f.id ? 'Edit Event' : 'Schedule New Event'}</h2><button onClick={()=>setShowModal(false)} className={`p-2 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors ${t.muted}`}><X size={20}/></button></div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div><label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Date</label><input required type="date" value={f.date} onChange={e=>setF({...f, date:e.target.value})} className={`w-full p-2.5 text-sm font-bold rounded-xl border outline-none ${t.input}`} /></div>
                <div><label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Time</label><input required type="time" value={f.time} onChange={e=>setF({...f, time:e.target.value})} className={`w-full p-2.5 text-sm font-bold rounded-xl border outline-none ${t.input}`} /></div>
                <div>
                  <label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Status</label>
                  <select value={f.status} onChange={e=>setF({...f, status:e.target.value})} className={`w-full p-2.5 text-sm font-bold rounded-xl border outline-none ${t.input}`}>
                    <option value="Confirmed">Confirmed</option><option value="Pending">Pending</option><option value="Cancelled">Cancelled</option><option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                 <div>
                    <label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Company</label>
                    <select required value={f.company} onChange={e=>setF({...f, company:e.target.value})} className={`w-full p-2.5 text-sm font-bold rounded-xl border outline-none ${t.input}`}>
                      <option value="" disabled>Select Company</option>
                      {mcnSettings.companies?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Platform</label>
                    <select required value={f.platform} onChange={e=>setF({...f, platform:e.target.value})} className={`w-full p-2.5 text-sm font-bold rounded-xl border outline-none ${t.input}`}>
                      <option value="" disabled>Select Platform</option>
                      {mcnSettings.platforms?.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                 </div>
                 <div><label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Brand Name</label><input required placeholder="e.g. Maybelline" value={f.brand} onChange={e=>setF({...f, brand:e.target.value})} className={`w-full p-2.5 text-sm font-bold rounded-xl border outline-none ${t.input}`} /></div>
                 <div><label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Creator / Host</label><input required placeholder="e.g. John Doe" value={f.creator} onChange={e=>setF({...f, creator:e.target.value})} className={`w-full p-2.5 text-sm font-bold rounded-xl border outline-none ${t.input}`} /></div>
                 <div>
                    <label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Venue</label>
                    <select required value={f.venue} onChange={e=>setF({...f, venue:e.target.value})} className={`w-full p-2.5 text-sm font-bold rounded-xl border outline-none ${t.input}`}>
                      <option value="" disabled>Select Venue</option>
                      {mcnSettings.venues?.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Setup Type</label>
                    <select value={f.setup} onChange={e=>setF({...f, setup:e.target.value})} className={`w-full p-2.5 text-sm font-bold rounded-xl border outline-none ${t.input}`}>
                      <option value="Greenscreen">Greenscreen</option><option value="Bluescreen">Bluescreen</option><option value="Purplescreen">Purplescreen</option><option value="Set Design">Set Design</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 relative z-[100]">
                 <div>
                   <label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Assign In-Charge</label>
                   <div className={`p-3 rounded-xl border ${t.border} bg-white dark:bg-slate-900 max-h-48 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2`}>
                     {activeUsers.map(u => {
                       const isBusy = busyUsernames.includes(u.username);
                       const isBackup = f.backup.includes(u.username);
                       const disabled = isBusy || isBackup;
                       return (
                         <label key={`ic-${u.username}`} className={`flex items-center gap-2 p-2 rounded border transition-colors ${disabled ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700' : 'hover:bg-blue-50 cursor-pointer dark:hover:bg-blue-900/30'}`}>
                           <input type="checkbox" disabled={disabled} checked={f.inCharge.includes(u.username)} onChange={(e) => { const newArr = e.target.checked ? [...f.inCharge, u.username] : f.inCharge.filter(x => x !== u.username); setF({...f, inCharge: newArr}); }} className="accent-blue-600 w-4 h-4 rounded" />
                           <div className="flex flex-col min-w-0">
                             <span className="text-xs font-bold truncate">{u.username}</span>
                             <span className="text-[9px] font-semibold text-slate-500">{isBusy ? 'Busy today' : isBackup ? 'In Backup' : `${getAssignedCount(u.username)} events`}</span>
                           </div>
                         </label>
                       )
                     })}
                   </div>
                 </div>
                 <div>
                   <label className={`block text-xs font-bold uppercase ${t.muted} mb-1.5`}>Assign Backup</label>
                   <div className={`p-3 rounded-xl border ${t.border} bg-white dark:bg-slate-900 max-h-48 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2`}>
                     {activeUsers.map(u => {
                       const isBusy = busyUsernames.includes(u.username);
                       const isInCharge = f.inCharge.includes(u.username);
                       const disabled = isBusy || isInCharge;
                       return (
                         <label key={`bk-${u.username}`} className={`flex items-center gap-2 p-2 rounded border transition-colors ${disabled ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700' : 'hover:bg-amber-50 cursor-pointer dark:hover:bg-amber-900/30'}`}>
                           <input type="checkbox" disabled={disabled} checked={f.backup.includes(u.username)} onChange={(e) => { const newArr = e.target.checked ? [...f.backup, u.username] : f.backup.filter(x => x !== u.username); setF({...f, backup: newArr}); }} className="accent-amber-600 w-4 h-4 rounded" />
                           <div className="flex flex-col min-w-0">
                             <span className="text-xs font-bold truncate">{u.username}</span>
                             <span className="text-[9px] font-semibold text-slate-500">{isBusy ? 'Busy today' : isInCharge ? 'In Charge' : `${getAssignedCount(u.username)} events`}</span>
                           </div>
                         </label>
                       )
                     })}
                   </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 mt-4 pb-4"><button type="button" onClick={()=>setShowModal(false)} className={`px-5 py-2.5 rounded-xl text-sm font-bold border ${t.border} hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}>Cancel</button><button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">{f.id ? 'Save Updates' : 'Schedule Event'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TSPMainView = ({ brands, setBrands, t, user, contextTrigger, clearAlarm, filterModeExt, resetCounter }) => {
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  const [confirm, setConfirm] = useState(null);
  const [replyForm, setReplyForm] = useState(null); 
  const [campForm, setCampForm] = useState(null);
  const [assetForm, setAssetForm] = useState(null);
  const [expandedCampId, setExpandedCampId] = useState(null); 
  const [filterMode, setFilterMode] = useState(filterModeExt || 'ALL');
  const [logForm, setLogForm] = useState({ id: null, status: 'Active', details: '', larkLink: '', tasks: [] });

  useEffect(() => { setSelectedBrandId(null); setFilterMode('ALL'); }, [resetCounter]);

  useEffect(() => {
    if (contextTrigger && contextTrigger.ts) {
      if (selectedBrandId !== contextTrigger.bId) setSelectedBrandId(contextTrigger.bId);
      setActiveTab('history');
      setTimeout(() => {
        const el = document.getElementById(`task-${contextTrigger.tkId}`);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-4', 'ring-blue-400', 'ring-offset-2', 'ring-offset-slate-50', 'dark:ring-offset-slate-900'); setTimeout(() => el.classList.remove('ring-4', 'ring-blue-400', 'ring-offset-2', 'ring-offset-slate-50', 'dark:ring-offset-slate-900'), 2000); }
      }, 500); 
    }
  }, [contextTrigger]);

  const activeBrands = brands.filter(b => b.contractStatus === 'Active');
  const scopedBrands = activeBrands;
  
  const displayedBrands = scopedBrands.filter(b => {
    if (filterMode === 'ALL') return true;
    if (filterMode === 'Active Tasks') return b.logs.some(l => l.tasks?.some(t => !t.completed && t.status === 'Task'));
    if (filterMode === 'Assigned') return user.assignedBrands?.includes(b.name);
    return b.currentStatus === filterMode;
  });

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const saveLogEntry = (e) => {
    e.preventDefault(); 
    if (!selectedBrand) return;
    const now = new Date().toISOString();
    const updatedTasks = logForm.tasks.filter(tk => tk.desc.trim()).map(tk => ({ ...tk, status: tk.status || 'Task', replies: tk.replies || [], completed: tk.completed || false, completedBy: tk.completedBy || null, workingOn: null }));
    updatedTasks.forEach(tk => { if (!tk.completed && (tk.status === 'Pending' || tk.status === 'Issue') && tk.repeatingInterval) { if (clearAlarm) clearAlarm(`task-${tk.id}`); } });

    const newLog = logForm.id ? { ...logForm, tasks: updatedTasks } : { id: Date.now(), date: now, author: user.username, status: logForm.status, details: logForm.details, larkLink: logForm.larkLink, tasks: updatedTasks, replies: [] };
    
    setBrands(brands.map(b => {
      if (b.id !== selectedBrand.id) return b;
      const updatedLogs = logForm.id ? b.logs.map(l => l.id === logForm.id ? newLog : l) : [newLog, ...b.logs];
      return { ...b, currentStatus: getAggregatedStatus(updatedLogs), logs: updatedLogs };
    }));
    setShowLogModal(false); setLogForm({ id: null, status: 'Active', details: '', larkLink: '', tasks: [] });
  };

  const submitReply = (logId, taskId = null) => {
    if(!replyForm.text.trim() && !replyForm.status) return;
    const reply = { id: Date.now(), author: user.username, date: new Date().toISOString(), text: replyForm.text, statusChange: replyForm.status };
    if (clearAlarm) clearAlarm(`task-${taskId}`);

    setBrands(brands.map(b => {
      if (b.id !== selectedBrand.id) return b;
      const newLogs = b.logs.map(l => {
        if (l.id !== logId) return l;
        if (taskId) return { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, workingOn: null, status: replyForm.status || t.status, repeatingInterval: replyForm.repeat || t.repeatingInterval, replies: [...(t.replies||[]), reply] } : t) };
        return { ...l, status: replyForm.status || l.status, replies: [...(l.replies||[]), reply] };
      });
      return { ...b, currentStatus: getAggregatedStatus(newLogs), logs: newLogs };
    }));
    setReplyForm(null);
  };

  const deleteLog = (logId) => setConfirm({ title: 'Delete Log', message: 'Permanently delete this log entry?', action: () => setBrands(brands.map(b => b.id === selectedBrand.id ? { ...b, currentStatus: getAggregatedStatus(b.logs.filter(l => l.id !== logId)), logs: b.logs.filter(l => l.id !== logId) } : b)) });

  const toggleTask = (logId, taskId) => {
    let targetTask; selectedBrand.logs.forEach(l => { if(l.id === logId) targetTask = l.tasks.find(t => t.id === taskId); });
    if(targetTask?.completed && targetTask.completedBy !== user.username && !user.isAdmin) return setConfirm({ title: 'Notice', message: 'Only the user who marked this as done (or an Admin) can uncheck it.', action: () => {} });
    if (clearAlarm) clearAlarm(`task-${taskId}`);

    setBrands(brands.map(b => {
      if (b.id !== selectedBrand.id) return b;
      const newLogs = b.logs.map(l => l.id === logId ? { ...l, tasks: l.tasks.map(t => t.id === taskId ? { ...t, workingOn: null, completed: !t.completed, completedBy: !t.completed ? user.username : null, status: !t.completed ? 'Done' : 'Task' } : t) } : l);
      return { ...b, currentStatus: getAggregatedStatus(newLogs), logs: newLogs };
    }));
  };

  const scrollToElement = (id) => {
    setActiveTab('history');
    setTimeout(() => { const el = document.getElementById(id); if(el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-4', 'ring-blue-400', 'ring-offset-2', 'ring-offset-slate-50', 'dark:ring-offset-slate-900'); setTimeout(() => el.classList.remove('ring-4', 'ring-blue-400', 'ring-offset-2', 'ring-offset-slate-50', 'dark:ring-offset-slate-900'), 2000); } }, 100);
  };

  if (!selectedBrand) {
    const metrics = {
      active: scopedBrands.filter(b => b.currentStatus === 'Active').length,
      tasks: scopedBrands.filter(b => b.logs.some(l => l.tasks?.some(t => !t.completed && (t.status === 'Task' || t.status === 'Active')))).length,
      pending: scopedBrands.filter(b => b.currentStatus === 'Pending').length,
      issue: scopedBrands.filter(b => b.currentStatus === 'Issue').length,
    };

    return (
      <div className={`p-6 h-full flex flex-col ${t.text} animate-in fade-in duration-300`}>
        <div className={`mb-6 pb-4 border-b ${t.border}`}><h1 className="text-3xl font-black">TikTok Shop Partners</h1><p className={`text-sm font-medium ${t.muted} mt-1`}>Overview of all active brand partnerships.</p></div>
        
        <div className="flex flex-col gap-4 mb-6 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div onClick={()=>setFilterMode(filterMode === 'Active' ? 'ALL' : 'Active')} className={`${t.card} border ${filterMode==='Active'?'border-green-500 ring-2 ring-green-200':t.border} p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all`}><div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg"><CheckCircle2 size={24} /></div><div><p className={`text-xs font-bold ${t.muted} uppercase`}>Active</p><h3 className="text-2xl font-black">{metrics.active}</h3></div></div>
            <div onClick={()=>setFilterMode(filterMode === 'Active Tasks' ? 'ALL' : 'Active Tasks')} className={`${t.card} border ${filterMode==='Active Tasks'?'border-blue-500 ring-2 ring-blue-200':t.border} p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all`}><div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg"><ClipboardList size={24} /></div><div><p className={`text-xs font-bold ${t.muted} uppercase`}>Tasks</p><h3 className="text-2xl font-black">{metrics.tasks}</h3></div></div>
            <div onClick={()=>setFilterMode(filterMode === 'Pending' ? 'ALL' : 'Pending')} className={`${t.card} border ${filterMode==='Pending'?'border-amber-500 ring-2 ring-amber-200':t.border} p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all`}><div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg"><Clock size={24} /></div><div><p className={`text-xs font-bold ${t.muted} uppercase`}>Pending</p><h3 className="text-2xl font-black">{metrics.pending}</h3></div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={()=>setFilterMode(filterMode === 'Issue' ? 'ALL' : 'Issue')} className={`${t.card} border ${filterMode==='Issue'?'border-red-500 ring-2 ring-red-200':t.border} p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all`}><div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg"><AlertOctagon size={24} /></div><div><p className={`text-xs font-bold ${t.muted} uppercase`}>Issues</p><h3 className="text-2xl font-black">{metrics.issue}</h3></div></div>
            <div onClick={()=>setFilterMode(filterMode === 'Assigned' ? 'ALL' : 'Assigned')} className={`${t.card} border ${filterMode==='Assigned'?'border-indigo-500 ring-2 ring-indigo-200':t.border} p-4 rounded-xl shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all`}><div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg"><Briefcase size={24} /></div><div><p className={`text-xs font-bold ${t.muted} uppercase`}>Assigned To Me</p><h3 className="text-2xl font-black">{user.assignedBrands?.length||0}</h3></div></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 overflow-y-auto custom-scrollbar pb-10">
          {displayedBrands.length === 0 ? <p className={`col-span-full text-center py-12 ${t.muted}`}>No brands match the selected filter or you have no assigned brands.</p> : 
            displayedBrands.map(b => {
            const nowMs = Date.now();
            const taskIssues = b.logs.reduce((sum, l) => sum + (l.tasks?.filter(tk => !tk.completed && tk.status === 'Issue').length || 0), 0);
            const taskPendings = b.logs.reduce((sum, l) => sum + (l.tasks?.filter(tk => !tk.completed && tk.status === 'Pending').length || 0), 0);
            const taskActives = b.logs.reduce((sum, l) => sum + (l.tasks?.filter(tk => !tk.completed && (tk.status === 'Task' || tk.status === 'Active')).length || 0), 0);
            const taskOverdues = b.logs.reduce((sum, l) => sum + (l.tasks?.filter(tk => !tk.completed && tk.dueDate && new Date(tk.dueDate).getTime() < nowMs).length || 0), 0);
            
            return (
              <div key={b.id} onClick={() => { setSelectedBrandId(b.id); setActiveTab('history'); setExpandedCampId(null); }} className={`relative p-5 rounded-2xl border ${t.border} ${t.card} hover:shadow-lg transition-all cursor-pointer group flex flex-col hover:border-blue-400`}>
                <div className="flex justify-between items-start mb-3"><h3 className="text-lg font-bold group-hover:text-blue-600 transition-colors">{b.name}</h3><StatusPill status={b.currentStatus} /></div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {taskIssues > 0 && <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase border border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">{taskIssues} Issue</span>}
                  {taskOverdues > 0 && <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded text-[10px] font-bold uppercase border border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800">{taskOverdues} Overdue</span>}
                  {taskPendings > 0 && <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded text-[10px] font-bold uppercase border border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">{taskPendings} Pending</span>}
                  {taskActives > 0 && <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">{taskActives} Active</span>}
                </div>
                <p className={`text-sm ${t.muted} line-clamp-2 font-medium flex-1`}>{b.logs[0] ? b.logs[0].details : 'No logs yet.'}</p>
                <div className={`mt-4 pt-3 border-t ${t.border} flex justify-between items-center text-xs font-bold ${t.muted}`}><span><History size={12} className="inline mr-1"/>{b.logs.length} Logs</span><span>{b.logs[0] ? new Date(b.logs[0].date).toLocaleDateString() : '--'}</span></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  let pendingTasks = []; let completedTasks = [];
  selectedBrand.logs.forEach(l => l.tasks?.forEach(t => { const td = {...t, logId: l.id, logLarkLink: l.larkLink, logAuthor: l.author}; t.completed ? completedTasks.push(td) : pendingTasks.push(td); }));

  return (
    <div className={`h-full flex flex-col ${t.text} animate-in fade-in slide-in-from-right-4 duration-300`}>
      <ConfirmModal confirm={confirm} onClose={() => setConfirm(null)} t={t} />
      
      <div className={`p-6 pb-4 border-b ${t.border} shrink-0 bg-white dark:bg-slate-950 shadow-sm z-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedBrandId(null)} className={`p-2 rounded-xl border ${t.border} hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}><ChevronLeft size={20}/></button>
          <div><h2 className="text-2xl font-black flex items-center gap-3">{selectedBrand.name} <StatusPill status={selectedBrand.currentStatus} size="lg"/></h2><p className={`text-sm font-medium ${t.muted}`}>Brand Dashboard</p></div>
        </div>
        {user.status !== 'Suspended' && (
          <button onClick={() => { setLogForm({ id: null, status: selectedBrand.currentStatus, details: '', larkLink: '', tasks: [] }); setShowLogModal(true); }} className="shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md transition-all"><Plus size={18}/> New Log Entry</button>
        )}
      </div>

      <div className={`px-6 pt-4 flex gap-6 border-b ${t.border} shrink-0 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto custom-scrollbar`}>
        {[{id:'history',l:'History Logs',i:History}, {id:'tasks',l:`Pending Tasks (${pendingTasks.length})`,i:Clock}, {id:'livescene',l:'Livescene Collection',i:FolderOpen}].map(tb => (
          <button key={tb.id} onClick={() => setActiveTab(tb.id)} className={`flex items-center gap-2 pb-3 font-bold text-sm transition-colors border-b-[3px] whitespace-nowrap ${activeTab===tb.id ? 'border-blue-600 text-blue-600' : `border-transparent ${t.muted} hover:${t.text}`}`}><tb.i size={16}/>{tb.l}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-slate-50/30 dark:bg-black/10">
        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {selectedBrand.logs.length === 0 ? <div className={`text-center py-16 ${t.muted} border-2 border-dashed ${t.border} rounded-2xl`}><History size={32} className="mx-auto mb-3 opacity-30"/><p>No history logs available yet.</p></div> : 
              selectedBrand.logs.map(log => (
                <div key={log.id} id={`log-${log.id}`} className="relative pl-4 sm:pl-8 transition-all duration-300 rounded-xl">
                  <div className={`absolute left-[11px] sm:left-[27px] top-8 bottom-[-24px] w-[2px] ${t.border} bg-slate-200 dark:bg-slate-700`}></div>
                  <div className={`absolute left-0 sm:left-4 top-5 w-6 h-6 rounded-full border-[4px] ${t.card} z-10 ${log.status==='Active'?'bg-green-500':log.status==='Pending'?'bg-amber-500':'bg-red-500'}`}></div>
                  <div className={`${t.card} border ${t.border} rounded-2xl p-4 sm:p-5 shadow-sm ml-4 mb-6 relative`}>
                    <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-3 mb-4">
                      <StatusPill status={log.status} />
                      <div className={`flex flex-wrap items-center gap-2 text-[11px] font-bold ${t.muted} bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border ${t.border}`}><UserIcon size={12}/> <span>{log.author}</span> <span className="opacity-50">•</span> <span>{new Date(log.date).toLocaleString()}</span></div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap font-medium mb-4 leading-relaxed">{log.details}</p>
                    {log.larkLink && (
                      <div className="mb-4"><a href={log.larkLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg transition-colors"><ExternalLink size={14}/> Lark Link</a></div>
                    )}
                    {log.tasks?.length > 0 && (
                      <div className="mb-5 space-y-3">
                        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${t.muted}`}><CheckCircle2 size={14}/> Tasks Checklist</h4>
                        {log.tasks.map(tk => (
                          <div key={tk.id} id={`task-${tk.id}`} className={`rounded-xl border ${t.border} overflow-hidden ${tk.completed?'bg-slate-50/50 opacity-80 dark:bg-slate-800/30':'bg-white dark:bg-slate-900'} shadow-sm transition-all duration-300`}>
                            <div className="p-3 flex items-start gap-3">
                              <input type="checkbox" checked={tk.completed} onChange={()=>user.status!=='Suspended'&&toggleTask(log.id, tk.id)} className="mt-1 w-5 h-5 cursor-pointer accent-blue-600" disabled={user.status==='Suspended'}/>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1"><span className={`block font-bold text-sm ${tk.completed?'line-through':''}`}>{tk.desc}</span><StatusPill status={tk.status} size="sm" /></div>
                                <div className={`flex flex-wrap gap-3 text-[10px] font-bold uppercase mt-1.5 ${t.muted}`}>
                                  {tk.dueDate && <span className={tk.status==='Issue'?'text-red-500':''}>DUE: {new Date(tk.dueDate).toLocaleString()}</span>}
                                  {tk.completed && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={12}/> Done by {tk.completedBy}</span>}
                                  {tk.repeatingInterval && <span className="text-amber-600 flex items-center gap-1"><BellRing size={12}/> Repeats every {tk.repeatingInterval}m</span>}
                                  {tk.workingOn && !tk.completed && <span className="text-amber-600 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 px-2 py-0.5 rounded border border-amber-100"><Activity size={12}/> On it by {tk.workingOn}</span>}
                                </div>
                                
                                {tk.replies && tk.replies.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {tk.replies.map(r => (
                                      <div key={r.id} className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 text-xs">
                                        <div className="flex justify-between items-center mb-1 text-[10px]"><span className="font-bold">{r.author}</span><span className={t.muted}>{new Date(r.date).toLocaleString()}</span></div>
                                        <p>{r.text}</p>
                                        {r.statusChange && <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 rounded border ${r.statusChange==='Issue'?'text-red-600 border-red-200 dark:border-red-800 dark:text-red-400':r.statusChange==='Pending'?'text-amber-600 border-amber-200 dark:border-amber-800 dark:text-amber-400':'text-green-600 border-green-200 dark:border-green-800 dark:text-green-400'}`}>Changed to {r.statusChange}</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {user.status !== 'Suspended' && !tk.completed && !replyForm?.targetId && (
                                  <button onClick={()=>setReplyForm({ targetId: tk.id, isTask: true, text: '', status: tk.status, repeat: tk.repeatingInterval })} className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"><MessageSquare size={12}/> Reply & Update Status</button>
                                )}
                                
                                {replyForm?.targetId === tk.id && (
                                  <div className="mt-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded animate-in fade-in">
                                    <textarea autoFocus placeholder="Write an update..." value={replyForm.text} onChange={e=>setReplyForm({...replyForm, text:e.target.value})} className={`w-full p-2 text-sm rounded border ${t.border} outline-none mb-3 bg-white dark:bg-slate-900 dark:text-white`} rows="2"></textarea>
                                    <div className="flex flex-wrap gap-2 justify-between items-center">
                                      <div className="flex gap-2">
                                        <select value={replyForm.status} onChange={e=>{setReplyForm({...replyForm, status:e.target.value}); if(e.target.value!=='Pending'&&e.target.value!=='Issue') setReplyForm(p=>({...p, repeat:''}));}} className={`text-xs font-bold p-2 rounded border outline-none ${t.border} bg-white dark:bg-slate-900 dark:text-white`}>
                                          <option value="Task">Mark Task</option><option value="Pending">Mark Pending</option><option value="Issue">Mark Issue</option>
                                        </select>
                                        {(replyForm.status === 'Pending' || replyForm.status === 'Issue') && (
                                          <select value={replyForm.repeat || ''} onChange={e=>setReplyForm({...replyForm, repeat:e.target.value})} className={`text-xs font-bold p-2 rounded border outline-none border-amber-300 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400`}>
                                            <option value="">No Repeat Alarm</option><option value="1">Nag Every 1m</option><option value="5">Nag Every 5m</option><option value="15">Nag Every 15m</option>
                                          </select>
                                        )}
                                      </div>
                                      <div className="flex gap-2"><button onClick={()=>setReplyForm(null)} className={`px-3 py-1.5 text-xs font-bold rounded ${t.muted} bg-white dark:bg-slate-800 border ${t.border}`}>Cancel</button><button onClick={()=>submitReply(log.id, tk.id)} className="px-3 py-1.5 text-xs font-bold rounded bg-indigo-600 text-white shadow-sm">Submit</button></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={`mt-4 pt-4 border-t ${t.border} flex flex-wrap justify-between items-center gap-3`}>
                      {(user.isAdmin || user.username === log.author) && user.status !== 'Suspended' && (
                        <div className="flex gap-3 ml-auto"><button onClick={()=>{setLogForm(log); setShowLogModal(true);}} className={`text-xs font-bold flex items-center gap-1 ${t.muted} hover:text-blue-600 transition-colors`}><Edit size={14}/> Edit</button><button onClick={()=>deleteLog(log.id)} className={`text-xs font-bold flex items-center gap-1 ${t.muted} hover:text-red-500 transition-colors`}><Trash2 size={14}/> Delete</button></div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
        
        {activeTab === 'tasks' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="font-bold flex items-center gap-2 mb-4 text-amber-600"><Clock size={18}/> Action Needed ({pendingTasks.length})</h3>
              {pendingTasks.length === 0 ? <p className={`text-sm italic ${t.muted}`}>All caught up! No pending tasks.</p> : (
                <div className="space-y-4">
                  {pendingTasks.map(tk => (
                    <div key={`pt-${tk.id}`} id={`task-${tk.id}`} className={`${t.card} border ${tk.status==='Issue'?'border-red-300 dark:border-red-800':'border-slate-200 dark:border-slate-700'} rounded-xl shadow-sm overflow-hidden transition-all duration-300`}>
                      <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 ${tk.status==='Issue'?'border-l-red-500':'border-l-amber-400'}`}>
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <input type="checkbox" checked={false} onChange={()=>user.status!=='Suspended'&&toggleTask(tk.logId, tk.id)} className="mt-1 w-6 h-6 rounded cursor-pointer accent-blue-600" disabled={user.status==='Suspended'}/>
                          <div>
                            <div className="flex items-center gap-2 mb-1"><h4 className="font-bold text-base">{tk.desc}</h4><StatusPill status={tk.status} /></div>
                            <div className={`flex flex-wrap gap-3 text-xs font-bold mt-2 ${t.muted}`}>
                              {tk.dueDate && <span className={tk.status==='Issue'?'text-red-500':'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 px-2 py-0.5 rounded border border-amber-100'}>Due: {new Date(tk.dueDate).toLocaleString()}</span>}
                              {tk.repeatingInterval && <span className="text-red-500 flex items-center gap-1 bg-red-50 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 px-2 py-0.5 rounded border border-red-100"><BellRing size={12}/> Repeats {tk.repeatingInterval}m</span>}
                              {tk.workingOn && <span className="text-amber-600 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 px-2 py-0.5 rounded border border-amber-100"><Activity size={12}/> On it by {tk.workingOn}</span>}
                              {tk.logLarkLink && <a href={tk.logLarkLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline bg-blue-50 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 px-2 py-0.5 rounded flex items-center gap-1 border border-blue-100 dark:border-blue-800"><LinkIcon size={12}/>Lark Link</a>}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button onClick={()=>scrollToElement(`log-${tk.logId}`)} className={`text-xs font-bold px-4 py-2 rounded-lg border ${t.border} hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors shadow-sm flex items-center justify-center gap-1`}><ChevronRight size={14}/> Go to Context</button>
                          {user.status !== 'Suspended' && !replyForm?.targetId && (
                            <button onClick={()=>setReplyForm({ targetId: tk.id, isTask: true, text: '', status: tk.status, repeat: tk.repeatingInterval })} className="text-xs font-bold px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm flex items-center justify-center gap-1"><MessageSquare size={14}/> Reply & Update</button>
                          )}
                        </div>
                      </div>
                      
                      {replyForm?.targetId === tk.id && (
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-800 animate-in fade-in">
                          <textarea autoFocus placeholder="Write a task reply or update status..." value={replyForm.text} onChange={e=>setReplyForm({...replyForm, text:e.target.value})} className={`w-full p-2 text-sm rounded border ${t.border} outline-none mb-3 bg-white dark:bg-slate-900 dark:text-white`} rows="2"></textarea>
                          <div className="flex flex-wrap gap-2 justify-between items-center">
                            <div className="flex gap-2">
                              <select value={replyForm.status} onChange={e=>{setReplyForm({...replyForm, status:e.target.value}); if(e.target.value!=='Pending'&&e.target.value!=='Issue') setReplyForm(p=>({...p, repeat:''}));}} className={`text-xs font-bold p-2 rounded border outline-none ${t.border} bg-white dark:bg-slate-900 dark:text-white`}>
                                <option value="Task">Mark Task</option><option value="Pending">Mark Pending</option><option value="Issue">Mark Issue</option>
                              </select>
                              {(replyForm.status === 'Pending' || replyForm.status === 'Issue') && (
                                <select value={replyForm.repeat || ''} onChange={e=>setReplyForm({...replyForm, repeat:e.target.value})} className={`text-xs font-bold p-2 rounded border outline-none border-amber-300 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400`}>
                                  <option value="">No Repeat Alarm</option><option value="1">Nag Every 1m</option><option value="5">Nag Every 5m</option><option value="15">Nag Every 15m</option>
                                </select>
                              )}
                            </div>
                            <div className="flex gap-2"><button onClick={()=>setReplyForm(null)} className={`px-4 py-2 text-xs font-bold rounded ${t.muted} bg-white dark:bg-slate-800 border ${t.border}`}>Cancel</button><button onClick={()=>submitReply(tk.logId, tk.id)} className="px-4 py-2 text-xs font-bold rounded bg-indigo-600 text-white shadow-sm">Submit Reply</button></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-bold flex items-center gap-2 mb-4 text-green-600"><CheckCircle2 size={18}/> Completed Tasks ({completedTasks.length})</h3>
              <div className="space-y-3 opacity-70">
                {completedTasks.map(tk => (
                  <div key={`ct-${tk.id}`} className={`${t.bg} border ${t.border} p-3 rounded-xl flex items-center justify-between gap-3`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={true} onChange={()=>user.status!=='Suspended'&&toggleTask(tk.logId, tk.id)} className="w-5 h-5 rounded cursor-pointer accent-blue-600" disabled={user.status==='Suspended'}/>
                      <div><h4 className="font-bold text-sm line-through">{tk.desc}</h4><span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1 mt-0.5"><CheckCircle2 size={10}/> Done by {tk.completedBy}</span></div>
                    </div>
                    <button onClick={()=>scrollToElement(`log-${tk.logId}`)} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border ${t.border} hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors`}>View Context</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'livescene' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div><h3 className="text-xl font-bold flex items-center gap-2 text-blue-600"><FolderOpen size={24}/> Livescene Collection</h3><p className={`text-sm ${t.muted} mt-1`}>Manage campaign folders and synology asset links.</p></div>
              {user.status !== 'Suspended' && (
                <button onClick={() => setCampForm({ id: null, name: '' })} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"><PlusCircle size={16}/> Add Campaign</button>
              )}
            </div>

            {campForm && (
              <div className={`p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 mb-6 flex flex-col sm:flex-row gap-3 items-end`}>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-blue-800 dark:text-blue-400 mb-1 uppercase tracking-wider">Campaign Name</label>
                  <input autoFocus placeholder="e.g. Q4 Mega Sale..." value={campForm.name} onChange={e=>setCampForm({...campForm, name:e.target.value})} className={`w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800 outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-slate-900 dark:text-white`} />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => setCampForm(null)} className={`px-4 py-2 rounded-lg text-sm font-bold ${t.muted} bg-white dark:bg-slate-800 border ${t.border}`}>Cancel</button>
                  <button onClick={(e) => { e.preventDefault(); if(!campForm.name.trim()) return; setBrands(brands.map(b => b.id === selectedBrand.id ? { ...b, campaigns: campForm.id ? (b.campaigns||[]).map(c => c.id === campForm.id ? {...c, name:campForm.name}:c) : [{id:Date.now(), name:campForm.name, assets:[]}, ...(b.campaigns||[])] } : b)); setCampForm(null); }} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 shadow-sm">Save Campaign</button>
                </div>
              </div>
            )}

            {!selectedBrand.campaigns || selectedBrand.campaigns.length === 0 ? (
              <div className={`text-center py-16 ${t.muted} border-2 border-dashed ${t.border} rounded-2xl`}><FileText size={32} className="mx-auto mb-3 opacity-30"/><p>No campaigns created yet.</p></div>
            ) : (
              <div className="space-y-6">
                {selectedBrand.campaigns.map(camp => (
                  <div key={camp.id} className={`${t.card} border ${t.border} rounded-xl shadow-sm overflow-hidden`}>
                    <div className={`px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b ${t.border} flex justify-between items-center cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`} onClick={() => setExpandedCampId(expandedCampId === camp.id ? null : camp.id)}>
                      <h4 className="font-bold flex items-center gap-2"><FolderOpen size={18} className="text-amber-500"/> {camp.name}</h4>
                      <div className="flex items-center gap-2">
                        {user.status !== 'Suspended' && (
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={()=>setCampForm(camp)} className={`p-1.5 rounded-md ${t.muted} hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors`}><Edit size={14}/></button>
                            <button onClick={()=>setConfirm({title: 'Delete Campaign', message: 'Delete this folder and all its assets?', action: ()=>setBrands(brands.map(b=>b.id===selectedBrand.id?{...b, campaigns:b.campaigns.filter(c=>c.id!==camp.id)}:b))})} className={`p-1.5 rounded-md ${t.muted} hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors`}><Trash2 size={14}/></button>
                          </div>
                        )}
                        {expandedCampId === camp.id ? <ChevronDown size={20} className={t.muted} /> : <ChevronRight size={20} className={t.muted} />}
                      </div>
                    </div>
                    
                    {expandedCampId === camp.id && (
                      <div className="p-4 space-y-4 animate-in fade-in duration-200">
                        {camp.assets && camp.assets.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {camp.assets.map(asset => (
                              <div key={asset.id} className={`p-3 rounded-lg border ${t.border} bg-slate-50/50 dark:bg-slate-800/50 flex flex-col justify-between gap-2`}>
                                <div className="flex justify-between items-start gap-2">
                                  <span className="font-semibold text-sm line-clamp-2">{asset.name}</span>
                                  {user.status !== 'Suspended' && (
                                    <div className="flex gap-1 shrink-0"><button onClick={()=>setAssetForm({campId: camp.id, ...asset})} className={`text-slate-400 hover:text-blue-500`}><Edit size={12}/></button><button onClick={()=>setConfirm({title:'Delete Asset', message:'Remove this link?', action:()=>setBrands(brands.map(b=>b.id===selectedBrand.id?{...b, campaigns:b.campaigns.map(c=>c.id===camp.id?{...c, assets:c.assets.filter(a=>a.id!==asset.id)}:c)}:b))})} className={`text-slate-400 hover:text-red-500`}><Trash2 size={12}/></button></div>
                                  )}
                                </div>
                                <a href={asset.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 hover:bg-blue-100 px-2 py-1 rounded w-fit flex items-center gap-1 border border-blue-100 transition-colors"><ExternalLink size={12}/> Link</a>
                              </div>
                            ))}
                          </div>
                        ) : ( <p className={`text-xs italic ${t.muted}`}>No assets added to this campaign yet.</p> )}

                        {assetForm?.campId === camp.id && (
                          <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10 flex flex-col gap-3 mt-3 animate-in fade-in">
                            <input autoFocus placeholder="Asset Name (e.g. Logo Vector)" value={assetForm.name} onChange={e=>setAssetForm({...assetForm, name:e.target.value})} className="w-full px-3 py-1.5 text-sm rounded border outline-none bg-white dark:bg-slate-900 dark:text-white"/>
                            <input placeholder="Synology Link (https://...)" value={assetForm.link} onChange={e=>setAssetForm({...assetForm, link:e.target.value})} className="w-full px-3 py-1.5 text-sm rounded border outline-none bg-white dark:bg-slate-900 dark:text-white"/>
                            <div className="flex gap-2 justify-end">
                              <button onClick={()=>setAssetForm(null)} className={`px-3 py-1.5 text-xs font-bold ${t.muted}`}>Cancel</button>
                              <button onClick={(e)=>{ e.preventDefault(); if(!assetForm.name.trim()||!assetForm.link.trim()) return; setBrands(brands.map(b=>b.id===selectedBrand.id?{...b, campaigns:(b.campaigns||[]).map(c=>{ if(c.id!==assetForm.campId)return c; if(assetForm.id) return {...c, assets:c.assets.map(a=>a.id===assetForm.id?{...a, name:assetForm.name, link:assetForm.link}:a)}; return {...c, assets:[...(c.assets||[]), {id:Date.now(), name:assetForm.name, link:assetForm.link}]}; })}:b)); setAssetForm(null); }} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded">Save Asset</button>
                            </div>
                          </div>
                        )}

                        {user.status !== 'Suspended' && !assetForm && (
                          <button onClick={()=>setAssetForm({ campId: camp.id, id: null, name: '', link: '' })} className={`text-xs font-bold px-3 py-1.5 rounded-lg border border-dashed ${t.border} hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 w-full justify-center ${t.muted}`}><Plus size={14}/> Add Asset Link</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showLogModal && selectedBrand && (
        <div className="fixed inset-0 bg-slate-900/60 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className={`${t.card} ${t.text} rounded-2xl shadow-2xl max-w-3xl w-full p-6 border ${t.border} animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
            <div className="flex justify-between items-center mb-6 shrink-0"><h2 className="text-xl font-black flex items-center gap-2"><Edit className="text-blue-600"/> {logForm.id ? 'Edit Log Entry' : 'New Log Entry'}</h2><button onClick={()=>setShowLogModal(false)} className={`p-2 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors ${t.muted}`}><X size={20}/></button></div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className={`p-3 rounded-xl border ${t.border} bg-slate-50 dark:bg-slate-900`}>
                  <label className={`block text-xs font-bold ${t.muted} mb-1.5 uppercase tracking-wider`}>Brand Status</label>
                  <select value={logForm.status} onChange={e=>setLogForm({...logForm, status: e.target.value})} className={`w-full p-2 font-bold rounded-lg border outline-none ${t.border} bg-white dark:bg-slate-800 dark:text-white shadow-sm focus:border-blue-500`}><option value="Active">Active (Running smoothly)</option><option value="Pending">Pending (Awaiting action)</option><option value="Issue">Issue (Needs attention)</option></select>
                </div>
                <div className={`p-3 rounded-xl border ${t.border} bg-slate-50 dark:bg-slate-900`}>
                  <label className={`block text-xs font-bold ${t.muted} mb-1.5 uppercase tracking-wider`}>Lark Link <span className="lowercase font-normal opacity-70">(Optional)</span></label>
                  <div className="relative"><LinkIcon className={`absolute left-3 top-2.5 h-4 w-4 ${t.muted}`} /><input type="url" placeholder="https://..." value={logForm.larkLink} onChange={e=>setLogForm({...logForm, larkLink: e.target.value})} className={`w-full pl-9 pr-3 py-2 text-sm font-semibold rounded-lg border outline-none ${t.border} bg-white dark:bg-slate-800 dark:text-white shadow-sm focus:border-blue-500`} /></div>
                </div>
              </div>
              
              <div className={`p-3 rounded-xl border ${t.border} bg-slate-50 dark:bg-slate-900`}>
                <label className={`block text-xs font-bold ${t.muted} mb-1.5 uppercase tracking-wider`}>Update Details</label>
                <textarea required rows="4" placeholder="Client approved new assets..." value={logForm.details} onChange={e=>setLogForm({...logForm, details: e.target.value})} className={`w-full p-3 text-sm font-medium rounded-lg border outline-none resize-none ${t.border} bg-white dark:bg-slate-800 dark:text-white shadow-inner focus:border-blue-500`}></textarea>
              </div>
              
              <div className={`rounded-xl border ${t.border} overflow-hidden shadow-sm`}>
                <div className={`flex justify-between items-center p-3 border-b ${t.border} bg-blue-50/50 dark:bg-blue-900/10`}>
                  <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-700 dark:text-blue-400`}><CheckCircle2 size={14} /> Tasks & Action Items</label>
                  <button type="button" onClick={()=>setLogForm(p=>({...p, tasks: [...p.tasks, {id:Date.now(), desc:'', dueDate:'', reminderOffset:'0', repeatingInterval: '', completed:false, status: 'Task'}]}))} className="text-xs font-bold text-blue-600 bg-white dark:bg-slate-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-1 transition-colors"><Plus size={14}/> Add Task</button>
                </div>
                <div className={`p-4 space-y-4 ${t.bg}`}>
                  {logForm.tasks.length === 0 ? <p className={`text-xs text-center italic py-4 ${t.muted}`}>No tasks added. Add tasks to set due dates and alarms.</p> : 
                    logForm.tasks.map(task => (
                    <div key={task.id} className={`flex flex-col gap-3 p-4 rounded-xl border ${t.border} bg-white dark:bg-slate-800 shadow-sm relative group`}>
                      <input required placeholder="Describe the task required..." value={task.desc} onChange={e=>setLogForm(p=>({...p, tasks: p.tasks.map(t=>t.id===task.id?{...t, desc:e.target.value}:t)}))} className={`w-full text-sm font-bold p-2 border-b border-transparent focus:border-blue-500 outline-none bg-slate-50 dark:bg-slate-900 dark:text-white rounded transition-colors`} />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div><label className={`block text-[10px] font-bold ${t.muted} mb-1 uppercase`}>Due Date & Time</label><input type="datetime-local" value={task.dueDate} onChange={e=>setLogForm(p=>({...p, tasks: p.tasks.map(t=>t.id===task.id?{...t, dueDate:e.target.value}:t)}))} className={`w-full text-xs font-bold outline-none p-2 rounded border ${t.border} bg-white dark:bg-slate-900 dark:text-white`} /></div>
                        <div>
                          <label className={`block text-[10px] font-bold ${t.muted} mb-1 uppercase`}>Initial Reminder</label>
                          <select value={task.reminderOffset} onChange={e=>setLogForm(p=>({...p, tasks: p.tasks.map(t=>t.id===task.id?{...t, reminderOffset:e.target.value}:t)}))} className={`w-full text-xs font-bold outline-none p-2 rounded border ${t.border} bg-white dark:bg-slate-900 dark:text-white`}><option value="0">Exactly at Due Date</option><option value="5">5 mins before</option><option value="15">15 mins before</option><option value="60">1 hour before</option></select>
                        </div>
                        <div>
                          <label className={`block text-[10px] font-bold ${t.muted} mb-1 uppercase`}>Nagging Interval</label>
                          <select value={task.repeatingInterval} onChange={e=>setLogForm(p=>({...p, tasks: p.tasks.map(t=>t.id===task.id?{...t, repeatingInterval:e.target.value}:t)}))} className={`w-full text-xs font-bold outline-none p-2 rounded border ${t.border} bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400`}><option value="">No repeat</option><option value="1">Every 1 minute</option><option value="5">Every 5 minutes</option><option value="15">Every 15 minutes</option></select>
                        </div>
                      </div>
                      <button type="button" onClick={()=>setLogForm(p=>({...p, tasks: p.tasks.filter(t=>t.id!==task.id)}))} className="absolute top-3 right-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 p-1.5 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className={`mt-6 pt-5 border-t ${t.border} flex justify-end gap-3 shrink-0`}>
              <button type="button" onClick={()=>setShowLogModal(false)} className={`px-5 py-2.5 rounded-xl text-sm font-bold border ${t.border} hover:bg-slate-500/10 transition-colors`}>Cancel</button>
              <button type="button" onClick={saveLogEntry} disabled={!logForm.details.trim()} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Submit Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MainLayout = ({ user, onLogout, users, setUsers, setCurrentUser, brands, setBrands, mcnEvents, setMcnEvents, mcnSettings, setMcnSettings, callouts, setCallouts, calloutSettings, setCalloutSettings, setContextTrigger, contextTrigger, activeAlarms, snoozedAlarms, clearAlarm, handleSnooze }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filterModeExt, setFilterModeExt] = useState('ALL');
  const [resetCounter, setResetCounter] = useState(0);
  const [filterMonth, setFilterMonth] = useState(new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Manila'}).slice(0,7));

  useEffect(() => {
    if (contextTrigger) { if (activeTab !== 'tsp') setActiveTab('tsp'); }
  }, [contextTrigger]);

  const getThemeStyles = (theme) => {
    switch(theme) {
      case 'dark': return { bg: 'bg-slate-900', card: 'bg-slate-800', text: 'text-slate-100', muted: 'text-slate-400', border: 'border-slate-700', input: 'bg-slate-900 border-slate-600 text-white focus:ring-blue-500' };
      default: return { bg: 'bg-slate-50', card: 'bg-white', text: 'text-slate-800', muted: 'text-slate-500', border: 'border-slate-200', input: 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500' };
    }
  };
  const t = getThemeStyles(user?.theme);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tsp', label: 'Tiktok Shop Partners', icon: Users },
    { id: 'mcn', label: 'MCN Tracker', icon: CalendarDays },
    { id: 'callout', label: 'Callout Tracker', icon: ClipboardList },
  ];

  const settingsItems = [
    { id: 'settings-general', label: 'General Settings' },
    ...(user.isAdmin ? [ { id: 'settings-tsp', label: 'TSP Settings' }, { id: 'settings-mcn', label: 'MCN Settings' }, { id: 'settings-callout', label: 'Callout Settings' }, { id: 'settings-users', label: 'User Accounts' } ] : [])
  ];

  useEffect(() => { setIsMobileMenuOpen(false); }, [activeTab]);

  const formatMD = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const getPhtDate = (offsetDays = 0) => { const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })); d.setDate(d.getDate() + offsetDays); return formatMD(d); };
  const todayBdays = users.filter(u => u.birthday && u.birthday.substring(5) === getPhtDate(0) && u.status !== 'Terminated');
  const tomorrowBdays = users.filter(u => u.birthday && u.birthday.substring(5) === getPhtDate(1) && u.status !== 'Terminated');

  const todayPHT = getPHTToday();
  const happeningTodayMCN = mcnEvents.filter(e => e.date === todayPHT && e.status === 'Confirmed' && (user.isAdmin || e.inCharge?.includes(user.username) || e.backup?.includes(user.username)));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView user={user} users={users} mcnEvents={mcnEvents} setMcnEvents={setMcnEvents} brands={brands} callouts={callouts} filterMonth={filterMonth} setFilterMonth={setFilterMonth} t={t} />;
      case 'tsp': return <TSPMainView key={`tsp-${resetCounter}`} brands={brands} setBrands={setBrands} user={user} t={t} contextTrigger={contextTrigger} clearAlarm={clearAlarm} filterModeExt={filterModeExt} resetCounter={resetCounter} />;
      case 'mcn': return <MCNTrackerView mcnEvents={mcnEvents} setMcnEvents={setMcnEvents} mcnSettings={mcnSettings} users={users} t={t} user={user} filterMonth={filterMonth} />;
      case 'callout': return <CalloutTrackerView callouts={callouts} setCallouts={setCallouts} calloutSettings={calloutSettings} setCalloutSettings={setCalloutSettings} brands={brands} users={users} user={user} t={t} filterMonth={filterMonth} />;
      case 'settings-general': return <GeneralSettingsView user={user} users={users} setUsers={setUsers} setCurrentUser={setCurrentUser} t={t} />;
      case 'settings-tsp': return <TSPSettingsView brands={brands} setBrands={setBrands} t={t} />;
      case 'settings-mcn': return <MCNSettingsView mcnSettings={mcnSettings} setMcnSettings={setMcnSettings} mcnEvents={mcnEvents} t={t} />;
      case 'settings-callout': return <CalloutSettingsView calloutSettings={calloutSettings} setCalloutSettings={setCalloutSettings} t={t} />;
      case 'settings-users': return <UserManagementView users={users} setUsers={setUsers} brands={brands} t={t} />;
      default: return <BlankView title="Not Found" user={user} t={t} />;
    }
  };

  const NavItem = ({ item, isSubItem = false }) => {
    const isActive = activeTab === item.id;
    return (
      <button 
        onClick={() => { setActiveTab(item.id); if (item.id === 'tsp') { setFilterModeExt('ALL'); setContextTrigger(null); setResetCounter(c=>c+1); } }} 
        title={isSidebarCollapsed ? item.label : undefined} 
        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'} ${isSubItem && !isSidebarCollapsed ? 'pl-11' : ''}`}
      >
        {!isSubItem && <item.icon size={18} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />}
        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  return (
    <div className={`flex h-screen font-sans overflow-hidden ${t.bg}`}>
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-slate-950 text-slate-300 flex flex-col transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0 w-72' : `-translate-x-full lg:translate-x-0 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}`}>
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-6'} h-20 border-b border-slate-800/60 shrink-0 overflow-hidden`}>
          <div className="bg-blue-600 text-white p-2 rounded-lg shrink-0"><Laptop size={20} strokeWidth={2.5} /></div>
          {!isSidebarCollapsed && <div className="animate-in fade-in shrink-0"><h1 className="text-xl font-bold text-white tracking-tight">LiveOps Hub</h1><span className="text-xs text-blue-400 font-medium tracking-wider uppercase">Portal</span></div>}
          <button className="ml-auto lg:hidden text-slate-400 hover:text-white shrink-0" onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
        </div>

        <div className={`flex-1 overflow-y-auto py-6 ${isSidebarCollapsed ? 'px-2' : 'px-4'} space-y-1.5 custom-scrollbar`}>
          {!isSidebarCollapsed && <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Main Menu</div>}
          {menuItems.map(item => <NavItem key={item.id} item={item} />)}
          <div className="pt-2">
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} title={isSidebarCollapsed ? "Settings" : undefined} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-4'} py-2.5 rounded-lg transition-all duration-200 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white`}>
              <div className="flex items-center gap-3"><Settings size={18} className="shrink-0"/> {!isSidebarCollapsed && <span>Settings</span>}</div>
              {!isSidebarCollapsed && (isSettingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
            </button>
            <div className={`mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isSettingsOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>{settingsItems.map(item => <NavItem key={item.id} item={item} isSubItem={true} />)}</div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800/60 bg-slate-950/50">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 p-3'} rounded-xl bg-slate-900 border border-slate-800 mb-3`}>
            {user.profilePic ? <img src={user.profilePic} alt="Avatar" className="h-10 w-10 rounded-full object-cover shrink-0 border border-slate-700" /> : <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">{user.username.charAt(0).toUpperCase()}</div>}
            {!isSidebarCollapsed && <div className="overflow-hidden"><p className="text-sm font-medium text-white truncate">{user.username}</p><p className="text-xs text-slate-400 truncate flex items-center gap-1">{user.isAdmin ? <Shield size={10} className="text-blue-400" /> : <UserIcon size={10} />}{user.roleName}</p></div>}
          </div>
          <button onClick={onLogout} title={isSidebarCollapsed ? "Sign Out" : undefined} className={`w-full flex items-center justify-center ${isSidebarCollapsed ? '' : 'gap-2'} px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors`}><LogOut size={16} className="shrink-0" /> {!isSidebarCollapsed && <span>Sign Out</span>}</button>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${t.bg}`}>
        <header className={`h-20 ${t.card} border-b ${t.border} flex items-center px-4 lg:px-8 shrink-0 justify-between transition-colors`}>
          <div className="flex items-center gap-4">
            <button className={`lg:hidden p-2 -ml-2 ${t.muted} hover:bg-black/5 rounded-lg`} onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
            <button className={`hidden lg:block p-2 -ml-2 ${t.muted} hover:bg-black/5 rounded-lg`} onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}><PanelLeftClose size={24} /></button>
            <div className={`hidden lg:flex items-center gap-2 text-sm ${t.muted}`}><span className={`font-medium ${t.text}`}>LiveOps Hub</span><span>/</span><span className="capitalize">{activeTab.replace('-', ' ')}</span></div>
          </div>

          <div className="flex items-center gap-4">
             {todayBdays.length > 0 && <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-semibold shadow-sm animate-pulse"><PartyPopper size={14} /><span>Today is {todayBdays.map(u => u.username).join(' & ')}'s Birthday! 🎂</span></div>}
             {tomorrowBdays.length > 0 && <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold shadow-sm"><PartyPopper size={14} /><span>Tomorrow is {tomorrowBdays.map(u => u.username).join(' & ')}'s Birthday! 🎉</span></div>}
             {user.isAdmin && <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"><Shield size={14} /> Admin Privileges Active</span>}
             
             <div className="relative border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
               <button onClick={()=>setShowNotifications(!showNotifications)} className={`p-2 rounded-full relative ${t.bg} hover:opacity-80 transition-opacity border ${t.border}`}>
                 <BellRing size={20} className={activeAlarms.length > 0 ? "text-red-500 animate-pulse" : t.muted} />
                 {(activeAlarms.length > 0 || Object.keys(snoozedAlarms).length > 0 || happeningTodayMCN.length > 0) && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>}
               </button>
               {showNotifications && (
                 <div className={`absolute right-0 mt-3 w-96 ${t.card} rounded-xl shadow-2xl border ${t.border} z-50 overflow-hidden animate-in fade-in slide-in-from-top-2`}>
                   <div className={`p-3 border-b ${t.border} font-bold text-sm bg-slate-50 dark:bg-slate-900 flex justify-between`}>Notification Center <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded">{activeAlarms.length} Active</span></div>
                   <div className="max-h-[75vh] overflow-y-auto custom-scrollbar">
                     {happeningTodayMCN.length > 0 && (
                        <div className="p-3 border-b border-indigo-100 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-900/20">
                           <div className="font-bold text-indigo-700 dark:text-indigo-400 text-xs mb-2 flex items-center gap-1"><Play size={12}/> Happening Today (MCN)</div>
                           {happeningTodayMCN.map(e => (
                             <div key={e.id} className="text-xs text-slate-800 dark:text-slate-200 mb-1 last:mb-0"><span className="font-bold">{e.brand}</span> at {e.time} ({e.platform})</div>
                           ))}
                        </div>
                     )}
                     <div className="p-2">
                       {activeAlarms.length === 0 && Object.keys(snoozedAlarms).length === 0 ? <p className="text-xs text-center py-6 text-slate-500">No active alerts or snoozed tasks.</p> : null}
                       {activeAlarms.map(a => (
                         <div key={`dd-${a.id}`} className="p-3 border-b last:border-0 border-red-100 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/20 rounded mb-1 flex flex-col gap-1">
                           <div className="flex justify-between items-start"><span className="font-bold text-red-600 dark:text-red-400 text-xs">{a.title}</span><span className="text-[10px] text-red-400 font-bold bg-white dark:bg-slate-800 px-1 border border-red-100 dark:border-red-800/50 rounded">{a.type === 'REPEAT' ? 'NAGGING' : 'INITIAL'}</span></div>
                           <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{a.bName}</span><span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Task: {a.desc}</span>
                         </div>
                       ))}
                       {Object.entries(snoozedAlarms).map(([id, data]) => data.time > Date.now() && (
                         <div key={id} className="p-3 text-xs border-b last:border-0 border-amber-100 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/20 rounded mb-1">
                           <span className="font-bold text-amber-600 block mb-1">{data.isNag ? 'Nagging Interval Running' : 'Snoozed Task Alert'}</span>
                           <span className="text-slate-800 dark:text-slate-200 font-bold">{data.bName}</span> - {data.desc}<br/>
                           <span className="text-slate-500 mt-1 block">
                             {data.by ? <span>Paused by <span className="font-bold text-amber-700 dark:text-amber-500">{data.by}</span></span> : <span>Background Interval Running</span>}
                             <br/>Will alert again at: <span className="font-bold text-amber-700 dark:text-amber-500">{new Date(data.time).toLocaleTimeString()}</span>
                           </span>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               )}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 relative">
          <div className="max-w-7xl mx-auto h-full">{renderContent()}</div>
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }`}} />
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => { try { const saved = localStorage.getItem('lo_user'); return saved ? JSON.parse(saved) : null; } catch(e) { return null; } });
  const [users, setUsers] = useState(() => { try { const saved = localStorage.getItem('lo_users'); return saved ? JSON.parse(saved) : INITIAL_USERS; } catch(e) { return INITIAL_USERS; } });
  const [brands, setBrands] = useState(() => { try { const saved = localStorage.getItem('lo_brands'); return saved ? JSON.parse(saved) : INITIAL_BRANDS; } catch(e) { return INITIAL_BRANDS; } });
  const [mcnEvents, setMcnEvents] = useState(() => { try { const saved = localStorage.getItem('lo_mcn_events'); return saved ? JSON.parse(saved) : []; } catch(e) { return []; } });
  const [mcnSettings, setMcnSettings] = useState(() => { try { const saved = localStorage.getItem('lo_mcn_settings'); return saved ? JSON.parse(saved) : INITIAL_MCN_SETTINGS; } catch(e) { return INITIAL_MCN_SETTINGS; } });
  
  const [callouts, setCallouts] = useState(() => { try { const saved = localStorage.getItem('lo_callouts'); return saved ? JSON.parse(saved) : []; } catch(e) { return []; } });
  const [calloutSettings, setCalloutSettings] = useState(() => { try { const saved = localStorage.getItem('lo_callout_settings'); return saved ? JSON.parse(saved) : INITIAL_CALLOUT_SETTINGS; } catch(e) { return INITIAL_CALLOUT_SETTINGS; } });

  const [activeAlarms, setActiveAlarms] = useState([]); 
  const [snoozedAlarms, setSnoozedAlarms] = useState({});
  const [contextTrigger, setContextTrigger] = useState(null); 

  useEffect(() => { localStorage.setItem('lo_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('lo_brands', JSON.stringify(brands)); }, [brands]);
  useEffect(() => { localStorage.setItem('lo_mcn_events', JSON.stringify(mcnEvents)); }, [mcnEvents]);
  useEffect(() => { localStorage.setItem('lo_mcn_settings', JSON.stringify(mcnSettings)); }, [mcnSettings]);
  useEffect(() => { localStorage.setItem('lo_callouts', JSON.stringify(callouts)); }, [callouts]);
  useEffect(() => { localStorage.setItem('lo_callout_settings', JSON.stringify(calloutSettings)); }, [calloutSettings]);
  useEffect(() => { if (currentUser) localStorage.setItem('lo_user', JSON.stringify(currentUser)); else localStorage.removeItem('lo_user'); }, [currentUser]);

  useEffect(() => {
    let audioInterval;
    if (activeAlarms.length > 0) { playBeep(); audioInterval = setInterval(playBeep, 3000); }
    return () => clearInterval(audioInterval);
  }, [activeAlarms.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let newAlarms = [];

      brands.forEach(b => {
        if (b.contractStatus !== 'Active') return;
        b.logs.forEach(l => {
          l.tasks?.forEach(tk => {
            if (tk.completed) return; 
            const uniqueId = `task-${tk.id}`;
            const snoozeData = snoozedAlarms[uniqueId];
            if (snoozeData && now < snoozeData.time) return; 

            const isNagging = (tk.status === 'Pending' || tk.status === 'Issue') && tk.repeatingInterval;
            
            if (isNagging) {
               if (snoozeData && now >= snoozeData.time) newAlarms.push({ id: uniqueId, bId: b.id, bName: b.name, lId: l.id, tkId: tk.id, type: 'REPEAT', title: 'Action Needed Alert', desc: tk.desc, logDesc: l.details, time: now, intervalStr: tk.repeatingInterval });
               else if (!snoozeData) handleSnooze({ id: uniqueId, bId: b.id, bName: b.name, lId: l.id, tkId: tk.id, type: 'REPEAT', desc: tk.desc }, parseInt(tk.repeatingInterval), null);
               return; 
            }

            if (tk.dueDate) {
              const dueTime = new Date(tk.dueDate).getTime();
              const offsetMs = parseInt(tk.reminderOffset || 0) * 60000;
              const targetTime = dueTime - offsetMs;
              
              if (offsetMs > 0 && now >= targetTime && now < dueTime) {
                 if (!snoozeData) newAlarms.push({ id: uniqueId, bId: b.id, bName: b.name, lId: l.id, tkId: tk.id, type: 'INITIAL', title: 'Upcoming Task Reminder', desc: tk.desc, logDesc: l.details, time: targetTime, dueTime: dueTime });
                 return;
              }
              
              if (now >= dueTime) {
                 if (tk.repeatingInterval) {
                    if (snoozeData && now >= snoozeData.time) newAlarms.push({ id: uniqueId, bId: b.id, bName: b.name, lId: l.id, tkId: tk.id, type: 'REPEAT', title: 'Overdue Task Alert', desc: tk.desc, logDesc: l.details, time: now, intervalStr: tk.repeatingInterval });
                    else if (!snoozeData) handleSnooze({ id: uniqueId, bId: b.id, bName: b.name, lId: l.id, tkId: tk.id, type: 'REPEAT', desc: tk.desc }, parseInt(tk.repeatingInterval), null);
                 } else {
                    if (!snoozeData) newAlarms.push({ id: uniqueId, bId: b.id, bName: b.name, lId: l.id, tkId: tk.id, type: 'DUE', title: 'Task Reminder', desc: tk.desc, logDesc: l.details, time: dueTime, intervalStr: '1' });
                 }
                 return;
              }
            }

          });
        });
      });

      if (JSON.stringify(activeAlarms) !== JSON.stringify(newAlarms)) setActiveAlarms(newAlarms);
    }, 5000);
    return () => clearInterval(interval);
  }, [brands, snoozedAlarms, activeAlarms]);

  const handleSnooze = (al, mins, username) => {
    setSnoozedAlarms(p => ({ ...p, [al.id]: { time: Date.now() + (mins * 60000), by: username, bName: al.bName, desc: al.desc, isNag: al.type === 'REPEAT' } }));
    setActiveAlarms(p => p.filter(a => a.id !== al.id));

    if (username) {
      setBrands(brands.map(b => b.id === al.bId ? { ...b, logs: b.logs.map(l => l.id === al.lId ? { ...l, tasks: l.tasks.map(t => t.id === al.tkId ? { ...t, workingOn: username } : t) } : l) } : b));
    }
  };

  const acknowledgeInitial = (al) => {
    setSnoozedAlarms(p => ({ ...p, [al.id]: { time: al.dueTime, by: currentUser?.username, bName: al.bName, desc: al.desc, isNag: false } }));
    setActiveAlarms(p => p.filter(a => a.id !== al.id));
  };

  const clearAlarm = (uniqueId) => {
    setActiveAlarms(p => p.filter(a => a.id !== uniqueId));
    setSnoozedAlarms(p => { const newP = {...p}; delete newP[uniqueId]; return newP; });
  };

  const handleMarkDone = (bId, lId, tkId, uniqueId) => {
    if (!currentUser) return;
    setBrands(brands.map(b => b.id === bId ? { ...b, logs: b.logs.map(l => l.id === lId ? { ...l, tasks: l.tasks.map(t => t.id === tkId ? { ...t, completed: true, completedBy: currentUser.username, status: 'Done', workingOn: null } : t) } : l) } : b));
    clearAlarm(uniqueId);
  };

  const handleViewContext = (bId, tkId) => setContextTrigger({ bId, tkId, ts: Date.now() });

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 items-end pointer-events-none">
        {activeAlarms.map(al => (
          <div key={al.id} className="pointer-events-auto w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border-l-4 border-l-red-500 overflow-hidden animate-in slide-in-from-right-8 duration-300 relative">
            {al.type !== 'INITIAL' && (
              <button onClick={() => handleSnooze(al, parseInt(al.intervalStr || 1), null)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors z-10"><X size={16}/></button>
            )}
            <div className="p-4 bg-red-50 dark:bg-slate-800 flex items-start gap-3 pt-5">
              <BellRing size={20} className="text-red-500 animate-bounce shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">{al.title}: {al.bName}</h4>
                <p className="text-slate-700 dark:text-slate-300 text-xs mt-1 font-medium leading-relaxed">{al.desc}</p>
                {currentUser ? (
                  al.type === 'INITIAL' ? (
                     <div className="flex mt-3">
                       <button onClick={() => acknowledgeInitial(al)} className="w-full px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 shadow-sm transition-colors text-center">OK, Got it!</button>
                     </div>
                  ) : (
                     <div className="flex flex-wrap gap-2 mt-3">
                       <button onClick={()=>handleMarkDone(al.bId, al.lId, al.tkId, al.id)} className="px-3 py-1.5 bg-green-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 hover:bg-green-600 shadow-sm transition-colors"><Check size={12}/> Done</button>
                       <button onClick={()=>handleSnooze(al, 5, currentUser.username)} className="px-3 py-1.5 bg-amber-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 hover:bg-amber-600 shadow-sm transition-colors"><Activity size={12}/> On It (5m)</button>
                       <button onClick={()=>handleViewContext(al.bId, al.tkId)} className="px-3 py-1.5 bg-blue-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 hover:bg-blue-600 shadow-sm transition-colors"><Play size={12}/> Context</button>
                     </div>
                  )
                ) : ( <p className="text-[10px] text-red-600 font-bold mt-3 bg-red-100 px-2 py-1 rounded w-fit">Please log in to manage this alert.</p> )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentUser ? (
        currentUser.mustChangePassword ? (
          <ForcePasswordChange user={currentUser} users={users} setUsers={setUsers} setCurrentUser={setCurrentUser} />
        ) : (
          <MainLayout user={currentUser} onLogout={() => setCurrentUser(null)} users={users} setUsers={setUsers} setCurrentUser={setCurrentUser} brands={brands} setBrands={setBrands} mcnEvents={mcnEvents} setMcnEvents={setMcnEvents} mcnSettings={mcnSettings} setMcnSettings={setMcnSettings} callouts={callouts} setCallouts={setCallouts} calloutSettings={calloutSettings} setCalloutSettings={setCalloutSettings} setContextTrigger={setContextTrigger} contextTrigger={contextTrigger} activeAlarms={activeAlarms} snoozedAlarms={snoozedAlarms} clearAlarm={clearAlarm} handleSnooze={handleSnooze} />
        )
      ) : (
        <Login onLogin={setCurrentUser} users={users} />
      )}
    </>
  );
}
