import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Zap,
  Plus,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Shield,
  BrainCircuit,
  Trash2,
  CheckSquare,
  Square,
  ListTodo,
  Table as TableIcon,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Play,
  RotateCcw,
  Edit2,
  X,
  ArrowRight,
  Flame,
  Sun,
  Sunset,
  Moon,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TimetableBlock, Task, Routine, TimetableBlockType, TimetableStatus } from '../types';
import { generateSmartTimetable, shiftFlexibleBlocks, getSubjectColor } from '../utils/timetableGenerator';
import { playAudioFeedback } from '../utils/audio';

interface TimetableEngineViewProps {
  blocks: TimetableBlock[];
  tasks: Task[];
  routines: Routine[];
  onUpdateBlocks: (blocks: TimetableBlock[]) => void;
  onToggleBlockComplete: (blockId: string) => void;
  onStartFocusForTask?: (task: Task) => void;
  isMuted: boolean;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BLOCK_TYPE_META: Record<
  TimetableBlockType,
  { label: string; icon: React.FC<{ className?: string }>; bg: string; border: string; text: string; dotColor: string }
> = {
  deep_work: {
    label: 'Deep Focus',
    icon: BrainCircuit,
    bg: 'bg-indigo-50/70 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800/70',
    text: 'text-indigo-700 dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
  },
  routine: {
    label: 'Daily Routine',
    icon: Zap,
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/70',
    text: 'text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  lecture: {
    label: 'Lecture / Class',
    icon: CalendarIcon,
    bg: 'bg-blue-50/70 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800/70',
    text: 'text-blue-700 dark:text-blue-300',
    dotColor: 'bg-blue-500',
  },
  break: {
    label: 'Cognitive Break',
    icon: Coffee,
    bg: 'bg-amber-50/70 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/70',
    text: 'text-amber-700 dark:text-amber-300',
    dotColor: 'bg-amber-500',
  },
  buffer: {
    label: 'Flexible Buffer',
    icon: Shield,
    bg: 'bg-sky-50/70 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800/70',
    text: 'text-sky-700 dark:text-sky-300',
    dotColor: 'bg-sky-500',
  },
  review: {
    label: 'Active Recall',
    icon: Sparkles,
    bg: 'bg-teal-50/70 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800/70',
    text: 'text-teal-700 dark:text-teal-300',
    dotColor: 'bg-teal-500',
  },
};

const STATUS_CONFIG: Record<
  TimetableStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  not_started: {
    label: 'To Do',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-blue-100/80 dark:bg-blue-950/60',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  completed: {
    label: 'Done',
    bg: 'bg-emerald-100/80 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  rescheduled: {
    label: 'Rescheduled',
    bg: 'bg-amber-100/80 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
};

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDuration(start: string, end: string): string {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  if (diff <= 0) return '0m';
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export const TimetableEngineView: React.FC<TimetableEngineViewProps> = ({
  blocks,
  tasks,
  routines,
  onUpdateBlocks,
  onToggleBlockComplete,
  onStartFocusForTask,
  isMuted,
}) => {
  const todayIndex = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(todayIndex);
  const [viewMode, setViewMode] = useState<'blocks' | 'table' | 'timeline'>('blocks');

  // Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<TimetableBlock | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('Computer Science (Java)');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:30');
  const [formType, setFormType] = useState<TimetableBlockType>('deep_work');
  const [formStatus, setFormStatus] = useState<TimetableStatus>('not_started');
  const [formIsFlexible, setFormIsFlexible] = useState<boolean>(true);
  const [formNotes, setFormNotes] = useState('');
  const [formEnergyLevel, setFormEnergyLevel] = useState<'high' | 'medium' | 'low'>('high');
  const [formChecklistRaw, setFormChecklistRaw] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // AI Advice state
  const [aiOptimizing, setAiOptimizing] = useState<boolean>(false);
  const [aiDoctorAdvice, setAiDoctorAdvice] = useState<string | null>(null);

  // Filter blocks for selected day and sort chronologically
  const dayBlocks = blocks
    .filter(b => b.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Notion-style Sections by time of day
  const morningBlocks = dayBlocks.filter(b => {
    const mins = timeToMinutes(b.startTime);
    return mins < 12 * 60;
  });
  const afternoonBlocks = dayBlocks.filter(b => {
    const mins = timeToMinutes(b.startTime);
    return mins >= 12 * 60 && mins < 17 * 60;
  });
  const eveningBlocks = dayBlocks.filter(b => {
    const mins = timeToMinutes(b.startTime);
    return mins >= 17 * 60 && mins < 21 * 60;
  });
  const nightBlocks = dayBlocks.filter(b => {
    const mins = timeToMinutes(b.startTime);
    return mins >= 21 * 60;
  });

  // Calculate day metrics
  const totalPlannedMinutes = dayBlocks.reduce((acc, b) => {
    return acc + Math.max(0, timeToMinutes(b.endTime) - timeToMinutes(b.startTime));
  }, 0);

  const completedMinutes = dayBlocks
    .filter(b => b.completed || b.status === 'completed')
    .reduce((acc, b) => {
      return acc + Math.max(0, timeToMinutes(b.endTime) - timeToMinutes(b.startTime));
    }, 0);

  const completedBlocksCount = dayBlocks.filter(b => b.completed || b.status === 'completed').length;
  const inProgressBlocksCount = dayBlocks.filter(b => b.status === 'in_progress').length;

  const handleOpenAddModal = (presetStartTime?: string, presetEndTime?: string) => {
    setEditingBlock(null);
    setFormTitle('');
    setFormSubject('Computer Science (Java)');
    setFormStartTime(presetStartTime || '09:00');
    setFormEndTime(presetEndTime || '10:30');
    setFormType('deep_work');
    setFormStatus('not_started');
    setFormIsFlexible(true);
    setFormNotes('');
    setFormEnergyLevel('high');
    setFormChecklistRaw('');
    setSelectedTaskId('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (block: TimetableBlock) => {
    setEditingBlock(block);
    setFormTitle(block.title);
    setFormSubject(block.subject);
    setFormStartTime(block.startTime);
    setFormEndTime(block.endTime);
    setFormType(block.type);
    setFormStatus(block.status || (block.completed ? 'completed' : 'not_started'));
    setFormIsFlexible(block.isFlexible);
    setFormNotes(block.notes || '');
    setFormEnergyLevel(block.energyLevel || 'medium');
    setFormChecklistRaw(block.checklist ? block.checklist.map(c => c.text).join('\n') : '');
    setSelectedTaskId(block.taskId || '');
    setShowAddModal(true);
  };

  const handleDurationPreset = (minutes: number) => {
    const startMins = timeToMinutes(formStartTime);
    const endMins = startMins + minutes;
    setFormEndTime(minutesToTime(endMins));
  };

  const handleTaskSelectionChange = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setFormTitle(task.title);
      setFormSubject(task.subject);
      if (task.notes) setFormNotes(task.notes);
      handleDurationPreset(task.estimatedMinutes || 45);
    }
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const checklistItems = formChecklistRaw
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((text, idx) => ({
        id: `chk-${Date.now()}-${idx}`,
        text: text.replace(/^-\s*\[[ xX]\]\s*/, ''),
        done: text.includes('[x]') || text.includes('[X]'),
      }));

    const isDone = formStatus === 'completed';

    if (editingBlock) {
      // Update existing block
      const updated = blocks.map(b => {
        if (b.id !== editingBlock.id) return b;
        return {
          ...b,
          startTime: formStartTime,
          endTime: formEndTime,
          title: formTitle.trim(),
          subject: formSubject.trim(),
          type: formType,
          status: formStatus,
          isFlexible: formIsFlexible,
          completed: isDone,
          notes: formNotes.trim() || undefined,
          energyLevel: formEnergyLevel,
          checklist: checklistItems.length > 0 ? checklistItems : b.checklist,
          taskId: selectedTaskId || undefined,
          color: getSubjectColor(formSubject.trim()),
        };
      });
      onUpdateBlocks(updated);
    } else {
      // Create new block
      const newBlock: TimetableBlock = {
        id: `block-${Date.now()}`,
        dayOfWeek: selectedDay,
        startTime: formStartTime,
        endTime: formEndTime,
        title: formTitle.trim(),
        subject: formSubject.trim() || 'General Study',
        type: formType,
        status: formStatus,
        isFlexible: formIsFlexible,
        completed: isDone,
        notes: formNotes.trim() || undefined,
        energyLevel: formEnergyLevel,
        checklist: checklistItems.length > 0 ? checklistItems : undefined,
        taskId: selectedTaskId || undefined,
        color: getSubjectColor(formSubject.trim()),
      };
      onUpdateBlocks([...blocks, newBlock]);
    }

    setShowAddModal(false);
    playAudioFeedback('start', isMuted);
  };

  const handleDeleteBlock = (blockId: string) => {
    onUpdateBlocks(blocks.filter(b => b.id !== blockId));
    playAudioFeedback('click', isMuted);
  };

  const handleToggleBlockStatus = (block: TimetableBlock) => {
    const isNowDone = !block.completed && block.status !== 'completed';
    const newStatus: TimetableStatus = isNowDone ? 'completed' : 'not_started';

    const updated = blocks.map(b => {
      if (b.id !== block.id) return b;
      return {
        ...b,
        completed: isNowDone,
        status: newStatus,
      };
    });

    onUpdateBlocks(updated);
    playAudioFeedback(isNowDone ? 'complete' : 'click', isMuted);

    if (isNowDone) {
      try {
        confetti({
          particleCount: 35,
          spread: 55,
          origin: { y: 0.7 },
        });
      } catch {}
    }
  };

  const handleUpdateStatusDropdown = (block: TimetableBlock, newStatus: TimetableStatus) => {
    const isDone = newStatus === 'completed';
    const updated = blocks.map(b => {
      if (b.id !== block.id) return b;
      return {
        ...b,
        status: newStatus,
        completed: isDone,
      };
    });
    onUpdateBlocks(updated);
    playAudioFeedback('click', isMuted);
  };

  const handleToggleChecklistItem = (block: TimetableBlock, itemId: string) => {
    const updated = blocks.map(b => {
      if (b.id !== block.id || !b.checklist) return b;
      const updatedList = b.checklist.map(item => {
        if (item.id !== itemId) return item;
        return { ...item, done: !item.done };
      });
      return {
        ...b,
        checklist: updatedList,
      };
    });
    onUpdateBlocks(updated);
    playAudioFeedback('click', isMuted);
  };

  // Smart Timetable Generator
  const handleGenerateTimetable = () => {
    playAudioFeedback('start', isMuted);
    const newDayBlocks = generateSmartTimetable({
      dayOfWeek: selectedDay,
      startHour: 8,
      endHour: 22,
      tasks,
      routines,
      includeBufferBlocks: true,
    });

    const otherBlocks = blocks.filter(b => b.dayOfWeek !== selectedDay);
    onUpdateBlocks([...otherBlocks, ...newDayBlocks]);

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  // Shift flexible blocks down
  const handleShiftSchedule = (mins: number) => {
    playAudioFeedback('click', isMuted);
    const currentTimeStr = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    const thresholdTime = selectedDay === todayIndex ? currentTimeStr : '08:00';

    const shiftedDayBlocks = shiftFlexibleBlocks(dayBlocks, mins, thresholdTime);
    const otherBlocks = blocks.filter(b => b.dayOfWeek !== selectedDay);
    onUpdateBlocks([...otherBlocks, ...shiftedDayBlocks]);
  };

  // AI Schedule Advisor
  const handleConsultAiDoctor = async () => {
    setAiOptimizing(true);
    setAiDoctorAdvice(null);
    playAudioFeedback('start', isMuted);

    try {
      const response = await fetch('/api/ai/optimize-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasks.filter(t => !t.completed),
          routines,
          preferredHours: '08:00 - 22:00',
          currentTimetable: dayBlocks,
          goals: 'High-school graduate preparing for college CS applications, balancing Java/Python coding with Calculus and personal statement essays without cognitive burnout.',
        }),
      });

      const data = await response.json();
      if (data.analysis) {
        setAiDoctorAdvice(data.analysis);
        playAudioFeedback('complete', isMuted);
      } else {
        setAiDoctorAdvice('Unable to generate advice. Please ensure server API connection.');
      }
    } catch (e: any) {
      setAiDoctorAdvice('Failed to consult Google AI. Error: ' + (e.message || 'Unknown'));
    } finally {
      setAiOptimizing(false);
    }
  };

  // Render a single Notion Block Card
  const renderBlockCard = (block: TimetableBlock) => {
    const meta = BLOCK_TYPE_META[block.type] || BLOCK_TYPE_META.deep_work;
    const Icon = meta.icon;
    const status = block.status || (block.completed ? 'completed' : 'not_started');
    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
    const duration = formatDuration(block.startTime, block.endTime);

    return (
      <div
        key={block.id}
        className={`p-4 rounded-xl border transition-all duration-150 ${
          block.completed || status === 'completed'
            ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-65'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Notion Checkbox to toggle Done */}
            <button
              onClick={() => handleToggleBlockStatus(block)}
              className="mt-1 text-slate-400 hover:text-emerald-600 transition shrink-0"
              title={block.completed ? 'Mark to do' : 'Mark completed'}
            >
              {block.completed || status === 'completed' ? (
                <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Square className="w-5 h-5 hover:text-indigo-600" />
              )}
            </button>

            <div className="min-w-0 flex-1 space-y-1.5">
              {/* Properties strip */}
              <div className="flex flex-wrap items-center gap-2">
                {/* When to do: Time Badge */}
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {block.startTime} – {block.endTime}
                  <span className="text-[10px] text-slate-400 font-normal">({duration})</span>
                </span>

                {/* Status Badge with Select Dropdown */}
                <div className="relative inline-block">
                  <select
                    value={status}
                    onChange={e => handleUpdateStatusDropdown(block, e.target.value as TimetableStatus)}
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border cursor-pointer focus:outline-hidden ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                  >
                    <option value="not_started">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Done</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>

                {/* Block Type Tag */}
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${meta.bg} ${meta.text} ${meta.border}`}
                >
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </span>

                {/* Subject Pill */}
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {block.subject}
                </span>

                {block.isFlexible && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                    Auto-shiftable
                  </span>
                )}
              </div>

              {/* What to do: Title */}
              <h3
                className={`text-sm font-semibold tracking-tight ${
                  block.completed || status === 'completed'
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {block.title}
              </h3>

              {/* Notes */}
              {block.notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  {block.notes}
                </p>
              )}

              {/* Notion-style Checklist Items */}
              {block.checklist && block.checklist.length > 0 && (
                <div className="space-y-1 pt-1">
                  {block.checklist.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklistItem(block, item.id)}
                      className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-indigo-600 select-none"
                    >
                      <button type="button" className="shrink-0 text-slate-400">
                        {item.done ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className={item.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {block.taskId && onStartFocusForTask && (
              <button
                onClick={() => {
                  const task = tasks.find(t => t.id === block.taskId);
                  if (task) onStartFocusForTask(task);
                }}
                title="Start focus timer for this timetable activity"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            )}

            <button
              onClick={() => handleOpenEditModal(block)}
              title="Edit entry"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleDeleteBlock(block.id)}
              title="Delete entry"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Daily Timetable &amp; Planner
            <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
              When &amp; What to Do
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Notion-inspired daily scheduling: allocate when to do and what to do, track status, and absorb delays.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Advisor Button */}
          <button
            id="ai-schedule-doctor-btn"
            onClick={handleConsultAiDoctor}
            disabled={aiOptimizing}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:bg-slate-800 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${aiOptimizing ? 'animate-spin' : ''}`} />
            {aiOptimizing ? 'Analyzing Schedule...' : 'AI Schedule Advisor'}
          </button>

          {/* Smart Generate Button */}
          <button
            id="generate-smart-timetable-btn"
            onClick={handleGenerateTimetable}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            Auto-Schedule Best Plan
          </button>

          {/* Add to Timetable Button */}
          <button
            id="add-timetable-entry-btn"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Add to Timetable
          </button>
        </div>
      </div>

      {/* Notion-Style Callout Block & Day Metrics */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <span className="text-xl shrink-0">💡</span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
              Notion Daily Agenda Blueprint
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-0.5">
              Plan your day into Morning, Afternoon, Evening, and Night blocks. Add entries for &quot;when to do&quot; and &quot;what to do&quot; to keep your college prep structured.
            </p>
          </div>
        </div>

        {/* Quick Day Stats Strip */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-start md:self-auto shrink-0">
          <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <span>{Math.floor(totalPlannedMinutes / 60)}h {totalPlannedMinutes % 60}m planned</span>
          </div>
          <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <span>{completedBlocksCount}/{dayBlocks.length} Done</span>
          </div>
          {inProgressBlocksCount > 0 && (
            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-blue-100/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-800 dark:text-blue-300">
              <span>{inProgressBlocksCount} In Progress</span>
            </div>
          )}
        </div>
      </div>

      {/* Days of Week Selector Strip & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3 w-full">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          {DAYS_OF_WEEK.map((dayName, idx) => {
            const isToday = idx === todayIndex;
            const isSelected = idx === selectedDay;
            const count = blocks.filter(b => b.dayOfWeek === idx).length;

            return (
              <button
                key={dayName}
                onClick={() => setSelectedDay(idx)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition flex flex-col items-center shrink-0 min-w-[64px] sm:min-w-[76px] ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="uppercase text-[10px] tracking-wider opacity-75">
                  {dayName.slice(0, 3)}
                </span>
                <span className="font-bold flex items-center gap-1">
                  {dayName.slice(0, 3)}
                  {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </span>
                <span className="text-[10px] opacity-70 mt-0.5">{count} blocks</span>
              </button>
            );
          })}
        </div>

        {/* View Switcher: Blocks / Table / Timeline */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('blocks')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'blocks'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Agenda
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Table
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'timeline'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Timeline
          </button>
        </div>
      </div>

      {/* AI Schedule Advisor Response Panel */}
      {aiDoctorAdvice && (
        <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              AI Schedule Doctor Assessment
            </h3>
            <button
              onClick={() => setAiDoctorAdvice(null)}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold"
            >
              Dismiss
            </button>
          </div>
          <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {aiDoctorAdvice}
          </div>
        </div>
      )}

      {/* Quick Shift Bar: When a lecture or coding debug session overruns */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Running Late? Shift Remaining Flexible Blocks:
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (Pushes uncompleted flexible study sessions down without clobbering routines)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleShiftSchedule(15)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition"
          >
            +15m Shift
          </button>
          <button
            onClick={() => handleShiftSchedule(30)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition"
          >
            +30m Shift
          </button>
        </div>
      </div>

      {/* VIEW 1: NOTION AGENDA BOARD (Morning, Afternoon, Evening, Night) */}
      {viewMode === 'blocks' && (
        <div className="space-y-6">
          {/* Morning Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5" />
                Morning Focus (06:00 – 12:00)
                <span className="text-[10px] font-normal text-slate-400 font-mono">
                  ({morningBlocks.length} items)
                </span>
              </h3>
              <button
                onClick={() => handleOpenAddModal('09:00', '10:30')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add to Morning
              </button>
            </div>
            {morningBlocks.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No morning blocks scheduled. Click &quot;+ Add to Morning&quot; to plan when to do what to do.
              </div>
            ) : (
              <div className="space-y-2.5">{morningBlocks.map(renderBlockCard)}</div>
            )}
          </div>

          {/* Afternoon Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5" />
                Afternoon Deep Work (12:00 – 17:00)
                <span className="text-[10px] font-normal text-slate-400 font-mono">
                  ({afternoonBlocks.length} items)
                </span>
              </h3>
              <button
                onClick={() => handleOpenAddModal('13:30', '15:00')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add to Afternoon
              </button>
            </div>
            {afternoonBlocks.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No afternoon blocks scheduled.
              </div>
            ) : (
              <div className="space-y-2.5">{afternoonBlocks.map(renderBlockCard)}</div>
            )}
          </div>

          {/* Evening Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Sunset className="w-3.5 h-3.5" />
                Evening &amp; Active Recall (17:00 – 21:00)
                <span className="text-[10px] font-normal text-slate-400 font-mono">
                  ({eveningBlocks.length} items)
                </span>
              </h3>
              <button
                onClick={() => handleOpenAddModal('18:00', '19:30')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add to Evening
              </button>
            </div>
            {eveningBlocks.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No evening blocks scheduled.
              </div>
            ) : (
              <div className="space-y-2.5">{eveningBlocks.map(renderBlockCard)}</div>
            )}
          </div>

          {/* Night Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5" />
                Night &amp; Wrap-up (21:00 – 24:00)
                <span className="text-[10px] font-normal text-slate-400 font-mono">
                  ({nightBlocks.length} items)
                </span>
              </h3>
              <button
                onClick={() => handleOpenAddModal('21:00', '22:00')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add to Night
              </button>
            </div>
            {nightBlocks.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No night blocks scheduled.
              </div>
            ) : (
              <div className="space-y-2.5">{nightBlocks.map(renderBlockCard)}</div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: NOTION DATABASE TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs touch-pan-x">
          <table className="w-full min-w-[640px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">When (Time)</th>
                <th className="py-3 px-4">What To Do</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Checklist</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dayBlocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No entries scheduled for this day. Click &quot;+ Add to Timetable&quot; to begin!
                  </td>
                </tr>
              ) : (
                dayBlocks.map(block => {
                  const status = block.status || (block.completed ? 'completed' : 'not_started');
                  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
                  const meta = BLOCK_TYPE_META[block.type] || BLOCK_TYPE_META.deep_work;
                  const completedChecklist = block.checklist?.filter(c => c.done).length || 0;
                  const totalChecklist = block.checklist?.length || 0;

                  return (
                    <tr
                      key={block.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <select
                          value={status}
                          onChange={e => handleUpdateStatusDropdown(block, e.target.value as TimetableStatus)}
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border focus:outline-hidden ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <option value="not_started">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Done</option>
                          <option value="rescheduled">Rescheduled</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {block.startTime} – {block.endTime}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {block.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                          {block.subject}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${meta.bg} ${meta.text} ${meta.border}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {totalChecklist > 0 ? (
                          <span className="text-[11px] font-mono">
                            {completedChecklist}/{totalChecklist} done
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(block)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => handleOpenAddModal()}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              + Add new row
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b pb-2 dark:border-slate-800">
            <span className="font-bold uppercase tracking-wider">Chronological Schedule</span>
            <span>08:00 — 22:00</span>
          </div>

          <div className="relative pl-12 space-y-4 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {dayBlocks.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No blocks on this day timeline.
              </div>
            ) : (
              dayBlocks.map(block => {
                const meta = BLOCK_TYPE_META[block.type] || BLOCK_TYPE_META.deep_work;
                const status = block.status || (block.completed ? 'completed' : 'not_started');

                return (
                  <div key={block.id} className="relative group">
                    {/* Time indicator point */}
                    <div
                      className={`absolute -left-9 top-3 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${meta.dotColor} shadow-xs`}
                    />

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:border-slate-300 transition flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            {block.startTime} – {block.endTime}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${meta.bg} ${meta.text}`}>
                            {meta.label}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {block.subject}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white mt-1">
                          {block.title}
                        </h4>
                        {block.notes && (
                          <p className="text-xs text-slate-500 mt-0.5">{block.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleBlockStatus(block)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                        >
                          {block.completed || status === 'completed' ? 'Done' : 'Mark Done'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* NOTION-INSPIRED ADD / EDIT TIMETABLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-indigo-600" />
                  {editingBlock ? 'Edit Timetable Entry' : 'Add Daily Timetable Entry'}
                </h3>
                <p className="text-xs text-slate-500">
                  Specify when to do, what to do, and checklist sub-goals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveBlock} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
              {/* Optional: Import from Uncompleted Tasks */}
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-1">
                <label className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  <span>Import from My Pending Tasks (Optional)</span>
                  <span className="text-[10px] text-indigo-600 font-normal">Auto-fills title &amp; subject</span>
                </label>
                <select
                  value={selectedTaskId}
                  onChange={e => handleTaskSelectionChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">— Create custom entry or select a task —</option>
                  {tasks
                    .filter(t => !t.completed)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.category || 'Task'}] {t.title} (~{t.estimatedMinutes}m)
                      </option>
                    ))}
                </select>
              </div>

              {/* What to do: Title & Subject */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  What to do (Activity Title) *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Implement Binary Search Tree in Java, Calculus Problem Set #4"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subject or Course
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={e => setFormSubject(e.target.value)}
                  placeholder="e.g. Computer Science (Java), Mathematics, College Admissions"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* When to do: Time inputs & Duration presets */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    When to do (Time Slot)
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    Duration: {formatDuration(formStartTime, formEndTime)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500">Start Time</span>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={e => setFormStartTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">End Time</span>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={e => setFormEndTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Duration Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Presets:</span>
                  {[25, 45, 60, 90].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleDurationPreset(mins)}
                      className="px-2 py-0.5 rounded text-[11px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400"
                    >
                      +{mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Block Type and Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Type
                  </label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as TimetableBlockType)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="deep_work">Deep Focus (Intense study)</option>
                    <option value="lecture">Lecture / Class</option>
                    <option value="routine">Daily Routine Habit</option>
                    <option value="review">Active Recall / Flashcards</option>
                    <option value="break">Cognitive Rest Break</option>
                    <option value="buffer">Flexible Buffer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as TimetableStatus)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="not_started">To Do (Not Started)</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Done (Completed)</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>
              </div>

              {/* Sub-action Checklist */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>What to do (Checklist Sub-goals)</span>
                  <span className="text-[10px] text-slate-400">One per line</span>
                </label>
                <textarea
                  rows={2}
                  value={formChecklistRaw}
                  onChange={e => setFormChecklistRaw(e.target.value)}
                  placeholder="Code recursive insert() method&#10;Write unit tests for BST traversals"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes &amp; References
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Additional context or links..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Flexibility Checkbox */}
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formIsFlexible}
                  onChange={e => setFormIsFlexible(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Mark as Flexible (allows +15m / +30m auto-shifting if earlier lectures overrun)
              </label>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  {editingBlock ? 'Save Changes' : 'Add to Daily Timetable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
