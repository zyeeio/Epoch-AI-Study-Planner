import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Play,
  Sparkles,
  Flame,
  CheckCircle2,
  Tag,
  Filter,
  GraduationCap,
  BookOpen,
  FileText,
  RotateCcw,
  Code2,
  FolderGit2,
  Search,
  Check,
  Pencil,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, Routine, TaskCategory, TaskPriority } from '../types';
import { playAudioFeedback } from '../utils/audio';

interface DailyTasksViewProps {
  tasks: Task[];
  routines: Routine[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleRoutineCheckIn: (routineId: string) => void;
  onStartFocusForTask: (task: Task) => void;
  isMuted: boolean;
}

export const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.FC<{ className?: string }>; color: string; border: string; bg: string; description: string }
> = {
  Exam: {
    label: 'Exam',
    icon: GraduationCap,
    color: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    description: 'Midterms, Finals, Placement Exams & Test Prep',
  },
  Assignment: {
    label: 'Assignment',
    icon: FileText,
    color: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    description: 'Problem Sets, Homework, Coding Exercises & Labs',
  },
  Lecture: {
    label: 'Lecture',
    icon: BookOpen,
    color: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    description: 'Lecture Reviews, Class Prep, Reading & Syllabus',
  },
  Project: {
    label: 'Project',
    icon: FolderGit2,
    color: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800/60',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    description: 'Coding Projects, College Admissions Essays & Portfolios',
  },
  Revision: {
    label: 'Revision',
    icon: RotateCcw,
    color: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    description: 'Flashcards, Spaced Repetition, Active Recall & Summaries',
  },
  Routine: {
    label: 'Routine',
    icon: Flame,
    color: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800/60',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    description: 'Habits, Daily Coding Warmups & Wellness',
  },
  General: {
    label: 'General',
    icon: Tag,
    color: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    bg: 'bg-slate-100 dark:bg-slate-800',
    description: 'General Academic Tasks & Administrative Work',
  },
};

const STANDARD_CATEGORIES: TaskCategory[] = [
  'Exam',
  'Assignment',
  'Lecture',
  'Project',
  'Revision',
  'Routine',
  'General',
];

const PRIORITY_BADGES: Record<TaskPriority, { label: string; color: string; border: string }> = {
  urgent: {
    label: 'Urgent',
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-900/60',
  },
  high: {
    label: 'High',
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-900/60',
  },
  medium: {
    label: 'Medium',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-900/60',
  },
  low: {
    label: 'Low',
    color: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

export const DailyTasksView: React.FC<DailyTasksViewProps> = ({
  tasks,
  routines,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleRoutineCheckIn,
  onStartFocusForTask,
  isMuted,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Computer Science (Java)');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Assignment');
  const [newPriority, setNewPriority] = useState<TaskPriority>('high');
  const [newEstimate, setNewEstimate] = useState(45);
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDueTime, setNewDueTime] = useState('16:00');
  const [newNotes, setNewNotes] = useState('');
  const [newReminder, setNewReminder] = useState(true);

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editCategory, setEditCategory] = useState<TaskCategory>('Assignment');
  const [editPriority, setEditPriority] = useState<TaskPriority>('high');
  const [editEstimate, setEditEstimate] = useState(45);
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editReminder, setEditReminder] = useState(true);

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditSubject(task.subject);
    setEditCategory(task.category);
    setEditPriority(task.priority);
    setEditEstimate(task.estimatedMinutes || 30);
    setEditDueDate(task.dueDate || '');
    setEditDueTime(task.dueTime || '');
    setEditNotes(task.notes || '');
    setEditReminder(task.reminderEnabled ?? true);
  };

  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    onUpdateTask({
      ...editingTask,
      title: editTitle.trim(),
      subject: editSubject.trim() || 'General Study',
      category: editCategory,
      priority: editPriority,
      estimatedMinutes: Number(editEstimate) || 30,
      dueDate: editDueDate || new Date().toISOString().split('T')[0],
      dueTime: editDueTime || undefined,
      notes: editNotes.trim() || undefined,
      reminderEnabled: editReminder,
      tags: [editCategory, editSubject.trim()],
    });

    setEditingTask(null);
    playAudioFeedback('start', isMuted);
  };

  const handleTaskCheckbox = (task: Task) => {
    playAudioFeedback(task.completed ? 'click' : 'complete', isMuted);
    if (!task.completed && (task.priority === 'urgent' || task.priority === 'high')) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {}
    }
    onToggleTask(task.id);
  };

  const handleRoutineCheckIn = (routine: Routine) => {
    playAudioFeedback('complete', isMuted);
    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch {}
    onToggleRoutineCheckIn(routine.id);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      subject: newSubject.trim() || 'General Study',
      category: newCategory,
      priority: newPriority,
      estimatedMinutes: Number(newEstimate) || 30,
      dueDate: newDueDate,
      dueTime: newDueTime,
      notes: newNotes.trim() || undefined,
      reminderEnabled: newReminder,
      tags: [newCategory, newSubject.trim()],
    });

    // Reset form
    setNewTitle('');
    setNewNotes('');
    setIsAddingTask(false);
    playAudioFeedback('start', isMuted);
  };

  // Helper to normalize task category for filtering
  const getCategoryKey = (category: string): string => {
    if (CATEGORY_CONFIG[category]) return category;
    const lower = category.toLowerCase();
    if (lower.includes('exam') || lower.includes('test') || lower.includes('midterm')) return 'Exam';
    if (lower.includes('assign') || lower.includes('homework') || lower.includes('code') || lower.includes('math')) return 'Assignment';
    if (lower.includes('lecture') || lower.includes('class') || lower.includes('science')) return 'Lecture';
    if (lower.includes('proj') || lower.includes('essay') || lower.includes('college')) return 'Project';
    if (lower.includes('revis') || lower.includes('recall') || lower.includes('flashcard')) return 'Revision';
    if (lower.includes('rout') || lower.includes('habit')) return 'Routine';
    return 'General';
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.length };
    STANDARD_CATEGORIES.forEach(cat => {
      counts[cat] = 0;
    });

    tasks.forEach(t => {
      const catKey = getCategoryKey(t.category);
      counts[catKey] = (counts[catKey] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const filteredTasks = tasks.filter(t => {
    const catKey = getCategoryKey(t.category);
    if (selectedCategory !== 'all' && catKey !== selectedCategory && t.category !== selectedCategory) {
      return false;
    }
    if (!showCompleted && t.completed) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(query);
      const matchSubject = t.subject.toLowerCase().includes(query);
      const matchNotes = t.notes?.toLowerCase().includes(query);
      const matchTags = t.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!matchTitle && !matchSubject && !matchNotes && !matchTags) return false;
    }
    return true;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-8">
      {/* View Header & Metric Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Academic Tasks &amp; Study Routines
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Categorized academic task management with Exam, Assignment, Lecture, and Project tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <span>{pendingCount} Pending</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-emerald-600 dark:text-emerald-400">{completedCount} Done</span>
          </div>

          <button
            id="add-new-task-trigger-btn"
            onClick={() => setIsAddingTask(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Routine Tracker Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            Daily Habit &amp; Study Routines
          </h2>
          <span className="text-xs text-slate-400">
            Check in daily to build unbreakable academic momentum
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {routines.map(routine => {
            const isCompletedToday = routine.lastCompletedDate === todayStr;

            return (
              <div
                key={routine.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isCompletedToday
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {routine.timeOfDay} • {routine.scheduledTime}
                      </span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-amber-500" />
                        {routine.streak}d
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white mt-1.5 truncate">
                      {routine.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {routine.durationMinutes} mins • {routine.category}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRoutineCheckIn(routine)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      isCompletedToday
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isCompletedToday ? 'Completed' : 'Check In'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal / Collapse Form */}
      {isAddingTask && (
        <form
          onSubmit={handleCreateTask}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/40 shadow-lg space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Create Academic Study Task
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-medium"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Task Title
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Implement Binary Search Tree in Java, Calculus Problem Set #4, Review CS Midterm"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Course or Subject
              </label>
              <input
                type="text"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                placeholder="e.g. Computer Science (Java), Calculus, College Admissions"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Task Category</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                  {CATEGORY_CONFIG[newCategory]?.description}
                </span>
              </label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="Exam">🎓 Exam (Tests, Midterms, Placement Exams)</option>
                <option value="Assignment">📝 Assignment (Homework, Problem Sets, Coding Labs)</option>
                <option value="Lecture">📚 Lecture (Class Prep, Notes Review, Syllabus)</option>
                <option value="Project">🚀 Project (Coding Apps, College Essays, Portfolios)</option>
                <option value="Revision">🔄 Revision (Spaced Repetition, Active Recall)</option>
                <option value="Routine">⚡ Routine (Habits, Warmups)</option>
                <option value="General">🏷️ General (General Academic Study)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Estimated Minutes
                </label>
                <input
                  type="number"
                  min="10"
                  max="240"
                  value={newEstimate}
                  onChange={e => setNewEstimate(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Due Time
                </label>
                <input
                  type="time"
                  value={newDueTime}
                  onChange={e => setNewDueTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Notes &amp; Sub-goals
              </label>
              <textarea
                rows={2}
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Specific problem sets, references, or essay prompts to address..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={newReminder}
                onChange={e => setNewReminder(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Enable In-App &amp; Smart Reminders for this task
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                Add to Daily Plan
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Category Filter Bar with Counts & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Filter By Category</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Search filter */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden w-full"
              />
            </div>

            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={e => setShowCompleted(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Show Done
            </label>
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto sm:flex-wrap scrollbar-none w-full">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>All Tasks</span>
            <span className="text-[11px] opacity-80 font-mono">({categoryCounts.all || 0})</span>
          </button>

          {STANDARD_CATEGORIES.map(cat => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = config.icon;
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border shrink-0 whitespace-nowrap ${
                  isSelected
                    ? `${config.bg} ${config.color} ${config.border} shadow-xs font-bold ring-1 ring-indigo-500/30`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{config.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-white/80 dark:bg-slate-800/80'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Task Cards List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              No tasks found in category &quot;{selectedCategory}&quot;
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add a new task in this category or click &quot;All Tasks&quot; to review all academic plans.
            </p>
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100"
            >
              Reset to All Tasks
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map(task => {
              const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;
              const catKey = getCategoryKey(task.category);
              const catConfig = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.General;
              const CategoryIcon = catConfig.icon;

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all duration-150 flex items-start justify-between gap-3 ${
                    task.completed
                      ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleTaskCheckbox(task)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-600 transition shrink-0"
                      title={task.completed ? 'Mark uncompleted' : 'Mark completed'}
                    >
                      {task.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 hover:text-indigo-600" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Prominent Category Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}
                        >
                          <CategoryIcon className="w-3 h-3" />
                          {task.category || catConfig.label}
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${priorityInfo.color} ${priorityInfo.border}`}
                        >
                          {priorityInfo.label}
                        </span>

                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {task.subject}
                        </span>

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ~{task.estimatedMinutes}m
                        </span>

                        {task.dueDate && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {task.dueDate === todayStr ? 'Today' : task.dueDate}
                            {task.dueTime ? ` @ ${task.dueTime}` : ''}
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-sm font-semibold ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {task.notes}
                        </p>
                      )}

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {task.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!task.completed && (
                      <button
                        onClick={() => onStartFocusForTask(task)}
                        title="Start focus timer with this task"
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Play className="w-3 h-3 fill-indigo-600 dark:fill-indigo-400" />
                        <span className="hidden sm:inline">Focus</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditModal(task)}
                      title="Edit task"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      title="Delete task"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Edit Task Details</h3>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject / Course
                  </label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={e => setEditSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {STANDARD_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="360"
                    step="5"
                    value={editEstimate}
                    onChange={e => setEditEstimate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={e => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={editDueTime}
                    onChange={e => setEditDueTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes & Details
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Additional problem numbers, lecture slides, or context..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={editReminder}
                    onChange={e => setEditReminder(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Enable Reminder Notification
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
