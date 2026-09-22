import { Task, Routine, TimetableBlock } from '../types';

export interface TimetableGenerationOptions {
  dayOfWeek: number;
  startHour: number; // e.g. 8 (08:00)
  endHour: number;   // e.g. 22 (22:00)
  tasks: Task[];
  routines: Routine[];
  includeBufferBlocks?: boolean;
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const SUBJECT_COLORS: Record<string, string> = {
  'Computer Science (Java)': 'indigo',
  'Computer Science (Python)': 'blue',
  'Mathematics': 'sky',
  'College Admissions': 'purple',
  'Physics': 'rose',
  'Active Recall': 'teal',
  'Wellness': 'amber',
  'General Study': 'emerald',
};

export function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] || 'indigo';
}

/**
 * Generates an optimized, cognitive-load balanced study timetable
 */
export function generateSmartTimetable(options: TimetableGenerationOptions): TimetableBlock[] {
  const { dayOfWeek, startHour, endHour, tasks, routines, includeBufferBlocks = true } = options;
  const blocks: TimetableBlock[] = [];

  let currentMin = startHour * 60;
  const dayEndMin = endHour * 60;

  // 1. Gather routines active on this day of week
  const dayRoutines = routines
    .filter(r => r.daysOfWeek.includes(dayOfWeek))
    .sort((a, b) => timeToMinutes(a.scheduledTime) - timeToMinutes(b.scheduledTime));

  // 2. Sort uncompleted tasks by priority and due date
  const priorityWeight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
  const pendingTasks = [...tasks]
    .filter(t => !t.completed)
    .sort((a, b) => (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1));

  let taskIndex = 0;

  // Schedule through the day window
  while (currentMin < dayEndMin) {
    // Check if a routine is scheduled near this time (+- 15 mins)
    const upcomingRoutine = dayRoutines.find(r => {
      const routineMin = timeToMinutes(r.scheduledTime);
      return routineMin >= currentMin && routineMin <= currentMin + 25;
    });

    if (upcomingRoutine) {
      const routineStart = Math.max(currentMin, timeToMinutes(upcomingRoutine.scheduledTime));
      const routineDuration = upcomingRoutine.durationMinutes;
      const routineEnd = routineStart + routineDuration;

      blocks.push({
        id: `gen-routine-${upcomingRoutine.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        dayOfWeek,
        startTime: minutesToTime(routineStart),
        endTime: minutesToTime(routineEnd),
        title: upcomingRoutine.title,
        subject: upcomingRoutine.category || 'Routine',
        type: 'routine',
        routineId: upcomingRoutine.id,
        isFlexible: false,
        completed: false,
        color: upcomingRoutine.category === 'Wellness' ? 'amber' : 'emerald',
      });

      currentMin = routineEnd;

      // Add a 10 min breather after routine
      currentMin += 10;
      continue;
    }

    // Check if it is lunch time (12:00 - 13:00)
    if (currentMin >= 12 * 60 && currentMin < 13 * 60 && !blocks.some(b => b.type === 'break' && timeToMinutes(b.startTime) >= 12 * 60)) {
      blocks.push({
        id: `gen-lunch-${Date.now()}`,
        dayOfWeek,
        startTime: minutesToTime(currentMin),
        endTime: minutesToTime(currentMin + 45),
        title: 'Lunch & Cognitive Rest Break',
        subject: 'Wellness',
        type: 'break',
        isFlexible: true,
        completed: false,
        color: 'amber',
      });
      currentMin += 45;
      continue;
    }

    // Schedule next priority task
    if (taskIndex < pendingTasks.length) {
      const task = pendingTasks[taskIndex];
      taskIndex++;

      const studyDuration = Math.min(Math.max(task.estimatedMinutes, 30), 75); // Cap focus block at 75m
      const blockEnd = currentMin + studyDuration;

      blocks.push({
        id: `gen-task-${task.id}-${Date.now()}`,
        dayOfWeek,
        startTime: minutesToTime(currentMin),
        endTime: minutesToTime(blockEnd),
        title: task.title,
        subject: task.subject,
        type: 'deep_work',
        taskId: task.id,
        isFlexible: true,
        completed: false,
        notes: task.notes,
        color: getSubjectColor(task.subject),
      });

      currentMin = blockEnd;

      // Ultradian rest break (15 mins)
      if (currentMin + 15 < dayEndMin) {
        blocks.push({
          id: `gen-break-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          dayOfWeek,
          startTime: minutesToTime(currentMin),
          endTime: minutesToTime(currentMin + 15),
          title: 'Active Rest / Eye Break',
          subject: 'Wellness',
          type: 'break',
          isFlexible: true,
          completed: false,
          color: 'amber',
        });
        currentMin += 15;
      }
      continue;
    }

    // If no more tasks, but day has hours left, add a Flexible Buffer or Review block
    if (includeBufferBlocks && currentMin + 45 <= dayEndMin) {
      blocks.push({
        id: `gen-buffer-${Date.now()}`,
        dayOfWeek,
        startTime: minutesToTime(currentMin),
        endTime: minutesToTime(currentMin + 45),
        title: 'Flexible Buffer & Study Q&A with Gemini AI',
        subject: 'General Study',
        type: 'buffer',
        isFlexible: true,
        completed: false,
        notes: 'Absorbs spillovers from lectures or coding bugs, or used for AI notes synthesis.',
        color: 'sky',
      });
      currentMin += 45 + 15;
    } else {
      break;
    }
  }

  return blocks;
}

/**
 * Shift remaining flexible blocks down by specified minutes (e.g. +15m, +30m when a class runs late)
 */
export function shiftFlexibleBlocks(
  blocks: TimetableBlock[],
  shiftMinutes: number,
  afterTime: string
): TimetableBlock[] {
  const thresholdMins = timeToMinutes(afterTime);

  return blocks.map(block => {
    const startMins = timeToMinutes(block.startTime);
    // Only shift if block starts at or after the threshold and is flexible and uncompleted
    if (startMins >= thresholdMins && block.isFlexible && !block.completed) {
      const duration = timeToMinutes(block.endTime) - startMins;
      const newStart = Math.min(startMins + shiftMinutes, 23 * 60);
      const newEnd = Math.min(newStart + duration, 23 * 60 + 59);

      return {
        ...block,
        startTime: minutesToTime(newStart),
        endTime: minutesToTime(newEnd),
      };
    }
    return block;
  });
}
