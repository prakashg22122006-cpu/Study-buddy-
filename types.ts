
export interface Link {
  id: number;
  name: string;
  url: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  status: string;
}

export interface Homework {
  id: number;
  name: string;
  course: string;
  date: string;
  complete: boolean;
}

export interface Project {
  id: number;
  name: string;
}

export interface Internship {
  id: number;
  role: string;
  company: string;
  status: string;
  date: string;
}

export interface Snippet {
  id: number;
  lang: string;
  code: string;
}

export interface Resource {
  id: number;
  name: string;
  tag: string;
  date: string;
}

export interface Habit {
  id: number;
  name: string;
  category: string;
  frequency: string;
  streak: number;
  completedDates: string[]; // ISO date strings
  createdAt: string;
}

export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  category: string;
}

export interface Transaction {
  id: number;
  amount: number;
  desc: string; // Used as 'note' in new design
  category: string;
  type?: 'income' | 'expense'; // Added for new design
  date: string;
}

export interface Exam {
  id: number;
  subject: string;
  type: string;
  date: string;
  weightage?: number;
}

export interface JournalEntry {
  id: number;
  text: string;
  date: string;
}

export interface MatrixItem {
  id: number;
  text: string;
}

export interface MatrixState {
  q1: MatrixItem[];
  q2: MatrixItem[];
  q3: MatrixItem[];
  q4: MatrixItem[];
}

export interface PlannerTask {
  id: number;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface FocusSession {
  id: number;
  date: string; // ISO string
  durationMinutes: number;
  mode: string;
}

export interface CountdownItem {
  id: number;
  title: string;
  date: string; // ISO string
  theme: string;
}

// --- New Academic Tracker Types ---

export interface AcademicSubject {
  id: string;
  name: string;
  code: string;
  credits: number;
  type: string; // Core, Elective, Lab, etc.
  semester: number;
  faculty?: string;
}

export interface AcademicExam {
  id: string;
  subjectId: string;
  type: string; // Internal 1, Final, etc.
  date: string;
  weightage: number; // Percentage
  maxMarks: number;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  syllabus?: string;
}

export interface AcademicGrade {
  id: string;
  examId: string;
  subjectId: string;
  marksObtained: number;
}

export interface AcademicProfile {
  firstName: string;
  lastName: string;
  course: string;
  college: string;
  currentSemester: number;
  targetCGPA: number;
}
