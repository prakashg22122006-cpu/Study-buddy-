import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  GraduationCap, 
  IndianRupee, 
  Clock, 
  Target, 
  BookOpen, 
  Filter, 
  PenTool, 
  Brain, 
  Sun, 
  Moon, 
  Menu,
  PieChart,
  Timer
} from 'lucide-react';

import { usePersistentState } from './hooks/usePersistentState';
import { Dashboard } from './components/Dashboard';
import { Todo } from './components/Todo';
import { Finance } from './components/Finance';
import { Pomodoro } from './components/Pomodoro';
import { StudyPlanner } from './components/StudyPlanner';
import { HabitTracker } from './components/HabitTracker';
import { Journal } from './components/Journal';
import { PriorityMatrix } from './components/PriorityMatrix';
import { Workspace } from './components/Workspace';
import { Analysis } from './components/Analysis';
import { Countdown } from './components/Countdown';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = usePersistentState('cm_theme', false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analysis', label: 'Analysis', icon: PieChart },
    { id: 'todo', label: 'Tasks', icon: CheckSquare },
    { id: 'study', label: 'Academics', icon: GraduationCap },
    { id: 'finance', label: 'Finance', icon: IndianRupee },
    { id: 'pomodoro', label: 'Study Timer', icon: Clock },
    { id: 'countdown', label: 'Countdowns', icon: Timer },
    { id: 'habit', label: 'Habits', icon: Target },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'matrix', label: 'Matrix', icon: Filter },
    { id: 'workspace', label: 'Workspace', icon: PenTool },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard changeView={setActiveTab} />;
      case 'analysis': return <Analysis />;
      case 'todo': return <Todo />;
      case 'finance': return <Finance />;
      case 'pomodoro': return <Pomodoro />;
      case 'study': return <StudyPlanner />;
      case 'habit': return <HabitTracker />;
      case 'journal': return <Journal />;
      case 'matrix': return <PriorityMatrix />;
      case 'workspace': return <Workspace />;
      case 'countdown': return <Countdown />;
      default: return <Dashboard changeView={setActiveTab} />;
    }
  };

  return (
    <div className={`h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200 font-sans overflow-hidden`}>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 z-20 shrink-0 relative">
        <div className="flex items-center gap-2">
          <Brain className="text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-lg dark:text-white">Study Buddy</span>
        </div>
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar (Desktop & Mobile Drawer) */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-[60] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
            transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none
            md:relative md:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="p-6 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-2">
              <Brain className="text-indigo-600 dark:text-indigo-400" size={28} />
              <span className="font-bold text-xl dark:text-white">Study Buddy</span>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="md:block hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 space-y-1 pb-4">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-[55] md:hidden backdrop-blur-sm"></div>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto w-full relative ${activeTab === 'pomodoro' ? 'bg-[#09090b]' : ''}`}>
          <div className={`${activeTab === 'pomodoro' ? 'h-full pb-[80px] md:pb-0' : 'p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto h-full'}`}>
             {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-around p-3 z-30 shrink-0 pb-safe relative">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-500 dark:text-gray-400 flex flex-col items-center gap-1">
          <Menu size={20} />
          <span className="text-[10px]">Menu</span>
        </button>
        <button onClick={() => setActiveTab('dashboard')} className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px]">Home</span>
        </button>
        <button onClick={() => setActiveTab('pomodoro')} className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'pomodoro' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
          <Clock size={20} />
          <span className="text-[10px]">Study</span>
        </button>
      </div>
    </div>
  );
}