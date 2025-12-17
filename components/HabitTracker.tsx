// ... (imports remain the same)
import React, { useState, useMemo } from 'react';
import { 
  Target, X, Check, Plus, Pencil, Trash2, 
  Flame, Calendar, Zap, BookOpen, Activity, 
  Brain, Palette, Wrench, Download, Bell, 
  CheckCheck, RotateCcw, List, Folder, 
  Layout, ClipboardList, Flag, Tag, Filter,
  ChevronDown, ChevronUp, Settings
} from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { Habit, PlannerTask, TaskCategory } from '../types';
import { Heatmap } from './Heatmap';

export const HabitTracker: React.FC = () => {
  // --- State: Habits ---
  const [habits, setHabits] = usePersistentState<Habit[]>('cm_habits', []);
  const [habitName, setHabitName] = useState('');
  
  // Dynamic Categories
  const [habitCategories, setHabitCategories] = usePersistentState<string[]>('cm_habit_cats', ['Study', 'Health', 'Productivity', 'Learning', 'Mindfulness']);
  const [habitCategory, setHabitCategory] = useState('Study');
  const [isManagingHabitCats, setIsManagingHabitCats] = useState(false);
  const [newHabitCat, setNewHabitCat] = useState('');

  const [habitFrequency, setHabitFrequency] = useState('daily');
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [expandedHabitId, setExpandedHabitId] = useState<number | null>(null);

  // --- State: Tasks ---
  const [tasks, setTasks] = usePersistentState<PlannerTask[]>('cm_planner_tasks', []);
  const [categories, setCategories] = usePersistentState<TaskCategory[]>('cm_planner_cats', [
    { id: 'general', name: 'General', color: 'blue' }
  ]);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  
  // Task Form State
  const [taskForm, setTaskForm] = useState<Partial<PlannerTask>>({
    title: '', description: '', category: 'general', priority: 'medium', dueDate: new Date().toISOString().split('T')[0]
  });
  const [catForm, setCatForm] = useState({ name: '', color: 'blue' });
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // --- View State ---
  const [activeView, setActiveView] = useState<'habits' | 'tasks'>('habits');

  // --- Helpers ---
  const today = new Date().toDateString();
  const todayISO = new Date().toISOString().split('T')[0];

  // --- Habit Logic ---
  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    if (editingHabitId) {
      setHabits(habits.map(h => h.id === editingHabitId ? { ...h, name: habitName, category: habitCategory, frequency: habitFrequency } : h));
      setEditingHabitId(null);
    } else {
      const newHabit: Habit = {
        id: Date.now(),
        name: habitName,
        category: habitCategory,
        frequency: habitFrequency,
        streak: 0,
        completedDates: [],
        createdAt: new Date().toISOString()
      };
      setHabits([...habits, newHabit]);
    }
    setHabitName('');
  };

  const toggleHabit = (id: number) => {
    setHabits(habits.map(h => {
      if (h.id !== id) return h;
      const dates = h.completedDates || [];
      const isDone = dates.includes(today);
      let newDates = isDone ? dates.filter(d => d !== today) : [...dates, today];
      
      // Smart Streak Calculation
      let streak = 0;
      const d = new Date();
      const todayStr = d.toDateString();
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterdayStr = y.toDateString();

      // Determine starting point for streak check
      let checkDate = new Date();
      
      if (newDates.includes(todayStr)) {
          // Today is done, start counting from today backwards
          checkDate = new Date(); 
      } else if (newDates.includes(yesterdayStr)) {
          // Today not done, but yesterday is. Streak is alive. Start counting from yesterday.
          checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - 1);
      } else {
          // Neither today nor yesterday done. Streak broken.
          streak = 0;
          return { ...h, completedDates: newDates, streak };
      }

      // Count consecutive days
      while (newDates.includes(checkDate.toDateString())) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
      }
      
      return { ...h, completedDates: newDates, streak };
    }));
  };

  const deleteHabit = (id: number) => {
    if (confirm('Delete this habit?')) {
      setHabits(habits.filter(h => h.id !== id));
      if (editingHabitId === id) {
        setEditingHabitId(null);
        setHabitName('');
      }
    }
  };

  const editHabit = (h: Habit) => {
    setEditingHabitId(h.id);
    setHabitName(h.name);
    if (!habitCategories.includes(h.category) && h.category) {
        setHabitCategories([...habitCategories, h.category]);
    }
    setHabitCategory(h.category || habitCategories[0]);
    setHabitFrequency(h.frequency || 'daily');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addHabitCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitCat && !habitCategories.includes(newHabitCat)) {
      setHabitCategories([...habitCategories, newHabitCat]);
      setNewHabitCat('');
    }
  };

  const removeHabitCat = (cat: string) => {
    if (habitCategories.length > 1) {
      setHabitCategories(habitCategories.filter(c => c !== cat));
       if (habitCategory === cat) setHabitCategory(habitCategories[0]);
    } else {
      alert("You need at least one category.");
    }
  };

  // --- Task Logic ---
  const saveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;

    if (editingTaskId) {
      setTasks(tasks.map(t => t.id === editingTaskId ? { ...t, ...taskForm } as PlannerTask : t));
    } else {
      const newTask: PlannerTask = {
        id: Date.now(),
        title: taskForm.title!,
        description: taskForm.description || '',
        category: taskForm.category || 'general',
        dueDate: taskForm.dueDate || todayISO,
        priority: taskForm.priority as any || 'medium',
        completed: false
      };
      setTasks([...tasks, newTask]);
    }
    closeTaskModal();
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: number) => {
    if (confirm('Delete this task?')) setTasks(tasks.filter(t => t.id !== id));
  };

  const openTaskModal = (task?: PlannerTask) => {
    if (task) {
      setTaskForm(task);
      setEditingTaskId(task.id);
    } else {
      setTaskForm({ title: '', description: '', category: 'general', priority: 'medium', dueDate: todayISO });
      setEditingTaskId(null);
    }
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTaskId(null);
  };

  const addCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) return;
    const id = catForm.name.toLowerCase().replace(/\s+/g, '-');
    setCategories([...categories, { id, name: catForm.name, color: catForm.color }]);
    setCatForm({ name: '', color: 'blue' });
    setIsCatModalOpen(false);
  };

  // --- Stats Calculation ---
  // Habits
  const habitTotal = habits.length;
  const habitCompletedToday = habits.filter(h => (h.completedDates || []).includes(today)).length;
  const habitCompletionRate = habitTotal > 0 ? Math.round((habitCompletedToday / habitTotal) * 100) : 0;
  const habitAvgStreak = habitTotal > 0 ? Math.round(habits.reduce((acc, h) => acc + (h.streak || 0), 0) / habitTotal) : 0;

  // Tasks
  const taskTotal = tasks.length;
  const taskCompleted = tasks.filter(t => t.completed).length;
  const taskPending = taskTotal - taskCompleted;
  const taskDueToday = tasks.filter(t => t.dueDate === todayISO && !t.completed).length;

  // Task Heatmap Data
  const taskHeatmapData = useMemo(() => {
    return tasks.reduce((acc, t) => {
       acc[t.dueDate] = (acc[t.dueDate] || 0) + 1;
       return acc;
    }, {} as Record<string, number>);
  }, [tasks]);

  const filteredTasks = currentCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === currentCategory);

  // Sorting
  filteredTasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="max-w-7xl mx-auto font-sans min-h-[calc(100vh-100px)]">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg">
          {activeView === 'habits' ? <Target size={24} /> : <ClipboardList size={24} />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white bg-clip-text">
            {activeView === 'habits' ? 'Habit Tracker Pro' : 'Task Planner'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeView === 'habits' ? 'Build consistency, one day at a time.' : 'Organize your academic life efficiently.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* View Switcher */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-1">
            <button 
              onClick={() => setActiveView('habits')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeView === 'habits' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <Target size={18} /> Daily Habits
            </button>
            <button 
              onClick={() => setActiveView('tasks')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeView === 'tasks' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <ClipboardList size={18} /> Task Planner
            </button>
          </div>

          {/* Context Sidebar Content */}
          {activeView === 'habits' ? (
            <div className="space-y-6">
               <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                    <Flame size={120} fill="white" />
                  </div>
                  <Flame size={48} className="mx-auto mb-2 text-yellow-300 animate-pulse" fill="currentColor" />
                  <div className="text-5xl font-black mb-1">{habitAvgStreak}</div>
                  <div className="text-sm font-medium opacity-90 uppercase tracking-widest mb-4">Avg Streak</div>
                  <p className="text-xs opacity-80 leading-relaxed">Consistency is key!</p>
               </div>
               
               {/* Quick Habit Stats */}
               <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-500">Total Habits</span>
                   <span className="font-bold dark:text-white">{habitTotal}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-500">Completion</span>
                   <span className="font-bold text-green-500">{habitCompletionRate}%</span>
                 </div>
               </div>
            </div>
          ) : (
            <div className="space-y-6">
               {/* Categories */}
               <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-3 text-sm flex items-center gap-2"><Folder size={16}/> Categories</h3>
                  <ul className="space-y-1">
                    <li>
                      <button 
                        onClick={() => setCurrentCategory('all')}
                        className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-colors ${currentCategory === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        <span className="flex items-center gap-2"><List size={14}/> All Tasks</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${currentCategory === 'all' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-600'}`}>{tasks.length}</span>
                      </button>
                    </li>
                    {categories.map(cat => (
                      <li key={cat.id}>
                        <button 
                          onClick={() => setCurrentCategory(cat.id)}
                          className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-colors ${currentCategory === cat.id ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                          <span className="flex items-center gap-2"><Tag size={14}/> {cat.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${currentCategory === cat.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-600'}`}>{tasks.filter(t => t.category === cat.id).length}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setIsCatModalOpen(true)} className="w-full mt-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
                    <Plus size={14}/> Add Category
                  </button>
               </div>

               {/* Task Stats */}
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                    <div className="text-xl font-bold text-indigo-600">{taskTotal}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                    <div className="text-xl font-bold text-green-500">{taskCompleted}</div>
                    <div className="text-xs text-gray-500">Done</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                    <div className="text-xl font-bold text-orange-500">{taskPending}</div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                    <div className="text-xl font-bold text-red-500">{taskDueToday}</div>
                    <div className="text-xs text-gray-500">Due Today</div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* ---------------- HABITS VIEW ---------------- */}
          {activeView === 'habits' && (
            <>
               {/* Add Habit Form */}
               <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                      {editingHabitId ? 'Edit Habit' : 'Add New Habit'}
                    </h3>
                    <button 
                      onClick={() => setIsManagingHabitCats(!isManagingHabitCats)}
                      className="text-xs flex items-center gap-1 text-gray-500 hover:text-indigo-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full transition-colors"
                    >
                      <Settings size={14} /> {isManagingHabitCats ? 'Done' : 'Edit Categories'}
                    </button>
                  </div>

                  {/* Category Manager */}
                  {isManagingHabitCats && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 animate-fade-in">
                       <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Manage Categories</h4>
                       <form onSubmit={addHabitCat} className="flex gap-2 mb-3">
                          <input 
                             value={newHabitCat}
                             onChange={(e) => setNewHabitCat(e.target.value)}
                             placeholder="New Category Name..."
                             className="flex-1 p-2 rounded-lg text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700">Add</button>
                       </form>
                       <div className="flex flex-wrap gap-2">
                          {habitCategories.map(cat => (
                             <span key={cat} className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full flex items-center gap-1 text-gray-700 dark:text-gray-200">
                                {cat}
                                <button onClick={() => removeHabitCat(cat)} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
                             </span>
                          ))}
                       </div>
                    </div>
                  )}

                  <form onSubmit={addHabit} className="flex flex-col md:flex-row gap-3">
                    <input 
                      value={habitName}
                      onChange={(e) => setHabitName(e.target.value)}
                      placeholder="Habit Name (e.g. Read 20 pages)"
                      className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                    <select 
                      value={habitCategory}
                      onChange={(e) => setHabitCategory(e.target.value)}
                      className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {habitCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select 
                      value={habitFrequency}
                      onChange={(e) => setHabitFrequency(e.target.value)}
                      className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                    <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none">
                      {editingHabitId ? <Check size={20} /> : <Plus size={20} />}
                      {editingHabitId ? 'Save' : 'Add'}
                    </button>
                    {editingHabitId && (
                      <button type="button" onClick={() => { setEditingHabitId(null); setHabitName(''); }} className="bg-gray-100 dark:bg-gray-700 text-gray-500 px-4 rounded-xl hover:bg-gray-200">
                        <X size={20} />
                      </button>
                    )}
                  </form>
               </div>

               {/* Habits List */}
               <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[400px]">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">Your Habits</h3>
                  <div className="space-y-3">
                    {habits.length === 0 && <p className="text-gray-400 text-center py-10">No habits yet. Start small!</p>}
                    {habits.map(habit => {
                      const isCompleted = (habit.completedDates || []).includes(today);
                      const isExpanded = expandedHabitId === habit.id;
                      
                      // Prepare data for Heatmap
                      const heatmapData = (habit.completedDates || []).reduce((acc, d) => {
                          acc[d] = 1;
                          return acc;
                      }, {} as Record<string, number>);

                      return (
                        <div 
                           key={habit.id} 
                           onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                           className={`group flex flex-col bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl transition-all cursor-pointer ${isExpanded ? 'shadow-md ring-2 ring-indigo-500/20' : 'hover:shadow-md'}`}
                        >
                          <div className="p-4 flex items-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleHabit(habit.id); }}
                              className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border-2 transition-all mr-4 ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 dark:border-gray-600 hover:border-green-400'}`}
                            >
                              <Check size={20} strokeWidth={4} />
                            </button>
                            <div className="flex-1">
                              <h4 className={`font-bold text-gray-800 dark:text-white ${isCompleted ? 'line-through opacity-50' : ''}`}>{habit.name}</h4>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="capitalize px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">{habit.category}</span>
                                <span className="flex items-center gap-1"><Flame size={12} className="text-orange-500"/> {habit.streak} day streak</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); editHabit(habit); }} className="p-2 text-gray-400 hover:text-indigo-500"><Pencil size={16}/></button>
                                <button onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                              </div>
                              <div className="text-gray-300 pl-2 border-l border-gray-100 dark:border-gray-700">
                                 {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                              </div>
                            </div>
                          </div>
                          
                          {/* Expanded Heatmap View */}
                          {isExpanded && (
                             <div className="px-4 pb-4 animate-fade-in border-t border-gray-100 dark:border-gray-700 pt-4">
                                <Heatmap data={heatmapData} type="habit" title={`${habit.name} Consistency`} />
                             </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
               </div>
            </>
          )}

          {/* ---------------- TASKS VIEW ---------------- */}
          {activeView === 'tasks' && (
             <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[600px] relative">
                
                {/* Task Heatmap Header */}
                <div className="mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                    <Heatmap 
                        data={taskHeatmapData} 
                        type="task" 
                        colorClass="bg-indigo-500" 
                        title="Workload Heatmap (Tasks per Due Date)"
                    />
                </div>

                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                     <ClipboardList className="text-indigo-600"/> Tasks
                     {currentCategory !== 'all' && <span className="text-sm font-normal text-gray-500">/ {categories.find(c => c.id === currentCategory)?.name}</span>}
                   </h3>
                   <button onClick={() => openTaskModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                      <Plus size={16} /> Add Task
                   </button>
                </div>

                <div className="space-y-3">
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-20">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                         <ClipboardList size={32} />
                      </div>
                      <h3 className="font-bold text-gray-800 dark:text-white mb-2">No tasks found</h3>
                      <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">You don't have any tasks here. Add one to get started!</p>
                      <button onClick={() => openTaskModal()} className="text-indigo-600 font-bold text-sm hover:underline">Add Your First Task</button>
                    </div>
                  )}

                  {filteredTasks.map(task => {
                    const isOverdue = new Date(task.dueDate) < new Date(todayISO) && !task.completed;
                    const isToday = task.dueDate === todayISO;
                    
                    const priorityStyles = {
                      high: { border: 'border-l-red-500', tag: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: 'text-red-500' },
                      medium: { border: 'border-l-orange-500', tag: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: 'text-orange-500' },
                      low: { border: 'border-l-blue-500', tag: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: 'text-blue-500' }
                    };
                    const style = priorityStyles[task.priority] || priorityStyles.medium;
                    
                    return (
                      <div key={task.id} className={`flex items-start gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:translate-y-[-2px] transition-all border-l-4 ${style.border} ${task.completed ? 'opacity-60' : ''}`}>
                        <div className="pt-1">
                          <input 
                            type="checkbox" 
                            checked={task.completed} 
                            onChange={() => toggleTask(task.id)}
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1">
                           <h4 className={`font-bold text-gray-800 dark:text-white text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</h4>
                           {task.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{task.description}</p>}
                           
                           <div className="flex flex-wrap gap-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isOverdue ? 'bg-red-100 text-red-600' : isToday ? 'bg-green-100 text-green-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>
                                 <Calendar size={12}/> {isToday ? 'Today' : isOverdue ? 'Overdue' : task.dueDate}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${style.tag} capitalize`}>
                                 <Flag size={12} className={style.icon} fill="currentColor"/> {task.priority} Priority
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 capitalize">
                                 <Tag size={12}/> {categories.find(c => c.id === task.category)?.name || task.category}
                              </span>
                           </div>
                        </div>
                        <div className="flex flex-col gap-2">
                           <button onClick={() => openTaskModal(task)} className="text-gray-400 hover:text-indigo-600"><Pencil size={16}/></button>
                           <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
          )}

        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-xl text-gray-800 dark:text-white">{editingTaskId ? 'Edit Task' : 'Add New Task'}</h3>
                 <button onClick={closeTaskModal} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
              </div>
              <form onSubmit={saveTask} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                   <input 
                      required
                      value={taskForm.title}
                      onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      placeholder="Enter task title"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                   <textarea 
                      value={taskForm.description}
                      onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white h-24 resize-none"
                      placeholder="Details about the task..."
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                      <select 
                          value={taskForm.category}
                          onChange={e => setTaskForm({...taskForm, category: e.target.value})}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                      >
                         {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                      <select 
                          value={taskForm.priority}
                          onChange={e => setTaskForm({...taskForm, priority: e.target.value as any})}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                      >
                         <option value="low">Low</option>
                         <option value="medium">Medium</option>
                         <option value="high">High</option>
                      </select>
                    </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                   <input 
                      type="date"
                      required
                      value={taskForm.dueDate}
                      onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                   />
                 </div>
                 <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={closeTaskModal} className="px-5 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">
                       {editingTaskId ? 'Save Changes' : 'Add Task'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-xl text-gray-800 dark:text-white">Add Category</h3>
                 <button onClick={() => setIsCatModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
              </div>
              <form onSubmit={addCategory} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                   <input 
                      required
                      value={catForm.name}
                      onChange={e => setCatForm({...catForm, name: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      placeholder="e.g. Work"
                   />
                 </div>
                 <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-5 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
                       Add
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};