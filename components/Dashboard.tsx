import React, { useState, useEffect, useMemo } from 'react';
import { 
  Link as LinkIcon, 
  ExternalLink, 
  X, 
  CheckSquare, 
  Layers,
  Plus,
  Pencil,
  Zap,
  ArrowRight,
  PieChart,
  Search,
  Timer
} from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { formatDate } from '../utils/helpers';
import { 
  Link, 
  Course, 
  Homework, 
  Project, 
  Internship, 
  Snippet, 
  Resource, 
  Habit,
  FocusSession,
  CountdownItem
} from '../types';

interface DashboardProps {
  changeView: (view: string) => void;
}

// Sub-component: Digital Clock
const DigitalClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="font-mono text-4xl font-bold text-gray-800 dark:text-white text-center py-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-center h-32">
      <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <span className="text-xs text-gray-400 mt-1 font-sans font-normal">{time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span>
    </div>
  );
};

// Sub-component: Countdown Widget
const CountdownWidget = ({ changeView }: { changeView: (view: string) => void }) => {
  const [countdowns] = usePersistentState<CountdownItem[]>('cm_countdowns', []);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000); // Update every minute to save resources
    return () => clearInterval(t);
  }, []);

  const nearest = useMemo(() => {
    return countdowns
      .filter(c => new Date(c.date).getTime() > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [countdowns, now]);

  if (!nearest) return (
     <div onClick={() => changeView('countdown')} className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 flex flex-col items-center justify-center text-gray-400 hover:border-pink-500 hover:text-pink-500 cursor-pointer transition-colors h-32">
        <Timer size={24} className="mb-2"/>
        <span className="text-xs font-medium">Add Countdown</span>
     </div>
  );

  const diff = new Date(nearest.date).getTime() - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  return (
    <div onClick={() => changeView('countdown')} className={`rounded-xl p-5 text-white shadow-lg relative overflow-hidden group cursor-pointer h-32 flex flex-col justify-between ${nearest.theme}`}>
       <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
       <div className="relative z-10 flex justify-between items-start">
          <h3 className="font-bold text-lg leading-tight truncate pr-2">{nearest.title}</h3>
          <Timer size={18} className="opacity-80"/>
       </div>
       <div className="relative z-10">
          <div className="text-3xl font-bold font-mono">
            {days}d {hours}h
          </div>
          <div className="text-xs opacity-90 mt-1">{formatDate(nearest.date)}</div>
       </div>
    </div>
  );
};

// Sub-component: Modal
interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  isEditing: boolean;
}
const Modal: React.FC<ModalProps> = ({ title, isOpen, onClose, onSubmit, children, isEditing }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-4">
          {children}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              {isEditing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Moved Input outside to prevent re-creation on render (fixes focus loss)
interface InputProps {
  label: string;
  field: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  formData: any;
  handleInputChange: (field: string, value: string) => void;
}
const Input: React.FC<InputProps> = ({ label, field, type = "text", placeholder, required = false, formData, handleInputChange }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <input 
      type={type} 
      required={required}
      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
      placeholder={placeholder}
      value={formData[field] || ''}
      onChange={(e) => handleInputChange(field, e.target.value)}
    />
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ changeView }) => {
  const [quickLinks, setQuickLinks] = usePersistentState<Link[]>('cm_dash_links', []);
  const [courses, setCourses] = usePersistentState<Course[]>('cm_dash_courses', []);
  const [homework, setHomework] = usePersistentState<Homework[]>('cm_dash_homework', []);
  const [projects, setProjects] = usePersistentState<Project[]>('cm_dash_projects', []);
  const [internships, setInternships] = usePersistentState<Internship[]>('cm_dash_internships', []);
  const [snippets, setSnippets] = usePersistentState<Snippet[]>('cm_dash_snippets', []);
  const [resources, setResources] = usePersistentState<Resource[]>('cm_dash_resources', []);
  const [habits, setHabits] = usePersistentState<Habit[]>('cm_habits', []);
  const [focusHistory] = usePersistentState<FocusSession[]>('flow_history', []);

  // Modal State
  const [modalType, setModalType] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Focus Stats
  const todayFocusMinutes = useMemo(() => {
    const today = new Date().toDateString();
    return focusHistory
        .filter(s => new Date(s.date).toDateString() === today)
        .reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [focusHistory]);

  const openModal = (type: string, item: any = null) => {
    setModalType(type);
    if (item) {
      setFormData(item);
      setEditingId(item.id);
    } else {
      setFormData({});
      setEditingId(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Helper to update or add
    const updateOrAdd = <T extends { id: number }>(
      items: T[], 
      setItems: React.Dispatch<React.SetStateAction<T[]>>, 
      newItemData: Partial<T>
    ) => {
      if (editingId) {
        setItems(items.map(i => i.id === editingId ? { ...i, ...newItemData } : i));
      } else {
        setItems([...items, { ...newItemData, id: Date.now() } as T]);
      }
    };

    if (modalType === 'link') {
      if (formData.name && formData.url) {
        updateOrAdd(quickLinks, setQuickLinks, { name: formData.name, url: formData.url });
      }
    } else if (modalType === 'course') {
      if (formData.name) {
        updateOrAdd(courses, setCourses, { name: formData.name, code: formData.code || '', status: formData.status || 'In Progress' });
      }
    } else if (modalType === 'homework') {
      if (formData.name) {
        updateOrAdd(homework, setHomework, { 
          name: formData.name, 
          course: formData.course || 'General', 
          date: formData.date || '', 
          complete: formData.complete || false 
        });
      }
    } else if (modalType === 'project') {
      if (formData.name) {
        updateOrAdd(projects, setProjects, { name: formData.name });
      }
    } else if (modalType === 'internship') {
      if (formData.role) {
        const baseData = { role: formData.role, company: formData.company || '', status: formData.status || 'Applied' };
        // Preserve original date if editing, else new date
        const date = editingId ? internships.find(i => i.id === editingId)?.date || new Date().toISOString() : new Date().toISOString();
        updateOrAdd(internships, setInternships, { ...baseData, date });
      }
    } else if (modalType === 'resource') {
      if (formData.name) {
        const date = editingId ? resources.find(r => r.id === editingId)?.date || new Date().toISOString() : new Date().toISOString();
        updateOrAdd(resources, setResources, { name: formData.name, tag: formData.tag || 'General', date });
      }
    }
    setModalType(null);
    setEditingId(null);
    setFormData({});
  };

  const toggleHomework = (id: number) => {
    setHomework(homework.map(h => h.id === id ? { ...h, complete: !h.complete } : h));
  };
  
  const toggleHabit = (id: number) => {
    const today = new Date().toDateString();
    setHabits(habits.map(h => {
      if (h.id === id) {
        const dates = h.completedDates || [];
        const isDone = dates.includes(today);
        if (isDone) {
            return { ...h, streak: Math.max(0, h.streak - 1), completedDates: dates.filter(d => d !== today) };
        } 
        return { ...h, streak: h.streak + 1, completedDates: [...dates, today] };
      }
      return h;
    }));
  };

  const deleteItem = <T extends { id: number }>(setter: React.Dispatch<React.SetStateAction<T[]>>, list: T[], id: number) => {
    setter(list.filter(i => i.id !== id));
  };

  // Filtered Lists based on Search
  const lowerQuery = searchQuery.toLowerCase();

  const filteredLinks = quickLinks.filter(l => l.name.toLowerCase().includes(lowerQuery));

  const filteredCourses = courses.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) || 
    c.code.toLowerCase().includes(lowerQuery) ||
    c.status.toLowerCase().includes(lowerQuery)
  );

  const filteredHomework = homework.filter(h => 
    h.name.toLowerCase().includes(lowerQuery) || 
    h.course.toLowerCase().includes(lowerQuery)
  );

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(lowerQuery));

  const filteredInternships = internships.filter(i => 
    i.role.toLowerCase().includes(lowerQuery) || 
    i.company.toLowerCase().includes(lowerQuery)
  );

  const filteredSnippets = snippets.filter(s => 
    s.lang.toLowerCase().includes(lowerQuery) || 
    s.code.toLowerCase().includes(lowerQuery)
  );

  const filteredResources = resources.filter(r => 
    r.name.toLowerCase().includes(lowerQuery) || 
    r.tag.toLowerCase().includes(lowerQuery)
  );

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Header Section */}
      <div className="relative mb-8">
        <div className="h-32 w-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl object-cover mb-[-40px]"></div>
        <div className="pl-6 relative z-10 flex items-end gap-4">
          <div className="text-6xl bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">💾</div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 shadow-black drop-shadow-sm">Dashboard</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={20} />
        </div>
        <input
          type="text"
          placeholder="Search courses, homework, resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white shadow-sm transition-shadow"
        />
      </div>

      {/* Top Row: Quick Access & Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Clock & Quick Access */}
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
             <DigitalClock />
             <CountdownWidget changeView={changeView} />
          </div>

          {/* Focus Mode Integration Widget */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-5 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
              <Zap size={64} fill="white" />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-1">Deep Focus</h3>
              <p className="text-orange-50 text-sm mb-4">
                {todayFocusMinutes > 0 
                  ? `${todayFocusMinutes} mins focused today. Keep it up!` 
                  : "Enter flow state and block distractions."}
              </p>
              <button 
                onClick={() => changeView('pomodoro')} 
                className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                {todayFocusMinutes > 0 ? 'Continue Session' : 'Start Session'} <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Analytics Shortcut */}
          <div 
            onClick={() => changeView('analysis')}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <PieChart size={20} />
               </div>
               <div>
                  <h4 className="font-bold text-gray-800 dark:text-white text-sm">Analytics</h4>
                  <p className="text-xs text-gray-500">View performance reports</p>
               </div>
            </div>
            <ArrowRight size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><LinkIcon size={16}/> Quick Access</h3>
              <button onClick={() => openModal('link')} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:text-white"><Plus size={14}/></button>
            </div>
            <ul className="space-y-2">
              {filteredLinks.map(link => (
                <li key={link.id} className="flex justify-between items-center group">
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2 text-sm truncate max-w-[150px]">
                    <ExternalLink size={12} /> {link.name}
                  </a>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal('link', link)} className="text-gray-300 hover:text-blue-500"><Pencil size={12}/></button>
                    <button onClick={() => deleteItem(setQuickLinks, quickLinks, link.id)} className="text-gray-300 hover:text-red-500"><X size={12}/></button>
                  </div>
                </li>
              ))}
              {filteredLinks.length === 0 && <li className="text-xs text-gray-400 italic">{searchQuery ? 'No matching links.' : 'No links added.'}</li>}
            </ul>
          </div>
        </div>

        {/* Right Col: Habit Tracker (Daily View) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">☑️ Habit Tracker</h2>
            <button onClick={() => changeView('habit')} className="text-sm text-indigo-500 hover:underline">Manage Habits</button>
          </div>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-3 text-sm border-b dark:border-gray-700 pb-2">Today</h4>
              <ul className="space-y-2">
                {habits.map(habit => {
                  const isDone = (habit.completedDates || []).includes(new Date().toDateString());
                  return (
                    <li key={habit.id} className="flex items-center gap-3 text-sm">
                      <button 
                        onClick={() => toggleHabit(habit.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isDone ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 hover:border-indigo-400'}`}
                      >
                        {isDone && <CheckSquare size={12} className="text-white" />}
                      </button>
                      <span className={`${isDone ? 'line-through opacity-50' : ''} dark:text-gray-300`}>{habit.name}</span>
                    </li>
                  );
                })}
                {habits.length === 0 && <li className="text-sm text-gray-400 italic">No habits tracking. Add some in the Habits tab!</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">📚 Courses</h2>
          <button onClick={() => openModal('course')} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:text-white"><Plus size={14}/></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map(c => (
                <tr key={c.id} className="border-b dark:border-gray-700">
                  <td className="px-4 py-3 font-medium dark:text-white">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.code}</td>
                  <td className="px-4 py-3"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">{c.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal('course', c)} className="text-gray-300 hover:text-blue-500"><Pencil size={14}/></button>
                      <button onClick={() => deleteItem(setCourses, courses, c.id)} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCourses.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-gray-400 italic">{searchQuery ? 'No matching courses.' : 'No courses added.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Homework Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
         <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">📝 Homework</h2>
          <button onClick={() => openModal('homework')} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:text-white"><Plus size={14}/></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3">Assignment</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Complete</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filteredHomework.map(h => (
                <tr key={h.id} className="border-b dark:border-gray-700">
                  <td className="px-4 py-3 font-medium dark:text-white">{h.name}</td>
                  <td className="px-4 py-3 text-gray-500">{h.course}</td>
                  <td className="px-4 py-3 text-gray-500">{h.date}</td>
                  <td className="px-4 py-3">
                     <button 
                        onClick={() => toggleHomework(h.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center ${h.complete ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                      >
                        {h.complete && <CheckSquare size={10} className="text-white" />}
                      </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal('homework', h)} className="text-gray-300 hover:text-blue-500"><Pencil size={14}/></button>
                      <button onClick={() => deleteItem(setHomework, homework, h.id)} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
               {filteredHomework.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-gray-400 italic">{searchQuery ? 'No matching homework.' : 'No homework added.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projects & Internships Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Personal Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">🏗️ Projects</h2>
            <button onClick={() => openModal('project')} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:text-white"><Plus size={14}/></button>
          </div>
          <ul className="space-y-2">
            {filteredProjects.map(p => (
              <li key={p.id} className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                <span className="font-medium dark:text-gray-200 flex items-center gap-2"><Layers size={14}/> {p.name}</span>
                <div className="flex gap-2">
                   <button onClick={() => openModal('project', p)} className="text-gray-300 hover:text-blue-500"><Pencil size={14}/></button>
                   <button onClick={() => deleteItem(setProjects, projects, p.id)} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                </div>
              </li>
            ))}
             {filteredProjects.length === 0 && <li className="text-sm text-gray-400 italic text-center py-4">{searchQuery ? 'No matching projects.' : 'No projects yet.'}</li>}
          </ul>
        </div>

        {/* Internship Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">💼 Internships</h2>
            <button onClick={() => openModal('internship')} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:text-white"><Plus size={14}/></button>
          </div>
          <div className="space-y-2">
            {filteredInternships.map(i => (
              <div key={i.id} className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm dark:text-white">{i.role}</h4>
                    <p className="text-xs text-gray-500">{i.company}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal('internship', i)} className="text-gray-300 hover:text-blue-500"><Pencil size={14}/></button>
                    <button onClick={() => deleteItem(setInternships, internships, i.id)} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    i.status === 'Accepted' ? 'bg-green-100 text-green-700' : 
                    i.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>{i.status}</span>
                  <span className="text-[10px] text-gray-400">{formatDate(i.date)}</span>
                </div>
              </div>
            ))}
            {filteredInternships.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">{searchQuery ? 'No matching internships.' : 'No applications tracked.'}</p>}
          </div>
        </div>
      </div>

      {/* Code Snippets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">🧑‍💻 Code Snippets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredSnippets.map(s => (
              <div key={s.id} className="space-y-2 group relative">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                   <button onClick={() => deleteItem(setSnippets, snippets, s.id)} className="bg-white dark:bg-gray-800 p-1 rounded shadow text-red-500"><X size={12}/></button>
                </div>
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300">{s.lang}</h4>
                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg font-mono text-xs overflow-x-auto text-gray-800 dark:text-green-400">
                  <pre>{s.code}</pre>
                </div>
              </div>
            ))}
            {filteredSnippets.length === 0 && <p className="text-sm text-gray-400 italic col-span-3 text-center py-4">{searchQuery ? 'No matching snippets.' : 'No snippets added.'}</p>}
          </div>
      </div>

      {/* Resources */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">🔗 Resources</h2>
            <button onClick={() => openModal('resource')} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:text-white"><Plus size={14}/></button>
        </div>
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(r => (
                <tr key={r.id} className="border-b dark:border-gray-700">
                   <td className="px-4 py-3 font-medium dark:text-white">{r.name}</td>
                   <td className="px-4 py-3 text-gray-500">{formatDate(r.date)}</td>
                   <td className="px-4 py-3"><span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs">{r.tag}</span></td>
                   <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal('resource', r)} className="text-gray-300 hover:text-blue-500"><Pencil size={14}/></button>
                      <button onClick={() => deleteItem(setResources, resources, r.id)} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
               {filteredResources.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-gray-400 italic">{searchQuery ? 'No matching resources.' : 'No resources added.'}</td></tr>}
            </tbody>
        </table>
      </div>

      {/* Reusable Modal Rendering */}
      <Modal 
        isOpen={!!modalType} 
        onClose={() => { setModalType(null); setEditingId(null); }} 
        isEditing={!!editingId}
        title={
          modalType === 'link' ? (editingId ? 'Edit Quick Link' : 'Add Quick Link') :
          modalType === 'course' ? (editingId ? 'Edit Course' : 'Add Course') :
          modalType === 'homework' ? (editingId ? 'Edit Homework' : 'Add Homework') :
          modalType === 'project' ? (editingId ? 'Edit Project' : 'Add Project') :
          modalType === 'internship' ? (editingId ? 'Edit Internship' : 'Track Internship') :
          modalType === 'resource' ? (editingId ? 'Edit Resource' : 'Add Resource') : ''
        }
        onSubmit={handleSubmit}
      >
        {modalType === 'link' && (
          <>
            <Input label="Name" field="name" required placeholder="Google" formData={formData} handleInputChange={handleInputChange} />
            <Input label="URL" field="url" required placeholder="https://google.com" formData={formData} handleInputChange={handleInputChange} />
          </>
        )}
        {modalType === 'course' && (
          <>
            <Input label="Course Name" field="name" required placeholder="Data Structures" formData={formData} handleInputChange={handleInputChange} />
            <Input label="Course Code" field="code" placeholder="CS101" formData={formData} handleInputChange={handleInputChange} />
            <Input label="Status" field="status" placeholder="In Progress" formData={formData} handleInputChange={handleInputChange} />
          </>
        )}
        {modalType === 'homework' && (
          <>
            <Input label="Assignment Name" field="name" required placeholder="Lab Report 1" formData={formData} handleInputChange={handleInputChange} />
            <Input label="Course Name" field="course" placeholder="Physics" formData={formData} handleInputChange={handleInputChange} />
            <Input label="Due Date" field="date" type="date" formData={formData} handleInputChange={handleInputChange} />
          </>
        )}
        {modalType === 'project' && (
          <>
            <Input label="Project Name" field="name" required placeholder="Portfolio Website" formData={formData} handleInputChange={handleInputChange} />
          </>
        )}
        {modalType === 'internship' && (
          <>
            <Input label="Role" field="role" required placeholder="Frontend Intern" formData={formData} handleInputChange={handleInputChange} />
            <Input label="Company" field="company" required placeholder="Tech Corp" formData={formData} handleInputChange={handleInputChange} />
            <Input label="Status" field="status" placeholder="Applied" formData={formData} handleInputChange={handleInputChange} />
          </>
        )}
        {modalType === 'resource' && (
          <>
            <Input label="Resource Name" field="name" required placeholder="React Documentation" formData={formData} handleInputChange={handleInputChange} />
            <Input label="Tag/Type" field="tag" placeholder="Documentation, Video, Book" formData={formData} handleInputChange={handleInputChange} />
          </>
        )}
      </Modal>

    </div>
  );
};