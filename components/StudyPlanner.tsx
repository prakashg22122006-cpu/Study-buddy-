import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, Book, FileText, BarChart2, 
  TrendingUp, Plus, Trash2, Pencil, Calendar, 
  User, CheckCircle, AlertCircle, Search, X,
  ChevronRight, Award, MoreVertical
} from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { formatDate } from '../utils/helpers';
import { AcademicSubject, AcademicExam, AcademicGrade, AcademicProfile } from '../types';

export const StudyPlanner: React.FC = () => {
  // --- Data State ---
  const [subjects, setSubjects] = usePersistentState<AcademicSubject[]>('cm_acad_subjects', []);
  const [exams, setExams] = usePersistentState<AcademicExam[]>('cm_acad_exams', []);
  const [grades, setGrades] = usePersistentState<AcademicGrade[]>('cm_acad_grades', []);
  const [profile, setProfile] = usePersistentState<AcademicProfile>('cm_acad_profile', {
    firstName: '', lastName: '', course: '', college: '', currentSemester: 1, targetCGPA: 9.0
  });

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subjects' | 'exams' | 'grades' | 'progress'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'subject' | 'exam' | 'grade' | 'profile'>('subject');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Form States ---
  const [subjectForm, setSubjectForm] = useState<Partial<AcademicSubject>>({});
  const [examForm, setExamForm] = useState<Partial<AcademicExam>>({});
  const [gradeForm, setGradeForm] = useState<Partial<AcademicGrade>>({});
  const [profileForm, setProfileForm] = useState<Partial<AcademicProfile>>({});

  // --- Helpers & Calculators ---

  const getGradePoint = (percentage: number) => {
    if (percentage >= 90) return 10;
    if (percentage >= 80) return 9;
    if (percentage >= 70) return 8;
    if (percentage >= 60) return 7;
    if (percentage >= 50) return 6;
    if (percentage >= 45) return 5;
    if (percentage >= 40) return 4;
    return 0;
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'O';
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B+';
    if (percentage >= 50) return 'B';
    if (percentage >= 45) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  // Calculate stats for Dashboard & Progress
  const stats = useMemo(() => {
    let totalCredits = 0;
    let totalWeightedGP = 0;
    
    // Group grades by subject to calculate subject-wise percentage first
    // Subject Percentage = Sum( (MarksObtained / MaxMarks) * Weightage )
    const subjectScores: Record<string, number> = {};
    const subjectWeights: Record<string, number> = {}; // To check if 100% weightage is covered (optional validation)

    grades.forEach(g => {
        const exam = exams.find(e => e.id === g.examId);
        if (exam) {
            const percentage = (g.marksObtained / exam.maxMarks) * 100;
            const weightedScore = (percentage * exam.weightage) / 100;
            subjectScores[g.subjectId] = (subjectScores[g.subjectId] || 0) + weightedScore;
            subjectWeights[g.subjectId] = (subjectWeights[g.subjectId] || 0) + exam.weightage;
        }
    });

    Object.keys(subjectScores).forEach(subId => {
        const subject = subjects.find(s => s.id === subId);
        // Only calculate if subject exists
        if (subject) {
            // Normalize if total weightage isn't 100? For now, assume subjectScore is the final percentage (out of 100)
            // If total weightage recorded < 100, this might be partial. 
            // We'll calculate CGPA based on current standing.
            
            // If total weightage > 0, we can project to 100% or just take current accumulated.
            // Standard approach: Accumulated Grade Point
            
            const finalPercentage = subjectScores[subId]; // This assumes weights sum to 100 for a full grade
            // If we want to calculate running GPA, we might divide by current weight sum, but usually, CGPA is finalized per sem.
            // Let's stick to simple: Sum of weighted parts is the final mark for now.
            
            // Adjust: If total weights so far are 50% and student got 40%, they have 80% running average?
            // For simplicity in this dashboard: Grade = Sum of (Percentage * Weight%)
            
            const gp = getGradePoint(finalPercentage);
            totalWeightedGP += gp * subject.credits;
            totalCredits += subject.credits;
        }
    });

    const cgpa = totalCredits > 0 ? (totalWeightedGP / totalCredits).toFixed(2) : '0.00';
    
    const upcomingExams = exams.filter(e => new Date(e.date) >= new Date() && e.status !== 'Completed').length;
    const completedExams = exams.filter(e => e.status === 'Completed').length;

    return { cgpa, totalCredits, upcomingExams, completedExams };
  }, [subjects, exams, grades]);

  // --- Actions ---

  const handleModalOpen = (mode: typeof modalMode, data?: any) => {
    setModalMode(mode);
    setEditingId(data?.id || null);
    if (mode === 'subject') setSubjectForm(data || { name: '', code: '', credits: 3, semester: profile.currentSemester, type: 'Core' });
    if (mode === 'exam') setExamForm(data || { type: 'Internal 1', weightage: 20, maxMarks: 50, status: 'Upcoming', date: new Date().toISOString().split('T')[0] });
    if (mode === 'grade') setGradeForm(data || { marksObtained: 0 });
    if (mode === 'profile') setProfileForm(profile);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (modalMode === 'subject') {
        const payload = { ...subjectForm, id: editingId || Date.now().toString() } as AcademicSubject;
        setSubjects(prev => editingId ? prev.map(i => i.id === editingId ? payload : i) : [...prev, payload]);
    } else if (modalMode === 'exam') {
        const payload = { ...examForm, id: editingId || Date.now().toString() } as AcademicExam;
        setExams(prev => editingId ? prev.map(i => i.id === editingId ? payload : i) : [...prev, payload]);
    } else if (modalMode === 'grade') {
        const payload = { ...gradeForm, id: editingId || Date.now().toString() } as AcademicGrade;
        setGrades(prev => editingId ? prev.map(i => i.id === editingId ? payload : i) : [...prev, payload]);
    } else if (modalMode === 'profile') {
        setProfile({ ...profile, ...profileForm } as AcademicProfile);
    }
    
    setIsModalOpen(false);
  };

  const deleteItem = (id: string, type: 'subject' | 'exam' | 'grade') => {
      if (!confirm('Are you sure?')) return;
      if (type === 'subject') {
          setSubjects(prev => prev.filter(i => i.id !== id));
          setExams(prev => prev.filter(i => i.subjectId !== id)); // Cascade delete
          setGrades(prev => prev.filter(i => i.subjectId !== id));
      }
      if (type === 'exam') {
          setExams(prev => prev.filter(i => i.id !== id));
          setGrades(prev => prev.filter(i => i.examId !== id));
      }
      if (type === 'grade') {
          setGrades(prev => prev.filter(i => i.id !== id));
      }
  };

  // --- Render Helpers ---
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown Subject';
  const getExamName = (id: string) => {
      const e = exams.find(x => x.id === id);
      return e ? `${getSubjectName(e.subjectId)} - ${e.type}` : 'Unknown Exam';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24 font-sans animate-fade-in min-h-[calc(100vh-100px)]">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <GraduationCap className="text-purple-600" size={32} />
                Academic Tracker
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage subjects, exams, and track your GPA.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 flex overflow-x-auto no-scrollbar">
            {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
                { id: 'subjects', label: 'Subjects', icon: Book },
                { id: 'exams', label: 'Exams', icon: Calendar },
                { id: 'grades', label: 'Grades', icon: Award },
                { id: 'progress', label: 'Progress', icon: TrendingUp },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* --- DASHBOARD VIEW --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Book size={60}/></div>
                    <div className="text-gray-500 text-xs uppercase font-bold mb-1">Total Subjects</div>
                    <div className="text-3xl font-bold text-gray-800 dark:text-white">{subjects.length}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Calendar size={60} className="text-orange-500"/></div>
                    <div className="text-gray-500 text-xs uppercase font-bold mb-1">Upcoming Exams</div>
                    <div className="text-3xl font-bold text-orange-500">{stats.upcomingExams}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CheckCircle size={60} className="text-green-500"/></div>
                    <div className="text-gray-500 text-xs uppercase font-bold mb-1">Completed Exams</div>
                    <div className="text-3xl font-bold text-green-500">{stats.completedExams}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-5 rounded-2xl shadow-lg text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-20"><TrendingUp size={60}/></div>
                    <div className="text-purple-200 text-xs uppercase font-bold mb-1">Current CGPA</div>
                    <div className="text-3xl font-bold">{stats.cgpa}</div>
                </div>
            </div>

            {/* Upcoming Exams List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><Calendar size={20} className="text-purple-500"/> Upcoming Exams</h3>
                    <button onClick={() => setActiveTab('exams')} className="text-sm text-purple-600 hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                    {exams.filter(e => new Date(e.date) >= new Date() && e.status !== 'Completed')
                          .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .slice(0, 5)
                          .map(exam => (
                        <div key={exam.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-l-4 border-purple-500">
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-white">{getSubjectName(exam.subjectId)}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{exam.type} • {formatDate(exam.date)}</p>
                            </div>
                            <div className="text-right">
                                <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded font-bold">{exam.weightage}% Weight</span>
                            </div>
                        </div>
                    ))}
                    {stats.upcomingExams === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            <CheckCircle size={48} className="mx-auto mb-2 opacity-20"/>
                            <p>No upcoming exams. You're all clear!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- SUBJECTS VIEW --- */}
      {activeTab === 'subjects' && (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Search subjects..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none text-sm w-64 dark:text-white"
                    />
                </div>
                <button onClick={() => handleModalOpen('subject')} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-700">
                    <Plus size={18}/> Add Subject
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(subject => (
                    <div key={subject.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group relative">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleModalOpen('subject', subject)} className="p-1.5 text-gray-400 hover:text-blue-500 bg-gray-100 dark:bg-gray-700 rounded"><Pencil size={14}/></button>
                            <button onClick={() => deleteItem(subject.id, 'subject')} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-gray-700 rounded"><Trash2 size={14}/></button>
                        </div>
                        <div className="flex justify-between items-start mb-3">
                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded font-bold uppercase">{subject.code}</span>
                            <span className="text-xs text-gray-400">Sem {subject.semester}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1 truncate" title={subject.name}>{subject.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{subject.type} • {subject.credits} Credits</p>
                        {subject.faculty && <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3"><User size={12}/> {subject.faculty}</div>}
                    </div>
                ))}
                {subjects.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-400">
                        <Book size={48} className="mx-auto mb-2 opacity-20"/>
                        <p>No subjects added yet.</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- EXAMS VIEW --- */}
      {activeTab === 'exams' && (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h2 className="font-bold text-gray-800 dark:text-white">Exam Schedule</h2>
                <button onClick={() => handleModalOpen('exam')} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-700">
                    <Plus size={18}/> Add Exam
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium border-b border-gray-100 dark:border-gray-700">
                        <tr>
                            <th className="p-4">Subject</th>
                            <th className="p-4">Exam Type</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Weightage</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">No exams scheduled.</td></tr>}
                        {exams.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(exam => (
                            <tr key={exam.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="p-4 font-medium dark:text-white">{getSubjectName(exam.subjectId)}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{exam.type}</td>
                                <td className="p-4 text-gray-500">{formatDate(exam.date)}</td>
                                <td className="p-4"><span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs font-bold">{exam.weightage}%</span></td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        exam.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                        exam.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                                        'bg-orange-100 text-orange-700'
                                    }`}>
                                        {exam.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleModalOpen('exam', exam)} className="text-gray-400 hover:text-blue-500"><Pencil size={16}/></button>
                                        <button onClick={() => deleteItem(exam.id, 'exam')} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* --- GRADES VIEW --- */}
      {activeTab === 'grades' && (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-lg">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Academic Performance</h2>
                    <p className="text-gray-400 text-sm">Cumulative Grade Point Average (CGPA)</p>
                </div>
                <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="text-right">
                        <div className="text-4xl font-bold text-green-400">{stats.cgpa}</div>
                        <div className="text-xs text-gray-400">/ 10.0</div>
                    </div>
                    <div className="h-12 w-px bg-gray-700"></div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{stats.totalCredits}</div>
                        <div className="text-xs text-gray-400">Credits Earned</div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={() => handleModalOpen('grade')} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-700">
                    <Plus size={18}/> Add Grade
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grades.map(grade => {
                    const exam = exams.find(e => e.id === grade.examId);
                    const subject = subjects.find(s => s.id === grade.subjectId);
                    const percentage = exam ? (grade.marksObtained / exam.maxMarks) * 100 : 0;
                    
                    return (
                        <div key={grade.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${percentage >= 80 ? 'bg-green-100 text-green-600' : percentage >= 60 ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                                    {getGradeLetter(percentage)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-white">{subject?.name}</h4>
                                    <p className="text-xs text-gray-500">{exam?.type} • {grade.marksObtained}/{exam?.maxMarks}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-gray-800 dark:text-white">{percentage.toFixed(1)}%</div>
                                <div className="flex gap-2 justify-end mt-1">
                                    <button onClick={() => handleModalOpen('grade', grade)} className="text-gray-400 hover:text-blue-500"><Pencil size={14}/></button>
                                    <button onClick={() => deleteItem(grade.id, 'grade')} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* --- PROGRESS VIEW --- */}
      {activeTab === 'progress' && (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Academic Profile</h3>
                        <p className="text-sm text-gray-500">Your current standing and goals.</p>
                    </div>
                    <button onClick={() => handleModalOpen('profile')} className="text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 p-2 rounded-lg"><Pencil size={20}/></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Student Name</label>
                            <div className="text-lg font-medium dark:text-white">{profile.firstName} {profile.lastName || '(Not Set)'}</div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Course & College</label>
                            <div className="text-lg font-medium dark:text-white">{profile.course || 'Unknown Course'}</div>
                            <div className="text-sm text-gray-500">{profile.college}</div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Goal Progress</label>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="dark:text-white font-bold">{stats.cgpa} CGPA</span>
                                <span className="text-gray-500">Target: {profile.targetCGPA}</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                                <div 
                                    className="bg-purple-600 h-full rounded-full transition-all duration-1000" 
                                    style={{ width: `${Math.min((parseFloat(stats.cgpa) / profile.targetCGPA) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Current Semester</label>
                            <div className="flex gap-2 mt-2">
                                {[1,2,3,4,5,6,7,8].map(sem => (
                                    <div 
                                        key={sem} 
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                            sem < profile.currentSemester ? 'bg-purple-600 text-white' : 
                                            sem === profile.currentSemester ? 'ring-2 ring-purple-600 text-purple-600 dark:text-purple-400' : 
                                            'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                        }`}
                                    >
                                        {sem}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Semester Timeline</h3>
                <div className="space-y-6 border-l-2 border-gray-100 dark:border-gray-700 ml-3 pl-6 relative">
                    {[...Array(profile.currentSemester)].map((_, i) => {
                        const sem = i + 1;
                        // Filter subjects for this semester
                        const semSubjects = subjects.filter(s => s.semester === sem);
                        return (
                            <div key={sem} className="relative">
                                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-purple-600 border-4 border-white dark:border-gray-800"></div>
                                <h4 className="font-bold text-gray-800 dark:text-white">Semester {sem}</h4>
                                <p className="text-sm text-gray-500 mb-2">{semSubjects.length} Subjects</p>
                                <div className="flex flex-wrap gap-2">
                                    {semSubjects.map(s => (
                                        <span key={s.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                            {s.code}
                                        </span>
                                    ))}
                                    {semSubjects.length === 0 && <span className="text-xs text-gray-400 italic">No subjects recorded.</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
      )}

      {/* --- UNIVERSAL MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white capitalize">
                        {editingId ? `Edit ${modalMode}` : `Add ${modalMode}`}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
                </div>
                
                <form onSubmit={handleSave} className="space-y-4">
                    
                    {/* SUBJECT FORM */}
                    {modalMode === 'subject' && (
                        <>
                            <input 
                                required placeholder="Subject Name" 
                                value={subjectForm.name} 
                                onChange={e => setSubjectForm({...subjectForm, name: e.target.value})}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    placeholder="Code (e.g. CS101)" 
                                    value={subjectForm.code} 
                                    onChange={e => setSubjectForm({...subjectForm, code: e.target.value})}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                                />
                                <input 
                                    type="number" placeholder="Credits" 
                                    value={subjectForm.credits} 
                                    onChange={e => setSubjectForm({...subjectForm, credits: parseInt(e.target.value)})}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <select 
                                    value={subjectForm.type} 
                                    onChange={e => setSubjectForm({...subjectForm, type: e.target.value})}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                                >
                                    <option value="Core">Core</option>
                                    <option value="Elective">Elective</option>
                                    <option value="Lab">Lab</option>
                                </select>
                                <input 
                                    type="number" placeholder="Semester" 
                                    value={subjectForm.semester} 
                                    onChange={e => setSubjectForm({...subjectForm, semester: parseInt(e.target.value)})}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                                />
                            </div>
                            <input 
                                placeholder="Faculty Name (Optional)" 
                                value={subjectForm.faculty || ''} 
                                onChange={e => setSubjectForm({...subjectForm, faculty: e.target.value})}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                            />
                        </>
                    )}

                    {/* EXAM FORM */}
                    {modalMode === 'exam' && (
                        <>
                            <select 
                                required
                                value={examForm.subjectId} 
                                onChange={e => setExamForm({...examForm, subjectId: e.target.value})}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-4">
                                <select 
                                    value={examForm.type} 
                                    onChange={e => setExamForm({...examForm, type: e.target.value})}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                                >
                                    <option value="Internal 1">Internal 1</option>
                                    <option value="Internal 2">Internal 2</option>
                                    <option value="Model">Model</option>
                                    <option value="Semester">Semester</option>
                                    <option value="Assignment">Assignment</option>
                                </select>
                                <input 
                                    type="date"
                                    value={examForm.date} 
                                    onChange={e => setExamForm({...examForm, date: e.target.value})}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 ml-1">Weightage %</label>
                                    <input 
                                        type="number"
                                        value={examForm.weightage} 
                                        onChange={e => setExamForm({...examForm, weightage: parseFloat(e.target.value)})}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 ml-1">Max Marks</label>
                                    <input 
                                        type="number"
                                        value={examForm.maxMarks} 
                                        onChange={e => setExamForm({...examForm, maxMarks: parseFloat(e.target.value)})}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                                    />
                                </div>
                            </div>
                            <select 
                                value={examForm.status} 
                                onChange={e => setExamForm({...examForm, status: e.target.value as any})}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                            >
                                <option value="Upcoming">Upcoming</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </>
                    )}

                    {/* GRADE FORM */}
                    {modalMode === 'grade' && (
                        <>
                            <select 
                                required
                                value={gradeForm.examId} 
                                onChange={e => {
                                    const ex = exams.find(x => x.id === e.target.value);
                                    setGradeForm({...gradeForm, examId: e.target.value, subjectId: ex?.subjectId});
                                }}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                            >
                                <option value="">Select Completed Exam</option>
                                {exams.filter(e => e.status === 'Completed').map(e => (
                                    <option key={e.id} value={e.id}>{getSubjectName(e.subjectId)} - {e.type}</option>
                                ))}
                            </select>
                            <div>
                                <label className="text-xs text-gray-500 ml-1">Marks Obtained</label>
                                <input 
                                    type="number" required
                                    value={gradeForm.marksObtained} 
                                    onChange={e => setGradeForm({...gradeForm, marksObtained: parseFloat(e.target.value)})}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white font-bold text-lg"
                                />
                            </div>
                        </>
                    )}

                    {/* PROFILE FORM */}
                    {modalMode === 'profile' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    placeholder="First Name" 
                                    value={profileForm.firstName} 
                                    onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                                />
                                <input 
                                    placeholder="Last Name" 
                                    value={profileForm.lastName} 
                                    onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                                    className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                                />
                            </div>
                            <input 
                                placeholder="Course (e.g. B.Tech CS)" 
                                value={profileForm.course} 
                                onChange={e => setProfileForm({...profileForm, course: e.target.value})}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                            />
                            <input 
                                placeholder="College Name" 
                                value={profileForm.college} 
                                onChange={e => setProfileForm({...profileForm, college: e.target.value})}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 ml-1">Current Semester</label>
                                    <input 
                                        type="number"
                                        value={profileForm.currentSemester} 
                                        onChange={e => setProfileForm({...profileForm, currentSemester: parseInt(e.target.value)})}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 ml-1">Target CGPA</label>
                                    <input 
                                        type="number" step="0.1"
                                        value={profileForm.targetCGPA} 
                                        onChange={e => setProfileForm({...profileForm, targetCGPA: parseFloat(e.target.value)})}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none dark:text-white"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-200 dark:shadow-none">Save</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};
