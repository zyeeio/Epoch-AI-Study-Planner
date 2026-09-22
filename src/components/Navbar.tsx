import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Sparkles,
  Search,
  Flame,
  Volume2,
  VolumeX,
  Bell,
  Plus,
  GraduationCap,
  Clock,
  User as UserIcon,
  Cloud,
} from 'lucide-react';
import { StudyMetrics } from '../types';
import { requestNotificationPermission } from '../utils/audio';
import { User as FirebaseUser } from '../lib/firebase';

interface NavbarProps {
  activeTab: 'tasks' | 'timetable' | 'notes' | 'research';
  onTabChange: (tab: 'tasks' | 'timetable' | 'notes' | 'research') => void;
  metrics: StudyMetrics;
  isMuted: boolean;
  onToggleMute: () => void;
  onQuickAddTask: () => void;
  currentUser: FirebaseUser | null;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  metrics,
  isMuted,
  onToggleMute,
  onQuickAddTask,
  currentUser,
  onOpenAuthModal,
}) => {
  const [notificationActive, setNotificationActive] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const handleToggleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationActive(granted);
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white truncate">
                  StudyPlanner
                </span>
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5 sm:mr-1 text-indigo-500" />
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                Daily Tasks, Flexible Timetables &amp; Research
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold">
            <button
              id="nav-tasks-tab"
              onClick={() => onTabChange('tasks')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'tasks'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Tasks &amp; Routines
            </button>

            <button
              id="nav-timetable-tab"
              onClick={() => onTabChange('timetable')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'timetable'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Flexible Timetable
            </button>

            <button
              id="nav-notes-tab"
              onClick={() => onTabChange('notes')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'notes'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Lecture Notes AI
            </button>

            <button
              id="nav-research-tab"
              onClick={() => onTabChange('research')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'research'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Academic Research
            </button>
          </nav>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Streak Counter */}
            <div
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-bold shrink-0"
              title="Consecutive daily study streak"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{metrics.currentDayStreak}d</span>
            </div>

            {/* Notification alert toggle */}
            <button
              onClick={handleToggleNotifications}
              className={`p-1.5 sm:p-2 rounded-lg border transition shrink-0 ${
                notificationActive
                  ? 'border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600'
              }`}
              title={notificationActive ? 'Browser reminders active' : 'Enable browser notifications'}
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Sound toggle */}
            <button
              onClick={onToggleMute}
              className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition shrink-0"
              title={isMuted ? 'Unmute chimes' : 'Mute chimes'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Quick Add Task Button */}
            <button
              id="nav-quick-add-task-btn"
              onClick={onQuickAddTask}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Task</span>
            </button>

            {/* Cloud User Profile / Sign In Button */}
            <button
              id="nav-auth-profile-btn"
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-medium transition shrink-0 ${
                currentUser
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
              }`}
              title={currentUser ? `Signed in as ${currentUser.displayName || currentUser.email}` : 'Sign in to sync across devices'}
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full shrink-0"
                />
              ) : (
                <Cloud className={`w-3.5 h-3.5 shrink-0 ${currentUser ? 'text-emerald-600' : 'text-indigo-600'}`} />
              )}
              <span className="hidden sm:inline">
                {currentUser ? (currentUser.displayName?.split(' ')[0] || 'Account') : 'Sign In'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1.5 border-t border-slate-100 dark:border-slate-800/60 scrollbar-none text-xs w-full">
          <button
            onClick={() => onTabChange('tasks')}
            className={`px-3 py-1.5 min-h-[36px] rounded-xl font-semibold shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Tasks
          </button>
          <button
            onClick={() => onTabChange('timetable')}
            className={`px-3 py-1.5 min-h-[36px] rounded-xl font-semibold shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'timetable'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Timetable
          </button>
          <button
            onClick={() => onTabChange('notes')}
            className={`px-3 py-1.5 min-h-[36px] rounded-xl font-semibold shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Notes AI
          </button>
          <button
            onClick={() => onTabChange('research')}
            className={`px-3 py-1.5 min-h-[36px] rounded-xl font-semibold shrink-0 transition flex items-center gap-1.5 ${
              activeTab === 'research'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Research
          </button>
        </div>
      </div>
    </header>
  );
};
