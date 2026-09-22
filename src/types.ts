export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskCategory = 'Exam' | 'Assignment' | 'Lecture' | 'Project' | 'Revision' | 'Routine' | 'General' | string;

export interface Task {
  id: string;
  title: string;
  subject: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedMinutes: number;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  completed: boolean;
  completedAt?: string;
  notes?: string;
  reminderEnabled: boolean;
  tags: string[];
}

export interface Routine {
  id: string;
  title: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  scheduledTime: string; // HH:mm
  durationMinutes: number;
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  streak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  reminderEnabled: boolean;
  category: string;
  iconName: string;
}

export type TimetableBlockType = 'deep_work' | 'lecture' | 'review' | 'routine' | 'break' | 'buffer';
export type TimetableStatus = 'not_started' | 'in_progress' | 'completed' | 'rescheduled';

export interface TimetableChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TimetableBlock {
  id: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // HH:mm "09:00"
  endTime: string;   // HH:mm "10:30"
  title: string;     // What to do
  subject: string;   // Subject or Area
  type: TimetableBlockType;
  status?: TimetableStatus;
  checklist?: TimetableChecklistItem[];
  taskId?: string;
  routineId?: string;
  isFlexible: boolean;
  completed: boolean;
  notes?: string;
  color: string;
  priority?: TaskPriority;
  energyLevel?: 'high' | 'medium' | 'low';
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface CodeSnippet {
  language: 'java' | 'python' | 'pseudocode' | 'other';
  code: string;
  explanation: string;
}

export interface LectureNote {
  id: string;
  title: string;
  subject: string;
  date: string;
  rawContent: string;
  summary?: string;
  keyTakeaways?: string[];
  flashcards?: Flashcard[];
  codeSnippets?: CodeSnippet[];
  tags: string[];
  lastUpdated: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AcademicResearchEntry {
  id: string;
  query: string;
  subject: string;
  timestamp: string;
  answer: string;
  sources: GroundingSource[];
  webSearchQueries?: string[];
}

export interface StudyMetrics {
  totalMinutesStudied: number;
  tasksCompleted: number;
  routinesCompleted: number;
  currentDayStreak: number;
  lastActiveDate: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'task' | 'routine' | 'timetable' | 'info';
  actionableId?: string;
  read: boolean;
}
