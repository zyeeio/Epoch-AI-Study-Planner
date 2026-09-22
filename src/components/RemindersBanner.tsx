import React, { useState, useEffect } from 'react';
import { Bell, Clock, CheckCircle2, ArrowRight, X, Volume2, Sparkles } from 'lucide-react';
import { Task, Routine, TimetableBlock } from '../types';
import { playAudioFeedback } from '../utils/audio';

interface RemindersBannerProps {
  tasks: Task[];
  routines: Routine[];
  timetableBlocks: TimetableBlock[];
  isMuted: boolean;
  onCompleteTask: (taskId: string) => void;
  onStartTimerForTask?: (task: Task) => void;
}

export const RemindersBanner: React.FC<RemindersBannerProps> = ({
  tasks,
  routines,
  timetableBlocks,
  isMuted,
  onCompleteTask,
  onStartTimerForTask,
}) => {
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTotalMins = currentHour * 60 + currentMinute;
  const todayStr = currentTime.toISOString().split('T')[0];

  // 1. Find urgent / high priority tasks due today
  const urgentTask = tasks.find(
    t => !t.completed && t.dueDate === todayStr && (t.priority === 'urgent' || t.priority === 'high') && !dismissed[`task-${t.id}`]
  );

  // 2. Find routine scheduled within next 30 minutes
  const upcomingRoutine = routines.find(r => {
    if (!r.reminderEnabled || dismissed[`routine-${r.id}`]) return false;
    const [h, m] = r.scheduledTime.split(':').map(Number);
    const routineMins = h * 60 + m;
    const diff = routineMins - currentTotalMins;
    return diff >= 0 && diff <= 45;
  });

  // 3. Find active or upcoming timetable block
  const activeBlock = timetableBlocks.find(b => {
    if (b.completed || dismissed[`block-${b.id}`]) return false;
    const [startH, startM] = b.startTime.split(':').map(Number);
    const [endH, endM] = b.endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    return currentTotalMins >= startMins && currentTotalMins <= endMins;
  });

  if (!urgentTask && !upcomingRoutine && !activeBlock) {
    return null;
  }

  return (
    <div className="w-full max-w-full overflow-hidden bg-linear-to-r from-amber-500/10 via-indigo-500/10 to-teal-500/10 border-b border-indigo-200/50 dark:border-indigo-900/50 px-3 sm:px-4 py-2 sm:py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>

          {activeBlock ? (
            <div className="min-w-0 flex-1 truncate">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Scheduled Study Block:
              </span>{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                {activeBlock.title} ({activeBlock.startTime} – {activeBlock.endTime})
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 ml-1.5">[{activeBlock.subject}]</span>
            </div>
          ) : urgentTask ? (
            <div className="min-w-0 flex-1 truncate">
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                High Priority Today:
              </span>{' '}
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {urgentTask.title}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 ml-1.5">~{urgentTask.estimatedMinutes}m est.</span>
            </div>
          ) : upcomingRoutine ? (
            <div className="min-w-0 flex-1 truncate">
              <span className="font-semibold text-teal-600 dark:text-teal-400">
                Upcoming Routine:
              </span>{' '}
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {upcomingRoutine.title} at {upcomingRoutine.scheduledTime}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 ml-1.5">({upcomingRoutine.streak}d streak 🔥)</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-end sm:self-auto">
          {urgentTask && onStartTimerForTask && (
            <button
              id="reminder-start-timer-btn"
              onClick={() => {
                playAudioFeedback('start', isMuted);
                onStartTimerForTask(urgentTask);
              }}
              className="px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center gap-1 shadow-xs"
            >
              <Clock className="w-3 h-3" />
              Focus Timer
            </button>
          )}

          {urgentTask && (
            <button
              id="reminder-complete-task-btn"
              onClick={() => {
                playAudioFeedback('complete', isMuted);
                onCompleteTask(urgentTask.id);
              }}
              className="px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition flex items-center gap-1 shadow-xs"
            >
              <CheckCircle2 className="w-3 h-3" />
              Mark Done
            </button>
          )}

          <button
            onClick={() => {
              if (activeBlock) setDismissed(prev => ({ ...prev, [`block-${activeBlock.id}`]: true }));
              else if (urgentTask) setDismissed(prev => ({ ...prev, [`task-${urgentTask.id}`]: true }));
              else if (upcomingRoutine) setDismissed(prev => ({ ...prev, [`routine-${upcomingRoutine.id}`]: true }));
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title="Dismiss reminder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
