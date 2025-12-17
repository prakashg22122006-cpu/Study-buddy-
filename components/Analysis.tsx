import React, { useMemo } from 'react';
import { 
  PieChart, BarChart2, Download, Activity, 
  CheckCircle, TrendingUp, DollarSign, BookOpen, 
  Briefcase, Clock, Calendar, Target, Layers,
  GraduationCap, Brain, ArrowUpRight, ArrowDownRight,
  AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePersistentState } from '../hooks/usePersistentState';
import { formatCurrency, formatDate } from '../utils/helpers';
import { 
  Course, Homework, Transaction, FocusSession, 
  Habit, TodoItem, PlannerTask, Exam, Internship, 
  Project, MatrixState, JournalEntry 
} from '../types';
import { Heatmap } from './Heatmap';

export const Analysis: React.FC = () => {
  // --- Data Retrieval (All Modules) ---
  const [courses] = usePersistentState<Course[]>('cm_dash_courses', []);
  const [homework] = usePersistentState<Homework[]>('cm_dash_homework', []);
  const [transactions] = usePersistentState<Transaction[]>('cm_finance', []);
  const [budgets] = usePersistentState<Record<string, number>>('cm_finance_budgets', {});
  const [focusHistory] = usePersistentState<FocusSession[]>('flow_history', []);
  const [habits] = usePersistentState<Habit[]>('cm_habits', []);
  const [todos] = usePersistentState<TodoItem[]>('cm_todos', []);
  const [plannerTasks] = usePersistentState<PlannerTask[]>('cm_planner_tasks', []);
  const [exams] = usePersistentState<Exam[]>('cm_study', []);
  const [internships] = usePersistentState<Internship[]>('cm_dash_internships', []);
  const [projects] = usePersistentState<Project[]>('cm_dash_projects', []);
  const [matrix] = usePersistentState<MatrixState>('cm_matrix', { q1: [], q2: [], q3: [], q4: [] });
  const [journal] = usePersistentState<JournalEntry[]>('cm_journal', []);

  // --- Calculations ---

  // 1. Focus Heatmap Data (Minutes per day)
  const focusHeatmapData = useMemo(() => {
    return focusHistory.reduce((acc, s) => {
        const d = new Date(s.date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const iso = `${y}-${m}-${day}`;
        acc[iso] = (acc[iso] || 0) + s.durationMinutes;
        return acc;
    }, {} as Record<string, number>);
  }, [focusHistory]);

  // 2. Productivity: Task Completion
  const allTasks = useMemo(() => {
    const todoItems = todos.map(t => ({ id: `t-${t.id}`, title: t.text, completed: t.completed, type: 'Todo' }));
    const hwItems = homework.map(h => ({ id: `h-${h.id}`, title: h.name, completed: h.complete, type: 'Homework' }));
    const planItems = plannerTasks.map(p => ({ id: `p-${p.id}`, title: p.title, completed: p.completed, type: 'Planner' }));
    return [...todoItems, ...hwItems, ...planItems];
  }, [todos, homework, plannerTasks]);

  const taskStats = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending: total - completed, rate };
  }, [allTasks]);

  // 3. Focus: Last 7 Days
  const focusStats = useMemo(() => {
    const totalMinutes = focusHistory.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    
    // Last 7 days chart data
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toDateString();
        const mins = focusHistory
            .filter(s => new Date(s.date).toDateString() === dateStr)
            .reduce((acc, s) => acc + s.durationMinutes, 0);
        last7Days.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), val: mins });
    }
    const maxVal = Math.max(...last7Days.map(d => d.val), 60); // Min scale 60m
    return { totalHours, last7Days, maxVal };
  }, [focusHistory]);

  // 4. Finance & Budgets
  const financeStats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense' || !t.type).reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;

    // Budget Calcs
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = transactions.filter(t => {
       const d = new Date(t.date);
       return (t.type === 'expense' || !t.type) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalBudget = Object.values(budgets).reduce((a, b) => a + b, 0);
    const monthlyTotalSpent = monthlyExpenses.reduce((acc, t) => acc + t.amount, 0);
    const budgetUtilization = totalBudget > 0 ? (monthlyTotalSpent / totalBudget) * 100 : 0;

    return { income, expense, balance, totalBudget, monthlyTotalSpent, budgetUtilization };
  }, [transactions, budgets]);

  // 5. Habits
  const habitStats = useMemo(() => {
    const total = habits.length;
    const avgStreak = total > 0 ? (habits.reduce((acc, h) => acc + h.streak, 0) / total).toFixed(1) : '0';
    return { total, avgStreak };
  }, [habits]);

  // 6. Academics
  const academicStats = useMemo(() => {
    const pendingHw = homework.filter(h => !h.complete).length;
    const upcomingExams = exams.filter(e => new Date(e.date) >= new Date()).length;
    return { courses: courses.length, pendingHw, upcomingExams };
  }, [courses, homework, exams]);

  // 7. Exam Timeline
  const upcomingExamsList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return exams
      .filter(e => new Date(e.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => {
        const examDate = new Date(e.date);
        const diffTime = examDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return { ...e, daysLeft };
      });
  }, [exams]);

  // --- PDF Generation ---
  const generateReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text("Study Buddy - Full System Report", 14, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
    
    yPos += 10;
    doc.setDrawColor(200);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 15;

    // --- Section 1: Executive Summary ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Executive Summary", 14, yPos);
    yPos += 8;
    
    const summaryData = [
      ['Total Balance', formatCurrency(financeStats.balance)],
      ['Monthly Budget Used', `${Math.round(financeStats.budgetUtilization)}% (${formatCurrency(financeStats.monthlyTotalSpent)})`],
      ['Focus Hours', `${focusStats.totalHours} hrs`],
      ['Task Completion', `${taskStats.rate}%`],
      ['Active Habits', `${habitStats.total}`],
      ['Pending Homework', `${academicStats.pendingHw}`],
      ['Upcoming Exams', `${academicStats.upcomingExams}`]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', width: 80 } }
    });

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15;

    // --- Section 2: Financials ---
    doc.text("Recent Finances (Last 15)", 14, yPos);
    yPos += 5;
    
    const txRows = transactions.slice(0, 15).map(t => [
        formatDate(t.date), 
        t.type === 'income' ? 'Income' : 'Expense', 
        t.category, 
        t.desc || '-', 
        formatCurrency(t.amount)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Type', 'Category', 'Note', 'Amount']],
      body: txRows,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }, // Emerald
      styles: { fontSize: 8 },
    });

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15;

    // --- Section 3: Academics ---
    // Check if new page needed
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    
    doc.text("Academic Status", 14, yPos);
    yPos += 5;

    const hwRows = homework.filter(h => !h.complete).map(h => [
        h.name, h.course, formatDate(h.date), 'Pending'
    ]);

    if (hwRows.length > 0) {
        autoTable(doc, {
            startY: yPos,
            head: [['Assignment', 'Course', 'Due Date', 'Status']],
            body: hwRows,
            theme: 'striped',
            headStyles: { fillColor: [239, 68, 68] }, // Red
        });
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("No pending homework.", 14, yPos + 5);
        yPos += 15;
    }

    // --- Section 4: Projects & Career ---
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Career & Projects", 14, yPos);
    
    const projectRows = projects.map(p => [p.name, 'Project']);
    const internshipRows = internships.map(i => [`${i.role} @ ${i.company}`, i.status]);
    
    autoTable(doc, {
        startY: yPos + 5,
        head: [['Item', 'Type/Status']],
        body: [...projectRows, ...internshipRows],
        headStyles: { fillColor: [245, 158, 11] }, // Amber
    });

    doc.save(`StudyBuddy_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Activity className="text-indigo-500" /> Analytics & Reports
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Overview of your productivity, finances, and growth.</p>
         </div>
         <button 
            onClick={generateReport}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
         >
            <Download size={18} /> Download Full Report
         </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 0. Heatmap (Full Width) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
             <Heatmap 
                data={focusHeatmapData} 
                type="task" 
                colorClass="bg-amber-500" 
                title="Study Consistency (Focus Minutes)" 
                maxValue={60} 
             />
        </div>

        {/* 1. Productivity Card (Donut Chart) */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500"/> Task Completion</h3>
            </div>
            
            <div className="flex items-center justify-center py-4">
                {/* Custom SVG Donut */}
                <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="15" fill="transparent" className="text-gray-100 dark:text-gray-700" />
                        <circle 
                            cx="80" cy="80" r="70" 
                            stroke="currentColor" strokeWidth="15" 
                            fill="transparent" 
                            strokeDasharray={440} // 2 * pi * 70
                            strokeDashoffset={440 - (440 * taskStats.rate) / 100}
                            className="text-emerald-500 transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-800 dark:text-white">{taskStats.rate}%</span>
                        <span className="text-xs text-gray-500">Completed</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl text-center">
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{taskStats.completed}</div>
                    <div className="text-xs text-gray-500">Done</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl text-center">
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{taskStats.pending}</div>
                    <div className="text-xs text-gray-500">Pending</div>
                </div>
            </div>
        </div>

        {/* 2. Focus History (Bar Chart) */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Clock size={18} className="text-amber-500"/> Focus Trends</h3>
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{focusStats.totalHours} <span className="text-sm font-normal text-gray-500">hours total</span></span>
            </div>
            
            <div className="h-48 flex items-end gap-2 md:gap-6 pt-8">
                {focusStats.last7Days.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg relative h-full flex items-end overflow-hidden">
                            <div 
                                style={{ height: `${(d.val / focusStats.maxVal) * 100}%` }} 
                                className="w-full bg-amber-400 group-hover:bg-amber-500 transition-all duration-500 rounded-t-lg relative"
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {d.val} mins
                                </div>
                            </div>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{d.day}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* 3. Finance Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><DollarSign size={18} className="text-blue-500"/> Financial Health</h3>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-6">
                <div className="text-sm opacity-80 mb-1">Net Balance</div>
                <div className="text-3xl font-bold">{formatCurrency(financeStats.balance)}</div>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Income</span>
                        <span className="font-bold text-emerald-500 flex items-center gap-1"><ArrowUpRight size={14}/> {formatCurrency(financeStats.income)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min((financeStats.income / (financeStats.income + financeStats.expense || 1)) * 100, 100)}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Expenses</span>
                        <span className="font-bold text-red-500 flex items-center gap-1"><ArrowDownRight size={14}/> {formatCurrency(financeStats.expense)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min((financeStats.expense / (financeStats.income + financeStats.expense || 1)) * 100, 100)}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Budget Health Bar */}
            {financeStats.totalBudget > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Budget Used</span>
                        <span className={`font-bold flex items-center gap-1 ${financeStats.budgetUtilization > 100 ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                            {Math.round(financeStats.budgetUtilization)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                         <div 
                             className={`h-full rounded-full ${financeStats.budgetUtilization > 100 ? 'bg-red-500' : financeStats.budgetUtilization > 85 ? 'bg-orange-500' : 'bg-blue-500'}`} 
                             style={{ width: `${Math.min(financeStats.budgetUtilization, 100)}%` }}
                         ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{formatCurrency(financeStats.monthlyTotalSpent)} spent</span>
                        <span>{formatCurrency(financeStats.totalBudget)} limit</span>
                    </div>
                </div>
            )}
        </div>

        {/* 4. Academic Snapshot */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><GraduationCap size={18} className="text-purple-500"/> Academics</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/50">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{academicStats.pendingHw}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Assignments Pending</div>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-2xl border border-pink-100 dark:border-pink-800/50">
                    <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-1">{academicStats.upcomingExams}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Upcoming Exams</div>
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Active Courses</span>
                    <span className="font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">{academicStats.courses}</span>
                </div>
            </div>
        </div>

        {/* 5. Exam Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Calendar size={18} className="text-pink-500"/> Exam Timeline
                </h3>
            </div>
            
            <div className="space-y-4 relative pl-4 border-l-2 border-gray-100 dark:border-gray-700">
               {upcomingExamsList.length === 0 && <p className="text-gray-400 text-sm">No upcoming exams.</p>}
               {upcomingExamsList.slice(0, 5).map(exam => (
                 <div key={exam.id} className="relative pl-4">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${exam.daysLeft <= 3 ? 'bg-red-500' : exam.daysLeft <= 7 ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                    
                    <div className="flex justify-between items-start">
                       <div>
                          <h4 className="font-bold text-gray-800 dark:text-white text-sm">{exam.subject}</h4>
                          <p className="text-xs text-gray-500">{exam.type}</p>
                       </div>
                       <div className="text-right">
                          <div className={`text-xs font-bold ${exam.daysLeft <= 3 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                             {exam.daysLeft === 0 ? 'Today' : `${exam.daysLeft} days`}
                          </div>
                          <div className="text-[10px] text-gray-400">{formatDate(exam.date)}</div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
        </div>

        {/* 6. Career & Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Briefcase size={18} className="text-blue-500"/> Career Growth</h3>
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Layers size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-gray-800 dark:text-white">{projects.length} Projects</div>
                        <div className="text-xs text-gray-500">Portfolio Items</div>
                    </div>
                </div>
                 <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <Target size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-gray-800 dark:text-white">{internships.length} Applications</div>
                        <div className="text-xs text-gray-500">Internship Tracker</div>
                    </div>
                </div>
            </div>
        </div>

        {/* 7. Habits Streak */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Target size={18} className="text-red-500"/> Consistency</h3>
            </div>
            
            <div className="text-center py-4">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                    {habitStats.avgStreak}
                </div>
                <div className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-2">Avg. Day Streak</div>
            </div>

            <div className="space-y-2 mt-2">
                {habits.slice(0, 3).map(h => (
                    <div key={h.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">{h.name}</span>
                        <span className="font-bold text-orange-500">🔥 {h.streak}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

    </div>
  );
};