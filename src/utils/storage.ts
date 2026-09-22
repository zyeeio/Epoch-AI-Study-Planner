import { Task, Routine, TimetableBlock, LectureNote, AcademicResearchEntry, StudyMetrics } from '../types';
import { INITIAL_TASKS, INITIAL_ROUTINES, INITIAL_TIMETABLE_BLOCKS, INITIAL_LECTURE_NOTES, INITIAL_RESEARCH_ENTRIES } from '../data/initialData';

const KEYS = {
  TASKS: 'study_app_tasks_v1',
  ROUTINES: 'study_app_routines_v1',
  TIMETABLE: 'study_app_timetable_v1',
  NOTES: 'study_app_notes_v1',
  RESEARCH: 'study_app_research_v1',
  METRICS: 'study_app_metrics_v1',
  SOUND_MUTED: 'study_app_muted_v1',
};

export function loadStoredTasks(): Task[] {
  try {
    const data = localStorage.getItem(KEYS.TASKS);
    if (!data) return INITIAL_TASKS;
    const tasks: Task[] = JSON.parse(data);
    return tasks.map(t => {
      let cat = t.category;
      if (cat === 'coding') cat = 'Assignment';
      else if (cat === 'college_app') cat = 'Project';
      else if (cat === 'math') cat = 'Assignment';
      else if (cat === 'science') cat = 'Lecture';
      else if (cat === 'humanities') cat = 'Revision';
      else if (cat === 'general') cat = 'General';
      return {
        ...t,
        category: cat || 'General',
      };
    });
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveStoredTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Failed to save tasks to localStorage', e);
  }
}

export function loadStoredRoutines(): Routine[] {
  try {
    const data = localStorage.getItem(KEYS.ROUTINES);
    if (!data) return INITIAL_ROUTINES;
    return JSON.parse(data);
  } catch {
    return INITIAL_ROUTINES;
  }
}

export function saveStoredRoutines(routines: Routine[]): void {
  try {
    localStorage.setItem(KEYS.ROUTINES, JSON.stringify(routines));
  } catch (e) {
    console.warn('Failed to save routines to localStorage', e);
  }
}

export function loadStoredTimetable(): TimetableBlock[] {
  try {
    const data = localStorage.getItem(KEYS.TIMETABLE);
    if (!data) return INITIAL_TIMETABLE_BLOCKS;
    return JSON.parse(data);
  } catch {
    return INITIAL_TIMETABLE_BLOCKS;
  }
}

export function saveStoredTimetable(blocks: TimetableBlock[]): void {
  try {
    localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(blocks));
  } catch (e) {
    console.warn('Failed to save timetable to localStorage', e);
  }
}

export function loadStoredNotes(): LectureNote[] {
  try {
    const data = localStorage.getItem(KEYS.NOTES);
    if (!data) return INITIAL_LECTURE_NOTES;
    return JSON.parse(data);
  } catch {
    return INITIAL_LECTURE_NOTES;
  }
}

export function saveStoredNotes(notes: LectureNote[]): void {
  try {
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  } catch (e) {
    console.warn('Failed to save notes to localStorage', e);
  }
}

export function loadStoredResearch(): AcademicResearchEntry[] {
  try {
    const data = localStorage.getItem(KEYS.RESEARCH);
    if (!data) return INITIAL_RESEARCH_ENTRIES;
    return JSON.parse(data);
  } catch {
    return INITIAL_RESEARCH_ENTRIES;
  }
}

export function saveStoredResearch(research: AcademicResearchEntry[]): void {
  try {
    localStorage.setItem(KEYS.RESEARCH, JSON.stringify(research));
  } catch (e) {
    console.warn('Failed to save research to localStorage', e);
  }
}

export function loadStoredMetrics(): StudyMetrics {
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultMetrics: StudyMetrics = {
    totalMinutesStudied: 165,
    tasksCompleted: 4,
    routinesCompleted: 3,
    currentDayStreak: 14,
    lastActiveDate: todayStr,
  };
  try {
    const data = localStorage.getItem(KEYS.METRICS);
    if (!data) return defaultMetrics;
    const parsed = JSON.parse(data);
    // Check if streak needs updating
    if (parsed.lastActiveDate !== todayStr) {
      const lastDate = new Date(parsed.lastActiveDate);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        parsed.currentDayStreak += 1;
      } else if (diffDays > 1) {
        parsed.currentDayStreak = 1;
      }
      parsed.lastActiveDate = todayStr;
      saveStoredMetrics(parsed);
    }
    return parsed;
  } catch {
    return defaultMetrics;
  }
}

export function saveStoredMetrics(metrics: StudyMetrics): void {
  try {
    localStorage.setItem(KEYS.METRICS, JSON.stringify(metrics));
  } catch (e) {
    console.warn('Failed to save metrics to localStorage', e);
  }
}

export function loadSoundMuted(): boolean {
  try {
    return localStorage.getItem(KEYS.SOUND_MUTED) === 'true';
  } catch {
    return false;
  }
}

export function saveSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(KEYS.SOUND_MUTED, String(muted));
  } catch {}
}

/**
 * Export full application data backup as JSON
 */
export function exportAppData() {
  const data = {
    app: 'Study Planner & Academic AI Assistant',
    exportDate: new Date().toISOString(),
    tasks: loadStoredTasks(),
    routines: loadStoredRoutines(),
    timetable: loadStoredTimetable(),
    notes: loadStoredNotes(),
    research: loadStoredResearch(),
    metrics: loadStoredMetrics(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `study_planner_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Reset application data to initial rich portfolio state
 */
export function resetToSampleData() {
  saveStoredTasks(INITIAL_TASKS);
  saveStoredRoutines(INITIAL_ROUTINES);
  saveStoredTimetable(INITIAL_TIMETABLE_BLOCKS);
  saveStoredNotes(INITIAL_LECTURE_NOTES);
  saveStoredResearch(INITIAL_RESEARCH_ENTRIES);
}
