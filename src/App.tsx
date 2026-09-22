/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RemindersBanner } from './components/RemindersBanner';
import { FocusTimerWidget } from './components/FocusTimerWidget';
import { DailyTasksView } from './components/DailyTasksView';
import { TimetableEngineView } from './components/TimetableEngineView';
import { LectureNotesAIView } from './components/LectureNotesAIView';
import { AcademicResearchView } from './components/AcademicResearchView';
import { AuthModal } from './components/AuthModal';

import {
  Task,
  Routine,
  TimetableBlock,
  LectureNote,
  AcademicResearchEntry,
  StudyMetrics,
} from './types';

import { auth, onAuthStateChanged, User as FirebaseUser } from './lib/firebase';
import {
  syncTasksToFirestore,
  deleteTaskFromFirestore,
  subscribeToFirestoreTasks,
  syncRoutinesToFirestore,
  subscribeToFirestoreRoutines,
  syncTimetableToFirestore,
  subscribeToFirestoreTimetable,
  syncNotesToFirestore,
  subscribeToFirestoreNotes,
} from './lib/firestoreSync';

import {
  loadStoredTasks,
  saveStoredTasks,
  loadStoredRoutines,
  saveStoredRoutines,
  loadStoredTimetable,
  saveStoredTimetable,
  loadStoredNotes,
  saveStoredNotes,
  loadStoredResearch,
  saveStoredResearch,
  loadStoredMetrics,
  saveStoredMetrics,
  loadSoundMuted,
  saveSoundMuted,
} from './utils/storage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [timetableBlocks, setTimetableBlocks] = useState<TimetableBlock[]>([]);
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [researchEntries, setResearchEntries] = useState<AcademicResearchEntry[]>([]);
  const [metrics, setMetrics] = useState<StudyMetrics>({
    totalMinutesStudied: 0,
    tasksCompleted: 0,
    routinesCompleted: 0,
    currentDayStreak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'tasks' | 'timetable' | 'notes' | 'research'>('tasks');
  const [activeTimerTask, setActiveTimerTask] = useState<Task | null>(null);

  // Cross-view research transfer
  const [researchTransfer, setResearchTransfer] = useState<{ query: string; subject: string } | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Initialize from storage on mount
  useEffect(() => {
    setTasks(loadStoredTasks());
    setRoutines(loadStoredRoutines());
    setTimetableBlocks(loadStoredTimetable());
    setNotes(loadStoredNotes());
    setResearchEntries(loadStoredResearch());
    setMetrics(loadStoredMetrics());
    setIsMuted(loadSoundMuted());
  }, []);

  // Set up real-time Firebase listeners when user is logged in
  useEffect(() => {
    if (!currentUser) return;
    const unsubTasks = subscribeToFirestoreTasks(currentUser.uid, fireTasks => {
      if (fireTasks.length > 0) {
        setTasks(fireTasks);
        saveStoredTasks(fireTasks);
      }
    });

    const unsubRoutines = subscribeToFirestoreRoutines(currentUser.uid, fireRoutines => {
      if (fireRoutines.length > 0) {
        setRoutines(fireRoutines);
        saveStoredRoutines(fireRoutines);
      }
    });

    const unsubTimetable = subscribeToFirestoreTimetable(currentUser.uid, fireBlocks => {
      if (fireBlocks.length > 0) {
        setTimetableBlocks(fireBlocks);
        saveStoredTimetable(fireBlocks);
      }
    });

    const unsubNotes = subscribeToFirestoreNotes(currentUser.uid, fireNotes => {
      if (fireNotes.length > 0) {
        setNotes(fireNotes);
        saveStoredNotes(fireNotes);
      }
    });

    return () => {
      unsubTasks();
      unsubRoutines();
      unsubTimetable();
      unsubNotes();
    };
  }, [currentUser]);

  // Sync state mutations to storage and Firestore
  const handleUpdateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    saveStoredTasks(newTasks);
    if (currentUser) {
      syncTasksToFirestore(currentUser.uid, newTasks);
    }
  };

  const handleUpdateRoutines = (newRoutines: Routine[]) => {
    setRoutines(newRoutines);
    saveStoredRoutines(newRoutines);
    if (currentUser) {
      syncRoutinesToFirestore(currentUser.uid, newRoutines);
    }
  };

  const handleUpdateTimetable = (newBlocks: TimetableBlock[]) => {
    setTimetableBlocks(newBlocks);
    saveStoredTimetable(newBlocks);
    if (currentUser) {
      syncTimetableToFirestore(currentUser.uid, newBlocks);
    }
  };

  const handleUpdateNotes = (newNotes: LectureNote[]) => {
    setNotes(newNotes);
    saveStoredNotes(newNotes);
    if (currentUser) {
      syncNotesToFirestore(currentUser.uid, newNotes);
    }
  };

  const handleUpdateResearch = (newResearch: AcademicResearchEntry[]) => {
    setResearchEntries(newResearch);
    saveStoredResearch(newResearch);
  };

  const handleUpdateMetrics = (updater: (prev: StudyMetrics) => StudyMetrics) => {
    setMetrics(prev => {
      const updated = updater(prev);
      saveStoredMetrics(updated);
      return updated;
    });
  };

  // Task actions
  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextState = !t.completed;
        if (nextState) {
          handleUpdateMetrics(m => ({ ...m, tasksCompleted: m.tasksCompleted + 1 }));
        }
        return {
          ...t,
          completed: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });
    handleUpdateTasks(updated);
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      completed: false,
    };
    handleUpdateTasks([newTask, ...tasks]);
  };

  const handleUpdateSingleTask = (updatedTask: Task) => {
    const updated = tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
    handleUpdateTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    handleUpdateTasks(tasks.filter(t => t.id !== taskId));
    if (currentUser) {
      deleteTaskFromFirestore(currentUser.uid, taskId);
    }
    if (activeTimerTask?.id === taskId) {
      setActiveTimerTask(null);
    }
  };

  // Routine check-in
  const handleToggleRoutineCheckIn = (routineId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = routines.map(r => {
      if (r.id === routineId) {
        const isDoneToday = r.lastCompletedDate === todayStr;
        return {
          ...r,
          streak: isDoneToday ? Math.max(0, r.streak - 1) : r.streak + 1,
          lastCompletedDate: isDoneToday ? undefined : todayStr,
        };
      }
      return r;
    });
    handleUpdateRoutines(updated);
    handleUpdateMetrics(m => ({ ...m, routinesCompleted: m.routinesCompleted + 1 }));
  };

  // Timetable block toggle
  const handleToggleBlockComplete = (blockId: string) => {
    const updated = timetableBlocks.map(b => {
      if (b.id === blockId) {
        const nextState = !b.completed;
        if (nextState) {
          handleUpdateMetrics(m => ({ ...m, totalMinutesStudied: m.totalMinutesStudied + 45 }));
        }
        return { ...b, completed: nextState };
      }
      return b;
    });
    handleUpdateTimetable(updated);
  };

  // Focus timer completion
  const handleSessionComplete = (minutesStudied: number, task?: Task) => {
    handleUpdateMetrics(m => ({
      ...m,
      totalMinutesStudied: m.totalMinutesStudied + minutesStudied,
    }));
    if (task) {
      handleToggleTask(task.id);
    }
  };

  // Cross-view navigation helpers
  const handleSendToResearch = (query: string, subject: string) => {
    setResearchTransfer({ query, subject });
    setActiveTab('research');
  };

  const handleSendToNotes = (title: string, subject: string, content: string) => {
    const newNote: LectureNote = {
      id: `note-${Date.now()}`,
      title: `Research: ${title}`,
      subject,
      date: new Date().toISOString().split('T')[0],
      rawContent: content,
      summary: content,
      tags: [subject, 'Research'],
      lastUpdated: new Date().toISOString(),
    };
    handleUpdateNotes([newNote, ...notes]);
    setActiveTab('notes');
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    saveSoundMuted(nextMuted);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Smart Reminders Banner */}
      <RemindersBanner
        tasks={tasks}
        routines={routines}
        timetableBlocks={timetableBlocks}
        isMuted={isMuted}
        onCompleteTask={handleToggleTask}
        onStartTimerForTask={task => {
          setActiveTimerTask(task);
          setActiveTab('tasks');
        }}
      />

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={tab => {
          setActiveTab(tab);
          if (tab !== 'research') setResearchTransfer(null);
        }}
        metrics={metrics}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onQuickAddTask={() => {
          setActiveTab('tasks');
          // Focus or open add task
          const el = document.getElementById('add-new-task-trigger-btn');
          el?.click();
        }}
        currentUser={currentUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">
          {/* Main Workspace Column */}
          <div className="lg:col-span-8 space-y-6 min-w-0 w-full">
            {activeTab === 'tasks' && (
              <DailyTasksView
                tasks={tasks}
                routines={routines}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateSingleTask}
                onDeleteTask={handleDeleteTask}
                onToggleRoutineCheckIn={handleToggleRoutineCheckIn}
                onStartFocusForTask={task => setActiveTimerTask(task)}
                isMuted={isMuted}
              />
            )}

            {activeTab === 'timetable' && (
              <TimetableEngineView
                blocks={timetableBlocks}
                tasks={tasks}
                routines={routines}
                onUpdateBlocks={handleUpdateTimetable}
                onToggleBlockComplete={handleToggleBlockComplete}
                onStartFocusForTask={task => {
                  setActiveTimerTask(task);
                  setActiveTab('tasks');
                }}
                isMuted={isMuted}
              />
            )}

            {activeTab === 'notes' && (
              <LectureNotesAIView
                notes={notes}
                onUpdateNotes={handleUpdateNotes}
                onSendToResearch={handleSendToResearch}
                isMuted={isMuted}
              />
            )}

            {activeTab === 'research' && (
              <AcademicResearchView
                researchEntries={researchEntries}
                onSaveEntry={entry => handleUpdateResearch([entry, ...researchEntries])}
                onSendToNotes={handleSendToNotes}
                initialQuery={researchTransfer?.query}
                initialSubject={researchTransfer?.subject}
                isMuted={isMuted}
              />
            )}
          </div>

          {/* Sidebar Column: Persistent Focus Timer & Academic Metrics */}
          <div className="lg:col-span-4 space-y-6 min-w-0 w-full">
            {/* Focus Timer Widget */}
            <FocusTimerWidget
              activeTask={activeTimerTask}
              onClearActiveTask={() => setActiveTimerTask(null)}
              onSessionComplete={handleSessionComplete}
              isMuted={isMuted}
            />

            {/* Daily Academic Progress Summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Today's Academic Progress
              </span>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                    {metrics.totalMinutesStudied}m
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Focus Minutes</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {metrics.tasksCompleted}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Tasks Finished</p>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Routines Kept:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {metrics.routinesCompleted} checks
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Cloud Account / Login / Delete Account Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onDeleteSuccess={() => {
          // Reset locally to clean state
          localStorage.clear();
          window.location.reload();
        }}
      />
    </div>
  );
}
